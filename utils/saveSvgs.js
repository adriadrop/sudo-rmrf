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

module.exports = { saveSVG };
