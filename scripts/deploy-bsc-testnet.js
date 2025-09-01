const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting MSV Token Vesting deployment to BSC Testnet...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📋 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "BNB");

  // Check if we have enough balance
  const balance = await deployer.provider.getBalance(deployer.address);
  if (balance < ethers.parseEther("0.01")) {
    console.error("❌ Insufficient balance. Please ensure you have at least 0.01 BNB for deployment.");
    return;
  }

  // Wallet addresses for the contract
  // You can modify these addresses as needed
  const lpWallet = process.env.LP_WALLET || deployer.address;
  const marketingWallet = process.env.MARKETING_WALLET || deployer.address;
  const developmentWallet = process.env.DEVELOPMENT_WALLET || deployer.address;

  console.log("📝 Contract Configuration:");
  console.log("   LP Wallet:", lpWallet);
  console.log("   Marketing Wallet:", marketingWallet);
  console.log("   Development Wallet:", developmentWallet);

  // Deploy the MSVP contract
  console.log("\n🔨 Deploying MSVP contract...");
  const MSVP = await ethers.getContractFactory("MSVP");
  
  const msvpToken = await MSVP.deploy(
    lpWallet,
    marketingWallet,
    developmentWallet
  );

  console.log("⏳ Waiting for deployment confirmation...");
  await msvpToken.waitForDeployment();

  const contractAddress = await msvpToken.getAddress();
  console.log("✅ MSVP deployed to:", contractAddress);

  // Get contract information
  const name = await msvpToken.name();
  const symbol = await msvpToken.symbol();
  const totalSupply = await msvpToken.totalSupply();
  const owner = await msvpToken.owner();

  console.log("\n📊 Contract Information:");
  console.log("   Name:", name);
  console.log("   Symbol:", symbol);
  console.log("   Total Supply:", ethers.formatEther(totalSupply), "MSV");
  console.log("   Owner:", owner);

  // Verify contract on BSCScan
  console.log("\n🔍 Verifying contract on BSCScan...");
  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [lpWallet, marketingWallet, developmentWallet],
    });
    console.log("✅ Contract verified on BSCScan!");
  } catch (error) {
    console.log("⚠️  Contract verification failed:", error.message);
  }

  // Save deployment information
  const deploymentInfo = {
    network: "BSC Testnet",
    contractAddress: contractAddress,
    deployer: deployer.address,
    lpWallet: lpWallet,
    marketingWallet: marketingWallet,
    developmentWallet: developmentWallet,
    deploymentTime: new Date().toISOString(),
    explorerUrl: `https://testnet.bscscan.com/address/${contractAddress}`,
  };

  console.log("\n📋 Deployment Summary:");
  console.log("   Network: BSC Testnet");
  console.log("   Contract Address:", contractAddress);
  console.log("   Deployer:", deployer.address);
  console.log("   BSCScan URL:", deploymentInfo.explorerUrl);

  // Save deployment info to file
  const fs = require("fs");
  fs.writeFileSync(
    "deployment-bsc-testnet.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("💾 Deployment information saved to deployment-bsc-testnet.json");

  // Instructions for next steps
  console.log("\n🎯 Next Steps:");
  console.log("1. Copy the contract address for your admin dashboard");
  console.log("2. Visit the BSCScan URL to view your contract");
  console.log("3. Get some test BNB from BSC Testnet faucet if needed");
  console.log("4. Use the admin dashboard to manage your contract");

  console.log("\n🎉 Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 