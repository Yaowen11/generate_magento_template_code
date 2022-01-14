const path = require('path');
const commonsPath = path.join(__dirname, 'libs', 'MagentoCommons.js');
const Commons = require(commonsPath);
const assert = require("assert");
const fs = require('fs');

function commonsCreateDirIfNotExistsTest() {
    const tempDir = (new Date()).getMilliseconds().toString();
    const createPath = path.join(__dirname, tempDir);
    Commons.createDirIfNotExists(createPath);
    fs.stat(createPath, (err, stat) => {
        if (err) { throw err}
        assert.ok(stat.isDirectory());
    })
    try {
        fs.rmdirSync(createPath);
    } catch (err) {}
}

commonsCreateDirIfNotExistsTest();

function commonsUnderscore2humpTest() {
    const originString = 'origin_string';
    const originHump = 'OriginString';
    const humpString = Commons.underscore2hump(originString);
    assert.equal(originHump, humpString);
}

commonsUnderscore2humpTest();

function commonsMagentoBackendUrlMetaTest() {
    const backendUrl = 'route/controller';
    const magentoBackendUrlMeta = Commons.magentoBackendUrlMeta(backendUrl);
    assert.equal(backendUrl, magentoBackendUrlMeta.url)
    assert.equal('route', magentoBackendUrlMeta.route)
    assert.equal('controller', magentoBackendUrlMeta.controller)
}

commonsMagentoBackendUrlMetaTest();

function commonsMagentoModuleMetaTest() {
    const rootPath = __dirname;
    const moduleName = 'Module_Package';
    const magentoModuleMeta = Commons.magentoModuleMeta(rootPath, moduleName);
    assert.equal(magentoModuleMeta.name, moduleName);
    assert.equal(magentoModuleMeta.namespace, 'Module\\Package');
    assert.equal(magentoModuleMeta.realPath, path.join(__dirname, 'app', 'code', 'Module', 'Package'));
    assert.equal(magentoModuleMeta.moduleName, 'Module');
    assert.equal(magentoModuleMeta.packageName, 'Package');
}

commonsMagentoModuleMetaTest();