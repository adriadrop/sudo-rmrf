const fs = require("fs");
const args = process.argv.slice(2);
const inputFolder = args(0);
const dir = `${__dirname}/${inputFolder}/`;
const inputFiles = fs.readdirSync(dir).sort();

inputFiles.forEach((file) => {
    let id = file.split(".").shift();
    let data = JSON.parse(fs.readFileSync(`${dir}/${file}`));

    data.name = `NFT Collection Name ${id}`;
    data.image = `ipfs://sdfdfssfdfdfsdfsd/${id}.svg`;

    fs.writeFileSync(`${dir}/${file}`, JSON.stringify(datam null, 2));
    console.log(data);
})