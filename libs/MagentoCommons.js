const fs = require('fs');
const os = require('os');
const path = require("path");
const {hump} = require("../commons");

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
            repositoryUseName: `use ${modelNamespace}\\${modelName}Repository`
        }
    }
}

module.exports = MagentoCommons