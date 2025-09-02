# MSV Token Vesting - BSCScan Interaction Guide

## Contract Overview
The MSV Token Vesting contract is an integrated BEP20 token with built-in vesting functionality. It combines token transfer capabilities with automatic vesting schedules, allowing users to see their total balance (including locked tokens) while only being able to transfer their unlocked amount.



##  READ FUNCTIONS (No Gas Required)

### Token Information
```
name() → string
```
**What it does**: Returns the token name "MetaSoilVerse"
**BSCScan**: Click "Read" button - no parameters needed

```
symbol() → string
```
**What it does**: Returns the token symbol "MSV"
**BSCScan**: Click "Read" button - no parameters needed

```
decimals() → uint8
```
**What it does**: Returns token decimals (18)
**BSCScan**: Click "Read" button - no parameters needed

```
totalSupply() → uint256
```
**What it does**: Returns total token supply (100 billion tokens)
**BSCScan**: Click "Read" button - no parameters needed

### Balance Functions
```
balanceOf(address account) → uint256
```
**What it does**: Returns total balance including locked vesting tokens
**BSCScan**: 
1. Enter user's wallet address in the `account` field
2. Click "Query" button
3. Result shows total tokens (base balance + locked vesting tokens)

```
transferableBalance(address account) → uint256
```
**What it does**: Returns only the transferable balance (base balance + unlocked tokens)
**BSCScan**:
1. Enter user's wallet address in the `account` field
2. Click "Query" button
3. Result shows how many tokens the user can actually transfer

### Vesting Schedule Information
```
getVestingSchedule(address user) → (uint256 totalAmount, uint256 unlockedAmount, uint256 startTime, uint256 endTime, uint256 releaseInterval, bool isActive, bool isAirdrop, uint256 currentUnlockedAmount, uint256 lockedAmount)
```
**What it does**: Returns complete vesting information for a user
**BSCScan**:
1. Enter user's wallet address in the `user` field
2. Click "Query" button
3. Results show:
   - `totalAmount`: Total tokens in vesting schedule
   - `unlockedAmount`: Manually unlocked tokens (from early release)
   - `startTime`: When vesting started (Unix timestamp)
   - `endTime`: When vesting ends (Unix timestamp)
   - `releaseInterval`: Time between releases (in seconds)
   - `isActive`: Whether vesting is active
   - `isAirdrop`: Whether this was an airdrop vesting
   - `currentUnlockedAmount`: Time-based unlocked tokens
   - `lockedAmount`: Currently locked tokens

```
getVestedAmount(address user) → uint256
```
**What it does**: Returns time-based vested amount (calculated automatically)
**BSCScan**:
1. Enter user's wallet address in the `user` field
2. Click "Query" button
3. Result shows tokens unlocked based on time elapsed

```
getUnlockedAmount(address user) → uint256
```
**What it does**: Returns total unlocked amount (time-based + early release)
**BSCScan**:
1. Enter user's wallet address in the `user` field
2. Click "Query" button
3. Result shows all unlocked tokens

```
getLockedAmount(address user) → uint256
```
**What it does**: Returns currently locked tokens
**BSCScan**:
1. Enter user's wallet address in the `user` field
2. Click "Query" button
3. Result shows tokens still locked in vesting

```
getRemainingLockedAmount(address user) → uint256
```
**What it does**: Returns remaining locked tokens (total - unlocked)
**BSCScan**:
1. Enter user's wallet address in the `user` field
2. Click "Query" button
3. Result shows tokens still to be unlocked

### Tax Information
```
getTaxBreakdown() → (uint256 transferTax, uint256 lpContribution, uint256 development, uint256 marketing, uint256 burn)
```
**What it does**: Returns current tax rates and breakdown
**BSCScan**: Click "Query" button - no parameters needed
**Results**:
- `transferTax`: Total transfer tax rate (basis points)
- `lpContribution`: LP contribution rate
- `development`: Development fee rate
- `marketing`: Marketing fee rate
- `burn`: Burn rate

```
transferTaxRate() → uint256
```
**What it does**: Returns current transfer tax rate
**BSCScan**: Click "Query" button - no parameters needed

```
maxTxAmount() → uint256
```
**What it does**: Returns maximum transaction amount
**BSCScan**: Click "Query" button - no parameters needed

### Wallet Addresses
```
lpWallet() → address
```
**What it does**: Returns LP wallet address
**BSCScan**: Click "Query" button - no parameters needed

```
marketingWallet() → address
```
**What it does**: Returns marketing wallet address
**BSCScan**: Click "Query" button - no parameters needed

```
developmentWallet() → address
```
**What it does**: Returns development wallet address
**BSCScan**: Click "Query" button - no parameters needed

```
owner() → address
```
**What it does**: Returns contract owner address
**BSCScan**: Click "Query" button - no parameters needed

### Vesting Statistics
```
getVestingStats() → (uint256 totalParticipants, uint256 totalAllocatedTokens, uint256 totalUnlockedTokens, uint256 remainingTokens, bool isVestingStarted)
```
**What it does**: Returns overall vesting statistics
**BSCScan**: Click "Query" button - no parameters needed
**Results**:
- `totalParticipants`: Number of users with vesting schedules
- `totalAllocatedTokens`: Total tokens allocated to vesting
- `totalUnlockedTokens`: Total tokens unlocked so far
- `remainingTokens`: Tokens still locked
- `isVestingStarted`: Whether vesting period has started

```
getAllParticipants() → address[]
```
**What it does**: Returns array of all participant addresses
**BSCScan**: Click "Query" button - no parameters needed

```
getParticipantCount() → uint256
```
**What it does**: Returns number of participants
**BSCScan**: Click "Query" button - no parameters needed

```
isParticipant(address) → bool
```
**What it does**: Checks if an address is a vesting participant
**BSCScan**:
1. Enter address to check in the parameter field
2. Click "Query" button
3. Returns true if address has vesting schedule

### Tax Exclusions
```
isExcludedFromTax(address) → bool
```
**What it does**: Checks if address is excluded from transfer tax
**BSCScan**:
1. Enter address to check
2. Click "Query" button

```
isExcludedFromMaxTx(address) → bool
```
**What it does**: Checks if address is excluded from max transaction limit
**BSCScan**:
1. Enter address to check
2. Click "Query" button



## ⚡ WRITE FUNCTIONS (Requires Gas & Owner Access)

### Vesting Management (Owner Only)

```
startVesting()
```
**What it does**: Starts the vesting period (can only be called once)
**BSCScan**:
1. Connect owner wallet
2. Click "Write" button
3. Confirm transaction
**Note**: This enables vesting functionality

```
createVestingSchedule(address user, uint256 amount, uint256 releaseInterval)
```
**What it does**: Creates vesting schedule for a single user
**BSCScan**:
1. Connect owner wallet
2. Enter parameters:
   - `user`: User's wallet address
   - `amount`: Token amount (in wei, 18 decimals)
   - `releaseInterval`: Release interval in seconds (30, 60, 90, 120, or 180 days)
3. Click "Write" button
4. Confirm transaction

```
createVestingSchedules(address[] users, uint256[] amounts, uint256 releaseInterval)
```
**What it does**: Creates multiple vesting schedules from CSV data
**BSCScan**:
1. Connect owner wallet
2. Enter parameters:
   - `users`: Array of wallet addresses
   - `amounts`: Array of token amounts (matching users array)
   - `releaseInterval`: Release interval in seconds
3. Click "Write" button
4. Confirm transaction

```
earlyRelease(address user, uint256 amount)
```
**What it does**: Manually unlocks tokens for a user before scheduled time
**BSCScan**:
1. Connect owner wallet
2. Enter parameters:
   - `user`: User's wallet address
   - `amount`: Amount to unlock early (in wei)
3. Click "Write" button
4. Confirm transaction

```
modifyVestingSchedule(address user, uint256 newAmount)
```
**What it does**: Modifies total allocation for a user's vesting schedule
**BSCScan**:
1. Connect owner wallet
2. Enter parameters:
   - `user`: User's wallet address
   - `newAmount`: New total amount (in wei)
3. Click "Write" button
4. Confirm transaction

```
updateUnlockedAmounts()
```
**What it does**: Updates unlocked amounts for all participants (called automatically on transfers)
**BSCScan**:
1. Connect any wallet
2. Click "Write" button
3. Confirm transaction
**Note**: This is usually called automatically, but can be called manually

### Tax Management (Owner Only)

```
updateTransferTaxRate(uint256 newTaxRate)
```
**What it does**: Updates the transfer tax rate (max 25 = 2.5%)
**BSCScan**:
1. Connect owner wallet
2. Enter new tax rate (0-25, where 25 = 2.5%)
3. Click "Write" button
4. Confirm transaction

```
updateLPContributionRate(uint256 newRate)
```
**What it does**: Updates LP contribution rate
**BSCScan**:
1. Connect owner wallet
2. Enter new rate (must not exceed total tax rate)
3. Click "Write" button
4. Confirm transaction

```
updateDevelopmentRate(uint256 newRate)
```
**What it does**: Updates development fee rate
**BSCScan**:
1. Connect owner wallet
2. Enter new rate (must not exceed total tax rate)
3. Click "Write" button
4. Confirm transaction

```
updateMarketingRate(uint256 newRate)
```
**What it does**: Updates marketing fee rate
**BSCScan**:
1. Connect owner wallet
2. Enter new rate (must not exceed total tax rate)
3. Click "Write" button
4. Confirm transaction

```
updateBurnRate(uint256 newRate)
```
**What it does**: Updates burn rate
**BSCScan**:
1. Connect owner wallet
2. Enter new rate (must not exceed total tax rate)
3. Click "Write" button
4. Confirm transaction

### Wallet Management (Owner Only)

```
updateLPWallet(address newWallet)
```
**What it does**: Updates LP wallet address
**BSCScan**:
1. Connect owner wallet
2. Enter new wallet address
3. Click "Write" button
4. Confirm transaction

```
updateMarketingWallet(address newWallet)
```
**What it does**: Updates marketing wallet address
**BSCScan**:
1. Connect owner wallet
2. Enter new wallet address
3. Click "Write" button
4. Confirm transaction

```
updateDevelopmentWallet(address newWallet)
```
**What it does**: Updates development wallet address
**BSCScan**:
1. Connect owner wallet
2. Enter new wallet address
3. Click "Write" button
4. Confirm transaction

### Exclusion Management (Owner Only)

```
setTaxExclusion(address account, bool excluded)
```
**What it does**: Excludes/includes address from transfer tax
**BSCScan**:
1. Connect owner wallet
2. Enter parameters:
   - `account`: Address to modify
   - `excluded`: true to exclude, false to include
3. Click "Write" button
4. Confirm transaction

```
setMaxTxExclusion(address account, bool excluded)
```
**What it does**: Excludes/includes address from max transaction limit
**BSCScan**:
1. Connect owner wallet
2. Enter parameters:
   - `account`: Address to modify
   - `excluded`: true to exclude, false to include
3. Click "Write" button
4. Confirm transaction

### Transaction Limits (Owner Only)

```
updateMaxTxAmount(uint256 newAmount)
```
**What it does**: Updates maximum transaction amount
**BSCScan**:
1. Connect owner wallet
2. Enter new amount (in wei)
3. Click "Write" button
4. Confirm transaction

### Pause/Unpause (Owner Only)

```
pause()
```
**What it does**: Pauses all token transfers
**BSCScan**:
1. Connect owner wallet
2. Click "Write" button
3. Confirm transaction

```
unpause()
```
**What it does**: Resumes token transfers
**BSCScan**:
1. Connect owner wallet
2. Click "Write" button
3. Confirm transaction

### Admin Rights (Owner Only)

```
burnAdminRights()
```
**What it does**: Permanently removes owner privileges (irreversible)
**BSCScan**:
1. Connect owner wallet
2. Click "Write" button
3. Confirm transaction
** WARNING**: This is irreversible!



## 🔄 STANDARD ERC20 FUNCTIONS

### Transfer Functions (Any User)

```
transfer(address to, uint256 amount)
```
**What it does**: Transfers tokens to another address
**BSCScan**:
1. Connect your wallet
2. Enter parameters:
   - `to`: Recipient address
   - `amount`: Amount to transfer (in wei)
3. Click "Write" button
4. Confirm transaction

```
approve(address spender, uint256 amount)
```
**What it does**: Approves another address to spend your tokens
**BSCScan**:
1. Connect your wallet
2. Enter parameters:
   - `spender`: Address to approve
   - `amount`: Amount to approve (in wei)
3. Click "Write" button
4. Confirm transaction

```
transferFrom(address from, address to, uint256 amount)
```
**What it does**: Transfers tokens on behalf of another address (requires approval)
**BSCScan**:
1. Connect your wallet
2. Enter parameters:
   - `from`: Address to transfer from
   - `to`: Recipient address
   - `amount`: Amount to transfer (in wei)
3. Click "Write" button
4. Confirm transaction

### Allowance Functions (Read Only)

```
allowance(address owner, address spender) → uint256
```
**What it does**: Returns approved spending amount
**BSCScan**:
1. Enter parameters:
   - `owner`: Token owner address
   - `spender`: Approved spender address
2. Click "Query" button



##  COMMON OPERATIONS

### For Token Holders:
1. **Check Balance**: Use `balanceOf()` to see total tokens
2. **Check Transferable**: Use `transferableBalance()` to see what you can transfer
3. **Check Vesting**: Use `getVestingSchedule()` to see your vesting details
4. **Transfer Tokens**: Use `transfer()` to send tokens

### For Contract Owner:
1. **Start Vesting**: Call `startVesting()` once
2. **Create Schedules**: Use `createVestingSchedules()` for bulk airdrops
3. **Early Release**: Use `earlyRelease()` to unlock tokens early
4. **Modify Tax**: Use tax update functions to adjust rates
5. **Pause/Unpause**: Use pause functions for emergency stops

### For Developers:
1. **Monitor Events**: Watch for vesting events on BSCScan
2. **Check Statistics**: Use `getVestingStats()` for overview
3. **Verify Participants**: Use `isParticipant()` to check addresses



##  IMPORTANT NOTES

1. **Gas Fees**: All write operations require BNB for gas fees
2. **Owner Only**: Many functions require owner wallet connection
3. **Wei Values**: All amounts are in wei (18 decimals)
4. **Time Values**: All time values are Unix timestamps
5. **Tax Rates**: Tax rates are in basis points (100 = 1%)
6. **Irreversible**: Some operations like `burnAdminRights()` cannot be undone



## 🆘 TROUBLESHOOTING

**"Insufficient transferable balance"**: User is trying to transfer more than their unlocked amount
**"No active vesting schedule"**: Address doesn't have a vesting schedule
**"Ownable: caller is not the owner"**: Function requires owner wallet
**"Tax rate too high"**: Tax rate exceeds maximum (25 = 2.5%)
**"Transfer amount exceeds max transaction limit"**: Amount is too large for current limit 