// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title CasinoPaymentProcessor
 * @dev Handles MATIC and test USDC payments on Mumbai testnet
 */
contract CasinoPaymentProcessor is ReentrancyGuard, Ownable {
    // Test USDC on Mumbai (mock token address)
    address public usdcToken;
    
    mapping(address => bool) public authorizedGames;
    mapping(address => uint256) public playerBalances;
    
    event PaymentReceived(
        address indexed player,
        address indexed game,
        uint256 amount,
        address token,
        uint256 timestamp
    );
    
    event FundsWithdrawn(
        address indexed to,
        uint256 amount,
        address token,
        uint256 timestamp
    );
    
    event GameAuthorized(address indexed game, address authorizedBy);
    event GameRevoked(address indexed game, address revokedBy);

    constructor(address _usdcToken) {
        usdcToken = _usdcToken;
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

    function processMaticPayment(address game) external payable nonReentrant {
        require(authorizedGames[game], "Game not authorized");
        require(msg.value > 0, "Payment required");
        
        playerBalances[msg.sender] += msg.value;
        
        emit PaymentReceived(
            msg.sender,
            game,
            msg.value,
            address(0),
            block.timestamp
        );
    }

    function processUsdcPayment(address game, uint256 amount) external nonReentrant {
        require(authorizedGames[game], "Game not authorized");
        require(amount > 0, "Payment required");
        
        IERC20 token = IERC20(usdcToken);
        require(
            token.transferFrom(msg.sender, address(this), amount),
            "USDC transfer failed"
        );
        
        playerBalances[msg.sender] += amount;
        
        emit PaymentReceived(
            msg.sender,
            game,
            amount,
            usdcToken,
            block.timestamp
        );
    }

    function withdrawPlayerBalance(uint256 amount) external nonReentrant {
        require(amount <= playerBalances[msg.sender], "Insufficient balance");
        require(amount <= address(this).balance, "Contract insufficient balance");
        
        playerBalances[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
        
        emit FundsWithdrawn(msg.sender, amount, address(0), block.timestamp);
    }

    function withdrawUsdcBalance(uint256 amount) external nonReentrant {
        IERC20 token = IERC20(usdcToken);
        require(amount <= token.balanceOf(address(this)), "Insufficient USDC");
        
        require(
            token.transfer(msg.sender, amount),
            "USDC transfer failed"
        );
        
        emit FundsWithdrawn(msg.sender, amount, usdcToken, block.timestamp);
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getUsdcBalance() external view returns (uint256) {
        return IERC20(usdcToken).balanceOf(address(this));
    }

    function getPlayerBalance(address player) external view returns (uint256) {
        return playerBalances[player];
    }

    // Emergency withdrawal function (owner only)
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
        emit FundsWithdrawn(owner(), balance, address(0), block.timestamp);
    }

    function emergencyWithdrawUsdc() external onlyOwner {
        IERC20 token = IERC20(usdcToken);
        uint256 balance = token.balanceOf(address(this));
        require(token.transfer(owner(), balance), "USDC transfer failed");
        emit FundsWithdrawn(owner(), balance, usdcToken, block.timestamp);
    }
}