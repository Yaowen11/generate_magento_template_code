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

    buildMenuXml(item) {
        const initMenuXmlContent = `<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Backend:etc/menu.xsd">
    <menu>
    </menu>
</config>`
        const etcAdminhtml = path.join(this.etcPath, 'adminhtml');
        MagentoCommons.createDirIfNotExists(etcAdminhtml);
        const initPromise = new Promise(function (resolve, reject) {
            MagentoCommons.ifFileNotExistsAsyncWriteFile(path.join(etcAdminhtml, 'menu.xml'), initMenuXmlContent);
            resolve();
        });
        initPromise.then(() => {
            if (item) {
                const menu = {};

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
        const schemaContent = this.xmlParser.parse(fs.readFileSync(this.dbSchemaXml));
        const newTableNode = [tableNode];
        if ('table' in schemaContent.schema) {
            if (Array.isArray(schemaContent.schema.table)) {
                newTableNode.push(...schemaContent.schema.table);
            } else {
                newTableNode.push(schemaContent.schema.table);
            }
        }
        schemaContent.schema.table = newTableNode;
        this.flushDbSchemaWhitelistJson(newTableNode);
        // delete schemaContent['#text'];
        // const xmlContent = this.xmlBuilder.build(schemaContent);
        // const dbSchemaXmlFile = this.dbSchemaXml;
        // MagentoCommons.asyncWriteFile(dbSchemaXmlFile, xmlContent);
    }

    flushDbSchemaWhitelistJson(tables) {
        const dbSchemaWhitelistJsonContent = {};
        console.log(tables);
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
