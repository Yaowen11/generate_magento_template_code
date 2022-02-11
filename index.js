const fs = require('fs');
const express = require('express');
const path = require("path");
const MagentoBackendGrid = require('./libs/MagentoBackendGrid');

const app = express();
const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`Express started on http://localhost:${port};`))

app.get('/', (req, res) => {
    console.log(new Date());
    res.status(200);
    res.type('text/html');
    res.send('hello world!')
})

app.get('/grid', async (req, res) => {
    const gridHtmlPath = path.join('html', 'grid.html');
    res.type('text/html');
    res.send(await fs.promises.readFile(gridHtmlPath))
})

app.post('/grid', async (req, res) => {

})

app.use((req, res) => {
    res.type('text/plain')
    res.status(404)
    res.send('404 - Not Found')
})