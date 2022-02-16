const path = require("path");
const MagentoCommons = require("./MagentoCommons");
const os = require("os");

class MagentoFrontTableQuery {

    #moduleMeta;

    #tableMeta;

    #gridUrlMeta;

    constructor(moduleMeta, tableMeta, gridUrlMeta) {
        this.#moduleMeta = moduleMeta;
        this.#tableMeta = tableMeta;
        this.#gridUrlMeta = gridUrlMeta;
    }

    buildFrontTableQuery() {
        this.#buildGraphql();
        this.#schemaGraphqlResolver();
    }

    #buildGraphql() {
        this.#schemaGraphql();
        this.#schemaGraphqlResolver();
    }

    #schemaGraphql() {
        const etcDir = path.join(this.#moduleMeta.realPath, 'etc');
        MagentoCommons.syncRecursionCreateDir(etcDir);
        const schemaGraphqlFile = path.join(etcDir, 'schema.graphqls');
        const returnType = `${this.#gridUrlMeta.route.substring(0, 1).toUpperCase()}${this.#gridUrlMeta.route.slice(1)}${this.#gridUrlMeta.controller.substring(0, 1).toUpperCase()}${this.#gridUrlMeta.controller.slice(1)}s`;
        let schemaGraphqlContent = `

type Query {
    ${this.#gridUrlMeta.route}${this.#gridUrlMeta.controller.substring(0, 1).toUpperCase()}${this.#gridUrlMeta.controller.slice(1)}s (
        pageSize: Int = 20
        currentPage: Int = 1
    ): ${returnType} @resolver(class: "${this.#moduleMeta.moduleName}\\\\${this.#moduleMeta.packageName}\\\\Model\\\\Resolver\\\\${returnType}") @doc(description: "The list of ${this.#gridUrlMeta.route} ${this.#gridUrlMeta.controller}s.")
}

type ${this.#gridUrlMeta.route.substring(0, 1).toUpperCase()}${this.#gridUrlMeta.route.slice(1)}${this.#gridUrlMeta.controller.substring(0, 1).toUpperCase()}${this.#gridUrlMeta.controller.slice(1)}s {
    items: [${this.#gridUrlMeta.route.substring(0, 1).toUpperCase()}${this.#gridUrlMeta.route.slice(1)}${this.#gridUrlMeta.controller.substring(0, 1).toUpperCase()}${this.#gridUrlMeta.controller.slice(1)}] @doc(description: "An array of ${this.#gridUrlMeta.controller}s.")
    page_info: SearchResultPageInfo @doc(description: "Metadata for pagination rendering.")
}

type ${this.#gridUrlMeta.route.substring(0, 1).toUpperCase()}${this.#gridUrlMeta.route.slice(1)}${this.#gridUrlMeta.controller.substring(0, 1).toUpperCase()}${this.#gridUrlMeta.controller.slice(1)} @doc(description: "Details of a ${this.#gridUrlMeta.controller}.") {`;
        for (let column of this.#tableMeta.column) {
            let columnType = 'String';
            if (column['@@xsi:type'].includes("char") || column['@@xsi:type'].includes("text")) {
                columnType = 'String';
            }
            if (column['@@xsi:type'].includes("float") || column['@@xsi:type'].includes("double") || column['@@xsi:type'].includes("decimal")) {
                columnType = 'Float';
            }
            if (column['@@xsi:type'].includes("int")) {
                columnType = 'Int';
            }
            let columnLine = `    ${column['@@name']}: ${columnType} @doc(description: "The ${column['@@name']} of the ${this.#gridUrlMeta.controller}.")`;
            schemaGraphqlContent += os.EOL + columnLine;
        }
        schemaGraphqlContent += os.EOL + '}'
        MagentoCommons.asyncWriteFile(schemaGraphqlFile, schemaGraphqlContent);
    }

    #schemaGraphqlResolver() {
        const resolverDir = path.join(this.#moduleMeta.realPath, 'Model', 'Resolver');
        const fileName = `${this.#gridUrlMeta.route.substring(0, 1).toUpperCase()}${this.#gridUrlMeta.route.slice(1)}${this.#gridUrlMeta.controller.substring(0, 1).toUpperCase()}${this.#gridUrlMeta.controller.slice(1)}s`;
        MagentoCommons.syncRecursionCreateDir(resolverDir);
        let resolverContent = `<?php

namespace ${this.#moduleMeta.namespace}\\Model\\Resolver;

use ${this.#moduleMeta.namespace}\\Model\\${MagentoCommons.underscore2hump(this.#tableMeta.name)}Repository;
use Magento\\Framework\\GraphQl\\Query\\ResolverInterface;
use Magento\\Framework\\GraphQl\\Config\\Element\\Field;
use Magento\\Framework\\GraphQl\\Query\\Resolver\\ContextInterface;
use Magento\\Framework\\GraphQl\\Schema\\Type\\ResolveInfo;
use Magento\\Framework\\GraphQl\\Exception\\GraphQlInputException;

class ${fileName} implements ResolverInterface
{
    private $repository;
    
    public function __construct(${MagentoCommons.underscore2hump(this.#tableMeta.name)}Repository $repository)
    {
        $this->repository = $repository;
    }
    
    /**
     * @param Field $field
     * @param ContextInterface $context
     * @param ResolveInfo $info
     * @param array|null $value
     * @param array|null $args
     * @return array
     * @throws GraphQlInputException
     */
    public function resolve(Field $field, $context, ResolveInfo $info, array $value = null, array $args = null)
    {
        if ($args['currentPage'] < 1) {
            throw new GraphQlInputException(__('currentPage value must be greater than 0.'));
        }

        if ($args['pageSize'] < 1) {
            throw new GraphQlInputException(__('pageSize value must be greater than 0.'));
        }
        
        $collection = $this->repository->buildCollection()
            ->setPageSize($args['pageSize'])
            ->setCurPage($args['currentPage']);
        $collectionSize = $collection->getSize();
        if ($collectionSize) {
            $maxPages = ceil($collectionSize / $args['pageSize']);
        } else {
            $maxPages = 0;
        }
        $items = [];
        foreach ($collection as $item) {`
        for (let column of this.#tableMeta.column) {
            resolverContent += os.EOL + `            $items[]['${column['@@name']}'] = $item->getData('${column['@@name']}');`
        }
        
        resolverContent +=
        `
        }
        
        return [
            'total_count' => $collection->getSize(),
            'items' => $items,
            'page_info' => [
                'page_size' => $collectionSize,
                'current_page' => $args['currentPage'],
                'total_pages' => $maxPages
            ]
        ];
    }
    
}`
        const resolveFile = path.join(resolverDir, `${fileName}.php`);
        MagentoCommons.asyncWriteFile(resolveFile, resolverContent);
    }

}

module.exports = MagentoFrontTableQuery;
