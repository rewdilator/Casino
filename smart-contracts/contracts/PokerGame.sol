// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./CasinoPaymentProcessor.sol";

/**
 * @title PokerGame
 * @dev Texas Hold'em poker game with Polygon integration
 */
contract PokerGame is ReentrancyGuard {
    CasinoPaymentProcessor public paymentProcessor;
    address public owner;
    
    enum GameState { WAITING, ACTIVE, COMPLETED, CANCELLED }
    
    struct GameSession {
        address[] players;
        uint256 buyIn;
        uint256 pot;
        GameState state;
        uint256 startTime;
        uint256 maxPlayers;
        address winner;
        bytes32 gameId;
    }
    
    mapping(bytes32 => GameSession) public games;
    mapping(address => uint256) public playerWinnings;
    mapping(address => uint256) public gamesPlayed;
    
    event GameCreated(bytes32 indexed gameId, address creator, uint256 buyIn, uint256 maxPlayers);
    event PlayerJoined(bytes32 indexed gameId, address player, uint256 amount);
    event GameCompleted(bytes32 indexed gameId, address winner, uint256 prize);
    event GameCancelled(bytes32 indexed gameId, address cancelledBy);
    event WinningsClaimed(address indexed player, uint256 amount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier gameExists(bytes32 gameId) {
        require(games[gameId].players.length > 0, "Game does not exist");
        _;
    }

    modifier validGameState(bytes32 gameId, GameState requiredState) {
        require(games[gameId].state == requiredState, "Invalid game state");
        _;
    }

    constructor(address _paymentProcessor) {
        paymentProcessor = CasinoPaymentProcessor(_paymentProcessor);
        owner = msg.sender;
    }

    function createGame(
        bytes32 gameId, 
        uint256 buyIn, 
        uint256 maxPlayers
    ) external payable nonReentrant {
        require(games[gameId].players.length == 0, "Game already exists");
        require(buyIn > 0, "Buy-in must be positive");
        require(maxPlayers >= 2 && maxPlayers <= 10, "Invalid player count");
        require(msg.value == buyIn, "Incorrect buy-in amount");

        // Process payment through payment processor
        (bool success, ) = address(paymentProcessor).call{value: msg.value}(
            abi.encodeWithSignature("processMaticPayment(address)", address(this))
        );
        require(success, "Payment processing failed");

        address[] memory players = new address[](1);
        players[0] = msg.sender;

        games[gameId] = GameSession({
            players: players,
            buyIn: buyIn,
            pot: buyIn,
            state: GameState.WAITING,
            startTime: block.timestamp,
            maxPlayers: maxPlayers,
            winner: address(0),
            gameId: gameId
        });

        gamesPlayed[msg.sender]++;

        emit GameCreated(gameId, msg.sender, buyIn, maxPlayers);
    }

    function joinGame(bytes32 gameId) external payable nonReentrant gameExists(gameId) validGameState(gameId, GameState.WAITING) {
        GameSession storage game = games[gameId];
        
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
        gamesPlayed[msg.sender]++;

        emit PlayerJoined(gameId, msg.sender, msg.value);

        // Start game if full
        if (game.players.length == game.maxPlayers) {
            game.state = GameState.ACTIVE;
        }
    }

    function completeGame(bytes32 gameId, address winner) external gameExists(gameId) validGameState(gameId, GameState.ACTIVE) onlyOwner {
        GameSession storage game = games[gameId];
        
        require(isPlayerInGame(gameId, winner), "Winner not in game");

        game.state = GameState.COMPLETED;
        game.winner = winner;
        
        // Record winnings
        playerWinnings[winner] += game.pot;

        emit GameCompleted(gameId, winner, game.pot);
    }

    function cancelGame(bytes32 gameId) external gameExists(gameId) validGameState(gameId, GameState.WAITING) onlyOwner {
        GameSession storage game = games[gameId];
        game.state = GameState.CANCELLED;
        
        emit GameCancelled(gameId, msg.sender);
    }

    function claimWinnings() external nonReentrant {
        uint256 winnings = playerWinnings[msg.sender];
        require(winnings > 0, "No winnings to claim");
        
        playerWinnings[msg.sender] = 0;
        
        // Transfer winnings - in production this would come from escrow
        payable(msg.sender).transfer(winnings);
        
        emit WinningsClaimed(msg.sender, winnings);
    }

    function isPlayerInGame(bytes32 gameId, address player) public view gameExists(gameId) returns (bool) {
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
        address winner
    ) {
        GameSession storage game = games[gameId];
        return (
            game.players,
            game.buyIn,
            game.pot,
            uint256(game.state),
            game.startTime,
            game.maxPlayers,
            game.winner
        );
    }

    function getPlayerWinnings(address player) external view returns (uint256) {
        return playerWinnings[player];
    }

    function getGamesPlayed(address player) external view returns (uint256) {
        return gamesPlayed[player];
    }

    function getActiveGames() external view returns (bytes32[] memory) {
        // This is a simplified implementation
        // In production, you'd maintain a separate array of active games
        bytes32[] memory activeGames = new bytes32[](10); // Max return
        uint256 count = 0;
        
        // Note: This is inefficient for production - use events or separate tracking
        for (uint i = 0; i < 10; i++) {
            bytes32 potentialGameId = bytes32(i);
            if (games[potentialGameId].players.length > 0 && 
                games[potentialGameId].state == GameState.WAITING) {
                activeGames[count] = potentialGameId;
                count++;
            }
        }
        
        return activeGames;
    }
}