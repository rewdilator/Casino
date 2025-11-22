// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./CasinoPaymentProcessor.sol";

contract SlotMachine is ReentrancyGuard {
    CasinoPaymentProcessor public paymentProcessor;
    address public owner;
    
    uint256 public jackpot;
    
    // Game statistics
    mapping(address => uint256) public playerSpins;
    mapping(address => uint256) public playerWinnings;
    uint256 public totalSpins;
    uint256 public totalPayouts;
    
    event SlotSpin(
        address indexed player,
        uint256 betAmount,
        uint256 payout,
        uint256 timestamp
    );
    
    event JackpotWin(
        address indexed player,
        uint256 amount,
        uint256 timestamp
    );

    // 1. FIX: Changed `address` to `address payable` to resolve the TypeError.
    constructor(address payable _paymentProcessor) {
        paymentProcessor = CasinoPaymentProcessor(_paymentProcessor);
        owner = msg.sender;
        jackpot = 0;
    }

    function spin() external payable nonReentrant {
        require(msg.value > 0, "Bet amount must be positive");
        uint256 betAmount = msg.value;
        
        // Process payment
        (bool success, ) = address(paymentProcessor).call{value: msg.value}(
            abi.encodeWithSignature("processMaticPayment(address)", address(this))
        );
        require(success, "Payment processing failed");

        // Generate random result (simplified for demo)
        uint256 random = _generateRandom();
        uint256 payout = _calculatePayout(random, betAmount);
        
        // Update statistics
        playerSpins[msg.sender]++;
        totalSpins++;
        
        if (payout > 0) {
            playerWinnings[msg.sender] += payout;
            totalPayouts += payout;
            
            // Check for jackpot
            if (payout >= betAmount * 100) {
                if (jackpot > 0) {
                    payout += jackpot;
                    emit JackpotWin(msg.sender, jackpot, block.timestamp);
                    jackpot = 0;
                }
            } else {
                // Add 1% to jackpot
                jackpot += betAmount / 100;
            }
            
            // Transfer winnings
            (bool transferSuccess, ) = msg.sender.call{value: payout}("");
            require(transferSuccess, "Payout transfer failed");
        } else {
            // Add 1% to jackpot
            jackpot += betAmount / 100;
        }
        
        emit SlotSpin(msg.sender, betAmount, payout, block.timestamp);
    }

    function _generateRandom() internal view returns (uint256) {
        // 2. FIX: Replaced deprecated `block.difficulty` with `block.prevrandao`.
        // Also added `block.chainid` for a minor improvement in seed diversity.
        return uint256(keccak256(abi.encodePacked(
            block.timestamp, 
            block.prevrandao, // FIX applied here
            block.chainid,
            msg.sender, 
            totalSpins
        )));
        // ⚠️ WARNING: This remains insecure for production use. Use Chainlink VRF.
    }

    function _calculatePayout(uint256 random, uint256 betAmount) internal pure returns (uint256) {
        // Simple payout logic
        uint256 result = random % 1000;
        
        if (result < 5) { // 0.5% chance - 100x
            return betAmount * 100;
        } else if (result < 20) { // 1.5% chance - 20x
            return betAmount * 20;
        } else if (result < 50) { // 3% chance - 10x
            return betAmount * 10;
        } else if (result < 100) { // 5% chance - 5x
            return betAmount * 5;
        } else if (result < 200) { // 10% chance - 2x
            return betAmount * 2;
        } else if (result < 400) { // 20% chance - 1x
            return betAmount;
        }
        
        return 0; // 60% chance - no win
    }

    function getPlayerStats(address player) external view returns (
        uint256 spins,
        uint256 winnings
    ) {
        spins = playerSpins[player];
        winnings = playerWinnings[player];
    }

    // Admin function to fund jackpot
    function fundJackpot() external payable onlyOwner {
        jackpot += msg.value;
    }

    // Allow contract to receive funds
    receive() external payable {}

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
}