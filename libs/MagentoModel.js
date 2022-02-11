const path = require('path');
const MagentoCommons = require('./MagentoCommons');
const os = require("os");

class MagentoModel {

    #tableMeta;

    #modelMeta;

    constructor(tableMeta, modelMeta) {
        this.#tableMeta = tableMeta;
        this.#modelMeta = modelMeta;
    }

    buildModel() {
        MagentoCommons.syncRecursionCreateDir(this.#modelMeta.collectionPath);
        MagentoCommons.asyncWriteFile(path.join(this.#modelMeta.path, `${this.#modelMeta.name}.php`), this.#model);
        MagentoCommons.asyncWriteFile(path.join(this.#modelMeta.path, `${this.#modelMeta.name}Factory.php`), this.#modelFactory);
        MagentoCommons.asyncWriteFile(path.join(this.#modelMeta.path, `${this.#modelMeta.repositoryName}.php`), this.#repository);
        MagentoCommons.asyncWriteFile(path.join(this.#modelMeta.resourcePath, `${this.#modelMeta.resourceName}.php`), this.#resourceModel);
        MagentoCommons.asyncWriteFile(path.join(this.#modelMeta.collectionPath, 'Collection.php'), this.#collection);
        MagentoCommons.asyncWriteFile(path.join(this.#modelMeta.collectionPath, 'CollectionFactory.php'), this.#collectionFactory);
        MagentoCommons.asyncWriteFile(path.join(this.#modelMeta.collectionPath, 'DataProvider.php'), this.#dataProvider);
    }

    get #model() {
        let modelContent = `<?php
        
namespace ${this.#modelMeta.namespace};

use Magento\\Framework\\Model\\AbstractModel;
${this.#modelMeta.resourceUseName};

/**
`
        for (let column of this.#tableMeta.column) {
            const type = column['@@xsi:type'].includes('int') ? 'int' : 'string';
            const name = MagentoCommons.underscore2hump(column['@@name']);
            modelContent += ` * @method ${type} get${name}();` + os.EOL;
            modelContent += ` * @method void set${name}(${type} $value);` + os.EOL;
        }
        modelContent += ' */' + os.EOL;
        modelContent += `class ${this.#modelMeta.name} extends AbstractModel 
{`;
        for (let column of this.#tableMeta.column) {
            if (column['@@xsi:type'] === 'tinyint' && ('@@comment' in column && column['@@comment'].includes('0:'))) {
                column['@@comment'].split(',').forEach((value) => {
                    let [constValue, constName] = value.split(':')
                    modelContent += os.EOL + `    public const ${constName.toUpperCase()}_${column['@@name'].toUpperCase()} = ${constValue};` + os.EOL;
                })
            }
        }
        modelContent += os.EOL + `    protected function _construct()
    {
        $this->_init(Resource${this.#modelMeta.name}::class);
    }
}       
`
        return modelContent;
    }

    get #modelFactory() {
        return `<?php

namespace ${this.#modelMeta.namespace};

use Magento\\Framework\\ObjectManagerInterface;

class ${this.#modelMeta.name}Factory
{
    private $objectManager;
    
    private $instanceName;
    
    public function __construct(ObjectManagerInterface $objectManager, $instanceName = ${this.#modelMeta.name}::class) 
    {
        $this->objectManager = $objectManager;
        $this->instanceName = $instanceName;
    }
    
    public function create(array $data = []): ${this.#modelMeta.name}
    {
        return $this->objectManager->create($this->instanceName, $data);
    }
}
`
    }

    get #resourceModel() {
        return `<?php

namespace ${this.#modelMeta.resourceNamespace};

use Magento\\Framework\\Model\\ResourceModel\\Db\\AbstractDb;

class ${this.#modelMeta.resourceName} extends AbstractDb
{
    protected function _construct()
    {
        $this->_init('${this.#tableMeta.name}', '${this.#tableMeta.primaryKey}');
    }
}`
    }

    get #collection() {
        return `<?php

namespace ${this.#modelMeta.collectionNamespace};

use Magento\\Framework\\Model\\ResourceModel\\Db\\Collection\\AbstractCollection;
${this.#modelMeta.useName};
${this.#modelMeta.resourceUseName};

class Collection extends AbstractCollection
{
    protected function _construct()
    {
        $this->_init(${this.#modelMeta.name}::class, Resource${this.#modelMeta.resourceName}::class);
    }
}
`
    }

    get #collectionFactory() {
        return `<?php

namespace ${this.#modelMeta.collectionNamespace};

use Magento\\Framework\\ObjectManagerInterface;

class CollectionFactory
{
    private $objectManager;
    
    private $instanceName;
    
    public function __construct(ObjectManagerInterface $objectManager, $instanceName = ${this.#modelMeta.collectionName}::class) 
    {
        $this->objectManager = $objectManager;
        $this->instanceName = $instanceName;
    }
    
    public function create(array $data = []): ${this.#modelMeta.collectionName}
    {
        return $this->objectManager->create($this->instanceName, $data);
    }
}
`
    }

    get #repository() {
        return `<?php

namespace ${this.#modelMeta.resourceNamespace};

use Exception;
use Magento\\Framework\\Exception\\CouldNotSaveException;
use Magento\\Framework\\Exception\\CouldNotDeleteException;
${this.#modelMeta.useName}Factory;
${this.#modelMeta.resourceUseName};
${this.#modelMeta.collectionUseName};
${this.#modelMeta.collectionUseName}Factory;

class ${this.#modelMeta.repositoryName}
{
    private ${this.#modelMeta.resourceVariable};
    
    private ${this.#modelMeta.variable}Factory;
    
    private $collectionFactory;
    
    private $logger;
    
    public function __construct(Resource${this.#modelMeta.resourceName} ${this.#modelMeta.resourceVariable},
                                ${this.#modelMeta.name}Factory ${this.#modelMeta.variable}Factory,
                                CollectionFactory $collectionFactory,
                                LoggerInterface $logger)
    {
        $this->resource${this.#modelMeta.resourceName} = ${this.#modelMeta.resourceVariable};
        $this->${this.#modelMeta.variable.slice(1)}Factory = ${this.#modelMeta.variable}Factory;
        $this->collectionFactory = $collectionFactory;
        $this->logger = $logger;
    }
    
    public function build(array $data = []): ${this.#modelMeta.name}
    {
        ${this.#modelMeta.variable} = $this->${this.#modelMeta.variable.slice(1)}Factory->create();
        return $this->update(${this.#modelMeta.variable}, $data);
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
    public function delete(${this.#modelMeta.name} ${this.#modelMeta.variable}): void
    {
        try {
            $this->resource${this.#modelMeta.resourceName}->delete(${this.#modelMeta.variable});
        } catch(Exception $exception) {
            $this->logger->error($exception->getMessage());
            throw new CouldNotDeleteException(__('Could not delete ${this.#modelMeta.name}'));
        }
    }
    
    public function getById(\$${this.#tableMeta.primaryKey}): ${this.#modelMeta.name}
    {
        return $this->get(\$${this.#tableMeta.primaryKey}, '${this.#tableMeta.primaryKey}');
    }
    
    public function get(string $field, $value): ${this.#modelMeta.name}
    {
        ${this.#modelMeta.variable} = $this->build();
        $this->resource${this.#modelMeta.resourceName}->load(${this.#modelMeta.variable}, $value, $field);
        return ${this.#modelMeta.variable};
    }
    
    /**
     * @throws CouldNotSaveException
    */
    public function save(${this.#modelMeta.name} ${this.#modelMeta.variable}): void
    {
        try {
            $this->resource${this.#modelMeta.resourceName}->save(${this.#modelMeta.variable});
        } catch (\\Exception $exception) {
            $this->logger->error($exception->getMessage());
            throw new CouldNotSaveException(__('Could not save ${this.#modelMeta.name}'));
        }
    }
    
    public function update(${this.#modelMeta.name} ${this.#modelMeta.variable}, array $data = []): ${this.#modelMeta.name}
    {
        if (!empty($data)) {
            foreach ($data as $column => $value) {
                $setFunctionName = array_reduce(explode('_', $column), function ($initString, $item) {
                    return $initString .= ucfirst($item);
                }, 'set');
                ${this.#modelMeta.variable}->$setFunctionName($value);
            }
        }
        return ${this.#modelMeta.variable};
    }
}
`
    }

    get #dataProvider() {
        let dataProviderContent = `<?php

namespace ${this.#modelMeta.collectionNamespace};

use Magento\\Framework\\App\\RequestInterface;
use Magento\\Framework\\Exception\\NoSuchEntityException;
use Magento\\Ui\\DataProvider\\AbstractDataProvider;
${this.#modelMeta.repositoryUseName};

class DataProvider extends AbstractDataProvider
{
    private $request;
    
    private $repository;
    
    protected $primaryFieldName = '${this.#tableMeta.primaryKey}';
    
    public function __construct($name,
                                $primaryFieldName,
                                $requestFieldName,
                                RequestInterface $request,
                                Collection $collection,
                                ${this.#modelMeta.repositoryName} ${this.#modelMeta.repositoryVariable},
                                array $meta = [],
                                array $data = [])
    {
        parent::__construct($name, $primaryFieldName, $requestFieldName, $meta, $data);
        $this->request = $request;
        $this->collection = $collection;
        $this->repository = ${this.#modelMeta.repositoryVariable};
    }
    
    /**
     * @throws NoSuchEntityException
     */
    public function getData(): array
    {
        if (isset($this->loadedData)) {
            return $this->loadedData;
        }
        $this->loadedData = [];
        $requestId = $this->request->getParam($this->requestFieldName);
        if ($requestId) {
            $post = $this->repository->get($requestId);
            if (!$post->getId()) {
                throw new NoSuchEntityException::singleField('${this.#tableMeta.primaryKey}', $requestId);
            }
            $postData = $post->getData();
`
        for (let column of this.#tableMeta.column) {
            if (column['@@name'].includes("image")) {
                dataProviderContent += `
            if (isset($postData['${column['@@name']}'])) {
                \$${column['@@name']} = [
                    [
                        'name' => basename($postData['${column['@@name']}']),
                        'url' => $postData['${column['@@name']}'],
                        'type' => 'image'
                    ]
                ];
                $postData['${column['@@name']}'] = \$${column['@@name']};                
`
                dataProviderContent += `
            }
            $this->loadedData[$requestId] = $postData;
        }
        return $this->loadedData;
   }
}
`
            }
        }
        return dataProviderContent;
    }
}

module.exports = MagentoModel;
