const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MSVP Transferable Balance Fix", function () {
    let msvpToken;
    let owner;
    let user1;
    let user2;
    let lpWallet;
    let marketingWallet;
    let developmentWallet;

    beforeEach(async function () {
        [owner, user1, user2, lpWallet, marketingWallet, developmentWallet] = await ethers.getSigners();

        const MSVP = await ethers.getContractFactory("MSVP");
        msvpToken = await MSVP.deploy(lpWallet.address, marketingWallet.address, developmentWallet.address);
        await msvpToken.waitForDeployment();
    });

    describe("Transferable Balance for Vesting Participants", function () {
        it("Should allow users to transfer non-vesting tokens", async function () {
            const vestingAmount = ethers.parseEther("10"); // 10 tokens for vesting
            const additionalTokens = ethers.parseEther("5"); // 5 additional tokens
            
            // Create vesting schedule for 10 tokens
            await msvpToken.createVestingSchedule(user1.address, vestingAmount);
            
            // Transfer additional 5 tokens to user1 (these are NOT part of vesting)
            await msvpToken.transfer(user1.address, additionalTokens);
            
            // Check balances
            const totalBalance = await msvpToken.balanceOf(user1.address);
            const vestingAllocation = await msvpToken.getVestingAllocation(user1.address);
            const transferableBalance = await msvpToken.transferableBalance(user1.address);
            const lockedAmount = await msvpToken.getLockedAmount(user1.address);
            const unlockedVesting = await msvpToken.getUnlockedAmount(user1.address);
            
            console.log("User1 total balance:", ethers.formatEther(totalBalance));
            console.log("User1 vesting allocation:", ethers.formatEther(vestingAllocation));
            console.log("User1 transferable balance:", ethers.formatEther(transferableBalance));
            console.log("User1 locked amount:", ethers.formatEther(lockedAmount));
            console.log("User1 unlocked vesting:", ethers.formatEther(unlockedVesting));
            
            // Total balance should be 15 (10 vesting + 5 additional)
            expect(totalBalance).to.equal(vestingAmount + additionalTokens);
            
            // Vesting allocation should be 10 (only vesting amount)
            expect(vestingAllocation).to.equal(vestingAmount);
            
            // Locked amount should be 10 (all vesting tokens are locked during cliff)
            expect(lockedAmount).to.equal(vestingAmount);
            
            // Unlocked vesting should be 0 (during cliff period)
            expect(unlockedVesting).to.equal(0);
            
            // Transferable balance should be 5 (the additional tokens, not locked)
            expect(transferableBalance).to.equal(additionalTokens);
            
            // User should be able to transfer the 5 additional tokens
            await expect(
                msvpToken.connect(user1).transfer(user2.address, additionalTokens)
            ).to.not.be.reverted;
        });

        it("Should allow users to transfer unlocked vesting tokens + other tokens", async function () {
            const vestingAmount = ethers.parseEther("100"); // 100 tokens for vesting
            const additionalTokens = ethers.parseEther("20"); // 20 additional tokens
            
            // Create vesting schedule for 100 tokens
            await msvpToken.createVestingSchedule(user1.address, vestingAmount);
            
            // Transfer additional 20 tokens to user1
            await msvpToken.transfer(user1.address, additionalTokens);
            
            // Fast forward past cliff to month 7 (first unlock)
            await ethers.provider.send("evm_increaseTime", [210 * 24 * 60 * 60]); // 210 days (7 months)
            await ethers.provider.send("evm_mine");
            
            // Update unlocked amounts
            await msvpToken.updateUnlockedAmountsForUser(user1.address);
            
            // Check balances after cliff
            const transferableAfterCliff = await msvpToken.transferableBalance(user1.address);
            const unlockedVesting = await msvpToken.getUnlockedAmount(user1.address);
            const lockedAmount = await msvpToken.getLockedAmount(user1.address);
            
            console.log("Transferable after cliff:", ethers.formatEther(transferableAfterCliff));
            console.log("Unlocked vesting:", ethers.formatEther(unlockedVesting));
            console.log("Locked amount:", ethers.formatEther(lockedAmount));
            
            // Should have unlocked some vesting tokens (1.2% of 100 = 1.2 tokens)
            expect(unlockedVesting).to.be.gt(0);
            
            // Transferable should be: unlocked vesting + additional tokens
            const expectedTransferable = unlockedVesting + additionalTokens;
            console.log("Expected transferable:", ethers.formatEther(expectedTransferable));
            expect(transferableAfterCliff).to.equal(expectedTransferable);
            
            // User should be able to transfer the transferable amount
            await expect(
                msvpToken.connect(user1).transfer(user2.address, transferableAfterCliff)
            ).to.not.be.reverted;
        });

        it("Should handle multiple transfers correctly", async function () {
            const vestingAmount = ethers.parseEther("50"); // 50 tokens for vesting
            const transfer1 = ethers.parseEther("10"); // 10 tokens transfer 1
            const transfer2 = ethers.parseEther("15"); // 15 tokens transfer 2
            
            // Create vesting schedule
            await msvpToken.createVestingSchedule(user1.address, vestingAmount);
            
            // Make two separate transfers
            await msvpToken.transfer(user1.address, transfer1);
            await msvpToken.transfer(user1.address, transfer2);
            
            // Check transferable balance
            const transferableBalance = await msvpToken.transferableBalance(user1.address);
            const expectedTransferable = transfer1 + transfer2; // 25 tokens
            
            console.log("Transferable balance:", ethers.formatEther(transferableBalance));
            console.log("Expected transferable:", ethers.formatEther(expectedTransferable));
            
            // Should be able to transfer the 25 additional tokens
            expect(transferableBalance).to.equal(expectedTransferable);
            
            await expect(
                msvpToken.connect(user1).transfer(user2.address, expectedTransferable)
            ).to.not.be.reverted;
        });
    });

    describe("Non-Participants", function () {
        it("Should allow non-participants to transfer full balance", async function () {
            const transferAmount = ethers.parseEther("25");
            
            // Transfer tokens to user2 (non-participant)
            await msvpToken.transfer(user2.address, transferAmount);
            
            // Check transferable balance
            const transferableBalance = await msvpToken.transferableBalance(user2.address);
            const baseBalance = await msvpToken.balanceOf(user2.address);
            
            console.log("User2 transferable balance:", ethers.formatEther(transferableBalance));
            console.log("User2 base balance:", ethers.formatEther(baseBalance));
            
            // Non-participants should have full balance transferable
            expect(transferableBalance).to.equal(baseBalance);
            expect(transferableBalance).to.equal(transferAmount);
            
            // Should be able to transfer full amount
            await expect(
                msvpToken.connect(user2).transfer(user1.address, transferAmount)
            ).to.not.be.reverted;
        });
    });
}); 