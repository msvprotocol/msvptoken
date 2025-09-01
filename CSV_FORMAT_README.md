# MSVP Token CSV Format Guide

## 📋 Overview

This guide explains the CSV format required for bulk vesting schedule creation in the MSVP (MetaSoilVerseProtocol) smart contract.

## 🎯 Contract Specifications

### Token Details
- **Token Name**: MetaSoilVerseProtocol
- **Token Symbol**: MSVP
- **Total Supply**: 100,000,000,000 MSVP tokens
- **Airdrop Supply**: 50,000,000,000 MSVP tokens
- **Decimals**: 18 (standard ERC20)

### Vesting Schedule
- **Cliff Period**: 6 months (180 days)
- **Total Vesting Period**: 61 months
- **Unlock Schedule**:
  - **Phase 1** (Months 7-19): 1.2% every 3 months = 5.2% total
  - **Phase 2** (Months 22-49): 7% every 3 months = 65.2% total
  - **Phase 3** (Months 52-61): 6% every 3 months = 29.6% total

## 📁 CSV File Formats

### 1. Basic Format (Recommended for Production)

**File**: `sample-airdrop.csv`

```csv
address,amount
0x1234567890123456789012345678901234567890,1000000
0x2345678901234567890123456789012345678901,2500000
0x3456789012345678901234567890123456789012,5000000
```

**Columns**:
- `address`: Ethereum/BSC wallet address (42 characters starting with 0x)
- `amount`: Token amount in whole tokens (not wei)

**Notes**:
- The contract automatically converts amounts to wei (× 10^18)
- No additional columns needed
- Simple and clean format

### 2. Detailed Format (For Reference)

**File**: `sample-airdrop-with-vesting-schedule.csv`

```csv
address,amount,cliff_end,phase1_end,phase2_end,phase3_end,vesting_complete
0x1234567890123456789012345678901234567890,1000000,6 months,19 months,49 months,61 months,61 months
```

**Columns**:
- `address`: Wallet address
- `amount`: Token amount
- `cliff_end`: End of cliff period
- `phase1_end`: End of Phase 1
- `phase2_end`: End of Phase 2
- `phase3_end`: End of Phase 3
- `vesting_complete`: Full vesting completion

**Notes**:
- This format is for reference only
- The contract automatically calculates all vesting periods
- Use the basic format for actual contract operations

## 🔧 CSV Requirements

### Format Rules
1. **Header Row**: Must include `address,amount`
2. **Address Format**: Valid Ethereum/BSC address (0x...)
3. **Amount Format**: Whole numbers (no decimals needed)
4. **Encoding**: UTF-8
5. **Delimiter**: Comma (,)
6. **Line Endings**: Unix (LF) or Windows (CRLF)

### Validation Rules
1. **Addresses**: Must be valid 42-character addresses starting with 0x
2. **Amounts**: Must be positive integers
3. **No Duplicates**: Each address should appear only once
4. **No Empty Rows**: Remove any blank lines
5. **No Comments**: Remove comment lines (starting with #)

### Example Valid CSV
```csv
address,amount
0x1234567890123456789012345678901234567890,1000000
0x2345678901234567890123456789012345678901,2500000
0x3456789012345678901234567890123456789012,5000000
```

## 📊 Amount Guidelines

### Recommended Amounts
- **Small Holders**: 1,000,000 - 10,000,000 MSVP
- **Medium Holders**: 10,000,000 - 100,000,000 MSVP
- **Large Holders**: 100,000,000 - 1,000,000,000 MSVP
- **Whales**: 1,000,000,000+ MSVP

### Total Supply Considerations
- **Airdrop Supply**: 50,000,000,000 MSVP
- **Plan Distribution**: Ensure total doesn't exceed supply
- **Buffer**: Leave some tokens for future allocations

## 🚀 Using the CSV

### 1. Contract Function
```solidity
function createVestingSchedules(
    address[] calldata users,
    uint256[] calldata amounts
) external onlyOwner
```

### 2. Admin Dashboard
1. Open `admin-dashboard/index.html`
2. Connect MetaMask wallet
3. Upload CSV file
4. Click "Create Vesting Schedules"
5. Confirm transaction

### 3. Direct Contract Call
```javascript
// Parse CSV and extract arrays
const addresses = ["0x1234...", "0x5678..."];
const amounts = [1000000, 2500000];

// Call contract
await msvpToken.createVestingSchedules(addresses, amounts);
```

## ⚠️ Important Notes

### Gas Considerations
- **Bulk Operations**: High gas usage for large CSV files
- **Batch Size**: Consider splitting very large files
- **Gas Estimation**: Test with small batches first

### Security
- **Owner Only**: Only contract owner can create vesting schedules
- **Validation**: Contract validates addresses and amounts
- **No Overwrite**: Cannot create duplicate schedules for same address

### Vesting Behavior
- **Automatic Start**: Vesting begins immediately upon creation
- **No Manual Claiming**: Tokens unlock automatically
- **Real-time Updates**: Balances update during transfers

## 🔍 Troubleshooting

### Common Issues
1. **Invalid Address**: Check address format (0x + 40 hex chars)
2. **Amount Format**: Ensure amounts are whole numbers
3. **CSV Encoding**: Use UTF-8 encoding
4. **Header Row**: Include `address,amount` header
5. **Empty Lines**: Remove blank rows

### Error Messages
- `"Arrays length mismatch"`: Address and amount arrays have different lengths
- `"Empty arrays"`: CSV file is empty
- `"Invalid user address"`: Address is zero address
- `"Amount must be greater than zero"`: Amount is 0 or negative
- `"Vesting schedule already exists"`: Address already has a vesting schedule

## 📈 Example Calculations

### Sample Participant: 1,000,000 MSVP
- **Cliff Period** (Months 0-6): 0 MSVP unlocked
- **Phase 1** (Months 7-19): 52,000 MSVP unlocked (5.2%)
- **Phase 2** (Months 22-49): 652,000 MSVP unlocked (65.2%)
- **Phase 3** (Months 52-61): 296,000 MSVP unlocked (29.6%)
- **Total**: 1,000,000 MSVP unlocked by month 61

### Monthly Unlock Schedule
- **Month 7**: 12,000 MSVP (1.2%)
- **Month 10**: 12,000 MSVP (1.2%)
- **Month 13**: 12,000 MSVP (1.2%)
- **Month 16**: 12,000 MSVP (1.2%)
- **Month 19**: 4,000 MSVP (0.4%)
- **Month 22**: 70,000 MSVP (7%)
- **Month 25**: 70,000 MSVP (7%)
- **Month 28**: 70,000 MSVP (7%)
- **Month 31**: 70,000 MSVP (7%)
- **Month 34**: 70,000 MSVP (7%)
- **Month 37**: 70,000 MSVP (7%)
- **Month 40**: 70,000 MSVP (7%)
- **Month 43**: 70,000 MSVP (7%)
- **Month 46**: 70,000 MSVP (7%)
- **Month 49**: 72,000 MSVP (7.2%)
- **Month 52**: 60,000 MSVP (6%)
- **Month 55**: 60,000 MSVP (6%)
- **Month 58**: 60,000 MSVP (6%)
- **Month 61**: 116,000 MSVP (11.6%)

## 📞 Support

For questions about CSV format or vesting schedules:
1. Check the main README.md
2. Review the test files for examples
3. Check the admin dashboard documentation
4. Review the contract code for validation rules

---

*Last Updated: $(date)*  
*Contract Version: MSVP v1.0*  
*CSV Format Version: 1.0.0* 