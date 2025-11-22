const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying all casino games to Polygon Amoy...");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "MATIC");

  // Use lower gas price
  const gasPrice = ethers.utils.parseUnits("25", "gwei");

  // Deploy MockUSDC first
  console.log("\n💵 Deploying MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy({ gasPrice });
  await mockUSDC.deployed();
  console.log("✅ MockUSDC:", mockUSDC.address);

  // Deploy Payment Processor
  console.log("\n📦 Deploying CasinoPaymentProcessor...");
  const CasinoPaymentProcessor = await ethers.getContractFactory("CasinoPaymentProcessor");
  const paymentProcessor = await CasinoPaymentProcessor.deploy(mockUSDC.address, { gasPrice });
  await paymentProcessor.deployed();
  console.log("✅ PaymentProcessor:", paymentProcessor.address);

  // Deploy Poker Game
  console.log("\n🎰 Deploying RealPokerGame...");
  const RealPokerGame = await ethers.getContractFactory("RealPokerGame");
  const pokerGame = await RealPokerGame.deploy(paymentProcessor.address, { gasPrice });
  await pokerGame.deployed();
  console.log("✅ PokerGame:", pokerGame.address);

  // Deploy Slot Machine
  console.log("\n🎯 Deploying SlotMachine...");
  const SlotMachine = await ethers.getContractFactory("SlotMachine");
  const slotMachine = await SlotMachine.deploy(paymentProcessor.address, { gasPrice });
  await slotMachine.deployed();
  console.log("✅ SlotMachine:", slotMachine.address);

  // Deploy Blackjack
  console.log("\n🃏 Deploying Blackjack...");
  const Blackjack = await ethers.getContractFactory("Blackjack");
  const blackjack = await Blackjack.deploy(paymentProcessor.address, { gasPrice });
  await blackjack.deployed();
  console.log("✅ Blackjack:", blackjack.address);

  // Deploy Soulbound Token
  console.log("\n🔗 Deploying SoulboundToken...");
  const SoulboundToken = await ethers.getContractFactory("SoulboundToken");
  const soulboundToken = await SoulboundToken.deploy({ gasPrice });
  await soulboundToken.deployed();
  console.log("✅ SoulboundToken:", soulboundToken.address);

  // Authorize all games in PaymentProcessor
  console.log("\n🔐 Authorizing games in PaymentProcessor...");
  const authTx1 = await paymentProcessor.authorizeGame(pokerGame.address, { gasPrice });
  await authTx1.wait();
  console.log("✅ PokerGame authorized");

  const authTx2 = await paymentProcessor.authorizeGame(slotMachine.address, { gasPrice });
  await authTx2.wait();
  console.log("✅ SlotMachine authorized");

  const authTx3 = await paymentProcessor.authorizeGame(blackjack.address, { gasPrice });
  await authTx3.wait();
  console.log("✅ Blackjack authorized");

  // Mint test USDC
  console.log("\n🪙 Minting test USDC...");
  const mintTx = await mockUSDC.mint(deployer.address, ethers.utils.parseUnits("1000", 6), { gasPrice });
  await mintTx.wait();
  console.log("✅ 1000 mock USDC minted");

  // Save deployment info
  const deploymentInfo = {
    network: "amoy",
    timestamp: new Date().toISOString(),
    contracts: {
      mockUSDC: mockUSDC.address,
      paymentProcessor: paymentProcessor.address,
      pokerGame: pokerGame.address,
      slotMachine: slotMachine.address,
      blackjack: blackjack.address,
      soulboundToken: soulboundToken.address
    },
    deployer: deployer.address
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentPath = path.join(deploymentsDir, `deployment-all-games-${Date.now()}.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n📄 Deployment info saved to:", deploymentPath);
  console.log("\n🎉 All games deployed successfully!");

  console.log("\n🔗 Contract Addresses for Frontend:");
  console.log(`MockUSDC: ${mockUSDC.address}`);
  console.log(`PaymentProcessor: ${paymentProcessor.address}`);
  console.log(`PokerGame: ${pokerGame.address}`);
  console.log(`SlotMachine: ${slotMachine.address}`);
  console.log(`Blackjack: ${blackjack.address}`);
  console.log(`SoulboundToken: ${soulboundToken.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });