const { assert, expect } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const { developmentChains, networkConfig } = require("../helper-hardhat-config");

developmentChains.includes(network.name)
    ? describe.skip
    : describe("sudoBasic", function () {
          let sudo, deployer;

          beforeEach(async () => {
              await deployments.fixture(["all"]);
              accounts = await ethers.getSigners();
              deployer = accounts[0];
              sudo = await ethers.getContract("Sudo", deployer);
          });
          // Code for testing

          describe("basic", function () {
              it("can mint all supply", async () => {
                  // enter the raffle
                  const minted = await sudo.mint();
                  const supply = await sudo.totalSupply();
                  const deployerSupply = await sudo.balanceOf(deployer);
                  assert.equal(supply, deployerSupply);
              });
          });
      });
