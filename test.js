const modelTemplate = require("./model_template");
const commons = require('./commons');
const backendTemplate = require('./backend_template');

const rootPath = process.argv[2];
const table = process.argv[3];
const moduleName = process.argv[4];
const backendUrl = process.argv[5];
const location = process.argv[6];

console.log(process.argv);