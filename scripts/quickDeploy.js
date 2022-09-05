const hre = require("hardhat");
const fs = require("fs");

function saveSVG(tokenid, data) {
    const svgDir = __dirname + "/../mints";

    //do something with res here
    uri = data.split(",")[1];

    // Parse to JSON
    const json_uri = Buffer.from(uri, "base64").toString("utf-8");
    image = JSON.parse(json_uri)["image"];

    // Parse to SVG
    image = image.split(",")[1];
    const image_svg = Buffer.from(image, "base64").toString("utf-8");

    // console.log(json_uri);

    if (!fs.existsSync(svgDir)) {
        fs.mkdirSync(svgDir);
    }

    fs.writeFileSync(svgDir + "/" + tokenid + ".svg", image_svg);
}

async function main() {
    // Use SVG images from https://codepen.io/shshaw/pen/XbxvNj
    // Check other methods for importing images into SVG http://jsfiddle.net/MxHPq/
    // SVG optimizooor https://jakearchibald.github.io/svgomg/
    const svg = fs.readFileSync("./svg/sudoswap.svg", { encoding: "utf8" });

    const Sudo = await hre.ethers.getContractFactory("Sudo");
    const sudo = await Sudo.deploy(svg);

    await sudo.deployed();
    console.log(`Sudo deployed to ${sudo.address}`);

    // Mint all at once per erc721a
    await sudo.mint();

    // put mints into folder for testing
    for (let i = 1; i < 5; i++) {
        await sudo.getVRF(i);
        await sudo.tokenURI(i).then((res) => saveSVG(i, res));
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
