const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting MSV Token and Vesting deployment...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", (await deployer.getBalance()).toString());

  // Deploy wallet addresses (replace with actual addresses for mainnet)
  const lpWallet = "0x1234567890123456789012345678901234567890"; // Replace with actual LP wallet
  const marketingWallet = "0x2345678901234567890123456789012345678901"; // Replace with actual marketing wallet
  const referralWallet = "0x3456789012345678901234567890123456789012"; // Replace with actual referral wallet

  console.log("📋 Wallet addresses:");
  console.log("   LP Wallet:", lpWallet);
  console.log("   Marketing Wallet:", marketingWallet);
  console.log("   Referral Wallet:", referralWallet);

  // Deploy MSV Token
  console.log("\n🔧 Deploying MSV Token...");
  const MSVToken = await ethers.getContractFactory("MSVToken");
  const msvToken = await MSVToken.deploy(lpWallet, marketingWallet, referralWallet);
  await msvToken.deployed();

  console.log("✅ MSV Token deployed to:", msvToken.address);
  console.log("   Token Name:", await msvToken.name());
  console.log("   Token Symbol:", await msvToken.symbol());
  console.log("   Total Supply:", ethers.utils.formatEther(await msvToken.totalSupply()));

  // Deploy Vesting Contract
  console.log("\n🔧 Deploying MSV Vesting Contract...");
  const MSVVesting = await ethers.getContractFactory("MSVVesting");
  const msvVesting = await MSVVesting.deploy(msvToken.address);
  await msvVesting.deployed();

  console.log("✅ MSV Vesting deployed to:", msvVesting.address);

  // Transfer tokens to vesting contract (example: 20% of total supply for airdrop)
  const totalSupply = await msvToken.totalSupply();
  const airdropAmount = totalSupply.mul(20).div(100); // 20% for airdrop

  console.log("\n💰 Transferring tokens to vesting contract...");
  console.log("   Airdrop Amount:", ethers.utils.formatEther(airdropAmount));

  const transferTx = await msvToken.transfer(msvVesting.address, airdropAmount);
  await transferTx.wait();

  console.log("✅ Tokens transferred to vesting contract");

  // Verify token balance in vesting contract
  const vestingBalance = await msvToken.balanceOf(msvVesting.address);
  console.log("   Vesting Contract Balance:", ethers.utils.formatEther(vestingBalance));

  // Get initial tax configuration
  const taxBreakdown = await msvToken.getTaxBreakdown();
  console.log("\n📊 Initial Tax Configuration:");
  console.log("   Transfer Tax Rate:", taxBreakdown.transferTax.toString(), "(5%)");
  console.log("   LP Contribution Rate:", taxBreakdown.lpContribution.toString(), "(2%)");
  console.log("   Referral Reward Rate:", taxBreakdown.referralReward.toString(), "(1.5%)");
  console.log("   Marketing Rate:", taxBreakdown.marketing.toString(), "(1%)");
  console.log("   Burn Rate:", taxBreakdown.burn.toString(), "(0.5%)");

  // Get vesting configuration
  console.log("\n📅 Vesting Configuration:");
  console.log("   Cliff Duration: 90 days (3 months)");
  console.log("   Unlock Interval: 90 days (quarterly)");
  console.log("   Unlock Percentage: 1.2% per quarter");
  console.log("   Total Vesting Period: ~6.25 years (100% / 1.2% = ~83 quarters)");

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📋 Contract Addresses:");
  console.log("   MSV Token:", msvToken.address);
  console.log("   MSV Vesting:", msvVesting.address);
  console.log("   Deployer:", deployer.address);

  console.log("\n🔗 Next Steps:");
  console.log("   1. Verify contracts on BSCScan");
  console.log("   2. Set up admin dashboard");
  console.log("   3. Upload CSV with airdrop recipients");
  console.log("   4. Start vesting period");
  console.log("   5. Test claim functionality");

  // Save deployment info to file
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    contracts: {
      msvToken: msvToken.address,
      msvVesting: msvVesting.address
    },
    wallets: {
      lpWallet: lpWallet,
      marketingWallet: marketingWallet,
      referralWallet: referralWallet
    },
    configuration: {
      totalSupply: ethers.utils.formatEther(totalSupply),
      airdropAmount: ethers.utils.formatEther(airdropAmount),
      taxRates: {
        transferTax: taxBreakdown.transferTax.toString(),
        lpContribution: taxBreakdown.lpContribution.toString(),
        referralReward: taxBreakdown.referralReward.toString(),
        marketing: taxBreakdown.marketing.toString(),
        burn: taxBreakdown.burn.toString()
      }
    },
    timestamp: new Date().toISOString()
  };

  const fs = require('fs');
  fs.writeFileSync(
    `deployment-${hre.network.name}-${Date.now()}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`\n💾 Deployment info saved to deployment-${hre.network.name}-${Date.now()}.json`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 