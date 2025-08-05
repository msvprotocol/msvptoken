# MSV Token Airdrop with Tokenomics-Based Vesting

A complete BEP20 token system with automated airdrop and tokenomics-based vesting functionality for the MetaSoilVerse (MSV) token. This system implements a sophisticated vesting schedule with 6-month cliff periods and 1.2% unlocks every 4-6 months alternating over 10+ years.

## Features

### Integrated Token with Tokenomics-Based Vesting (MSVTokenVesting.sol) - RECOMMENDED
- **BEP20 Standard**: Full ERC20 compatibility on Binance Smart Chain
- **Tokenomics-Based Vesting**: Sophisticated vesting schedule with 6-month cliff and 1.2% unlocks
- **Transfer Taxes**: Configurable 5% transfer tax with distribution to:
  - LP Contribution (2%)
  - Development Fee (1.5%)
  - Marketing (1%)
  - Burn (0.5%)
- **Max Transaction Limits**: Prevents large dumps
- **Admin Controls**: Pause/unpause, tax rate adjustments, wallet updates
- **Security**: Reentrancy protection, ownership controls
- **Automatic Unlocking**: Tokens unlock automatically without claiming mechanism
- **6-Month Cliff Period**: No tokens unlocked before 6 months from TGE
- **1.2% Unlock Pattern**: Each unlock releases exactly 1.2% of total allocation
- **Alternating Intervals**: 4 months, then 6 months, then 4 months, etc.
- **Long-Term Vesting**: Support for 30+ unlock phases over 10+ years
- **Large-Scale Support**: Handles 50B token airdrop distribution
- **Additional Purchases**: Immediately transferable
- **Early Release**: Admin can release specific amounts
- **High Precision**: 1e18 precision for accurate calculations
- **Gas Optimization**: Individual user updates for efficiency
- **Inconsistency Detection**: Audit trail for edge cases

### Admin Dashboard
- **Modern UI**: Beautiful, responsive interface with Bootstrap 5.3
- **CSV Upload**: Drag & drop functionality for bulk operations
- **Real-time Stats**: Live vesting statistics with tax breakdown
- **Participant Management**: Search and modify individual schedules
- **Wallet Integration**: MetaMask and WalletConnect support
- **Enhanced Balance Display**: Multiple balance types (base, transferable, locked, vested)
- **Export Functionality**: Download participant data as CSV
- **Gas Optimization**: Individual user updates with warnings for bulk operations

## Token Configuration

### Integrated Token (MSVTokenVesting.sol)
| Field | Value |
|-------|-------|
| Token Name | MetaSoilVerse |
| Token Symbol | MSV |
| Total Supply | 100,000,000,000 (100 Billion) |
| Decimals | 18 |
| Mintable | No |
| Burnable | Yes |
| Initial Transfer Tax | 5% |
| Max Transfer Tax | 10% |
| **Vesting Type** | **Tokenomics-Based** |
| **Cliff Period** | **6 Months from TGE** |
| **Unlock Pattern** | **1.2% every 4-6 months alternating** |
| **Unlock Intervals** | **4 months, 6 months, 4 months, 6 months, etc.** |
| **Total Unlock Phases** | **30+ phases over 10+ years** |
| **Airdrop Supply** | **50B tokens (50% of total supply)** |
| Locked Tokens | Visible in balance, non-transferable |
| Automatic Unlocking | No claiming required - tokens unlock automatically |
| Additional Purchases | Immediately transferable |
| Precision | 1e18 (18 decimal places) |

## Installation & Setup

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
LP_WALLET=your_lp_wallet_address
MARKETING_WALLET=your_marketing_wallet_address
DEVELOPMENT_WALLET=your_development_wallet_address
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

# Deploy to BSC testnet
npm run deploy:testnet:integrated

# Deploy to BSC mainnet
npm run deploy:mainnet:integrated
```

## Current Deployment Status

### BSC Testnet Deployment
- **Contract Address**: `0x90D29a452e52982c9cEcD04B2ed788215Aa97ce3`
- **Network**: BSC Testnet (Chain ID: 97)
- **Deployer**: `0xcd6f9715eAD50841929C5cda9ad78605AF71F1f2`
- **Status**: Successfully deployed and tested
- **BSCScan**: https://testnet.bscscan.com/address/0x90D29a452e52982c9cEcD04B2ed788215Aa97ce3

### Test Results
- **Total Tests**: 63/63 passing (100% success rate)
- **Coverage**: All edge cases, tokenomics, and functionality tested
- **Tokenomics Tests**: 11/11 passing (100% coverage)
- **Gas Optimization**: Individual user updates ~46,792 gas, bulk updates ~165,154 gas
- **Security**: All access controls and validations verified
- **Vesting Precision**: High precision calculations with 1e18 accuracy

## Admin Dashboard Usage

### Quick Start
1. **Start the server**:
   ```bash
   cd admin-dashboard
   python3 -m http.server 8081
   ```

2. **Access dashboard**: Open `http://localhost:8081` in your browser

3. **Connect wallet**: Use MetaMask or WalletConnect (ensure you're on BSC Testnet)

4. **Start managing**: All functions are available once connected

### Key Features
- **Real-time Statistics**: Live updates every 30 seconds
- **Tax Management**: Configure all tax components (0-10% max)
- **Vesting Management**: Create, modify, and monitor vesting schedules
- **Participant Lookup**: Detailed balance information for each user
- **Emergency Controls**: Pause/unpause and burn admin rights
- **Export Data**: Download participant information as CSV

### Balance Types Displayed
- **Base Balance**: Actual tokens held by user
- **Transferable Balance**: Tokens that can be transferred
- **Locked Amount**: Tokens still in vesting
- **Vested Amount**: Calculated vested amount
- **Total Balance**: Display balance including locked tokens

## Tokenomics-Based Vesting Schedule

### Example: User with 10,000 MSV tokens

| Phase | Time After TGE | Unlock Amount (1.2%) | Cumulative | Notes |
|-------|----------------|----------------------|------------|-------|
| 0 | 0 months | 0 MSV | 0 MSV | **6-Month Cliff Period** |
| 1 | 6 months | 120 MSV | 120 MSV | First unlock |
| 2 | 10 months | 120 MSV | 240 MSV | 4 months later |
| 3 | 16 months | 120 MSV | 360 MSV | 6 months later |
| 4 | 20 months | 120 MSV | 480 MSV | 4 months later |
| 5 | 26 months | 120 MSV | 600 MSV | 6 months later |
| 6 | 30 months | 120 MSV | 720 MSV | 4 months later |
| 7 | 36 months | 120 MSV | 840 MSV | 6 months later |
| 8 | 40 months | 120 MSV | 960 MSV | 4 months later |
| 9 | 46 months | 120 MSV | 1,080 MSV | 6 months later |
| 10 | 50 months | 120 MSV | 1,200 MSV | 4 months later |
| ... | ... | ... | ... | Continues for 30+ phases |
| 30+ | 10+ years | 120 MSV | 3,600+ MSV | Full vesting completion |

### Key Features:
- **6-Month Cliff**: No tokens unlocked before 6 months
- **1.2% Unlocks**: Each phase releases exactly 1.2% of total allocation
- **Alternating Intervals**: 4 months, then 6 months, then 4 months, etc.
- **Long-Term**: Designed for 30+ unlock phases over 10+ years
- **Large-Scale**: Supports 50B token airdrop distribution

## Usage Guide

### Admin Functions Explained

#### Early Release Function
- **Purpose**: Allows admin to unlock a portion of locked tokens early
- **Example**: User has 1000 tokens locked -> Admin can unlock 500 tokens early -> Only 500 tokens remain for vesting period
- **Function**: `earlyRelease(address user, uint256 amount)`
- **Restrictions**: Cannot release more than remaining locked tokens

#### Modify Vesting Schedule Function
- **Purpose**: Allows admin to increase or decrease total allocation for a user
- **Example**: User has 1000 tokens locked -> Admin adds 1000 more tokens -> User now has 2000 tokens total for vesting
- **Function**: `modifyVestingSchedule(address user, uint256 newAmount)`
- **Restrictions**: New amount cannot be less than already unlocked tokens

### 1. Deploy Contracts

#### Integrated Token (Recommended)
```javascript
// Deploy Integrated MSV Token with Vesting
const MSVTokenVesting = await ethers.getContractFactory("MSVTokenVesting");
const msvToken = await MSVTokenVesting.deploy(lpWallet, marketingWallet, developmentWallet);
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
4. Create vesting schedules (automatic start)
5. Monitor and manage participants

### 4. Participant Management

#### Integrated Token
```javascript
// Check unlocked amount
const unlocked = await msvToken.getUnlockedAmount(userAddress);

// Check locked amount
const locked = await msvToken.getLockedAmount(userAddress);

// Check transferable balance (includes unlocked tokens)
const transferable = await msvToken.transferableBalance(userAddress);

// Manual update of unlocked amounts (optional)
await msvToken.updateUnlockedAmountsForUser(userAddress); // Gas efficient
await msvToken.updateUnlockedAmounts(); // All participants (high gas)
```

## Admin Functions

### Token Management
```javascript
// Update transfer tax rate (0-100, max 10%)
await msvToken.updateTransferTaxRate(50); // 5%

// Update individual tax components
await msvToken.updateLPContributionRate(20);
await msvToken.updateDevelopmentRate(15);
await msvToken.updateMarketingRate(10);
await msvToken.updateBurnRate(5);

// Exclude address from tax
await msvToken.setTaxExclusion(address, true);
```

### Vesting Management

#### Integrated Token
```javascript
// Create individual vesting schedule (automatic start)
await msvToken.createVestingSchedule(userAddress, amount, releaseInterval);

// Create batch vesting schedules
await msvToken.createVestingSchedules(addresses, amounts, releaseInterval);

// Early release for specific user
await msvToken.earlyRelease(userAddress, amount);

// Modify vesting schedule (can increase or decrease total allocation)
await msvToken.modifyVestingSchedule(userAddress, newAmount);

// Update unlocked amounts
await msvToken.updateUnlockedAmountsForUser(userAddress); // Single user
await msvToken.updateUnlockedAmounts(); // All participants

// Check balances
const baseBalance = await msvToken.baseBalanceOf(userAddress);
const transferableBalance = await msvToken.transferableBalance(userAddress);
const lockedAmount = await msvToken.getLockedAmount(userAddress);
```

## Testing

### Run All Tests
```bash
npm test
```

### Run Specific Test Files
```bash
# Integrated Token Tests
npx hardhat test test/MSVTokenVesting.test.js
```

### Test Coverage
```bash
npm run coverage
```

### Tokenomics-Specific Tests
```bash
# Run only tokenomics tests
npm test -- --grep "Tokenomics-Specific Vesting Tests"

# Test coverage includes:
# - 6-Month Cliff Period (2 tests)
# - 1.2% Unlock Pattern (2 tests)  
# - Large-Scale Airdrop Testing (2 tests)
# - Cumulative Unlock Tracking (2 tests)
# - Transfer Restrictions (1 test)
# - Early Release with Constraints (1 test)
# - Gas Optimization (1 test)
```

### Gas Report
```bash
REPORT_GAS=true npm test
```

## Project Structure

```
TokenAirdrop/
├── contracts/
│   └── MSVTokenVesting.sol   # Integrated token with vesting (RECOMMENDED)
├── scripts/
│   ├── deploy-integrated.js  # Integrated token deployment
│   ├── deploy-bsc-testnet.js # BSC testnet deployment
│   └── check-balance.js      # Balance checking utility
├── test/
│   └── MSVTokenVesting.test.js # Integrated token tests
├── admin-dashboard/
│   ├── index.html            # Dashboard UI
│   ├── dashboard.js          # Dashboard logic
│   ├── deployment-info.json  # Deployment details
│   └── README.md             # Dashboard documentation
├── sample-airdrop.csv        # Sample CSV file
├── hardhat.config.js         # Hardhat configuration
├── package.json              # Dependencies
├── env.example               # Environment variables template
├── DEPLOYMENT_GUIDE.md       # Deployment instructions
├── BSCSCAN_INSTRUCTIONS.md   # BSCScan interaction guide
└── README.md                 # This file
```

## Security Features

### Token Security
- **Reentrancy Protection**: Prevents reentrancy attacks
- **Ownership Controls**: Admin-only functions
- **Pausable**: Emergency pause functionality
- **Max Transaction Limits**: Prevents large dumps
- **Tax Exclusions**: Configurable tax exemptions
- **High Precision**: 1e18 precision to prevent rounding errors
- **Overflow Protection**: Comprehensive validation

### Vesting Security
- **Non-reentrant Updates**: Safe update functions
- **Admin Controls**: Restricted admin functions
- **Emergency Controls**: Pause/unpause and admin rights burning
- **Immutable Parameters**: Core vesting parameters cannot be changed
- **Transparency**: All schedules publicly viewable
- **Inconsistency Detection**: Audit trail for edge cases

## Network Configuration

### BSC Testnet
- Network ID: 97
- RPC URL: `https://data-seed-prebsc-1-s1.binance.org:8545/`
- Explorer: `https://testnet.bscscan.com/`

### BSC Mainnet
- Network ID: 56
- RPC URL: `https://bsc-dataseed.binance.org/`
- Explorer: `https://bscscan.com/`

## Tokenomics Implementation Details

### Vesting Algorithm
The contract implements a sophisticated tokenomics-based vesting system:

1. **6-Month Cliff Period**: No tokens are unlocked before 6 months from TGE
2. **1.2% Unlock Pattern**: Each unlock phase releases exactly 1.2% of the total allocation
3. **Alternating Intervals**: 
   - Phase 1: 6 months (first unlock)
   - Phase 2: 4 months later (10 months total)
   - Phase 3: 6 months later (16 months total)
   - Phase 4: 4 months later (20 months total)
   - And so on...
4. **Long-Term Support**: Designed for 30+ unlock phases over 10+ years
5. **Large-Scale**: Handles 50B token airdrop distribution efficiently

### Mathematical Precision
- **Unlock Amount**: `(totalAllocation * 12) / 1000` (1.2% = 12/1000)
- **Time Calculation**: Precise timestamp-based calculations
- **Cumulative Tracking**: Accurate progression through unlock phases
- **High Precision**: 1e18 precision to prevent rounding errors

### Test Coverage
The system includes comprehensive tests covering:
- ✅ 6-Month cliff period enforcement
- ✅ 1.2% unlock pattern accuracy
- ✅ Alternating 4-6 month intervals
- ✅ Large-scale 50B token distribution
- ✅ 30+ unlock phases over 10 years
- ✅ Cumulative unlock tracking
- ✅ Transfer restrictions during vesting
- ✅ Early release with tokenomics constraints
- ✅ Gas optimization for large operations

## Important Notes

### Gas Optimization
- Use `updateUnlockedAmountsForUser()` for individual participants (low gas)
- Use `updateUnlockedAmounts()` sparingly for all participants (high gas)
- Automatic updates occur during transfers
- Monitor gas usage for large operations

### Tax Rate Limits
- Maximum tax rate: 10% (100/1000)
- Individual components cannot exceed total tax rate
- Zero tax rate is supported
- All tax components are configurable

### Vesting Features
- **Tokenomics-Based**: 6-month cliff with 1.2% unlocks every 4-6 months alternating
- **Automatic unlocking**: No manual claiming required
- **High precision calculations**: 1e18 precision for accurate calculations
- **Inconsistency detection**: Audit trail for edge cases
- **Long-term support**: 30+ unlock phases over 10+ years
- **Large-scale**: Handles 50B token airdrop distribution
- **Early release**: Admin can release specific amounts within constraints
- **Transfer restrictions**: Locked tokens visible but non-transferable

### Testing Requirements
- Always test on testnet before mainnet deployment
- Verify all functions work as expected
- Check gas usage for large operations
- Test edge cases and error conditions

## Troubleshooting

### Connection Issues
- Ensure you're on BSC Testnet (chainId: 97)
- Check if MetaMask is installed and unlocked
- Verify you're the contract owner
- Clear browser cache and localStorage if needed

### Transaction Failures
- Check gas limits and fees
- Ensure sufficient BNB for gas
- Verify input parameters are valid
- Check if contract is paused

### Display Issues
- Refresh the page if statistics don't update
- Check browser console for errors
- Ensure JavaScript is enabled
- Clear browser cache

## Support

For support and questions:
- Create an issue in the repository
- Check the test files for usage examples
- Review the contract comments for detailed explanations
- Check the browser console for error messages
- Verify contract address and network settings

## Version History

- **v3.0.0**: **Tokenomics-Based Vesting** - Implemented sophisticated vesting schedule with 6-month cliff, 1.2% unlocks every 4-6 months alternating, 30+ unlock phases over 10+ years, 50B airdrop support, comprehensive test coverage (63/63 tests passing)
- **v2.0.0**: Enhanced balance management, gas optimization, automatic vesting, high precision calculations, inconsistency detection
- **v1.0.0**: Initial release with basic token and vesting system

## License

This project is licensed under the MIT License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request 