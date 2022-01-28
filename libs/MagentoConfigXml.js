const path = require('path');
const fs = require("fs");
const MagentoCommons = require("./MagentoCommons");

class MagentoConfigXml {

    #moduleMeta;

    #xmlParser;

    #xmlBuilder;

    constructor(moduleMeta) {
        this.#moduleMeta = moduleMeta;
        this.#xmlParser = MagentoCommons.getXmlParser();
        this.#xmlBuilder = MagentoCommons.getXmlBuilder();
    }

    buildAdminGridXml(gridUrlMeta, tableNode, imageColumn) {
        this.#buildDbSchemaXml(tableNode).catch(err => {
            throw err;
        });
        const menuModuleManItem = {
            '@@id': `${this.#moduleMeta.name}::main`,
            '@@title': `${this.#moduleMeta.name.replace('_', ' ')}`,
            '@@translate': 'title',
            '@@module': this.#moduleMeta.name,
            '@@parent': 'Magento_Backend::marketing',
            '@@resource': `${this.#moduleMeta.name}::main`
        };
        const controllerMenuItem = {
            '@@id': `${this.#moduleMeta.name}::${gridUrlMeta.controller}`,
            '@@title': `${this.#moduleMeta.name.replace('_', ' ')} ${gridUrlMeta.controller.substr(0, 1).toUpperCase()}${gridUrlMeta.controller.slice(1)}`,
            '@@translate': 'title',
            '@@module': this.#moduleMeta.name,
            '@@parent': menuModuleManItem["@@id"],
            '@@action': `${gridUrlMeta.url}/index`,
            '@@resource': `${this.#moduleMeta.name}::${gridUrlMeta.controller}`,
        };
        this.#buildAdminhtmlMenuXml(menuModuleManItem, controllerMenuItem);

        this.#buildAdminhtmlRoute(gridUrlMeta.route).catch(err => {
            throw err;
        })

        const gridResourceAcl = {
            '@@id': "Magento_Backend::admin",
            'resource': {
                '@@id': 'Magento_Backend::marketing',
                'resource': {
                    '@@id': menuModuleManItem["@@id"],
                    '@@title': menuModuleManItem['@@title'],
                    '@@translate': "title",
                    'resource': {
                        '@@id': controllerMenuItem['@@id'],
                        '@@title': controllerMenuItem['@@title'],
                        '@@translate': 'title'
                    }
                }
            }
        };
        this.#buildAclXml(gridResourceAcl);

        const collectionName = `${gridUrlMeta.route.substr(0, 1).toUpperCase()}${gridUrlMeta.route.slice(1)}`
        const collectionFactoryType = {
            type: "type",
            content: {
                '@@name': "Magento\\Framework\\View\\Element\\UiComponent\\DataProvider\\CollectionFactory",
                "arguments": {
                    "argument": {
                        '@@name': 'collections',
                        '@@xsi:type': 'array',
                        'item': {
                            '@@name': `${gridUrlMeta.route}_${gridUrlMeta.controller}_listing_data_source`,
                            '@@xsi:type': 'string',
                            '#text': `${gridUrlMeta.route}`
                        }
                    }
                }
            }
        };
        const collectionVirtualType = {
            type: "virtualType",
            content: {
                '@@name': collectionName,
                '@@type': "Magento\\Framework\\View\\Element\\UiComponent\\DataProvider\\SearchResult",
                "arguments": {
                    "argument": [
                        {
                            '@@name': 'mainTable',
                            '@@xsi:type': 'string',
                            '#text': tableNode.name,
                        },
                        {
                            '@@name': 'resourceModel',
                            '@@xsi:type': 'string',
                            '#text': `${this.#moduleMeta.namespace}\\Model\\ResourceModel\\${gridUrlMeta.route.substr(0, 1).toUpperCase()}${gridUrlMeta.route.slice(1)}\\${gridUrlMeta.controller.substr(0, 1).toUpperCase()}${gridUrlMeta.controller.slice(1)}`
                        }
                    ]
                }
            }
        }
        if (imageColumn) {
            const uploadVirtualTypeName = `${MagentoCommons.underscore2hump(imageColumn)}ImageUploader`;
            const uploaderVirtualType = {
                type: 'virtualType',
                content: {
                    '@@name': uploadVirtualTypeName,
                    '@@type': 'Magento\\Catalog\\Model\\ImageUploader',
                    'arguments': {
                        'argument': [
                            {
                                '@@name': 'baseTmpPath',
                                '@@xsi:type': 'string',
                                '#text': `${gridUrlMeta.route}/tmp/${gridUrlMeta.controller}`
                            },
                            {
                                '@@name': 'basePath',
                                '@@xsi:type': 'string',
                                '#text': `${gridUrlMeta.route}/base/${gridUrlMeta.controller}`
                            },
                            {
                                '@@name': 'allowedExtensions',
                                '@@xsi:type': 'array',
                                'item': [
                                    {'@@name': 'jpg', '@@xsi:type': 'string', '#text': 'jpg'},
                                    {'@@name': 'jpeg', '@@xsi:type': 'string', '#text': 'jpeg'},
                                    {'@@name': 'gif', '@@xsi:type': 'string', '#text': 'gif'},
                                    {'@@name': 'png', '@@xsi:type': 'string', '#text': 'png'}
                                ]
                            },
                            {
                                '@@name': 'allowedMimeTypes',
                                '@@xsi:type': 'array',
                                'item': [
                                    {'@@name': 'jpg', '@@xsi:type': 'string', '#text': 'image/jpg'},
                                    {'@@name': 'jpeg', '@@xsi:type': 'string', '#text': 'image/jpeg'},
                                    {'@@name': 'gif', '@@xsi:type': 'string', '#text': 'image/gif'},
                                    {'@@name': 'png', '@@xsi:type': 'string', '#text': 'image/png'}
                                ]
                            }
                        ]
                    }
                }
            };
            const imageUploadType = {
                type: 'type',
                content: {
                    '@@name': `${this.#moduleMeta.namespace}\\Controller\\Adminhtml\\${gridUrlMeta.controller.substr(0, 1)}${gridUrlMeta.controller.slice(1)}\\Upload`,
                    'arguments': {
                        'argument': {
                            '@@name': 'imageUploader',
                            '@@xsi:type': 'object',
                            '#text': uploadVirtualTypeName
                        }
                    }
                }
            }
            this.#buildDiXml(collectionFactoryType, collectionVirtualType, uploaderVirtualType, imageUploadType).catch(err => {
                throw err;
            });
        } else {
            this.#buildDiXml(collectionFactoryType, collectionVirtualType).catch(err => {
                throw err;
            });
        }
    }

    #buildAclXml(item) {
        const etcPath = path.join(this.#moduleMeta.realPath, 'etc');
        MagentoCommons.syncRecursionCreateDir(etcPath);
        const aclXmlFile = path.join(etcPath, 'acl.xml');
        fs.readFile(aclXmlFile, (err, data) => {
            if (err) {
                data = {
                    "?xml": {
                        "@@version": "1.0"
                    },
                    "config": {
                        "@@xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
                        "@@xsi:noNamespaceSchemaLocation": "urn:magento:framework:Acl/etc/acl.xsd",
                        "acl": {
                            "resources": {
                                'resource': item
                            }
                        }
                    }
                };
            } else {
                data = this.#xmlParser.parse(data);
                data['config']['acl']['resources'].push(item);
            }
            MagentoCommons.asyncWriteFile(aclXmlFile, this.#xmlBuilder.build(data));
        });
    }

    async #buildAdminhtmlRoute(route) {
        const etcAdminhtmlDir = path.join(this.#moduleMeta.realPath, 'etc', 'adminhtml');
        MagentoCommons.syncRecursionCreateDir(etcAdminhtmlDir);
        MagentoCommons.asyncWriteFile(path.join(etcAdminhtmlDir, 'routes.xml'), `<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:App/etc/routes.xsd">  
    <router id="admin">
        <route id="${route}" frontName="${route}">
            <module name="${this.#moduleMeta.name}" before="Magento_Backend"/>
        </route>
    </router>
</config>`)
    }

    async #buildDbSchemaXml(tableNode) {
        if (!tableNode) {
            return;
        }
        const etcPath = path.join(this.#moduleMeta.realPath, 'etc');
        MagentoCommons.syncRecursionCreateDir(etcPath);
        const dbSchemaXmlFile = path.join(etcPath, 'db_schema.xml');
        const initSchemaContent = `<?xml version="1.0"?>
<schema xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Setup/Declaration/Schema/etc/schema.xsd">
</schema>
`;
        const dbSchemaXmlData = await fs.promises.readFile(dbSchemaXmlFile, 'utf8').then((data) => {
            if (!data) {
                return initSchemaContent;
            }
            return data;
        }).catch(() => {
            return initSchemaContent;
        });
        const tableSchema = {
            '@@name': tableNode['name'],
            'column': tableNode['column']
        };
        if ('constraint' in tableNode) {
            tableSchema['constraint'] = tableNode['constraint'];
        }
        if ('index' in tableNode) {
            tableSchema['index'] = tableNode['index'];
        }
        const schemaContent = this.#xmlParser.parse(dbSchemaXmlData);
        const newTableNode = [];
        if ('table' in schemaContent.schema) {
            if (Array.isArray(schemaContent.schema.table)) {
                newTableNode.push(...schemaContent.schema.table);
            } else {
                newTableNode.push(schemaContent.schema.table);
            }
        }
        newTableNode.push(tableSchema);
        const tableMap = new Map();
        for (let tableDefine of newTableNode) {
            tableMap.set(tableDefine.name, tableDefine);
        }
        if (newTableNode.size === 1) {
            schemaContent.schema.table = tableMap.values();
        } else {
            schemaContent.schema.table = Array.from(tableMap.values());
        }
        MagentoCommons.asyncWriteFile(dbSchemaXmlFile, this.#xmlBuilder.build(schemaContent));
        this.#flushDbSchemaWhitelistJson(newTableNode);
    }

    #buildAdminhtmlMenuXml(...addItems) {
        if (!addItems) {
            return
        }
        const initMenuXmlContent = `<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Backend:etc/menu.xsd">
    <menu>
    </menu>
</config>`
        const adminhtmlDir = path.join(this.#moduleMeta.realPath, 'etc', 'adminhtml');
        MagentoCommons.syncRecursionCreateDir(adminhtmlDir);
        const menuXml = path.join(adminhtmlDir, 'menu.xml');
        fs.readFile(menuXml, (err, data) => {
            if (err || !data) {
                data = initMenuXmlContent;
            }
            const menuContent = this.#xmlParser.parse(data);
            const originMenu = menuContent['config']['menu'];
            if (originMenu === '') {
                menuContent['config']['menu'] = {};
                if (addItems.length > 1) {
                    menuContent['config']['menu']['add'] = Array.from(addItems);
                } else {
                    menuContent['config']['menu']['add'] = addItems;
                }
            } else {
                const originAddItem = menuContent.config['menu']['add'];
                const addItemMap = new Map();
                if (Array.isArray(menuContent['config']['menu']['add'])) {
                    for (let addItem of originAddItem) {
                        if (!addItemMap.has(addItem['@@id'])) {
                            addItemMap.set(addItem['@@id'], addItem);
                        }
                    }
                } else {
                    addItemMap.set(menuContent['config']['menu']['add']['@@id'], menuContent['config']['menu']['add']);
                }
                for (let inputAddItem of addItems) {
                    if (!addItemMap.has(inputAddItem['@@id'])) {
                        addItemMap.set(inputAddItem['@@id'], inputAddItem);
                    }
                }
                menuContent['config']['menu']['add'] = Array.from(addItemMap.values());
            }
            MagentoCommons.asyncWriteFile(menuXml, this.#xmlBuilder.build(menuContent));
        });
    }

    async #buildDiXml(...items) {
        if (!items) {
            return;
        }
        const diConfigTypes = ['type', 'virtualType', 'preference'];
        const etcPath = path.join(this.#moduleMeta.realPath, 'etc');
        MagentoCommons.syncRecursionCreateDir(etcPath);
        const diXml = path.join(etcPath, 'di.xml');
        const initDiXml = `<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="urn:magento:framework:ObjectManager/etc/config.xsd">
</config>
`
        const diXmlContent = await fs.promises.readFile(diXml, 'utf8').then(data => data).catch(() => initDiXml);
        const diJsonContent = this.#xmlParser.parse(diXmlContent);
        for (let item of items) {
            if (item.type in diJsonContent.config) {
                if (Array.isArray(diJsonContent.config[item.type])) {
                    diJsonContent.config[item.type] = Array.of(item.content, ...diJsonContent.config[item.type]);
                } else {
                    diJsonContent.config[item.type] = Array.of(diJsonContent.config[item.type], item.content);
                }
            } else {
                diJsonContent.config[item.type] = item.content;
            }
        }
        const xmlContent = this.#xmlBuilder.build(diJsonContent);
        MagentoCommons.asyncWriteFile(diXml, xmlContent);
    }

    #flushDbSchemaWhitelistJson(tables) {
        const dbSchemaWhitelistJsonContent = {};
        for (let table of tables) {
            dbSchemaWhitelistJsonContent[table['@@name']] = {};
            let columns = {};
            for (let columnDefine of table.column) {
                columns[columnDefine['@@name']] = true;
            }
            dbSchemaWhitelistJsonContent[table['@@name']]['column'] = columns;
            if ('constraint' in table) {
                let constraintDefines = [];
                if (Array.isArray(table.constraint)) {
                    constraintDefines.push(...table.constraint);
                } else {
                    constraintDefines.push(table.constraint);
                }
                let constraints = {};
                for (let constraintDefine of constraintDefines) {
                    constraints[constraintDefine["@@referenceId"]] = true;
                }
                dbSchemaWhitelistJsonContent[table['@@name']]['constraint'] = constraints;
            }
            if ('index' in table) {
                let indexDefines = [];
                if (Array.isArray(table.index)) {
                    indexDefines.push(...table.index);
                } else {
                    indexDefines.push(table.index);
                }
                let indexes = {};
                for (let indexDefine of indexDefines) {
                    indexes[indexDefine["@@referenceId"]] = true;
                }
                dbSchemaWhitelistJsonContent[table['@@name']]['index'] = indexes;
            }
        }
        const dbSchemaWhitelistJson = path.join(this.#moduleMeta.realPath, 'etc', 'db_schema_whitelist.json');
        MagentoCommons.asyncWriteFile(dbSchemaWhitelistJson, JSON.stringify(dbSchemaWhitelistJsonContent, null, 4));
    }
}

module.exports = MagentoConfigXml;
