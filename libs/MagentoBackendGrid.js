const MagentoCommons = require('./MagentoCommons');
const MagentoConfigXml = require('./MagentoConfigXml');
const MagentoBackendController = require('./MagentoBackendController');
const MagentoModel = require('./MagentoModel');
const MagentoModule = require('./MagentoModule');
const MagentoView = require('./MagentoView');

class MagentoBackendGrid {
    constructor(modulePackageName, gridUrl, tableDefine) {
        this.moduleMeta = MagentoCommons.magentoModuleMeta(__dirname, modulePackageName);
        this.gridUrlMeta = MagentoCommons.magentoBackendUrlMeta(gridUrl);
        try {
            this.tableMeta = JSON.parse(tableDefine);
        } catch (err) {
            this.tableMeta = MagentoCommons.magentoSchemaXmlTableMeta(tableDefine)
        }
    }

    generateModuleGridZipFile() {
        const magentoModel = new MagentoModel(this.moduleMeta, )
    }
}

module.exports = MagentoBackendGrid;
