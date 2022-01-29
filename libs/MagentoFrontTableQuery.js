const path = require("path");
const MagentoCommons = require("./MagentoCommons");
const fs = require("fs");
const os = require("os");

class MagentoFrontTableQuery {

    #moduleMeta;

    #tableMeta;

    constructor(moduleMeta, tableMeta) {
        this.#moduleMeta = moduleMeta;
        this.#tableMeta = tableMeta;
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
        // const etcDir = path.join(this.#moduleMeta.realPath, 'etc');
        // MagentoCommons.syncRecursionCreateDir(etcDir);
        // const schemaGraphqlFile = path.join(etcDir, 'schema.graphqls');
        const schemaGraphqlFile = 'schema.graphqls';
        const schemaStream = fs.createReadStream(schemaGraphqlFile);
        const buffer = Buffer.alloc(1024, '', 'ascii');
        schemaStream.on("data", function (buffer) {
            console.log(buffer.toString().search(os.EOL));
        });
    }


    #schemaGraphqlResolver() {

    }

    get #webApi() {

    }



}

module.exports = MagentoFrontTableQuery;