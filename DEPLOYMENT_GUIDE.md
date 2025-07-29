# 🚀 MSV Token Vesting - BSC Testnet Deployment Guide

## 📋 Prerequisites

### 1. **BSC Testnet BNB**
You need test BNB to deploy the contract. Get it from:
- [BSC Testnet Faucet](https://testnet.binance.org/faucet-smart)
- [BSCScan Faucet](https://testnet.bscscan.com/faucet)

### 2. **Private Key**
You need a private key for deployment. **Never share your private key!**

### 3. **BSCScan API Key** (Optional)
For contract verification on BSCScan:
- Go to [BSCScan](https://bscscan.com/)
- Create an account and get your API key

## 🔧 Setup Environment Variables

1. **Copy the environment file:**
   ```bash
   cp env.example .env
   ```

2. **Edit `.env` file with your values:**
   ```env
   # Your private key (without 0x prefix)
   PRIVATE_KEY=your_private_key_here
   
   # BSCScan API key (optional)
   BSCSCAN_API_KEY=your_bscscan_api_key_here
   
   # Wallet addresses (optional - will use deployer address if not set)
   LP_WALLET=0x...
   MARKETING_WALLET=0x...
   DEVELOPMENT_WALLET=0x...
   
   # Gas reporting
   REPORT_GAS=true
   ```

## 🚀 Deploy to BSC Testnet

### Option 1: Using npm script
```bash
npm run deploy:bsc-testnet
```

### Option 2: Direct hardhat command
```bash
npx hardhat run scripts/deploy-bsc-testnet.js --network bscTestnet
```

## 📊 Deployment Process

The deployment script will:

1. ✅ **Check your balance** (needs at least 0.01 BNB)
2. 🔨 **Deploy the contract** with your configuration
3. 🔍 **Verify the contract** on BSCScan (if API key provided)
4. 💾 **Save deployment info** to `deployment-bsc-testnet.json`
5. 📋 **Display summary** with contract address and BSCScan URL

## 🎯 After Deployment

### 1. **Copy Contract Address**
The script will output the contract address. Copy it for your admin dashboard.

### 2. **View on BSCScan**
Visit the provided BSCScan URL to view your contract.

### 3. **Update Admin Dashboard**
Update your admin dashboard with the new contract address.

### 4. **Test Functions**
Use the admin dashboard to test all contract functions.

## 🔍 Contract Verification

If you have a BSCScan API key, the contract will be automatically verified. If not, you can verify manually:

1. Go to [BSCScan Testnet](https://testnet.bscscan.com/)
2. Find your contract address
3. Click "Contract" tab
4. Click "Verify and Publish"
5. Fill in the details:
   - **Compiler Type**: Solidity (Single file)
   - **Compiler Version**: 0.8.20
   - **Optimization**: Yes
   - **Constructor Arguments**: Your wallet addresses

## 🛠️ Troubleshooting

### **Insufficient Balance**
```
❌ Insufficient balance. Please ensure you have at least 0.01 BNB for deployment.
```
**Solution**: Get test BNB from the faucet.

### **Private Key Error**
```
❌ Deployment failed: invalid private key
```
**Solution**: Check your private key format (no 0x prefix).

### **Network Error**
```
❌ Deployment failed: network error
```
**Solution**: Check your internet connection and try again.

### **Gas Estimation Error**
```
❌ Deployment failed: gas estimation failed
```
**Solution**: Increase gas price in hardhat.config.js or try again later.

## 📱 Admin Dashboard Setup

After deployment:

1. **Open the admin dashboard** (`admin-dashboard/index.html`)
2. **Enter the contract address** when prompted
3. **Connect your wallet** using WalletConnect
4. **Start managing** your vesting contracts

## 🔗 Useful Links

- [BSC Testnet Explorer](https://testnet.bscscan.com/)
- [BSC Testnet Faucet](https://testnet.binance.org/faucet-smart)
- [BSCScan API Documentation](https://docs.bscscan.com/)
- [Hardhat Documentation](https://hardhat.org/docs)

## 🎉 Success!

Once deployed, you'll have:
- ✅ **Deployed contract** on BSC testnet
- ✅ **Verified contract** on BSCScan
- ✅ **Admin dashboard** ready to use
- ✅ **Complete vesting system** ready for testing

Happy deploying! 🚀 