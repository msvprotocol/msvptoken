const { ethers } = require("hardhat");

async function main() {
    const contractAddress = "0x90D29a452e52982c9cEcD04B2ed788215Aa97ce3";
    
    console.log("🔍 Checking contract owner...");
    console.log("📋 Contract Address:", contractAddress);
    
    // Get the contract factory
    const MSVP = await ethers.getContractFactory("MSVP");
    
    // Attach to the deployed contract
    const contract = MSVP.attach(contractAddress);
    
    try {
        // Get the owner
        const owner = await contract.owner();
        console.log("👑 Contract Owner:", owner);
        
        // Get deployer account
        const [deployer] = await ethers.getSigners();
        console.log("🔑 Deployer Address:", deployer.address);
        
        // Check if deployer is owner
        if (owner.toLowerCase() === deployer.address.toLowerCase()) {
            console.log("✅ Deployer is the contract owner!");
        } else {
            console.log("❌ Deployer is NOT the contract owner!");
        }
        
        // Get some basic contract info
        const name = await contract.name();
        const symbol = await contract.symbol();
        const totalSupply = await contract.totalSupply();
        
        console.log("📊 Contract Info:");
        console.log("   Name:", name);
        console.log("   Symbol:", symbol);
        console.log("   Total Supply:", ethers.utils.formatEther(totalSupply), "MSV");
        
    } catch (error) {
        console.error("❌ Error checking contract:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 