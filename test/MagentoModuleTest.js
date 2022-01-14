const path = require('path');
const MagentoModule = require(path.join(__dirname, 'libs', 'MagentoModule.js'));
const Commons = require(path.join(__dirname, 'libs', 'MagentoCommons.js'));
const assert = require('assert');

const magentoModuleName = 'Module_Package';
const moduleMetaData = Commons.magentoModuleMeta(__dirname, magentoModuleName);
console.log(moduleMetaData)
const magentoModule = new MagentoModule(moduleMetaData);
magentoModule.initMagentoModule();
console.log(magentoModule.moduleXml);
console.log(magentoModule.composerJson);
console.log(magentoModule.registration);