const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MSVP Role-Based Access Control", function () {
    let msvpToken;
    let owner;
    let subadmin;
    let user1;
    let user2;
    let lpWallet;
    let marketingWallet;
    let developmentWallet;

    beforeEach(async function () {
        [owner, subadmin, user1, user2, lpWallet, marketingWallet, developmentWallet] = await ethers.getSigners();

        const MSVP = await ethers.getContractFactory("MSVP");
        msvpToken = await MSVP.deploy(lpWallet.address, marketingWallet.address, developmentWallet.address);
        await msvpToken.waitForDeployment();
    });

    describe("Initial Role Setup", function () {
        it("Should grant SUBADMIN_ROLE to owner", async function () {
            const SUBADMIN_ROLE = await msvpToken.SUBADMIN_ROLE();
            expect(await msvpToken.hasRole(SUBADMIN_ROLE, owner.address)).to.be.true;
        });

        it("Should not grant SUBADMIN_ROLE to other users initially", async function () {
            const SUBADMIN_ROLE = await msvpToken.SUBADMIN_ROLE();
            expect(await msvpToken.hasRole(SUBADMIN_ROLE, subadmin.address)).to.be.false;
        });
    });

    describe("Role Management", function () {
        it("Should allow owner to grant SUBADMIN_ROLE", async function () {
            const SUBADMIN_ROLE = await msvpToken.SUBADMIN_ROLE();
            await msvpToken.grantSubadminRole(subadmin.address);
            expect(await msvpToken.hasRole(SUBADMIN_ROLE, subadmin.address)).to.be.true;
        });

        it("Should allow owner to revoke SUBADMIN_ROLE", async function () {
            const SUBADMIN_ROLE = await msvpToken.SUBADMIN_ROLE();
            await msvpToken.grantSubadminRole(subadmin.address);
            await msvpToken.revokeSubadminRole(subadmin.address);
            expect(await msvpToken.hasRole(SUBADMIN_ROLE, subadmin.address)).to.be.false;
        });

        it("Should prevent non-owner from granting SUBADMIN_ROLE", async function () {
            await expect(
                msvpToken.connect(subadmin).grantSubadminRole(user1.address)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should prevent non-owner from revoking SUBADMIN_ROLE", async function () {
            await expect(
                msvpToken.connect(subadmin).revokeSubadminRole(user1.address)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Vesting Function Access", function () {
        beforeEach(async function () {
            // Grant subadmin role to subadmin
            await msvpToken.grantSubadminRole(subadmin.address);
            
            // Transfer some tokens to subadmin for testing
            const testAmount = ethers.parseEther("10000000");
            await msvpToken.transfer(subadmin.address, testAmount);
        });

        it("Should allow owner to create vesting schedule", async function () {
            const testAmount = ethers.parseEther("1000000");
            await expect(
                msvpToken.createVestingSchedule(user1.address, testAmount)
            ).to.not.be.reverted;
        });

        it("Should allow subadmin to create vesting schedule", async function () {
            const testAmount = ethers.parseEther("1000000");
            await expect(
                msvpToken.connect(subadmin).createVestingSchedule(user1.address, testAmount)
            ).to.not.be.reverted;
        });

        it("Should prevent regular user from creating vesting schedule", async function () {
            const testAmount = ethers.parseEther("1000000");
            await expect(
                msvpToken.connect(user1).createVestingSchedule(user2.address, testAmount)
            ).to.be.reverted;
        });

        it("Should allow owner to create bulk vesting schedules", async function () {
            const users = [user1.address, user2.address];
            const amounts = [ethers.parseEther("1000000"), ethers.parseEther("2000000")];
            await expect(
                msvpToken.createVestingSchedules(users, amounts)
            ).to.not.be.reverted;
        });

        it("Should allow subadmin to create bulk vesting schedules", async function () {
            const users = [user1.address, user2.address];
            const amounts = [ethers.parseEther("1000000"), ethers.parseEther("2000000")];
            await expect(
                msvpToken.connect(subadmin).createVestingSchedules(users, amounts)
            ).to.not.be.reverted;
        });

        it("Should prevent regular user from creating bulk vesting schedules", async function () {
            const users = [user1.address, user2.address];
            const amounts = [ethers.parseEther("1000000"), ethers.parseEther("2000000")];
            await expect(
                msvpToken.connect(user1).createVestingSchedules(users, amounts)
            ).to.be.reverted;
        });
    });

    describe("Role Checking Functions", function () {
        it("Should correctly identify subadmin role", async function () {
            await msvpToken.grantSubadminRole(subadmin.address);
            expect(await msvpToken.hasSubadminRole(subadmin.address)).to.be.true;
            expect(await msvpToken.hasSubadminRole(user1.address)).to.be.false;
        });

        it("Should return empty array for getSubadmins", async function () {
            const subadmins = await msvpToken.getSubadmins();
            expect(subadmins).to.be.an('array').that.is.empty;
        });
    });

    describe("Integration with Existing Functions", function () {
        it("Should maintain owner access to all functions", async function () {
            // Test that owner can still call all functions
            const testAmount = ethers.parseEther("1000000");
            
            // Vesting functions
            await expect(
                msvpToken.createVestingSchedule(user1.address, testAmount)
            ).to.not.be.reverted;
            
            // Tax functions
            await expect(
                msvpToken.updateTransferTaxRate(100)
            ).to.not.be.reverted;
            
            // Emergency functions
            await expect(
                msvpToken.pause()
            ).to.not.be.reverted;
        });
    });
}); 