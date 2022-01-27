const path = require('path');
const MagentoBackendGrid = require(path.join(__dirname, 'libs', 'MagentoBackendGrid.js'));
const MagentoCommons = require(path.join(__dirname, 'libs', 'MagentoCommons.js'));

const moduleMeta = MagentoCommons.magentoModuleMeta(__dirname, 'Rantion_Content');
const gridUrlMeta = MagentoCommons.magentoBackendUrlMeta('rantion/banner');
const tableDefine = `<table name="rantion_banner" resource="default" engine="innodb" comment="">
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
    </table>`;
const magentoBackendGrid = new MagentoBackendGrid(moduleMeta, gridUrlMeta, tableDefine);
magentoBackendGrid.generateModuleGridZipFile();
