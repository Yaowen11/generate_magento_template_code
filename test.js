const path = require('path');
const fs = require('fs');

const testPath = path.join(__dirname, 'test');
fs.readdir(testPath, (err, files) => {
    if (err) {
        throw err;
    }
    for (let testFile of files) {
        fs.readFile(path.join(testPath, testFile), (err, data) => {
            if (err) {
                throw err;
            }
            eval(data.toString());
        })
    }
})


