const { network, ethers } = require("hardhat");
const { saveSVG } = require("../utils/saveSvgs");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    const sudo = await ethers.getContract("Sudo", deployer);
    const mintAll = await sudo.mint();

    let tokenId = 0;
    const powerUptTx = await sudo.powerUp(tokenId);
    const powerUptTxTxReceipt = await powerUptTx.wait(1);

    // Need to listen for response
    await new Promise(async (resolve, reject) => {
        setTimeout(() => reject("Timeout: 'NFTMinted' event did not fire"), 300000); // 5 minute timeout time
        // setup listener for our event
        sudo.once("RandomReceived", async () => {
            resolve();
        });
        if (chainId == 31337) {
            const requestId = powerUptTxTxReceipt.events[1].args.requestId.toString();
            const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer);
            await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, sudo.address);
        }
    });

    await sudo.tokenURI(tokenId).then((res) => saveSVG(tokenId, res));

    // console.log(`NFT index 0 tokenURI: ${await sudo.tokenURI(0)}`);
};
module.exports.tags = ["all", "mint"];
