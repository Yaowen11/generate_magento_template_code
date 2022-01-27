const fs = require('fs');
const path = require("path");
const {XMLParser, XMLBuilder} = require("fast-xml-parser/src/fxp")

class MagentoCommons {

    static createDirIfNotExists(dir) {
        try {
            fs.accessSync(dir, fs.constants.W_OK);
        } catch (err) {
            fs.mkdirSync(dir);
        }
    }

    static underscore2hump(underscoreString) {
        let humpString = '';
        underscoreString.split('_').forEach(words => {
            humpString += words[0].toUpperCase() + words.slice(1)
        });
        return humpString;
    }

    static magentoBackendUrlMeta(backendUrl) {
        const [route, controller] = backendUrl.split('/');
        return {
            url: backendUrl,
            route: route,
            controller: controller,
        }
    }

    static magentoModuleMeta(rootPath, moduleName) {
        const [magentoModuleName, packageName] = moduleName.split('_');
        return {
            name: moduleName,
            namespace: `${magentoModuleName}\\${packageName}`,
            realPath: path.join(rootPath, 'app', 'code', magentoModuleName, packageName),
            moduleName: magentoModuleName,
            packageName: packageName,
        }
    }

    static magentoModelMeta(tableName, moduleMeta) {
        const modelName = this.underscore2hump(tableName);
        const modelNamespace = `${moduleMeta.namespace}\\Model`;
        const modelVariable = '$' + modelName[0].toLowerCase() + modelName.slice(1);
        const modelPath = path.join(moduleMeta.realPath, 'Model');
        return {
            name: modelName,
            namespace: modelNamespace,
            variable: modelVariable,
            path:  modelPath,
            useName: `use ${modelNamespace}\\${modelName}`,

            resourceName: modelName,
            resourcePath: path.join(moduleMeta.realPath, 'Model', 'ResourceModel'),
            resourceNamespace: `${modelNamespace}\\ResourceModel`,
            resourceVariable: `$resource${modelName}`,
            resourceUseName: `use ${modelNamespace}\\ResourceModel\\${modelName} as Resource${modelName}`,

            collectionName: 'Collection',
            collectionPath: path.join(moduleMeta.realPath, 'Model', 'ResourceModel', modelName),
            collectionNamespace: `${modelNamespace}\\ResourceModel\\${modelName}`,
            collectionFactory: `CollectionFactory`,
            collectionUseName: `use ${modelNamespace}\\ResourceModel\\${modelName}\\Collection`,

            repositoryName: `${modelName}Repository`,
            repositoryPath: modelPath,
            repositoryNamespace: modelNamespace,
            repositoryVariable: `${modelVariable}Repository`,
            repositoryUseName: `use ${modelNamespace}\\${modelName}Repository`
        }
    }

    static asyncWriteFile(fileName, content) {
        fs.writeFile(fileName, content, err => {
            if (err) {
                console.log(`async ${fileName} error}`);
                throw err;
            } else {
                console.log(`async write ${fileName} done`);
            }
        })
    }

    static ifFileNotExistsAsyncWriteFile(fileName, content) {
        fs.access(fileName, (err, stat) => {
            if (err) {
                this.asyncWriteFile(fileName, content);
            }
        });
    }

    static getXmlParser() {
        return new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@@",
            allowBooleanAttributes: true,
        });
    }

    static getXmlBuilder() {
        return new XMLBuilder({
            ignoreAttributes: false,
            attributeNamePrefix: "@@",
            suppressEmptyNode: true,
            suppressBooleanAttributes: false,
            format: true
        });
    }

    static magentoSchemaXmlTableMeta(dbSchemaXml, tableName) {
        const data = fs.readFileSync(dbSchemaXml, 'utf8');
        const xmlParser = this.getXmlParser();
        const schemaJson = xmlParser.parse(data);
        if ('table' in schemaJson.schema) {
            let tableDefine = {};
            if (Array.isArray(schemaJson.schema.table)) {
                for (let tableDefineObject of schemaJson.schema.table) {
                    if (tableDefineObject['@@name'] === tableName) {
                        tableDefine = tableDefineObject;
                        break;
                    }
                }
            } else {
                if (schemaJson.schema.table['@@name'] === tableName) {
                    tableDefine = schemaJson.schema.table;
                }
            }
            if (Object.keys(tableDefine).length === 0) {
                throw new Error('no such file db_schema.xml');
            }
            let tablePrimaryKeyColumn = '';

            try {
                if (Array.isArray(tableDefine.constraint)) {
                    for (let constraint of tableDefine.constraint) {
                        if (constraint['@@referenceId'] === 'PRIMARY') {
                            tablePrimaryKeyColumn = constraint.column['@@name'] ?? 'id';
                            break;
                        }
                    }
                } else {
                    if (tableDefine.constraint['@@referenceId'] === 'PRIMARY') {
                        tablePrimaryKeyColumn = tableDefine.constraint.column['@@name'] || 'id';
                    }
                }
                const tableMeta = {
                    name: tableName,
                    column: tableDefine.column,
                    primaryKey: tablePrimaryKeyColumn,
                }
                if ('constraint' in tableDefine) {
                    tableMeta.constraint = tableDefine.constraint
                }
                if ('index' in tableDefine) {
                    tableMeta.index = tableDefine.index;
                }
                return tableMeta;
            } catch (e) {
                throw new Error('table not define primary key constraint')
            }
        } else {
            throw new Error('no such file db_schema.xml');
        }
    }

    static magentoTableMetaByTableXml(tableXmlString) {
        const xmlParser = this.getXmlParser();
        const tableJson = xmlParser.parse(tableXmlString)
        let tablePrimaryKeyColumn;
        if (Array.isArray(tableJson.table.constraint)) {
            for (let constraint of tableJson.table.constraint) {
                if (constraint['@@referenceId'] === 'PRIMARY') {
                    tablePrimaryKeyColumn = constraint.column['@@name'] ?? 'id';
                    break;
                }
            }
        } else {
            if (tableJson.table.constraint['@@referenceId'] === 'PRIMARY') {
                tablePrimaryKeyColumn = tableJson.table.constraint.column['@@name'] || 'id';
            }
        }
        const tableMeta = {
            name: tableJson.table['@@name'],
            column: tableJson.table['column'],
            primaryKey: tablePrimaryKeyColumn
        };
        if ('constraint' in tableJson) {
            tableMeta.constraint = tableJson.constraint;
        }
        if ('index' in tableJson) {
            tableMeta.index = tableJson.index;
        }
        return tableMeta;
    }

    static syncRecursionCreateDir(dir) {
        const dirParse = path.parse(dir);
        let dirs;
        let rootPath;
        if (dirParse.root !== '') {
            rootPath = dirParse.root;
            dirs = dirParse.dir.substr(rootPath.length).split(path.sep);
        } else {
            rootPath = __dirname;
            dirs = dirParse.dir.split(path.sep);
        }
        for (let subPath of dirs) {
            rootPath = path.join(rootPath, subPath);
            try {
                if (!fs.statSync(rootPath).isDirectory()) {
                    fs.mkdirSync(rootPath);
                }
            } catch (err) {
                fs.mkdirSync(rootPath);
            }
        }

    }
}

module.exports = MagentoCommons
