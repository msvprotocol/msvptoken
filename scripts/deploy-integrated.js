const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting MSV Token with Integrated Vesting deployment...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", (await deployer.getBalance()).toString());

  // Deploy wallet addresses (replace with actual addresses for mainnet)
  const lpWallet = "0x1234567890123456789012345678901234567890"; // Replace with actual LP wallet
  const marketingWallet = "0x2345678901234567890123456789012345678901"; // Replace with actual marketing wallet
  const developmentWallet = "0x3456789012345678901234567890123456789012"; // Replace with actual development wallet

  console.log("📋 Wallet addresses:");
  console.log("   LP Wallet:", lpWallet);
  console.log("   Marketing Wallet:", marketingWallet);
  console.log("   Development Wallet:", developmentWallet);

  // Deploy Integrated MSV Token with Vesting
  console.log("\n🔧 Deploying MSV Token with Integrated Vesting...");
  const MSVTokenVesting = await ethers.getContractFactory("MSVTokenVesting");
  const msvToken = await MSVTokenVesting.deploy(lpWallet, marketingWallet, developmentWallet);
  await msvToken.deployed();

  console.log("✅ MSV Token with Integrated Vesting deployed to:", msvToken.address);
  console.log("   Token Name:", await msvToken.name());
  console.log("   Token Symbol:", await msvToken.symbol());
  console.log("   Total Supply:", ethers.utils.formatEther(await msvToken.totalSupply()));

  // Get initial tax configuration
  const taxBreakdown = await msvToken.getTaxBreakdown();
  console.log("\n📊 Initial Tax Configuration:");
  console.log("   Transfer Tax Rate:", taxBreakdown.transferTax.toString(), "(5%)");
  console.log("   LP Contribution Rate:", taxBreakdown.lpContribution.toString(), "(2%)");
  console.log("   Development Rate:", taxBreakdown.development.toString(), "(1.5%)");
  console.log("   Marketing Rate:", taxBreakdown.marketing.toString(), "(1%)");
  console.log("   Burn Rate:", taxBreakdown.burn.toString(), "(0.5%)");

  // Get vesting configuration
  console.log("\n📅 Vesting Configuration:");
  console.log("   Max Vesting Duration: 365 days (1 year)");
  console.log("   Min Vesting Duration: 30 days (1 month)");
  console.log("   Valid Release Intervals: 1, 2, 3, 4, or 6 months");
  console.log("   Locked tokens visible in balance but non-transferable");
  console.log("   Additional purchases immediately transferable");
  console.log("   Automatic unlocking - no claiming required");

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📋 Contract Address:");
  console.log("   MSV Token with Vesting:", msvToken.address);
  console.log("   Deployer:", deployer.address);

  console.log("\n🔗 Next Steps:");
  console.log("   1. Verify contract on BSCScan");
  console.log("   2. Set up admin dashboard");
  console.log("   3. Upload CSV with airdrop recipients");
  console.log("   4. Start vesting period");
  console.log("   5. Test automatic unlocking functionality");

  // Save deployment info to file
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    contract: {
      msvTokenVesting: msvToken.address
    },
    wallets: {
      lpWallet: lpWallet,
      marketingWallet: marketingWallet,
      developmentWallet: developmentWallet
    },
    configuration: {
      totalSupply: ethers.utils.formatEther(await msvToken.totalSupply()),
      taxRates: {
        transferTax: taxBreakdown.transferTax.toString(),
        lpContribution: taxBreakdown.lpContribution.toString(),
        development: taxBreakdown.development.toString(),
        marketing: taxBreakdown.marketing.toString(),
        burn: taxBreakdown.burn.toString()
      },
      vesting: {
        maxDuration: "365 days",
        minDuration: "30 days",
        validIntervals: ["30 days", "60 days", "90 days", "120 days", "180 days"]
      }
    },
    timestamp: new Date().toISOString()
  };

  const fs = require('fs');
  fs.writeFileSync(
    `deployment-integrated-${hre.network.name}-${Date.now()}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`\n💾 Deployment info saved to deployment-integrated-${hre.network.name}-${Date.now()}.json`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 