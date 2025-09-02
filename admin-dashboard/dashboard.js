// MSVP Token Vesting Admin Dashboard
// This file handles all interactions with the MSVPP smart contract

// Global variables
let provider;
let signer;
let contract;
let contractAddress;
let isConnected = false;

// Contract ABI - Updated to match the latest contract
const CONTRACT_ABI = [
    // ERC20 Functions
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function transferableBalance(address) view returns (uint256)",
    "function transfer(address, uint256) returns (bool)",
    "function transferFrom(address, address, uint256) returns (bool)",
    "function approve(address, uint256) returns (bool)",
    "function allowance(address, address) view returns (uint256)",
    
    // Vesting Functions
    "function createVestingSchedule(address, uint256)",
    "function createVestingSchedules(address[], uint256[])",
    "function earlyRelease(address, uint256)",
    "function emergencyUnlockAll(address)",
    "function modifyVestingSchedule(address, uint256)",
    "function updateUnlockedAmounts()",
    "function updateUnlockedAmountsForUser(address)",
    "function getVestingSchedule(address) view returns (uint256, uint256, uint256, uint256, uint256, bool, bool)",
    "function getVestedAmount(address) view returns (uint256)",
    "function getUnlockedAmount(address) view returns (uint256)",
    "function getLockedAmount(address) view returns (uint256)",
    "function transferableBalance(address) view returns (uint256)",
    "function getVestingStats() view returns (uint256, uint256, uint256, uint256, bool)",
    "function getAllParticipants() view returns (address[])",
    "function getParticipantCount() view returns (uint256)",
    "function isParticipant(address) view returns (bool)",
    "function isValidReleaseInterval(uint256) view returns (bool)",
    
    // Tax Management
    "function updateTransferTaxRate(uint256)",
    "function updateLPContributionRate(uint256)",
    "function updateDevelopmentRate(uint256)",
    "function updateMarketingRate(uint256)",
    "function updateBurnRate(uint256)",
    "function getTaxBreakdown() view returns (uint256, uint256, uint256, uint256, uint256)",
    "function transferTaxRate() view returns (uint256)",
    "function lpContributionRate() view returns (uint256)",
    "function developmentRate() view returns (uint256)",
    "function marketingRate() view returns (uint256)",
    "function burnRate() view returns (uint256)",
    
    // Wallet Management
    "function updateLPWallet(address)",
    "function updateMarketingWallet(address)",
    "function updateDevelopmentWallet(address)",
    "function lpWallet() view returns (address)",
    "function marketingWallet() view returns (address)",
    "function developmentWallet() view returns (address)",
    
    // Exclusion Management
    "function setTaxExclusion(address, bool)",
    "function setMaxTxExclusion(address, bool)",
    "function isExcludedFromTax(address) view returns (bool)",
    "function isExcludedFromMaxTx(address) view returns (bool)",
    
    // Transaction Limits
    "function updateMaxTxAmount(uint256)",
    "function maxTxAmount() view returns (uint256)",
    
    // Pause/Unpause
    "function pause()",
    "function unpause()",
    "function paused() view returns (bool)",
    
    // Admin Rights
    "function burnAdminRights()",
    "function owner() view returns (address)",
    
    // Events
    "event VestingScheduleCreated(address indexed user, uint256 amount, uint256 startTime, uint256 endTime, uint256 releaseInterval)",
    "event TokensUnlocked(address indexed user, uint256 amount, uint256 timestamp)",
    "event EarlyRelease(address indexed user, uint256 amount, uint256 timestamp)",
    "event EmergencyUnlockAll(address indexed user, uint256 amount, uint256 timestamp)",
    "event VestingScheduleModified(address indexed user, uint256 newAmount, uint256 timestamp)",
    "event VestingInconsistencyDetected(address indexed user, uint256 recordedAmount, uint256 calculatedAmount, uint256 timestamp)",
    "event TransferTaxUpdated(uint256 newRate)",
    "event LPContributionRateUpdated(uint256 newRate)",
    "event DevelopmentRateUpdated(uint256 newRate)",
    "event MarketingRateUpdated(uint256 newRate)",
    "event BurnRateUpdated(uint256 newRate)",
    "event LPWalletUpdated(address newWallet)",
    "event MarketingWalletUpdated(address newWallet)",
    "event DevelopmentWalletUpdated(address newWallet)",
    "event TaxExclusionUpdated(address indexed account, bool excluded)",
    "event MaxTxExclusionUpdated(address indexed account, bool excluded)",
    "event MaxTxAmountUpdated(uint256 newAmount)"
];

// Configuration
const NETWORKS = {
    bsc: {
        chainId: 56,
        name: 'Binance Smart Chain',
        rpcUrl: 'https://bsc-dataseed.binance.org/',
        explorer: 'https://bscscan.com'
    },
    bscTestnet: {
        chainId: 97,
        name: 'BSC Testnet',
        rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
        explorer: 'https://testnet.bscscan.com'
    }
};

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    setupEventListeners();
    loadContractAddress();
});

// Initialize dashboard
function initializeDashboard() {
    console.log('Initializing MSVP Token Vesting Admin Dashboard...');
    loadContractAddress();
    updateWalletStatus();
    setupCSVUpload();
    displayContractAddress();
}

// Setup event listeners
function setupEventListeners() {
    // Wallet connection
    document.getElementById('connectWallet').addEventListener('click', connectWallet);
    document.getElementById('disconnectWallet').addEventListener('click', disconnectWallet);
    
    // Vesting management
    document.getElementById('updateUnlockedAmounts').addEventListener('click', updateUnlockedAmounts);
    document.getElementById('updateUserUnlocked').addEventListener('click', updateUserUnlocked);
    document.getElementById('createSingleVesting').addEventListener('click', createSingleVesting);
    document.getElementById('createBulkVesting').addEventListener('click', createBulkVesting);
    document.getElementById('earlyRelease').addEventListener('click', earlyRelease);
    document.getElementById('emergencyUnlockAll').addEventListener('click', emergencyUnlockAll);
    document.getElementById('modifyVesting').addEventListener('click', modifyVestingSchedule);
    
    // Tax management
    document.getElementById('updateTransferTax').addEventListener('click', updateTransferTaxRate);
    document.getElementById('updateMaxTx').addEventListener('click', updateMaxTxAmount);
    document.getElementById('updateLPContribution').addEventListener('click', updateLPContributionRate);
    document.getElementById('updateDevelopment').addEventListener('click', updateDevelopmentRate);
    document.getElementById('updateMarketing').addEventListener('click', updateMarketingRate);
    document.getElementById('updateBurn').addEventListener('click', updateBurnRate);
    
    // Wallet management
    document.getElementById('updateLPWallet').addEventListener('click', updateLPWallet);
    document.getElementById('updateMarketingWallet').addEventListener('click', updateMarketingWallet);
    document.getElementById('updateDevelopmentWallet').addEventListener('click', updateDevelopmentWallet);
    
    // Exclusion management
    document.getElementById('excludeFromTax').addEventListener('click', () => setTaxExclusion(true));
    document.getElementById('includeInTax').addEventListener('click', () => setTaxExclusion(false));
    document.getElementById('excludeFromMaxTx').addEventListener('click', () => setMaxTxExclusion(true));
    document.getElementById('includeInMaxTx').addEventListener('click', () => setMaxTxExclusion(false));
    
    // Emergency controls
    document.getElementById('pauseContract').addEventListener('click', pauseContract);
    document.getElementById('unpauseContract').addEventListener('click', unpauseContract);
    document.getElementById('confirmBurnAdmin').addEventListener('click', burnAdminRights);
    
    // Monitoring
    document.getElementById('lookupParticipant').addEventListener('click', lookupParticipant);
    document.getElementById('refreshStats').addEventListener('click', refreshStatistics);
    document.getElementById('exportParticipants').addEventListener('click', exportParticipants);
    document.getElementById('viewAllParticipants').addEventListener('click', viewAllParticipants);
    document.getElementById('exportParticipantsCSV').addEventListener('click', exportParticipantsCSV);
}

// Load contract address from localStorage or use deployed address
function loadContractAddress() {
    // Clear localStorage to force new contract address
    localStorage.removeItem('msvContractAddress');
    
    contractAddress = localStorage.getItem('msvContractAddress');
    if (!contractAddress) {
        // Use the deployed contract address from BSC testnet
        contractAddress = '0x90D29a452e52982c9cEcD04B2ed788215Aa97ce3';
        localStorage.setItem('msvContractAddress', contractAddress);
        console.log('✔ Using deployed contract address:', contractAddress);
    }
}

// Display contract address in the dashboard
function displayContractAddress() {
    const addressDisplay = document.getElementById('contractAddressDisplay');
    if (addressDisplay && contractAddress) {
        addressDisplay.textContent = contractAddress;
    }
}

// Copy contract address to clipboard
function copyContractAddress() {
    if (contractAddress) {
        navigator.clipboard.writeText(contractAddress).then(() => {
            showAlert('Contract address copied to clipboard!', 'success');
        }).catch(() => {
            showAlert('Failed to copy address', 'warning');
        });
    }
}

// Change contract address
function changeContractAddress() {
    const newAddress = prompt('Enter new contract address:', contractAddress);
    if (newAddress && newAddress !== contractAddress) {
        contractAddress = newAddress;
        localStorage.setItem('msvContractAddress', contractAddress);
        displayContractAddress();
        showAlert('Contract address updated!', 'success');
        
        // Disconnect wallet if connected to force reconnection with new contract
        if (isConnected) {
            disconnectWallet();
        }
    }
}

// WalletConnect integration
async function connectWallet() {
    try {
        showLoading(true);
        
        // Check if ethers is available
        if (typeof ethers === 'undefined') {
            throw new Error('Ethers library not loaded. Please refresh the page.');
        }
        
        // Check if MetaMask is available first
        if (typeof window.ethereum !== 'undefined') {
            // Use MetaMask
            await connectMetaMask();
        } else {
            // Use WalletConnect
            await connectWalletConnect();
        }
        
    } catch (error) {
        console.error('Error connecting wallet:', error);
        showAlert('Failed to connect wallet: ' + error.message, 'danger');
        showLoading(false);
    }
}



// Connect using MetaMask
async function connectMetaMask() {
    try {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Check if we're on the right network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        if (chainId !== '0x61') { // BSC Testnet chainId
            // Try to switch to BSC Testnet
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0x61' }],
                });
            } catch (switchError) {
                // If BSC Testnet is not added, add it
                if (switchError.code === 4902) {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: '0x61',
                            chainName: 'BSC Testnet',
                            nativeCurrency: {
                                name: 'BNB',
                                symbol: 'tBNB',
                                decimals: 18,
                            },
                            rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
                            blockExplorerUrls: ['https://testnet.bscscan.com/'],
                        }],
                    });
                }
            }
        }
        
        // Create provider and signer
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        
        // Get connected address
        const address = await signer.getAddress();
        console.log('Connected address:', address);
        
        // Initialize contract
        contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
        
        // Verify contract ownership (with better error handling)
        try {
            console.log('Checking contract ownership...');
            const owner = await contract.owner();
            console.log('Contract owner:', owner);
            
            if (owner.toLowerCase() !== address.toLowerCase()) {
                console.log(' Ownership mismatch - allowing connection for testing');
                console.log('Owner:', owner.toLowerCase());
                console.log('Connected:', address.toLowerCase());
            } else {
                console.log('✔ Ownership verified successfully!');
            }
        } catch (error) {
            console.error('Error verifying ownership:', error);
            console.log(' Allowing connection despite ownership verification error');
        }
        
        isConnected = true;
        updateWalletStatus(address);
        refreshStatistics();
        
        showAlert('Wallet connected successfully!', 'success');
        
        // Listen for account changes
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                disconnectWallet();
            } else {
                updateWalletStatus(accounts[0]);
            }
        });
        
        // Listen for chain changes
        window.ethereum.on('chainChanged', (chainId) => {
            if (chainId !== '0x61') {
                showAlert('Please switch to BSC Testnet', 'warning');
                disconnectWallet();
            }
        });
        
    } catch (error) {
        console.error('MetaMask connection error:', error);
        throw new Error('MetaMask connection failed: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Connect using WalletConnect
async function connectWalletConnect() {
    try {
        // Create WalletConnect provider
        const WalletConnectProvider = window.WalletConnectProvider?.default || window.WalletConnectProvider;
        
        if (!WalletConnectProvider) {
            throw new Error('WalletConnect not available. Please install WalletConnect or use MetaMask.');
        }
        
        const walletConnectProvider = new WalletConnectProvider({
            rpc: {
                97: 'https://data-seed-prebsc-1-s1.binance.org:8545/', // BSC Testnet
                56: 'https://bsc-dataseed.binance.org/', // BSC Mainnet
            },
            chainId: 97, // Default to BSC Testnet
        });
        
        // Enable session
        await walletConnectProvider.enable();
        
        // Create ethers provider and signer
        provider = new ethers.providers.Web3Provider(walletConnectProvider);
        signer = provider.getSigner();
        
        // Get connected address
        const address = await signer.getAddress();
        console.log('Connected address:', address);
        
        // Initialize contract
        contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
        
        // Verify contract ownership (with better error handling)
        try {
            console.log('Checking contract ownership...');
            const owner = await contract.owner();
            console.log('Contract owner:', owner);
            
            if (owner.toLowerCase() !== address.toLowerCase()) {
                console.log(' Ownership mismatch - allowing connection for testing');
                console.log('Owner:', owner.toLowerCase());
                console.log('Connected:', address.toLowerCase());
            } else {
                console.log('✔ Ownership verified successfully!');
            }
        } catch (error) {
            console.error('Error verifying ownership:', error);
            console.log(' Allowing connection despite ownership verification error');
        }
        
        isConnected = true;
        updateWalletStatus(address);
        refreshStatistics();
        
        showAlert('Wallet connected successfully!', 'success');
        
        // Listen for account changes
        walletConnectProvider.on("accountsChanged", (accounts) => {
            if (accounts.length === 0) {
                disconnectWallet();
            } else {
                updateWalletStatus(accounts[0]);
            }
        });
        
        // Listen for chain changes
        walletConnectProvider.on("chainChanged", (chainId) => {
            if (chainId !== 97) {
                showAlert('Please switch to BSC Testnet', 'warning');
                disconnectWallet();
            }
        });
        
        // Listen for disconnect
        walletConnectProvider.on("disconnect", () => {
            disconnectWallet();
        });
        
    } catch (error) {
        throw new Error('WalletConnect connection failed: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Disconnect wallet
function disconnectWallet() {
    isConnected = false;
    provider = null;
    signer = null;
    contract = null;
    updateWalletStatus();
    showAlert('Wallet disconnected', 'info');
}

// Update wallet status display
function updateWalletStatus(address = null) {
    const statusIndicator = document.getElementById('statusIndicator');
    const walletAddress = document.getElementById('walletAddress');
    const connectBtn = document.getElementById('connectWallet');
    const disconnectBtn = document.getElementById('disconnectWallet');
    const contractStats = document.getElementById('contractStats');
    
    if (address && isConnected) {
        statusIndicator.className = 'status-indicator status-connected';
        walletAddress.textContent = `${address.substring(0, 6)}...${address.substring(38)}`;
        connectBtn.style.display = 'none';
        disconnectBtn.style.display = 'inline-block';
        contractStats.style.display = 'block';
    } else {
        statusIndicator.className = 'status-indicator status-disconnected';
        walletAddress.textContent = 'Not connected';
        connectBtn.style.display = 'inline-block';
        disconnectBtn.style.display = 'none';
        contractStats.style.display = 'none';
    }
}

// Vesting Management Functions

async function updateUserUnlocked() {
    if (!checkConnection()) return;
    
    const address = document.getElementById('updateUserAddress').value;
    if (!address) {
        showAlert('Please enter user address', 'warning');
        return;
    }
    
    try {
        showLoading(true);
        const tx = await contract.updateUnlockedAmountsForUser(address);
        await tx.wait();
        showAlert('User unlocked amounts updated successfully!', 'success');
        document.getElementById('updateUserAddress').value = '';
        refreshStatistics();
    } catch (error) {
        console.error('Error updating user unlocked amounts:', error);
        showAlert('Failed to update user unlocked amounts: ' + error.message, 'danger');
    } finally {
        showLoading(false);
    }
}

async function updateUnlockedAmounts() {
    if (!checkConnection()) return;
    
    if (!confirm('This will update unlocked amounts for ALL participants. This can be expensive in gas fees. Continue?')) {
        return;
    }
    
    try {
        showLoading(true);
        const tx = await contract.updateUnlockedAmounts();
        await tx.wait();
        showAlert('All unlocked amounts updated successfully!', 'success');
        refreshStatistics();
    } catch (error) {
        console.error('Error updating unlocked amounts:', error);
        showAlert('Failed to update unlocked amounts: ' + error.message, 'danger');
    } finally {
        showLoading(false);
    }
}

async function createSingleVesting() {
    if (!checkConnection()) return;
    
    const address = document.getElementById('singleUserAddress').value;
    const amount = document.getElementById('singleUserAmount').value;
    const interval = document.getElementById('singleUserInterval').value;
    
    if (!address || !amount || !interval) {
        showAlert('Please fill in all fields', 'warning');
        return;
    }
    
    try {
        showLoading(true);
        const amountWei = ethers.utils.parseEther(amount);
        
        const tx = await contract.createVestingSchedule(address, amountWei);
        await tx.wait();
        
        showAlert('Vesting schedule created successfully!', 'success');
        document.getElementById('singleUserAddress').value = '';
        document.getElementById('singleUserAmount').value = '';
        refreshStatistics();
    } catch (error) {
        console.error('Error creating vesting schedule:', error);
        showAlert('Failed to create vesting schedule: ' + error.message, 'danger');
    } finally {
        showLoading(false);
    }
}

async function createBulkVesting() {
    if (!checkConnection()) return;
    
    const csvData = window.csvData;
    const interval = document.getElementById('bulkInterval').value;
    
    if (!csvData || csvData.length === 0) {
        showAlert('Please upload a CSV file first', 'warning');
        return;
    }
    
    try {
        showLoading(true);
        
        const addresses = [];
        const amounts = [];
        
        for (const row of csvData) {
            if (row.address && row.amount) {
                addresses.push(row.address);
                amounts.push(ethers.utils.parseEther(row.amount.toString()));
            }
        }
        
        if (addresses.length === 0) {
            showAlert('No valid data found in CSV', 'warning');
            return;
        }
        
        const tx = await contract.createVestingSchedules(addresses, amounts);
        await tx.wait();
        
        showAlert(`Created ${addresses.length} vesting schedules successfully!`, 'success');
        window.csvData = null;
        document.getElementById('csvFile').value = '';
        refreshStatistics();
    } catch (error) {
        console.error('Error creating bulk vesting:', error);
        showAlert('Failed to create bulk vesting: ' + error.message, 'danger');
    } finally {
        showLoading(false);
    }
}

async function earlyRelease() {
    if (!checkConnection()) return;
    
    const address = document.getElementById('earlyReleaseAddress').value;
    const amount = document.getElementById('earlyReleaseAmount').value;
    
    if (!address || !amount) {
        showAlert('Please fill in all fields', 'warning');
        return;
    }
    
    try {
        showLoading(true);
        const amountWei = ethers.utils.parseEther(amount);
        
        const tx = await contract.earlyRelease(address, amountWei);
        await tx.wait();
        
        showAlert('Early release completed successfully!', 'success');
        document.getElementById('earlyReleaseAddress').value = '';
        document.getElementById('earlyReleaseAmount').value = '';
        refreshStatistics();
    } catch (error) {
        console.error('Error performing early release:', error);
        showAlert('Failed to perform early release: ' + error.message, 'danger');
    } finally {
        showLoading(false);
    }
}

async function emergencyUnlockAll() {
    if (!checkConnection()) return;
    
    const address = document.getElementById('emergencyUnlockAddress').value;
    
    if (!address) {
        showAlert('Please enter a valid address', 'warning');
        return;
    }
    
    // Show confirmation dialog
    if (!confirm(` EMERGENCY ACTION \n\nThis will unlock ALL remaining tokens for:\n${address}\n\nThis action cannot be undone. Are you sure?`)) {
        return;
    }
    
    try {
        showLoading(true);
        
        // Check if user has locked tokens first
        const lockedAmount = await contract.getLockedAmount(address);
        if (lockedAmount.eq(0)) {
            showAlert('This address has no locked tokens to unlock', 'warning');
            return;
        }
        
        const tx = await contract.emergencyUnlockAll(address);
        await tx.wait();
        
        const amountFormatted = ethers.utils.formatEther(lockedAmount);
        showAlert(`Emergency unlock completed! ${amountFormatted} tokens unlocked for ${address}`, 'success');
        document.getElementById('emergencyUnlockAddress').value = '';
        refreshStatistics();
    } catch (error) {
        console.error('Error performing emergency unlock:', error);
        showAlert('Failed to perform emergency unlock: ' + error.message, 'danger');
    } finally {
        showLoading(false);
    }
}

async function modifyVestingSchedule() {
    if (!checkConnection()) return;
    
    const address = document.getElementById('modifyAddress').value;
    const amount = document.getElementById('modifyAmount').value;
    
    if (!address || !amount) {
        showAlert('Please fill in all fields', 'warning');
        return;
    }
    
    try {
        showLoading(true);
        const amountWei = ethers.utils.parseEther(amount);
        
        const tx = await contract.modifyVestingSchedule(address, amountWei);
        await tx.wait();
        
        showAlert('Vesting schedule modified successfully!', 'success');
        document.getElementById('modifyAddress').value = '';
        document.getElementById('modifyAmount').value = '';
        refreshStatistics();
    } catch (error) {
        console.error('Error modifying vesting schedule:', error);
        showAlert('Failed to modify vesting schedule: ' + error.message, 'danger');
    } finally {
        showLoading(false);
    }
}

// Tax Management Functions

async function updateTransferTaxRate() {
    if (!checkConnection()) return;
    
    const rate = document.getElementById('transferTaxRate').value;
    if (!rate || rate < 0 || rate > 100) {
        showAlert('Tax rate must be between 0 and 100 (10%)', 'warning');
        return;
    }
    
    try {
        showLoading(true);
        const tx = await contract.updateTransferTaxRate(rate);
        await tx.wait();
        showAlert('Transfer tax rate updated successfully!', 'success');
        refreshStatistics();
    } catch (error) {
        console.error('Error updating transfer tax rate:', error);
        showAlert('Failed to update transfer tax rate: ' + error.message, 'danger');
    } finally {
        showLoading(false);
    }
}

async function updateMaxTxAmount() {
    if (!checkConnection()) return;
    
    const amount = document.getElementById('maxTxAmount').value;
    if (!amount) {
        showAlert('Please enter max transaction amount', 'warning');
        return;
    }
    
    try {
        showLoading(true);
        const amountWei = ethers.utils.parseEther(amount);
        const tx = await contract.updateMaxTxAmount(amountWei);
        await tx.wait();
        showAlert('Max transaction amount updated successfully!', 'success');
        refreshStatistics();
    } catch (error) {
        console.error('Error updating max transaction amount:', error);
        showAlert('Failed to update max transaction amount: ' + error.message, 'danger');
    } finally {
        showLoading(false);
    }
}

async function updateLPContributionRate() {
    if (!checkConnection()) return;
    
    const rate = document.getElementById('lpContributionRate').value;
    if (!rate) {
        showAlert('Please enter LP contribution rate', 'warning');
        return;
    }
    
    try {
        showLoading(true);
        const tx = await contract.updateLPContributionRate(rate);
        await tx.wait();
        showAlert('LP contribution rate updated successfully!', 'success');
        refreshStatistics();
    } catch (error) {
        console.error('Error updating LP contribution rate:', error);
        showAlert('Failed to update LP contribution rate: ' + error.message, 'danger');
    } finally {
        showLoading(false);
    }
}

async function updateDevelopmentRate() {
    if (!checkConnection()) return;
    
    const rate = document.getElementById('developmentRate').value;
    if (!rate) {
        showAlert('Please enter development rate', 'warning');
        return;
    }
    
    try {
        showLoading(true);
        const tx = await contract.updateDevelopmentRate(rate);
        await tx.wait();
        showAlert('Development rate updated successfully!', 'success');
        refreshStatistics();
    } catch (error) {
        console.error('Error updating development rate:', error);
        showAlert('Failed to update development rate: ' + error.message, 'danger');
    } finally {
        showLoading(false);
    }
}

async function updateMarketingRate() {
    if (!checkConnection()) return;
    
    const rate = document.getElementById('marketingRate').value;
    if (!rate) {
        showAlert('Please enter marketing rate', 'warning');
        return;
    }
    
    try {
        showLoading(true);
        const tx = await contract.updateMarketingRate(rate);
        await tx.wait();
        showAlert('Marketing rate updated successfully!', 'success');
        refreshStatistics();
    } catch (error) {
        console.error('Error updating marketing rate:', error);
        showAlert('Failed to update marketing rate: ' + error.message, 'danger');
    } finally {
        showLoading(false);
    }
}

async function updateBurnRate() {
    if (!checkConnection()) return;
    
    const rate = document.getElementById('burnRate').value;
    if (!rate) {
        showAlert('Please enter burn rate', 'warning');
        return;
    }
    
    try {
        showLoading(true);
        const tx = await contract.updateBurnRate(rate);
        await tx.wait();
        showAlert('Burn rate updated successfully!', 'success');
        refreshStatistics();
    } catch (error) {
        console.error('Error updating burn rate:', error);
        showAlert('Failed to update burn rate: ' + error.message, 'danger');
    } finally {
        showLoading(false);
    }
}

// Wallet Management Functions

async function updateLPWallet() {
    if (!checkConnection()) return;
    
    const address = document.getElementById('lpWallet').value;
    if (!address) {
        showAlert('Please enter LP wallet address', 'warning');
        return;
    }
    
    try {
        showLoading(true);
        const tx = await contract.updateLPWallet(address);
        await tx.wait();
        showAlert('LP wallet updated successfully!', 'success');
        refreshStatistics();
    } catch (error) {
        console.error('Error updating LP wallet:', error);
        showAlert('Failed to update LP wallet: ' + error.message, 'danger');
    } finally {
        showLoading(false);
    }
}

async function updateMarketingWallet() {
    if (!checkConnection()) return;
    
    const address = document.getElementById('marketingWallet').value;
    if (!address) {
        showAlert('Please enter marketing wallet address', 'warning');
        return;
    }
    
    try {
        showLoading(true);
        const tx = await contract.updateMarketingWallet(address);
        await tx.wait();
        showAlert('Marketing wallet updated successfully!', 'success');
        refreshStatistics();
    } catch (error) {
        console.error('Error updating marketing wallet:', error);
        showAlert('Failed to update marketing wallet: ' + error.message, 'danger');
    } finally {
        showLoading(false);
    }
}

async function updateDevelopmentWallet() {
    if (!checkConnection()) return;
    
    const address = document.getElementById('developmentWallet').value;
    if (!address) {
        showAlert('Please enter development wallet address', 'warning');
        return;
    }
    
    try {
        showLoading(true);
        const tx = await contract.updateDevelopmentWallet(address);
        await tx.wait();
        showAlert('Development wallet updated successfully!', 'success');
        refreshStatistics();
    } catch (error) {
        console.error('Error updating development wallet:', error);
        showAlert('Failed to update development wallet: ' + error.message, 'danger');
    } finally {
        showLoading(false);
    }
}

// Exclusion Management Functions

async function setTaxExclusion(exclude) {
    if (!checkConnection()) return;
    
    const address = document.getElementById('taxExclusionAddress').value;
    if (!address) {
        showAlert('Please enter address', 'warning');
        return;
    }
    
    try {
        showLoading(true);
        const tx = await contract.setTaxExclusion(address, exclude);
        await tx.wait();
        showAlert(`Address ${exclude ? 'excluded from' : 'included in'} tax successfully!`, 'success');
        document.getElementById('taxExclusionAddress').value = '';
        refreshStatistics();
    } catch (error) {
        console.error('Error setting tax exclusion:', error);
        showAlert('Failed to set tax exclusion: ' + error.message, 'danger');
    } finally {
        showLoading(false);
    }
}

async function setMaxTxExclusion(exclude) {
    if (!checkConnection()) return;
    
    const address = document.getElementById('maxTxExclusionAddress').value;
    if (!address) {
        showAlert('Please enter address', 'warning');
        return;
    }
    
    try {
        showLoading(true);
        const tx = await contract.setMaxTxExclusion(address, exclude);
        await tx.wait();
        showAlert(`Address ${exclude ? 'excluded from' : 'included in'} max transaction limit successfully!`, 'success');
        document.getElementById('maxTxExclusionAddress').value = '';
        refreshStatistics();
    } catch (error) {
        console.error('Error setting max transaction exclusion:', error);
        showAlert('Failed to set max transaction exclusion: ' + error.message, 'danger');
    } finally {
        showLoading(false);
    }
}

// Emergency Control Functions

async function pauseContract() {
    if (!checkConnection()) return;
    
    if (!confirm('Are you sure you want to pause the contract? This will stop all transfers.')) {
        return;
    }
    
    try {
        showLoading(true);
        const tx = await contract.pause();
        await tx.wait();
        showAlert('Contract paused successfully!', 'success');
        refreshStatistics();
    } catch (error) {
        console.error('Error pausing contract:', error);
        showAlert('Failed to pause contract: ' + error.message, 'danger');
    } finally {
        showLoading(false);
    }
}

async function unpauseContract() {
    if (!checkConnection()) return;
    
    try {
        showLoading(true);
        const tx = await contract.unpause();
        await tx.wait();
        showAlert('Contract unpaused successfully!', 'success');
        refreshStatistics();
    } catch (error) {
        console.error('Error unpausing contract:', error);
        showAlert('Failed to unpause contract: ' + error.message, 'danger');
    } finally {
        showLoading(false);
    }
}

async function burnAdminRights() {
    if (!checkConnection()) return;
    
    if (!confirm('Are you absolutely sure you want to burn admin rights? This action cannot be undone!')) {
        return;
    }
    
    try {
        showLoading(true);
        const tx = await contract.burnAdminRights();
        await tx.wait();
        showAlert('Admin rights burned successfully! You can no longer perform admin functions.', 'warning');
        disconnectWallet();
    } catch (error) {
        console.error('Error burning admin rights:', error);
        showAlert('Failed to burn admin rights: ' + error.message, 'danger');
    } finally {
        showLoading(false);
    }
}

// Monitoring Functions

async function lookupParticipant() {
    if (!checkConnection()) return;
    
    const address = document.getElementById('participantAddress').value;
    if (!address) {
        showAlert('Please enter an address', 'warning');
        return;
    }
    
    try {
        showLoading(true);
        
        const schedule = await contract.getVestingSchedule(address);
        const isParticipant = await contract.isParticipant(address);
        
        if (!isParticipant) {
            showAlert('Address is not a vesting participant', 'info');
            document.getElementById('participantInfo').style.display = 'none';
            return;
        }
        
        const [
            totalAmount,
            unlockedAmount,
            startTime,
            endTime,
            releaseInterval,
            isActive,
            isAirdrop
        ] = schedule;
        
        // Get additional balance information
        const baseBalance = await contract.balanceOf(address);
        const transferableBalance = await contract.transferableBalance(address);
        const lockedAmount = await contract.getLockedAmount(address);
        const vestedAmount = await contract.getVestedAmount(address);
        
        const details = `
            <div class="row">
                <div class="col-6">
                    <strong>Total Vesting Amount:</strong><br>
                    ${ethers.utils.formatEther(totalAmount)} MSVP
                </div>
                <div class="col-6">
                    <strong>Unlocked Amount:</strong><br>
                    ${ethers.utils.formatEther(unlockedAmount)} MSVP
                </div>
            </div>
            <div class="row mt-2">
                <div class="col-6">
                    <strong>Base Balance (Held):</strong><br>
                    ${ethers.utils.formatEther(baseBalance)} MSVP
                </div>
                <div class="col-6">
                    <strong>Transferable Balance:</strong><br>
                    ${ethers.utils.formatEther(transferableBalance)} MSVP
                </div>
            </div>
            <div class="row mt-2">
                <div class="col-6">
                    <strong>Currently Locked:</strong><br>
                    ${ethers.utils.formatEther(lockedAmount)} MSVP
                </div>
                <div class="col-6">
                    <strong>Vested Amount:</strong><br>
                    ${ethers.utils.formatEther(vestedAmount)} MSVP
                </div>
            </div>
            <div class="row mt-2">
                <div class="col-6">
                    <strong>Start Time:</strong><br>
                    ${new Date(startTime * 1000).toLocaleDateString()}
                </div>
                <div class="col-6">
                    <strong>End Time:</strong><br>
                    ${new Date(endTime * 1000).toLocaleDateString()}
                </div>
            </div>
            <div class="row mt-2">
                <div class="col-6">
                    <strong>Release Interval:</strong><br>
                    ${releaseInterval / (24 * 60 * 60)} days
                </div>
                <div class="col-6">
                    <strong>Status:</strong><br>
                    <span class="badge ${isActive ? 'bg-success' : 'bg-secondary'}">${isActive ? 'Active' : 'Inactive'}</span>
                </div>
            </div>
        `;
        
        document.getElementById('participantDetails').innerHTML = details;
        document.getElementById('participantInfo').style.display = 'block';
        
    } catch (error) {
        console.error('Error looking up participant:', error);
        showAlert('Failed to lookup participant: ' + error.message, 'danger');
    } finally {
        showLoading(false);
    }
}

async function refreshStatistics() {
    if (!isConnected || !contract) return;
    
    try {
        const [
            totalParticipants,
            totalAllocated,
            totalUnlocked,
            remainingTokens,
            isVestingStarted
        ] = await contract.getVestingStats();
        
        const totalSupply = await contract.totalSupply();
        const transferTaxRate = await contract.transferTaxRate();
        const paused = await contract.paused();
        
        // Get tax breakdown
        const [taxRate, lpRate, devRate, marketingRate, burnRate] = await contract.getTaxBreakdown();
        
        // Update statistics display
        document.getElementById('totalParticipants').textContent = totalParticipants.toString();
        document.getElementById('totalAllocated').textContent = ethers.utils.formatEther(totalAllocated);
        document.getElementById('totalUnlocked').textContent = ethers.utils.formatEther(totalUnlocked);
        document.getElementById('remainingTokens').textContent = ethers.utils.formatEther(remainingTokens);
        
        document.getElementById('totalSupply').textContent = ethers.utils.formatEther(totalSupply);
        document.getElementById('currentTaxRate').textContent = (transferTaxRate / 10).toFixed(1) + '%';
        document.getElementById('vestingStatus').textContent = isVestingStarted ? 'Active' : 'No Participants';
        document.getElementById('contractStatus').textContent = paused ? 'Paused' : 'Active';
        
        // Update tax breakdown
        document.getElementById('lpRate').textContent = (lpRate / 10).toFixed(1) + '%';
        document.getElementById('devRate').textContent = (devRate / 10).toFixed(1) + '%';
        document.getElementById('marketingRate').textContent = (marketingRate / 10).toFixed(1) + '%';
        document.getElementById('burnRate').textContent = (burnRate / 10).toFixed(1) + '%';
        
        // Update badges
        document.getElementById('vestingStatusBadge').className = `badge ${isVestingStarted ? 'bg-success' : 'bg-warning'}`;
        document.getElementById('vestingStatusBadge').textContent = isVestingStarted ? 'Active' : 'No Participants';
        
        document.getElementById('contractStatusBadge').className = `badge ${paused ? 'bg-danger' : 'bg-success'}`;
        document.getElementById('contractStatusBadge').textContent = paused ? 'Paused' : 'Active';
        
    } catch (error) {
        console.error('Error refreshing statistics:', error);
    }
}

async function viewAllParticipants() {
    if (!checkConnection()) return;
    
    try {
        showLoading(true);
        
        const participants = await contract.getAllParticipants();
        const tableBody = document.getElementById('participantsTableBody');
        
        if (participants.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No participants found</td></tr>';
        } else {
            let tableHTML = '';
            
            for (const address of participants) {
                const schedule = await contract.getVestingSchedule(address);
                const [
                    totalAmount,
                    unlockedAmount,
                    startTime,
                    endTime,
                    releaseInterval,
                    isActive,
                    isAirdrop
                ] = schedule;
                
                const progress = totalAmount.gt(0) ? (unlockedAmount.mul(100).div(totalAmount)).toNumber() : 0;
                
                tableHTML += `
                    <tr>
                        <td>${address.substring(0, 6)}...${address.substring(38)}</td>
                        <td>${ethers.utils.formatEther(totalAmount)}</td>
                        <td>${ethers.utils.formatEther(unlockedAmount)}</td>
                        <td>${ethers.utils.formatEther(totalAmount.sub(unlockedAmount))}</td>
                        <td>
                            <div class="progress">
                                <div class="progress-bar" style="width: ${progress}%"></div>
                            </div>
                            <small>${progress}%</small>
                        </td>
                        <td>
                            <span class="badge ${isActive ? 'bg-success' : 'bg-secondary'}">${isActive ? 'Active' : 'Inactive'}</span>
                        </td>
                    </tr>
                `;
            }
            
            tableBody.innerHTML = tableHTML;
        }
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('allParticipantsModal'));
        modal.show();
        
    } catch (error) {
        console.error('Error loading participants:', error);
        showAlert('Failed to load participants: ' + error.message, 'danger');
    } finally {
        showLoading(false);
    }
}

async function exportParticipants() {
    if (!checkConnection()) return;
    
    try {
        showLoading(true);
        
        const participants = await contract.getAllParticipants();
        const data = [];
        
        for (const address of participants) {
            const schedule = await contract.getVestingSchedule(address);
            const [
                totalAmount,
                unlockedAmount,
                startTime,
                endTime,
                releaseInterval,
                isActive,
                isAirdrop
            ] = schedule;
            
            data.push({
                address: address,
                totalAmount: ethers.utils.formatEther(totalAmount),
                unlockedAmount: ethers.utils.formatEther(unlockedAmount),
                currentUnlocked: ethers.utils.formatEther(totalAmount.sub(unlockedAmount)),
                lockedAmount: ethers.utils.formatEther(totalAmount.sub(unlockedAmount)),
                startTime: new Date(startTime * 1000).toISOString(),
                endTime: new Date(endTime * 1000).toISOString(),
                releaseInterval: releaseInterval / (24 * 60 * 60),
                isActive: isActive,
                isAirdrop: isAirdrop
            });
        }
        
        // Create CSV content
        const csvContent = convertToCSV(data);
        
        // Download file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'msv_participants.csv';
        a.click();
        window.URL.revokeObjectURL(url);
        
        showAlert('Participants exported successfully!', 'success');
        
    } catch (error) {
        console.error('Error exporting participants:', error);
        showAlert('Failed to export participants: ' + error.message, 'danger');
    } finally {
        showLoading(false);
    }
}

async function exportParticipantsCSV() {
    await exportParticipants();
}

// CSV Upload Functions

function setupCSVUpload() {
    const csvUpload = document.getElementById('csvUpload');
    const csvFile = document.getElementById('csvFile');
    
    // Drag and drop functionality
    csvUpload.addEventListener('dragover', (e) => {
        e.preventDefault();
        csvUpload.classList.add('dragover');
    });
    
    csvUpload.addEventListener('dragleave', () => {
        csvUpload.classList.remove('dragover');
    });
    
    csvUpload.addEventListener('drop', (e) => {
        e.preventDefault();
        csvUpload.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleCSVFile(files[0]);
        }
    });
    
    // File input change
    csvFile.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleCSVFile(e.target.files[0]);
        }
    });
}

function handleCSVFile(file) {
    if (!file.name.endsWith('.csv')) {
        showAlert('Please select a CSV file', 'warning');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const csv = e.target.result;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = lines[i].split(',').map(v => v.trim());
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index];
                });
                data.push(row);
            }
        }
        
        window.csvData = data;
        showAlert(`Loaded ${data.length} entries from CSV`, 'success');
    };
    
    reader.readAsText(file);
}

// Utility Functions

function checkConnection() {
    if (!isConnected || !contract) {
        showAlert('Please connect your wallet first', 'warning');
        return false;
    }
    return true;
}

function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (show) {
        spinner.style.display = 'block';
    } else {
        spinner.style.display = 'none';
    }
}

function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

function convertToCSV(data) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
        const values = headers.map(header => {
            const value = row[header];
            return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        });
        csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
}

// Add recent activity
function addActivity(action, details) {
    const activityDiv = document.getElementById('recentActivity');
    const timestamp = new Date().toLocaleTimeString();
    
    const activityItem = document.createElement('div');
    activityItem.className = 'mb-2 p-2 border-start border-primary';
    activityItem.innerHTML = `
        <small class="text-muted">${timestamp}</small><br>
        <strong>${action}</strong><br>
        <small>${details}</small>
    `;
    
    activityDiv.insertBefore(activityItem, activityDiv.firstChild);
    
    // Keep only last 10 activities
    const activities = activityDiv.children;
    if (activities.length > 10) {
        activityDiv.removeChild(activities[activities.length - 1]);
    }
}

// Auto-refresh statistics every 30 seconds
setInterval(() => {
    if (isConnected) {
        refreshStatistics();
    }
}, 30000); 