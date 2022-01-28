const fs = require('fs');
const path = require('path');
const Commons = require('./MagentoCommons');

class MagentoModule {

    #moduleMeta;
    
    constructor(moduleMeta) {
        this.#moduleMeta = moduleMeta;
    }

    initMagentoModule() {
        if (!this.#moduleExists()) {
            const appPointAt = this.#moduleMeta.realPath.search('app');
            const basePath = this.#moduleMeta.realPath.slice(0, appPointAt);
            fs.stat(basePath, ((err, stats) => {
                if (stats.isDirectory()) {
                    const packagePath = path.join(basePath, 'app', 'code', this.#moduleMeta.moduleName, this.#moduleMeta.packageName);
                    Commons.syncRecursionCreateDir(packagePath);
                    // init module composer json
                    Commons.asyncWriteFile(path.join(this.#moduleMeta.realPath, 'composer.json'), JSON.stringify(this.#composerJson, null, 4));
                    // init registration php
                    Commons.asyncWriteFile(path.join(this.#moduleMeta.realPath, 'registration.php'), this.#registration);
                    // init module xml
                    const etcPath = path.join(this.#moduleMeta.realPath, 'etc');
                    Commons.syncRecursionCreateDir(etcPath);
                    const moduleXml = path.join(etcPath, 'module.xml')
                    Commons.asyncWriteFile(moduleXml, this.#moduleXml);
                } else {
                    throw new Error('magento project dir not exists!')
                }
            }))
        }
    }

    get #moduleXml() {
        return `<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Module/etc/module.xsd">
    <module name="${this.#moduleMeta.name}"/>
</config>
`
    }

    get #composerJson() {
        const psr4 = `${this.#moduleMeta.moduleName}\\${this.#moduleMeta.packageName}\\`
        let composerJsonContent = {
            "name": `${this.#moduleMeta.moduleName[0].toLowerCase()}${this.#moduleMeta.moduleName.slice(1)}/${this.#moduleMeta.packageName[0].toLowerCase()}${this.#moduleMeta.packageName.slice(1)}`,
            "version": "1.0.0",
            "description": "N/A",
            "type": "magento2-module",
            "require": {
                "magento/framework": "*"
            },
            "license": [
                "Proprietary"
            ],
            "autoload": {
                "files": [
                    "registration.php"
                ],
                "psr-4": {}
            }
        }
        composerJsonContent.autoload['psr-4'][psr4] = "";
        return composerJsonContent;
    }

    get #registration() {
        return `<?php

use Magento\\Framework\\Component\\ComponentRegistrar;

ComponentRegistrar::register(ComponentRegistrar::MODULE, '${this.#moduleMeta.name}', __DIR__);`
    }

    #moduleExists() {
        try {
            fs.accessSync(this.#moduleMeta.realPath, fs.constants.R_OK | fs.constants.W_OK);
            return true;
        } catch (err) {
            return false;
        }
    }
}

module.exports = MagentoModule;
