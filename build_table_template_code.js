const path = require("path");
const fsPromise = require('fs/promises');
const os = require("os");
const fs = require('fs');

const tableName = process.argv[2];
const magentoModule = process.argv[3];
const magentoRootPath = process.argv[4] ?? __dirname;
const magentoModulesAbsolutePath = path.join(magentoRootPath, 'app', 'code');
const magentoModelName = hump(tableName);

let magentoModuleBaseNamespace = magentoModule.replace('_', '\\') + '\\';

function hump(underscoreString) {
    let humpString = '';
    underscoreString.split('_').forEach(words => {
        humpString += words[0].toUpperCase() + words.slice(1)
    });
    return humpString;
}

async function buildMagentoModuleAbsolutePath(magentoModuleName) {
    const modulePath = path.join(magentoModulesAbsolutePath, ...magentoModuleName.toString().split('_'));
    const valid = await validatePackage(modulePath, magentoModuleName);
    if (valid) {
        return Promise.resolve(modulePath);
    }
    return Promise.reject('magento module not found');
}

async function validatePackage(packagePath, magentoModuleName) {
    const moduleXmlFile = path.join(packagePath, 'etc', 'module.xml');
    const moduleXmlIsFile = await fsPromise.stat(moduleXmlFile).then((stat) => {
        return stat.isFile();
    });
    if (moduleXmlIsFile) {
        return await fsPromise.readFile(moduleXmlFile, {encoding: "ascii"}).then(data => {
            return data.includes('name="' + magentoModuleName + '"');
        })
    }
    return false;
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

function parseMagentoTable(tableDefineNodes) {
    const tableColumns = [];
    let tablePrimaryDefineStart = 0;
    let tablePrimaryDefineEnd = 0;
    for (const index in tableDefineNodes) {
        if (tableDefineNodes[index].includes(`<column`)) {
            tableColumns.push(tableDefineNodes[index]);
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
    const tableDefineJson = {
        column: new Map(),
        primary: new Map(),
    };
    tableColumns.forEach(column => {
        const columnJson = parseColumnNode(column);
        if (!tableDefineJson.column.has(columnJson.name)) {
            tableDefineJson.column.set(columnJson.name, columnJson);
        }
    })
    tablePrimaryColumns.forEach(column => {
        const primaryColumnJson = parseColumnNode(column);
        tableDefineJson.primary.set(primaryColumnJson.name, primaryColumnJson);
    });
    return tableDefineJson;
}

async function parseMagentoDefineTable(magentoModuleName, tableName) {
    const packagePath = await buildMagentoModuleAbsolutePath(magentoModuleName);
    const schemaXml = path.join(packagePath, 'etc', 'db_schema.xml');
    const schemaXmlExists = await fsPromise.stat(schemaXml).then(stat => {
        return stat.isFile();
    });
    if (schemaXmlExists) {
        return {
            'tableDefine': await fsPromise.readFile(schemaXml).then(data => {
                const lines = data.toString().split(os.EOL);
                const tableStart = `<table name="${tableName}">`;
                const tableEnd = `</table>`
                let tableStartLineNumber = 0;
                let tableEndLineNumber = 0;
                for (const index in lines) {
                    if (lines[index].includes(tableStart)) {
                        tableStartLineNumber = index;
                        continue;
                    }
                    if (lines[index].includes(tableEnd)) {
                        tableEndLineNumber = index;
                    }
                    if (tableStartLineNumber > 0 && tableEndLineNumber > tableStartLineNumber) {
                        break;
                    }
                }
                tableStartLineNumber++;
                return parseMagentoTable(lines.slice(tableStartLineNumber, tableEndLineNumber));
            }),
            'packagePath': packagePath
        }
    }
    throw new Error('parse magento table error');
}

function buildMagentoFile(tableDefineJson) {
    const modelDir = path.join(tableDefineJson.packagePath, 'Model');
    createDirIfNotExists(modelDir);
    buildMagentoModel(modelDir, tableDefineJson.tableDefine.column);
    buildMagentoRepository(modelDir, tableDefineJson.tableDefine);

    const resourceModelDir = path.join(modelDir, 'ResourceModel');
    createDirIfNotExists(resourceModelDir);
    buildMagentoResourceModel(resourceModelDir, tableDefineJson.tableDefine.primary);

    const collectionModelDir = path.join(resourceModelDir, magentoModelName);
    createDirIfNotExists(collectionModelDir)
    buildMagentoResourceCollection(collectionModelDir);
}

function buildMagentoModel(modelDir, columns) {
    const modelFile = path.join(modelDir, magentoModelName + '.php');
    let modelContent = `<?php

namespace ${magentoModuleBaseNamespace}\Model;

use Magento\\Framework\\Model\\AbstractModel;
use ${magentoModuleBaseNamespace}\Model\\ResourceModel\\${magentoModelName} as Resource${magentoModelName};

/**
`;
    columns.forEach((value, key, map) => {
        const type = (value.type.includes('int') ? 'int' : 'string');
        const columnName = hump(key);
        modelContent += ' * @method ' + type + ' get' + columnName + '();' + os.EOL;
        modelContent += ' * @method void set' + columnName + '(' + type + ' $value)' + ');' + os.EOL;
    })
    modelContent += ' */' + os.EOL;
    modelContent += `class ${magentoModelName} extends AbstractModel
{
    protected function _construct() 
    {
        $this->_init(Resource${magentoModelName}::class);
    }
}
`
    fs.writeFile(modelFile, modelContent, (err) => {
        if (err) {
            console.log(err)
        }
    });
}

function buildMagentoResourceModel(resourceModelDir, primaryColumns) {
    const resourceModelFile = path.join(resourceModelDir, magentoModelName + '.php');
    let idFieldName = '';
    primaryColumns.forEach((value, key, map) => {
        idFieldName = key;
    })
    let resourceModelContent = `<?php

namespace ${magentoModuleBaseNamespace}\Model\\ResourceModel;

use Magento\\Framework\\Model\\ResourceModel\\Db\\AbstractDb;

class ${magentoModelName} extends AbstractDb
{
    protected function _construct()
    {
        $this->_init('${tableName}', '${idFieldName}');
    }
}
`
    fs.writeFile(resourceModelFile, resourceModelContent, (err) => {
        if (err) {
            console.log(err)
        }
    });
}

function buildMagentoResourceCollection(collectionDir) {
    const collectionFile = path.join(collectionDir, 'Collection.php');
    const collectionContent = `<?php

namespace ${magentoModuleBaseNamespace}\Model\\ResourceModel\\${magentoModelName};

use Magento\\Framework\\Model\\ResourceModel\\Db\\Collection\\AbstractCollection;
use ${magentoModuleBaseNamespace}\Model\\${magentoModelName};
use ${magentoModuleBaseNamespace}\Model\\ResourceModel\\${magentoModelName} as Resource${magentoModelName};

class Collection extends AbstractCollection
{
    protected function _construct()
    {
        $this->_init(${magentoModelName}::class, Resource${magentoModelName}::class);
    }
}
`
    fs.writeFile(collectionFile, collectionContent, (err) => {
        if (err) {
            console.log(err)
        }
    });
}

function buildMagentoRepository(repositoryDir, tableDefine) {
    const repositoryFile = path.join(repositoryDir, magentoModelName + 'Repository.php');
    let idFieldName = '';
    tableDefine.primary.forEach((value, key, map) => {
        idFieldName = key;
    })
    let idFieldType = tableDefine.column.get(idFieldName).type.includes('int') ? 'int' : 'string';
    const littleHumpModel = magentoModelName[0].toLowerCase() + magentoModelName.slice(1);
    const modelFactory = littleHumpModel + 'Factory';
    const collectionFactory = littleHumpModel + 'CollectionFactory';
    let repositoryContent = `<?php
    
namespace ${magentoModuleBaseNamespace}\Model;

use Magento\\Framework\\Exception\\CouldNotSaveException;
use Psr\\Log\\LoggerInterface;
use ${magentoModuleBaseNamespace}\Model\\${magentoModelName}Factory;
use ${magentoModuleBaseNamespace}\Model\\ResourceModel\\${magentoModelName} as Resource${magentoModelName};
use ${magentoModuleBaseNamespace}\Model\\ResourceModel\\${magentoModelName}\\Collection;
use ${magentoModuleBaseNamespace}\Model\\ResourceModel\\${magentoModelName}\\CollectionFactory as ${magentoModelName}CollectionFactory;

class ${magentoModelName}Repository
{
    private $resource${magentoModelName};
    
    private \$${littleHumpModel}Factory;
    
    private \$${littleHumpModel}CollectionFactory;
    
    private $logger;
    
    public function __construct(Resource${magentoModelName} $resource${magentoModelName},
                                ${magentoModelName}Factory \$${modelFactory},
                                ${magentoModelName}CollectionFactory \$${collectionFactory},
                                LoggerInterface $logger)
    {
        $this->resource${magentoModelName} = $resource${magentoModelName};
        $this->${modelFactory} = \$${modelFactory};
        $this->${collectionFactory} = \$${collectionFactory};
        $this->logger = $logger;
    }
    
    public function build(array $data = []): ${magentoModelName}
    {
        \$${littleHumpModel} = $this->${modelFactory}->create();
        if (!empty($data)) {
            foreach ($data as $column => $value) {
                $setFunctionName = 'set' . ucfirst($column);
                \$${littleHumpModel}->$setFunctionName($value);
            }
        }
        return \$${littleHumpModel};
    }
    
    public function buildCollection(array $data = []): Collection
    {
        $collection = $this->${collectionFactory}->create();
        if (!empty($data)) {
            foreach ($data as $column => $condition) {
                $collection->addFieldToFilter($column, $condition);
            }
        }
        return $collection;
    }
    
    public function get(${idFieldType} \$${idFieldName}): ${magentoModelName}
    {
        \$${littleHumpModel} = $this->build();
        $this->resource${magentoModelName}->load(\$${littleHumpModel}, \$${idFieldName}, '${idFieldName}');
        return \$${littleHumpModel};
    }
    
    /**
     * @throws CouldNotSaveException
    */
    public function save(${magentoModelName} \$${magentoModelName}): void
    {
        try {
            $this->resource${magentoModelName}->save(\$${magentoModelName});
        } catch (\\Exception $exception) {
            $this->logger->error($exception->getMessage());
            throw new CouldNotSaveException(__('Could not save ${magentoModelName}'));
        }
    }
    
}    
`
    fs.writeFile(repositoryFile, repositoryContent, (err) => {
        if (err) {
            console.log(err)
        }
    });
}

function createDirIfNotExists(dirPath) {
    try {
        fs.accessSync(dirPath, fs.constants.W_OK);
    } catch (err) {
        fs.mkdirSync(dirPath);
    }
}

parseMagentoDefineTable(magentoModule, tableName).then(buildMagentoFile)

function generateMagentoTableTemplateCodeBySchemaXml() {
    parseMagentoDefineTable(magentoModule, tableName).then(buildMagentoFile);
}

module.exports = generateMagentoTableTemplateCodeBySchemaXml;
