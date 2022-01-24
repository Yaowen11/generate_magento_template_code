const fs = require('fs');
const MagentoCommons = require("./libs/MagentoCommons");
const path = require("path");

const file = 'cod.dot';

// fs.stat(file, (err, stat) => {
//     if (err) {
//         console.log(err);
//         throw err;
//     } else {
//         console.log(stat);
//     }
// })

// fs.access(file, (err, access) => {
//     if (err) {
//         throw err;
//     } else {
//         console.log(access)
//     }
// })

// function initPromise(initFile, content) {
//     return fs.promises.readFile(initFile, {encoding: "utf8"}).then(data => {
//         return Promise.resolve(data);
//     }).catch((err) => {
//         fs.promises.writeFile(initFile, 'hello world').then(initPromise(initFile, content))
//     })
// }
//
// const initFile = 'init.txt';
// const content = 'init content\r\n';
//
// initPromise(initFile, content).then(console.log).catch((err) => {throw  err})


const xmlParser = MagentoCommons.getXmlParser();
const listXml = path.join(__dirname, 'app', 'code', 'Module', 'Package', 'list.xml');
const listJson = xmlParser.parse(fs.readFileSync(listXml, 'utf8'));
fs.writeFileSync('list.json', JSON.stringify(listJson, null, 4));
const formXml = path.join(__dirname, 'app', 'code', 'Module', 'Package', 'form.xml');
const formJson = xmlParser.parse(fs.readFileSync(listXml, 'utf8'));
fs.writeFileSync('form.json', JSON.stringify(formJson, null, 4));

