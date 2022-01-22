const path = require('path');
const Commons = require(path.join(__dirname, 'libs', 'MagentoCommons.js'));
const MagentoConfigXml = require(path.join(__dirname, 'libs', 'MagentoConfigXml.js'));

const magentoModuleName = 'Module_Package';
const magentoModuleMeta = Commons.magentoModuleMeta(__dirname, magentoModuleName);
const magentoConfigXml = new MagentoConfigXml(magentoModuleMeta);

// magentoConfigXml.initDiXml();
// magentoConfigXml.initAclXml();
// magentoConfigXml.initDbSchemaXml();

// const tableNode = {
//     column: [
//         {
//             'xsi:type': 'int',
//             name: 'id',
//             unsigned: 'true',
//             nullable: 'false',
//             identity: 'true'
//         },
//         {
//             'xsi:type': 'varchar',
//             name: 'title',
//             nullable: 'false',
//             length: '255'
//         },
//         {
//             'xsi:type': 'varchar',
//             name: 'image_url',
//             nullable: 'false',
//             length: '255'
//         },
//         {
//             'xsi:type': 'varchar',
//             name: 'video_url',
//             nullable: 'false',
//             length: '255'
//         },
//         {
//             'xsi:type': 'tinyint',
//             name: 'state',
//             unsigned: true,
//             nullable: 'false',
//             default: '1',
//             comment: '0:disable,1:enable'
//         },
//         {
//             'xsi:type': 'tinyint',
//             name: 'type',
//             unsigned: 'true',
//             nullable: 'false',
//             default: '0',
//             comment: '0:pc,1:mobile'
//         },
//         {
//             'xsi:type': 'timestamp',
//             name: 'created_at',
//             nullable: 'false',
//             on_update: 'false',
//             default: 'CURRENT_TIMESTAMP'
//         },
//         {
//             'xsi:type': 'timestamp',
//             name: 'updated_at',
//             nullable: 'false',
//             on_update: 'true',
//             default: 'CURRENT_TIMESTAMP'
//         }
//     ],
//     constraint: {
//         column: {name: 'id'},
//         'xsi:type': 'primary',
//         referenceId: 'PRIMARY'
//     },
//     name: 'rantion_banner_2',
//     resource: 'default',
//     engine: 'innodb',
//     comment: ''
// }
// magentoConfigXml.buildDbSchemaXml(tableNode).then(r => {
//     console.log('done')
// }).catch(e => {
//     console.log('err' + e)
// })

const menuAddItem = {
    '@@id': 'Rantion_Content::main_2',
    '@@title': 'Rantion Content',
    '@@translate': 'title',
    '@@module': 'Rantion_Content',
    '@@parent': 'Magento_Backend::marketing',
    '@@resource': 'Rantion_Content::main'
};
magentoConfigXml.buildAdminhtmlMenuXml(menuAddItem);

// const systemItem = {
//     label: 'Customer Points',
//     tab: 'rantion',
//     resource: 'Rantion_Customer::points',
//     group: {
//         label: 'Options',
//         id: 'options',
//         translate: 'label',
//         type: 'text',
//         sortOrder: '10',
//         showInDefault: '1',
//         showInWebsite: '1',
//         showInStore: '1'
//     }
// }
// // magentoConfigXml.buildAdminhtmlSystemXml(systemItem).then(console.log).catch(console.log);
// const diTypeItem = {
//     type: 'type',
//     content: {
//         arguments: {
//             argument: {
//                 item: {
//                     '#text': 'RantionBannerCollection',
//                     '@@name': 'rantion_banner_listing_data_source',
//                     '@@xsi:type': 'string'
//                 }
//                 , '@@name': 'collections', '@@xsi:type': 'array'
//             }
//         },
//         '@@name': 'Magento\\Framework\\View\\Element\\UiComponent\\DataProvider\\CollectionFactory'
//
//     }
// };
// magentoConfigXml.buildDiXml(diTypeItem).then(console.log);