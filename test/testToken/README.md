# MSVP Testnet Token - Testing Guide

## Overview

The `MSVPTest.sol` contract is an **ultra-fast testnet version** of the MSVP token with integrated vesting functionality. This version uses accelerated timing (minutes instead of months) to enable rapid testing of the complete vesting lifecycle on testnet.

## Key Features

### **Ultra-Fast Testnet Timing**
- **Cliff Period**: 1 minute (instead of 6 months)
- **Time Scale**: 1 minute = 1 "month" for vesting calculations
- **Total Vesting**: 61 minutes (instead of 61 months)
- **Phase Unlocks**: Every 3 minutes (instead of every 3 months)

### **Vesting Phases**
1. **Phase 1 (Minutes 2-19)**: 1.2% unlocks every 3 minutes
2. **Phase 2 (Minutes 22-49)**: 7% unlocks every 3 minutes  
3. **Phase 3 (Minutes 52-61)**: 6% unlocks every 3 minutes

### **Token Features**
- **Total Supply**: 100 billion MSVP tokens
- **Transfer Tax**: 5% (configurable)
- **Max Transaction**: 1% of total supply
- **Tax Distribution**: LP, Development, Marketing, Burn

## Setup & Deployment

### **Prerequisites**
```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile
```

### **Deploy to Testnet**
```bash
# Deploy to BSC Testnet
npx hardhat run scripts/deploy-bsc-testnet.js --network bsc-testnet

# Deploy to local testnet
npx hardhat run scripts/deploy.js --network localhost
```

### **Environment Variables**
Create `.env` file with your testnet configuration:
```env
PRIVATE_KEY=your_private_key_here
BSCSCAN_API_KEY=your_bscscan_api_key
BSC_TESTNET_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
```

## Testing the Testnet Token

### **1. Basic Token Testing**

#### **Check Token Supply**
```javascript
// Verify total supply
const totalSupply = await msvpToken.TOTAL_SUPPLY();
console.log("Total Supply:", ethers.formatEther(totalSupply));

// Check owner balance
const ownerBalance = await msvpToken.balanceOf(owner.address);
console.log("Owner Balance:", ethers.formatEther(ownerBalance));
```

#### **Test Transfer with Tax**
```javascript
// Transfer tokens (5% tax will be applied)
const transferAmount = ethers.parseEther("1000");
await msvpToken.transfer(recipient.address, transferAmount);

// Check balances after tax
const recipientBalance = await msvpToken.balanceOf(recipient.address);
const ownerBalanceAfter = await msvpToken.balanceOf(owner.address);
console.log("Recipient received:", ethers.formatEther(recipientBalance));
console.log("Owner balance after:", ethers.formatEther(ownerBalanceAfter));
```

### **2. Vesting Schedule Testing**

#### **Create Vesting Schedule**
```javascript
// Create vesting for a user
const vestingAmount = ethers.parseEther("10000");
await msvpToken.createVestingSchedule(user.address, vestingAmount);

// Check vesting schedule
const schedule = await msvpToken.getVestingSchedule(user.address);
console.log("Vesting Schedule:", {
    totalAmount: ethers.formatEther(schedule.totalAmount),
    startTime: new Date(schedule.startTime * 1000),
    endTime: new Date(schedule.endTime * 1000),
    isActive: schedule.isActive
});
```

#### **Test Cliff Period (1 minute)**
```javascript
// Check locked amount during cliff
const lockedAmount = await msvpToken.getLockedAmount(user.address);
console.log("Locked during cliff:", ethers.formatEther(lockedAmount));

// Wait for cliff to end (1 minute)
await network.provider.send("evm_increaseTime", [60]); // 60 seconds
await network.provider.mine();

// Check if tokens start unlocking
const unlockedAfterCliff = await msvpToken.getUnlockedAmount(user.address);
console.log("Unlocked after cliff:", ethers.formatEther(unlockedAfterCliff));
```

#### **Test Phase Unlocks (Every 3 minutes)**
```javascript
// Wait for first phase unlock (minute 2)
await network.provider.send("evm_increaseTime", [60]); // +1 minute
await network.provider.mine();

// Update unlocked amounts
await msvpToken.updateUnlockedAmountsForUser(user.address);

// Check unlocked amount
const unlockedAmount = await msvpToken.getUnlockedAmount(user.address);
console.log("Unlocked at minute 2:", ethers.formatEther(unlockedAmount));

// Wait for next unlock (minute 5)
await network.provider.send("evm_increaseTime", [180]); // +3 minutes
await network.provider.mine();
await msvpToken.updateUnlockedAmountsForUser(user.address);
```

### **3. Advanced Vesting Testing**

#### **Test Emergency Functions**
```javascript
// Emergency unlock all tokens
await msvpToken.emergencyUnlockAll(user.address);

// Check if all tokens are unlocked
const unlockedAfterEmergency = await msvpToken.getUnlockedAmount(user.address);
const totalAmount = await msvpToken.getVestingSchedule(user.address).totalAmount;
console.log("Emergency unlock successful:", unlockedAfterEmergency.eq(totalAmount));
```

#### **Test Vesting Management**
```javascript
// Deactivate vesting schedule
await msvpToken.deactivateVestingSchedule(user.address);

// Reactivate vesting schedule
await msvpToken.reactivateVestingSchedule(user.address);

// Modify vesting amount
const newAmount = ethers.parseEther("15000");
await msvpToken.modifyVestingSchedule(user.address, newAmount);
```

### **4. Tax System Testing**

#### **Test Tax Exclusions**
```javascript
// Exclude address from tax
await msvpToken.setTaxExclusion(excludedAddress, true);

// Transfer without tax
const transferAmount = ethers.parseEther("1000");
await msvpToken.transfer(excludedAddress, transferAmount);

// Verify no tax was applied
const balance = await msvpToken.balanceOf(excludedAddress);
console.log("Balance without tax:", ethers.formatEther(balance));
```

#### **Test Tax Distribution**
```javascript
// Check tax breakdown
const taxBreakdown = await msvpToken.getTaxBreakdown();
console.log("Tax Breakdown:", {
    transferTax: taxBreakdown.transferTax,
    lpContribution: taxBreakdown.lpContribution,
    development: taxBreakdown.development,
    marketing: taxBreakdown.marketing,
    burn: taxBreakdown.burn
});

// Check wallet balances
const lpBalance = await msvpToken.balanceOf(lpWallet.address);
const devBalance = await msvpToken.balanceOf(developmentWallet.address);
const marketingBalance = await msvpToken.balanceOf(marketingWallet.address);
```

## Testing Timeline

### **Complete Vesting Test (61 minutes)**
```javascript
// Fast-forward through complete vesting
const totalMinutes = 61;
for (let minute = 0; minute <= totalMinutes; minute++) {
    // Increase time by 1 minute
    await network.provider.send("evm_increaseTime", [60]);
    await network.provider.mine();
    
    // Update unlocked amounts
    await msvpToken.updateUnlockedAmountsForUser(user.address);
    
    // Check progress
    const unlocked = await msvpToken.getUnlockedAmount(user.address);
    const locked = await msvpToken.getLockedAmount(user.address);
    const total = await msvpToken.getVestingSchedule(user.address).totalAmount;
    
    console.log(`Minute ${minute}:`, {
        unlocked: ethers.formatEther(unlocked),
        locked: ethers.formatEther(locked),
        progress: `${(Number(unlocked) / Number(total) * 100).toFixed(2)}%`
    });
}
```

## Configuration Testing

### **Update Tax Rates**
```javascript
// Update transfer tax rate
await msvpToken.updateTransferTaxRate(30); // 3%

// Update component rates
await msvpToken.updateLPContributionRate(10); // 1%
await msvpToken.updateDevelopmentRate(10); // 1%
await msvpToken.updateMarketingRate(5); // 0.5%
await msvpToken.updateBurnRate(5); // 0.5%
```

### **Update Wallets**
```javascript
// Update LP wallet
await msvpToken.updateLPWallet(newLpWallet.address);

// Update development wallet
await msvpToken.updateDevelopmentWallet(newDevWallet.address);

// Update marketing wallet
await msvpToken.updateMarketingWallet(newMarketingWallet.address);
```

## Emergency Functions

### **Pause/Unpause**
```javascript
// Pause all transfers
await msvpToken.pause();

// Try to transfer (should fail)
await expect(
    msvpToken.transfer(recipient.address, ethers.parseEther("100"))
).to.be.revertedWith("Pausable: paused");

// Unpause transfers
await msvpToken.unpause();
```

### **Burn Admin Rights**
```javascript
// Burn admin rights (irreversible!)
await msvpToken.burnAdminRights();

// Try admin function (should fail)
await expect(
    msvpToken.createVestingSchedule(user.address, ethers.parseEther("1000"))
).to.be.revertedWith("Ownable: caller is not the owner");
```

## Monitoring & Verification

### **Check Vesting Statistics**
```javascript
const stats = await msvpToken.getVestingStats();
console.log("Vesting Statistics:", {
    totalParticipants: stats.totalParticipants,
    totalAllocated: ethers.formatEther(stats.totalAllocatedTokens),
    totalUnlocked: ethers.formatEther(stats.totalUnlockedTokens),
    remaining: ethers.formatEther(stats.remainingTokens),
    isStarted: stats.isVestingStarted
});
```

### **Check Participant List**
```javascript
const participants = await msvpToken.getAllParticipants();
const participantCount = await msvpToken.getParticipantCount();

console.log("Total Participants:", participantCount);
participants.forEach((participant, index) => {
    console.log(`Participant ${index + 1}:`, participant);
});
```

## Important Notes

### **Testnet vs Production**
- **This contract is for TESTNET ONLY**
- **Timing is accelerated for testing purposes**
- **Production deployment should use the main MSVP.sol contract**

### **Gas Optimization**
- Use `updateUnlockedAmountsForUser()` for single users
- Use `updateUnlockedAmounts()` for bulk updates (gas expensive)
- Consider gas limits when testing on public testnets

### **Time Manipulation**
- Use `evm_increaseTime` for local testing
- On public testnets, wait for actual time to pass
- Remember: 1 minute = 1 "month" in this testnet version

## Testing Checklist

- [ ] Token deployment and initial supply
- [ ] Basic transfers with tax calculation
- [ ] Tax distribution to wallets
- [ ] Vesting schedule creation
- [ ] Cliff period enforcement (1 minute)
- [ ] Phase 1 unlocks (minutes 2, 5, 8, 11, 14, 17)
- [ ] Phase 2 unlocks (minutes 22, 25, 28, 31, 34, 37, 40, 43, 46, 49)
- [ ] Phase 3 unlocks (minutes 52, 55, 58, 61)
- [ ] Emergency functions (early release, emergency unlock)
- [ ] Vesting management (deactivate, reactivate, modify)
- [ ] Tax exclusions and max transaction limits
- [ ] Admin functions and access control
- [ ] Pause/unpause functionality
- [ ] Complete vesting lifecycle (61 minutes)

## Troubleshooting

### **Common Issues**
1. **"Insufficient transferable balance"**: User hasn't unlocked tokens yet
2. **"No active vesting schedule"**: User doesn't have a vesting schedule
3. **"Transfer amount exceeds max transaction limit"**: Amount too large
4. **"Pausable: paused"**: Contract is paused

### **Debug Commands**
```javascript
// Check user's vesting status
const schedule = await msvpToken.getVestingSchedule(user.address);
const locked = await msvpToken.getLockedAmount(user.address);
const unlocked = await msvpToken.getUnlockedAmount(user.address);
const transferable = await msvpToken.transferableBalance(user.address);

console.log("User Status:", {
    hasSchedule: schedule.startTime > 0,
    isActive: schedule.isActive,
    locked: ethers.formatEther(locked),
    unlocked: ethers.formatEther(unlocked),
    transferable: ethers.formatEther(transferable)
});
```

## Additional Resources

- **Main Contract**: `contracts/MSVP.sol` (production version)
- **Test Files**: `test/MSVP_Updated.test.js` (comprehensive tests)
- **Deployment Scripts**: `scripts/deploy-*.js`
- **Hardhat Config**: `hardhat.config.js`

---

**Happy Testing!**

This testnet version allows you to test the complete MSVP token functionality in just over 1 hour instead of waiting for actual months. Perfect for rapid development and testing iterations! 