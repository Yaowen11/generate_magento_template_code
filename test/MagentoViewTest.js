const path = require('path')
const Commons = require(path.join(__dirname, 'libs', 'MagentoCommons.js'));
const MagentoView = require(path.join(__dirname, 'libs', 'MagentoView.js'));

const moduleMeta = Commons.magentoModuleMeta(__dirname, 'Module_Package');
const backendUrlMeta = Commons.magentoBackendUrlMeta('rantion/banner');
const tableName = 'rantion_banner';
const magentoView = new MagentoView(moduleMeta, backendUrlMeta, tableName);

magentoView.buildBackendView();