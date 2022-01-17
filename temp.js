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

fs.access(file, (err, access) => {
    if (err) {
        throw err;
    } else {
        console.log(access)
    }
})

fs.promises.readFile('temp.txt').then(data => {
    console.log()
})
