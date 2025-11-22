// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./CasinoPaymentProcessor.sol";

contract Blackjack is ReentrancyGuard {
    CasinoPaymentProcessor public paymentProcessor;
    address public owner;
    
    enum GameState { WAITING, ACTIVE, COMPLETED }
    enum Action { HIT, STAND, DOUBLE, SPLIT }
    
    struct Game {
        address player;
        uint256 betAmount;
        GameState state;
        bytes32[] playerCards;
        bytes32[] dealerCards;
        uint256 playerTotal;
        uint256 dealerTotal;
        bool dealerRevealed;
        uint256 startTime;
    }
    
    mapping(address => Game) public activeGames;
    mapping(address => uint256) public playerWins;
    mapping(address => uint256) public playerLosses;
    uint256 public totalGames;
    
    event GameStarted(address indexed player, uint256 betAmount, uint256 gameId);
    event CardDealt(address indexed player, bytes32 card, bool isPlayerCard);
    event GameCompleted(address indexed player, bool playerWon, uint256 payout, uint256 dealerTotal, uint256 playerTotal);
    event ActionTaken(address indexed player, Action action);

    constructor(address _paymentProcessor) {
        paymentProcessor = CasinoPaymentProcessor(_paymentProcessor);
        owner = msg.sender;
    }

    function startGame() external payable nonReentrant {
        require(msg.value > 0, "Bet amount must be positive");
        require(activeGames[msg.sender].state == GameState.WAITING, "Game already in progress");
        
        // Process payment
        (bool success, ) = address(paymentProcessor).call{value: msg.value}(
            abi.encodeWithSignature("processMaticPayment(address)", address(this))
        );
        require(success, "Payment processing failed");

        // Initialize game
        Game storage game = activeGames[msg.sender];
        game.player = msg.sender;
        game.betAmount = msg.value;
        game.state = GameState.ACTIVE;
        game.startTime = block.timestamp;
        
        // Deal initial cards
        game.playerCards.push(drawCard());
        game.dealerCards.push(drawCard());
        game.playerCards.push(drawCard());
        game.dealerCards.push(bytes32(0)); // Hidden card
        
        // Calculate initial total
        game.playerTotal = calculateHandValue(game.playerCards);
        
        totalGames++;
        emit GameStarted(msg.sender, msg.value, totalGames);
    }

    function takeAction(Action action) external nonReentrant {
        Game storage game = activeGames[msg.sender];
        require(game.state == GameState.ACTIVE, "No active game");
        require(game.player == msg.sender, "Not your game");
        
        emit ActionTaken(msg.sender, action);
        
        if (action == Action.HIT) {
            game.playerCards.push(drawCard());
            game.playerTotal = calculateHandValue(game.playerCards);
            
            if (game.playerTotal > 21) {
                _endGame(false);
            }
        } 
        else if (action == Action.STAND) {
            _dealerPlay();
            _endGame(_determineWinner());
        }
        else if (action == Action.DOUBLE) {
            require(game.playerCards.length == 2, "Can only double on first action");
            
            // Process additional bet
            (bool success, ) = address(paymentProcessor).call{value: game.betAmount}(
                abi.encodeWithSignature("processMaticPayment(address)", address(this))
            );
            require(success, "Payment processing failed");
            
            game.betAmount *= 2;
            game.playerCards.push(drawCard());
            game.playerTotal = calculateHandValue(game.playerCards);
            
            if (game.playerTotal > 21) {
                _endGame(false);
            } else {
                _dealerPlay();
                _endGame(_determineWinner());
            }
        }
    }

    function _dealerPlay() internal {
        Game storage game = activeGames[msg.sender];
        
        // Reveal dealer's hidden card
        game.dealerCards[1] = drawCard();
        game.dealerRevealed = true;
        game.dealerTotal = calculateHandValue(game.dealerCards);
        
        // Dealer hits on 16 or less, stands on 17 or more
        while (game.dealerTotal < 17) {
            game.dealerCards.push(drawCard());
            game.dealerTotal = calculateHandValue(game.dealerCards);
        }
    }

    function _determineWinner() internal view returns (bool) {
        Game storage game = activeGames[msg.sender];
        
        if (game.playerTotal > 21) return false; // Player busts
        if (game.dealerTotal > 21) return true;  // Dealer busts
        if (game.playerTotal > game.dealerTotal) return true; // Player has higher total
        if (game.playerTotal < game.dealerTotal) return false; // Dealer has higher total
        
        // Push (tie) - player doesn't win but gets bet back
        return false;
    }

    function _endGame(bool playerWon) internal {
        Game storage game = activeGames[msg.sender];
        game.state = GameState.COMPLETED;
        
        uint256 payout = 0;
        if (playerWon) {
            // Blackjack pays 3:2, normal win pays 1:1
            if (game.playerCards.length == 2 && game.playerTotal == 21) {
                payout = (game.betAmount * 3) / 2;
            } else {
                payout = game.betAmount * 2;
            }
            playerWins[msg.sender]++;
        } else {
            // Check for push (tie)
            if (game.playerTotal == game.dealerTotal && game.playerTotal <= 21) {
                payout = game.betAmount; // Return bet
            }
            playerLosses[msg.sender]++;
        }
        
        if (payout > 0) {
            payable(msg.sender).transfer(payout);
        }
        
        emit GameCompleted(msg.sender, playerWon, payout, game.dealerTotal, game.playerTotal);
        
        // Reset game
        delete activeGames[msg.sender];
    }

    function drawCard() internal view returns (bytes32) {
        // Simple card generation (use Chainlink VRF in production)
        return keccak256(abi.encodePacked(
            block.timestamp, 
            block.difficulty, 
            msg.sender, 
            totalGames,
            keccak256(abi.encodePacked("card"))
        ));
    }

    function calculateHandValue(bytes32[] memory cards) public pure returns (uint256) {
        uint256 total = 0;
        uint8 aces = 0;
        
        for (uint i = 0; i < cards.length; i++) {
            if (cards[i] == bytes32(0)) continue; // Skip hidden cards
            
            uint8 cardValue = uint8(uint256(cards[i]) % 13) + 1;
            
            if (cardValue == 1) {
                // Ace
                aces++;
                total += 11;
            } else if (cardValue >= 10) {
                // Face card
                total += 10;
            } else {
                total += cardValue;
            }
        }
        
        // Adjust for aces
        while (total > 21 && aces > 0) {
            total -= 10;
            aces--;
        }
        
        return total;
    }

    function getCardValue(bytes32 card) public pure returns (string memory) {
        if (card == bytes32(0)) return "HIDDEN";
        
        uint8 value = uint8(uint256(card) % 13) + 1;
        
        if (value == 1) return "A";
        if (value == 11) return "J";
        if (value == 12) return "Q";
        if (value == 13) return "K";
        return toString(value);
    }

    function getCardSuit(bytes32 card) public pure returns (string memory) {
        if (card == bytes32(0)) return "";
        
        uint8 suit = uint8(uint256(card) >> 8) % 4;
        
        // Return suit abbreviations instead of Unicode symbols
        if (suit == 0) return "S"; // Spades
        if (suit == 1) return "H"; // Hearts
        if (suit == 2) return "D"; // Diamonds
        if (suit == 3) return "C"; // Clubs
        return "?";
    }

    function getCardDisplay(bytes32 card) public pure returns (string memory) {
        if (card == bytes32(0)) return "HIDDEN";
        
        string memory value = getCardValue(card);
        string memory suit = getCardSuit(card);
        
        return string(abi.encodePacked(value, suit));
    }

    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        
        return string(buffer);
    }

    function getGameState(address player) external view returns (
        uint256 betAmount,
        uint256 playerTotal,
        uint256 dealerTotal,
        bool dealerRevealed,
        uint8 playerCardCount,
        uint8 dealerCardCount,
        GameState state
    ) {
        Game storage game = activeGames[player];
        return (
            game.betAmount,
            game.playerTotal,
            game.dealerRevealed ? game.dealerTotal : 0,
            game.dealerRevealed,
            uint8(game.playerCards.length),
            uint8(game.dealerCards.length),
            game.state
        );
    }

    function getPlayerCards(address player) external view returns (bytes32[] memory) {
        return activeGames[player].playerCards;
    }

    function getDealerCards(address player) external view returns (bytes32[] memory) {
        return activeGames[player].dealerCards;
    }
}
