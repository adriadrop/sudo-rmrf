const { network } = require("hardhat");
const { networkConfig, developmentChains, VERIFICATION_BLOCK_CONFIRMATIONS } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");
const fs = require("fs");

const FUND_AMOUNT = "1000000000000000000000";

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;
    let vrfCoordinatorV2Address, subscriptionId;

    // Get SVG base to pass to constructor
    const svg = fs.readFileSync("./svg/pizza.svg", { encoding: "utf8" });
    // Cut SVG tag from the end
    const svgBaseSliced = svg.slice(0, -7);
    const waitBlockConfirmations = developmentChains.includes(network.name) ? 1 : VERIFICATION_BLOCK_CONFIRMATIONS;

    log("----------------------------------------------------");

    arguments = [svgBaseSliced];

    const sudo = await deploy("SudoPlain", {
        from: deployer,
        args: arguments,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    });

    // Verify the deployment
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...");
        await verify(sudo.address, arguments);
    }
};

module.exports.tags = ["all", "main", "plain"];
