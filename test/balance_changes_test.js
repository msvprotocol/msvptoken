const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MSVP Balance Changes - Critical Functionality", function () {
    let msvpToken;
    let owner;
    let user1;
    let user2;
    let user3;
    let lpWallet;
    let marketingWallet;
    let developmentWallet;

    beforeEach(async function () {
        [owner, user1, user2, user3, lpWallet, marketingWallet, developmentWallet] = await ethers.getSigners();

        const MSVP = await ethers.getContractFactory("MSVP");
        msvpToken = await MSVP.deploy(lpWallet.address, marketingWallet.address, developmentWallet.address);
        await msvpToken.waitForDeployment();
    });

    describe("Balance Changes After Transfers", function () {
        it("Should show correct balance changes after transfers", async function () {
            const initialBalance = await msvpToken.balanceOf(owner.address);
            const transferAmount = ethers.parseEther("1000");
            
            console.log("Initial owner balance:", ethers.formatEther(initialBalance));
            
            // Transfer tokens to user1
            await msvpToken.transfer(user1.address, transferAmount);
            
            const ownerBalanceAfterTransfer = await msvpToken.balanceOf(owner.address);
            const user1BalanceAfterTransfer = await msvpToken.balanceOf(user1.address);
            
            console.log("Owner balance after transfer:", ethers.formatEther(ownerBalanceAfterTransfer));
            console.log("User1 balance after transfer:", ethers.formatEther(user1BalanceAfterTransfer));
            
            // Owner balance should decrease
            expect(ownerBalanceAfterTransfer).to.equal(initialBalance - transferAmount);
            
            // User1 balance should increase
            expect(user1BalanceAfterTransfer).to.equal(transferAmount);
        });

        it("Should show correct balance changes for vesting participants", async function () {
            const vestingAmount = ethers.parseEther("100"); // 100 tokens for vesting
            const additionalTransfer = ethers.parseEther("50"); // 50 additional tokens
            
            // Create vesting schedule for user1
            await msvpToken.createVestingSchedule(user1.address, vestingAmount);
            
            // Check initial balances
            const user1InitialBalance = await msvpToken.balanceOf(user1.address);
            const user1VestingAllocation = await msvpToken.getVestingAllocation(user1.address);
            
            console.log("User1 initial balance:", ethers.formatEther(user1InitialBalance));
            console.log("User1 vesting allocation:", ethers.formatEther(user1VestingAllocation));
            
            // Transfer additional tokens to user1
            await msvpToken.transfer(user1.address, additionalTransfer);
            
            const user1BalanceAfterTransfer = await msvpToken.balanceOf(user1.address);
            console.log("User1 balance after additional transfer:", ethers.formatEther(user1BalanceAfterTransfer));
            
            // Balance should increase by the transfer amount
            expect(user1BalanceAfterTransfer).to.equal(user1InitialBalance + additionalTransfer);
            
            // Transfer some tokens from user1 to user2
            const transferFromUser1 = ethers.parseEther("20");
            await msvpToken.connect(user1).transfer(user2.address, transferFromUser1);
            
            const user1BalanceAfterSending = await msvpToken.balanceOf(user1.address);
            const user2BalanceAfterReceiving = await msvpToken.balanceOf(user2.address);
            
            console.log("User1 balance after sending:", ethers.formatEther(user1BalanceAfterSending));
            console.log("User2 balance after receiving:", ethers.formatEther(user2BalanceAfterReceiving));
            
            // User1 balance should decrease by the transfer amount (tax is deducted from transfer, not added)
            // Tax is 5% = 1 token, so user1 loses 21 tokens total
            const taxAmount = (transferFromUser1 * 50n) / 1000n; // 5% tax
            const totalDeduction = transferFromUser1 + taxAmount;
            console.log("Tax amount:", ethers.formatEther(taxAmount));
            console.log("Total deduction:", ethers.formatEther(totalDeduction));
            console.log("Expected user1 balance:", ethers.formatEther(user1BalanceAfterTransfer - totalDeduction));
            expect(user1BalanceAfterSending).to.equal(user1BalanceAfterTransfer - transferFromUser1);
            
            // User2 balance should increase by the transfer amount (minus tax)
            const transferAfterTax = transferFromUser1 - taxAmount;
            console.log("Transfer after tax:", ethers.formatEther(transferAfterTax));
            expect(user2BalanceAfterReceiving).to.equal(transferAfterTax);
        });
    });

    describe("Balance Changes After Vesting Unlocks", function () {
        it("Should show correct balance progression through vesting phases", async function () {
            const vestingAmount = ethers.parseEther("1000"); // 1000 tokens for vesting
            
            // Create vesting schedule for user1
            await msvpToken.createVestingSchedule(user1.address, vestingAmount);
            
            // Check initial state
            const initialBalance = await msvpToken.balanceOf(user1.address);
            const initialVestingAllocation = await msvpToken.getVestingAllocation(user1.address);
            const initialTransferable = await msvpToken.transferableBalance(user1.address);
            
            console.log("=== INITIAL STATE ===");
            console.log("Balance:", ethers.formatEther(initialBalance));
            console.log("Vesting Allocation:", ethers.formatEther(initialVestingAllocation));
            console.log("Transferable:", ethers.formatEther(initialTransferable));
            
            // Fast forward to month 7 (first unlock)
            await ethers.provider.send("evm_increaseTime", [210 * 24 * 60 * 60]); // 7 months
            await ethers.provider.send("evm_mine");
            
            // Update unlocked amounts
            await msvpToken.updateUnlockedAmountsForUser(user1.address);
            
            // Check state after first unlock
            const balanceAfterUnlock = await msvpToken.balanceOf(user1.address);
            const vestingAllocationAfterUnlock = await msvpToken.getVestingAllocation(user1.address);
            const transferableAfterUnlock = await msvpToken.transferableBalance(user1.address);
            const unlockedAmount = await msvpToken.getUnlockedAmount(user1.address);
            
            console.log("=== AFTER FIRST UNLOCK (Month 7) ===");
            console.log("Balance:", ethers.formatEther(balanceAfterUnlock));
            console.log("Vesting Allocation:", ethers.formatEther(vestingAllocationAfterUnlock));
            console.log("Transferable:", ethers.formatEther(transferableAfterUnlock));
            console.log("Unlocked Amount:", ethers.formatEther(unlockedAmount));
            
            // Balance should remain the same (tokens are already in wallet)
            expect(balanceAfterUnlock).to.equal(initialBalance);
            
            // Vesting allocation should remain the same
            expect(vestingAllocationAfterUnlock).to.equal(initialVestingAllocation);
            
            // Transferable should now include unlocked tokens
            expect(transferableAfterUnlock).to.be.gt(0);
            
            // Transfer some unlocked tokens
            const transferAmount = ethers.parseEther("0.5"); // Transfer half of unlocked
            await msvpToken.connect(user1).transfer(user2.address, transferAmount);
            
            const balanceAfterTransfer = await msvpToken.balanceOf(user1.address);
            const user2BalanceAfterTransfer = await msvpToken.balanceOf(user2.address);
            
            console.log("=== AFTER TRANSFERRING UNLOCKED TOKENS ===");
            console.log("User1 Balance:", ethers.formatEther(balanceAfterTransfer));
            console.log("User2 Balance:", ethers.formatEther(user2BalanceAfterTransfer));
            
            // User1 balance should decrease by the transfer amount (tax is deducted from transfer, not added)
            const taxAmount = (transferAmount * 50n) / 1000n; // 5% tax
            const totalDeduction = transferAmount + taxAmount;
            expect(balanceAfterTransfer).to.equal(balanceAfterUnlock - transferAmount);
            
            // User2 balance should increase by the transfer amount (minus tax)
            const transferAfterTax = transferAmount - taxAmount;
            expect(user2BalanceAfterTransfer).to.equal(transferAfterTax);
        });
    });

    describe("Multiple Users and Complex Scenarios", function () {
        it("Should handle complex balance scenarios correctly", async function () {
            const vestingAmount1 = ethers.parseEther("500"); // 500 tokens for user1
            const vestingAmount2 = ethers.parseEther("300"); // 300 tokens for user2
            
            // Create vesting schedules
            await msvpToken.createVestingSchedule(user1.address, vestingAmount1);
            await msvpToken.createVestingSchedule(user2.address, vestingAmount2);
            
            // Transfer additional tokens to both users
            const additionalTokens1 = ethers.parseEther("100");
            const additionalTokens2 = ethers.parseEther("75");
            
            await msvpToken.transfer(user1.address, additionalTokens1);
            await msvpToken.transfer(user2.address, additionalTokens2);
            
            // Check balances
            const user1Balance = await msvpToken.balanceOf(user1.address);
            const user2Balance = await msvpToken.balanceOf(user2.address);
            const user1Vesting = await msvpToken.getVestingAllocation(user1.address);
            const user2Vesting = await msvpToken.getVestingAllocation(user2.address);
            
            console.log("=== COMPLEX SCENARIO ===");
            console.log("User1 - Balance:", ethers.formatEther(user1Balance), "Vesting:", ethers.formatEther(user1Vesting));
            console.log("User2 - Balance:", ethers.formatEther(user2Balance), "Vesting:", ethers.formatEther(user2Vesting));
            
            // User1 transfers tokens to User2
            const transferAmount = ethers.parseEther("25");
            await msvpToken.connect(user1).transfer(user2.address, transferAmount);
            
            const user1BalanceAfter = await msvpToken.balanceOf(user1.address);
            const user2BalanceAfter = await msvpToken.balanceOf(user2.address);
            
            console.log("=== AFTER TRANSFER ===");
            console.log("User1 Balance:", ethers.formatEther(user1BalanceAfter));
            console.log("User2 Balance:", ethers.formatEther(user2BalanceAfter));
            
            // Verify balance changes (accounting for tax)
            const taxAmount = (transferAmount * 50n) / 1000n; // 5% tax
            const totalDeduction = transferAmount + taxAmount;
            const transferAfterTax = transferAmount - taxAmount;
            
            expect(user1BalanceAfter).to.equal(user1Balance - transferAmount);
            expect(user2BalanceAfter).to.equal(user2Balance + transferAfterTax);
        });
    });

    describe("Edge Cases and Error Conditions", function () {
        it("Should handle zero transfers correctly", async function () {
            const initialBalance = await msvpToken.balanceOf(owner.address);
            
            // Transfer 0 tokens should fail
            await expect(
                msvpToken.transfer(user1.address, 0)
            ).to.be.revertedWith("Transfer amount must be greater than zero");
            
            // Balance should remain unchanged
            const balanceAfterZeroTransfer = await msvpToken.balanceOf(owner.address);
            expect(balanceAfterZeroTransfer).to.equal(initialBalance);
        });

        it("Should prevent transfers exceeding balance", async function () {
            const user1Balance = await msvpToken.balanceOf(user1.address);
            const excessiveAmount = user1Balance + ethers.parseEther("1000");
            
            // Should fail when trying to transfer more than balance
            await expect(
                msvpToken.connect(user1).transfer(user2.address, excessiveAmount)
            ).to.be.revertedWith("Insufficient transferable balance");
        });
    });
}); 