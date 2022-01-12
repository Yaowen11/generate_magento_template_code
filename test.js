const index = require('./index');

const rootPath = process.argv[2];
const table = process.argv[3];
const moduleName = process.argv[4];
const backendUrl = process.argv[5];
const location = process.argv[6];

index.model.buildModelTemplateFiles(rootPath, moduleName, table).then(() => console.log('done')).catch(err => {throw err});
// index.backend(rootPath, moduleName, table, backendUrl, location).then(() => console.log('done')).catch(err => {throw err});