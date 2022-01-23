const path = require('path');
const MagentoCommons = require('./MagentoCommons');
const os = require("os");

class MagentoView {

    constructor(moduleMeta, backendUrlMeta, tableName) {
        this.moduleMeta = moduleMeta;
        this.backendUrlMeta = backendUrlMeta;
        this.modelMeta = MagentoCommons.magentoModelMeta(tableName, moduleMeta);
        this.tableMeta = MagentoCommons.magentoSchemaXmlTableMeta(path.join(moduleMeta.realPath, 'etc', 'db_schema.xml'), tableName);
        const viewDir = path.join(moduleMeta.path, 'view');
        MagentoCommons.createDirIfNotExists(viewDir);
        this.viewAdminhtmlDir = path.join(viewDir, 'adminhtml');
        MagentoCommons.createDirIfNotExists(this.viewAdminhtmlDir);
    }

    buildBackendView() {
        this.buildLayout();
        this.buildUiComponent();
    }

    buildLayout() {
        const layoutDir = path.join(this.viewAdminhtmlDir, 'layout');
        MagentoCommons.createDirIfNotExists(layoutDir);
        MagentoCommons.ifFileNotExistsAsyncWriteFile(path.join(layoutDir, `${this.moduleMeta.moduleName}_${this.backendUrlMeta.controller}_index.xml`), this.viewIndexLayout);
        MagentoCommons.ifFileNotExistsAsyncWriteFile(path.join(layoutDir, `${this.moduleMeta.moduleName}_${this.backendUrlMeta.controller}_edit.xml`), this.viewEditLayout);
        MagentoCommons.ifFileNotExistsAsyncWriteFile(path.join(layoutDir, `${this.moduleMeta.moduleName}_${this.backendUrlMeta.controller}_new.xml`), this.viewEditLayout);
    }

    buildUiComponent() {

    }

    get viewIndexLayout() {
        this.indexIndexLayoutContent = `<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <body>
        <referenceContainer name="content">
            <uiComponent name="${this.backendUrlMeta.route}_${this.backendUrlMeta.controller}_listing"/>
        </referenceContainer>
    </body>
</page>`
        return this.indexIndexLayoutContent;
    }

    get viewEditLayout() {
        this.editContent = `<?xml version="1.0"?>
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <body>
        <referenceContainer name="content">
            <uiComponent name="${this.backendUrlMeta.route}_${this.backendUrlMeta.controller}_form"/>
        </referenceContainer>
    </body>
</page>
`
        return this.editContent;
    }

    get uiComponentList() {
        this.uiComponentListContent = `<?xml version="1.0"?>
<listing xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Ui:etc/ui_configuration.xsd">
    <argument name="data" xsi:type="array">
        <item name="js_config" xsi:type="array">
            <item name="provider" xsi:type="string">${this.backendUrlMeta.route}_${this.backendUrlMeta.controller}_listing.${this.backendUrlMeta.route}_${this.backendUrlMeta.controller}_listing_data_source</item>
            <item name="deps" xsi:type="string">${this.backendUrlMeta.route}_${this.backendUrlMeta.controller}_listing.${this.backendUrlMeta.route}_${this.backendUrlMeta.controller}_listing_data_source</item>
        </item>
        <item name="spinner" xsi:type="string">${this.backendUrlMeta.route}_${this.backendUrlMeta.controller}_columns</item>
        <item name="buttons" xsi:type="array">
            <item name="add" xsi:type="array">
                <item name="name" xsi:type="string">add</item>
                <item name="label" xsi:type="string">Add New</item>
                <item name="class" xsi:type="string">primary</item>
                <item name="url" xsi:type="string">${this.backendUrlMeta.url}/new</item>
            </item>
        </item>
    </argument>
    <dataSource name="${this.backendUrlMeta.route}_${this.backendUrlMeta.controller}_listing_data_source" component="Magento_Ui/js/grid/provider">
        <argument name="dataProvider" xsi:type="configurableObject">
            <argument name="class" xsi:type="string">${this.moduleMeta.namespace}\\Ui\\Component\\DataProvider\\${this.backendUrlMeta.controller}DataProvider</argument>
            <argument name="name" xsi:type="string">${this.backendUrlMeta.route}_${this.backendUrlMeta.controller}_listing_data_source</argument>
            <argument name="primaryFieldName" xsi:type="string">id</argument>
            <argument name="requestFieldName" xsi:type="string">id</argument>
            <argument name="data" xsi:type="array">
                <item name="config" xsi:type="array">
                    <item name="update_url" xsi:type="url" path="mui/index/render"/>
                    <item name="storageConfig" xsi:type="array">
                        <item name="indexField" xsi:type="string">id</item>
                    </item>
                </item>
            </argument>
        </argument>
        <argument name="data" xsi:type="array">
            <item name="js_config" xsi:type="array">
                <item name="component" xsi:type="string">Magento_Ui/js/grid/provider</item>
            </item>
        </argument>
    </dataSource>
    <listingToolbar name="listing_top">
        <bookmark name="bookmarks"/>
        <columnsControls name="columns_controls"/>
        <filterSearch name="fulltext"/>
        <filters name="listing_filters"/>
        <paging name="listing_paging"/>
    </listingToolbar>
</listing>`
        const columns = {
            '@@name': `${this.backendUrlMeta.route}_${this.backendUrlMeta.controller}_columns`,
            'column': []
        };
        for (let columnDefine of this.tableMeta.column) {
            columns.column.push(this.buildListColumn(columnDefine));
        }
        const xmlParser = MagentoCommons.getXmlParser();
        const uiComponentJson = xmlParser.parse(this.uiComponentListContent);
        uiComponentJson.listing.columns = columns;
        const xmlBuilder = MagentoCommons.getXmlBuilder();
        this.uiComponentListContent = xmlBuilder.build(uiComponentJson)
        return this.uiComponentListContent;
    }

    buildListColumn(columnDefine) {
        const column = {
            '@@name': columnDefine['@@name']
        };
        const translateName = MagentoCommons.underscore2hump(columnDefine['@@name']);
        if (columnDefine['@@name'] === this.tableMeta.primaryKey) {
            column.settings = {
                filter: 'textRange',
                dataType: 'number',
                label: {
                    '@@translate': "true",
                    '#text': translateName,
                },
                sorting: 'desc'

            }
            return column;
        }
        if (columnDefine['@@xsi:type'].includes('tinyint') && columnDefine['@@comment'].includes('0:')) {
            const optionsClass = `${this.moduleMeta.namespace}\\Ui\\Component\\Listing\\Column\\${translateName}`
            column.argument = {
                '@@name': 'data',
                '@@xsi:type': 'array',
                item: [
                    {
                        '@@name': 'options',
                        '@@xsi:type': 'object',
                        '#text': optionsClass
                    },
                    {
                        '@@name': 'config',
                        '@@xsi:type': 'array',
                        item: [
                            {
                                '@@name': 'filter',
                                '@@xsi:type': 'string',
                                '#text': 'select',
                            }
                        ]
                    }
                ]

            }
        }
    }

    get uiComponentForm() {

    }
}

module.exports = MagentoView;
