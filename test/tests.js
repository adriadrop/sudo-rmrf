const { assert, expect } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const { developmentChains, networkConfig } = require("../helper-hardhat-config");

describe("sudoBasic", function () {
    let sudo, deployer;

    beforeEach(async () => {
        accounts = await ethers.getSigners();
        deployer = accounts[0];
        await deployments.fixture(["main"]);
        sudo = await ethers.getContract("Sudo", deployer);
        //console.log(sudo);
    });

    describe("basic", function () {
        it("can mint all supply", async () => {
            // enter the raffle
            const minted = await sudo.mint();
            const supply = await sudo.totalSupply();
            console.log(supply.toNumber());
            const deployerSupply = await sudo.balanceOf(deployer.address);
            console.log(deployer.address);
            assert.equal(supply.toNumber(), deployerSupply.toNumber());
        });

        it("dummy", async () => {
            const testCheck = "test";
            assert.equal("test", testCheck);
        });
    });
});
