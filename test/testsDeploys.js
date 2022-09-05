const { assert, expect } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const { developmentChains, networkConfig } = require("../helper-hardhat-config");
const fs = require("fs");

describe("sudoBasic", function () {
    let sudo, deployer;
    let tokenDefaultIpfs = "https://ipfs.io/ipfs/Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu";

    beforeEach(async () => {
        accounts = await ethers.getSigners();
        deployer = accounts[0];
        await deployments.fixture(["main"]);
        sudo = await ethers.getContract("Sudo", deployer);
    });

    describe("Test sudo", function () {
        it("can mint all supply", async () => {
            //    const minted = await sudo.mint();
            const supply = await sudo.totalSupply();
            const deployerSupply = await sudo.balanceOf(deployer.address);
            assert.equal(supply.toNumber(), deployerSupply.toNumber());
        });
    });

    describe("Test sudo", function () {
        it("check url of token, phase 1", async () => {
            //     const minted = await sudo.mint();
            const tokenURI = await sudo.tokenURI(1);
            console.log(tokenURI);
            assert.equal(tokenURI, tokenDefaultIpfs);
        });
    });

    describe("Test sudo", function () {
        it("check url of token, phase 2", async () => {
            // const minted = await sudo.mint();

            const svg = fs.readFileSync("./svg/sudoswap.svg", { encoding: "utf8" });
            const svgBaseSliced = svg.slice(0, -4670);
            await sudo.setPhase(1);
            await sudo.setDefaultImage(svgBaseSliced);
            const tokenURI = await sudo.tokenURI(1);
            console.log(tokenURI);
            //  assert.equal(tokenURI, tokenDefaultIpfs);
        });
    });


});
