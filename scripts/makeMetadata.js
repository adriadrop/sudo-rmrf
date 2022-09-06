const fs = require("fs");
const path = require('path');

// Make metadata for each image we have
const inputFolder = "../svgs";
const outputFolder = "../jsons";
const dirInput = `${__dirname}/${inputFolder}/`;
const dirOutput = `${__dirname}/${outputFolder}/`;
const inputFiles = fs.readdirSync(dirInput).sort();
const ipfsRoot = "ipfs://QmZRTUqyfQoaT7xYbFmWjcNjA9aCnEDx5UjEQpKx59RTQQ/";

// Clear all directory for new files
fs.readdirSync(dirOutput, (err, files) => {
    if (err) throw err;

    for (const file of files) {
        fs.unlink(path.join(dirOutput, file), err => {
            if (err) throw err;
        });
    }
});

// Loop images we have so we create JSON for each image
inputFiles.forEach((file) => {
    let id = file.split(".").shift();
    let data = {};

    data.name = `SudoSwap attack no.${id}`;
    data.description = "SudoSwap taking over OpenSea";
    data.image = ipfsRoot + `${id}.svg`;
    data.attributes = { "trait_type": "status", "value": "randomized" };

    fs.writeFileSync(`${dirOutput}/${id}.json`, JSON.stringify(data, null, 2));

})
console.log("JSONS created");