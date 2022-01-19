const fs = require('fs');

const file = 'cod.dot';

// fs.stat(file, (err, stat) => {
//     if (err) {
//         console.log(err);
//         throw err;
//     } else {
//         console.log(stat);
//     }
// })

// fs.access(file, (err, access) => {
//     if (err) {
//         throw err;
//     } else {
//         console.log(access)
//     }
// })

// function initPromise(initFile, content) {
//     return fs.promises.readFile(initFile, {encoding: "utf8"}).then(data => {
//         return Promise.resolve(data);
//     }).catch((err) => {
//         fs.promises.writeFile(initFile, 'hello world').then(initPromise(initFile, content))
//     })
// }
//
// const initFile = 'init.txt';
// const content = 'init content\r\n';
//
// initPromise(initFile, content).then(console.log).catch((err) => {throw  err})

let a;
if (1 < 0) {
   let a = 3;
} else {
    let a = 5;
}
console.log(a);