// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CasinoPaymentProcessor is ReentrancyGuard, Ownable {
    mapping(address => bool) public authorizedGames;
    mapping(address => uint256) public playerBalances;
    
    event PaymentReceived(
        address indexed player,
        address indexed game,
        uint256 amount,
        uint256 timestamp
    );
    
    event FundsWithdrawn(
        address indexed to,
        uint256 amount,
        uint256 timestamp
    );
    
    event GameAuthorized(address indexed game, address authorizedBy);
    event GameRevoked(address indexed game, address revokedBy);

    // Note: The _usdcToken parameter is unused in this version, as it handles Matic/ETH.
    constructor(address _usdcToken) {
    }

    modifier onlyAuthorizedGame() {
        require(authorizedGames[msg.sender], "Caller not authorized game");
        _;
    }

    function authorizeGame(address game) external onlyOwner {
        authorizedGames[game] = true;
        emit GameAuthorized(game, msg.sender);
    }

    function revokeGame(address game) external onlyOwner {
        authorizedGames[game] = false;
        emit GameRevoked(game, msg.sender);
    }

    // A player deposits funds to their balance.
    function processMaticPayment(address game) external payable nonReentrant {
        require(authorizedGames[game], "Game not authorized");
        require(msg.value > 0, "Payment required");
        
        playerBalances[msg.sender] += msg.value;
        
        emit PaymentReceived(
            msg.sender,
            game,
            msg.value,
            block.timestamp
        );
    }

    // A player withdraws funds from their balance.
    function withdrawPlayerBalance(uint256 amount) external nonReentrant {
        require(amount <= playerBalances[msg.sender], "Insufficient balance");
        require(amount <= address(this).balance, "Contract insufficient balance");
        
        playerBalances[msg.sender] -= amount;
        
        // Note: Using `call` is preferred for modern Solidity, but we must use 
        // `msg.sender.call{value: amount}("")`
        // which requires `msg.sender` to be a payable address (which it is for EOA/contract calls).
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit FundsWithdrawn(msg.sender, amount, block.timestamp);
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getPlayerBalance(address player) external view returns (uint256) {
        return playerBalances[player];
    }

    // Emergency withdrawal function (owner only)
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        // Use `owner()` which is an address. We use `call` to send Ether/Matic.
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Transfer failed");
        emit FundsWithdrawn(owner(), balance, block.timestamp);
    }

    // Allow contract to receive funds (makes the contract address payable)
    receive() external payable {}
}