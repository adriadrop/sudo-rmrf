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
        sudoPlain = await ethers.getContract("SudoPlain", deployer);
        //console.log(sudo);
    });

    describe("regular sudo", function () {
        it("can mint all supply", async () => {
            const minted = await sudo.mint();
            const supply = await sudo.totalSupply();
            console.log(supply.toNumber());
            const deployerSupply = await sudo.balanceOf(deployer.address);
            assert.equal(supply.toNumber(), deployerSupply.toNumber());
        });
    });

    describe("plain sudo", function () {
        it("can mint all supply", async () => {
            // const minted = await sudoPlain.mint();
            const supply = await sudoPlain.totalSupply();
            console.log(supply.toNumber());
            const deployerSupply = await sudoPlain.balanceOf(deployer.address);
            assert.equal(supply.toNumber(), deployerSupply.toNumber());
        });
    });
});
