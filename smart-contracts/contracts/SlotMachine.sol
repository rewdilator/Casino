// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./CasinoPaymentProcessor.sol";

contract SlotMachine is ReentrancyGuard {
    CasinoPaymentProcessor public paymentProcessor;
    address public owner;
    
    // Slot symbols (represented as numbers)
    uint8 constant CHERRY = 0;
    uint8 constant LEMON = 1;
    uint8 constant ORANGE = 2;
    uint8 constant BELL = 3;
    uint8 constant STAR = 4;
    uint8 constant DIAMOND = 5;
    uint8 constant SEVEN = 6;
    
    // Payout multipliers (in basis points, 10000 = 1x)
    mapping(uint8 => uint256) public symbolPayouts;
    
    // Game statistics
    mapping(address => uint256) public playerSpins;
    mapping(address => uint256) public playerWinnings;
    uint256 public totalSpins;
    uint256 public totalPayouts;
    uint256 public jackpot;
    
    event SlotSpin(
        address indexed player,
        uint256 betAmount,
        uint8[3] reels,
        uint256 payout,
        uint256 timestamp
    );
    
    event JackpotWin(
        address indexed player,
        uint256 amount,
        uint256 timestamp
    );

    constructor(address _paymentProcessor) {
        paymentProcessor = CasinoPaymentProcessor(_paymentProcessor);
        owner = msg.sender;
        
        // Initialize payout multipliers
        symbolPayouts[CHERRY] = 500;  // 5x
        symbolPayouts[LEMON] = 1000;  // 10x
        symbolPayouts[ORANGE] = 1500; // 15x
        symbolPayouts[BELL] = 5000;   // 50x
        symbolPayouts[STAR] = 10000;  // 100x
        symbolPayouts[DIAMOND] = 25000; // 250x
        symbolPayouts[SEVEN] = 100000; // 1000x
        
        // Initialize jackpot
        jackpot = 0;
    }

    function spin(uint256 betAmount) external payable nonReentrant {
        require(betAmount > 0, "Bet amount must be positive");
        require(msg.value == betAmount, "Incorrect bet amount");
        
        // Process payment
        (bool success, ) = address(paymentProcessor).call{value: msg.value}(
            abi.encodeWithSignature("processMaticPayment(address)", address(this))
        );
        require(success, "Payment processing failed");

        // Generate random reels (in production, use Chainlink VRF)
        uint8[3] memory reels = generateReels();
        
        // Calculate payout
        uint256 payout = calculatePayout(reels, betAmount);
        
        // Update statistics
        playerSpins[msg.sender]++;
        totalSpins++;
        
        if (payout > 0) {
            playerWinnings[msg.sender] += payout;
            totalPayouts += payout;
            
            // Check for jackpot
            if (payout >= betAmount * 1000) { // 1000x or more
                jackpot = 0;
                emit JackpotWin(msg.sender, payout, block.timestamp);
            } else {
                // Add to jackpot (1% of bet)
                jackpot += betAmount / 100;
            }
            
            // Transfer winnings
            payable(msg.sender).transfer(payout);
        } else {
            // Add to jackpot (1% of bet)
            jackpot += betAmount / 100;
        }
        
        emit SlotSpin(msg.sender, betAmount, reels, payout, block.timestamp);
    }

    function generateReels() internal view returns (uint8[3] memory) {
        // Simple pseudo-random generation (use Chainlink VRF in production)
        uint8[3] memory reels;
        bytes32 randomHash = keccak256(abi.encodePacked(
            block.timestamp, 
            block.prevrandao, // Replaced block.difficulty
            msg.sender, 
            totalSpins
        ));
        
        for (uint i = 0; i < 3; i++) {
            reels[i] = uint8(uint256(randomHash) >> (i * 8)) % 7;
        }
        
        return reels;
    }

    function calculatePayout(uint8[3] memory reels, uint256 betAmount) internal view returns (uint256) {
        // Check for three of a kind
        if (reels[0] == reels[1] && reels[1] == reels[2]) {
            return (betAmount * symbolPayouts[reels[0]]) / 100;
        }
        
        // Check for two of a kind (first two reels)
        if (reels[0] == reels[1]) {
            return (betAmount * 200) / 100; // 2x payout
        }
        
        // Check for any seven
        for (uint i = 0; i < 3; i++) {
            if (reels[i] == SEVEN) {
                return (betAmount * 100) / 100; // 1x payout per seven
            }
        }
        
        return 0;
    }

    function getSymbolName(uint8 symbol) public pure returns (string memory) {
        if (symbol == CHERRY) return "CHERRY";
        if (symbol == LEMON) return "LEMON";
        if (symbol == ORANGE) return "ORANGE";
        if (symbol == BELL) return "BELL";
        if (symbol == STAR) return "STAR";
        if (symbol == DIAMOND) return "DIAMOND";
        if (symbol == SEVEN) return "SEVEN";
        return "UNKNOWN";
    }

    function getPlayerStats(address player) external view returns (
        uint256 spins,
        uint256 winnings,
        uint256 profit
    ) {
        spins = playerSpins[player];
        winnings = playerWinnings[player];
        profit = winnings > 0 ? winnings - (spins * 0.01 ether) : 0; // Assuming 0.01 ETH average bet
    }

    // Admin function to fund jackpot
    function fundJackpot() external payable onlyOwner {
        jackpot += msg.value;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
}
