const MagentoCommons = require('./MagentoCommons');
const MagentoConfigXml = require('./MagentoConfigXml');
const MagentoBackendController = require('./MagentoController');
const MagentoModel = require('./MagentoModel');
const MagentoView = require('./MagentoView');
const MagentoModule = require('./MagentoModule');
const zlib = require('zlib');
const fs = require('fs');
const path = require("path");

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

    generateModuleGridZipFile() {
        this.#generateModuleGridFiles().then(() => {
            const gzip = zlib.createGzip();
            const outputFile = fs.createWriteStream(path.join(__dirname, `${this.#tableMeta.name}_grid.gz`));

        }).catch(err => {
            throw err;
        })
    }

    async #generateModuleGridFiles() {
        const module = new MagentoModule(this.#moduleMeta);
        await module.initMagentoModule();
        const magentoModel = new MagentoModel(this.#tableMeta, this.#modelMeta);
        await magentoModel.buildModel();
        const magentoController = new MagentoBackendController(this.#moduleMeta, this.#modelMeta);
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
    }
}

module.exports = MagentoBackendGrid;
