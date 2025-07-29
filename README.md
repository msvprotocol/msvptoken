# MSV Token Airdrop with Vesting

A complete BEP20 token system with automated airdrop and vesting functionality for the MetaSoilVerse (MSV) token.

## 🚀 Features

### Integrated Token with Vesting (MSVTokenVesting.sol) - **RECOMMENDED**
- **BEP20 Standard**: Full ERC20 compatibility on Binance Smart Chain
- **Integrated Vesting**: Locked tokens visible in balance but non-transferable
- **Transfer Taxes**: Configurable 5% transfer tax with distribution to:
  - LP Contribution (2%)
  - Development Fee (1.5%)
  - Marketing (1%)
  - Burn (0.5%)
- **Max Transaction Limits**: Prevents large dumps
- **Admin Controls**: Pause/unpause, tax rate adjustments, wallet updates
- **Security**: Reentrancy protection, ownership controls
- **Automatic Unlocking**: Tokens unlock automatically without claiming mechanism
- **Customizable Release Intervals**: 1, 2, 3, 4, or 6 months
- **1-Year Complete Vesting**: Fully customizable duration
- **Additional Purchases**: Immediately transferable
- **Early Release**: Admin can release specific amounts

### Separate Token & Vesting (MSVToken.sol + MSVVesting.sol)
- **BEP20 Standard**: Full ERC20 compatibility on Binance Smart Chain
- **Transfer Taxes**: Configurable 5% transfer tax with distribution
- **Max Transaction Limits**: Prevents large dumps
- **Admin Controls**: Pause/unpause, tax rate adjustments, wallet updates
- **Security**: Reentrancy protection, ownership controls
- **3-Month Cliff**: No tokens unlockable for first 90 days
- **Quarterly Unlocks**: 1.2% of total allocation every 90 days
- **Complete Vesting**: ~6.25 years total (83 quarters)
- **Admin Controls**: Cliff bypass, schedule modifications, emergency functions
- **CSV Upload**: Batch airdrop execution
- **Transparency**: Full vesting schedule visibility

### Admin Dashboard
- **Modern UI**: Beautiful, responsive interface
- **CSV Upload**: Drag & drop functionality
- **Real-time Stats**: Live vesting statistics
- **Participant Management**: Search and modify individual schedules
- **Wallet Integration**: MetaMask support

## 📋 Token Configuration

### Integrated Token (MSVTokenVesting.sol)
| Field | Value |
|-------|-------|
| Token Name | MetaSoilVerse |
| Token Symbol | MSV |
| Total Supply | 100,000,000,000 (100 Billion) |
| Decimals | 18 |
| Mintable | ❌ No |
| Burnable | ✅ Yes |
| Initial Transfer Tax | 5% |
| Vesting Duration | 1 Year (365 Days) |
| Release Intervals | 1, 2, 3, 4, or 6 months |
| Locked Tokens | Visible in balance, non-transferable |
| Automatic Unlocking | No claiming required - tokens unlock automatically |
| Additional Purchases | Immediately transferable |

### Separate Token (MSVToken.sol + MSVVesting.sol)
| Field | Value |
|-------|-------|
| Token Name | MetaSoilVerse |
| Token Symbol | MSV |
| Total Supply | 100,000,000,000 (100 Billion) |
| Decimals | 18 |
| Mintable | ❌ No |
| Burnable | ✅ Yes |
| Initial Transfer Tax | 5% |
| Cliff Period | 3 Months (90 Days) |
| Unlock Schedule | 1.2% every 90 days |
| Total Vesting Period | ~6.25 years |

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MetaMask wallet
- BSC testnet/mainnet access

### 1. Clone and Install
```bash
git clone <repository-url>
cd TokenAirdrop
npm install
```

### 2. Environment Setup
```bash
cp env.example .env
```

Edit `.env` file:
```env
PRIVATE_KEY=your_private_key_here
BSCSCAN_API_KEY=your_bscscan_api_key_here
REPORT_GAS=true
```

### 3. Compile Contracts
```bash
npm run compile
```

### 4. Run Tests
```bash
npm test
```

### 5. Deploy Contracts
```bash
# Deploy Integrated Token (Recommended)
npm run deploy:integrated

# Deploy Separate Token & Vesting
npm run deploy

# Deploy to BSC testnet
npm run deploy:testnet:integrated  # Integrated
npm run deploy:testnet             # Separate

# Deploy to BSC mainnet
npm run deploy:mainnet:integrated  # Integrated
npm run deploy:mainnet             # Separate
```

## 📊 Vesting Schedule Example

For a user with 10,000 MSV tokens:

| Quarter | Time Period | Unlock Amount | Cumulative |
|---------|-------------|---------------|------------|
| 0 | 0-90 days | 0 MSV (Cliff) | 0 MSV |
| 1 | 90-180 days | 120 MSV | 120 MSV |
| 2 | 180-270 days | 120 MSV | 240 MSV |
| 3 | 270-360 days | 120 MSV | 360 MSV |
| ... | ... | ... | ... |
| 83 | ~6.25 years | 120 MSV | 9,960 MSV |
| Final | After 83 quarters | 40 MSV | 10,000 MSV |

## 🎯 Usage Guide

### Admin Functions Explained

#### Early Release Function
- **Purpose**: Allows admin to unlock a portion of locked tokens early
- **Example**: User has 1000 tokens locked → Admin can unlock 500 tokens early → Only 500 tokens remain for vesting period
- **Function**: `earlyRelease(address user, uint256 amount)`
- **Restrictions**: Cannot release more than remaining locked tokens

#### Modify Vesting Schedule Function
- **Purpose**: Allows admin to increase or decrease total allocation for a user
- **Example**: User has 1000 tokens locked → Admin adds 1000 more tokens → User now has 2000 tokens total for vesting
- **Function**: `modifyVestingSchedule(address user, uint256 newAmount)`
- **Restrictions**: New amount cannot be less than already unlocked tokens

### 1. Deploy Contracts

#### Integrated Token (Recommended)
```javascript
// Deploy Integrated MSV Token with Vesting
const MSVTokenVesting = await ethers.getContractFactory("MSVTokenVesting");
const msvToken = await MSVTokenVesting.deploy(lpWallet, marketingWallet, referralWallet);
```

#### Separate Token & Vesting
```javascript
// Deploy MSV Token
const MSVToken = await ethers.getContractFactory("MSVToken");
const msvToken = await MSVToken.deploy(lpWallet, marketingWallet, referralWallet);

// Deploy Vesting Contract
const MSVVesting = await ethers.getContractFactory("MSVVesting");
const msvVesting = await MSVVesting.deploy(msvToken.address);

// Transfer tokens to vesting contract
await msvToken.transfer(msvVesting.address, airdropAmount);
```

### 2. Prepare CSV File
Create a CSV file with the following format:
```csv
address,amount
0x1234567890123456789012345678901234567890,10000
0x2345678901234567890123456789012345678901,15000
```

### 3. Use Admin Dashboard
1. Open `admin-dashboard/index.html` in a web browser
2. Connect MetaMask wallet
3. Upload CSV file
4. Start vesting period
5. Execute airdrop

### 4. Participant Claims

#### Integrated Token
```javascript
// Check unlocked amount
const unlocked = await msvToken.getUnlockedAmount(userAddress);

// Check locked amount
const locked = await msvToken.getLockedAmount(userAddress);

// Check transferable balance (includes unlocked tokens)
const transferable = await msvToken.transferableBalance(userAddress);

// Manual update of unlocked amounts (optional)
await msvToken.updateUnlockedAmounts();
```

#### Separate Token & Vesting
```javascript
// Check claimable amount
const claimable = await msvVesting.getClaimableAmount(userAddress);

// Claim tokens
await msvVesting.connect(user).claimTokens();
```

## 🔧 Admin Functions

### Token Management
```javascript
// Update transfer tax rate
await msvToken.updateTransferTaxRate(30); // 3%

// Update individual tax components
await msvToken.updateLPContributionRate(25);
await msvToken.updateReferralRewardRate(20);
await msvToken.updateMarketingRate(15);
await msvToken.updateBurnRate(10);

// Exclude address from tax
await msvToken.setTaxExclusion(address, true);
```

### Vesting Management

#### Integrated Token
```javascript
// Start vesting period
await msvToken.startVesting();

// Create individual vesting schedule
await msvToken.createVestingSchedule(userAddress, amount, releaseInterval);

// Create batch vesting schedules
await msvToken.createVestingSchedules(addresses, amounts, releaseInterval);

// Early release for specific user
await msvToken.earlyRelease(userAddress, amount);

// Modify vesting schedule (can increase or decrease total allocation)
await msvToken.modifyVestingSchedule(userAddress, newAmount);

// Check locked amount
const locked = await msvToken.getLockedAmount(userAddress);

// Check remaining locked amount (total - unlocked)
const remainingLocked = await msvToken.getRemainingLockedAmount(userAddress);
```

#### Separate Token & Vesting
```javascript
// Start vesting period
await msvVesting.startVesting();

// Create individual vesting schedule
await msvVesting.createVestingSchedule(userAddress, amount);

// Create batch vesting schedules
await msvVesting.createVestingSchedules(addresses, amounts);

// Bypass cliff for specific user
await msvVesting.bypassCliff(userAddress);

// Modify vesting schedule
await msvVesting.modifyVestingSchedule(userAddress, newAmount);

// Pause/unpause vesting
await msvVesting.pause();
await msvVesting.unpause();
```

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Specific Test Files
```bash
# Integrated Token Tests
npx hardhat test test/MSVTokenVesting.test.js

# Separate Token & Vesting Tests
npx hardhat test test/MSVToken.test.js
npx hardhat test test/MSVVesting.test.js
```

### Test Coverage
```bash
npm run coverage
```

### Gas Report
```bash
REPORT_GAS=true npm test
```

## 📁 Project Structure

```
TokenAirdrop/
├── contracts/
│   ├── MSVTokenVesting.sol   # Integrated token with vesting (RECOMMENDED)
│   ├── MSVToken.sol          # Separate token contract
│   └── MSVVesting.sol        # Separate vesting contract
├── scripts/
│   ├── deploy-integrated.js  # Integrated token deployment
│   └── deploy.js             # Separate token deployment
├── test/
│   ├── MSVTokenVesting.test.js # Integrated token tests
│   ├── MSVToken.test.js      # Separate token tests
│   └── MSVVesting.test.js    # Separate vesting tests
├── admin-dashboard/
│   ├── index.html            # Dashboard UI
│   └── dashboard.js          # Dashboard logic
├── sample-airdrop.csv        # Sample CSV file
├── hardhat.config.js         # Hardhat configuration
├── package.json              # Dependencies
└── README.md                 # This file
```

## 🔒 Security Features

### Token Security
- **Reentrancy Protection**: Prevents reentrancy attacks
- **Ownership Controls**: Admin-only functions
- **Pausable**: Emergency pause functionality
- **Max Transaction Limits**: Prevents large dumps
- **Tax Exclusions**: Configurable tax exemptions

### Vesting Security
- **Non-reentrant Claims**: Safe claim function
- **Admin Controls**: Restricted admin functions
- **Emergency Withdraw**: Admin can withdraw tokens
- **Immutable Parameters**: Core vesting parameters cannot be changed
- **Transparency**: All schedules publicly viewable

## 🌐 Network Configuration

### BSC Testnet
- Network ID: 97
- RPC URL: `https://data-seed-prebsc-1-s1.binance.org:8545/`
- Explorer: `https://testnet.bscscan.com/`

### BSC Mainnet
- Network ID: 56
- RPC URL: `https://bsc-dataseed.binance.org/`
- Explorer: `https://bscscan.com/`

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## ⚠️ Important Notes

1. **Test Thoroughly**: Always test on testnet before mainnet deployment
2. **Secure Private Keys**: Never commit private keys to version control
3. **Verify Contracts**: Always verify contracts on BSCScan after deployment
4. **Backup Data**: Keep backups of CSV files and deployment information
5. **Gas Optimization**: Monitor gas usage for large airdrops

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the test files for usage examples
- Review the contract comments for detailed explanations

## 🔄 Version History

- **v1.0.0**: Initial release with complete token and vesting system
- Features: BEP20 token, quarterly vesting, admin dashboard, comprehensive tests 