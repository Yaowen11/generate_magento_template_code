const path = require('path');
const fs = require('fs');

const BackendGrid = require(path.join(__dirname, 'libs', 'MagentoBackendGrid.js'));
const Commons = require(path.join(__dirname, 'libs', 'MagentoCommons.js'));

class MagentoBaseTest {

    #moduleMeta;

    #modelMeta;

    #gridUrlMeta;

    #tableDefine;

    constructor() {
        this.#moduleMeta = Commons.magentoModuleMeta(__dirname, 'Rantion_Home');
        this.#modelMeta = Commons.magentoModelMeta('home_review', this.#moduleMeta);
        this.#gridUrlMeta = Commons.magentoBackendUrlMeta('home/review');
        this.#tableDefine = `<table name="home_review" resource="default" engine="innodb">
        <column xsi:type="int" name="id" unsigned="true" identity="true"/>
        <column xsi:type="varchar" name="name" nullable="false" length="255"/>
        <column xsi:type="varchar" name="image" nullable="false" length="255"/>
        <column xsi:type="varchar" name="content" nullable="false" length="1000"/>
        <column xsi:type="int" name="star" nullable="false" default="5"/>
        <column xsi:type="timestamp" name="created_at" default="CURRENT_TIMESTAMP"/>
        <column xsi:type="timestamp" name="updated_at" nullable="true" on_update="true" default="CURRENT_TIMESTAMP"/>
        <constraint xsi:type="primary" referenceId="PRIMARY">
            <column name="id"/>
        </constraint>
    </table>`
    }

    async generateModuleGridZipFileTest() {
        const grid = new BackendGrid(this.#moduleMeta, this.#gridUrlMeta, this.#tableDefine);
        await grid.generateModuleGridZipFile();
        const gzFile = await grid.generateModuleGridZipFile();
        fs.promises.stat(gzFile).then(stat => {
            if (stat.isFile()) {
                console.log('MagentoBackendGrid.generateModuleGridZipFile test successful!');
            }
        }).catch(err => {
            console.log('MagentoBackendGrid.generateModuleGridZipFile test failed! ' + err);
        })
    }
}

const magentoBaseTest = new MagentoBaseTest();

magentoBaseTest.generateModuleGridZipFileTest();
