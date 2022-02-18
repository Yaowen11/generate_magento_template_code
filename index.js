const fs = require('fs');
const express = require('express');
const path = require("path");
const MagentoBackendGrid = require('./libs/MagentoBackendGrid');
const MagentoCommons = require('./libs/MagentoCommons');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;
app.use(bodyParser.urlencoded({extended: true}));

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
    const module_name = req.body.module_name;
    const grid_url = req.body.grid_url;
    const table_define = req.body.table_define;
    if (module_name === '' || grid_url === '' || table_define === '') {
        throw new Error('field must be special');
    }
    const moduleMeta = MagentoCommons.magentoModuleMeta(__dirname, module_name);
    const gridMeta = MagentoCommons.magentoBackendUrlMeta(grid_url);
    const tableMeta = MagentoCommons.magentoTableMetaByTableXml(table_define);
    const magentoBackendGrid = new MagentoBackendGrid(moduleMeta, gridMeta, tableMeta);
    const generateFile = await magentoBackendGrid.generateModuleGridZipFile();
    res.download(path.join(__dirname, generateFile), generateFile, (err) => {
        if (err) {
            throw err;
        }
        fs.unlink(path.join(__dirname, generateFile), () => {
            console.log(`${generateFile} delete done!`)
        });
    });
})

app.use((req, res) => {
    res.type('text/plain')
    res.status(404)
    res.send('404 - Not Found')
});

app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send('Something broke!')
})