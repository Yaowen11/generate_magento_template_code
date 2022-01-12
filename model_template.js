const os = require('os');
const path = require("path");
const {createDirIfNotExists, writeMagentoFile, moduleMeta, hump, tableMeta} = require("./commons");


function modelMeta(moduleMeta, tableName) {
    const modelName = hump(tableName);
    const modelNamespace = `${moduleMeta.namespace}Model`;
    const modelVariable = '$' + modelName[0].toLowerCase() + modelName.slice(1);
    const modelPath = path.join(moduleMeta.path, 'Model');
    return {
        name: modelName,
        namespace: modelNamespace,
        variable: modelVariable,
        path:  modelPath,
        useName: `use ${modelNamespace}\\${modelName}`,

        resourceName: modelName,
        resourcePath: path.join(moduleMeta.path, 'Model', 'ResourceModel'),
        resourceNamespace: `${modelNamespace}\\ResourceModel`,
        resourceVariable: `$resource${modelName}`,
        resourceUseName: `use ${modelNamespace}\\ResourceModel\\${modelName} as Resource${modelName}`,

        collectionName: 'Collection',
        collectionPath: path.join(moduleMeta.path, 'Model', 'ResourceModel', modelName),
        collectionNamespace: `${modelNamespace}\\ResourceModel\\${modelName}`,
        collectionFactory: `CollectionFactory`,
        collectionUseName: `use ${modelNamespace}\\ResourceModel\\${modelName}\\Collection`,

        repositoryName: `${modelName}Repository`,
        repositoryPath: modelPath,
        repositoryNamespace: modelNamespace,
        repositoryVariable: `${modelVariable}Repository`,
        repositoryUseName: `use ${modelName}\\${modelName}Repository`
    }
}


async function buildModelTemplateFiles(rootPath, moduleName, tableName) {
    const module = await moduleMeta(rootPath, moduleName);
    const tableMetaData = await tableMeta(module.path, tableName);
    const model = modelMeta(module, tableName);
    // create dir
    createDirIfNotExists(model.path);
    createDirIfNotExists(model.resourcePath);
    createDirIfNotExists(model.collectionPath);
    // magento model file
    const modelContent = buildMagentoModelContent(tableMetaData, model);
    const modelFile = path.join(model.path, model.name + '.php');
    writeMagentoFile(modelFile, modelContent);
    const repositoryContent = buildMagentoRepositoryContent(tableMetaData, model);
    const repositoryFile = path.join(model.repositoryPath, model.repositoryName + '.php');
    writeMagentoFile(repositoryFile, repositoryContent);
    // resource model
    const resourceContent = buildMagentoResourceContent(tableName, tableMetaData, model);
    const resourceFile = path.join(model.resourcePath, model.resourceName + '.php');
    writeMagentoFile(resourceFile, resourceContent);
    // collection
    const collectionFile = path.join(model.collectionPath, model.collectionName + '.php');
    const collectionContent = buildMagentoCollectionContent(model);
    writeMagentoFile(collectionFile, collectionContent);
}

function buildMagentoModelContent(tableMetaData, modelMeta) {
    let modelContent = `<?php

namespace ${modelMeta.namespace};

use Magento\\Framework\\Model\\AbstractModel;
${modelMeta.resourceUseName};

/**
`;
    tableMetaData.column.forEach((value, key) => {
        const type = (value['type'].includes('int') ? 'int' : 'string');
        const columnName = hump(key);
        modelContent += ' * @method ' + type + ' get' + columnName + '();' + os.EOL;
        modelContent += ' * @method void set' + columnName + '(' + type + ' $value)' + ');' + os.EOL;
    })
    modelContent += ' */' + os.EOL;
    modelContent += `class ${modelMeta.name} extends AbstractModel
{`
    if (tableMetaData.consts.size > 0) {
        for (let [columnName, constDefine] of tableMetaData.consts) {
            for (let constName in constDefine) {
                modelContent += os.EOL + '    public const ' + constName + ' = ' + constDefine[constName] + ';' + os.EOL;
            }
        }
    }
    modelContent += os.EOL +
`    protected function _construct() 
    {
        $this->_init(Resource${modelMeta.resourceName}::class);
    }
}
`
    return modelContent;
}

function buildMagentoResourceContent(tableName, tableMetaData, modelMeta) {
    let idFieldName = tableMetaData.primary.name
    return `<?php

namespace ${modelMeta.resourceNamespace};

use Magento\\Framework\\Model\\ResourceModel\\Db\\AbstractDb;

class ${modelMeta.resourceName} extends AbstractDb
{
    protected function _construct()
    {
        $this->_init('${tableName}', '${idFieldName}');
    }
}
`;
}

function buildMagentoCollectionContent(modelMeta) {
    return `<?php

namespace ${modelMeta.collectionNamespace};

use Magento\\Framework\\Model\\ResourceModel\\Db\\Collection\\AbstractCollection;
${modelMeta.useName};
${modelMeta.resourceUseName};

class Collection extends AbstractCollection
{
    protected function _construct()
    {
        $this->_init(${modelMeta.name}::class, Resource${modelMeta.resourceName}::class);
    }
}
`;
}

function buildMagentoRepositoryContent(tableDefine, modelMeta) {
    let idFieldName = tableDefine.primary.name;
    let idFieldType = tableDefine.column.get(idFieldName).type.includes('int') ? 'int' : 'string';
    return `<?php
    
namespace ${modelMeta.repositoryNamespace};

use Exception;
use Magento\\Framework\\Exception\\CouldNotSaveException;
use Magento\\Framework\\Exception\\CouldNotDeleteException;
use Psr\\Log\\LoggerInterface;
${modelMeta.useName}Factory;
${modelMeta.resourceUseName};
${modelMeta.collectionUseName};
${modelMeta.collectionUseName}Factory;

class ${modelMeta.repositoryName}
{
    private ${modelMeta.resourceVariable};
    
    private ${modelMeta.variable}Factory;
    
    private $collectionFactory;
    
    private $logger;
    
    public function __construct(Resource${modelMeta.resourceName} ${modelMeta.resourceVariable},
                                ${modelMeta.name}Factory ${modelMeta.variable}Factory,
                                CollectionFactory $collectionFactory,
                                LoggerInterface $logger)
    {
        $this->resource${modelMeta.resourceName} = ${modelMeta.resourceVariable};
        $this->${modelMeta.variable.slice(1)}Factory = ${modelMeta.variable}Factory;
        $this->collectionFactory = $collectionFactory;
        $this->logger = $logger;
    }
    
    public function build(array $data = []): ${modelMeta.name}
    {
        ${modelMeta.variable} = $this->${modelMeta.variable.slice(1)}Factory->create();
        return $this->update(${modelMeta.variable}, $data);
    }
    
    public function buildCollection(array $data = []): Collection
    {
        $collection = $this->collectionFactory->create();
        if (!empty($data)) {
            foreach ($data as $column => $condition) {
                $collection->addFieldToFilter($column, $condition);
            }
        }
        return $collection;
    }
    
    /**
     * @throws CouldNotDeleteException
     */
    public function delete(${modelMeta.name} ${modelMeta.variable}): void
    {
        try {
            $this->resource${modelMeta.resourceName}->delete(${modelMeta.variable});
        } catch(Exception $exception) {
            $this->logger->error($exception->getMessage());
            throw new CouldNotDeleteException(__('Could not delete ${modelMeta.name}'));
        }
    }
    
    public function get(${idFieldType} \$${idFieldName}): ${modelMeta.name}
    {
        ${modelMeta.variable} = $this->build();
        $this->resource${modelMeta.resourceName}->load(${modelMeta.variable}, \$${idFieldName}, '${idFieldName}');
        return ${modelMeta.variable};
    }
    
    /**
     * @throws CouldNotSaveException
    */
    public function save(${modelMeta.name} ${modelMeta.variable}): void
    {
        try {
            $this->resource${modelMeta.resourceName}->save(${modelMeta.variable});
        } catch (\\Exception $exception) {
            $this->logger->error($exception->getMessage());
            throw new CouldNotSaveException(__('Could not save ${modelMeta.name}'));
        }
    }
    
    public function update(${modelMeta.name} ${modelMeta.variable}, array $data = []): ${modelMeta.name}
    {
        if (!empty($data)) {
            foreach ($data as $column => $value) {
                $setFunctionName = array_reduce(explode('_', $column), function ($initString, $item) {
                    return $initString .= ucfirst($item);
                }, 'set');
                ${modelMeta.variable}->$setFunctionName($value);
            }
        }
        return ${modelMeta.variable};
    }
}    
`;
}

exports.buildModelTemplateFiles = buildModelTemplateFiles;
exports.modelMeta = moduleMeta;