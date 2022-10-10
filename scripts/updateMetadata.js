const fs = require("fs");
const args = process.argv.slice(2);
console.log(args);
const inputFolder = args[0];
const dir = `${__dirname}/${inputFolder}/`;
const inputFiles = fs.readdirSync(dir).sort();

function printProgress(progress) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(progress + " updated");
  }

inputFiles.forEach((file) => {
    let id = file.split(".").shift();
    let data = JSON.parse(fs.readFileSync(`${dir}/${file}`));

    data.name = `Sudo #${id}`;
    data.image = `ipfs://QmfGJn1AT4eyityK8pBfH9LkjXiC84abmb784Nk6TnZQmD/${id}`;

    printProgress(id);

    fs.writeFileSync(`${dir}/${file}`, JSON.stringify(data, null, 2));
})
