const path = require('path');
const Commons = require(path.join(__dirname, 'libs', 'MagentoCommons.js'));
const MagentoConfigXml = require(path.join(__dirname, 'libs', 'MagentoConfigXml.js'));

const magentoModuleName = 'Module_Package';
const magentoModuleMeta = Commons.magentoModuleMeta(__dirname, magentoModuleName);
const magentoConfigXml = new MagentoConfigXml(magentoModuleMeta);

// magentoConfigXml.initDiXml();
// magentoConfigXml.initAclXml();
// magentoConfigXml.initDbSchemaXml();

const tableNode = {
    column: [
        {
            'xsi:type': 'int',
            name: 'id',
            unsigned: 'true',
            nullable: 'false',
            identity: 'true'
        },
        {
            'xsi:type': 'varchar',
            name: 'title',
            nullable: 'false',
            length: '255'
        },
        {
            'xsi:type': 'varchar',
            name: 'image_url',
            nullable: 'false',
            length: '255'
        },
        {
            'xsi:type': 'varchar',
            name: 'video_url',
            nullable: 'false',
            length: '255'
        },
        {
            'xsi:type': 'tinyint',
            name: 'state',
            unsigned: true,
            nullable: 'false',
            default: '1',
            comment: '0:disable,1:enable'
        },
        {
            'xsi:type': 'tinyint',
            name: 'type',
            unsigned: 'true',
            nullable: 'false',
            default: '0',
            comment: '0:pc,1:mobile'
        },
        {
            'xsi:type': 'timestamp',
            name: 'created_at',
            nullable: 'false',
            on_update: 'false',
            default: 'CURRENT_TIMESTAMP'
        },
        {
            'xsi:type': 'timestamp',
            name: 'updated_at',
            nullable: 'false',
            on_update: 'true',
            default: 'CURRENT_TIMESTAMP'
        }
    ],
    constraint: {
        column: { name: 'id' },
        'xsi:type': 'primary',
        referenceId: 'PRIMARY'
    },
    name: 'rantion_banner_3',
    resource: 'default',
    engine: 'innodb',
    comment: ''
}
magentoConfigXml.buildDbSchemaXml(tableNode);

const menuAddItem = {
    id: 'Rantion_Content::main_3',
    title: 'Rantion Content',
    translate: 'title',
    module: 'Rantion_Content',
    parent: 'Magento_Backend::marketing',
    resource: 'Rantion_Content::main'
};
magentoConfigXml.buildMenuXml(menuAddItem);
