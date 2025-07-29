// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title MSVTokenVesting
 * @dev MetaSoilVerse Token with integrated vesting functionality
 * Locked tokens are visible in balance but non-transferable
 */
contract MSVTokenVesting is ERC20, Ownable, ReentrancyGuard, Pausable {
    // Token configuration
    uint256 public constant TOTAL_SUPPLY = 100_000_000_000 * 10**18; // 100 billion tokens
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
    
    // Vesting configuration
    uint256 public constant MAX_VESTING_DURATION = 365 days; // 1 year maximum
    uint256 public constant MIN_VESTING_DURATION = 30 days; // 1 month minimum
    
    // Vesting schedule per user
    struct VestingSchedule {
        uint256 totalAmount;           // Total tokens allocated for vesting
        uint256 unlockedAmount;        // Amount already unlocked
        uint256 startTime;             // Vesting start time
        uint256 endTime;               // Vesting end time
        uint256 releaseInterval;       // Time between releases (1, 2, 3, 4, or 6 months)
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
    event VestingScheduleCreated(address indexed user, uint256 amount, uint256 startTime, uint256 endTime, uint256 releaseInterval);
    event TokensUnlocked(address indexed user, uint256 amount, uint256 timestamp);
    event VestingScheduleModified(address indexed user, uint256 newAmount, uint256 timestamp);
    event VestingPaused(uint256 timestamp);
    event VestingUnpaused(uint256 timestamp);
    event EarlyRelease(address indexed user, uint256 amount, uint256 timestamp);
    event VestingInconsistencyDetected(address indexed user, uint256 recordedAmount, uint256 calculatedAmount, uint256 timestamp);
    
    constructor(
        address _lpWallet,
        address _marketingWallet,
        address _developmentWallet
    ) ERC20("MetaSoilVerse", "MSV") {
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
     */
    function transferableBalance(address account) public view returns (uint256) {
        uint256 baseBalance = super.balanceOf(account);
        uint256 unlockedAmount = getUnlockedAmount(account);
        return baseBalance + unlockedAmount;
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
        
        // Transfer tokens
        super._transfer(from, to, transferAmount);
        
        // Distribute tax if applicable
        if (taxAmount > 0) {
            _distributeTaxes(from, taxAmount);
        }
    }
    
    /**
     * @dev Distribute transfer taxes to different wallets
     */
    function _distributeTaxes(address from, uint256 taxAmount) internal {
        // Only distribute if tax rate is greater than 0
        if (transferTaxRate == 0) {
            return;
        }
        
        uint256 remainingTax = taxAmount;
        
        // LP contribution
        if (lpContributionRate > 0) {
            uint256 lpAmount = (taxAmount * lpContributionRate) / transferTaxRate;
            if (lpAmount > 0) {
                super._transfer(from, lpWallet, lpAmount);
                remainingTax -= lpAmount;
            }
        }
        
        // Development fee
        if (developmentRate > 0) {
            uint256 developmentAmount = (taxAmount * developmentRate) / transferTaxRate;
            if (developmentAmount > 0) {
                super._transfer(from, developmentWallet, developmentAmount);
                remainingTax -= developmentAmount;
            }
        }
        
        // Marketing
        if (marketingRate > 0) {
            uint256 marketingAmount = (taxAmount * marketingRate) / transferTaxRate;
            if (marketingAmount > 0) {
                super._transfer(from, marketingWallet, marketingAmount);
                remainingTax -= marketingAmount;
            }
        }
        
        // Burn remaining tax
        if (burnRate > 0 && remainingTax > 0) {
            _burn(from, remainingTax);
        }
    }
    
    // Vesting Functions
    
    /**
     * @dev Create vesting schedule for a single user
     */
    function createVestingSchedule(
        address user,
        uint256 amount,
        uint256 releaseInterval
    ) external onlyOwner {
        require(user != address(0), "Invalid user address");
        require(amount > 0, "Amount must be greater than zero");
        require(!vestingSchedules[user].isActive, "Vesting schedule already exists");
        require(isValidReleaseInterval(releaseInterval), "Invalid release interval");
        
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + MAX_VESTING_DURATION;
        
        vestingSchedules[user] = VestingSchedule({
            totalAmount: amount,
            unlockedAmount: 0,
            startTime: startTime,
            endTime: endTime,
            releaseInterval: releaseInterval,
            isActive: true,
            isAirdrop: true
        });
        
        if (!isParticipant[user]) {
            participants.push(user);
            isParticipant[user] = true;
        }
        
        totalAllocated += amount;
        
        emit VestingScheduleCreated(user, amount, startTime, endTime, releaseInterval);
    }
    
    /**
     * @dev Create multiple vesting schedules from CSV data
     */
    function createVestingSchedules(
        address[] calldata users,
        uint256[] calldata amounts,
        uint256 releaseInterval
    ) external onlyOwner {
        require(users.length == amounts.length, "Arrays length mismatch");
        require(users.length > 0, "Empty arrays");
        require(isValidReleaseInterval(releaseInterval), "Invalid release interval");
        
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + MAX_VESTING_DURATION;
        
        for (uint256 i = 0; i < users.length; i++) {
            if (users[i] != address(0) && amounts[i] > 0 && !vestingSchedules[users[i]].isActive) {
                vestingSchedules[users[i]] = VestingSchedule({
                    totalAmount: amounts[i],
                    unlockedAmount: 0,
                    startTime: startTime,
                    endTime: endTime,
                    releaseInterval: releaseInterval,
                    isActive: true,
                    isAirdrop: true
                });
                
                if (!isParticipant[users[i]]) {
                    participants.push(users[i]);
                    isParticipant[users[i]] = true;
                }
                
                totalAllocated += amounts[i];
                
                emit VestingScheduleCreated(users[i], amounts[i], startTime, endTime, releaseInterval);
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
    }
    
    /**
     * @dev Get vested amount for a user
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
        
        if (currentTime >= schedule.endTime) {
            return schedule.totalAmount;
        }
        
        uint256 elapsedTime = currentTime - schedule.startTime;
        uint256 totalDuration = schedule.endTime - schedule.startTime;
        
        // Use higher precision to avoid rounding errors
        uint256 vestedPercentage = (elapsedTime * 1e18) / totalDuration; // 1e18 = 100%
        
        // Ensure we don't exceed 100%
        if (vestedPercentage > 1e18) {
            vestedPercentage = 1e18;
        }
        
        return (schedule.totalAmount * vestedPercentage) / 1e18;
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
        
        uint256 totalVested = getVestedAmount(user);
        uint256 lockedAmount = schedule.totalAmount - totalVested;
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
        uint256 releaseInterval,
        bool isActive,
        bool isAirdrop
    ) {
        VestingSchedule storage schedule = vestingSchedules[user];
        return (
            schedule.totalAmount,
            schedule.unlockedAmount,
            schedule.startTime,
            schedule.endTime,
            schedule.releaseInterval,
            schedule.isActive,
            schedule.isAirdrop
        );
    }
    
    /**
     * @dev Check if release interval is valid
     */
    function isValidReleaseInterval(uint256 interval) public pure returns (bool) {
        return interval == 30 days || interval == 60 days || interval == 90 days || 
               interval == 120 days || interval == 180 days;
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
} 