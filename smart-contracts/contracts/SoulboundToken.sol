// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SoulboundToken is ERC721, Ownable {
    uint256 private _tokenIdCounter;
    
    mapping(uint256 => string) private _tokenURIs;
    mapping(address => uint256) public playerTokens;
    mapping(uint256 => string[]) public tokenAchievements;
    
    event SoulboundMinted(address indexed to, uint256 tokenId, string metadata);
    event AchievementAdded(address indexed player, string achievement, uint256 timestamp);

    constructor() ERC721("BetfinPlayer", "BFP") {}

    function mintSoulbound(address to, string memory uri) external onlyOwner returns (uint256) {
        require(balanceOf(to) == 0, "Player already has soulbound token");
        
        _tokenIdCounter++;
        uint256 newTokenId = _tokenIdCounter;
        
        _mint(to, newTokenId);
        _setTokenURI(newTokenId, uri);
        playerTokens[to] = newTokenId;
        
        emit SoulboundMinted(to, newTokenId, uri);
        return newTokenId;
    }

    function addAchievement(address player, string memory achievement) external onlyOwner {
        uint256 tokenId = playerTokens[player];
        require(tokenId != 0, "Player has no soulbound token");
        
        tokenAchievements[tokenId].push(achievement);
        
        emit AchievementAdded(player, achievement, block.timestamp);
    }

    function getAchievements(address player) external view returns (string[] memory) {
        uint256 tokenId = playerTokens[player];
        require(tokenId != 0, "Player has no soulbound token");
        
        return tokenAchievements[tokenId];
    }

    function getPlayerToken(address player) external view returns (uint256) {
        return playerTokens[player];
    }

    function _setTokenURI(uint256 tokenId, string memory uri) internal {
        require(_exists(tokenId), "Token does not exist");
        _tokenURIs[tokenId] = uri;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return _tokenURIs[tokenId];
    }

    // Override transfer functions to make token soulbound (non-transferable)
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize) internal virtual override {
        require(from == address(0) || to == address(0), "Soulbound token cannot be transferred");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function transferFrom(address from, address to, uint256 tokenId) public override {
        require(from == address(0) || to == address(0), "Soulbound token cannot be transferred");
        super.transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public override {
        require(from == address(0) || to == address(0), "Soulbound token cannot be transferred");
        super.safeTransferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public override {
        require(from == address(0) || to == address(0), "Soulbound token cannot be transferred");
        super.safeTransferFrom(from, to, tokenId, data);
    }
}