const { assert, expect } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const { developmentChains, networkConfig } = require("../helper-hardhat-config");
const fs = require("fs");
const { saveSVG } = require("../utils/saveSvgs");


describe("sudoBasic", function () {
    let sudo, deployer;
    const tokenDefaultIpfs = "https://ipfs.io/ipfs/Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu";
    const svg = fs.readFileSync("./svg/sudoswap.svg", { encoding: "utf8" });

    beforeEach(async () => {
        accounts = await ethers.getSigners();
        deployer = accounts[0];
        await deployments.fixture(["all"]);
        sudo = await ethers.getContract("Sudo", deployer);
    });

    describe("Test sudo", function () {
        it("can mint all supply", async () => {
            const supply = await sudo.totalSupply();
            const deployerSupply = await sudo.balanceOf(deployer.address);
            assert.equal(supply.toNumber(), deployerSupply.toNumber());
        });
    });

    describe("Test sudo", function () {
        it("check url of token, phase 1", async () => {
            const tokenURI = await sudo.tokenURI(1);
            console.log(tokenURI);
            assert.equal(tokenURI, tokenDefaultIpfs);
        });
    });

    describe("Test sudo", function () {
        it("check url of token, phase 2", async () => {
            const tokenId = 1;
            // Split image in 2 trx as it is too big
            const svg1 = svg.slice(0, svg.length / 2);
            const svg2 = svg.slice(svg.length / 2, svg.length);
            await sudo.setPhase(1);
            await sudo.setDefaultImage(svg1);
            await sudo.setDefaultImage(svg2);
            const tokenURI = await sudo.tokenURI(tokenId).then((res) => saveSVG(1, res));
            const svgCheck = fs.readFileSync("./mints/" + tokenId + ".svg", { encoding: "utf8" });

            assert.equal(svg, svgCheck);
        });
    });


});
