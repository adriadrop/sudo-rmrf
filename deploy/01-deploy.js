const { network } = require("hardhat");
const { networkConfig, developmentChains } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");
const fs = require("fs");

const FUND_AMOUNT = "1000000000000000000000";

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;
    let vrfCoordinatorV2Address, subscriptionId;

    // Get SVG base to pass to constructor
    const svg = fs.readFileSync("./svg/sudoswap.svg", { encoding: "utf8" });
    // Cut SVG tag from the end
    const svgBaseSliced = svg.slice(0, -7);
    const svgPowerBar =
        '<rect width="1" height="2" x="42" y="2.5" style="fill:rgb(235,235,235);"/><rect width="1" height="2" x="61" y="2.5" style="fill:rgb(235,235,235);"/><rect width="18" height="1" x="43" y="1.5" style="fill:rgb(235,235,235);" /><rect width="18" height="1" x="43" y="2.5" style="fill:rgb(106,198,177);" /><rect width="18" height="1" x="43" y="3.5" style="fill:rgb(97,185,165);" /><rect width="18" height="1" x="43" y="4.5" style="fill:rgb(235,235,235);" />';

    if (chainId == 31337) {
        // create VRFV2 Subscription
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
        const transactionResponse = await vrfCoordinatorV2Mock.createSubscription();
        const transactionReceipt = await transactionResponse.wait();
        subscriptionId = transactionReceipt.events[0].args.subId;
        // Fund the subscription
        // Our mock makes it so we don't actually have to worry about sending fund
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT);
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2;
        subscriptionId = networkConfig[chainId].subscriptionId;
    }

    log("----------------------------------------------------");

    arguments = [
        svgBaseSliced,
        svgPowerBar,
        vrfCoordinatorV2Address,
        subscriptionId,
        networkConfig[chainId]["gasLane"],
        networkConfig[chainId]["callbackGasLimit"],
    ];
    const sudo = await deploy("Sudo", {
        from: deployer,
        args: arguments,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    });

    // Verify the deployment
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...");
        await verify(randomIpfsNft.address, arguments);
    }
};

module.exports.tags = ["all", "main"];
