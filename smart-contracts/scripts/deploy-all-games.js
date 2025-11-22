const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying simplified casino contracts...");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  const balanceInEth = ethers.formatEther(balance);
  console.log("💰 Account balance:", balanceInEth, "MATIC");

  // Check if we have minimum required balance
  if (parseFloat(balanceInEth) < 0.1) {
    throw new Error(`Insufficient funds. Need at least 0.1 MATIC, but only have ${balanceInEth} MATIC. Please get more from the faucet.`);
  }

  // Use auto gas price instead of fixed price
  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice;
  console.log(`⛽ Current network gas price: ${ethers.formatUnits(gasPrice, "gwei")} gwei`);

  try {
    // Deploy Payment Processor (without USDC for now)
    console.log("\n📦 Deploying CasinoPaymentProcessor...");
    const CasinoPaymentProcessor = await ethers.getContractFactory("CasinoPaymentProcessor");
    
    // Estimate gas for deployment
    const paymentProcessor = await CasinoPaymentProcessor.deploy(ethers.ZeroAddress);
    const deploymentTx = paymentProcessor.deploymentTransaction();
    
    console.log("📄 Transaction hash:", deploymentTx.hash);
    console.log("⏳ Waiting for deployment confirmation...");
    
    await paymentProcessor.waitForDeployment();
    const paymentProcessorAddress = await paymentProcessor.getAddress();
    console.log("✅ PaymentProcessor:", paymentProcessorAddress);

    // Check remaining balance after first deployment
    const remainingBalance1 = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Remaining balance:", ethers.formatEther(remainingBalance1), "MATIC");

    // Deploy Slot Machine
    console.log("\n🎰 Deploying SlotMachine...");
    const SlotMachine = await ethers.getContractFactory("SlotMachine");
    
    const slotMachine = await SlotMachine.deploy(paymentProcessorAddress);
    const slotDeploymentTx = slotMachine.deploymentTransaction();
    
    console.log("📄 Transaction hash:", slotDeploymentTx.hash);
    console.log("⏳ Waiting for deployment confirmation...");
    
    await slotMachine.waitForDeployment();
    const slotMachineAddress = await slotMachine.getAddress();
    console.log("✅ SlotMachine:", slotMachineAddress);

    // Check remaining balance
    const remainingBalance2 = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Remaining balance:", ethers.formatEther(remainingBalance2), "MATIC");

    // If balance is getting low, stop deployment
    if (remainingBalance2 < ethers.parseEther("0.05")) {
      console.log("⚠️  Low balance detected. Stopping deployment.");
      console.log("🎯 Partially deployed contracts:");
      console.log(`   PaymentProcessor: ${paymentProcessorAddress}`);
      console.log(`   SlotMachine: ${slotMachineAddress}`);
      return;
    }

    // Deploy Blackjack
    console.log("\n🃏 Deploying Blackjack...");
    const Blackjack = await ethers.getContractFactory("Blackjack");
    
    const blackjack = await Blackjack.deploy(paymentProcessorAddress);
    const blackjackDeploymentTx = blackjack.deploymentTransaction();
    
    console.log("📄 Transaction hash:", blackjackDeploymentTx.hash);
    console.log("⏳ Waiting for deployment confirmation...");
    
    await blackjack.waitForDeployment();
    const blackjackAddress = await blackjack.getAddress();
    console.log("✅ Blackjack:", blackjackAddress);

    // Check remaining balance
    const remainingBalance3 = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Remaining balance:", ethers.formatEther(remainingBalance3), "MATIC");

    if (remainingBalance3 < ethers.parseEther("0.05")) {
      console.log("⚠️  Low balance detected. Stopping deployment.");
      console.log("🎯 Partially deployed contracts:");
      console.log(`   PaymentProcessor: ${paymentProcessorAddress}`);
      console.log(`   SlotMachine: ${slotMachineAddress}`);
      console.log(`   Blackjack: ${blackjackAddress}`);
      return;
    }

    // Deploy Poker Game
    console.log("\n♠️ Deploying PokerGame...");
    const PokerGame = await ethers.getContractFactory("RealPokerGame");
    
    const pokerGame = await PokerGame.deploy(paymentProcessorAddress);
    const pokerDeploymentTx = pokerGame.deploymentTransaction();
    
    console.log("📄 Transaction hash:", pokerDeploymentTx.hash);
    console.log("⏳ Waiting for deployment confirmation...");
    
    await pokerGame.waitForDeployment();
    const pokerGameAddress = await pokerGame.getAddress();
    console.log("✅ PokerGame:", pokerGameAddress);

    // Wait a bit for transactions to settle
    console.log("\n⏳ Waiting for block confirmations...");
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Authorize all games
    console.log("\n🔐 Authorizing games...");
    
    try {
      console.log("🔐 Authorizing SlotMachine...");
      const auth1 = await paymentProcessor.authorizeGame(slotMachineAddress);
      await auth1.wait();
      console.log("✅ SlotMachine authorized");
    } catch (authError) {
      console.log("⚠️  Failed to authorize SlotMachine:", authError.message);
    }

    try {
      console.log("🔐 Authorizing Blackjack...");
      const auth2 = await paymentProcessor.authorizeGame(blackjackAddress);
      await auth2.wait();
      console.log("✅ Blackjack authorized");
    } catch (authError) {
      console.log("⚠️  Failed to authorize Blackjack:", authError.message);
    }

    try {
      console.log("🔐 Authorizing PokerGame...");
      const auth3 = await paymentProcessor.authorizeGame(pokerGameAddress);
      await auth3.wait();
      console.log("✅ PokerGame authorized");
    } catch (authError) {
      console.log("⚠️  Failed to authorize PokerGame:", authError.message);
    }

    // Save deployment info
    const deploymentInfo = {
      network: "amoy",
      timestamp: new Date().toISOString(),
      contracts: {
        paymentProcessor: paymentProcessorAddress,
        slotMachine: slotMachineAddress,
        blackjack: blackjackAddress,
        pokerGame: pokerGameAddress
      },
      deployer: deployer.address
    };

    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentPath = path.join(deploymentsDir, `deployment-${Date.now()}.json`);
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    
    console.log("\n📄 Deployment saved to:", deploymentPath);
    console.log("\n🎉 All contracts deployed successfully!");

    console.log("\n🔗 Contract Addresses for Frontend:");
    console.log(`PaymentProcessor: ${paymentProcessorAddress}`);
    console.log(`SlotMachine: ${slotMachineAddress}`);
    console.log(`Blackjack: ${blackjackAddress}`);
    console.log(`PokerGame: ${pokerGameAddress}`);

    // Final balance check
    const finalBalance = await ethers.provider.getBalance(deployer.address);
    console.log("\n💰 Final balance:", ethers.formatEther(finalBalance), "MATIC");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    
    if (error.message.includes("insufficient funds")) {
      console.log("\n💡 Solution: Get more test MATIC from:");
      console.log("   - https://faucet.polygon.technology/ (select Amoy)");
      console.log("   - https://www.alchemy.com/faucets/polygon-amoy");
      console.log("   - https://stakely.io/faucet/polygon-amoy-polygon-amoy-testnet");
    }
    
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error.message);
    process.exit(1);
  });