// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";


/**
 * @title MSVTokenVesting
 * @dev MetaSoilVerse Token with integrated vesting functionality based on precise tokenomics schedule
 * Locked tokens are visible in balance but non-transferable
 */
contract MSVP is ERC20, Ownable, ReentrancyGuard, Pausable {
    // Token configuration
    uint256 public constant TOTAL_SUPPLY = 100_000_000_000 * 10**18; // 100 billion tokens
    uint256 public constant AIRDROP_SUPPLY = 50_000_000_000 * 10**18; // 50 billion tokens for airdrop
    uint256 public constant MAX_TAX_RATE = 100; // Maximum 10% tax
    uint256 public constant TAX_DENOMINATOR = 1000; // Tax precision (0.1%)
    
    // Transfer tax configuration
    uint256 public transferTaxRate = 50; // 5% transfer tax
    uint256 public lpContributionRate = 20; // 2% to LP
    uint256 public developmentRate = 15; // 1.5% development fee
    uint256 public marketingRate = 10; // 1% marketing
    uint256 public burnRate = 5; // 0.5% burn
    
    // Addresses
    address public lpWallet;
    address public marketingWallet;
    address public developmentWallet;
    
    // Excluded addresses from tax
    mapping(address => bool) public isExcludedFromTax;
    mapping(address => bool) public isExcludedFromMaxTx;
    
    // Max transaction limit
    uint256 public maxTxAmount = TOTAL_SUPPLY / 100; // 1% of total supply
    
    // Vesting configuration based on tokenomics schedule
    uint256 public constant CLIFF_DURATION = 180 days; // 6 months cliff
    uint256 public constant FIRST_YEAR_UNLOCK_PERCENTAGE = 12; // 1.2% (12/1000)
    uint256 public constant POST_Q5_UNLOCK_PERCENTAGE = 70; // 7% (70/1000)
    uint256 public constant FINAL_UNLOCK_PERCENTAGE = 60; // 6% (60/1000)
    
    // Vesting schedule per user
    struct VestingSchedule {
        uint256 totalAmount;           // Total tokens allocated for vesting
        uint256 unlockedAmount;        // Amount already unlocked
        uint256 startTime;             // Vesting start time (TGE)
        uint256 endTime;               // Vesting end time
        bool isActive;                 // Whether vesting is active
        bool isAirdrop;                // Whether this is from airdrop
    }
    
    // Mapping from user address to vesting schedule
    mapping(address => VestingSchedule) public vestingSchedules;
    
    // Arrays to track all participants
    address[] public participants;
    mapping(address => bool) public isParticipant;
    
    // Admin controls
    uint256 public totalAllocated = 0;
    uint256 public totalUnlocked = 0;
    
    // Events
    event TransferTaxUpdated(uint256 newTaxRate);
    event LPContributionRateUpdated(uint256 newRate);
    event DevelopmentRateUpdated(uint256 newRate);
    event MarketingRateUpdated(uint256 newRate);
    event BurnRateUpdated(uint256 newRate);
    event LPWalletUpdated(address newWallet);
    event MarketingWalletUpdated(address newWallet);
    event DevelopmentWalletUpdated(address newWallet);
    event MaxTxAmountUpdated(uint256 newAmount);
    event TaxExclusionUpdated(address account, bool excluded);
    event MaxTxExclusionUpdated(address account, bool excluded);
    
    // Vesting events
    event VestingScheduleCreated(address indexed user, uint256 amount, uint256 startTime, uint256 endTime);
    event TokensUnlocked(address indexed user, uint256 amount, uint256 timestamp);
    event VestingScheduleModified(address indexed user, uint256 newAmount, uint256 timestamp);
    event VestingPaused(uint256 timestamp);
    event VestingUnpaused(uint256 timestamp);
    event EarlyRelease(address indexed user, uint256 amount, uint256 timestamp);
    event EmergencyUnlockAll(address indexed user, uint256 amount, uint256 timestamp);
    event VestingScheduleDeactivated(address indexed user, uint256 timestamp);
    event VestingScheduleReactivated(address indexed user, uint256 timestamp);
    event VestingScheduleCancelled(address indexed user, uint256 lockedAmount, uint256 timestamp);
    event AirdropStatusToggled(address indexed user, bool isAirdrop, uint256 timestamp);
    event VestingScheduleCompleted(address indexed user, uint256 totalAmount, uint256 timestamp);
    event VestingInconsistencyDetected(address indexed user, uint256 recordedAmount, uint256 calculatedAmount, uint256 timestamp);
    event TokensTransferredForVesting(address indexed user, uint256 amount, uint256 timestamp);

    
    constructor(
        address _lpWallet,
        address _marketingWallet,
        address _developmentWallet
    ) ERC20("MetaSoilVerseProtocol", "MSVP") {
        require(_lpWallet != address(0), "Invalid LP wallet");
        require(_marketingWallet != address(0), "Invalid marketing wallet");
        require(_developmentWallet != address(0), "Invalid development wallet");
        
        lpWallet = _lpWallet;
        marketingWallet = _marketingWallet;
        developmentWallet = _developmentWallet;
        
        // Exclude owner and contract from tax
        isExcludedFromTax[msg.sender] = true;
        isExcludedFromTax[address(this)] = true;
        
        // Exclude owner and contract from max transaction limit
        isExcludedFromMaxTx[msg.sender] = true;
        isExcludedFromMaxTx[address(this)] = true;
        
        // Mint total supply to owner
        _mint(msg.sender, TOTAL_SUPPLY);
    }
    
    /**
     * @dev Override balanceOf to include locked tokens (for display purposes)
     */
    function balanceOf(address account) public view override returns (uint256) {
        uint256 baseBalance = super.balanceOf(account);
        uint256 lockedAmount = getLockedAmount(account);
        return baseBalance + lockedAmount;
    }
    
    /**
     * @dev Get base balance (actual tokens held, excluding locked tokens)
     */
    function baseBalanceOf(address account) public view returns (uint256) {
        return super.balanceOf(account);
    }
    
    /**
     * @dev Get transferable balance (base balance + unlocked tokens)
     * For vesting participants, only unlocked tokens are transferable
     */
    function transferableBalance(address account) public view returns (uint256) {
        if (isParticipant[account]) {
            // For vesting participants, only unlocked tokens are transferable
            return getUnlockedAmount(account);
        } else {
            // For non-participants, full balance is transferable
            uint256 baseBalance = super.balanceOf(account);
            return baseBalance;
        }
    }
    
    /**
     * @dev Override transfer to include vesting logic and tax
     */
    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override whenNotPaused {

        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");
        require(amount > 0, "Transfer amount must be greater than zero");
        
        // Update unlocked amounts for both addresses if they are participants
        if (isParticipant[from]) {
            updateUnlockedAmountsForUser(from);
        }
        if (isParticipant[to]) {
            updateUnlockedAmountsForUser(to);
        }
        
        // Check transferable balance
        uint256 transferable = transferableBalance(from);
        require(transferable >= amount, "Insufficient transferable balance");
        
        // Check max transaction limit (unless excluded)
        if (!isExcludedFromMaxTx[from] && !isExcludedFromMaxTx[to]) {
            require(amount <= maxTxAmount, "Transfer amount exceeds max transaction limit");
        }
        
        // Calculate tax
        uint256 taxAmount = 0;
        if (transferTaxRate > 0 && !isExcludedFromTax[from] && !isExcludedFromTax[to]) {
            taxAmount = (amount * transferTaxRate) / TAX_DENOMINATOR;
        }
        
        uint256 transferAmount = amount - taxAmount;
        

        

        
        // Transfer tokens to recipient (amount minus tax)
        super._transfer(from, to, transferAmount);
        
        // Transfer tax to contract if applicable
        if (taxAmount > 0) {
            super._transfer(from, address(this), taxAmount);
            _distributeTaxes(taxAmount);
        }
    }
    
    /**
     * @dev Distribute transfer taxes to different wallets
     */
    function _distributeTaxes(uint256 taxAmount) internal {
        // Only distribute if tax amount is greater than 0
        if (taxAmount == 0) {
            return;
        }
        
        uint256 remainingTax = taxAmount;
        
        // LP contribution
        if (lpContributionRate > 0) {
            uint256 lpAmount = (taxAmount * lpContributionRate) / transferTaxRate;
            if (lpAmount > 0) {
                super._transfer(address(this), lpWallet, lpAmount);
                remainingTax -= lpAmount;
            }
        }
        
        // Development fee
        if (developmentRate > 0) {
            uint256 developmentAmount = (taxAmount * developmentRate) / transferTaxRate;
            if (developmentAmount > 0) {
                super._transfer(address(this), developmentWallet, developmentAmount);
                remainingTax -= developmentAmount;
            }
        }
        
        // Marketing
        if (marketingRate > 0) {
            uint256 marketingAmount = (taxAmount * marketingRate) / transferTaxRate;
            if (marketingAmount > 0) {
                super._transfer(address(this), marketingWallet, marketingAmount);
                remainingTax -= marketingAmount;
            }
        }
        
        // Burn remaining tax
        if (burnRate > 0 && remainingTax > 0) {
            _burn(address(this), remainingTax);
        }
    }
    
    // Vesting Functions
    
    /**
     * @dev Create vesting schedule for a single user
     */
    function createVestingSchedule(
        address user,
        uint256 amount
    ) external onlyOwner {
        require(user != address(0), "Invalid user address");
        require(amount > 0, "Amount must be greater than zero");
        require(!vestingSchedules[user].isActive, "Vesting schedule already exists");
        
        // ✅ FIX: Transfer tokens to user first
        require(balanceOf(msg.sender) >= amount, "Insufficient tokens for vesting");
        _transfer(msg.sender, user, amount);
        
        // Emit event for token transfer
        emit TokensTransferredForVesting(user, amount, block.timestamp);
        
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + (61 * 30 days); // 61 months total vesting period
        
        vestingSchedules[user] = VestingSchedule({
            totalAmount: amount,
            unlockedAmount: 0,
            startTime: startTime,
            endTime: endTime,
            isActive: true,
            isAirdrop: true
        });
        
        if (!isParticipant[user]) {
            participants.push(user);
            isParticipant[user] = true;
        }
        
        totalAllocated += amount;
        
        emit VestingScheduleCreated(user, amount, startTime, endTime);
    }
    
    /**
     * @dev Create multiple vesting schedules from CSV data
     */
    function createVestingSchedules(
        address[] calldata users,
        uint256[] calldata amounts
    ) external onlyOwner {
        require(users.length == amounts.length, "Arrays length mismatch");
        require(users.length > 0, "Empty arrays");
        
        // ✅ FIX: Calculate total tokens needed and check balance
        uint256 totalTokensNeeded = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            if (users[i] != address(0) && amounts[i] > 0 && !vestingSchedules[users[i]].isActive) {
                totalTokensNeeded += amounts[i];
            }
        }
        require(balanceOf(msg.sender) >= totalTokensNeeded, "Insufficient tokens for bulk vesting");
        
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + (61 * 30 days); // 61 months total vesting period
        
        for (uint256 i = 0; i < users.length; i++) {
            if (users[i] != address(0) && amounts[i] > 0 && !vestingSchedules[users[i]].isActive) {
                // ✅ FIX: Transfer tokens to user first
                _transfer(msg.sender, users[i], amounts[i]);
                
                // Emit event for token transfer
                emit TokensTransferredForVesting(users[i], amounts[i], block.timestamp);
                
                vestingSchedules[users[i]] = VestingSchedule({
                    totalAmount: amounts[i],
                    unlockedAmount: 0,
                    startTime: startTime,
                    endTime: endTime,
                    isActive: true,
                    isAirdrop: true
                });
                
                if (!isParticipant[users[i]]) {
                    participants.push(users[i]);
                    isParticipant[users[i]] = true;
                }
                
                totalAllocated += amounts[i];
                
                emit VestingScheduleCreated(users[i], amounts[i], startTime, endTime);
            }
        }
    }
    
    /**
     * @dev Early release of locked tokens
     */
    function earlyRelease(address user, uint256 amount) external onlyOwner {
        require(vestingSchedules[user].isActive, "No active vesting schedule");
        require(amount > 0, "Amount must be greater than zero");
        
        VestingSchedule storage schedule = vestingSchedules[user];
        uint256 lockedAmount = getLockedAmount(user);
        require(amount <= lockedAmount, "Amount exceeds remaining locked tokens");
        
        schedule.unlockedAmount += amount;
        totalUnlocked += amount;
        
        emit EarlyRelease(user, amount, block.timestamp);
    }
    
    /**
     * @dev Emergency function to unlock ALL remaining tokens for a user
     */
    function emergencyUnlockAll(address user) external onlyOwner {
        require(vestingSchedules[user].isActive, "No active vesting schedule");
        
        VestingSchedule storage schedule = vestingSchedules[user];
        uint256 lockedAmount = getLockedAmount(user);
        
        require(lockedAmount > 0, "No tokens left to unlock");
        
        // Unlock all remaining locked tokens
        schedule.unlockedAmount = schedule.totalAmount;
        totalUnlocked += lockedAmount;
        
        emit EmergencyUnlockAll(user, lockedAmount, block.timestamp);
    }
    
    /**
     * @dev Modify existing vesting schedule
     */
    function modifyVestingSchedule(address user, uint256 newAmount) external onlyOwner {
        require(vestingSchedules[user].isActive, "No active vesting schedule");
        require(newAmount >= vestingSchedules[user].unlockedAmount, "New amount less than unlocked");
        
        VestingSchedule storage schedule = vestingSchedules[user];
        uint256 oldAmount = schedule.totalAmount;
        
        schedule.totalAmount = newAmount;
        totalAllocated = totalAllocated - oldAmount + newAmount;
        
        emit VestingScheduleModified(user, newAmount, block.timestamp);
    }
    
    /**
     * @dev Deactivate a vesting schedule (pause vesting without removing)
     */
    function deactivateVestingSchedule(address user) external onlyOwner {
        require(vestingSchedules[user].isActive, "No active vesting schedule");
        
        VestingSchedule storage schedule = vestingSchedules[user];
        schedule.isActive = false;
        
        emit VestingScheduleDeactivated(user, block.timestamp);
    }
    
    /**
     * @dev Reactivate a deactivated vesting schedule
     */
    function reactivateVestingSchedule(address user) external onlyOwner {
        require(!vestingSchedules[user].isActive, "Vesting schedule is already active");
        require(vestingSchedules[user].startTime != 0, "No vesting schedule exists");
        
        VestingSchedule storage schedule = vestingSchedules[user];
        schedule.isActive = true;
        
        emit VestingScheduleReactivated(user, block.timestamp);
    }
    
    /**
     * @dev Cancel a vesting schedule completely (emergency function)
     * This will stop all future vesting and mark the schedule as inactive
     */
    function cancelVestingSchedule(address user) external onlyOwner {
        require(vestingSchedules[user].isActive, "No active vesting schedule");
        
        VestingSchedule storage schedule = vestingSchedules[user];
        uint256 lockedAmount = getLockedAmount(user);
        
        // Mark as inactive
        schedule.isActive = false;
        
        // Reduce total allocated by the locked amount
        totalAllocated -= lockedAmount;
        
        emit VestingScheduleCancelled(user, lockedAmount, block.timestamp);
    }
    
    /**
     * @dev Toggle airdrop status for a user
     */
    function toggleAirdropStatus(address user) external onlyOwner {
        require(vestingSchedules[user].isActive, "No active vesting schedule");
        
        VestingSchedule storage schedule = vestingSchedules[user];
        schedule.isAirdrop = !schedule.isAirdrop;
        
        emit AirdropStatusToggled(user, schedule.isAirdrop, block.timestamp);
    }
    
    /**
     * @dev Update unlocked amounts for all participants (gas expensive)
     */
    function updateUnlockedAmounts() external onlyOwner {
        for (uint256 i = 0; i < participants.length; i++) {
            updateUnlockedAmountsForUser(participants[i]);
        }
    }
    
    /**
     * @dev Update unlocked amounts for a specific user (gas efficient)
     */
    function updateUnlockedAmountsForUser(address user) public {
        VestingSchedule storage schedule = vestingSchedules[user];
        
        if (!schedule.isActive || schedule.startTime == 0) {
            return;
        }
        
        uint256 newUnlockedAmount = getVestedAmount(user);
        
        if (newUnlockedAmount > schedule.unlockedAmount) {
            uint256 additionalUnlocked = newUnlockedAmount - schedule.unlockedAmount;
            schedule.unlockedAmount = newUnlockedAmount;
            totalUnlocked += additionalUnlocked;
            
            emit TokensUnlocked(user, additionalUnlocked, block.timestamp);
        } else if (newUnlockedAmount < schedule.unlockedAmount) {
            // Log inconsistency but don't decrease unlocked amount
            emit VestingInconsistencyDetected(user, schedule.unlockedAmount, newUnlockedAmount, block.timestamp);
        }
        
        // Check if vesting is complete and auto-deactivate
        if (newUnlockedAmount >= schedule.totalAmount && schedule.isActive) {
            // Ensure unlocked amount matches vested amount for complete schedules
            if (schedule.unlockedAmount < newUnlockedAmount) {
                uint256 additionalUnlocked = newUnlockedAmount - schedule.unlockedAmount;
                schedule.unlockedAmount = newUnlockedAmount;
                totalUnlocked += additionalUnlocked;
                
                emit TokensUnlocked(user, additionalUnlocked, block.timestamp);
            }
            
            schedule.isActive = false;
            emit VestingScheduleCompleted(user, schedule.totalAmount, block.timestamp);
        }
    }
    
    /**
     * @dev Get vested amount for a user based on precise tokenomics schedule
     * Schedule: 6-month cliff, then alternating unlocks every 3-4 months
     * Phase 1 (Months 7-19): 1.2% every 3 months = 600M tokens per unlock
     * Phase 2 (Months 22-49): 7% every 3 months = 3.5B tokens per unlock  
     * Phase 3 (Months 52-61): 6% every 3 months = 3B tokens per unlock
     */
    function getVestedAmount(address user) public view returns (uint256) {
        VestingSchedule storage schedule = vestingSchedules[user];
        
        if (!schedule.isActive || schedule.startTime == 0) {
            return 0;
        }
        
        uint256 currentTime = block.timestamp;
        
        if (currentTime < schedule.startTime) {
            return 0;
        }
        
        // Calculate time since start in months (30 days = 1 month)
        uint256 timeSinceStart = currentTime - schedule.startTime;
        uint256 monthsSinceStart = timeSinceStart / (30 * 24 * 60 * 60); // 30 days in seconds
        
        // 6-month cliff period (months 0-6)
        if (monthsSinceStart < 7) {
            return 0;
        }
        
        uint256 totalVested = 0;
        
        // Phase 1: First year releases (months 7-19) - 1.2% every 3 months
        if (monthsSinceStart >= 7) {
            uint256 firstYearUnlocks = 0;
            if (monthsSinceStart >= 7) firstYearUnlocks++;  // Month 7
            if (monthsSinceStart >= 10) firstYearUnlocks++; // Month 10
            if (monthsSinceStart >= 13) firstYearUnlocks++; // Month 13
            if (monthsSinceStart >= 16) firstYearUnlocks++; // Month 16
            if (monthsSinceStart >= 19) firstYearUnlocks++; // Month 19
            
            uint256 firstYearAmount = (schedule.totalAmount * FIRST_YEAR_UNLOCK_PERCENTAGE) / 1000;
            totalVested += firstYearAmount * firstYearUnlocks;
        }
        
        // Phase 2: Post-Q5 releases (months 22-49) - 7% every 3 months
        if (monthsSinceStart >= 22) {
            uint256 postQ5Unlocks = 0;
            for (uint256 month = 22; month <= 49; month += 3) {
                if (monthsSinceStart >= month) {
                    postQ5Unlocks++;
                }
            }
            
            uint256 postQ5Amount = (schedule.totalAmount * POST_Q5_UNLOCK_PERCENTAGE) / 1000;
            totalVested += postQ5Amount * postQ5Unlocks;
        }
        
        // Phase 3: Final releases (months 52-61) - 6% every 3 months
        if (monthsSinceStart >= 52) {
            uint256 finalUnlocks = 0;
            for (uint256 month = 52; month <= 61; month += 3) {
                if (monthsSinceStart >= month) {
                    finalUnlocks++;
                }
            }
            
            uint256 finalAmount = (schedule.totalAmount * FINAL_UNLOCK_PERCENTAGE) / 1000;
            totalVested += finalAmount * finalUnlocks;
        }
        
        // Ensure we don't exceed total amount
        if (totalVested > schedule.totalAmount) {
            totalVested = schedule.totalAmount;
        }
        
        return totalVested;
    }
    
    /**
     * @dev Get unlocked amount for a user
     */
    function getUnlockedAmount(address user) public view returns (uint256) {
        return vestingSchedules[user].unlockedAmount;
    }
    
    /**
     * @dev Get locked amount for a user
     */
    function getLockedAmount(address user) public view returns (uint256) {
        VestingSchedule storage schedule = vestingSchedules[user];
        if (!schedule.isActive) {
            return 0;
        }
        
        // Use the maximum of vested (time-based) or unlocked (stored, includes emergency unlocks)
        uint256 totalVested = getVestedAmount(user);
        uint256 userUnlocked = schedule.unlockedAmount;
        uint256 maxUnlocked = totalVested > userUnlocked ? totalVested : userUnlocked;
        
        uint256 lockedAmount = schedule.totalAmount - maxUnlocked;
        return lockedAmount > 0 ? lockedAmount : 0;
    }
    
    /**
     * @dev Get vesting schedule for a user
     */
    function getVestingSchedule(address user) external view returns (
        uint256 totalAmount,
        uint256 unlockedAmount,
        uint256 startTime,
        uint256 endTime,
        bool isActive,
        bool isAirdrop
    ) {
        VestingSchedule storage schedule = vestingSchedules[user];
        return (
            schedule.totalAmount,
            schedule.unlockedAmount,
            schedule.startTime,
            schedule.endTime,
            schedule.isActive,
            schedule.isAirdrop
        );
    }
    

    
    /**
     * @dev Get all participants
     */
    function getAllParticipants() external view returns (address[] memory) {
        return participants;
    }
    
    /**
     * @dev Get participant count
     */
    function getParticipantCount() external view returns (uint256) {
        return participants.length;
    }
    
    /**
     * @dev Check if a vesting schedule is complete (all tokens unlocked)
     */
    function isVestingComplete(address user) external view returns (bool) {
        VestingSchedule storage schedule = vestingSchedules[user];
        
        if (schedule.startTime == 0) {
            return false;
        }
        
        // For active schedules, check current vested amount
        if (schedule.isActive) {
            uint256 vestedAmount = getVestedAmount(user);
            return vestedAmount >= schedule.totalAmount;
        }
        
        // For deactivated schedules, check if they were completed before deactivation
        return schedule.unlockedAmount >= schedule.totalAmount;
    }
    
    /**
     * @dev Get vesting statistics
     */
    function getVestingStats() external view returns (
        uint256 totalParticipants,
        uint256 totalAllocatedTokens,
        uint256 totalUnlockedTokens,
        uint256 remainingTokens,
        bool isVestingStarted
    ) {
        return (
            participants.length,
            totalAllocated,
            totalUnlocked,
            totalAllocated - totalUnlocked,
            participants.length > 0
        );
    }
    
    // Admin functions (inherited from original token)
    
    /**
     * @dev Update transfer tax rate
     */
    function updateTransferTaxRate(uint256 newTaxRate) external onlyOwner {
        require(newTaxRate <= MAX_TAX_RATE, "Tax rate too high");
        transferTaxRate = newTaxRate;
        emit TransferTaxUpdated(newTaxRate);
    }
    
    /**
     * @dev Update LP contribution rate
     */
    function updateLPContributionRate(uint256 newRate) external onlyOwner {
        require(newRate <= transferTaxRate, "Rate cannot exceed transfer tax");
        lpContributionRate = newRate;
        emit LPContributionRateUpdated(newRate);
    }
    
    /**
     * @dev Update development rate
     */
    function updateDevelopmentRate(uint256 newRate) external onlyOwner {
        require(newRate <= transferTaxRate, "Rate cannot exceed transfer tax");
        developmentRate = newRate;
        emit DevelopmentRateUpdated(newRate);
    }
    
    /**
     * @dev Update marketing rate
     */
    function updateMarketingRate(uint256 newRate) external onlyOwner {
        require(newRate <= transferTaxRate, "Rate cannot exceed transfer tax");
        marketingRate = newRate;
        emit MarketingRateUpdated(newRate);
    }
    
    /**
     * @dev Update burn rate
     */
    function updateBurnRate(uint256 newRate) external onlyOwner {
        require(newRate <= transferTaxRate, "Rate cannot exceed transfer tax");
        burnRate = newRate;
        emit BurnRateUpdated(newRate);
    }
    
    /**
     * @dev Update LP wallet
     */
    function updateLPWallet(address newWallet) external onlyOwner {
        require(newWallet != address(0), "Invalid wallet address");
        lpWallet = newWallet;
        emit LPWalletUpdated(newWallet);
    }
    
    /**
     * @dev Update marketing wallet
     */
    function updateMarketingWallet(address newWallet) external onlyOwner {
        require(newWallet != address(0), "Invalid wallet address");
        marketingWallet = newWallet;
        emit MarketingWalletUpdated(newWallet);
    }
    
    /**
     * @dev Update development wallet
     */
    function updateDevelopmentWallet(address newWallet) external onlyOwner {
        require(newWallet != address(0), "Invalid wallet address");
        developmentWallet = newWallet;
        emit DevelopmentWalletUpdated(newWallet);
    }
    
    /**
     * @dev Update max transaction amount
     */
    function updateMaxTxAmount(uint256 newAmount) external onlyOwner {
        require(newAmount > 0, "Max tx amount must be greater than zero");
        maxTxAmount = newAmount;
        emit MaxTxAmountUpdated(newAmount);
    }
    
    /**
     * @dev Exclude/include address from transfer tax
     */
    function setTaxExclusion(address account, bool excluded) external onlyOwner {
        isExcludedFromTax[account] = excluded;
        emit TaxExclusionUpdated(account, excluded);
    }
    
    /**
     * @dev Exclude/include address from max transaction limit
     */
    function setMaxTxExclusion(address account, bool excluded) external onlyOwner {
        isExcludedFromMaxTx[account] = excluded;
        emit MaxTxExclusionUpdated(account, excluded);
    }
    
    /**
     * @dev Pause token transfers
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause token transfers
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Burn admin rights (irreversible)
     */
    function burnAdminRights() external onlyOwner {
        renounceOwnership();
    }
    
    /**
     * @dev Get current tax breakdown
     */
    function getTaxBreakdown() external view returns (
        uint256 transferTax,
        uint256 lpContribution,
        uint256 development,
        uint256 marketing,
        uint256 burn
    ) {
        return (
            transferTaxRate,
            lpContributionRate,
            developmentRate,
            marketingRate,
            burnRate
        );
    }
    
    /**
     * @dev Check if address is excluded from tax
     */
    function isTaxExcluded(address account) external view returns (bool) {
        return isExcludedFromTax[account];
    }
    
    /**
     * @dev Check if address is excluded from max transaction limit
     */
    function isMaxTxExcluded(address account) external view returns (bool) {
        return isExcludedFromMaxTx[account];
    }
    
    /**
     * @dev Check vesting requirements for bulk operations (view function)
     * @param users Array of user addresses
     * @param amounts Array of token amounts
     * @return totalTokensNeeded Total tokens required for the operation
     * @return adminBalance Current admin token balance
     * @return canProceed Whether the operation can proceed
     * @return validEntries Number of valid vesting entries
     */
    function checkVestingRequirements(
        address[] calldata users,
        uint256[] calldata amounts
    ) external view returns (
        uint256 totalTokensNeeded,
        uint256 adminBalance,
        bool canProceed,
        uint256 validEntries
    ) {
        require(users.length == amounts.length, "Arrays length mismatch");
        
        totalTokensNeeded = 0;
        validEntries = 0;
        
        for (uint256 i = 0; i < amounts.length; i++) {
            if (users[i] != address(0) && amounts[i] > 0 && !vestingSchedules[users[i]].isActive) {
                totalTokensNeeded += amounts[i];
                validEntries++;
            }
        }
        
        adminBalance = balanceOf(msg.sender);
        canProceed = adminBalance >= totalTokensNeeded;
        
        return (totalTokensNeeded, adminBalance, canProceed, validEntries);
    }
} 