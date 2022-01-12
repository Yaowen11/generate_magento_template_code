const fs = require('fs');
const path = require("path");
const os = require("os");

function hump(underscoreString) {
    let humpString = '';
    underscoreString.split('_').forEach(words => {
        humpString += words[0].toUpperCase() + words.slice(1)
    });
    return humpString;
}

function createDirIfNotExists(dirPath) {
    try {
        fs.accessSync(dirPath, fs.constants.W_OK);
    } catch (err) {
        fs.mkdirSync(dirPath);
    }
}

async function buildMagentoModuleAbsolutePath(rootPath, moduleName) {
    const magentoRootAbsolutePath = path.join(rootPath, 'app', 'code');
    const modulePath = path.join(magentoRootAbsolutePath, ...moduleName.toString().split('_'));
    const moduleExists = await fs.promises.readFile(path.join(modulePath, 'etc', 'module.xml'), {encoding: 'utf8'}).then(data => {
        return data.includes('name="' + moduleName + '"');
    })
    if (moduleExists) {
        return Promise.resolve(modulePath);
    }
    return Promise.reject('module not exists');
}

function writeMagentoFile(magentoFile, content) {
    fs.writeFile(magentoFile, content, (err) => {
        if (err) {
            throw err;
        }
    });
}

function tableMeta(modulePath, tableName) {
    const schemaXml = path.join(modulePath, 'etc', 'db_schema.xml');
    return fs.promises.readFile(schemaXml).then(data => {
        const lines = data.toString().split(os.EOL);
        const tableDefineStart = `<table name="${tableName}">`;
        const tableDefineEnd = `</table>`;
        let tableDefineStartLineNumber = 0;
        let tableDefineEndLineNumber = 0;
        for (const index in lines) {
            if (lines[index].includes(tableDefineStart)) {
                tableDefineStartLineNumber = index;
                continue;
            }
            if (lines[index].includes(tableDefineEnd)) {
                tableDefineEndLineNumber = index;
            }
            if (tableDefineStartLineNumber > 0 && tableDefineEndLineNumber > tableDefineStartLineNumber) {
                break;
            }
        }
        tableDefineStartLineNumber++;
        const tableDefineNodes = lines.slice(tableDefineStartLineNumber, tableDefineEndLineNumber);
        return Promise.resolve(parseMagentoDefineTableXmlNodes(tableDefineNodes, tableName));
    }).catch(() => {
        return Promise.reject('magento table define schema.xml not exists')
    })
}

function parseColumnNode(columnNode) {
    const columnJson = {};
    columnNode.trim().slice(7, -2).split(' ').filter(item => {
        return item !== '';
    }).forEach(columnPropertyValue => {
        let [property, value] = columnPropertyValue.split('=');
        if (property === 'xsi:type') {
            property = 'type';
        }
        columnJson[property] = value.slice(1, -1);
    });
    return columnJson;
}

function parseMagentoDefineTableXmlNodes(tableDefineNodes, tableName) {
    const tableColumns = [];
    const tableConsts = [];
    let tablePrimaryDefineStart = 0;
    let tablePrimaryDefineEnd = 0;
    for (const index in tableDefineNodes) {
        if (tableDefineNodes[index].includes(`<column`)) {
            tableColumns.push(tableDefineNodes[index]);
            if (tableDefineNodes[index].includes('tinyint')
                && (tableDefineNodes[index].includes('comment') &&
                    tableDefineNodes[index].includes('0:') && tableDefineNodes[index].includes('1:'))) {
                tableConsts.push(tableDefineNodes[index]);
            }
            continue;
        }
        if (tableDefineNodes[index].includes(`<constraint xsi:type="primary"`)) {
            tablePrimaryDefineStart = index;
            continue;
        }
        if (tableDefineNodes[index].includes(`</constraint>`)) {
            tablePrimaryDefineEnd = index;
            break
        }
    }
    const tablePrimaryColumns = tableDefineNodes.slice(++tablePrimaryDefineStart, tablePrimaryDefineEnd);
    const tableMeta = {
        name: tableName,
        column: new Map(),
        primary: {},
        consts: new Map()
        
    };
    tableColumns.forEach(column => {
        const columnMeta = parseColumnNode(column);
        if (!tableMeta.column.has(columnMeta.name)) {
            tableMeta.column.set(columnMeta.name, columnMeta);
        }
    })
    tablePrimaryColumns.forEach(column => {
        const primaryColumnJson = parseColumnNode(column);
        tableMeta.primary.name = primaryColumnJson.name;
        tableMeta.primary.type = primaryColumnJson.type;
    });
    tableConsts.forEach(column => {
        const columnMeta = parseColumnNode(column);
        const defines = {}
        columnMeta['comment'].split(',').map(valueName => {
            const [value, name] = valueName.split(':');
            defines[name.toUpperCase() + '_' + columnMeta.name.toUpperCase()] = value;
        })
        if (!tableMeta.consts.has(columnMeta.name)) {
            tableMeta.consts.set(columnMeta.name, defines);
        }
    })
    return tableMeta;
}

async function moduleMeta(rootPath, moduleName) {
    return {
        name: moduleName,
        namespace: moduleName.replace('_', '\\') + '\\',
        path: await buildMagentoModuleAbsolutePath(rootPath, moduleName),
    }
}



exports.hump = hump;
exports.createDirIfNotExists = createDirIfNotExists;
exports.writeMagentoFile = writeMagentoFile;
exports.tableMeta = tableMeta;
exports.moduleMeta = moduleMeta;