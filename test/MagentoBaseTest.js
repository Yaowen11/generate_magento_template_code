const path = require('path');
const fs = require('fs');
const tar = require('tar');

const BackendGrid = require(path.join(__dirname, 'libs', 'MagentoBackendGrid.js'));
const Commons = require(path.join(__dirname, 'libs', 'MagentoCommons.js'));
const ConfigXml = require(path.join(__dirname, 'libs', 'MagentoConfigXml.js'));
const Model = require(path.join(__dirname, 'libs', 'MagentoModel.js'));
const MagentoModule = require(path.join(__dirname, 'libs', 'MagentoModule.js'));
const TableGraphql = require(path.join(__dirname, 'libs', 'MagentoTableGraphql.js'));
const View = require(path.join(__dirname, 'libs', 'MagentoView.js'));

class MagentoBaseTest {

    #moduleMeta;

    #modelMeta;

    #gridUrlMeta;

    #tableDefine;

    constructor() {
        this.#moduleMeta = Commons.magentoModuleMeta(__dirname, 'Module_Package');
        this.#modelMeta = Commons.magentoModelMeta('home_banner', this.#moduleMeta);
        this.#gridUrlMeta = Commons.magentoBackendUrlMeta('home/banner');
        this.#tableDefine = `<table name="home_banner" resource="default" engine="innodb" comment="">
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
    }

    generateModuleGridZipFileTest() {

        const grid = new BackendGrid(this.#moduleMeta, this.#gridUrlMeta, this.#tableDefine);
        this.packagePromise(grid, grid.generateModuleGridZipFile)
            .then(() => {
                tar.c({
                    gzip: false,
                    file: `${this.#gridUrlMeta.url.replace('/', '_')}_grid.tar`
                }, [this.#moduleMeta.realpath])
            })
            .catch((err) => {
                console.log('MagentoBackendGrid.generateModuleGridZipFile test failed ' + err)
            })

    }

    packagePromise(obj, callback, ...args) {
        return new Promise(function (resolve, reject) {
            try {
                Reflect.apply(callback, obj, args);
                resolve()
            } catch (err) {
                reject(err)
            }
        });
    }
}

const magentoBaseTest = new MagentoBaseTest();

magentoBaseTest.generateModuleGridZipFileTest();