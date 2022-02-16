const MagentoCommons = require('./MagentoCommons');
const MagentoConfigXml = require('./MagentoConfigXml');
const MagentoBackendController = require('./MagentoController');
const MagentoModel = require('./MagentoModel');
const MagentoView = require('./MagentoView');
const MagentoModule = require('./MagentoModule');
const MagentoFrontTableQuery = require('./MagentoFrontTableQuery');
const tar = require("tar");

class MagentoBackendGrid {

    #moduleMeta;

    #gridUrlMeta;

    #tableMeta;

    #modelMeta;

    constructor(moduleMeta, gridUrlMeta, tableDefine) {
        this.#moduleMeta = moduleMeta
        this.#gridUrlMeta = gridUrlMeta;
        try {
            this.#tableMeta = JSON.parse(tableDefine);
        } catch (err) {
            this.#tableMeta = MagentoCommons.magentoTableMetaByTableXml(tableDefine)
        }
        this.#modelMeta = MagentoCommons.magentoModelMeta(this.#tableMeta.name, this.#moduleMeta);
    }

    async generateModuleGridZipFile() {
        return await this.#generateModuleGridFiles().then(() => {
            const outputFile = `${this.#gridUrlMeta.route}_${this.#gridUrlMeta.controller}_grid.tgz`;
            tar.c({gzip: true, file: outputFile,}, [this.#moduleMeta.moduleName])
                .then(() => MagentoCommons.syncRecursionDelDir(this.#moduleMeta.moduleName));
            return outputFile;
        }).catch(err => {
            throw err;
        });
    }

    async #generateModuleGridFiles() {
        const module = new MagentoModule(this.#moduleMeta);
        await module.initMagentoModule();
        const magentoModel = new MagentoModel(this.#tableMeta, this.#modelMeta);
        await magentoModel.buildModel();
        const magentoController = new MagentoBackendController(this.#moduleMeta, this.#modelMeta, this.#tableMeta);
        let imageColumn = '';
        for (let column of this.#tableMeta.column) {
            if (column['@@name'].includes("image")) {
                imageColumn = column['@@name'];
            }
        }
        await magentoController.buildBackendController(this.#gridUrlMeta, imageColumn);
        const magentoView = new MagentoView(this.#moduleMeta, this.#gridUrlMeta, this.#modelMeta, this.#tableMeta);
        await magentoView.buildBackendView();
        const magentoConfigXml = new MagentoConfigXml(this.#moduleMeta);
        await magentoConfigXml.buildAdminGridXml(this.#gridUrlMeta, this.#tableMeta, imageColumn);
        const magentoFrontTableQuery = new MagentoFrontTableQuery(this.#moduleMeta, this.#tableMeta, this.#gridUrlMeta);
        await magentoFrontTableQuery.buildFrontTableQuery();
    }
}

module.exports = MagentoBackendGrid;
