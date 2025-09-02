const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MSVP Comprehensive Transfer Testing", function () {
    let msvpToken;
    let owner;
    let user1;
    let user2;
    let user3;
    let user4;
    let lpWallet;
    let marketingWallet;
    let developmentWallet;

    const VESTING_AMOUNT = ethers.parseEther("1000"); // 1000 tokens for vesting
    const ADDITIONAL_TOKENS = ethers.parseEther("500"); // 500 additional tokens
    const LARGE_AMOUNT = ethers.parseEther("10000"); // 10000 tokens

    beforeEach(async function () {
        [owner, user1, user2, user3, user4, lpWallet, marketingWallet, developmentWallet] = await ethers.getSigners();

        const MSVP = await ethers.getContractFactory("MSVP");
        msvpToken = await MSVP.deploy(lpWallet.address, marketingWallet.address, developmentWallet.address);
        await msvpToken.waitForDeployment();
    });

    describe("Scenario 1: Non-Vesting User Transfers", function () {
        it("Should allow non-vesting user to transfer entire balance", async function () {
            // Transfer tokens to user1 (non-vesting)
            await msvpToken.transfer(user1.address, LARGE_AMOUNT);
            
            const balance = await msvpToken.balanceOf(user1.address);
            const transferable = await msvpToken.transferableBalance(user1.address);
            
            expect(balance).to.equal(LARGE_AMOUNT);
            expect(transferable).to.equal(LARGE_AMOUNT);
            
            // Should be able to transfer entire amount
            await msvpToken.connect(user1).transfer(user2.address, LARGE_AMOUNT);
            
            const user1BalanceAfter = await msvpToken.balanceOf(user1.address);
            const user2BalanceAfter = await msvpToken.balanceOf(user2.address);
            
            expect(user1BalanceAfter).to.equal(0);
            expect(user2BalanceAfter).to.equal(LARGE_AMOUNT - (LARGE_AMOUNT * 50n / 1000n)); // Minus 5% tax
        });

        it("Should prevent non-vesting user from transferring more than balance", async function () {
            await msvpToken.transfer(user1.address, LARGE_AMOUNT);
            
            const excessiveAmount = LARGE_AMOUNT + ethers.parseEther("1000");
            
            await expect(
                msvpToken.connect(user1).transfer(user2.address, excessiveAmount)
            ).to.be.revertedWith("Insufficient transferable balance");
        });
    });

    describe("Scenario 2: Vesting User During Cliff Period (Months 0-6)", function () {
        beforeEach(async function () {
            // Create vesting schedule for user1
            await msvpToken.createVestingSchedule(user1.address, VESTING_AMOUNT);
            
            // Transfer additional tokens to user1
            await msvpToken.transfer(user1.address, ADDITIONAL_TOKENS);
        });

        it("Should prevent transfer of locked vesting tokens during cliff", async function () {
            // At 3 months - still in cliff period
            await ethers.provider.send("evm_increaseTime", [90 * 24 * 60 * 60]); // 3 months
            await ethers.provider.send("evm_mine");
            
            const balance = await msvpToken.balanceOf(user1.address);
            const transferable = await msvpToken.transferableBalance(user1.address);
            const locked = await msvpToken.getLockedAmount(user1.address);
            
            console.log("Balance:", ethers.formatEther(balance));
            console.log("Transferable:", ethers.formatEther(transferable));
            console.log("Locked:", ethers.formatEther(locked));
            
            // Should only be able to transfer additional tokens, not vesting tokens
            expect(transferable).to.equal(ADDITIONAL_TOKENS);
            expect(locked).to.equal(VESTING_AMOUNT);
            
            // Should be able to transfer additional tokens
            await msvpToken.connect(user1).transfer(user2.address, ADDITIONAL_TOKENS);
            
            // Should NOT be able to transfer vesting tokens
            await expect(
                msvpToken.connect(user1).transfer(user2.address, ethers.parseEther("1"))
            ).to.be.revertedWith("Insufficient transferable balance");
        });

        it("Should allow transfer of only additional tokens during cliff", async function () {
            await ethers.provider.send("evm_increaseTime", [90 * 24 * 60 * 60]); // 3 months
            await ethers.provider.send("evm_mine");
            
            const transferAmount = ethers.parseEther("100"); // Transfer 100 of 500 additional tokens
            
            await msvpToken.connect(user1).transfer(user2.address, transferAmount);
            
            const user1BalanceAfter = await msvpToken.balanceOf(user1.address);
            const user2BalanceAfter = await msvpToken.balanceOf(user2.address);
            
            // User1 should have: 1000 (vesting) + 400 (remaining additional) = 1400
            // But balanceOf shows actual tokens: 1000 + 400 = 1400
            expect(user1BalanceAfter).to.equal(VESTING_AMOUNT + ADDITIONAL_TOKENS - transferAmount);
            
            // User2 should receive transfer amount minus tax
            const expectedReceived = transferAmount - (transferAmount * 50n / 1000n);
            expect(user2BalanceAfter).to.equal(expectedReceived);
        });
    });

    describe("Scenario 3: Vesting User After First Unlock (Month 7+)", function () {
        beforeEach(async function () {
            await msvpToken.createVestingSchedule(user1.address, VESTING_AMOUNT);
            await msvpToken.transfer(user1.address, ADDITIONAL_TOKENS);
            
            // Advance to month 7 (first unlock)
            await ethers.provider.send("evm_increaseTime", [210 * 24 * 60 * 60]); // 7 months
            await ethers.provider.send("evm_mine");
            await msvpToken.updateUnlockedAmountsForUser(user1.address);
        });

        it("Should allow transfer of unlocked vesting + additional tokens", async function () {
            const unlockedAmount = await msvpToken.getUnlockedAmount(user1.address);
            const transferable = await msvpToken.transferableBalance(user1.address);
            const locked = await msvpToken.getLockedAmount(user1.address);
            
            console.log("Unlocked amount:", ethers.formatEther(unlockedAmount));
            console.log("Transferable:", ethers.formatEther(transferable));
            console.log("Locked:", ethers.formatEther(locked));
            
            // Transferable should be: unlocked vesting + additional tokens
            const expectedTransferable = unlockedAmount + ADDITIONAL_TOKENS;
            expect(transferable).to.equal(expectedTransferable);
            
            // Should be able to transfer unlocked amount
            const transferAmount = unlockedAmount;
            await msvpToken.connect(user1).transfer(user2.address, transferAmount);
            
            const user1BalanceAfter = await msvpToken.balanceOf(user1.address);
            const user2BalanceAfter = await msvpToken.balanceOf(user2.address);
            
            // User1 should have: 1000 (vesting) + 500 (additional) - transfer - tax
            const expectedUser1Balance = VESTING_AMOUNT + ADDITIONAL_TOKENS - transferAmount - (transferAmount * 50n / 1000n);
            expect(user1BalanceAfter).to.equal(VESTING_AMOUNT + ADDITIONAL_TOKENS - transferAmount);
            
            // User2 should receive transfer amount minus tax
            const expectedReceived = transferAmount - (transferAmount * 50n / 1000n);
            expect(user2BalanceAfter).to.equal(expectedReceived);
        });

        it("Should prevent transfer of more than transferable amount", async function () {
            const transferable = await msvpToken.transferableBalance(user1.address);
            const excessiveAmount = transferable + ethers.parseEther("1000");
            
            await expect(
                msvpToken.connect(user1).transfer(user2.address, excessiveAmount)
            ).to.be.revertedWith("Insufficient transferable balance");
        });

        it("Should allow partial transfer of unlocked + additional tokens", async function () {
            const transferable = await msvpToken.transferableBalance(user1.address);
            const partialAmount = transferable / 2n; // Transfer half
            
            await msvpToken.connect(user1).transfer(user2.address, partialAmount);
            
            const user1BalanceAfter = await msvpToken.balanceOf(user1.address);
            const user2BalanceAfter = await msvpToken.balanceOf(user2.address);
            
            // User1 should have remaining balance minus tax
            const expectedUser1Balance = VESTING_AMOUNT + ADDITIONAL_TOKENS - partialAmount - (partialAmount * 50n / 1000n);
            expect(user1BalanceAfter).to.equal(VESTING_AMOUNT + ADDITIONAL_TOKENS - partialAmount);
            
            // User2 should receive partial amount minus tax
            const expectedReceived = partialAmount - (partialAmount * 50n / 1000n);
            expect(user2BalanceAfter).to.equal(expectedReceived);
        });
    });

    describe("Scenario 4: Multiple Vesting Unlocks (Month 10+)", function () {
        beforeEach(async function () {
            await msvpToken.createVestingSchedule(user1.address, VESTING_AMOUNT);
            await msvpToken.transfer(user1.address, ADDITIONAL_TOKENS);
            
            // Advance to month 10 (second unlock)
            await ethers.provider.send("evm_increaseTime", [300 * 24 * 60 * 60]); // 10 months
            await ethers.provider.send("evm_mine");
            await msvpToken.updateUnlockedAmountsForUser(user1.address);
        });

        it("Should allow transfer of multiple unlocked amounts + additional tokens", async function () {
            const unlockedAmount = await msvpToken.getUnlockedAmount(user1.address);
            const transferable = await msvpToken.transferableBalance(user1.address);
            
            console.log("Unlocked amount (month 10):", ethers.formatEther(unlockedAmount));
            console.log("Transferable:", ethers.formatEther(transferable));
            
            // Should have 2 unlocks: 1.2% each = 2.4% total
            const expectedUnlocked = (VESTING_AMOUNT * 24n) / 1000n; // 2.4%
            expect(unlockedAmount).to.equal(expectedUnlocked);
            
            // Transferable should be: unlocked + additional
            const expectedTransferable = unlockedAmount + ADDITIONAL_TOKENS;
            expect(transferable).to.equal(expectedTransferable);
            
            // Should be able to transfer all transferable amount
            await msvpToken.connect(user1).transfer(user2.address, transferable);
            
            const user1BalanceAfter = await msvpToken.balanceOf(user1.address);
            const user2BalanceAfter = await msvpToken.balanceOf(user2.address);
            
            // User1 should only have locked vesting tokens left
            const locked = await msvpToken.getLockedAmount(user1.address);
            expect(user1BalanceAfter).to.equal(locked);
            
            // User2 should receive transferable amount minus tax
            const expectedReceived = transferable - (transferable * 50n / 1000n);
            expect(user2BalanceAfter).to.equal(expectedReceived);
        });
    });

    describe("Scenario 5: Complex Multi-User Transfers", function () {
        beforeEach(async function () {
            // Create vesting for user1 and user2
            await msvpToken.createVestingSchedule(user1.address, VESTING_AMOUNT);
            await msvpToken.createVestingSchedule(user2.address, VESTING_AMOUNT);
            
            // Transfer additional tokens to both
            await msvpToken.transfer(user1.address, ADDITIONAL_TOKENS);
            await msvpToken.transfer(user2.address, ADDITIONAL_TOKENS);
            
            // Advance to month 7
            await ethers.provider.send("evm_increaseTime", [210 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine");
            await msvpToken.updateUnlockedAmountsForUser(user1.address);
            await msvpToken.updateUnlockedAmountsForUser(user2.address);
        });

        it("Should handle transfers between vesting participants", async function () {
            const user1Transferable = await msvpToken.transferableBalance(user1.address);
            const user2Transferable = await msvpToken.transferableBalance(user2.address);
            
            console.log("User1 transferable:", ethers.formatEther(user1Transferable));
            console.log("User2 transferable:", ethers.formatEther(user2Transferable));
            
            // User1 transfers to User2
            const transferAmount = ethers.parseEther("100");
            await msvpToken.connect(user1).transfer(user2.address, transferAmount);
            
            // User2 transfers to User3 (non-vesting)
            await msvpToken.connect(user2).transfer(user3.address, transferAmount);
            
            const user1BalanceAfter = await msvpToken.balanceOf(user1.address);
            const user2BalanceAfter = await msvpToken.balanceOf(user2.address);
            const user3BalanceAfter = await msvpToken.balanceOf(user3.address);
            
            console.log("User1 balance after:", ethers.formatEther(user1BalanceAfter));
            console.log("User2 balance after:", ethers.formatEther(user2BalanceAfter));
            console.log("User3 balance after:", ethers.formatEther(user3BalanceAfter));
            
            // All transfers should succeed
            expect(user1BalanceAfter).to.be.gt(0);
            expect(user2BalanceAfter).to.be.gt(0);
            expect(user3BalanceAfter).to.be.gt(0);
        });
    });

    describe("Scenario 6: Edge Cases and Boundary Conditions", function () {
        it("Should handle zero transfer amount", async function () {
            await msvpToken.transfer(user1.address, LARGE_AMOUNT);
            
            await expect(
                msvpToken.connect(user1).transfer(user2.address, 0)
            ).to.be.revertedWith("Transfer amount must be greater than zero");
        });

        it("Should handle transfer to zero address", async function () {
            await msvpToken.transfer(user1.address, LARGE_AMOUNT);
            
            await expect(
                msvpToken.connect(user1).transfer(ethers.ZeroAddress, ethers.parseEther("100"))
            ).to.be.revertedWith("ERC20: transfer to the zero address");
        });


        it("Should handle vesting user with no additional tokens", async function () {
            await msvpToken.createVestingSchedule(user1.address, VESTING_AMOUNT);
            
            // During cliff - should not be able to transfer anything
            const transferable = await msvpToken.transferableBalance(user1.address);
            expect(transferable).to.equal(0);
            
            await expect(
                msvpToken.connect(user1).transfer(user2.address, ethers.parseEther("1"))
            ).to.be.revertedWith("Insufficient transferable balance");
        });

        it("Should handle vesting user with only additional tokens", async function () {
            await msvpToken.createVestingSchedule(user1.address, VESTING_AMOUNT);
            await msvpToken.transfer(user1.address, ADDITIONAL_TOKENS);
            
            // During cliff - should only be able to transfer additional tokens
            const transferable = await msvpToken.transferableBalance(user1.address);
            expect(transferable).to.equal(ADDITIONAL_TOKENS);
            
            // Should be able to transfer all additional tokens
            await msvpToken.connect(user1).transfer(user2.address, ADDITIONAL_TOKENS);
            
            const user1BalanceAfter = await msvpToken.balanceOf(user1.address);
            expect(user1BalanceAfter).to.equal(VESTING_AMOUNT); // Only vesting tokens left
        });
    });

    describe("Scenario 7: Tax Exclusions and Max Transaction Limits", function () {
        beforeEach(async function () {
            await msvpToken.createVestingSchedule(user1.address, VESTING_AMOUNT);
            await msvpToken.transfer(user1.address, ADDITIONAL_TOKENS);
            
            // Advance to month 7
            await ethers.provider.send("evm_increaseTime", [210 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine");
            await msvpToken.updateUnlockedAmountsForUser(user1.address);
        });

        it("Should handle tax-excluded transfers", async function () {
            // Exclude user1 from tax
            await msvpToken.setTaxExclusion(user1.address, true);
            
            const transferable = await msvpToken.transferableBalance(user1.address);
            const transferAmount = transferable / 2n;
            
            await msvpToken.connect(user1).transfer(user2.address, transferAmount);
            
            const user1BalanceAfter = await msvpToken.balanceOf(user1.address);
            const user2BalanceAfter = await msvpToken.balanceOf(user2.address);
            
            // No tax should be applied
            expect(user1BalanceAfter).to.equal(VESTING_AMOUNT + ADDITIONAL_TOKENS - transferAmount);
            expect(user2BalanceAfter).to.equal(transferAmount);
        });

        it("Should handle max transaction limit", async function () {
            const maxTxAmount = await msvpToken.maxTxAmount();
            const transferable = await msvpToken.transferableBalance(user1.address);
            
            // If transferable is more than maxTxAmount, should fail
            if (transferable > maxTxAmount) {
                await expect(
                    msvpToken.connect(user1).transfer(user2.address, transferable)
                ).to.be.revertedWith("Transfer amount exceeds max transaction limit");
            }
        });
    });

    describe("Scenario 8: Emergency Unlock and Transfer", function () {
        beforeEach(async function () {
            await msvpToken.createVestingSchedule(user1.address, VESTING_AMOUNT);
            await msvpToken.transfer(user1.address, ADDITIONAL_TOKENS);
        });

        it("Should allow transfer after emergency unlock", async function () {
            // Emergency unlock all tokens
            await msvpToken.emergencyUnlockAll(user1.address);
            
            const transferable = await msvpToken.transferableBalance(user1.address);
            const locked = await msvpToken.getLockedAmount(user1.address);
            
            console.log("Transferable after emergency unlock:", ethers.formatEther(transferable));
            console.log("Locked after emergency unlock:", ethers.formatEther(locked));
            
            // Should be able to transfer all tokens
            expect(transferable).to.equal(VESTING_AMOUNT + ADDITIONAL_TOKENS);
            expect(locked).to.equal(0);
            
            await msvpToken.connect(user1).transfer(user2.address, transferable);
            
            const user1BalanceAfter = await msvpToken.balanceOf(user1.address);
            expect(user1BalanceAfter).to.equal(0);
        });
    });
});
