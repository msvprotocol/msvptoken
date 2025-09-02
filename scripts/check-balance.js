const { ethers } = require("hardhat");

async function main() {
  console.log(" Checking wallet balance on BSC Testnet...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log(" Wallet address:", deployer.address);

  // Check balance
  const balance = await deployer.provider.getBalance(deployer.address);
  const balanceInBNB = ethers.formatEther(balance);
  
  console.log(" Current balance:", balanceInBNB, "BNB");
  
  if (balance < ethers.parseEther("0.05")) {
    console.log("\n  Low balance detected!");
    console.log(" To get test BNB, visit:");
    console.log("   • BSC Testnet Faucet: https://testnet.binance.org/faucet-smart");
    console.log("   • BSCScan Faucet: https://testnet.bscscan.com/faucet");
    console.log("\n Recommended: Get at least 0.1 BNB for deployment");
  } else {
    console.log("✔ Sufficient balance for deployment!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  }); 