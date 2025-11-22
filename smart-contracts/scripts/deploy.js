const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting Betfin-Poker deployment to Polygon Amoy testnet...");

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "MATIC");

  // Deploy Mock USDC first (for testnet)
  console.log("\n💵 Deploying MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.deployed();
  console.log("✅ MockUSDC deployed to:", mockUSDC.address);

  // Deploy Payment Processor
  console.log("\n📦 Deploying CasinoPaymentProcessor...");
  const CasinoPaymentProcessor = await ethers.getContractFactory("CasinoPaymentProcessor");
  const paymentProcessor = await CasinoPaymentProcessor.deploy(mockUSDC.address);
  await paymentProcessor.deployed();
  console.log("✅ CasinoPaymentProcessor deployed to:", paymentProcessor.address);

  // Deploy Poker Game
  console.log("\n🎰 Deploying PokerGame...");
  const PokerGame = await ethers.getContractFactory("PokerGame");
  const pokerGame = await PokerGame.deploy(paymentProcessor.address);
  await pokerGame.deployed();
  console.log("✅ PokerGame deployed to:", pokerGame.address);

  // Deploy Soulbound Token
  console.log("\n🔗 Deploying SoulboundToken...");
  const SoulboundToken = await ethers.getContractFactory("SoulboundToken");
  const soulboundToken = await SoulboundToken.deploy();
  await soulboundToken.deployed();
  console.log("✅ SoulboundToken deployed to:", soulboundToken.address);

  // Authorize PokerGame in PaymentProcessor
  console.log("\n🔐 Authorizing PokerGame in PaymentProcessor...");
  const authTx = await paymentProcessor.authorizeGame(pokerGame.address);
  await authTx.wait();
  console.log("✅ PokerGame authorized for payments");

  // Transfer some MockUSDC to deployer for testing
  console.log("\n🪙 Minting test USDC to deployer...");
  const mintTx = await mockUSDC.mint(deployer.address, ethers.utils.parseUnits("1000", 6));
  await mintTx.wait();
  console.log("✅ 1000 mock USDC minted to deployer");

  // Save deployment addresses
  const deploymentInfo = {
    network: "amoy",
    timestamp: new Date().toISOString(),
    contracts: {
      mockUSDC: mockUSDC.address,
      paymentProcessor: paymentProcessor.address,
      pokerGame: pokerGame.address,
      soulboundToken: soulboundToken.address
    },
    deployer: deployer.address,
    blockNumber: await ethers.provider.getBlockNumber()
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info
  const deploymentPath = path.join(deploymentsDir, `deployment-amoy-${Date.now()}.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n📄 Deployment info saved to:", deploymentPath);
  console.log("\n🎉 Deployment completed successfully!");

  // Display next steps
  console.log("\n📋 Next Steps:");
  console.log("1. Update frontend with contract addresses");
  console.log("2. Test the application on Polygon Amoy testnet");
  console.log("3. Get test MATIC from faucet if needed");
  
  // Display contract addresses for frontend
  console.log("\n🔗 Contract Addresses for Frontend:");
  console.log(`MockUSDC: ${mockUSDC.address}`);
  console.log(`PaymentProcessor: ${paymentProcessor.address}`);
  console.log(`PokerGame: ${pokerGame.address}`);
  console.log(`SoulboundToken: ${soulboundToken.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });