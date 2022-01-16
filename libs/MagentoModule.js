const fs = require('fs');
const path = require('path');
const Commons = require('./MagentoCommons');

class MagentoModule {

    constructor(moduleMeta) {
        this.meta = moduleMeta;
    }

    initMagentoModule() {
        if (!this.moduleExists()) {
            const appPointAt = this.meta.realPath.search('app');
            const basePath = this.meta.realPath.slice(0, appPointAt);
            fs.stat(basePath, ((err, stats) => {
                if (stats.isDirectory()) {
                    const appPath = path.join(basePath, 'app');
                    Commons.createDirIfNotExists(appPath);
                    const appCodePath = path.join(appPath, 'code');
                    Commons.createDirIfNotExists(appCodePath);
                    const modulePath = path.join(appCodePath, this.meta.moduleName);
                    Commons.createDirIfNotExists(modulePath);
                    const packagePath = path.join(modulePath, this.meta.packageName);
                    Commons.createDirIfNotExists(packagePath);
                    this.initComposerJsonFile();
                    this.initRegistrationPhp();
                    this.initModuleXml();

                } else {
                    throw new Error('magento project dir not exists!')
                }
            }))
        }
    }

    get moduleXml() {
        this.moduleXmlContent = `<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Module/etc/module.xsd">
    <module name="${this.meta.name}"/>
</config>
`
        return this.moduleXmlContent;
    }

    get composerJson() {
        const psr4 = `${this.meta.moduleName}\\${this.meta.packageName}\\`
        this.composerJsonContent = {
            "name": `${this.meta.moduleName[0].toLowerCase()}${this.meta.moduleName.slice(1)}/${this.meta.packageName[0].toLowerCase()}${this.meta.packageName.slice(1)}`,
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
        this.composerJsonContent.autoload['psr-4'][psr4] = "";
        return this.composerJsonContent;
    }

    get registration() {
        this.registrationContent = `<?php

use Magento\\Framework\\Component\\ComponentRegistrar;

ComponentRegistrar::register(ComponentRegistrar::MODULE, '${this.meta.name}', __DIR__);`
        return this.registrationContent;
    }

    initComposerJsonFile() {
        const composerJsonFile = path.join(this.meta.realPath, 'composer.json');
        Commons.asyncWriteFile(composerJsonFile, JSON.stringify(this.composerJson, null, 4));
    }

    initRegistrationPhp() {
        const registrationPhp = path.join(this.meta.realPath, 'registration.php');
        Commons.asyncWriteFile(registrationPhp, this.registration);
    }

    initModuleXml() {
        const etcPath = path.join(this.meta.realPath, 'etc');
        Commons.createDirIfNotExists(etcPath);
        const moduleXml = path.join(etcPath, 'module.xml')
        Commons.asyncWriteFile(moduleXml, this.moduleXml);
    }

    moduleExists() {
        try {
            fs.accessSync(this.meta.realPath, fs.constants.R_OK | fs.constants.W_OK);
            return true;
        } catch (err) {
            return false;
        }
    }
}

module.exports = MagentoModule;
