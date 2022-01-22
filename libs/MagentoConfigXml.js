const path = require('path');
const {XMLParser, XMLBuilder, XMLValidator} = require("fast-xml-parser/src/fxp")
const fs = require("fs");
const MagentoCommons = require("./MagentoCommons");

class MagentoConfigXml {

    constructor(magentoModuleMeta) {
        this.moduleMeta = magentoModuleMeta;
        this.etcPath = path.join(this.moduleMeta.realPath, 'etc');
        this.etcAdminhtmlPath = path.join(this.moduleMeta.realPath, 'etc', 'adminhtml');
        MagentoCommons.createDirIfNotExists(this.etcAdminhtmlPath);
        this.etcFrontendPath = path.join(this.moduleMeta.realPath, 'etc', 'frontend');
        MagentoCommons.createDirIfNotExists(this.etcFrontendPath);
        this.xmlParser = MagentoCommons.getXmlParser();
        this.xmlBuilder = MagentoCommons.getXmlBuilder();
    }

    buildAclXml(item) {
        const initAclXmlContent = `<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="urn:magento:framework:Acl/etc/acl.xsd">
    <acl>
        <resources>
            <resource id="Magento_Backend::admin">               
            </resource>
        </resources>
    </acl>
</config>`
        const aclXmlFile = path.join(this.etcPath, 'acl.xml');
    }

    async buildDbSchemaXml(tableNode) {
        if (!tableNode) {
            return;
        }
        const dbSchemaXmlFile = path.join(this.etcPath, 'db_schema.xml');
        const data = await fs.promises.readFile(dbSchemaXmlFile, 'utf8').then((data) => {
            return data;
        }).catch(() => {
            return `<?xml version="1.0"?>
<schema xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Setup/Declaration/Schema/etc/schema.xsd">
</schema>
`;
        })
        const schemaContent = this.xmlParser.parse(data);
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
        MagentoCommons.asyncWriteFile(dbSchemaXmlFile, this.xmlBuilder.build(schemaContent));
        this.flushDbSchemaWhitelistJson(newTableNode);
    }

    /**
     * @param {{"@@title": string, "@@id": string, "@@translate": string, "@@module": string, "@@resource": string, "@@parent": string}} addItem
     */
    buildAdminhtmlMenuXml(addItem) {
        if (!addItem) {
            return
        }
        const initMenuXmlContent = `<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Backend:etc/menu.xsd">
    <menu>
    </menu>
</config>`
        const menuXml = path.join(this.etcAdminhtmlPath, 'menu.xml');
        fs.readFile(menuXml, (err, data) => {
            if (err) {
                data = initMenuXmlContent;
            }
            const menuContent = this.xmlParser.parse(data);
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
            MagentoCommons.asyncWriteFile(menuXml, this.xmlBuilder.build(menuContent));
        });
    }

    /**
     * @param {{type:string,content:{}}}item
     * @returns {Promise<void>}
     */
    async buildDiXml(item) {
        const diConfigTypes = ['type', 'virtualType', 'preference'];
        if (!item || !item.content || !item.type || !diConfigTypes.includes(item.type)) {
            return;
        }
        const diXml = path.join(this.etcPath, 'di.xml');
        const initDiXml = `<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="urn:magento:framework:ObjectManager/etc/config.xsd">
</config>
`
        const diXmlContent = await fs.promises.readFile(diXml, 'utf8').then(data => data).catch(() => initDiXml);
        const diJsonContent = this.xmlParser.parse(diXmlContent);
        console.log(diJsonContent.config.type[0]);
        console.log(diJsonContent.config.type[0].arguments.argument.item);
        let typeContent;
        if (item.type in diJsonContent.config) {
            if (Array.isArray(diJsonContent.config[item.type])) {
                typeContent = Array.of(item.content,...diJsonContent.config[item.type]);
            } else {
                typeContent = Array.of(diJsonContent.config[item.type], item.content);
            }
        } else {
            typeContent = item.content;
        }
        diJsonContent.config[item.type] = typeContent;
        const xmlContent = this.xmlBuilder.build(diJsonContent);
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
        const adminhtmlSystemXml = path.join(this.etcAdminhtmlPath, 'system.xml');
        const systemData = await fs.promises.readFile(adminhtmlSystemXml).then(data => data).catch(() => initSystemXml);
        const systemXmlParseJson = this.xmlParser.parse(systemData);
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
        console.log(this.xmlBuilder.build(systemXmlParseJson));
    }

    flushDbSchemaWhitelistJson(tables) {
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
                        constraints[constraintDefine.referenceId] = true;
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
                        indexes[indexDefine.referenceId] = true;
                    }
                    dbSchemaWhitelistJsonContent[table.name]['index'] = indexes;
                }
            }
        }
        const dbSchemaWhitelistJson = path.join(this.moduleMeta.realPath, 'etc', 'db_schema_whitelist.json');
        MagentoCommons.asyncWriteFile(dbSchemaWhitelistJson, JSON.stringify(dbSchemaWhitelistJsonContent, null, 4));

    }
}

module.exports = MagentoConfigXml;
