const fs = require('fs');
const MagentoCommons = require("./libs/MagentoCommons");
const path = require("path");
const xmlParser = MagentoCommons.getXmlParser();
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


// const listXml = path.join(__dirname, 'app', 'code', 'Module', 'Package', 'list.xml');
// const listJson = xmlParser.parse(fs.readFileSync(listXml, 'utf8'));
// fs.writeFileSync('list.json', JSON.stringify(listJson, null, 4));
// const formXml = path.join(__dirname, 'app', 'code', 'Module', 'Package', 'form.xml');
// const formJson = xmlParser.parse(fs.readFileSync(formXml, 'utf8'));
// fs.writeFileSync('form.json', JSON.stringify(formJson, null, 4));

// fs.writeFileSync(
//     'table.json',
//     JSON.stringify(
//         xmlParser.parse(
//             fs.readFileSync(path.join(__dirname, 'app', 'code', 'Module', 'Package', 'etc', 'db_schema.xml'))
//         )
//         , null, 4
//     )
// );

const tableXml = `<table name="home_banner" resource="default" engine="innodb" comment="">
    <column xsi:type="int" name="id" unsigned="true" nullable="false" identity="true"/>
    <column xsi:type="varchar" name="title" nullable="false" length="255"/>
    <column xsi:type="varchar" name="image_url" nullable="false" length="255"/>
    <column xsi:type="varchar" name="video_url" nullable="false" length="255"/>
    <column xsi:type="text" name="content" nullable="true"/>
    <column xsi:type="tinyint" name="state" unsigned="true" nullable="false" default="1" comment="0:disable,1:enable"/>
    <column xsi:type="tinyint" name="type" unsigned="true" nullable="false" default="0" comment="0:pc,1:mobile"/>
    <column xsi:type="datetime" name="start" nullable="false"/>
    <column xsi:type="datetime" name="end" nullable="false"/>
    <column xsi:type="timestamp" name="created_at" nullable="false" on_update="false" default="CURRENT_TIMESTAMP"/>
    <column xsi:type="timestamp" name="updated_at" nullable="false" on_update="true" default="CURRENT_TIMESTAMP"/>
    <constraint xsi:type="primary" referenceId="PRIMARY">
      <column name="id"/>
    </constraint>
  </table>`
const tableDefine = xmlParser.parse(tableXml);
console.log(JSON.stringify(tableDefine))