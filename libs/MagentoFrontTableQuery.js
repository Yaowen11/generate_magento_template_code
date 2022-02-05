const path = require("path");
const MagentoCommons = require("./MagentoCommons");
const fs = require("fs");
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
        this.#buildWebApi();
    }

    #buildGraphql() {
        this.#schemaGraphql();

    }

    #buildWebApi() {

    }

    #schemaGraphql() {
        const etcDir = path.join(this.#moduleMeta.realPath, 'etc');
        MagentoCommons.syncRecursionCreateDir(etcDir);
        const schemaGraphqlFile = path.join(etcDir, 'schema.graphqls');
        let schemaGraphqlContent = `
type Query {
    ${this.#gridUrlMeta.route}${this.#gridUrlMeta.controller.substr(0, 1).toUpperCase()}${this.#gridUrlMeta.controller.slice(1)}s(
        pageSize: Int = 20 @doc(description: "Specifies the maximum number of results to return at once."),
        currentPage: Int = 1 @doc(description: "Specifies which page of results to return."),
    ): ${this.#gridUrlMeta.route.substr(0, 1).toUpperCase()}${this.#gridUrlMeta.route.slice(1)}${this.#gridUrlMeta.controller.substr(0, 1).toUpperCase()}${this.#gridUrlMeta.controller.slice(1)}s @doc(description: "The list of ${this.#gridUrlMeta.controller}s.") @resolver(class: "${this.#moduleMeta.namespace}\\Model\\Resolver\\${this.#gridUrlMeta.controller.substr(0, 1).toUpperCase()}${this.#gridUrlMeta.controller.slice(1)}s")
}

type ${this.#gridUrlMeta.route.substr(0, 1).toUpperCase()}${this.#gridUrlMeta.route.slice(1)}${this.#gridUrlMeta.controller.substr(0, 1).toUpperCase()}${this.#gridUrlMeta.controller.slice(1)}s {
    items: [${this.#gridUrlMeta.route.substr(0, 1).toUpperCase()}${this.#gridUrlMeta.route.slice(1)}${this.#gridUrlMeta.controller.substr(0, 1).toUpperCase()}${this.#gridUrlMeta.controller.slice(1)}] @doc(description: "An array of ${this.#gridUrlMeta.controller}s.")
    page_info: SearchResultPageInfo @doc(description: "Metadata for pagination rendering.")
}

type ${this.#gridUrlMeta.route.substr(0, 1).toUpperCase()}${this.#gridUrlMeta.route.slice(1)}${this.#gridUrlMeta.controller.substr(0, 1).toUpperCase()}${this.#gridUrlMeta.controller.slice(1)} @doc(description: "Details of a ${this.#gridUrlMeta.controller}.") {`;
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
        const resolverDir = path.join(this.#moduleMeta.realPath, 'Model', 'resolver');
        MagentoCommons.syncRecursionCreateDir(resolverDir);
        let resolverContent = `<?php

namespace ${this.#moduleMeta.namespace}\\Model\\Resolver;

use ${this.#moduleMeta.namespace}\\Model\\${MagentoCommons.underscore2hump(this.#tableMeta.name)}Repository;
use Magento\\Framework\\Graphql\\Query\\ResolverInterface;
use Magento\\Framework\\GraphQl\\Config\\Element\\Field;
use Magento\\Framework\\GraphQl\\Query\\Resolver\\ContextInterface;
use Magento\\Framework\\GraphQl\\Schema\\Type\\ResolveInfo;

class ${this.#gridUrlMeta.controller.substr(0, 1).toUpperCase()}${this.#gridUrlMeta.controller.slice(1)} implements ResolverInterface;     
{
    private $repository;
    
    public function __construct(${MagentoCommons.underscore2hump(this.#tableMeta.name)}
    }`
    }


    get #webApi() {

    }



}

module.exports = MagentoFrontTableQuery;
