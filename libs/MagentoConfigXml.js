const path = require('path');
const MagentoCommons = require('./MagentoCommons');
const {XMLParser, XMLBuilder, XMLValidator} = require("fast-xml-parser/src/fxp")
const fs = require("fs");

class MagentoConfigXml {
    constructor(magentoModuleMeta) {
        this.moduleMeta = magentoModuleMeta;
        this.etcPath = path.join(this.moduleMeta.realPath, 'etc');
        this.dbSchemaXml = path.join(this.etcPath, 'db_schema.xml');
        this.aclXml = path.join(this.etcPath, 'acl.xml');
        this.diXml = path.join(this.etcPath, 'di.xml');
        this.xmlParser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "",
            allowBooleanAttributes: true,
        });
        this.xmlBuilder = new XMLBuilder({
            ignoreAttributes: false,
            attributeNamePrefix: "",
            suppressEmptyNode: true,
            suppressBooleanAttributes: false,
            format: true
        });
    }

    initDiXml() {
        const initDiXmlContent = `<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="urn:magento:framework:ObjectManager/etc/config.xsd">
</config>
`
        MagentoCommons.ifFileNotExistsAsyncWriteFile(this.diXml, initDiXmlContent);
    }

    initAclXml() {
        const initAclXmlContent = `<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="urn:magento:framework:Acl/etc/acl.xsd">
    <acl>
        <resources>
            <resource id="Magento_Backend::admin">               
            </resource>
        </resources>
    </acl>
</config>`
        MagentoCommons.ifFileNotExistsAsyncWriteFile(this.aclXml, initAclXmlContent);
    }

    initDbSchemaXml() {
        const dbSchemaContent = `<?xml version="1.0"?>
<schema xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Setup/Declaration/Schema/etc/schema.xsd">
</schema>
`
        MagentoCommons.ifFileNotExistsAsyncWriteFile(this.dbSchemaXml, dbSchemaContent);
    }

    buildMenuXml(addItem) {
        const initMenuXmlContent = `<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Backend:etc/menu.xsd">
    <menu>
    </menu>
</config>`
        const etcAdminhtml = path.join(this.etcPath, 'adminhtml');
        const menuXml = path.join(etcAdminhtml, 'menu.xml');
        MagentoCommons.createDirIfNotExists(etcAdminhtml);
        const initPromise = new Promise(function (resolve, reject) {
            MagentoCommons.ifFileNotExistsAsyncWriteFile(menuXml, initMenuXmlContent);
            resolve();
        });
        initPromise.then(() => {
            if (addItem) {
                fs.promises.readFile(menuXml).then(data => {
                    const menuContent = this.xmlParser.parse(data);
                    console.log(menuContent, menuContent['config']['menu']);
                    const originMenu = menuContent['config']['menu'];
                    if (originMenu === '') {
                        menuContent['config']['menu']['add'] = addItem;
                    } else {
                        const originAddItem = menuContent.config['menu']['add'];
                        const addItemMap = new Map();
                        if (Array.isArray(menuContent['config']['menu']['add'])) {
                            for (let addItem of originAddItem) {
                                if (!addItemMap.has(addItem.id)) {
                                    addItemMap.set(addItem.id, addItem);
                                }
                            }
                        } else {
                            addItemMap.set(menuContent['config']['menu']['add']['id'], menuContent['config']['menu']['add']);
                        }
                        if (!addItemMap.has(addItem.id)) {
                            addItemMap.set(addItem.id, addItem);
                        }
                        menuContent['config']['menu']['add'] = Array.from(addItemMap.values());
                    }
                    this.writeXml(menuXml, menuContent);
                })
            }
        })

    }

    appendDiXml(content) {

    }

    appendAclXml(content) {

    }

    appendDbSchemaXml(tableNode) {
        if (!tableNode) {
            return;
        }
        fs.promises.readFile(this.dbSchemaXml).then(data => {
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
            this.flushDbSchemaWhitelistJson(newTableNode);
            this.writeXml(this.dbSchemaXml, schemaContent);
        }).catch(err => {
            throw err;
        });
    }

    writeXml(xmlFile, jsonContent) {
        delete jsonContent['#text'];
        const xmlContent = this.xmlBuilder.build(jsonContent);
        MagentoCommons.asyncWriteFile(xmlFile, xmlContent);
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
