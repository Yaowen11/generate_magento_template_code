const path = require('path');
const MagentoCommons = require('./MagentoCommons');

class MagentoView {

    constructor(moduleMeta, backendUrlMeta, tableName) {
        this.moduleMeta = moduleMeta;
        this.backendUrlMeta = backendUrlMeta;
        this.modelMeta = MagentoCommons.magentoModelMeta(tableName, moduleMeta);
        this.tableMeta = MagentoCommons.magentoSchemaXmlTableMeta(path.join(moduleMeta.realPath, 'etc', 'db_schema.xml'), tableName);
        const viewDir = path.join(moduleMeta.realPath, 'view');
        MagentoCommons.createDirIfNotExists(viewDir);
        this.viewAdminhtmlDir = path.join(viewDir, 'adminhtml');
        MagentoCommons.createDirIfNotExists(this.viewAdminhtmlDir);
    }

    buildBackendView() {
        this.buildLayout();
        this.buildUiComponent();
        this.buildComponentClass();
    }

    buildLayout() {
        const layoutDir = path.join(this.viewAdminhtmlDir, 'layout');
        MagentoCommons.createDirIfNotExists(layoutDir);
        MagentoCommons.ifFileNotExistsAsyncWriteFile(path.join(layoutDir, `${this.backendUrlMeta.route}_${this.backendUrlMeta.controller}_index.xml`), this.viewIndexLayout);
        MagentoCommons.ifFileNotExistsAsyncWriteFile(path.join(layoutDir, `${this.backendUrlMeta.route}_${this.backendUrlMeta.controller}_edit.xml`), this.viewEditLayout);
        MagentoCommons.ifFileNotExistsAsyncWriteFile(path.join(layoutDir, `${this.backendUrlMeta.route}_${this.backendUrlMeta.controller}_new.xml`), this.viewEditLayout);
    }

    buildUiComponent() {
        const uiComponentDir = path.join(this.viewAdminhtmlDir, 'ui_component');
        MagentoCommons.createDirIfNotExists(uiComponentDir);
        const xmlBuilder = MagentoCommons.getXmlBuilder();
        MagentoCommons.ifFileNotExistsAsyncWriteFile(path.join(uiComponentDir, `${this.backendUrlMeta.route}_${this.backendUrlMeta.controller}_listing.xml`), xmlBuilder.build(this.uiComponentList));
        MagentoCommons.ifFileNotExistsAsyncWriteFile(path.join(uiComponentDir, `${this.backendUrlMeta.route}_${this.backendUrlMeta.controller}_form.xml`), xmlBuilder.build(this.uiComponentForm));
    }

    buildComponentClass() {
        const uiDir = path.join(this.moduleMeta.realPath, 'Ui');
        MagentoCommons.createDirIfNotExists(uiDir);
        const uiComponentDir = path.join(uiDir, 'Component');
        MagentoCommons.createDirIfNotExists(uiComponentDir);
        const uiComponentListingDir = path.join(uiComponentDir, 'Listing');
        MagentoCommons.createDirIfNotExists(uiComponentListingDir);
        const uiComponentListingColumnDir = path.join(uiComponentListingDir, 'Column');
        MagentoCommons.createDirIfNotExists(uiComponentListingColumnDir);
        for (let columnDefine of this.tableMeta.column) {
            const columnClassContent = this.componentColumnClassContent(columnDefine);
            if (Object.getOwnPropertyNames(columnClassContent).length > 0) {
                MagentoCommons.ifFileNotExistsAsyncWriteFile(path.join(uiComponentListingColumnDir, columnClassContent.file), columnClassContent.content);
            }
        }
    }

    componentColumnClassContent(columnDefine) {
        if (columnDefine['@@name'].includes("image")) {
            return {
                file: `${MagentoCommons.underscore2hump(columnDefine['@@name'])}Thumbnail.php`,
                content: `<?php

namespace ${this.moduleMeta.namespace}\\Ui\\Component\\Listing\\Column;

use Magento\\Catalog\\Ui\\Component\\Listing\\Columns\\Thumbnail;

class ${MagentoCommons.underscore2hump(columnDefine['@@name'])}Thumbnail extends Thumbnail
{
    public function prepareDataSource(array $dataSource): array
    {
        if (isset($dataSource['data']['items'])) {
            $fieldName = $this->getData('name');
            foreach ($dataSource['data']['items'] as &$item) {
                $item[$fieldName . '_src'] = $item['${columnDefine['@@name']}'];
                $item[$fieldName . '_orig_src'] = $item['${columnDefine['@@name']}'];
            }
        }
        return $dataSource;
    }
}
`
            }
        }
        if (columnDefine['@@xsi:type'].includes('tinyint') && columnDefine['@@comment']?.includes('0:')) {
            let classFileContent = {
                file: `${MagentoCommons.underscore2hump(columnDefine['@@name'])}.php`,
            }
            let content = `<?php

namespace ${this.moduleMeta.namespace}\\Ui\\Component\\Listing\\Column;

use Magento\\Framework\\Data\\OptionSourceInterface;

class ${MagentoCommons.underscore2hump(columnDefine['@@name'])} implements OptionSourceInterface
{
    public function toOptionArray(): array
    {
        return [
                        
`
            for (let valueName of columnDefine['@@comment'].split(',')) {
                let [value, name] = valueName.split(':');
                content +=
`           [
                'value' => ${value},
                'label' => '${name.toUpperCase()} ${columnDefine['@@name'].toUpperCase()}'
            ],
`
            }
            content +=
`       ];
    }
    
    public function toArray(): array
    {
        return [
`;
            for (let valueName of columnDefine['@@comment'].split(',')) {
                let [value, name] = valueName.split(':');
                content +=
`           ${value} => '${name.toUpperCase()} ${columnDefine['@@name'].toUpperCase()}',
`
            }
            content +=
`       ];
    }
}
`
            classFileContent.content = content;
            return classFileContent;
        }
        return {};
    }

    get viewIndexLayout() {
        return `<?xml version="1.0"?>
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <body>
        <referenceContainer name="content">
            <uiComponent name="${this.backendUrlMeta.route}_${this.backendUrlMeta.controller}_listing"/>
        </referenceContainer>
    </body>
</page>`
    }

    get viewEditLayout() {
        return `<?xml version="1.0"?>
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <body>
        <referenceContainer name="content">
            <uiComponent name="${this.backendUrlMeta.route}_${this.backendUrlMeta.controller}_form"/>
        </referenceContainer>
    </body>
</page>
`
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
            let listColumn = this.buildListColumn(columnDefine);
            if (Object.getOwnPropertyNames(listColumn).length > 0) {
                uiComponentListContentJson["listing"]["columns"]["column"].push(listColumn);
            }

        }
        return uiComponentListContentJson;
    }

    buildListColumn(columnDefine) {
        const translateName = MagentoCommons.underscore2hump(columnDefine['@@name']);
        if (columnDefine['@@name'] === this.tableMeta.primaryKey) {
            return {
                "@@name": columnDefine['@@name'],
                "settings": {
                    filter: 'textRange',
                    dataType: 'number',
                    label: {
                        '@@translate': "true",
                        '#text': translateName,
                    },
                    sorting: 'desc'

                }
            };
        }
        if (columnDefine['@@xsi:type'].includes('tinyint') && columnDefine['@@comment'].includes('0:')) {
            const optionsClass = `${this.moduleMeta.namespace}\\Ui\\Component\\Listing\\Column\\${translateName}`
            return {
                "@@name": columnDefine['@@name'],
                "argument": {
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
        if (columnDefine['@@xsi:type'].includes('datetime') || columnDefine['@@xsi:type'].includes('timestamp')) {
            return {
                "@@name": columnDefine['@@name'],
                "@@class": "Magento\\Ui\\Component\\Listing\\Columns\\Date",
                "argument": {
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
                },
                "settings": {
                    "filter": "dateRange",
                    "dataType": "date",
                    "label": {
                        "#text": translateName,
                        "@@translate": "true"
                    }
                }
            }
        }
        if (columnDefine['@@xsi:type'].includes('char')) {
            return {
                "@@name": columnDefine['@@name'],
                "settings": {
                    "dataType": "text",
                    "label": {
                        "#text": "Title",
                        "@@translate": "true"
                    }
                }
            }
        }
        if (columnDefine['@@name'].includes("image")) {
            return {
                "@@name": columnDefine['@@name'],
                "settings": {
                    "hasPreview": 1,
                    "label": {
                        "#text": translateName,
                        "@@translate": "true"
                    },
                    "sortable": false
                },
                "@@component": "Magento_Ui/js/grid/columns/thumbnail",
                "@@class": `${this.moduleMeta.namespace}\\Ui\\Component\\Listing\\Column\\${translateName}Thumbnail`
            }

        }
        return {};
    }

    get uiComponentForm() {
        const uiComponentFormJson = {
            "?xml": {
                "@@version": "1.0",
                "@@encoding": "UTF-8"
            },
            "form": {
                "argument": {
                    "item": [
                        {
                            "item": {
                                "#text": `${this.backendUrlMeta.route}_${this.backendUrlMeta.controller}_form.${this.backendUrlMeta.route}_${this.backendUrlMeta.controller}_form_data_source`,
                                "@@name": "provider",
                                "@@xsi:type": "string"
                            },
                            "@@name": "js_config",
                            "@@xsi:type": "array"
                        },
                        {
                            "#text": `${MagentoCommons.underscore2hump(this.backendUrlMeta.route)} ${MagentoCommons.underscore2hump(this.backendUrlMeta.controller)}`,
                            "@@name": "label",
                            "@@xsi:type": "string",
                            "@@translate": "true"
                        },
                        {
                            "#text": "templates/form/collapsible",
                            "@@name": "template",
                            "@@xsi:type": "string"
                        }
                    ],
                    "@@name": "data",
                    "@@xsi:type": "array"
                },
                "settings": {
                    "buttons": {
                        "button": [
                            {
                                "@@name": "save",
                                "@@class": "Magento\\Customer\\Block\\Adminhtml\\Edit\\SaveButton"
                            },
                            {
                                "@@name": "reset",
                                "@@class": "Magento\\Customer\\Block\\Adminhtml\\Edit\\ResetButton"
                            },
                            {
                                "@@name": "back",
                                "@@class": "Magento\\Customer\\Block\\Adminhtml\\Edit\\BackButton"
                            }
                        ]
                    },
                    "namespace": `${this.backendUrlMeta.route}_${this.backendUrlMeta.controller}_form`,
                    "dataScope": "data",
                    "deps": {
                        "dep": `${this.backendUrlMeta.route}_${this.backendUrlMeta.controller}_form.${this.backendUrlMeta.route}_${this.backendUrlMeta.controller}_form_data_source`
                    }
                },
                "dataSource": {
                    "argument": {
                        "item": {
                            "item": {
                                "#text": "Magento_Ui/js/form/provider",
                                "@@name": "component",
                                "@@xsi:type": "string"
                            },
                            "@@name": "js_config",
                            "@@xsi:type": "array"
                        },
                        "@@name": "data",
                        "@@xsi:type": "array"
                    },
                    "settings": {
                        "submitUrl": {
                            "@@path": `${this.backendUrlMeta.url}/save`
                        }
                    },
                    "dataProvider": {
                        "settings": {
                            "requestFieldName": `${this.tableMeta.primaryKey ?? 'id'}`,
                            "primaryFieldName": `${this.tableMeta.primaryKey ?? 'id'}`
                        },
                        "@@class": `${this.modelMeta.collectionNamespace}\\DataProvider`,
                        "@@name": `${this.backendUrlMeta.route}_${this.backendUrlMeta.controller}_form_data_source`
                    },
                    "@@name": `${this.backendUrlMeta.route}_${this.backendUrlMeta.controller}_form_data_source`
                },
                "fieldset": {
                    "settings": {
                        "label": {
                            "#text": `${MagentoCommons.underscore2hump(this.backendUrlMeta.route)} ${MagentoCommons.underscore2hump(this.backendUrlMeta.controller)} Information`,
                            "@@translate": "false"
                        }
                    },
                    "field": [],
                    "@@name": `${this.backendUrlMeta.route}_${this.backendUrlMeta.controller}_form`
                },
                "@@xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
                "@@xsi:noNamespaceSchemaLocation": "urn:magento:module:Magento_Ui:etc/ui_configuration.xsd"
            }
        };
        for (let columnDefine of this.tableMeta.column) {
            const formColumn = this.buildFormColumn(columnDefine);
            if (Object.getOwnPropertyNames(formColumn).length > 0) {
                uiComponentFormJson["form"]["fieldset"]["field"].push(formColumn);
            }
        }
        return uiComponentFormJson;
    }

    buildFormColumn(columnDefine) {
        if (columnDefine['@@name'] === this.tableMeta.primaryKey) {
            return {
                "argument": {
                    "item": {
                        "item": [
                            {
                                "#text": `${this.backendUrlMeta.route}_${this.backendUrlMeta.controller}`,
                                "@@name": "source",
                                "@@xsi:type": "string"
                            },
                            {
                                "#text": "ID",
                                "@@name": "label",
                                "@@xsi:type": "string",
                                "@@translate": "true"
                            }
                        ],
                        "@@name": "config",
                        "@@xsi:type": "array"
                    },
                    "@@name": "data",
                    "@@xsi:type": "array"
                },
                "settings": {
                    "dataType": "text"
                },
                "@@name": `${this.tableMeta.primaryKey}`,
                "@@formElement": "hidden"
            }
        }
        if (columnDefine['@@xsi:type'].includes("char")) {
            return {
                "@@name": columnDefine['@@name'],
                "@@formElement": 'input',
                "argument": {
                    "item": {
                        "item": [
                            {
                                "#text": columnDefine['@@name'],
                                "@@name": "source",
                                "@@xsi:type": "string"
                            },
                            {
                                "#text": `${MagentoCommons.underscore2hump(columnDefine['@@name'])}`,
                                "@@name": "label",
                                "@@xsi:type": "string",
                                "@@translate": "true"
                            }
                        ],
                        "@@name": "config",
                        "@@xsi:type": "array"
                    },
                    "@@name": "data",
                    "@@xsi:type": "array"
                },
                "settings": {
                    "validation": {
                        "rule": {
                            "#text": true,
                            "@@name": "required-entry",
                            "@@xsi:type": "boolean"
                        }
                    },
                    "dataType": "text",
                    "visible": true,
                    "dataScope": columnDefine['@@name']
                }
            }
        }
        if (columnDefine['@@xsi:type'].includes("tinyint") && columnDefine['@@comment'].includes('0:')) {
            return {
                "argument": {
                    "item": {
                        "item": [
                            {
                                "#text": columnDefine['@@name'],
                                "@@name": "source",
                                "@@xsi:type": "string"
                            },
                            {
                                "#text": `${MagentoCommons.underscore2hump(columnDefine['@@name'])}`,
                                "@@name": "label",
                                "@@xsi:type": "string",
                                "@@translate": "true"
                            }
                        ],
                        "@@name": "config",
                        "@@xsi:type": "array"
                    },
                    "@@name": "data",
                    "@@xsi:type": "array"
                },
                "settings": {
                    "dataType": "text"
                },
                "formElements": {
                    "select": {
                        "settings": {
                            "options": {
                                "@@class": `${this.moduleMeta.namespace}\\Ui\\Component\\Listing\\Column\\${MagentoCommons.underscore2hump(columnDefine['@@name'])}`
                            }
                        }
                    }
                },
                "@@name": columnDefine['@@name'],
                "@@formElement": "select"
            };
        }
        if ((columnDefine['@@xsi:type'].includes("timestamp")
                || columnDefine['@@xsi:type'].includes('datetime'))
            && columnDefine['@@name'] !== 'created_at' && columnDefine['@@name'] !== 'updated_at') {
            return {
                "argument": {
                    "item": {
                        "item": [
                            {
                                "#text": columnDefine['@@name'],
                                "@@name": "source",
                                "@@xsi:type": "string"
                            },
                            {
                                "#text": `${MagentoCommons.underscore2hump(columnDefine['@@name'])}`,
                                "@@name": "label",
                                "@@xsi:type": "string",
                                "@@translate": "true"
                            }
                        ],
                        "@@name": "config",
                        "@@xsi:type": "array"
                    },
                    "@@name": "data",
                    "@@xsi:type": "array"
                },
                "settings": {
                    "validation": {
                        "rule": [
                            {
                                "#text": true,
                                "@@name": "required-date",
                                "@@xsi:type": "boolean"
                            },
                            {
                                "#text": true,
                                "@@name": "required-entry",
                                "@@xsi:type": "boolean"
                            }
                        ]
                    },
                    "dataType": "text",
                    "visible": true,
                    "dataScope": "end"
                },
                "@@name": columnDefine['@@name'],
                "@@formElement": "date"
            }
        }
        if (columnDefine['@@xsi:type'] === 'text') {
            if (columnDefine['@@comment'] === 'wysiwyg') {
                return {
                    "argument": {
                        "item": {
                            "item": {
                                "item": [
                                    {
                                        "#text": "100px",
                                        "@@name": "height",
                                        "@@xsi:type": "string"
                                    },
                                    {
                                        "#text": true,
                                        "@@name": "add_variables",
                                        "@@xsi:type": "boolean"
                                    },
                                    {
                                        "#text": true,
                                        "@@name": "add_widgets",
                                        "@@xsi:type": "boolean"
                                    },
                                    {
                                        "#text": true,
                                        "@@name": "add_images",
                                        "@@xsi:type": "boolean"
                                    },
                                    {
                                        "#text": true,
                                        "@@name": "add_directives",
                                        "@@xsi:type": "boolean"
                                    }
                                ],
                                "@@name": "wysiwygConfigData",
                                "@@xsi:type": "array"
                            },
                            "@@name": "config",
                            "@@xsi:type": "array"
                        },
                        "@@name": "data",
                        "@@xsi:type": "array"
                    },
                    "settings": {
                        "label": `${MagentoCommons.underscore2hump(columnDefine['@@name'])}`,
                        "dataType": "text",
                        "visible": true,
                        "dataScope": columnDefine['@@name']
                    },
                    "formElements": {
                        "wysiwyg": {
                            "settings": {
                                "rows": 8,
                                "wysiwyg": true
                            }
                        }
                    },
                    "@@name": columnDefine['@@name'],
                    "@@formElement": "wysiwyg"
                }
            }
            return {
                "@@name": columnDefine['@@name'],
                "argument": {
                    "@@name": "data",
                    "@@xsi:type": "array",
                    "item": {
                        "@@name": "config",
                        "@@xsi:type": "array",
                        "item": [
                            {
                                "#text": "textarea",
                                "@@name": "formElement",
                                "@@xsi:type": "string"
                            },
                            {
                                "#text": 15,
                                "@@name": "cols",
                                "@@xsi:type": "number"
                            },
                            {
                                "#text": 5,
                                "@@name": "rows",
                                "@@xsi:type": "number"
                            },
                            {
                                "#text": MagentoCommons.underscore2hump(columnDefine['@@name']),
                                "@@name": "label",
                                "@@translate": "true",
                                "@@xsi:type": "string"
                            },
                            {
                                "#text": "text",
                                "@@name": "dataType",
                                "@@translate": "true",
                                "@@xsi:type": "string"
                            }
                        ]
                    }
                },
                "settings": {
                    "dataType": "text",
                    "visible": true,
                    "dataScope": columnDefine['@@name']
                }
            }
        }
        return {};
    }
}

module.exports = MagentoView;
