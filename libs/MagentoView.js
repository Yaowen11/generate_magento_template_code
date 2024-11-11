const path = require('path');
const MagentoCommons = require('./MagentoCommons');

class MagentoView {

    #moduleMeta;

    #backendUrlMeta;

    #modelMeta;

    #tableMeta;

    constructor(moduleMeta, backendUrlMeta, modelMeta, tableMeta) {
        this.#moduleMeta = moduleMeta;
        this.#backendUrlMeta = backendUrlMeta;
        this.#modelMeta = modelMeta;
        this.#tableMeta = tableMeta;
    }

    buildBackendView() {
        const viewAdminhtmlDir = path.join(this.#moduleMeta.realPath, 'view', 'adminhtml');
        MagentoCommons.syncRecursionCreateDir(viewAdminhtmlDir);
        // layout files
        const layoutDir = path.join(viewAdminhtmlDir, 'layout');
        MagentoCommons.syncRecursionCreateDir(layoutDir);
        MagentoCommons.ifFileNotExistsAsyncWriteFile(path.join(layoutDir, `${this.#backendUrlMeta.route}_${this.#backendUrlMeta.controller}_index.xml`), this.#viewIndexLayout);
        MagentoCommons.ifFileNotExistsAsyncWriteFile(path.join(layoutDir, `${this.#backendUrlMeta.route}_${this.#backendUrlMeta.controller}_edit.xml`), this.#viewEditLayout);
        MagentoCommons.ifFileNotExistsAsyncWriteFile(path.join(layoutDir, `${this.#backendUrlMeta.route}_${this.#backendUrlMeta.controller}_new.xml`), this.#viewEditLayout);
        // create ui form buttons
        const blockAdminhtmlEditDir = path.join(this.#moduleMeta.realPath, 'Block', 'Adminhtml', 'Edit');
        MagentoCommons.syncRecursionCreateDir(blockAdminhtmlEditDir);
        MagentoCommons.ifFileNotExistsAsyncWriteFile(path.join(blockAdminhtmlEditDir, 'BackButton.php'), this.#formBackButton);
        MagentoCommons.ifFileNotExistsAsyncWriteFile(path.join(blockAdminhtmlEditDir, 'SaveButton.php'), this.#formSaveButton);
        MagentoCommons.ifFileNotExistsAsyncWriteFile(path.join(blockAdminhtmlEditDir, 'ResetButton.php'), this.#formResetButton);
        // ui component files
        const componentDir = path.join(viewAdminhtmlDir, 'ui_component');
        MagentoCommons.syncRecursionCreateDir(componentDir);
        const xmlBuilder = MagentoCommons.getXmlBuilder();
        MagentoCommons.ifFileNotExistsAsyncWriteFile(path.join(componentDir, `${this.#backendUrlMeta.route}_${this.#backendUrlMeta.controller}_listing.xml`), xmlBuilder.build(this.#uiComponentList));
        MagentoCommons.ifFileNotExistsAsyncWriteFile(path.join(componentDir, `${this.#backendUrlMeta.route}_${this.#backendUrlMeta.controller}_form.xml`), xmlBuilder.build(this.#uiComponentForm));
        // ui component column class
        const uiComponentListingColumnDir = path.join(this.#moduleMeta.realPath, 'Ui', 'Component', 'Listing', 'Column');
        MagentoCommons.syncRecursionCreateDir(uiComponentListingColumnDir);
        for (let columnDefine of this.#tableMeta.column) {
            const columnClassContent = this.#componentColumnClassContent(columnDefine);
            if (Object.getOwnPropertyNames(columnClassContent).length > 0) {
                MagentoCommons.ifFileNotExistsAsyncWriteFile(path.join(uiComponentListingColumnDir, columnClassContent.file), columnClassContent.content);
            }
        }
        const actionsFile = `${this.#backendUrlMeta.controller.substring(0, 1).toUpperCase()}${this.#backendUrlMeta.controller.slice(1)}Actions`;
        MagentoCommons.ifFileNotExistsAsyncWriteFile(path.join(uiComponentListingColumnDir, `${actionsFile}.php`), this.#columnActions)

        const uiDataProviderClassDir = path.join(path.join(this.#moduleMeta.realPath, 'Ui', 'Component', 'DataProvider'));
        MagentoCommons.syncRecursionCreateDir(uiDataProviderClassDir);
        MagentoCommons.ifFileNotExistsAsyncWriteFile(
            path.join(uiDataProviderClassDir, `${this.#backendUrlMeta.controller.substring(0, 1).toUpperCase()}${this.#backendUrlMeta.controller.slice(1)}DataProvider.php`),
            this.#uiDataProvider
        )
    }

    get #formBackButton() {
        return `<?php

namespace ${this.#moduleMeta.namespace}\\Block\\Adminhtml\\Edit;

use Magento\\Backend\\Block\\Widget\\Context;
use Magento\\Framework\\UrlInterface;
use Magento\\Framework\\View\\Element\\UiComponent\\Control\\ButtonProviderInterface;

class BackButton implements ButtonProviderInterface
{
    private UrlInterface $urlBuilder;
    
    public function __construct(Context $context)
    {
        $this->urlBuilder = $context->getUrlBuilder();
    }
    
    public function getButtonData(): array
    {
        $backUrl = $this->urlBuilder->getUrl('*/*/', []);
        return [
            'label' => __('Back'),
            'on_click' => sprintf("location.href = '%s';", $backUrl)
        ];
    }
}
        `
    }

    get #formSaveButton() {
        return `<?php

name ${this.#moduleMeta.namespace}\\Block\\Adminhtml\\Edit;

use Magento\\Framework\\View\\Element\\UiComponent\\Control\\ButtonProviderInterface;

class SaveButton implements ButtonProviderInterface
{
    public function getButtonData(): array
    {
        return [
            'label' => __('Save'),
            'class' => 'save primary',
            'data_attribute' => [
                'mage-init' => ['button' => ['event' => 'save']],
                'form-role' => 'save',
            ],
            'sort_order' => 90,
        ];
    }
}
        `
    }

    get #formResetButton() {
        return `<?php

namespace ${this.#moduleMeta.namespace}\\Block\\Adminhtml\\Edit;
        
use Magento\\Framework\\View\\Element\\UiComponent\\Control\\ButtonProviderInterface;

class ResetButton implements ButtonProviderInterface
{
    public function getButtonData(): array
    {
        return [
            'label' => __('Reset'),
            'class' => 'reset',
            'on_click' => 'location.reload();',
            'sort_order' => 30      
        ];
    }
}
        `
    }

    #componentColumnClassContent(columnDefine) {
        if (columnDefine['@@name'].includes("image")) {
            return {
                file: `${MagentoCommons.underscore2hump(columnDefine['@@name'])}Thumbnail.php`,
                content: `<?php

namespace ${this.#moduleMeta.namespace}\\Ui\\Component\\Listing\\Column;

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

namespace ${this.#moduleMeta.namespace}\\Ui\\Component\\Listing\\Column;

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

    get #viewIndexLayout() {
        return `<?xml version="1.0"?>
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <body>
        <referenceContainer name="content">
            <uiComponent name="${this.#backendUrlMeta.route}_${this.#backendUrlMeta.controller}_listing"/>
        </referenceContainer>
    </body>
</page>`
    }

    get #viewEditLayout() {
        return `<?xml version="1.0"?>
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <body>
        <referenceContainer name="content">
            <uiComponent name="${this.#backendUrlMeta.route}_${this.#backendUrlMeta.controller}_form"/>
        </referenceContainer>
    </body>
</page>
`
    }

    get #uiComponentList() {
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
                                    "#text": `${this.#backendUrlMeta.route}_${this.#backendUrlMeta.controller}_listing.${this.#backendUrlMeta.route}_${this.#backendUrlMeta.controller}_listing_data_source`,
                                    "@@name": "provider",
                                    "@@xsi:type": "string"
                                },
                                {
                                    "#text": `${this.#backendUrlMeta.route}_${this.#backendUrlMeta.controller}_listing.${this.#backendUrlMeta.route}_${this.#backendUrlMeta.controller}_listing_data_source`,
                                    "@@name": "deps",
                                    "@@xsi:type": "string"
                                }
                            ],
                            "@@name": "js_config",
                            "@@xsi:type": "array"
                        },
                        {
                            "#text": `${this.#backendUrlMeta.route}_${this.#backendUrlMeta.controller}_columns`,
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
                                        "#text": `${this.#backendUrlMeta.route}/${this.#backendUrlMeta.controller}/new`,
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
                    "@@name": `${this.#backendUrlMeta.route}_${this.#backendUrlMeta.controller}_listing_data_source`,
                    "@@component": "Magento_Ui/js/grid/provider",
                    "argument": [
                        {
                            "argument": [
                                {
                                    "#text": `${this.#moduleMeta.namespace}\\Ui\\Component\\DataProvider\\${this.#backendUrlMeta.controller.substring(0, 1).toUpperCase()}${this.#backendUrlMeta.controller.slice(1)}DataProvider`,
                                    "@@name": "class",
                                    "@@xsi:type": "string"
                                },
                                {
                                    "#text": `${this.#backendUrlMeta.route}_${this.#backendUrlMeta.controller}_listing_data_source`,
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
                    "@@name": `${this.#backendUrlMeta.route}_${this.#backendUrlMeta.controller}_columns`,
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
                        "@@class": `${this.#moduleMeta.namespace}\\Ui\\Component\\Listing\\Column\\${MagentoCommons.underscore2hump(this.#backendUrlMeta.controller)}Actions`
                    }
                }
            }
        }
        for (let columnDefine of this.#tableMeta.column) {
            let listColumn = this.#buildListColumn(columnDefine);
            if (Object.getOwnPropertyNames(listColumn).length > 0) {
                uiComponentListContentJson["listing"]["columns"]["column"].push(listColumn);
            }

        }
        return uiComponentListContentJson;
    }

    #buildListColumn(columnDefine) {
        const translateName = MagentoCommons.underscore2hump(columnDefine['@@name']);
        if (columnDefine['@@name'] === this.#tableMeta.primaryKey) {
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
                "@@class": `${this.#moduleMeta.namespace}\\Ui\\Component\\Listing\\Column\\${translateName}Thumbnail`
            }

        }
        if (columnDefine['@@xsi:type'].includes('tinyint') && columnDefine['@@comment'].includes('0:')) {
            const optionsClass = `${this.#moduleMeta.namespace}\\Ui\\Component\\Listing\\Column\\${translateName}`
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
        return {};
    }

    get #uiComponentForm() {
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
                                "#text": `${this.#backendUrlMeta.route}_${this.#backendUrlMeta.controller}_form.${this.#backendUrlMeta.route}_${this.#backendUrlMeta.controller}_form_data_source`,
                                "@@name": "provider",
                                "@@xsi:type": "string"
                            },
                            "@@name": "js_config",
                            "@@xsi:type": "array"
                        },
                        {
                            "#text": `${MagentoCommons.underscore2hump(this.#backendUrlMeta.route)} ${MagentoCommons.underscore2hump(this.#backendUrlMeta.controller)}`,
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
                                "@@class": `${this.#moduleMeta.namespace}` + "\\Block\\Adminhtml\\Edit\\SaveButton"
                            },
                            {
                                "@@name": "reset",
                                "@@class": `${this.#moduleMeta.namespace}` + "\\Block\\Adminhtml\\Edit\\ResetButton"
                            },
                            {
                                "@@name": "back",
                                "@@class": `${this.#moduleMeta.namespace}` + "\\Block\\Adminhtml\\Edit\\BackButton"
                            }
                        ]
                    },
                    "namespace": `${this.#backendUrlMeta.route}_${this.#backendUrlMeta.controller}_form`,
                    "dataScope": "data",
                    "deps": {
                        "dep": `${this.#backendUrlMeta.route}_${this.#backendUrlMeta.controller}_form.${this.#backendUrlMeta.route}_${this.#backendUrlMeta.controller}_form_data_source`
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
                            "@@path": `${this.#backendUrlMeta.url}/save`
                        }
                    },
                    "dataProvider": {
                        "settings": {
                            "requestFieldName": `${this.#tableMeta.primaryKey ?? 'id'}`,
                            "primaryFieldName": `${this.#tableMeta.primaryKey ?? 'id'}`
                        },
                        "@@class": `${this.#modelMeta.collectionNamespace}\\DataProvider`,
                        "@@name": `${this.#backendUrlMeta.route}_${this.#backendUrlMeta.controller}_form_data_source`
                    },
                    "@@name": `${this.#backendUrlMeta.route}_${this.#backendUrlMeta.controller}_form_data_source`
                },
                "fieldset": {
                    "settings": {
                        "label": {
                            "#text": `${MagentoCommons.underscore2hump(this.#backendUrlMeta.route)} ${MagentoCommons.underscore2hump(this.#backendUrlMeta.controller)} Information`,
                            "@@translate": "false"
                        }
                    },
                    "field": [],
                    "@@name": `${this.#backendUrlMeta.route}_${this.#backendUrlMeta.controller}_form`
                },
                "@@xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
                "@@xsi:noNamespaceSchemaLocation": "urn:magento:module:Magento_Ui:etc/ui_configuration.xsd"
            }
        };
        for (let columnDefine of this.#tableMeta.column) {
            const formColumn = this.#buildFormColumn(columnDefine);
            if (Object.getOwnPropertyNames(formColumn).length > 0) {
                uiComponentFormJson["form"]["fieldset"]["field"].push(formColumn);
            }
        }
        return uiComponentFormJson;
    }

    get #uiDataProvider() {
        return `<?php

namespace ${this.#moduleMeta.namespace}\\Ui\\Component\\DataProvider;

use Magento\\Framework\\View\\Element\\UiComponent\\DataProvider\\DataProvider;

class ${this.#backendUrlMeta.controller.substring(0, 1).toUpperCase()}${this.#backendUrlMeta.controller.slice(1)}DataProvider extends DataProvider
{

}`
    }

    get #columnActions() {
        return `<?php

namespace ${this.#moduleMeta.namespace}\\Ui\\Component\\Listing\\Column;

use Magento\\Framework\\UrlInterface;
use Magento\\Framework\\View\\Element\\UiComponent\\ContextInterface;
use Magento\\Framework\\View\\Element\\UiComponentFactory;
use Magento\\Ui\\Component\\Listing\\Columns\\Column;

class ${this.#backendUrlMeta.controller.substring(0, 1).toUpperCase()}${this.#backendUrlMeta.controller.slice(1)}Actions extends Column
{
    private $urlBuilder;
    
    public function __construct(ContextInterface $context,
                                UrlInterface $urlBuilder,
                                UiComponentFactory $uiComponentFactory,
                                array $components = [],
                                array $data = [])
    {
        parent::__construct($context, $uiComponentFactory, $components, $data);
        $this->urlBuilder = $urlBuilder;
    }
    
    public function prepareDataSource(array $dataSource): array
    {
        if (isset($dataSource['data']['items'])) {
            foreach ($dataSource['data']['items'] as &$item) {
                if (isset($item['${this.#tableMeta.primaryKey}'])) {
                    $item[$this->getData('name')] = [
                        'edit' => [
                            'href' => $this->urlBuilder->getUrl('${this.#backendUrlMeta.route}/${this.#backendUrlMeta.controller}/edit', ['id' => $item['id']]),
                            'label' => __('Edit'),
                        ],
                        'delete' => [
                            'href' => $this->urlBuilder->getUrl('${this.#backendUrlMeta.route}/${this.#backendUrlMeta.controller}/delete', ['id' => $item['id']]),
                            'label' => __('Delete'),
                            'confirm' => [
                                'title' => __('Delete'),
                                'message' => __('Are you sure?')
                            ]
                        ]
                    ];
                }
            }
        }
        return $dataSource;
    }
        
}`;
    }

    #buildFormColumn(columnDefine) {
        if (columnDefine['@@name'] === this.#tableMeta.primaryKey) {
            return {
                "argument": {
                    "item": {
                        "item": [
                            {
                                "#text": `${this.#backendUrlMeta.route}_${this.#backendUrlMeta.controller}`,
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
                "@@name": `${this.#tableMeta.primaryKey}`,
                "@@formElement": "hidden"
            }
        }
        if (columnDefine['@@name'].includes('image')) {
            return {
                "settings": {
                    "label": {
                        "#text": `${MagentoCommons.underscore2hump(columnDefine['@@name'])}`,
                        "@@translate": "true"
                    },
                    "componentType": "imageUploader",
                    "validation": {
                        "rule": {
                            "#text": true,
                            "@@name": "required-entry",
                            "@@xsi:type": "boolean"
                        }
                    }
                },
                "formElements": {
                    "imageUploader": {
                        "settings": {
                            "allowedExtensions": "jpg jpeg gif png",
                            "maxFileSize": 5242880,
                            "uploaderConfig": {
                                "param": {
                                    "#text": `${this.#backendUrlMeta.url}/upload`,
                                    "@@xsi:type": "string",
                                    "@@name": "url"
                                }
                            }
                        }
                    }
                },
                "@@name": columnDefine['@@name'],
                "@@formElement": "imageUploader"
            }
        }
        if (columnDefine['@@xsi:type'].includes("char") || columnDefine['@@xsi:type'] === 'int' || columnDefine['@@xsi:type'] === 'double') {
            const baseColumn = {
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
            };
            if (columnDefine['@@xsi:type'] === 'int') {
                baseColumn['settings']['validation']['rule'] = [
                    {
                        "#text": true,
                        "@@name": "required-entry",
                        "@@xsi:type": "boolean"
                    },
                    {
                        "#text": true,
                        "@@name": "integer",
                        "@@xsi:type": "boolean"
                    }
                ];
            }
            if (columnDefine['@@xsi:type'] === 'double') {
                baseColumn['settings']['validation']['rule'] = [
                    {
                        "#text": true,
                        "@@name": "required-entry",
                        "@@xsi:type": "boolean"
                    },
                    {
                        "#text": true,
                        "@@name": "number",
                        "@@xsi:type": "boolean"
                    }
                ];
            }
            return baseColumn;
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
                                "@@class": `${this.#moduleMeta.namespace}\\Ui\\Component\\Listing\\Column\\${MagentoCommons.underscore2hump(columnDefine['@@name'])}`
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
