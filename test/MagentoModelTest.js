const path = require('path');
const Commons = require(path.join(__dirname, 'libs', 'MagentoCommons.js'));
const MagentoModel = require(path.join(__dirname, 'libs', 'MagentoModel.js'));

const magentoModuleName = 'Module_Package';
const magentoModuleMeta = Commons.magentoModuleMeta(__dirname, magentoModuleName);
const magentoModel = new MagentoModel(magentoModuleMeta, 'rantion_banner');

console.log(magentoModel.tableMeta);
console.log(magentoModel.model);
console.log(magentoModel.modelFactory);
console.log(magentoModel.collection);
console.log(magentoModel.collectionFactory);
console.log(magentoModel.repository);
console.log(magentoModel.dataProvider);
console.log(magentoModel.primaryKey);

magentoModel.buildModel();
