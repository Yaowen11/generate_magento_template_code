const path = require('path');

const BackendController = require(path.join(__dirname, 'libs', 'BackendController.js'));
const Commons = require(path.join(__dirname, 'libs', 'MagentoCommons.js'));

const moduleMeta = Commons.magentoModuleMeta(__dirname, 'Module_Package');
const urlMeta = Commons.magentoBackendUrlMeta('route/controller');
const modelMeta = Commons.magentoModelMeta('magento_model', moduleMeta);


const backendController = new BackendController(moduleMeta, urlMeta, modelMeta);

function backendControllerInitControllerTest() {
    const promise = new Promise(function(resolve, reject) {
        try {
            backendController.initController();
            resolve();
        } catch (err) {
            reject();
        }
    })
    promise.then(console.log).catch(console.log)
}

backendControllerInitControllerTest()

