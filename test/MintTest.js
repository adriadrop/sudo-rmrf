const { assert, expect } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const { developmentChains, networkConfig } = require("../../helper-hardhat-config");

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Sudo Staging Tests", function () {
          let sudo, deployer;

          beforeEach(async () => {
              accounts = await ethers.getSigners();
              deployer = accounts[0];
              sudo = await ethers.getContract("Sudo", deployer);
          });
          // Code for testing

          describe("Basic Mint", function () {
              it("can mint all supply", async () => {
                  // enter the raffle
                  const minted = await sudo.mint();
              });
          });
      });
