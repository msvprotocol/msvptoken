const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MSVP Balance Fix - No More Double Counting", function () {
    let msvpToken;
    let owner;
    let user1;
    let lpWallet;
    let marketingWallet;
    let developmentWallet;

    beforeEach(async function () {
        [owner, user1, lpWallet, marketingWallet, developmentWallet] = await ethers.getSigners();

        const MSVP = await ethers.getContractFactory("MSVP");
        msvpToken = await MSVP.deploy(lpWallet.address, marketingWallet.address, developmentWallet.address);
        await msvpToken.waitForDeployment();
    });

    describe("Balance Display Fix", function () {
        it("Should NOT double count tokens in balanceOf", async function () {
            const vestingAmount = ethers.parseEther("1000"); // 1000 tokens
            
            // Check initial balances
            expect(await msvpToken.balanceOf(owner.address)).to.equal(ethers.parseEther("100000000000")); // 100B total supply
            expect(await msvpToken.balanceOf(user1.address)).to.equal(0);
            
            // Create vesting schedule for 10 tokens
            await msvpToken.createVestingSchedule(user1.address, vestingAmount);
            
            // Now check balances - should NOT be double counted
            const user1Balance = await msvpToken.balanceOf(user1.address);
            const user1BaseBalance = await msvpToken.balanceOf(user1.address);
            const user1Transferable = await msvpToken.transferableBalance(user1.address);
            
            console.log("User1 balanceOf:", ethers.formatEther(user1Balance));
            console.log("User1 balanceOf:", ethers.formatEther(user1BaseBalance));
            console.log("User1 transferableBalance:", ethers.formatEther(user1Transferable));
            
            // balanceOf should show total allocation (10 tokens), NOT 20
            expect(user1Balance).to.equal(vestingAmount);
            
            // balanceOf should show actual tokens held (10 tokens)
            expect(user1BaseBalance).to.equal(vestingAmount);
            
            // transferableBalance should show unlocked tokens (0 during cliff)
            expect(user1Transferable).to.equal(0);
        });

        it("Should show correct balance progression over time", async function () {
            const vestingAmount = ethers.parseEther("100"); // 100 tokens for easier testing
            
            // Create vesting schedule
            await msvpToken.createVestingSchedule(user1.address, vestingAmount);
            
            // Check initial state
            expect(await msvpToken.balanceOf(user1.address)).to.equal(vestingAmount);
            expect(await msvpToken.transferableBalance(user1.address)).to.equal(0);
            
            // Fast forward past cliff (6 months)
            await ethers.provider.send("evm_increaseTime", [210 * 24 * 60 * 60]); // 210 days (7 months)
            await ethers.provider.send("evm_mine");
            
            // Update unlocked amounts
            await msvpToken.updateUnlockedAmountsForUser(user1.address);
            
            // Check after cliff - should have some unlocked tokens
            const transferableAfterCliff = await msvpToken.transferableBalance(user1.address);
            console.log("Transferable after cliff:", ethers.formatEther(transferableAfterCliff));
            
            // Should have unlocked some tokens (1.2% of 100 = 1.2 tokens)
            expect(transferableAfterCliff).to.be.gt(0);
            
            // balanceOf should still show total allocation
            expect(await msvpToken.balanceOf(user1.address)).to.equal(vestingAmount);
        });

        it("Should handle multiple users correctly", async function () {
            const user2 = (await ethers.getSigners())[2];
            const vestingAmount1 = ethers.parseEther("50"); // 50 tokens
            const vestingAmount2 = ethers.parseEther("25"); // 25 tokens
            
            // Create vesting schedules for both users
            await msvpToken.createVestingSchedule(user1.address, vestingAmount1);
            await msvpToken.createVestingSchedule(user2.address, vestingAmount2);
            
            // Check balances - should NOT be double counted
            expect(await msvpToken.balanceOf(user1.address)).to.equal(vestingAmount1);
            expect(await msvpToken.balanceOf(user2.address)).to.equal(vestingAmount2);
            
            // Total allocated should be correct
            expect(await msvpToken.totalAllocated()).to.equal(vestingAmount1 + vestingAmount2);
        });
    });
}); 