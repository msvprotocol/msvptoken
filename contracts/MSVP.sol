// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/access/Ownable2Step.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@openzeppelin/contracts/security/Pausable.sol';

/**
 * @title MSVTokenVesting
 * @dev MetaSoilVerse Token with integrated vesting functionality based on precise tokenomics schedule
 * Locked tokens are visible in balance but non-transferable
 */
contract MSVP is ERC20, Ownable2Step, ReentrancyGuard, Pausable, AccessControl {
    // Token configuration
    uint256 public constant TOTAL_SUPPLY = 100_000_000_000 * 10 ** 18; // 100 billion tokens
    uint256 public constant AIRDROP_SUPPLY = 50_000_000_000 * 10 ** 18; // 50 billion tokens for airdrop
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
    address public treasuryWallet; // receives residual tax when burnRate is zero

    // Excluded addresses from tax
    mapping(address => bool) public isExcludedFromTax;
    mapping(address => bool) public isExcludedFromMaxTx;

    // Max transaction limit
    uint256 public maxTxAmount = TOTAL_SUPPLY / 100; // 1% of total supply

    // Role-based access control
    bytes32 public constant SUBADMIN_ROLE = keccak256('SUBADMIN_ROLE');

    // Vesting configuration based on tokenomics schedule
    uint256 public constant CLIFF_DURATION = 180 days; // 6 months cliff
    uint256 public constant FIRST_YEAR_UNLOCK_PERCENTAGE = 12; // 1.2% (12/1000)
    uint256 public constant POST_Q5_UNLOCK_PERCENTAGE = 70; // 7% (70/1000)
    uint256 public constant FINAL_UNLOCK_PERCENTAGE = 60; // 6% (60/1000)

    // Vesting schedule per user
    struct VestingSchedule {
        uint256 totalAmount; // Total tokens allocated for vesting
        uint256 unlockedAmount; // Amount already unlocked
        uint256 startTime; // Vesting start time (TGE)
        uint256 endTime; // Vesting end time
        bool isActive; // Whether vesting is active
        bool isAirdrop; // Whether this is from airdrop
        address creator; // Address that created this schedule and can modify it
        bool isCancelled; // Whether this schedule was permanently cancelled
    }

    // Mapping from user address to vesting schedule (latest schedule for backward compatibility)
    mapping(address => VestingSchedule) public vestingSchedules;
    // Mapping from user address to all vesting schedules (supports multiple schedules per user)
    mapping(address => VestingSchedule[]) public userVestingSchedules;

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
    event TreasuryWalletUpdated(address newWallet);
    event MaxTxAmountUpdated(uint256 newAmount);
    event TaxExclusionUpdated(address account, bool excluded);
    event MaxTxExclusionUpdated(address account, bool excluded);

    // Vesting events
    event VestingScheduleCreated(address indexed user, uint256 amount, uint256 startTime, uint256 endTime);
    event TokensUnlocked(address indexed user, uint256 amount, uint256 timestamp);
    event VestingScheduleModified(address indexed user, uint256 newAmount, uint256 timestamp);
    event EarlyRelease(address indexed user, uint256 amount, uint256 timestamp);
    event EmergencyUnlockAll(address indexed user, uint256 amount, uint256 timestamp);
    event VestingScheduleDeactivated(address indexed user, uint256 timestamp);
    event VestingScheduleReactivated(address indexed user, uint256 timestamp);
    event VestingScheduleCancelled(address indexed user, uint256 lockedAmount, uint256 timestamp);
    event AirdropStatusToggled(address indexed user, bool isAirdrop, uint256 timestamp);
    event VestingScheduleCompleted(address indexed user, uint256 totalAmount, uint256 timestamp);
    event VestingInconsistencyDetected(
        address indexed user,
        uint256 recordedAmount,
        uint256 calculatedAmount,
        uint256 timestamp
    );
    event TokensTransferredForVesting(address indexed user, uint256 amount, uint256 timestamp);

    // Role management events
    event SubadminAdded(address indexed subadmin, address indexed by);
    event SubadminRemoved(address indexed subadmin, address indexed by);

    constructor(
        address _lpWallet,
        address _marketingWallet,
        address _developmentWallet
    ) ERC20('MetaSoilVerseProtocol', 'MSVP') {
        require(_lpWallet != address(0), 'Invalid LP wallet');
        require(_marketingWallet != address(0), 'Invalid marketing wallet');
        require(_developmentWallet != address(0), 'Invalid development wallet');

        lpWallet = _lpWallet;
        marketingWallet = _marketingWallet;
        developmentWallet = _developmentWallet;
        treasuryWallet = _developmentWallet; // default treasury to development wallet

        // Exclude owner and contract from tax
        isExcludedFromTax[msg.sender] = true;
        isExcludedFromTax[address(this)] = true;

        // Exclude owner and contract from max transaction limit
        isExcludedFromMaxTx[msg.sender] = true;
        isExcludedFromMaxTx[address(this)] = true;

        // Mint total supply to owner
        _mint(msg.sender, TOTAL_SUPPLY);

        // Set up initial roles
        _grantRole(SUBADMIN_ROLE, msg.sender);
    }

    // Role Management Functions

    /**
     * @dev Grant subadmin role to an address (only callable by owner)
     */
    function grantSubadminRole(address account) external onlyOwner {
        require(account != address(0), 'Invalid address');
        _grantRole(SUBADMIN_ROLE, account);
        // Exclude subadmin from transfer tax to avoid vesting allocation mismatches
        isExcludedFromTax[account] = true;
        emit SubadminAdded(account, msg.sender);
    }

    /**
     * @dev Revoke subadmin role from an address (only callable by owner)
     */
    function revokeSubadminRole(address account) external onlyOwner {
        require(account != address(0), 'Invalid address');
        _revokeRole(SUBADMIN_ROLE, account);
        // Remove tax exclusion when subadmin role is revoked
        isExcludedFromTax[account] = false;
        emit SubadminRemoved(account, msg.sender);
    }

    /**
     * @dev Update treasury wallet (receiver of residual tax when burn is disabled)
     */
    function updateTreasuryWallet(address newWallet) external onlyOwner {
        require(newWallet != address(0), 'Invalid wallet address');
        treasuryWallet = newWallet;
        emit TreasuryWalletUpdated(newWallet);
    }

    /**
     * @dev Check if address has subadmin role
     */
    function hasSubadminRole(address account) external view returns (bool) {
        return hasRole(SUBADMIN_ROLE, account);
    }

    /**
     * @dev Get all addresses with subadmin role (stub for compatibility)
     */
    function getSubadmins() external pure returns (address[] memory) {
        address[] memory subadmins = new address[](0);
        return subadmins;
    }

    /**
     * @dev Override balanceOf to show actual token balance
     * This shows the real tokens held in the wallet (including received tokens)
     */
    function balanceOf(address account) public view override returns (uint256) {
        // Always show actual tokens in wallet
        return super.balanceOf(account);
    }

    /**
     * @dev Get vesting allocation (total tokens allocated for vesting)
     * This shows the vesting schedule amount, not the actual balance
     */
    function getVestingAllocation(address account) external view returns (uint256) {
        if (!isParticipant[account]) {
            return 0;
        }
        VestingSchedule[] storage schedules = userVestingSchedules[account];
        uint256 total = 0;
        for (uint256 i = 0; i < schedules.length; i++) {
            if (schedules[i].isActive) {
                total += schedules[i].totalAmount;
            }
        }
        return total;
    }

    /**
     * @dev Get transferable balance (unlocked tokens for vesting participants)
     * For vesting participants: returns unlocked vesting tokens + any other unlocked tokens
     * For non-participants: returns full balance
     */
    function transferableBalance(address account) public view returns (uint256) {
        if (isParticipant[account]) {
            // For vesting participants: unlocked vesting tokens + any other unlocked tokens
            uint256 totalBalance = super.balanceOf(account);
            uint256 lockedAmount = getLockedAmount(account);

            // The correct calculation: total balance - locked amount
            // This automatically includes unlocked vesting + any other tokens
            return totalBalance - lockedAmount;
        } else {
            // For non-participants, full balance is transferable
            return super.balanceOf(account);
        }
    }

    /**
     * @dev Override transfer to include vesting logic and tax
     */
    function _transfer(address from, address to, uint256 amount) internal virtual override whenNotPaused {
        require(from != address(0), 'ERC20: transfer from the zero address');
        require(to != address(0), 'ERC20: transfer to the zero address');
        require(amount > 0, 'Transfer amount must be greater than zero');

        // Update unlocked amounts for both addresses if they are participants
        if (isParticipant[from]) {
            updateUnlockedAmountsForUser(from);
        }
        if (isParticipant[to]) {
            updateUnlockedAmountsForUser(to);
        }

        // Check transferable balance
        uint256 transferable = transferableBalance(from);
        require(transferable >= amount, 'Insufficient transferable balance');

        // Check max transaction limit (unless excluded)
        if (!isExcludedFromMaxTx[from] && !isExcludedFromMaxTx[to]) {
            require(amount <= maxTxAmount, 'Transfer amount exceeds max transaction limit');
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

        // Handle remaining tax
        if (remainingTax > 0) {
            if (burnRate > 0) {
                _burn(address(this), remainingTax);
            } else {
                // Redirect residual tax when burn is disabled
                super._transfer(address(this), treasuryWallet, remainingTax);
            }
        }
    }

    // Vesting Functions

    /**
     * @dev Create vesting schedule for a single user
     */
    function createVestingSchedule(address user, uint256 amount) external onlyRole(SUBADMIN_ROLE) {
        require(user != address(0), 'Invalid user address');
        require(amount > 0, 'Amount must be greater than zero');

        require(balanceOf(msg.sender) >= amount, 'Insufficient tokens for vesting');
        // Perform transfer which may apply tax
        _transfer(msg.sender, user, amount);

        // Determine actually credited (post-tax) amount to ensure schedule matches real balance
        bool taxApplies = (transferTaxRate > 0 && !isExcludedFromTax[msg.sender] && !isExcludedFromTax[user]);
        uint256 creditedAmount = taxApplies ? (amount - ((amount * transferTaxRate) / TAX_DENOMINATOR)) : amount;

        // Emit event with credited amount used for vesting
        emit TokensTransferredForVesting(user, creditedAmount, block.timestamp);

        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + (61 * 30 days); // 61 months total vesting period

        VestingSchedule memory newSchedule = VestingSchedule({
            totalAmount: creditedAmount,
            unlockedAmount: 0,
            startTime: startTime,
            endTime: endTime,
            isActive: true,
            isAirdrop: true,
            creator: msg.sender,
            isCancelled: false
        });

        // Store as the latest schedule (backward compatibility)
        vestingSchedules[user] = newSchedule;
        // Append to user's schedules (support multiple)
        userVestingSchedules[user].push(newSchedule);

        if (!isParticipant[user]) {
            participants.push(user);
            isParticipant[user] = true;
        }

        totalAllocated += creditedAmount;

        emit VestingScheduleCreated(user, creditedAmount, startTime, endTime);
    }

    /**
     * @dev Create multiple vesting schedules from CSV data
     */
    function createVestingSchedules(
        address[] calldata users,
        uint256[] calldata amounts
    ) external onlyRole(SUBADMIN_ROLE) {
        require(users.length == amounts.length, 'Arrays length mismatch');
        require(users.length > 0, 'Empty arrays');

        uint256 totalTokensNeeded = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            if (users[i] != address(0) && amounts[i] > 0) {
                totalTokensNeeded += amounts[i];
            }
        }
        require(balanceOf(msg.sender) >= totalTokensNeeded, 'Insufficient tokens for bulk vesting');

        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + (61 * 30 days); // 61 months total vesting period

        for (uint256 i = 0; i < users.length; i++) {
            if (users[i] != address(0) && amounts[i] > 0) {
                _transfer(msg.sender, users[i], amounts[i]);
                // Compute credited (post-tax) amount for vesting allocation
                bool taxApplies = (transferTaxRate > 0 &&
                    !isExcludedFromTax[msg.sender] &&
                    !isExcludedFromTax[users[i]]);
                uint256 creditedAmount = taxApplies
                    ? (amounts[i] - ((amounts[i] * transferTaxRate) / TAX_DENOMINATOR))
                    : amounts[i];
                emit TokensTransferredForVesting(users[i], creditedAmount, block.timestamp);

                VestingSchedule memory newSchedule = VestingSchedule({
                    totalAmount: creditedAmount,
                    unlockedAmount: 0,
                    startTime: startTime,
                    endTime: endTime,
                    isActive: true,
                    isAirdrop: true,
                    creator: msg.sender,
                    isCancelled: false
                });

                // Store as the latest schedule (backward compatibility)
                vestingSchedules[users[i]] = newSchedule;
                // Append to user's schedules (support multiple)
                userVestingSchedules[users[i]].push(newSchedule);

                if (!isParticipant[users[i]]) {
                    participants.push(users[i]);
                    isParticipant[users[i]] = true;
                }

                totalAllocated += creditedAmount;

                emit VestingScheduleCreated(users[i], creditedAmount, startTime, endTime);
            }
        }
    }

    /**
     * @dev Internal helper to get the index of the latest schedule for a user
     */
    function _latestScheduleIndex(address user) internal view returns (bool has, uint256 idx) {
        uint256 len = userVestingSchedules[user].length;
        if (len == 0) {
            return (false, 0);
        }
        return (true, len - 1);
    }

    /**
     * @dev Internal helper to sync mapping copy with latest array element
     */
    function _syncLatestMapping(address user) internal {
        (bool has, uint256 idx) = _latestScheduleIndex(user);
        if (has) {
            vestingSchedules[user] = userVestingSchedules[user][idx];
        }
    }

    /**
     * @dev Compute the theoretical vested amount for a given schedule at a specific timestamp
     * Does not read or modify global counters. Caps at schedule.totalAmount.
     */
    function _vestedAmountAt(VestingSchedule storage schedule, uint256 timestamp) internal view returns (uint256) {
        if (timestamp < schedule.startTime) {
            return 0;
        }
        if (timestamp >= schedule.endTime) {
            return schedule.totalAmount;
        }

        uint256 timeSinceStart = timestamp - schedule.startTime;
        uint256 monthsSinceStart = timeSinceStart / (30 * 24 * 60 * 60);
        if (monthsSinceStart < 7) {
            return 0;
        }

        uint256 totalVested = 0;
        // Phase 1: 1.2% at months 7,10,13,16,19
        uint256 firstYearUnlocks = 0;
        if (monthsSinceStart >= 7) firstYearUnlocks++;
        if (monthsSinceStart >= 10) firstYearUnlocks++;
        if (monthsSinceStart >= 13) firstYearUnlocks++;
        if (monthsSinceStart >= 16) firstYearUnlocks++;
        if (monthsSinceStart >= 19) firstYearUnlocks++;
        uint256 firstYearAmount = (schedule.totalAmount * FIRST_YEAR_UNLOCK_PERCENTAGE) / 1000;
        totalVested += firstYearAmount * firstYearUnlocks;

        // Phase 2: 7% every 3 months from 22 to 49
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

        // Phase 3: 6% every 3 months from 52 to 61
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

        if (totalVested > schedule.totalAmount) {
            totalVested = schedule.totalAmount;
        }
        return totalVested;
    }

    /**
     * @dev Early release of locked tokens
     */
    function earlyRelease(address user, uint256 amount) external onlyOwner {
        (bool has, uint256 idx) = _latestScheduleIndex(user);
        require(has, 'No active vesting schedule');
        require(amount > 0, 'Amount must be greater than zero');

        VestingSchedule storage schedule = userVestingSchedules[user][idx];
        require(schedule.isActive, 'No active vesting schedule');

        // Compute locked for this schedule only
        uint256 currentTime = block.timestamp;
        uint256 vestedForSchedule = _vestedAmountAt(schedule, currentTime);
        uint256 maxUnlocked = vestedForSchedule > schedule.unlockedAmount ? vestedForSchedule : schedule.unlockedAmount;
        uint256 lockedAmountForSchedule = schedule.totalAmount > maxUnlocked ? (schedule.totalAmount - maxUnlocked) : 0;
        require(amount <= lockedAmountForSchedule, 'Amount exceeds remaining locked tokens');

        schedule.unlockedAmount += amount;
        totalUnlocked += amount;

        _syncLatestMapping(user);

        emit EarlyRelease(user, amount, block.timestamp);
    }

    /**
     * @dev Emergency function to unlock ALL remaining tokens for a user
     */
    function emergencyUnlockAll(address user) external onlyOwner {
        (bool has, ) = _latestScheduleIndex(user);
        require(has, 'No active vesting schedule');

        VestingSchedule[] storage schedules = userVestingSchedules[user];
        uint256 totalJustUnlocked = 0;
        for (uint256 i = 0; i < schedules.length; i++) {
            VestingSchedule storage schedule = schedules[i];
            if (!schedule.isActive) {
                continue;
            }
            uint256 totalVested = _vestedAmountAt(schedule, block.timestamp);
            uint256 maxUnlocked = totalVested > schedule.unlockedAmount ? totalVested : schedule.unlockedAmount;
            uint256 lockedAmount = schedule.totalAmount > maxUnlocked ? (schedule.totalAmount - maxUnlocked) : 0;
            if (lockedAmount > 0) {
                schedule.unlockedAmount = schedule.totalAmount;
                totalJustUnlocked += lockedAmount;
                schedule.isActive = false;
            }
        }
        require(totalJustUnlocked > 0, 'No tokens left to unlock');
        totalUnlocked += totalJustUnlocked;
        _syncLatestMapping(user);

        emit EmergencyUnlockAll(user, totalJustUnlocked, block.timestamp);
    }

    /**
     * @dev Modify existing vesting schedule
     */
    function modifyVestingSchedule(address user, uint256 newAmount) external {
        (bool has, uint256 idx) = _latestScheduleIndex(user);
        require(has, 'No active vesting schedule');
        VestingSchedule storage schedule = userVestingSchedules[user][idx];
        require(schedule.isActive, 'No active vesting schedule');
        require(msg.sender == schedule.creator, 'Only schedule creator');

        // Recompute vested amount at current timestamp to avoid stale state
        uint256 currentTime = block.timestamp;
        uint256 recomputedVested = _vestedAmountAt(schedule, currentTime);
        uint256 floorAmount = schedule.unlockedAmount > recomputedVested ? schedule.unlockedAmount : recomputedVested;
        require(newAmount >= floorAmount, 'New amount less than vested');

        uint256 oldAmount = schedule.totalAmount;
        if (newAmount > oldAmount) {
            uint256 delta = newAmount - oldAmount;
            require(balanceOf(msg.sender) >= delta, 'Insufficient tokens for increase');
            _transfer(msg.sender, user, delta);
            emit TokensTransferredForVesting(user, delta, block.timestamp);
        }

        schedule.totalAmount = newAmount;
        totalAllocated = totalAllocated - oldAmount + newAmount;
        _syncLatestMapping(user);

        // Optionally bring unlockedAmount in sync with new total
        updateUnlockedAmountsForUser(user);

        emit VestingScheduleModified(user, newAmount, block.timestamp);
    }

    /**
     * @dev Deactivate a vesting schedule (pause vesting without removing)
     */
    function deactivateVestingSchedule(address user) external onlyOwner {
        (bool has, uint256 idx) = _latestScheduleIndex(user);
        require(has, 'No active vesting schedule');
        VestingSchedule storage schedule = userVestingSchedules[user][idx];
        require(schedule.isActive, 'No active vesting schedule');
        schedule.isActive = false;
        _syncLatestMapping(user);

        emit VestingScheduleDeactivated(user, block.timestamp);
    }

    /**
     * @dev Reactivate a deactivated vesting schedule
     */
    function reactivateVestingSchedule(address user) external onlyOwner {
        (bool has, uint256 idx) = _latestScheduleIndex(user);
        require(has, 'No vesting schedule exists');
        VestingSchedule storage schedule = userVestingSchedules[user][idx];
        require(!schedule.isCancelled, 'Vesting schedule cancelled');
        require(!schedule.isActive, 'Vesting schedule is already active');
        require(schedule.startTime != 0, 'No vesting schedule exists');

        // Ensure the user still holds enough tokens to cover the remaining locked amount
        uint256 recomputedVested = _vestedAmountAt(schedule, block.timestamp);
        uint256 floorUnlocked = schedule.unlockedAmount > recomputedVested ? schedule.unlockedAmount : recomputedVested;
        uint256 remainingLocked = schedule.totalAmount > floorUnlocked ? (schedule.totalAmount - floorUnlocked) : 0;
        require(super.balanceOf(user) >= remainingLocked, 'Insufficient balance to reactivate');

        schedule.isActive = true;
        _syncLatestMapping(user);

        emit VestingScheduleReactivated(user, block.timestamp);
    }

    /**
     * @dev Cancel a vesting schedule completely (emergency function)
     * This will stop all future vesting and mark the schedule as inactive
     */
    function cancelVestingSchedule(address user) external onlyOwner {
        (bool has, uint256 idx) = _latestScheduleIndex(user);
        require(has, 'No active vesting schedule');
        VestingSchedule storage schedule = userVestingSchedules[user][idx];
        require(schedule.isActive, 'No active vesting schedule');

        // Compute locked for this schedule only
        uint256 currentTime = block.timestamp;
        uint256 vestedForSchedule = _vestedAmountAt(schedule, currentTime);
        uint256 maxUnlocked = vestedForSchedule > schedule.unlockedAmount ? vestedForSchedule : schedule.unlockedAmount;
        uint256 lockedAmount = schedule.totalAmount > maxUnlocked ? (schedule.totalAmount - maxUnlocked) : 0;

        // Mark as inactive and permanently cancelled
        schedule.isActive = false;
        schedule.isCancelled = true;
        schedule.startTime = 0;
        schedule.endTime = 0;

        // Reduce total allocated by the locked amount
        totalAllocated -= lockedAmount;
        _syncLatestMapping(user);

        emit VestingScheduleCancelled(user, lockedAmount, block.timestamp);
    }

    /**
     * @dev Toggle airdrop status for a user
     */
    function toggleAirdropStatus(address user) external onlyOwner {
        (bool has, uint256 idx) = _latestScheduleIndex(user);
        require(has, 'No active vesting schedule');
        VestingSchedule storage schedule = userVestingSchedules[user][idx];
        require(schedule.isActive, 'No active vesting schedule');
        schedule.isAirdrop = !schedule.isAirdrop;
        _syncLatestMapping(user);

        emit AirdropStatusToggled(user, schedule.isAirdrop, block.timestamp);
    }

    /**
     * @dev Update unlocked amounts for all participants (gas expensive)
     */
    function updateUnlockedAmounts() external onlyOwner {
        uint256 participantsLength = participants.length;
        for (uint256 i = 0; i < participantsLength; i++) {
            updateUnlockedAmountsForUser(participants[i]);
        }
    }

    /**
     * @dev Update unlocked amounts for a specific user (gas efficient)
     */
    function updateUnlockedAmountsForUser(address user) public {
        VestingSchedule[] storage schedules = userVestingSchedules[user];

        for (uint256 i = 0; i < schedules.length; i++) {
            VestingSchedule storage schedule = schedules[i];

            if (!schedule.isActive || schedule.startTime == 0) {
                continue;
            }

            // Calculate vested amount for this schedule
            uint256 currentTime = block.timestamp;
            if (currentTime >= schedule.endTime) {
                if (schedule.unlockedAmount < schedule.totalAmount) {
                    uint256 additional = schedule.totalAmount - schedule.unlockedAmount;
                    schedule.unlockedAmount = schedule.totalAmount;
                    totalUnlocked += additional;
                    emit TokensUnlocked(user, additional, block.timestamp);
                }
                schedule.isActive = false;
                emit VestingScheduleCompleted(user, schedule.totalAmount, block.timestamp);
                continue;
            }
            uint256 newUnlockedAmount = _vestedAmountAt(schedule, currentTime);

            if (newUnlockedAmount > schedule.unlockedAmount) {
                uint256 additionalUnlocked = newUnlockedAmount - schedule.unlockedAmount;
                schedule.unlockedAmount = newUnlockedAmount;
                totalUnlocked += additionalUnlocked;

                emit TokensUnlocked(user, additionalUnlocked, block.timestamp);
            } else if (newUnlockedAmount < schedule.unlockedAmount) {
                // Log inconsistency but don't decrease unlocked amount
                emit VestingInconsistencyDetected(user, schedule.unlockedAmount, newUnlockedAmount, block.timestamp);
            }

            // Complete schedule if fully vested
            if (newUnlockedAmount >= schedule.totalAmount && schedule.isActive) {
                schedule.isActive = false;
                emit VestingScheduleCompleted(user, schedule.totalAmount, block.timestamp);
            }
        }
        _syncLatestMapping(user);
    }

    /**
     * @dev Get vested amount for a user based on precise tokenomics schedule
     * Aggregates across all schedules
     */
    function getVestedAmount(address user) public view returns (uint256) {
        VestingSchedule[] storage schedules = userVestingSchedules[user];
        uint256 aggregateVested = 0;

        for (uint256 i = 0; i < schedules.length; i++) {
            VestingSchedule storage schedule = schedules[i];
            if (!schedule.isActive || schedule.startTime == 0) {
                continue;
            }
            uint256 currentTime = block.timestamp;
            aggregateVested += _vestedAmountAt(schedule, currentTime);
        }

        return aggregateVested;
    }

    /**
     * @dev Get unlocked amount for a user
     * Returns the stored unlocked amount across all schedules
     */
    function getUnlockedAmount(address user) external view returns (uint256) {
        VestingSchedule[] storage schedules = userVestingSchedules[user];
        uint256 total = 0;
        for (uint256 i = 0; i < schedules.length; i++) {
            total += schedules[i].unlockedAmount;
        }
        return total;
    }

    /**
     * @dev Get locked amount for a user (sum across all active schedules)
     */
    function getLockedAmount(address user) public view returns (uint256) {
        VestingSchedule[] storage schedules = userVestingSchedules[user];
        uint256 totalLocked = 0;

        for (uint256 i = 0; i < schedules.length; i++) {
            VestingSchedule storage schedule = schedules[i];
            if (!schedule.isActive) {
                continue;
            }
            uint256 currentTime = block.timestamp;
            if (currentTime >= schedule.endTime) {
                continue;
            }
            uint256 totalVested = _vestedAmountAt(schedule, currentTime);
            uint256 userUnlocked = schedule.unlockedAmount;
            uint256 maxUnlocked = totalVested > userUnlocked ? totalVested : userUnlocked;
            uint256 lockedAmount = schedule.totalAmount > maxUnlocked ? (schedule.totalAmount - maxUnlocked) : 0;
            totalLocked += lockedAmount;
        }

        return totalLocked;
    }

    /**
     * @dev Get vesting schedule for a user
     */
    function getVestingSchedule(
        address user
    )
        external
        view
        returns (
            uint256 totalAmount,
            uint256 unlockedAmount,
            uint256 startTime,
            uint256 endTime,
            bool isActive,
            bool isAirdrop
        )
    {
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
        VestingSchedule[] storage schedules = userVestingSchedules[user];

        if (schedules.length == 0) {
            return false;
        }

        for (uint256 i = 0; i < schedules.length; i++) {
            VestingSchedule storage schedule = schedules[i];
            if (!schedule.isActive) {
                continue;
            }
            uint256 currentTime = block.timestamp;
            if (currentTime >= schedule.endTime) {
                continue;
            }
            if (currentTime < schedule.startTime) {
                return false;
            }
            uint256 totalVested = _vestedAmountAt(schedule, currentTime);
            if (totalVested < schedule.totalAmount) {
                return false;
            }
        }

        return true;
    }

    /**
     * @dev Get vesting statistics
     */
    function getVestingStats()
        external
        view
        returns (
            uint256 totalParticipants,
            uint256 totalAllocatedTokens,
            uint256 totalUnlockedTokens,
            uint256 remainingTokens,
            bool isVestingStarted
        )
    {
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
        require(newTaxRate <= MAX_TAX_RATE, 'Tax rate too high');
        // Ensure component sum does not exceed the new transfer tax rate, unless disabling tax entirely
        if (newTaxRate > 0) {
            require(
                lpContributionRate + developmentRate + marketingRate + burnRate <= newTaxRate,
                'Components exceed tax rate'
            );
        }
        transferTaxRate = newTaxRate;
        emit TransferTaxUpdated(newTaxRate);
    }

    /**
     * @dev Update LP contribution rate
     */
    function updateLPContributionRate(uint256 newRate) external onlyOwner {
        require(newRate <= transferTaxRate, 'Rate cannot exceed transfer tax');
        require(newRate + developmentRate + marketingRate + burnRate <= transferTaxRate, 'Components exceed tax rate');
        lpContributionRate = newRate;
        emit LPContributionRateUpdated(newRate);
    }

    /**
     * @dev Update development rate
     */
    function updateDevelopmentRate(uint256 newRate) external onlyOwner {
        require(newRate <= transferTaxRate, 'Rate cannot exceed transfer tax');
        require(lpContributionRate + newRate + marketingRate + burnRate <= transferTaxRate, 'Components exceed tax rate');
        developmentRate = newRate;
        emit DevelopmentRateUpdated(newRate);
    }

    /**
     * @dev Update marketing rate
     */
    function updateMarketingRate(uint256 newRate) external onlyOwner {
        require(newRate <= transferTaxRate, 'Rate cannot exceed transfer tax');
        require(lpContributionRate + developmentRate + newRate + burnRate <= transferTaxRate, 'Components exceed tax rate');
        marketingRate = newRate;
        emit MarketingRateUpdated(newRate);
    }

    /**
     * @dev Update burn rate
     */
    function updateBurnRate(uint256 newRate) external onlyOwner {
        require(newRate <= transferTaxRate, 'Rate cannot exceed transfer tax');
        require(lpContributionRate + developmentRate + marketingRate + newRate <= transferTaxRate, 'Components exceed tax rate');
        burnRate = newRate;
        emit BurnRateUpdated(newRate);
    }

    /**
     * @dev Update LP wallet
     */
    function updateLPWallet(address newWallet) external onlyOwner {
        require(newWallet != address(0), 'Invalid wallet address');
        lpWallet = newWallet;
        emit LPWalletUpdated(newWallet);
    }

    /**
     * @dev Update marketing wallet
     */
    function updateMarketingWallet(address newWallet) external onlyOwner {
        require(newWallet != address(0), 'Invalid wallet address');
        marketingWallet = newWallet;
        emit MarketingWalletUpdated(newWallet);
    }

    /**
     * @dev Update development wallet
     */
    function updateDevelopmentWallet(address newWallet) external onlyOwner {
        require(newWallet != address(0), 'Invalid wallet address');
        developmentWallet = newWallet;
        emit DevelopmentWalletUpdated(newWallet);
    }

    /**
     * @dev Update max transaction amount
     */
    function updateMaxTxAmount(uint256 newAmount) external onlyOwner {
        require(newAmount > 0, 'Max tx amount must be greater than zero');
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
    function burnAdminRights() external onlyOwner whenNotPaused {
        renounceOwnership();
    }

    /**
     * @dev Get current tax breakdown
     */
    function getTaxBreakdown()
        external
        view
        returns (uint256 transferTax, uint256 lpContribution, uint256 development, uint256 marketing, uint256 burn)
    {
        return (transferTaxRate, lpContributionRate, developmentRate, marketingRate, burnRate);
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
    ) external view returns (uint256 totalTokensNeeded, uint256 adminBalance, bool canProceed, uint256 validEntries) {
        require(users.length == amounts.length, 'Arrays length mismatch');

        totalTokensNeeded = 0;
        validEntries = 0;

        for (uint256 i = 0; i < amounts.length; i++) {
            if (users[i] != address(0) && amounts[i] > 0) {
                totalTokensNeeded += amounts[i];
                validEntries++;
            }
        }

        adminBalance = balanceOf(msg.sender);
        canProceed = adminBalance >= totalTokensNeeded;

        return (totalTokensNeeded, adminBalance, canProceed, validEntries);
    }

    /**
     * @dev Withdraw MSVP tokens held by the contract (e.g., residual taxes)
     */
    function withdrawContractTokens(address to, uint256 amount) external onlyOwner {
        require(to != address(0), 'Invalid address');
        require(amount > 0, 'Amount must be greater than zero');
        require(balanceOf(address(this)) >= amount, 'Insufficient contract balance');
        super._transfer(address(this), to, amount);
    }
}
