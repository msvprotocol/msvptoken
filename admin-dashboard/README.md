# MSV Token Vesting - Admin Dashboard

A modern, responsive admin dashboard for managing the MSV Token Vesting smart contract with comprehensive functionality and real-time monitoring.

## 🚀 Quick Start

1. **Open the Dashboard**
   ```bash
   cd admin-dashboard
   python3 -m http.server 8080
   ```
   Then open `http://localhost:8080` in your browser.

2. **Connect Wallet**
   - Click "Connect Wallet" button
   - Choose MetaMask or WalletConnect
   - Ensure you're on BSC Testnet (chainId: 97)
   - Verify you're the contract owner

3. **Start Managing**
   - View real-time statistics
   - Create vesting schedules
   - Manage tax rates
   - Monitor participants

## 📋 Contract Information

- **Contract Address**: `0xBA1B16B7b9Bd2bD0ccE2634493dB70e81975e99d`
- **Network**: BSC Testnet
- **Token**: MetaSoilVerse (MSV)
- **Total Supply**: 100 Billion MSV
- **Version**: 2.0.0

## 🔧 Key Features

### 🎯 Vesting Management
- **Automatic Start**: Vesting schedules start immediately upon creation
- **Single User Creation**: Create individual vesting schedules
- **Bulk CSV Upload**: Upload CSV files for batch operations
- **Early Release**: Unlock specific amounts for users
- **Schedule Modification**: Increase or decrease total allocations
- **Gas Optimization**: Individual user updates for efficiency

### 💰 Tax Management
- **Transfer Tax**: Configurable up to 10% (100/1000)
- **Tax Breakdown**: LP (2%), Development (1.5%), Marketing (1%), Burn (0.5%)
- **Individual Components**: Update each tax component separately
- **Exclusions**: Exclude addresses from tax and max transaction limits

### 📊 Enhanced Monitoring
- **Real-time Statistics**: Live updates every 30 seconds
- **Tax Breakdown Display**: See all tax components
- **Participant Lookup**: Detailed balance information
- **Balance Types**: Base balance, transferable balance, locked amount, vested amount
- **Export Functionality**: Download participant data as CSV

### 🛡️ Security & Controls
- **Pause/Unpause**: Emergency contract controls
- **Admin Rights**: Burn admin privileges permanently
- **Wallet Management**: Update LP, Marketing, and Development wallets
- **Transaction Limits**: Configure max transaction amounts

## 📁 CSV Format

For bulk vesting creation, use this CSV format:
```csv
address,amount
0x1234567890123456789012345678901234567890,10000
0x2345678901234567890123456789012345678901,15000
```

## 🔄 Wallet Connection

### MetaMask (Recommended)
1. Install MetaMask extension
2. Add BSC Testnet network
3. Import your private key
4. Click "Connect Wallet"

### WalletConnect
1. Use mobile wallet apps (Rainbow, Trust Wallet, etc.)
2. Scan QR code or use deep link
3. Approve connection

## 📈 Statistics Display

The dashboard shows:
- **Total Participants**: Number of vesting participants
- **Total Allocated**: Total tokens allocated for vesting
- **Total Unlocked**: Total tokens unlocked so far
- **Remaining Tokens**: Tokens still locked
- **Tax Breakdown**: Current tax rates for all components
- **Contract Status**: Active/Paused state

## 🎛️ Admin Functions

### Vesting Operations
- `createVestingSchedule()`: Create individual vesting
- `createVestingSchedules()`: Bulk creation from CSV
- `earlyRelease()`: Unlock tokens early
- `modifyVestingSchedule()`: Change total allocation
- `updateUnlockedAmountsForUser()`: Gas-efficient single user update
- `updateUnlockedAmounts()`: Update all participants (high gas)

### Tax Management
- `updateTransferTaxRate()`: Set overall tax rate (0-100)
- `updateLPContributionRate()`: LP allocation
- `updateDevelopmentRate()`: Development fee
- `updateMarketingRate()`: Marketing allocation
- `updateBurnRate()`: Burn percentage

### Security Controls
- `pause()`: Pause all transfers
- `unpause()`: Resume transfers
- `burnAdminRights()`: Permanently remove admin access

## 🔍 Participant Lookup

Enhanced participant information includes:
- **Total Vesting Amount**: Original allocation
- **Unlocked Amount**: Currently unlocked tokens
- **Base Balance**: Actual tokens held
- **Transferable Balance**: Tokens that can be transferred
- **Currently Locked**: Tokens still in vesting
- **Vested Amount**: Calculated vested amount
- **Schedule Details**: Start/end times, intervals

## ⚠️ Important Notes

### Gas Optimization
- Use "Update User" for individual participants (low gas)
- Use "Update All Unlocked Amounts" sparingly (high gas)
- Automatic updates occur during transfers

### Tax Rate Limits
- Maximum tax rate: 10% (100/1000)
- Individual components cannot exceed total tax rate
- Zero tax rate is supported

### Vesting Features
- Automatic unlocking (no manual claiming)
- High precision calculations (1e18)
- Inconsistency detection and logging
- 1-year maximum vesting duration

## 🐛 Troubleshooting

### Connection Issues
- Ensure you're on BSC Testnet (chainId: 97)
- Check if MetaMask is installed and unlocked
- Verify you're the contract owner

### Transaction Failures
- Check gas limits and fees
- Ensure sufficient BNB for gas
- Verify input parameters are valid

### Display Issues
- Refresh the page if statistics don't update
- Check browser console for errors
- Ensure JavaScript is enabled

## 🔒 Security Notes

- **Private Keys**: Never share your private key
- **Admin Rights**: Be careful with admin functions
- **Contract Verification**: Always verify contracts on BSCScan
- **Test First**: Test all functions on testnet before mainnet

## 📞 Support

For issues or questions:
1. Check the browser console for error messages
2. Verify contract address and network
3. Ensure wallet connection is active
4. Review transaction history on BSCScan

## 🔄 Version History

- **v2.0.0**: Enhanced balance management, gas optimization, automatic vesting
- **v1.0.0**: Initial release with basic functionality 