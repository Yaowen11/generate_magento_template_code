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
        const uiComponentListContentJson = {
            "?xml": {
                "@@version": "1.0"
            },
            "listing": {
                "@@xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
                "@@xsi:noNamespaceSchemaLocation": "urn:magento:module:Magento_Ui:etc/ui_configuration.xsd",
                "argument": {
                    "item": [
                        {
                            "item": [
                                {
                                    "#text": `${this.backendUrlMeta.route}_${this.backendUrlMeta.controller}_listing.${this.backendUrlMeta.route}_${this.backendUrlMeta.controller}_listing_data_source`,
                                    "@@name": "provider",
                                    "@@xsi:type": "string"
                                },
                                {
                                    "#text": `${this.backendUrlMeta.route}_${this.backendUrlMeta.controller}_listing.${this.backendUrlMeta.route}_${this.backendUrlMeta.controller}_listing_data_source`,
                                    "@@name": "deps",
                                    "@@xsi:type": "string"
                                }
                            ],
                            "@@name": "js_config",
                            "@@xsi:type": "array"
                        },
                        {
                            "#text": `${this.backendUrlMeta.route}_${this.backendUrlMeta.controller}_columns`,
                            "@@name": "spinner",
                            "@@xsi:type": "string"
                        },
                        {
                            "item": {
                                "item": [
                                    {
                                        "#text": "add",
                                        "@@name": "name",
                                        "@@xsi:type": "string"
                                    },
                                    {
                                        "#text": "Add New",
                                        "@@name": "label",
                                        "@@translate": "true",
                                        "@@xsi:type": "string"
                                    },
                                    {
                                        "#text": "primary",
                                        "@@name": "class",
                                        "@@xsi:type": "string"
                                    },
                                    {
                                        "#text": "rantion/banner/new",
                                        "@@name": "url",
                                        "@@xsi:type": "string"
                                    }
                                ],
                                "@@name": "add",
                                "@@xsi:type": "array"
                            },
                            "@@name": "buttons",
                            "@@xsi:type": "array"
                        }
                    ],
                    "@@name": "data",
                    "@@xsi:type": "array"
                },
                "dataSource": {
                    "@@name": `${this.backendUrlMeta.route}_${this.backendUrlMeta.controller}_listing_data_source`,
                    "@@component": "Magento_Ui/js/grid/provider",
                    "argument": [
                        {
                            "argument": [
                                {
                                    "#text": `${this.moduleMeta.namespace}\\Ui\\Component\\DataProvider\\${this.backendUrlMeta.controller}DataProvider`,
                                    "@@name": "class",
                                    "@@xsi:type": "string"
                                },
                                {
                                    "#text": `${this.backendUrlMeta.route}_${this.backendUrlMeta.controller}_listing_data_source`,
                                    "@@name": "name",
                                    "@@xsi:type": "string"
                                },
                                {
                                    "#text": "id",
                                    "@@name": "primaryFieldName",
                                    "@@xsi:type": "string"
                                },
                                {
                                    "#text": "id",
                                    "@@name": "requestFieldName",
                                    "@@xsi:type": "string"
                                },
                                {
                                    "item": {
                                        "item": [
                                            {
                                                "@@name": "update_url",
                                                "@@xsi:type": "url",
                                                "@@path": "mui/index/render"
                                            },
                                            {
                                                "item": {
                                                    "#text": "id",
                                                    "@@name": "indexField",
                                                    "@@xsi:type": "string"
                                                },
                                                "@@name": "storageConfig",
                                                "@@xsi:type": "array"
                                            }
                                        ],
                                        "@@name": "config",
                                        "@@xsi:type": "array"
                                    },
                                    "@@name": "data",
                                    "@@xsi:type": "array"
                                }
                            ],
                            "@@name": "dataProvider",
                            "@@xsi:type": "configurableObject"
                        },
                        {
                            "item": {
                                "item": {
                                    "#text": "Magento_Ui/js/grid/provider",
                                    "@@name": "component",
                                    "@@xsi:type": "string"
                                },
                                "@@name": "js_config",
                                "@@xsi:type": "array"
                            },
                            "@@name": "data",
                            "@@xsi:type": "array"
                        }
                    ]

                },
                "listingToolbar": {
                    "bookmark": {
                        "@@name": "bookmarks"
                    },
                    "columnsControls": {
                        "@@name": "columns_controls"
                    },
                    "filterSearch": {
                        "@@name": "fulltext"
                    },
                    "filters": {
                        "@@name": "listing_filters"
                    },
                    "paging": {
                        "@@name": "listing_paging"
                    },
                    "@@name": "listing_top"
                },
                "columns": {
                    "@@name": `${this.backendUrlMeta.route}_${this.backendUrlMeta.controller}_columns`,
                    "column": [],
                    "actionsColumn": {
                        "argument": {
                            "item": {
                                "item": [
                                    {
                                        "#text": false,
                                        "@@name": "resizeEnabled",
                                        "@@xsi:type": "boolean"
                                    },
                                    {
                                        "#text": 107,
                                        "@@name": "resizeDefaultWidth",
                                        "@@xsi:type": "string"
                                    },
                                    {
                                        "#text": "id",
                                        "@@name": "indexField",
                                        "@@xsi:type": "string"
                                    }
                                ],
                                "@@name": "config",
                                "@@xsi:type": "array"
                            },
                            "@@name": "data",
                            "@@xsi:type": "array"
                        },
                        "@@name": "actions",
                        "@@class": `${this.moduleMeta.namespace}\\Ui\\Component\\Listing\\Column\\${MagentoCommons.underscore2hump(this.backendUrlMeta.controller)}Actions`
                    }
                }
            }
        }
        for (let columnDefine of this.tableMeta.column) {
            uiComponentListContentJson["columns"]["column"].push(this.buildListColumn(columnDefine));
        }
        const xmlBuilder = MagentoCommons.getXmlBuilder();
        return xmlBuilder.build(uiComponentListContentJson);
    }

    buildListColumn(columnDefine) {
        const column = {
            '@@name': columnDefine['@@name']
        };
        const translateName = MagentoCommons.underscore2hump(columnDefine['@@name']);
        if (columnDefine['@@name'] === this.tableMeta.primaryKey) {
            column['settings'] = {
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
            return column;
        }
        if (columnDefine['@@xsi:type'].includes('datetime') || columnDefine['@@xsi:type'].includes('timestamp')) {
            column['@@class'] = "Magento\\Ui\\Component\\Listing\\Columns\\Date";
            column['@@component'] = "Magento_Ui/js/grid/columns/data";
            column['argument'] = {
                "item": {
                    "item": {
                        "#text": "yyyy-MM-dd hh:mm:ss",
                        "@@name": "dateFormat",
                        "@@xsi:type": "string"
                    },
                    "@@name": "config",
                    "@@xsi:type": "array"
                },
                "@@name": "data",
                "@@xsi:type": "array"
            };
            column['settings'] = {
                "filter": "dateRange",
                "dataType": "date",
                "label": {
                    "#text": translateName,
                    "@@translate": "true"
                }
            };
            return column;
        }
        if (columnDefine['@@xsi:type'].includes('char')) {
            column['settings'] = {
                "dataType": "text",
                "label": {
                    "#text": "Title",
                    "@@translate": "true"
                }
            }
            return column;
        }
        if (columnDefine['@@name'].includes("image")) {
            column['settings'] = {
                "hasPreview": 1,
                "label": {
                    "#text": translateName,
                    "@@translate": "true"
                },
                "sortable": false
            };
            column['@@component'] = "Magento_Ui/js/grid/columns/thumbnail";
            column['@@class'] = `${this.moduleMeta.namespace}\\Ui\\Component\\Listing\\Column\\${translateName}Thumbnail`;
            return column;
        }
    }

    get uiComponentForm() {

    }
}

module.exports = MagentoView;
