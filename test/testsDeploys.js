const { assert, expect } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const { developmentChains, networkConfig } = require("../helper-hardhat-config");
const fs = require("fs");
const { saveSVG } = require("../utils/saveSvgs");


describe("sudoBasic", function () {
    let sudo, deployer;
    const chainId = network.config.chainId;
    const defaultIpfs = "ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu";
    const jsonFolder = "ipfs://QmPmTRw7jove6wcXRCK7XXpmomVqX1FiB2zC5eV4wrtLJd/";
    const svg = fs.readFileSync("./svgs/sudoswap.svg", { encoding: "utf8" });

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
            assert.equal(tokenURI, defaultIpfs);
        });
    });

    describe("Test sudo", function () {
        it("check svgs of token, phase 2", async () => {
            const tokenId = 1;
            // Split image in 2 trx as it is too big
            const svg1 = svg.slice(0, svg.length / 2);
            const svg2 = svg.slice(svg.length / 2, svg.length);
            await sudo.setPhase(1);
            await sudo.setDefaultImage(svg1);
            await sudo.setDefaultImage(svg2);
            const tokenURI = await sudo.tokenURI(tokenId).then((res) => saveSVG(tokenId, res));
            const svgCheck = fs.readFileSync("./mints/" + tokenId + ".svg", { encoding: "utf8" });

            assert.equal(svg, svgCheck);
        });
    });

    // Phase 3 and 4 need VRF, we will get VRF for token 1 in mint deployment
    describe("Test sudo", function () {
        it("check ipfs values of token, phase 3", async () => {
            const tokenId = 1;
            await sudo.setPhase(2);
            await sudo.setIpfs(jsonFolder);

            // Watch out not to confuse tokenID with VRF value, tokenID has VRF value 6
            const tokenURI = await sudo.tokenURI(tokenId);
            assert.equal(tokenURI, `${jsonFolder}6.json`);

        });
    });

    describe("Test sudo", function () {
        it("check svgs of token, phase 4", async () => {
            const tokenId = 1;
            const random = 6;
            // Split image in 2 trx as it is too big
            const svg1 = svg.slice(0, svg.length / 2);
            const svg2 = svg.slice(svg.length / 2, svg.length);
            await sudo.setPhase(3);
            await sudo.setImages(svg1, random);
            await sudo.setImages(svg2, random);

            // Extract SVG from tokenURI and then check against the same original SVG repo from where it was uploaded 
            const tokenURI = await sudo.tokenURI(tokenId).then((res) => saveSVG(tokenId, res));
            const svgCheck = fs.readFileSync("./mints/" + tokenId + ".svg", { encoding: "utf8" });
            assert.equal(svg, svgCheck);
        });
    });

    describe("Test sudo", function () {
        it("check svgs of token, phase 4, but some higher number", async () => {
            const tokenId = 100;

            // Get new random number
            const vrfTx = await sudo.getVRF(tokenId);
            const vrfTxReceipt = await vrfTx.wait(1);

            // Need to listen for response
            await new Promise(async (resolve, reject) => {
                setTimeout(() => reject("Timeout: 'NFTMinted' event did not fire"), 300000); // 5 minute timeout time
                // setup listener for our event
                sudo.once("RandomReceived", async (res) => {
                    console.log(res)
                    resolve();
                });
                if (chainId == 31337) {
                    const requestId = vrfTxReceipt.events[1].args.requestId.toString();
                    const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer);
                    await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, sudo.address);
                }
            });

            const random = 10;  //TODO get random from event
            // Split image in 2 trx as it is too big, could use non default SVG but doesn't matter
            const svg1 = svg.slice(0, svg.length / 2);
            const svg2 = svg.slice(svg.length / 2, svg.length);
            await sudo.setPhase(3);
            await sudo.setImages(svg1, random);
            await sudo.setImages(svg2, random);

            // Extract SVG from tokenURI and then check against the same original SVG repo from where it was uploaded 
            const tokenURI = await sudo.tokenURI(tokenId).then((res) => saveSVG(tokenId, res));
            const svgCheck = fs.readFileSync("./mints/" + tokenId + ".svg", { encoding: "utf8" });
            assert.equal(svg, svgCheck);
        });
    });




});
