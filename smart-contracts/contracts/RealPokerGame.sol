// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./CasinoPaymentProcessor.sol";

contract RealPokerGame is ReentrancyGuard {
    CasinoPaymentProcessor public paymentProcessor;
    address public owner;
    
    enum GameState { WAITING, ACTIVE, COMPLETED, CANCELLED }
    enum PlayerAction { FOLD, CHECK, CALL, RAISE, ALL_IN }
    
    struct Player {
        address wallet;
        uint256 balance;
        bool hasFolded;
        bool isAllIn;
        uint256 lastActionTime;
        bytes32[] hand;
    }
    
    struct GameSession {
        bytes32 gameId;
        address[] players;
        uint256 buyIn;
        uint256 pot;
        GameState state;
        uint256 startTime;
        uint256 maxPlayers;
        address currentPlayer;
        uint256 currentBet;
        uint256 dealerPosition;
        uint256 smallBlind;
        uint256 bigBlind;
        bytes32[] communityCards;
        mapping(address => Player) playerInfo;
    }
    
    mapping(bytes32 => GameSession) public games;
    mapping(address => uint256) public playerWinnings;
    mapping(address => uint256) public gamesPlayed;
    
    event GameCreated(bytes32 indexed gameId, address creator, uint256 buyIn, uint256 maxPlayers);
    event PlayerJoined(bytes32 indexed gameId, address player, uint256 amount);
    event PlayerActionTaken(bytes32 indexed gameId, address player, PlayerAction action, uint256 amount);
    event GameCompleted(bytes32 indexed gameId, address winner, uint256 prize);
    event CardsDealt(bytes32 indexed gameId, address player, bytes32[] cards);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier gameExists(bytes32 gameId) {
        require(games[gameId].players.length > 0, "Game does not exist");
        _;
    }

    constructor(address _paymentProcessor) {
        paymentProcessor = CasinoPaymentProcessor(_paymentProcessor);
        owner = msg.sender;
    }

    function createGame(
        bytes32 gameId, 
        uint256 buyIn, 
        uint256 maxPlayers,
        uint256 smallBlind,
        uint256 bigBlind
    ) external payable nonReentrant {
        require(games[gameId].players.length == 0, "Game already exists");
        require(buyIn > 0, "Buy-in must be positive");
        require(maxPlayers >= 2 && maxPlayers <= 9, "Invalid player count");
        require(msg.value == buyIn, "Incorrect buy-in amount");
        require(bigBlind > smallBlind && smallBlind > 0, "Invalid blind structure");

        // Process payment
        (bool success, ) = address(paymentProcessor).call{value: msg.value}(
            abi.encodeWithSignature("processMaticPayment(address)", address(this))
        );
        require(success, "Payment processing failed");

        address[] memory players = new address[](1);
        players[0] = msg.sender;

        GameSession storage newGame = games[gameId];
        newGame.gameId = gameId;
        newGame.players = players;
        newGame.buyIn = buyIn;
        newGame.pot = buyIn;
        newGame.state = GameState.WAITING;
        newGame.startTime = block.timestamp;
        newGame.maxPlayers = maxPlayers;
        newGame.smallBlind = smallBlind;
        newGame.bigBlind = bigBlind;
        newGame.dealerPosition = 0;
        
        // Initialize player
        newGame.playerInfo[msg.sender] = Player({
            wallet: msg.sender,
            balance: buyIn,
            hasFolded: false,
            isAllIn: false,
            lastActionTime: block.timestamp,
            hand: new bytes32[](0)
        });

        gamesPlayed[msg.sender]++;
        emit GameCreated(gameId, msg.sender, buyIn, maxPlayers);
    }

    function joinGame(bytes32 gameId) external payable nonReentrant gameExists(gameId) {
        GameSession storage game = games[gameId];
        
        require(game.state == GameState.WAITING, "Game not accepting players");
        require(game.players.length < game.maxPlayers, "Game full");
        require(msg.value == game.buyIn, "Incorrect buy-in amount");
        
        // Check if player already joined
        for (uint i = 0; i < game.players.length; i++) {
            require(game.players[i] != msg.sender, "Already joined");
        }

        // Process payment
        (bool success, ) = address(paymentProcessor).call{value: msg.value}(
            abi.encodeWithSignature("processMaticPayment(address)", address(this))
        );
        require(success, "Payment processing failed");

        game.players.push(msg.sender);
        game.pot += msg.value;
        
        // Initialize player
        game.playerInfo[msg.sender] = Player({
            wallet: msg.sender,
            balance: msg.value,
            hasFolded: false,
            isAllIn: false,
            lastActionTime: block.timestamp,
            hand: new bytes32[](0)
        });

        gamesPlayed[msg.sender]++;
        emit PlayerJoined(gameId, msg.sender, msg.value);

        // Start game if full
        if (game.players.length == game.maxPlayers) {
            _startGame(gameId);
        }
    }

    function takeAction(
        bytes32 gameId, 
        PlayerAction action, 
        uint256 raiseAmount
    ) external payable gameExists(gameId) {
        GameSession storage game = games[gameId];
        require(game.state == GameState.ACTIVE, "Game not active");
        require(game.currentPlayer == msg.sender, "Not your turn");
        require(!game.playerInfo[msg.sender].hasFolded, "Player has folded");
        require(!game.playerInfo[msg.sender].isAllIn, "Player is all-in");

        Player storage player = game.playerInfo[msg.sender];
        
        if (action == PlayerAction.FOLD) {
            player.hasFolded = true;
        } 
        else if (action == PlayerAction.CALL) {
            require(player.balance >= game.currentBet, "Insufficient balance to call");
            uint256 callAmount = game.currentBet;
            player.balance -= callAmount;
            game.pot += callAmount;
        }
        else if (action == PlayerAction.RAISE) {
            require(raiseAmount > game.currentBet, "Raise must be higher than current bet");
            require(player.balance >= raiseAmount, "Insufficient balance to raise");
            player.balance -= raiseAmount;
            game.pot += raiseAmount;
            game.currentBet = raiseAmount;
        }
        else if (action == PlayerAction.ALL_IN) {
            uint256 allInAmount = player.balance;
            player.balance = 0;
            game.pot += allInAmount;
            player.isAllIn = true;
            if (allInAmount > game.currentBet) {
                game.currentBet = allInAmount;
            }
        }

        player.lastActionTime = block.timestamp;
        emit PlayerActionTaken(gameId, msg.sender, action, raiseAmount);
        
        _nextPlayer(gameId);
    }

    function _startGame(bytes32 gameId) internal {
        GameSession storage game = games[gameId];
        game.state = GameState.ACTIVE;
        game.currentPlayer = game.players[0];
        
        // Deal initial cards (simplified - in production use Chainlink VRF)
        for (uint i = 0; i < game.players.length; i++) {
            bytes32[] memory hand = new bytes32[](2);
            hand[0] = keccak256(abi.encodePacked(block.timestamp, game.players[i], "card1"));
            hand[1] = keccak256(abi.encodePacked(block.timestamp, game.players[i], "card2"));
            game.playerInfo[game.players[i]].hand = hand;
            emit CardsDealt(gameId, game.players[i], hand);
        }
    }

    function _nextPlayer(bytes32 gameId) internal {
        GameSession storage game = games[gameId];
        uint256 currentIndex = _getPlayerIndex(gameId, game.currentPlayer);
        uint256 nextIndex = (currentIndex + 1) % game.players.length;
        game.currentPlayer = game.players[nextIndex];
    }

    function _getPlayerIndex(bytes32 gameId, address player) internal view returns (uint256) {
        GameSession storage game = games[gameId];
        for (uint i = 0; i < game.players.length; i++) {
            if (game.players[i] == player) {
                return i;
            }
        }
        revert("Player not found in game");
    }

    function completeGame(bytes32 gameId, address winner) external gameExists(gameId) onlyOwner {
        GameSession storage game = games[gameId];
        require(game.state == GameState.ACTIVE, "Game not active");
        require(_isPlayerInGame(gameId, winner), "Winner not in game");

        game.state = GameState.COMPLETED;
        playerWinnings[winner] += game.pot;
        emit GameCompleted(gameId, winner, game.pot);
    }

    function claimWinnings() external nonReentrant {
        uint256 winnings = playerWinnings[msg.sender];
        require(winnings > 0, "No winnings to claim");
        
        playerWinnings[msg.sender] = 0;
        payable(msg.sender).transfer(winnings);
    }

    function _isPlayerInGame(bytes32 gameId, address player) internal view returns (bool) {
        GameSession storage game = games[gameId];
        for (uint i = 0; i < game.players.length; i++) {
            if (game.players[i] == player) {
                return true;
            }
        }
        return false;
    }

    function getGameInfo(bytes32 gameId) external view returns (
        address[] memory players,
        uint256 buyIn,
        uint256 pot,
        uint256 state,
        uint256 startTime,
        uint256 maxPlayers,
        address currentPlayer,
        uint256 currentBet
    ) {
        GameSession storage game = games[gameId];
        return (
            game.players,
            game.buyIn,
            game.pot,
            uint256(game.state),
            game.startTime,
            game.maxPlayers,
            game.currentPlayer,
            game.currentBet
        );
    }

    function getPlayerInfo(bytes32 gameId, address player) external view returns (
        uint256 balance,
        bool hasFolded,
        bool isAllIn,
        bytes32[] memory hand
    ) {
        GameSession storage game = games[gameId];
        Player storage playerInfo = game.playerInfo[player];
        return (
            playerInfo.balance,
            playerInfo.hasFolded,
            playerInfo.isAllIn,
            playerInfo.hand
        );
    }
}