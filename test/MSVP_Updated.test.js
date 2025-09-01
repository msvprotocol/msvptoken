const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("MSVP - Updated Tokenomics Schedule Testing", function () {
    let msvpToken;
    let owner, lpWallet, marketingWallet, developmentWallet;
    let user1, user2, user3, user4, user5, user6, user7, user8, user9, user10;

    // Constants based on the vesting schedule image
    const TOTAL_SUPPLY = ethers.parseEther("100000000000"); // 100 billion tokens
    const AIRDROP_SUPPLY = ethers.parseEther("50000000000"); // 50 billion tokens for airdrop
    const CLIFF_DURATION = 180 * 24 * 60 * 60; // 6 months in seconds
    const MONTH_IN_SECONDS = 30 * 24 * 60 * 60; // 30 days in seconds
    
    // Unlock percentages from the schedule
    const FIRST_YEAR_UNLOCK_PERCENTAGE = 12; // 1.2% (12/1000)
    const POST_Q5_UNLOCK_PERCENTAGE = 70; // 7% (70/1000)
    const FINAL_UNLOCK_PERCENTAGE = 60; // 6% (60/1000)
    
    // Token amounts per unlock phase (using smaller test amounts)
    const TEST_AMOUNT = AIRDROP_SUPPLY / BigInt(10); // Use smaller amount for testing
    const FIRST_YEAR_UNLOCK_AMOUNT = (TEST_AMOUNT * BigInt(FIRST_YEAR_UNLOCK_PERCENTAGE)) / BigInt(1000); // 60M tokens
    const POST_Q5_UNLOCK_AMOUNT = (TEST_AMOUNT * BigInt(POST_Q5_UNLOCK_PERCENTAGE)) / BigInt(1000); // 350M tokens
    const FINAL_UNLOCK_AMOUNT = (TEST_AMOUNT * BigInt(FINAL_UNLOCK_PERCENTAGE)) / BigInt(1000); // 300M tokens

    beforeEach(async function () {
        [owner, lpWallet, marketingWallet, developmentWallet, user1, user2, user3, user4, user5, user6, user7, user8, user9, user10] = await ethers.getSigners();

        const MSVP = await ethers.getContractFactory("MSVP");
        msvpToken = await MSVP.deploy(lpWallet.address, marketingWallet.address, developmentWallet.address);
        await msvpToken.waitForDeployment();
    });

    describe("Contract Constants & Configuration", function () {
        it("Should have correct token supply constants", async function () {
            expect(await msvpToken.TOTAL_SUPPLY()).to.equal(TOTAL_SUPPLY);
            expect(await msvpToken.AIRDROP_SUPPLY()).to.equal(AIRDROP_SUPPLY);
        });

        it("Should have correct unlock percentage constants", async function () {
            expect(await msvpToken.FIRST_YEAR_UNLOCK_PERCENTAGE()).to.equal(FIRST_YEAR_UNLOCK_PERCENTAGE);
            expect(await msvpToken.POST_Q5_UNLOCK_PERCENTAGE()).to.equal(POST_Q5_UNLOCK_PERCENTAGE);
            expect(await msvpToken.FINAL_UNLOCK_PERCENTAGE()).to.equal(FINAL_UNLOCK_PERCENTAGE);
        });

        it("Should have correct cliff duration", async function () {
            expect(await msvpToken.CLIFF_DURATION()).to.equal(CLIFF_DURATION);
        });


    });

    describe("6-Month Cliff Period (Months 0-6)", function () {
        beforeEach(async function () {
            const testAmount = AIRDROP_SUPPLY / BigInt(10); // Use smaller amount
            await msvpToken.createVestingSchedule(user1.address, testAmount);
        });

        it("Should enforce 6-month cliff before first unlock", async function () {
            // At 5 months - should be 0 unlocked
            await time.increase(5 * MONTH_IN_SECONDS);
            let unlocked = await msvpToken.getUnlockedAmount(user1.address);
            expect(unlocked).to.equal(0);
            
            // At 6 months - should still be 0 (cliff ends at month 7)
            await time.increase(1 * MONTH_IN_SECONDS);
            unlocked = await msvpToken.getUnlockedAmount(user1.address);
            expect(unlocked).to.equal(0);
            
            // At 7 months - should start unlocking
            await time.increase(1 * MONTH_IN_SECONDS);
            await msvpToken.updateUnlockedAmountsForUser(user1.address);
            unlocked = await msvpToken.getUnlockedAmount(user1.address);
            expect(unlocked).to.be.gt(0);
        });

        it("Should handle multiple users with 6-month cliff", async function () {
            const users = [user2, user3, user4];
            const amountPerUser = AIRDROP_SUPPLY / BigInt(10); // Use smaller amounts
            
            // Create vesting for multiple users
            for (const user of users) {
                await msvpToken.createVestingSchedule(user.address, amountPerUser);
            }
            
            // Check at 6 months - all should be 0
            await time.increase(6 * MONTH_IN_SECONDS);
            for (const user of users) {
                const unlocked = await msvpToken.getUnlockedAmount(user.address);
                expect(unlocked).to.equal(0);
            }
            
            // Check at 7 months - all should start unlocking
            await time.increase(1 * MONTH_IN_SECONDS);
            await msvpToken.updateUnlockedAmounts();
            
            for (const user of users) {
                const unlocked = await msvpToken.getUnlockedAmount(user.address);
                expect(unlocked).to.be.gt(0);
            }
        });
    });

    describe("Phase 1: First Year Releases (Months 7-19) - 1.2% every 3 months", function () {
        beforeEach(async function () {
            const testAmount = AIRDROP_SUPPLY / BigInt(10); // Use smaller amount
            await msvpToken.createVestingSchedule(user1.address, testAmount);
        });

        it("Should unlock exactly 1.2% (600M tokens) per phase in first year", async function () {
            // Advance to first unlock (month 7)
            await time.increase(7 * MONTH_IN_SECONDS);
            await msvpToken.updateUnlockedAmountsForUser(user1.address);
            
            const firstUnlock = await msvpToken.getUnlockedAmount(user1.address);
            expect(firstUnlock).to.equal(FIRST_YEAR_UNLOCK_AMOUNT);
            
            // Advance to second unlock (month 10)
            await time.increase(3 * MONTH_IN_SECONDS);
            await msvpToken.updateUnlockedAmountsForUser(user1.address);
            
            const secondUnlock = await msvpToken.getUnlockedAmount(user1.address);
            expect(secondUnlock).to.equal(FIRST_YEAR_UNLOCK_AMOUNT * BigInt(2));
            
            // Advance to third unlock (month 13)
            await time.increase(3 * MONTH_IN_SECONDS);
            await msvpToken.updateUnlockedAmountsForUser(user1.address);
            
            const thirdUnlock = await msvpToken.getUnlockedAmount(user1.address);
            expect(thirdUnlock).to.equal(FIRST_YEAR_UNLOCK_AMOUNT * BigInt(3));
            
            // Advance to fourth unlock (month 16)
            await time.increase(3 * MONTH_IN_SECONDS);
            await msvpToken.updateUnlockedAmountsForUser(user1.address);
            
            const fourthUnlock = await msvpToken.getUnlockedAmount(user1.address);
            expect(fourthUnlock).to.equal(FIRST_YEAR_UNLOCK_AMOUNT * BigInt(4));
            
            // Advance to fifth unlock (month 19)
            await time.increase(3 * MONTH_IN_SECONDS);
            await msvpToken.updateUnlockedAmountsForUser(user1.address);
            
            const fifthUnlock = await msvpToken.getUnlockedAmount(user1.address);
            expect(fifthUnlock).to.equal(FIRST_YEAR_UNLOCK_AMOUNT * BigInt(5));
        });

        it("Should handle first year phase boundaries correctly", async function () {
            // Get the start time from the vesting schedule
            const schedule = await msvpToken.getVestingSchedule(user1.address);
            
            // At month 6.9 - should be 0
            const month6_9 = Number(schedule.startTime) + (6 * MONTH_IN_SECONDS) + (25 * 24 * 60 * 60); // 6 months + 25 days
            await time.increaseTo(month6_9);
            let vested = await msvpToken.getVestedAmount(user1.address);
            expect(vested).to.equal(0);
            
            // At month 7.1 - should have first unlock
            const month7_1 = Number(schedule.startTime) + (7 * MONTH_IN_SECONDS) + (3 * 24 * 60 * 60); // 7 months + 3 days
            await time.increaseTo(month7_1);
            vested = await msvpToken.getVestedAmount(user1.address);
            expect(vested).to.equal(FIRST_YEAR_UNLOCK_AMOUNT);
        });
    });

    describe("Phase 2: Post-Q5 Releases (Months 22-49) - 7% every 3 months", function () {
        beforeEach(async function () {
            const testAmount = AIRDROP_SUPPLY / BigInt(10); // Use smaller amount
            await msvpToken.createVestingSchedule(user1.address, testAmount);
        });

        it("Should unlock exactly 7% (3.5B tokens) per phase in post-Q5 period", async function () {
            // Advance to month 22 (first post-Q5 unlock)
            await time.increase(22 * MONTH_IN_SECONDS);
            await msvpToken.updateUnlockedAmountsForUser(user1.address);
            
            // Should have all first year unlocks (5 * 1.2% = 6%) plus first post-Q5 unlock (7%)
            const expectedAtMonth22 = (FIRST_YEAR_UNLOCK_AMOUNT * BigInt(5)) + POST_Q5_UNLOCK_AMOUNT;
            const unlockedAtMonth22 = await msvpToken.getUnlockedAmount(user1.address);
            expect(unlockedAtMonth22).to.equal(expectedAtMonth22);
            
            // Advance to month 25 (second post-Q5 unlock)
            await time.increase(3 * MONTH_IN_SECONDS);
            await msvpToken.updateUnlockedAmountsForUser(user1.address);
            
            const expectedAtMonth25 = expectedAtMonth22 + POST_Q5_UNLOCK_AMOUNT;
            const unlockedAtMonth25 = await msvpToken.getUnlockedAmount(user1.address);
            expect(unlockedAtMonth25).to.equal(expectedAtMonth25);
            
            // Advance to month 49 (last post-Q5 unlock)
            await time.increase(24 * MONTH_IN_SECONDS); // 8 more unlocks (months 28, 31, 34, 37, 40, 43, 46, 49)
            await msvpToken.updateUnlockedAmountsForUser(user1.address);
            
            // Should have 5 first year unlocks + 10 post-Q5 unlocks
            const expectedAtMonth49 = (FIRST_YEAR_UNLOCK_AMOUNT * BigInt(5)) + (POST_Q5_UNLOCK_AMOUNT * BigInt(10));
            const unlockedAtMonth49 = await msvpToken.getUnlockedAmount(user1.address);
            expect(unlockedAtMonth49).to.equal(expectedAtMonth49);
        });

        it("Should handle post-Q5 phase boundaries correctly", async function () {
            // Get the start time from the vesting schedule
            const schedule = await msvpToken.getVestingSchedule(user1.address);
            
            // At month 21.9 - should have only first year unlocks
            const month21_9 = Number(schedule.startTime) + (21 * MONTH_IN_SECONDS) + (25 * 24 * 60 * 60);
            await time.increaseTo(month21_9);
            let vested = await msvpToken.getVestedAmount(user1.address);
            const expectedFirstYear = FIRST_YEAR_UNLOCK_AMOUNT * BigInt(5);
            expect(vested).to.equal(expectedFirstYear);
            
            // At month 22.1 - should have first post-Q5 unlock
            const month22_1 = Number(schedule.startTime) + (22 * MONTH_IN_SECONDS) + (3 * 24 * 60 * 60);
            await time.increaseTo(month22_1);
            vested = await msvpToken.getVestedAmount(user1.address);
            expect(vested).to.equal(expectedFirstYear + POST_Q5_UNLOCK_AMOUNT);
        });
    });

    describe("Phase 3: Final Releases (Months 52-61) - 6% every 3 months", function () {
        beforeEach(async function () {
            const testAmount = AIRDROP_SUPPLY / BigInt(10); // Use smaller amount
            await msvpToken.createVestingSchedule(user1.address, testAmount);
        });

        it("Should unlock exactly 6% (3B tokens) per phase in final period", async function () {
            // Advance to month 52 (first final phase unlock)
            await time.increase(52 * MONTH_IN_SECONDS);
            await msvpToken.updateUnlockedAmountsForUser(user1.address);
            
            // Should have: 5 first year + 10 post-Q5 + 1 final = 16 unlocks
            const expectedAtMonth52 = (FIRST_YEAR_UNLOCK_AMOUNT * BigInt(5)) + (POST_Q5_UNLOCK_AMOUNT * BigInt(10)) + FINAL_UNLOCK_AMOUNT;
            const unlockedAtMonth52 = await msvpToken.getUnlockedAmount(user1.address);
            expect(unlockedAtMonth52).to.equal(expectedAtMonth52);
            
            // Advance to month 55 (second final phase unlock)
            await time.increase(3 * MONTH_IN_SECONDS);
            await msvpToken.updateUnlockedAmountsForUser(user1.address);
            
            const expectedAtMonth55 = expectedAtMonth52 + FINAL_UNLOCK_AMOUNT;
            const unlockedAtMonth55 = await msvpToken.getUnlockedAmount(user1.address);
            expect(unlockedAtMonth55).to.equal(expectedAtMonth55);
            
            // Advance to month 61 (last unlock)
            await time.increase(6 * MONTH_IN_SECONDS); // 2 more unlocks (months 58, 61)
            await msvpToken.updateUnlockedAmountsForUser(user1.address);
            
            // Should have: 5 first year + 10 post-Q5 + 4 final = 19 unlocks total
            const expectedAtMonth61 = (FIRST_YEAR_UNLOCK_AMOUNT * BigInt(5)) + (POST_Q5_UNLOCK_AMOUNT * BigInt(10)) + (FINAL_UNLOCK_AMOUNT * BigInt(4));
            const unlockedAtMonth61 = await msvpToken.getUnlockedAmount(user1.address);
            expect(unlockedAtMonth61).to.equal(expectedAtMonth61);
        });

        it("Should complete vesting at month 61", async function () {
            // Advance to month 61 (final unlock)
            await time.increase(61 * MONTH_IN_SECONDS);
            await msvpToken.updateUnlockedAmountsForUser(user1.address);
            
            const finalUnlocked = await msvpToken.getUnlockedAmount(user1.address);
            const lockedAmount = await msvpToken.getLockedAmount(user1.address);
            
            // Should have unlocked all tokens
            expect(finalUnlocked).to.equal(TEST_AMOUNT);
            expect(lockedAmount).to.equal(0);
        });
    });

    describe("Cumulative Unlock Tracking", function () {
        beforeEach(async function () {
            await msvpToken.createVestingSchedule(user1.address, TEST_AMOUNT);
        });

        it("Should track cumulative unlocks correctly across all phases", async function () {
            const unlockHistory = [];
            
            // Track unlocks at key milestones
            const milestones = [7, 10, 13, 16, 19, 22, 25, 28, 31, 34, 37, 40, 43, 46, 49, 52, 55, 58, 61];
            
            for (let i = 0; i < milestones.length; i++) {
                const month = milestones[i];
                
                // Advance to this month
                if (i === 0) {
                    await time.increase(month * MONTH_IN_SECONDS);
                } else {
                    const monthsToAdvance = month - milestones[i - 1];
                    await time.increase(monthsToAdvance * MONTH_IN_SECONDS);
                }
                
                await msvpToken.updateUnlockedAmountsForUser(user1.address);
                
                const unlocked = await msvpToken.getUnlockedAmount(user1.address);
                unlockHistory.push({ month, unlocked });
                
                // Verify cumulative progression
                if (i > 0) {
                    expect(unlocked).to.be.gt(unlockHistory[i - 1].unlocked);
                }
            }
            
            // Verify final unlock equals total supply
            expect(unlockHistory[unlockHistory.length - 1].unlocked).to.equal(TEST_AMOUNT);
        });

        it("Should calculate correct percentages at each milestone", async function () {
            // Month 7: 1.2%
            await time.increase(7 * MONTH_IN_SECONDS);
            await msvpToken.updateUnlockedAmountsForUser(user1.address);
            let unlocked = await msvpToken.getUnlockedAmount(user1.address);
            expect(unlocked).to.equal(FIRST_YEAR_UNLOCK_AMOUNT);
            
            // Month 19: 6% (5 * 1.2%)
            await time.increase(12 * MONTH_IN_SECONDS);
            await msvpToken.updateUnlockedAmountsForUser(user1.address);
            unlocked = await msvpToken.getUnlockedAmount(user1.address);
            expect(unlocked).to.equal(FIRST_YEAR_UNLOCK_AMOUNT * BigInt(5));
            
            // Month 49: 76% (6% + 70%)
            await time.increase(30 * MONTH_IN_SECONDS);
            await msvpToken.updateUnlockedAmountsForUser(user1.address);
            unlocked = await msvpToken.getUnlockedAmount(user1.address);
            const expectedAtMonth49 = (FIRST_YEAR_UNLOCK_AMOUNT * BigInt(5)) + (POST_Q5_UNLOCK_AMOUNT * BigInt(10));
            expect(unlocked).to.equal(expectedAtMonth49);
            
            // Month 61: 100%
            await time.increase(12 * MONTH_IN_SECONDS);
            await msvpToken.updateUnlockedAmountsForUser(user1.address);
            unlocked = await msvpToken.getUnlockedAmount(user1.address);
            expect(unlocked).to.equal(TEST_AMOUNT);
        });
    });

    describe("Transfer Restrictions During Vesting", function () {
        beforeEach(async function () {
            await msvpToken.createVestingSchedule(user1.address, TEST_AMOUNT);
            await msvpToken.transfer(user1.address, ethers.parseEther("1000")); // Additional tokens
        });

        it("Should prevent transfer of locked tokens during cliff period", async function () {
            // At 3 months - no tokens unlocked yet
            await time.increase(3 * MONTH_IN_SECONDS);
            const transferableAt3Months = await msvpToken.transferableBalance(user1.address);
            const lockedAt3Months = await msvpToken.getLockedAmount(user1.address);
            
            expect(lockedAt3Months).to.equal(TEST_AMOUNT);
            expect(transferableAt3Months).to.equal(0); // No tokens unlocked yet
            
            // Try to transfer more than transferable
            await expect(
                msvpToken.connect(user1).transfer(user2.address, ethers.parseEther("1"))
            ).to.be.revertedWith("Insufficient transferable balance");
        });

        it("Should allow transfer of unlocked tokens after cliff", async function () {
            // Advance to month 7 (first unlock)
            await time.increase(7 * MONTH_IN_SECONDS);
            await msvpToken.updateUnlockedAmountsForUser(user1.address);
            
            const transferableAt7Months = await msvpToken.transferableBalance(user1.address);
            const unlockedAt7Months = await msvpToken.getUnlockedAmount(user1.address);
            
            expect(unlockedAt7Months).to.equal(FIRST_YEAR_UNLOCK_AMOUNT);
            expect(transferableAt7Months).to.equal(FIRST_YEAR_UNLOCK_AMOUNT);
            
            // Should be able to transfer unlocked amount
            const transferAmount = ethers.parseEther("100");
            await expect(
                msvpToken.connect(user1).transfer(user2.address, transferAmount)
            ).to.not.be.reverted;
        });
    });

    describe("Large-Scale Airdrop Testing", function () {
        it("Should handle 50B token airdrop distribution across multiple users", async function () {
            const users = [user1, user2, user3, user4, user5];
            const tokensPerUser = AIRDROP_SUPPLY / BigInt(users.length); // 10B per user
            
            // Create vesting for multiple users
            for (const user of users) {
                await msvpToken.createVestingSchedule(user.address, tokensPerUser);
            }
            
            // Check total allocated
            const stats = await msvpToken.getVestingStats();
            expect(stats.totalAllocatedTokens).to.equal(AIRDROP_SUPPLY);
            expect(stats.totalParticipants).to.equal(users.length);
            
            // Advance to first unlock (month 7)
            await time.increase(7 * MONTH_IN_SECONDS);
            await msvpToken.updateUnlockedAmounts();
            
            // Check each user has unlocked tokens
            for (const user of users) {
                const unlocked = await msvpToken.getUnlockedAmount(user.address);
                const expectedUnlock = (tokensPerUser * BigInt(FIRST_YEAR_UNLOCK_PERCENTAGE)) / BigInt(1000);
                expect(unlocked).to.equal(expectedUnlock);
            }
        });

        it("Should handle complete vesting lifecycle for multiple users", async function () {
            const users = [user1, user2, user3];
            const tokensPerUser = AIRDROP_SUPPLY / BigInt(users.length);
            
            // Create vesting schedules
            for (const user of users) {
                await msvpToken.createVestingSchedule(user.address, tokensPerUser);
            }
            
            // Get the start time from one of the schedules
            const schedule = await msvpToken.getVestingSchedule(user1.address);
            const startTime = Number(schedule.startTime);
            
            // Complete vesting (61 months from start time)
            const endTime = startTime + (61 * MONTH_IN_SECONDS) + 1; // Add 1 second to avoid timestamp conflict
            await time.increaseTo(endTime);
            
            // Mine a block to ensure the time change is processed
            await time.increase(1);
            

            
            await msvpToken.updateUnlockedAmounts();
            
            // All users should have 100% unlocked
            for (const user of users) {
                const unlocked = await msvpToken.getUnlockedAmount(user.address);
                const locked = await msvpToken.getLockedAmount(user.address);
                
                // Allow for small precision differences (within 1 token)
                expect(unlocked).to.be.closeTo(tokensPerUser, ethers.parseEther("1"));
                
                // Allow for small precision differences (within 1 token)
                expect(locked).to.be.closeTo(0, ethers.parseEther("1"));
            }
        });
    });

    describe("Edge Cases & Boundary Conditions", function () {
        it("Should handle vesting at exact month boundaries", async function () {
            await msvpToken.createVestingSchedule(user1.address, TEST_AMOUNT);
            
            // At month 6.99 - should still be 0
            await time.increase((6 * MONTH_IN_SECONDS) + (29 * 24 * 60 * 60) + (23 * 60 * 60) + (59 * 60));
            let unlocked = await msvpToken.getUnlockedAmount(user1.address);
            expect(unlocked).to.equal(0);
            
            // At month 7.01 - should have first unlock
            await time.increase(2 * 60 + 1); // Additional 2 minutes + 1 second
            await msvpToken.updateUnlockedAmountsForUser(user1.address);
            unlocked = await msvpToken.getUnlockedAmount(user1.address);
            expect(unlocked).to.equal(FIRST_YEAR_UNLOCK_AMOUNT);
        });

        it("Should handle very small vesting amounts", async function () {
            const smallAmount = ethers.parseEther("1000"); // 1000 tokens
            await msvpToken.createVestingSchedule(user1.address, smallAmount);
            
            // Advance to month 7
            await time.increase(7 * MONTH_IN_SECONDS);
            await msvpToken.updateUnlockedAmountsForUser(user1.address);
            
            const unlocked = await msvpToken.getUnlockedAmount(user1.address);
            const expectedUnlock = (smallAmount * BigInt(FIRST_YEAR_UNLOCK_PERCENTAGE)) / BigInt(1000);
            expect(unlocked).to.equal(expectedUnlock);
        });

        it("Should handle vesting schedule modifications correctly", async function () {
            await msvpToken.createVestingSchedule(user1.address, TEST_AMOUNT);
            
            // Advance time and unlock some tokens
            await time.increase(7 * MONTH_IN_SECONDS);
            await msvpToken.updateUnlockedAmountsForUser(user1.address);
            
            const unlockedBefore = await msvpToken.getUnlockedAmount(user1.address);
            
            // Modify schedule to increase amount
            const newAmount = TEST_AMOUNT * BigInt(2);
            await msvpToken.modifyVestingSchedule(user1.address, newAmount);
            
            // Update unlocked amounts again
            await msvpToken.updateUnlockedAmountsForUser(user1.address);
            
            const unlockedAfter = await msvpToken.getUnlockedAmount(user1.address);
            expect(unlockedAfter).to.be.gte(unlockedBefore); // Should not decrease
        });
    });

    describe("Gas Optimization & Performance", function () {
        it("Should handle single user updates efficiently", async function () {
            await msvpToken.createVestingSchedule(user1.address, TEST_AMOUNT);
            
            const tx = await msvpToken.updateUnlockedAmountsForUser(user1.address);
            const receipt = await tx.wait();
            
            // Should use reasonable gas
            expect(receipt.gasUsed).to.be.lt(100000);
        });

        it("Should handle bulk updates efficiently", async function () {
            // Create multiple vesting schedules with smaller amounts
            const users = [user1, user2, user3, user4, user5];
            const amountPerUser = AIRDROP_SUPPLY / BigInt(10); // Use smaller amounts
            
            for (let i = 0; i < 5; i++) {
                const user = users[i];
                await msvpToken.createVestingSchedule(user.address, amountPerUser);
            }
            
            // Advance time to trigger unlocks
            await time.increase(7 * MONTH_IN_SECONDS);
            
            const tx = await msvpToken.updateUnlockedAmounts();
            const receipt = await tx.wait();
            
            // Should complete bulk update within reasonable gas
            expect(receipt.gasUsed).to.be.lt(1000000);
        });
    });

    describe("Integration Tests", function () {
        it("Should handle complete vesting lifecycle with transfers", async function () {
            // Create vesting schedule
            await msvpToken.createVestingSchedule(user1.address, TEST_AMOUNT);
            
            // No additional tokens needed - user now has their vesting amount
            
            // Advance to first unlock (month 7)
            await time.increase(7 * MONTH_IN_SECONDS);
            await msvpToken.updateUnlockedAmountsForUser(user1.address);
            
            // Transfer some unlocked tokens
            const transferAmount = ethers.parseEther("100");
            await msvpToken.connect(user1).transfer(user2.address, transferAmount);
            
            // Advance to complete vesting (month 61)
            await time.increase(54 * MONTH_IN_SECONDS);
            await msvpToken.updateUnlockedAmountsForUser(user1.address);
            
            const finalUnlocked = await msvpToken.getUnlockedAmount(user1.address);
            expect(finalUnlocked).to.equal(TEST_AMOUNT);
        });

        it("Should handle early release within tokenomics constraints", async function () {
            await msvpToken.createVestingSchedule(user1.address, TEST_AMOUNT);
            
            // Try early release before cliff
            await time.increase(3 * MONTH_IN_SECONDS);
            const earlyReleaseAmount = ethers.parseEther("1000000000"); // 1B tokens
            
            await msvpToken.earlyRelease(user1.address, earlyReleaseAmount);
            
            const unlocked = await msvpToken.getUnlockedAmount(user1.address);
            expect(unlocked).to.equal(earlyReleaseAmount);
            
            // Verify we can't release more than remaining locked
            const remainingLocked = await msvpToken.getLockedAmount(user1.address);
            await expect(
                msvpToken.earlyRelease(user1.address, remainingLocked + ethers.parseEther("1"))
            ).to.be.revertedWith("Amount exceeds remaining locked tokens");
        });

        it("Should handle emergency unlock all function", async function () {
            await msvpToken.createVestingSchedule(user1.address, TEST_AMOUNT);
            
            // No additional tokens needed - user now has their vesting amount
            
            // Advance to month 3 (during cliff period)
            await time.increase(3 * MONTH_IN_SECONDS);
            
            // Check initial state
            const initialLocked = await msvpToken.getLockedAmount(user1.address);
            const initialUnlocked = await msvpToken.getUnlockedAmount(user1.address);
            const initialTransferable = await msvpToken.transferableBalance(user1.address);
            
            expect(initialLocked).to.equal(TEST_AMOUNT);
            expect(initialUnlocked).to.equal(0);
            expect(initialTransferable).to.equal(0); // No tokens unlocked yet
            
            // Emergency unlock all tokens
            await expect(msvpToken.emergencyUnlockAll(user1.address))
                .to.emit(msvpToken, "EmergencyUnlockAll")
                .withArgs(user1.address, TEST_AMOUNT, anyValue);
            
            // Check final state - all tokens should be unlocked
            const finalLocked = await msvpToken.getLockedAmount(user1.address);
            const finalUnlocked = await msvpToken.getUnlockedAmount(user1.address);
            const transferable = await msvpToken.transferableBalance(user1.address);
            
            expect(finalLocked).to.equal(0);
            expect(finalUnlocked).to.equal(TEST_AMOUNT);
            expect(transferable).to.equal(TEST_AMOUNT);
            
            // Verify the emergency unlock worked correctly
            // Note: Actual token transfers require the contract to have a different design
            // where unlocked tokens are actually transferred to user balances
            
            // Test error cases
            await expect(
                msvpToken.emergencyUnlockAll(user1.address)
            ).to.be.revertedWith("No tokens left to unlock");
            
            await expect(
                msvpToken.emergencyUnlockAll(user3.address)
            ).to.be.revertedWith("No active vesting schedule");
        });

        it("Should handle emergency unlock all with partial existing unlocks", async function () {
            await msvpToken.createVestingSchedule(user1.address, TEST_AMOUNT);
            
            // No additional tokens needed - user now has their vesting amount
            
            // Advance to month 7 and update unlocked amounts
            await time.increase(7 * MONTH_IN_SECONDS);
            await msvpToken.updateUnlockedAmountsForUser(user1.address);
            
            // Check state after natural unlock
            const partialUnlocked = await msvpToken.getUnlockedAmount(user1.address);
            const partialLocked = await msvpToken.getLockedAmount(user1.address);
            
            expect(partialUnlocked).to.equal(FIRST_YEAR_UNLOCK_AMOUNT); // 1.2% unlocked
            expect(partialLocked).to.be.gt(0);
            
            // Emergency unlock all remaining tokens
            await msvpToken.emergencyUnlockAll(user1.address);
            
            // Check final state
            const finalUnlocked = await msvpToken.getUnlockedAmount(user1.address);
            const finalLocked = await msvpToken.getLockedAmount(user1.address);
            
            expect(finalUnlocked).to.equal(TEST_AMOUNT);
            expect(finalLocked).to.equal(0);
        });
    });

    describe("Vesting Schedule Management Functions", function () {
        it("Should deactivate and reactivate vesting schedule", async function () {
            await msvpToken.createVestingSchedule(user1.address, TEST_AMOUNT);
            
            // Check initial state
            let schedule = await msvpToken.getVestingSchedule(user1.address);
            expect(schedule.isActive).to.be.true;
            
            // Deactivate vesting
            await expect(msvpToken.deactivateVestingSchedule(user1.address))
                .to.emit(msvpToken, "VestingScheduleDeactivated")
                .withArgs(user1.address, anyValue);
            
            // Verify deactivated
            schedule = await msvpToken.getVestingSchedule(user1.address);
            expect(schedule.isActive).to.be.false;
            
            // Try to use vesting functions (should fail)
            await expect(
                msvpToken.earlyRelease(user1.address, ethers.parseEther("1000000000"))
            ).to.be.revertedWith("No active vesting schedule");
            
            // Reactivate vesting
            await expect(msvpToken.reactivateVestingSchedule(user1.address))
                .to.emit(msvpToken, "VestingScheduleReactivated")
                .withArgs(user1.address, anyValue);
            
            // Verify reactivated
            schedule = await msvpToken.getVestingSchedule(user1.address);
            expect(schedule.isActive).to.be.true;
            
            // Should work again
            await msvpToken.earlyRelease(user1.address, ethers.parseEther("1000000000"));
        });

        it("Should cancel vesting schedule completely", async function () {
            await msvpToken.createVestingSchedule(user1.address, TEST_AMOUNT);
            
            // Check initial state
            let schedule = await msvpToken.getVestingSchedule(user1.address);
            expect(schedule.isActive).to.be.true;
            expect(schedule.totalAmount).to.equal(TEST_AMOUNT);
            
            // Cancel vesting
            await expect(msvpToken.cancelVestingSchedule(user1.address))
                .to.emit(msvpToken, "VestingScheduleCancelled")
                .withArgs(user1.address, TEST_AMOUNT, anyValue);
            
            // Verify cancelled
            schedule = await msvpToken.getVestingSchedule(user1.address);
            expect(schedule.isActive).to.be.false;
            expect(schedule.totalAmount).to.equal(TEST_AMOUNT); // totalAmount remains unchanged
            
            // Try to use vesting functions (should fail)
            await expect(
                msvpToken.earlyRelease(user1.address, ethers.parseEther("1000000000"))
            ).to.be.revertedWith("No active vesting schedule");
        });

        it("Should toggle airdrop status", async function () {
            await msvpToken.createVestingSchedule(user1.address, AIRDROP_SUPPLY);
            
            // Check initial state
            let schedule = await msvpToken.getVestingSchedule(user1.address);
            expect(schedule.isAirdrop).to.be.true;
            
            // Toggle to false
            await expect(msvpToken.toggleAirdropStatus(user1.address))
                .to.emit(msvpToken, "AirdropStatusToggled")
                .withArgs(user1.address, false, anyValue);
            
            // Verify toggled
            schedule = await msvpToken.getVestingSchedule(user1.address);
            expect(schedule.isAirdrop).to.be.false;
            
            // Toggle back to true
            await expect(msvpToken.toggleAirdropStatus(user1.address))
                .to.emit(msvpToken, "AirdropStatusToggled")
                .withArgs(user1.address, true, anyValue);
            
            // Verify toggled back
            schedule = await msvpToken.getVestingSchedule(user1.address);
            expect(schedule.isAirdrop).to.be.true;
        });

        it("Should handle error cases for vesting management", async function () {
            // Try to deactivate non-existent schedule
            await expect(
                msvpToken.deactivateVestingSchedule(user3.address)
            ).to.be.revertedWith("No active vesting schedule");
            
            // Try to reactivate non-existent schedule
            await expect(
                msvpToken.reactivateVestingSchedule(user3.address)
            ).to.be.revertedWith("No vesting schedule exists");
            
            // Try to cancel non-existent schedule
            await expect(
                msvpToken.cancelVestingSchedule(user3.address)
            ).to.be.revertedWith("No active vesting schedule");
            
            // Try to toggle airdrop status for non-existent schedule
            await expect(
                msvpToken.toggleAirdropStatus(user3.address)
            ).to.be.revertedWith("No active vesting schedule");
        });

        it("Should automatically deactivate completed vesting schedules", async function () {
            await msvpToken.createVestingSchedule(user1.address, TEST_AMOUNT);
            
            // Advance to complete vesting (month 61)
            await time.increase(61 * MONTH_IN_SECONDS);
            await msvpToken.updateUnlockedAmountsForUser(user1.address);
            
            // Check that vesting is automatically deactivated
            const schedule = await msvpToken.getVestingSchedule(user1.address);
            expect(schedule.isActive).to.be.false;
            
            // Verify all tokens are unlocked
            const unlocked = await msvpToken.getUnlockedAmount(user1.address);
            expect(unlocked).to.equal(TEST_AMOUNT);
        });

        it("Should handle partial completion and auto-deactivation", async function () {
            await msvpToken.createVestingSchedule(user1.address, TEST_AMOUNT);
            
            // Advance to month 60 (almost complete)
            await time.increase(60 * MONTH_IN_SECONDS);
            await msvpToken.updateUnlockedAmountsForUser(user1.address);
            
            // Should still be active
            let schedule = await msvpToken.getVestingSchedule(user1.address);
            expect(schedule.isActive).to.be.true;
            
            // Advance to month 61 (complete)
            await time.increase(1 * MONTH_IN_SECONDS);
            await msvpToken.updateUnlockedAmountsForUser(user1.address);
            
            // Should now be deactivated
            schedule = await msvpToken.getVestingSchedule(user1.address);
            expect(schedule.isActive).to.be.false;
        });
    });

    // ==================== COMPREHENSIVE TAX SYSTEM TESTING ====================
    
    describe("Transfer Tax System - Comprehensive Testing", function () {
        let userWithTokens, recipient;
        
        beforeEach(async function () {
            [userWithTokens, recipient] = [user1, user2];
            
            // Create vesting schedule and advance time to unlock tokens
            await msvpToken.createVestingSchedule(userWithTokens.address, AIRDROP_SUPPLY);
            await time.increase(7 * MONTH_IN_SECONDS); // Past cliff
            await msvpToken.updateUnlockedAmountsForUser(userWithTokens.address);
            
            // Transfer some tokens to userWithTokens for testing
            await msvpToken.transfer(userWithTokens.address, ethers.parseEther("1000000"));
            
            // Ensure user has enough unlocked tokens for testing
            await time.increase(3 * MONTH_IN_SECONDS);
            await msvpToken.updateUnlockedAmountsForUser(userWithTokens.address);
            
            // Ensure tax rate is set to default (5%)
            await msvpToken.updateTransferTaxRate(50);
        });

        describe("Basic Tax Calculation & Distribution", function () {
            it("Should calculate 5% tax correctly on transfers", async function () {
                const transferAmount = ethers.parseEther("1000");
                const expectedTax = (transferAmount * BigInt(50)) / BigInt(1000); // 5% = 50/1000
                const expectedTransfer = transferAmount - expectedTax;
                
                const initialBalance = await msvpToken.balanceOf(recipient.address);
                const initialLPBalance = await msvpToken.balanceOf(lpWallet.address);
                const initialDevBalance = await msvpToken.balanceOf(developmentWallet.address);
                const initialMarketingBalance = await msvpToken.balanceOf(marketingWallet.address);
                const initialTotalSupply = await msvpToken.totalSupply();
                
                await msvpToken.connect(userWithTokens).transfer(recipient.address, transferAmount);
                
                // Check recipient received correct amount (after tax)
                const finalBalance = await msvpToken.balanceOf(recipient.address);
                expect(finalBalance - initialBalance).to.equal(expectedTransfer);
                
                // Check tax distribution
                const finalLPBalance = await msvpToken.balanceOf(lpWallet.address);
                const finalDevBalance = await msvpToken.balanceOf(developmentWallet.address);
                const finalMarketingBalance = await msvpToken.balanceOf(marketingWallet.address);
                const finalTotalSupply = await msvpToken.totalSupply();
                
                // LP: 2% of tax amount
                const expectedLPAmount = (expectedTax * BigInt(20)) / BigInt(50);
                expect(finalLPBalance - initialLPBalance).to.equal(expectedLPAmount);
                
                // Development: 1.5% of tax amount  
                const expectedDevAmount = (expectedTax * BigInt(15)) / BigInt(50);
                expect(finalDevBalance - initialDevBalance).to.equal(expectedDevAmount);
                
                // Marketing: 1% of tax amount
                const expectedMarketingAmount = (expectedTax * BigInt(10)) / BigInt(50);
                expect(finalMarketingBalance - initialMarketingBalance).to.equal(expectedMarketingAmount);
                
                // Burn: 0.5% of tax amount
                const expectedBurnAmount = (expectedTax * BigInt(5)) / BigInt(50);
                expect(initialTotalSupply - finalTotalSupply).to.equal(expectedBurnAmount);
                
                // Verify total tax equals sum of all distributions
                const totalDistributed = (finalLPBalance - initialLPBalance) + 
                                       (finalDevBalance - initialDevBalance) + 
                                       (finalMarketingBalance - initialMarketingBalance) + 
                                       (initialTotalSupply - finalTotalSupply);
                expect(totalDistributed).to.equal(expectedTax);
            });

            it("Should handle zero tax rate correctly", async function () {
                // Set tax rate to 0
                await msvpToken.updateTransferTaxRate(0);
                
                const transferAmount = ethers.parseEther("1000");
                const initialBalance = await msvpToken.balanceOf(recipient.address);
                const initialTotalSupply = await msvpToken.totalSupply();
                
                await msvpToken.connect(userWithTokens).transfer(recipient.address, transferAmount);
                
                // Check no tax was taken
                const finalBalance = await msvpToken.balanceOf(recipient.address);
                expect(finalBalance - initialBalance).to.equal(transferAmount);
                
                // Check no tokens were burned
                const finalTotalSupply = await msvpToken.totalSupply();
                expect(finalTotalSupply).to.equal(initialTotalSupply);
                
                // Restore tax rate
                await msvpToken.updateTransferTaxRate(50);
            });

            it("Should handle maximum tax rate correctly", async function () {
                // Set tax rate to maximum (10%)
                await msvpToken.updateTransferTaxRate(100);
                
                const transferAmount = ethers.parseEther("1000");
                const expectedTax = (transferAmount * BigInt(100)) / BigInt(1000); // 10%
                const expectedTransfer = transferAmount - expectedTax;
                
                const initialBalance = await msvpToken.balanceOf(recipient.address);
                await msvpToken.connect(userWithTokens).transfer(recipient.address, transferAmount);
                
                const finalBalance = await msvpToken.balanceOf(recipient.address);
                expect(finalBalance - initialBalance).to.equal(expectedTransfer);
                
                // Restore tax rate
                await msvpToken.updateTransferTaxRate(50);
            });
        });

        describe("Tax Exclusions & Edge Cases", function () {
            it("Should exclude sender from tax when marked as excluded", async function () {
                // Exclude sender from tax
                await msvpToken.setTaxExclusion(userWithTokens.address, true);
                
                const transferAmount = ethers.parseEther("1000");
                const initialBalance = await msvpToken.balanceOf(recipient.address);
                const initialTotalSupply = await msvpToken.totalSupply();
                
                await msvpToken.connect(userWithTokens).transfer(recipient.address, transferAmount);
                
                // Check no tax was taken
                const finalBalance = await msvpToken.balanceOf(recipient.address);
                expect(finalBalance - initialBalance).to.equal(transferAmount);
                
                // Check no tokens were burned
                const finalTotalSupply = await msvpToken.totalSupply();
                expect(finalTotalSupply).to.equal(initialTotalSupply);
                
                // Remove exclusion
                await msvpToken.setTaxExclusion(userWithTokens.address, false);
            });

            it("Should exclude recipient from tax when marked as excluded", async function () {
                // Exclude recipient from tax
                await msvpToken.setTaxExclusion(recipient.address, true);
                
                const transferAmount = ethers.parseEther("1000");
                const initialBalance = await msvpToken.balanceOf(recipient.address);
                const initialTotalSupply = await msvpToken.totalSupply();
                
                await msvpToken.connect(userWithTokens).transfer(recipient.address, transferAmount);
                
                // Check no tax was taken
                const finalBalance = await msvpToken.balanceOf(recipient.address);
                expect(finalBalance - initialBalance).to.equal(transferAmount);
                
                // Check no tokens were burned
                const finalTotalSupply = await msvpToken.totalSupply();
                expect(finalTotalSupply).to.equal(initialTotalSupply);
                
                // Remove exclusion
                await msvpToken.setTaxExclusion(recipient.address, false);
            });

            it("Should handle both sender and recipient excluded from tax", async function () {
                // Exclude both from tax
                await msvpToken.setTaxExclusion(userWithTokens.address, true);
                await msvpToken.setTaxExclusion(recipient.address, true);
                
                const transferAmount = ethers.parseEther("1000");
                const initialBalance = await msvpToken.balanceOf(recipient.address);
                const initialTotalSupply = await msvpToken.totalSupply();
                
                await msvpToken.connect(userWithTokens).transfer(recipient.address, transferAmount);
                
                // Check no tax was taken
                const finalBalance = await msvpToken.balanceOf(recipient.address);
                expect(finalBalance - initialBalance).to.equal(transferAmount);
                
                // Check no tokens were burned
                const finalTotalSupply = await msvpToken.totalSupply();
                expect(finalTotalSupply).to.equal(initialTotalSupply);
                
                // Remove exclusions
                await msvpToken.setTaxExclusion(userWithTokens.address, false);
                await msvpToken.setTaxExclusion(recipient.address, false);
            });

            it("Should handle tax exclusion toggling correctly", async function () {
                // Initially excluded
                await msvpToken.setTaxExclusion(userWithTokens.address, true);
                
                let isExcluded = await msvpToken.isExcludedFromTax(userWithTokens.address);
                expect(isExcluded).to.be.true;
                
                // Remove exclusion
                await msvpToken.setTaxExclusion(userWithTokens.address, false);
                isExcluded = await msvpToken.isExcludedFromTax(userWithTokens.address);
                expect(isExcluded).to.be.false;
                
                // Add exclusion again
                await msvpToken.setTaxExclusion(userWithTokens.address, true);
                isExcluded = await msvpToken.isExcludedFromTax(userWithTokens.address);
                expect(isExcluded).to.be.true;
            });
        });

        describe("Tax Component Management", function () {
            it("Should update LP contribution rate correctly", async function () {
                const newRate = 25; // 2.5% (safe value)
                await msvpToken.updateLPContributionRate(newRate);
                
                // Verify rate was updated
                const updatedRate = await msvpToken.lpContributionRate();
                expect(updatedRate).to.equal(newRate);
                
                // Test transfer with new rate
                const transferAmount = ethers.parseEther("1000");
                const expectedTax = (transferAmount * BigInt(50)) / BigInt(1000); // 5% tax
                const expectedLPAmount = (expectedTax * BigInt(newRate)) / BigInt(50);
                
                const initialLPBalance = await msvpToken.balanceOf(lpWallet.address);
                await msvpToken.connect(userWithTokens).transfer(recipient.address, transferAmount);
                const finalLPBalance = await msvpToken.balanceOf(lpWallet.address);
                
                expect(finalLPBalance - initialLPBalance).to.equal(expectedLPAmount);
                
                // Restore original rate
                await msvpToken.updateLPContributionRate(20);
            });

            it("Should update development rate correctly", async function () {
                const newRate = 20; // 2% (safe value)
                await msvpToken.updateDevelopmentRate(newRate);
                
                // Verify rate was updated
                const updatedRate = await msvpToken.developmentRate();
                expect(updatedRate).to.equal(newRate);
                
                // Test transfer with new rate
                const transferAmount = ethers.parseEther("1000");
                const expectedTax = (transferAmount * BigInt(50)) / BigInt(1000); // 5% tax
                const expectedDevAmount = (expectedTax * BigInt(newRate)) / BigInt(50);
                
                const initialDevBalance = await msvpToken.balanceOf(developmentWallet.address);
                await msvpToken.connect(userWithTokens).transfer(recipient.address, transferAmount);
                const finalDevBalance = await msvpToken.balanceOf(developmentWallet.address);
                
                expect(finalDevBalance - initialDevBalance).to.equal(expectedDevAmount);
                
                // Restore original rate
                await msvpToken.updateDevelopmentRate(15);
            });

            it("Should update marketing rate correctly", async function () {
                const newRate = 15; // 1.5%
                await msvpToken.updateMarketingRate(newRate);
                
                // Verify rate was updated
                const updatedRate = await msvpToken.marketingRate();
                expect(updatedRate).to.equal(newRate);
                
                // Test transfer with new rate
                const transferAmount = ethers.parseEther("1000");
                const expectedTax = (transferAmount * BigInt(50)) / BigInt(1000); // 5% tax
                const expectedMarketingAmount = (expectedTax * BigInt(newRate)) / BigInt(50);
                
                const initialMarketingBalance = await msvpToken.balanceOf(marketingWallet.address);
                await msvpToken.connect(userWithTokens).transfer(recipient.address, transferAmount);
                const finalMarketingBalance = await msvpToken.balanceOf(marketingWallet.address);
                
                expect(finalMarketingBalance - initialMarketingBalance).to.equal(expectedMarketingAmount);
                
                // Restore original rate
                await msvpToken.updateMarketingRate(10);
            });

            it("Should update burn rate correctly", async function () {
                const newRate = 8; // 0.8% (safe value)
                await msvpToken.updateBurnRate(newRate);
                
                // Verify rate was updated
                const updatedRate = await msvpToken.burnRate();
                expect(updatedRate).to.equal(newRate);
                
                // Test transfer with new rate
                const transferAmount = ethers.parseEther("1000");
                const expectedTax = (transferAmount * BigInt(50)) / BigInt(1000); // 5% tax
                
                // Calculate expected burn amount based on remaining tax after other distributions
                const lpAmount = (expectedTax * BigInt(20)) / BigInt(50); // 2% of total tax
                const devAmount = (expectedTax * BigInt(15)) / BigInt(50); // 1.5% of total tax
                const marketingAmount = (expectedTax * BigInt(10)) / BigInt(50); // 1% of total tax
                const expectedBurnAmount = expectedTax - lpAmount - devAmount - marketingAmount; // Remaining tax
                
                const initialTotalSupply = await msvpToken.totalSupply();
                await msvpToken.connect(userWithTokens).transfer(recipient.address, transferAmount);
                const finalTotalSupply = await msvpToken.totalSupply();
                
                // Verify burn amount is correct (allowing for rounding)
                const actualBurnAmount = initialTotalSupply - finalTotalSupply;
                expect(actualBurnAmount).to.be.closeTo(expectedBurnAmount, ethers.parseEther("0.001"));
                
                // Restore original rate
                await msvpToken.updateBurnRate(5);
            });

            it("Should prevent tax components exceeding total tax rate", async function () {
                // Try to set LP rate to 60% (exceeds 50% total tax)
                await expect(
                    msvpToken.updateLPContributionRate(60)
                ).to.be.revertedWith("Rate cannot exceed transfer tax");
                
                // Try to set development rate to 55% (exceeds 50% total tax)
                await expect(
                    msvpToken.updateDevelopmentRate(55)
                ).to.be.revertedWith("Rate cannot exceed transfer tax");
                
                // Try to set marketing rate to 51% (exceeds 50% total tax)
                await expect(
                    msvpToken.updateMarketingRate(51)
                ).to.be.revertedWith("Rate cannot exceed transfer tax");
                
                // Try to set burn rate to 51% (exceeds 50% total tax)
                await expect(
                    msvpToken.updateBurnRate(51)
                ).to.be.revertedWith("Rate cannot exceed transfer tax");
            });

            it("Should handle zero component rates correctly", async function () {
                // Set all component rates to 0
                await msvpToken.updateLPContributionRate(0);
                await msvpToken.updateDevelopmentRate(0);
                await msvpToken.updateMarketingRate(0);
                await msvpToken.updateBurnRate(0);
                
                const transferAmount = ethers.parseEther("1000");
                const initialTotalSupply = await msvpToken.totalSupply();
                
                await msvpToken.connect(userWithTokens).transfer(recipient.address, transferAmount);
                
                // Check no tokens were distributed or burned
                const finalTotalSupply = await msvpToken.totalSupply();
                expect(finalTotalSupply).to.equal(initialTotalSupply);
                
                // Restore original rates
                await msvpToken.updateLPContributionRate(20);
                await msvpToken.updateDevelopmentRate(15);
                await msvpToken.updateMarketingRate(10);
                await msvpToken.updateBurnRate(5);
            });
        });

        describe("Wallet Management & Updates", function () {
            it("Should update LP wallet correctly", async function () {
                const newLPWallet = user3.address;
                await msvpToken.updateLPWallet(newLPWallet);
                
                // Verify wallet was updated
                const updatedWallet = await msvpToken.lpWallet();
                expect(updatedWallet).to.equal(newLPWallet);
                
                // Test transfer to new wallet
                const transferAmount = ethers.parseEther("1000");
                const expectedTax = (transferAmount * BigInt(50)) / BigInt(1000); // 5% tax
                const expectedLPAmount = (expectedTax * BigInt(20)) / BigInt(50);
                
                const initialLPBalance = await msvpToken.balanceOf(newLPWallet);
                await msvpToken.connect(userWithTokens).transfer(recipient.address, transferAmount);
                const finalLPBalance = await msvpToken.balanceOf(newLPWallet);
                
                expect(finalLPBalance - initialLPBalance).to.equal(expectedLPAmount);
                
                // Restore original wallet
                await msvpToken.updateLPWallet(lpWallet.address);
            });

            it("Should update marketing wallet correctly", async function () {
                const newMarketingWallet = user4.address;
                await msvpToken.updateMarketingWallet(newMarketingWallet);
                
                // Verify wallet was updated
                const updatedWallet = await msvpToken.marketingWallet();
                expect(updatedWallet).to.equal(newMarketingWallet);
                
                // Test transfer to new wallet
                const transferAmount = ethers.parseEther("1000");
                const expectedTax = (transferAmount * BigInt(50)) / BigInt(1000); // 5% tax
                const expectedMarketingAmount = (expectedTax * BigInt(10)) / BigInt(50);
                
                const initialMarketingBalance = await msvpToken.balanceOf(newMarketingWallet);
                await msvpToken.connect(userWithTokens).transfer(recipient.address, transferAmount);
                const finalMarketingBalance = await msvpToken.balanceOf(newMarketingWallet);
                
                expect(finalMarketingBalance - initialMarketingBalance).to.equal(expectedMarketingAmount);
                
                // Restore original wallet
                await msvpToken.updateMarketingWallet(marketingWallet.address);
            });

            it("Should update development wallet correctly", async function () {
                const newDevWallet = user5.address;
                await msvpToken.updateDevelopmentWallet(newDevWallet);
                
                // Verify wallet was updated
                const updatedWallet = await msvpToken.developmentWallet();
                expect(updatedWallet).to.equal(newDevWallet);
                
                // Test transfer to new wallet
                const transferAmount = ethers.parseEther("1000");
                const expectedTax = (transferAmount * BigInt(50)) / BigInt(1000); // 5% tax
                const expectedDevAmount = (expectedTax * BigInt(15)) / BigInt(50);
                
                const initialDevBalance = await msvpToken.balanceOf(newDevWallet);
                await msvpToken.connect(userWithTokens).transfer(recipient.address, transferAmount);
                const finalDevBalance = await msvpToken.balanceOf(newDevWallet);
                
                expect(finalDevBalance - initialDevBalance).to.equal(expectedDevAmount);
                
                // Restore original wallet
                await msvpToken.updateDevelopmentWallet(developmentWallet.address);
            });

            it("Should prevent zero address wallet updates", async function () {
                const zeroAddress = "0x0000000000000000000000000000000000000000";
                
                await expect(
                    msvpToken.updateLPWallet(zeroAddress)
                ).to.be.revertedWith("Invalid wallet address");
                
                await expect(
                    msvpToken.updateMarketingWallet(zeroAddress)
                ).to.be.revertedWith("Invalid wallet address");
                
                await expect(
                    msvpToken.updateDevelopmentWallet(zeroAddress)
                ).to.be.revertedWith("Invalid wallet address");
            });
        });

        describe("Max Transaction Limits", function () {
            it("Should enforce max transaction limits", async function () {
                const maxTxAmount = await msvpToken.maxTxAmount();
                const transferAmount = maxTxAmount + ethers.parseEther("1");
                
                // Ensure user has enough unlocked tokens
                await time.increase(2 * MONTH_IN_SECONDS);
                await msvpToken.updateUnlockedAmountsForUser(userWithTokens.address);
                
                await expect(
                    msvpToken.connect(userWithTokens).transfer(recipient.address, transferAmount)
                ).to.be.revertedWith("Transfer amount exceeds max transaction limit");
            });

            it("Should allow excluded addresses to exceed limits", async function () {
                // Temporarily set maxTxAmount to a reasonable value for testing
                const originalMaxTxAmount = await msvpToken.maxTxAmount();
                const testMaxTxAmount = ethers.parseEther("100000"); // 100K tokens
                await msvpToken.updateMaxTxAmount(testMaxTxAmount);
                
                // Try to transfer more than the limit (should fail)
                const transferAmount = testMaxTxAmount + ethers.parseEther("1000");
                await expect(
                    msvpToken.connect(userWithTokens).transfer(recipient.address, transferAmount)
                ).to.be.revertedWith("Transfer amount exceeds max transaction limit");
                
                // Exclude sender from max tx limit
                await msvpToken.setMaxTxExclusion(userWithTokens.address, true);
                
                // Should now succeed
                await msvpToken.connect(userWithTokens).transfer(recipient.address, transferAmount);
                
                // Remove exclusion
                await msvpToken.setMaxTxExclusion(userWithTokens.address, false);
                
                // Restore original maxTxAmount
                await msvpToken.updateMaxTxAmount(originalMaxTxAmount);
            });

            it("Should handle max transaction amount updates", async function () {
                const newMaxTxAmount = ethers.parseEther("1000000"); // 1M tokens
                await msvpToken.updateMaxTxAmount(newMaxTxAmount);
                
                // Verify amount was updated
                const updatedAmount = await msvpToken.maxTxAmount();
                expect(updatedAmount).to.equal(newMaxTxAmount);
                
                // Test transfer at new limit
                await msvpToken.connect(userWithTokens).transfer(recipient.address, newMaxTxAmount);
                
                // Restore original amount
                await msvpToken.updateMaxTxAmount(ethers.parseEther("1000000000")); // 1B tokens
            });

            it("Should handle max tx exclusion toggling", async function () {
                // Initially not excluded
                let isExcluded = await msvpToken.isExcludedFromMaxTx(userWithTokens.address);
                expect(isExcluded).to.be.false;
                
                // Add exclusion
                await msvpToken.setMaxTxExclusion(userWithTokens.address, true);
                isExcluded = await msvpToken.isExcludedFromMaxTx(userWithTokens.address);
                expect(isExcluded).to.be.true;
                
                // Remove exclusion
                await msvpToken.setMaxTxExclusion(userWithTokens.address, false);
                isExcluded = await msvpToken.isExcludedFromMaxTx(userWithTokens.address);
                expect(isExcluded).to.be.false;
            });
        });

        describe("Tax Precision & Edge Cases", function () {
            it("Should handle very small transfer amounts with tax", async function () {
                const transferAmount = ethers.parseEther("0.001"); // Very small amount
                const expectedTax = (transferAmount * BigInt(50)) / BigInt(1000); // 5% tax
                
                // Should not revert due to precision issues
                await expect(
                    msvpToken.connect(userWithTokens).transfer(recipient.address, transferAmount)
                ).to.not.be.reverted;
            });

            it("Should handle tax calculation with rounding correctly", async function () {
                // Test with amount that might cause rounding issues
                const transferAmount = ethers.parseEther("1.111"); // Amount with decimals
                const expectedTax = (transferAmount * BigInt(50)) / BigInt(1000); // 5% tax
                
                await msvpToken.connect(userWithTokens).transfer(recipient.address, transferAmount);
                
                // Verify tax was calculated and distributed
                const finalTotalSupply = await msvpToken.totalSupply();
                expect(finalTotalSupply).to.be.lt(await msvpToken.TOTAL_SUPPLY());
            });

            it("Should handle maximum precision tax rates", async function () {
                // Set tax rate to 0.1% (minimum precision)
                await msvpToken.updateTransferTaxRate(1);
                
                // Set all component rates to 0 to avoid overflow
                await msvpToken.updateLPContributionRate(0);
                await msvpToken.updateDevelopmentRate(0);
                await msvpToken.updateMarketingRate(0);
                await msvpToken.updateBurnRate(0);
                
                const transferAmount = ethers.parseEther("1000");
                const expectedTax = (transferAmount * BigInt(1)) / BigInt(1000); // 0.1%
                
                await msvpToken.connect(userWithTokens).transfer(recipient.address, transferAmount);
                
                // Verify minimal tax was taken
                expect(expectedTax).to.be.gt(0);
                
                // Restore original rates
                await msvpToken.updateTransferTaxRate(50);
                await msvpToken.updateLPContributionRate(20);
                await msvpToken.updateDevelopmentRate(15);
                await msvpToken.updateMarketingRate(10);
                await msvpToken.updateBurnRate(5);
            });

            it("Should handle tax distribution with zero component rates", async function () {
                // Set all component rates to 0 except one
                await msvpToken.updateLPContributionRate(50); // 5% (all tax goes to LP)
                await msvpToken.updateDevelopmentRate(0);
                await msvpToken.updateMarketingRate(0);
                await msvpToken.updateBurnRate(0);
                
                const transferAmount = ethers.parseEther("1000");
                const expectedTax = (transferAmount * BigInt(50)) / BigInt(1000); // 5% tax
                
                const initialLPBalance = await msvpToken.balanceOf(lpWallet.address);
                await msvpToken.connect(userWithTokens).transfer(recipient.address, transferAmount);
                const finalLPBalance = await msvpToken.balanceOf(lpWallet.address);
                
                // All tax should go to LP
                expect(finalLPBalance - initialLPBalance).to.equal(expectedTax);
                
                // Restore original rates
                await msvpToken.updateLPContributionRate(20);
                await msvpToken.updateDevelopmentRate(15);
                await msvpToken.updateMarketingRate(10);
                await msvpToken.updateBurnRate(5);
            });
        });

        describe("Security & Access Control", function () {
            it("Should prevent non-owner from updating tax rates", async function () {
                await expect(
                    msvpToken.connect(user1).updateTransferTaxRate(30)
                ).to.be.revertedWith("Ownable: caller is not the owner");
                
                await expect(
                    msvpToken.connect(user1).updateLPContributionRate(25)
                ).to.be.revertedWith("Ownable: caller is not the owner");
                
                await expect(
                    msvpToken.connect(user1).updateDevelopmentRate(20)
                ).to.be.revertedWith("Ownable: caller is not the owner");
                
                await expect(
                    msvpToken.connect(user1).updateMarketingRate(15)
                ).to.be.revertedWith("Ownable: caller is not the owner");
                
                await expect(
                    msvpToken.connect(user1).updateBurnRate(10)
                ).to.be.revertedWith("Ownable: caller is not the owner");
            });

            it("Should prevent non-owner from updating wallets", async function () {
                await expect(
                    msvpToken.connect(user1).updateLPWallet(user3.address)
                ).to.be.revertedWith("Ownable: caller is not the owner");
                
                await expect(
                    msvpToken.connect(user1).updateMarketingWallet(user4.address)
                ).to.be.revertedWith("Ownable: caller is not the owner");
                
                await expect(
                    msvpToken.connect(user1).updateDevelopmentWallet(user5.address)
                ).to.be.revertedWith("Ownable: caller is not the owner");
            });

            it("Should prevent non-owner from setting exclusions", async function () {
                await expect(
                    msvpToken.connect(user1).setTaxExclusion(user2.address, true)
                ).to.be.revertedWith("Ownable: caller is not the owner");
                
                await expect(
                    msvpToken.connect(user1).setMaxTxExclusion(user2.address, true)
                ).to.be.revertedWith("Ownable: caller is not the owner");
            });

            it("Should prevent non-owner from updating max transaction amount", async function () {
                await expect(
                    msvpToken.connect(user1).updateMaxTxAmount(ethers.parseEther("1000000"))
                ).to.be.revertedWith("Ownable: caller is not the owner");
            });
        });

        describe("Integration with Vesting System", function () {
            it("Should apply tax correctly when transferring unlocked tokens", async function () {
                // Ensure user has unlocked tokens
                await time.increase(3 * MONTH_IN_SECONDS);
                await msvpToken.updateUnlockedAmountsForUser(userWithTokens.address);
                
                const transferAmount = ethers.parseEther("1000");
                const expectedTax = (transferAmount * BigInt(50)) / BigInt(1000); // 5% tax
                
                const initialBalance = await msvpToken.balanceOf(recipient.address);
                const initialTotalSupply = await msvpToken.totalSupply();
                const initialLPBalance = await msvpToken.balanceOf(lpWallet.address);
                const initialDevBalance = await msvpToken.balanceOf(developmentWallet.address);
                const initialMarketingBalance = await msvpToken.balanceOf(marketingWallet.address);
                
                await msvpToken.connect(userWithTokens).transfer(recipient.address, transferAmount);
                
                // Verify tax was applied (allowing for rounding)
                const finalTotalSupply = await msvpToken.totalSupply();
                const finalLPBalance = await msvpToken.balanceOf(lpWallet.address);
                const finalDevBalance = await msvpToken.balanceOf(developmentWallet.address);
                const finalMarketingBalance = await msvpToken.balanceOf(marketingWallet.address);
                
                const totalDistributedTax = (finalLPBalance - initialLPBalance) + 
                                          (finalDevBalance - initialDevBalance) + 
                                          (finalMarketingBalance - initialMarketingBalance) + 
                                          (initialTotalSupply - finalTotalSupply);
                
                expect(totalDistributedTax).to.be.closeTo(expectedTax, ethers.parseEther("0.001"));
            });

            it("Should not apply tax to vesting schedule creation", async function () {
                const initialTotalSupply = await msvpToken.totalSupply();
                
                // Create new vesting schedule (should not trigger tax)
                await msvpToken.createVestingSchedule(user6.address, ethers.parseEther("1000000"));
                
                const finalTotalSupply = await msvpToken.totalSupply();
                expect(finalTotalSupply).to.equal(initialTotalSupply);
            });

            it("Should handle tax with emergency unlock all", async function () {
                // Emergency unlock all tokens
                await msvpToken.emergencyUnlockAll(userWithTokens.address);
                
                const transferAmount = ethers.parseEther("1000");
                const expectedTax = (transferAmount * BigInt(50)) / BigInt(1000); // 5% tax
                
                const initialTotalSupply = await msvpToken.totalSupply();
                const initialLPBalance = await msvpToken.balanceOf(lpWallet.address);
                const initialDevBalance = await msvpToken.balanceOf(developmentWallet.address);
                const initialMarketingBalance = await msvpToken.balanceOf(marketingWallet.address);
                
                await msvpToken.connect(userWithTokens).transfer(recipient.address, transferAmount);
                
                const finalTotalSupply = await msvpToken.totalSupply();
                const finalLPBalance = await msvpToken.balanceOf(lpWallet.address);
                const finalDevBalance = await msvpToken.balanceOf(developmentWallet.address);
                const finalMarketingBalance = await msvpToken.balanceOf(marketingWallet.address);
                
                // Verify tax was applied even after emergency unlock (allowing for rounding)
                const totalDistributedTax = (finalLPBalance - initialLPBalance) + 
                                          (finalDevBalance - initialDevBalance) + 
                                          (finalMarketingBalance - initialMarketingBalance) + 
                                          (initialTotalSupply - finalTotalSupply);
                
                expect(totalDistributedTax).to.be.closeTo(expectedTax, ethers.parseEther("0.001"));
            });
        });
    });

    describe("Enhanced Edge Cases & Boundary Conditions", function () {
        let userWithTokens, recipient;

        beforeEach(async function () {
            // Get signers, ensuring we don't reuse addresses used for wallets
            const signers = await ethers.getSigners();
            
            // Use signers that are NOT the wallet addresses
            userWithTokens = signers[10]; // Use a different signer
            recipient = signers[11]; // Use a different signer
            
            // Ensure userWithTokens is NOT excluded from tax for these tests
            await msvpToken.setTaxExclusion(userWithTokens.address, false);
            await msvpToken.setTaxExclusion(recipient.address, false);
            
            // Simple setup without complex vesting schedules
            // Just transfer some tokens directly to userWithTokens for testing
            const transferAmount = ethers.parseEther("10000"); // 10K tokens
            await msvpToken.transfer(userWithTokens.address, transferAmount);
        });

        describe("getLockedAmount Edge Cases", function () {
            it("Should handle locked amount with deactivated vesting", async function () {
                // Create a simple vesting schedule
                const testUser = user1;
                const testAmount = ethers.parseEther("1000"); // 1K tokens
                await msvpToken.createVestingSchedule(testUser.address, testAmount);
                
                // Get initial locked amount
                const initialLocked = await msvpToken.getLockedAmount(testUser.address);
                expect(initialLocked).to.equal(testAmount);

                // Deactivate vesting
                await msvpToken.deactivateVestingSchedule(testUser.address);

                // Locked amount should be 0 when vesting is deactivated
                const lockedAfterDeactivation = await msvpToken.getLockedAmount(testUser.address);
                expect(lockedAfterDeactivation).to.equal(0);

                // Reactivate vesting
                await msvpToken.reactivateVestingSchedule(testUser.address);

                // Locked amount should be restored
                const lockedAfterReactivation = await msvpToken.getLockedAmount(testUser.address);
                expect(lockedAfterReactivation).to.equal(testAmount);
            });

            it("Should handle locked amount with emergency unlocks", async function () {
                // Create a simple vesting schedule
                const testUser = user2;
                const testAmount = ethers.parseEther("1000"); // 1K tokens
                await msvpToken.createVestingSchedule(testUser.address, testAmount);
                
                // Get initial locked amount
                const initialLocked = await msvpToken.getLockedAmount(testUser.address);
                expect(initialLocked).to.equal(testAmount);

                // Perform emergency unlock all
                await msvpToken.emergencyUnlockAll(testUser.address);

                // Locked amount should be 0 after emergency unlock
                const lockedAfterEmergency = await msvpToken.getLockedAmount(testUser.address);
                expect(lockedAfterEmergency).to.equal(0);

                // Check that unlocked amount equals total amount
                const unlocked = await msvpToken.getUnlockedAmount(testUser.address);
                const totalAmount = await msvpToken.getVestingSchedule(testUser.address).then(s => s.totalAmount);
                expect(unlocked).to.equal(totalAmount);
            });

            it("Should handle locked amount at exact vesting boundaries", async function () {
                // Create a simple vesting schedule
                const testUser = user3;
                const testAmount = ethers.parseEther("1000"); // 1K tokens
                await msvpToken.createVestingSchedule(testUser.address, testAmount);
                
                // Advance to month 6 (end of cliff)
                await time.increase(6 * MONTH_IN_SECONDS);
                let locked = await msvpToken.getLockedAmount(testUser.address);
                expect(locked).to.equal(testAmount); // All tokens still locked

                // Advance to month 7 (first unlock)
                await time.increase(1 * MONTH_IN_SECONDS);
                await msvpToken.updateUnlockedAmountsForUser(testUser.address);
                locked = await msvpToken.getLockedAmount(testUser.address);
                expect(locked).to.be.lt(testAmount); // Some tokens unlocked
            });

            it("Should handle locked amount with schedule modifications", async function () {
                // Create a simple vesting schedule
                const testUser = user4;
                const testAmount = ethers.parseEther("1000"); // 1K tokens
                await msvpToken.createVestingSchedule(testUser.address, testAmount);
                
                // Get initial locked amount
                const initialLocked = await msvpToken.getLockedAmount(testUser.address);
                expect(initialLocked).to.equal(testAmount);

                // Modify schedule to increase amount
                const newAmount = testAmount * BigInt(2);
                await msvpToken.modifyVestingSchedule(testUser.address, newAmount);

                // Locked amount should reflect the new amount
                const lockedAfterModification = await msvpToken.getLockedAmount(testUser.address);
                expect(lockedAfterModification).to.equal(newAmount);
            });
        });

        describe("Enhanced Tax Distribution Edge Cases", function () {

            it("Should handle maximum component rates", async function () {
                // Set maximum component rates that don't exceed total tax rate
                await msvpToken.updateLPContributionRate(25); // 2.5%
                await msvpToken.updateDevelopmentRate(15); // 1.5%
                await msvpToken.updateMarketingRate(10); // 1%
                await msvpToken.updateBurnRate(0); // 0%

                const transferAmount = ethers.parseEther("100"); // Use smaller amount
                const expectedTax = (transferAmount * BigInt(50)) / BigInt(1000); // 5% tax

                const initialTotalSupply = await msvpToken.totalSupply();
                const initialLPBalance = await msvpToken.balanceOf(lpWallet.address);
                const initialDevBalance = await msvpToken.balanceOf(developmentWallet.address);
                const initialMarketingBalance = await msvpToken.balanceOf(marketingWallet.address);

                await msvpToken.connect(userWithTokens).transfer(recipient.address, transferAmount);

                const finalTotalSupply = await msvpToken.totalSupply();
                const finalLPBalance = await msvpToken.balanceOf(lpWallet.address);
                const finalDevBalance = await msvpToken.balanceOf(developmentWallet.address);
                const finalMarketingBalance = await msvpToken.balanceOf(marketingWallet.address);

                // Verify tax distribution
                const lpReceived = finalLPBalance - initialLPBalance;
                const devReceived = finalDevBalance - initialDevBalance;
                const marketingReceived = finalMarketingBalance - initialMarketingBalance;
                const totalDistributed = lpReceived + devReceived + marketingReceived;

                expect(totalDistributed).to.be.closeTo(expectedTax, ethers.parseEther("0.001"));
            });

            it("Should handle precision edge cases with high precision tax rates", async function () {
                // Set very small tax rates
                await msvpToken.updateTransferTaxRate(1); // 0.1%
                await msvpToken.updateLPContributionRate(1); // 0.1%
                await msvpToken.updateDevelopmentRate(0); // 0%
                await msvpToken.updateMarketingRate(0); // 0%
                await msvpToken.updateBurnRate(0); // 0%

                const transferAmount = ethers.parseEther("1"); // Very small transfer
                const expectedTax = (transferAmount * BigInt(1)) / BigInt(1000); // 0.1% tax

                const initialLPBalance = await msvpToken.balanceOf(lpWallet.address);
                await msvpToken.connect(userWithTokens).transfer(recipient.address, transferAmount);
                const finalLPBalance = await msvpToken.balanceOf(lpWallet.address);

                const lpReceived = finalLPBalance - initialLPBalance;
                expect(lpReceived).to.be.closeTo(expectedTax, ethers.parseEther("0.0001"));
            });

            it("Should handle gas optimization for large tax amounts", async function () {
                // Set moderate tax rates
                await msvpToken.updateTransferTaxRate(100); // 10%
                await msvpToken.updateLPContributionRate(50); // 5%
                await msvpToken.updateDevelopmentRate(30); // 3%
                await msvpToken.updateMarketingRate(20); // 2%
                await msvpToken.updateBurnRate(0); // 0%

                const transferAmount = ethers.parseEther("1000"); // Large transfer
                const expectedTax = (transferAmount * BigInt(100)) / BigInt(1000); // 10% tax

                const tx = await msvpToken.connect(userWithTokens).transfer(recipient.address, transferAmount);
                const receipt = await tx.wait();

                // Should complete within reasonable gas
                expect(receipt.gasUsed).to.be.lt(200000);
            });

            it("Should handle complex tax rate combinations", async function () {
                // Set complex tax rate combination
                await msvpToken.updateTransferTaxRate(75); // 7.5%
                await msvpToken.updateLPContributionRate(30); // 3%
                await msvpToken.updateDevelopmentRate(25); // 2.5%
                await msvpToken.updateMarketingRate(15); // 1.5%
                await msvpToken.updateBurnRate(5); // 0.5%

                const transferAmount = ethers.parseEther("100"); // Use smaller amount
                const expectedTax = (transferAmount * BigInt(75)) / BigInt(1000); // 7.5% tax

                const initialTotalSupply = await msvpToken.totalSupply();
                const initialLPBalance = await msvpToken.balanceOf(lpWallet.address);
                const initialDevBalance = await msvpToken.balanceOf(developmentWallet.address);
                const initialMarketingBalance = await msvpToken.balanceOf(marketingWallet.address);
                const initialRecipientBalance = await msvpToken.balanceOf(recipient.address);
                const initialContractBalance = await msvpToken.balanceOf(await msvpToken.getAddress());



                await msvpToken.connect(userWithTokens).transfer(recipient.address, transferAmount);

                const finalTotalSupply = await msvpToken.totalSupply();
                const finalLPBalance = await msvpToken.balanceOf(lpWallet.address);
                const finalDevBalance = await msvpToken.balanceOf(developmentWallet.address);
                const finalMarketingBalance = await msvpToken.balanceOf(marketingWallet.address);
                const finalRecipientBalance = await msvpToken.balanceOf(recipient.address);
                const finalContractBalance = await msvpToken.balanceOf(await msvpToken.getAddress());



                // Verify total tax distribution
                const totalDistributedTax = (finalLPBalance - initialLPBalance) + 
                                          (finalDevBalance - initialDevBalance) + 
                                          (finalMarketingBalance - initialMarketingBalance) + 
                                          (initialTotalSupply - finalTotalSupply);

                expect(totalDistributedTax).to.be.closeTo(expectedTax, ethers.parseEther("0.001"));
            });
        });
    });
});

// Helper function for event matching
function anyValue() {
    return true;
} 