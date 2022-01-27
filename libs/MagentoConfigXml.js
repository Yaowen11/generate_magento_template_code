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
        this.#buildAdminhtmlMenuXml(menuModuleManItem);
        const controllerMenuItem = {
            '@@id': `${this.#moduleMeta.name}::${gridUrlMeta.controller}`,
            '@@title': `${this.#moduleMeta.name.replace('_', ' ')} ${gridUrlMeta.controller.substr(0, 1).toUpperCase()}${gridUrlMeta.controller.slice(1)}`,
            '@@translate': 'title',
            '@@module': this.#moduleMeta.name,
            '@@parent': menuModuleManItem["@@id"],
            '@@action': `${gridUrlMeta.url}/index`,
            '@@resource': `${this.#moduleMeta.name}::${gridUrlMeta.controller}`,
        };
        this.#buildAdminhtmlMenuXml(controllerMenuItem);
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
        this.#buildDiXml(collectionFactoryType).catch(err => {
            throw err;
        });
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
        this.#buildDiXml(collectionVirtualType).catch(err => {
            throw err;
        })
        if (imageColumn) {
            const uploadVirtualTypeName = `${imageColumn.substr(0).toUpperCase()}${imageColumn.slice(1)}ImageUploader`;
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
            this.#buildDiXml(uploaderVirtualType).catch(err => {
                throw err;
            });
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
            this.#buildDiXml(imageUploadType).catch(err => {
                throw err;
            });
        }
    }

    #buildAclXml(item) {
        const etcPath = path.join(this.#moduleMeta.realPath, 'etc');
        MagentoCommons.createDirIfNotExists(etcPath);
        const aclXmlFile = path.join(etcPath, 'acl.xml');
        fs.readFile(aclXmlFile, (err, data) => {
            if (err) {
                data = {
                    "?xml": {
                        "@@version": "1.0"
                    },
                    "config": {
                        "@@xmlns:xis": "http://www.w3.org/2001/XMLSchema-instance",
                        "@@xsi:noNamespaceSchemaLocation": "urn:magento:framework:Acl/etc/acl.xsd",
                        "acl": {
                            "resources": {
                                'resource': item
                            }
                        }
                    }
                };
            } else {
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
        MagentoCommons.createDirIfNotExists(etcPath);
        const dbSchemaXmlFile = path.join(etcPath, 'db_schema.xml');
        const data = await fs.promises.readFile(dbSchemaXmlFile, 'utf8').then((data) => {
            return data;
        }).catch(() => {
            return `<?xml version="1.0"?>
<schema xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Setup/Declaration/Schema/etc/schema.xsd">
</schema>
`;
        })
        const schemaContent = this.#xmlParser.parse(data);
        const newTableNode = [];
        if ('table' in schemaContent.schema) {
            if (Array.isArray(schemaContent.schema.table)) {
                newTableNode.push(...schemaContent.schema.table);
            } else {
                newTableNode.push(schemaContent.schema.table);
            }
        }
        newTableNode.push(tableNode);
        const tableMap = new Map();
        for (let tableDefine of newTableNode) {
            tableMap.set(tableDefine.name, tableDefine);
        }
        schemaContent.schema.table = Array.from(tableMap.values());
        MagentoCommons.asyncWriteFile(dbSchemaXmlFile, this.#xmlBuilder.build(schemaContent));
        this.#flushDbSchemaWhitelistJson(newTableNode);
    }

    /**
     * @param {{"@@title": string, "@@id": string, "@@translate": string, "@@module": string, "@@resource": string, "@@parent": string}} addItem
     */
    #buildAdminhtmlMenuXml(addItem) {
        if (!addItem) {
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
            if (err) {
                data = initMenuXmlContent;
            }
            const menuContent = this.#xmlParser.parse(data);
            const originMenu = menuContent['config']['menu'];
            if (originMenu === '') {
                menuContent['config']['menu'] = {};
                menuContent['config']['menu']['add'] = addItem;
            } else {
                const originAddItem = menuContent.config['menu']['add'];
                console.log(originAddItem);
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
                if (!addItemMap.has(addItem['@@id'])) {
                    addItemMap.set(addItem['@@id'], addItem);
                }
                menuContent['config']['menu']['add'] = Array.from(addItemMap.values());
            }
            MagentoCommons.asyncWriteFile(menuXml, this.#xmlBuilder.build(menuContent));
        });
    }

    /**
     * @param {{type:string,content:{}}}item
     * @returns {Promise<void>}
     */
    async #buildDiXml(item) {
        const diConfigTypes = ['type', 'virtualType', 'preference'];
        if (!item || !item.content || !item.type || !diConfigTypes.includes(item.type)) {
            return;
        }
        const etcPath = path.join(this.#moduleMeta.realPath, 'etc');
        MagentoCommons.createDirIfNotExists(etcPath);
        const diXml = path.join(etcPath, 'di.xml');
        const initDiXml = `<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="urn:magento:framework:ObjectManager/etc/config.xsd">
</config>
`
        const diXmlContent = await fs.promises.readFile(diXml, 'utf8').then(data => data).catch(() => initDiXml);
        const diJsonContent = this.#xmlParser.parse(diXmlContent);
        console.log(diJsonContent.config.type[0]);
        console.log(diJsonContent.config.type[0].arguments.argument.item);
        let typeContent;
        if (item.type in diJsonContent.config) {
            if (Array.isArray(diJsonContent.config[item.type])) {
                typeContent = Array.of(item.content, ...diJsonContent.config[item.type]);
            } else {
                typeContent = Array.of(diJsonContent.config[item.type], item.content);
            }
        } else {
            typeContent = item.content;
        }
        diJsonContent.config[item.type] = typeContent;
        const xmlContent = this.#xmlBuilder.build(diJsonContent);
        MagentoCommons.asyncWriteFile(diXml, xmlContent);
    }

    async buildAdminhtmlSystemXml(item) {
        const initSystemXml = `<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Config:etc/system_file.xsd">
    <system>
    </system>
</config>
`
        const etcAdminhtmlPath = path.join(this.#moduleMeta.realPath, 'etc', 'adminhtml');
        MagentoCommons.syncRecursionCreateDir(etcAdminhtmlPath);
        const adminhtmlSystemXml = path.join(etcAdminhtmlPath, 'system.xml');
        const systemData = await fs.promises.readFile(adminhtmlSystemXml).then(data => data).catch(() => initSystemXml);
        const systemXmlParseJson = this.#xmlParser.parse(systemData);
        systemXmlParseJson.config.system.section = item;
        // let section;
        // if (systemXmlParseJson.config.system === '') {
        //     if (Array.isArray(systemXmlParseJson.config.system.section)) {
        //         section = Array.from(systemXmlParseJson.config.system.section);
        //     } else {
        //         section = Array.of(systemXmlParseJson.config.system.section);
        //     }
        // } else {
        //     console.log(systemXmlParseJson.config.system)
        // }
        console.log(systemXmlParseJson.config.system.section);
        console.log(this.#xmlBuilder.build(systemXmlParseJson));
    }

    #flushDbSchemaWhitelistJson(tables) {
        const dbSchemaWhitelistJsonContent = {};
        if (tables && Array.isArray(tables)) {
            for (let table of tables) {
                dbSchemaWhitelistJsonContent[table.name] = {};
                let columns = {};
                for (let columnDefine of table.column) {
                    columns[columnDefine.name] = true;
                }
                dbSchemaWhitelistJsonContent[table.name]['column'] = columns;
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
                    dbSchemaWhitelistJsonContent[table.name]['constraint'] = constraints;
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
                    dbSchemaWhitelistJsonContent[table.name]['index'] = indexes;
                }
            }
        }
        const dbSchemaWhitelistJson = path.join(this.#moduleMeta.realPath, 'etc', 'db_schema_whitelist.json');
        MagentoCommons.asyncWriteFile(dbSchemaWhitelistJson, JSON.stringify(dbSchemaWhitelistJsonContent, null, 4));
    }
}

module.exports = MagentoConfigXml;
