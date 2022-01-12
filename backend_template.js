const fs = require('fs');
const os = require('os');
const path = require('path');
const {createDirIfNotExists, writeMagentoFile, moduleMeta, tableMeta, hump} = require("./commons");
const {modelMeta} = require("./model_template");

function backendUrlMeta(backendUrl) {
    const [routeName, routeMiddle] = backendUrl.split('/');
    return {
        'index': `${backendUrl}/index`,
        'base': routeName,
        'middle': routeMiddle
    }
}

function backendLocationMeta(moduleMeta, location) {
    const [grandNode, parentNode, name] = location.split('/');
    return {
        root: {
            id: "Magento_Backend::admin",
        },
        grand: {
            id: "Magento_Backend::" + grandNode
        },
        parent: {
            id: moduleMeta.name + '::' + parentNode,
            title: moduleMeta.name.replace('_', ' ')
        },
        node: {
            id: moduleMeta.name + '::' + name,
            title: moduleMeta.name.replace('_', ' ') + ' ' + name[0].toUpperCase() + name.slice(1)
        }
    };
}

function buildBackendRoute(moduleMeta, urlMeta) {
    const backendRouteDir = path.join(moduleMeta.path, 'etc', 'adminhtml');
    createDirIfNotExists(backendRouteDir);
    const routesXml = path.join(backendRouteDir, 'routes.xml');
    const routeContent = `<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:App/etc/routes.xsd">  
    <router id="admin">
        <route id="${urlMeta.base}" frontName="${urlMeta.base}">
            <module name="${moduleMeta.name}" before="Magento_Backend"/>
        </route>
    </router>
</config>
`
    if (!fs.existsSync(routesXml)) {
        writeMagentoFile(routesXml, routeContent);
    }
}

function buildAclXml(moduleMeta, locationMeta) {
    const aclContent = `<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="urn:magento:framework:Acl/etc/acl.xsd">
    <acl>
        <resources>
            <resource id="${locationMeta.root.id}">
                <resource id="${locationMeta.grand.id}">
                    <resource id="${locationMeta.parent.id}" title="${locationMeta.parent.title}" translate="title">
                        <resource id="${locationMeta.node.id}" title="${locationMeta.node.title}" translate="title"/>
                    </resource>
                </resource>
            <//resource>
        </resources>
    </acl>
</config>
`
    const aclXmlFile = path.join(moduleMeta.path, 'etc', 'acl.xml');
    if (fs.existsSync(aclXmlFile)) {
        fs.appendFile(aclXmlFile, aclContent, function (err) {
            throw err;
        });
    } else {
        writeMagentoFile(aclXmlFile, aclContent);
    }
}

function buildMenuXml(moduleMeta, locationMeta, urlMeta) {
    const menuContent = `<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Backend:etc/menu.xsd">
    <menu>
        <add id="${locationMeta.parent.id}" title="${locationMeta.parent.title}" translate="title" module="${moduleMeta.name}"
             parent="${locationMeta.grand.id}" resource="${locationMeta.parent.id}"/>
        <add id="${locationMeta.node.id}" title="${locationMeta.node.title}" translate="title" module="${locationMeta.parent}"
             action="${urlMeta.index}" resource="${locationMeta.node.id}"/>
    </menu>
</config>
`
    const menuXmlDir = path.join(moduleMeta.path, 'etc', 'adminhtml');
    createDirIfNotExists(menuXmlDir);
    const menuXmlFile = path.join(menuXmlDir, 'menu.xml');
    if (fs.existsSync(menuXmlFile)) {
        fs.appendFile(menuXmlFile, menuContent, function (err) {
            throw  err;
        });
    } else {
        writeMagentoFile(menuXmlFile, menuContent);
    }
}

function buildController(moduleMeta, urlMeta, modelMeta) {
    const controllerPath = path.join(moduleMeta.path, 'Controller');
    createDirIfNotExists(controllerPath);
    const controllerAdminhtml = path.join(controllerPath, 'Adminhtml');
    createDirIfNotExists(controllerAdminhtml);
    const controllerMiddle = urlMeta.middle[0].toUpperCase() + urlMeta.middle.slice(1);
    const routeUrlPath = path.join(controllerAdminhtml, controllerMiddle);
    createDirIfNotExists(routeUrlPath);

    const controllerNamespace = `namespace ${moduleMeta.namespace}Controller\\Adminhtml\\${controllerMiddle};`;
    const title = urlMeta.base[0].toUpperCase() + urlMeta.base.slice(1) + ' '
        + urlMeta.middle[0].toUpperCase() + urlMeta.middle.slice(1);
    const baseContent = baseControllerContent(controllerNamespace, moduleMeta.name, urlMeta.base, urlMeta.middle)
    writeMagentoFile(path.join(routeUrlPath, 'Base.php'), baseContent);
    const indexContent = indexControllerContent(controllerNamespace, urlMeta.base, urlMeta.middle);
    writeMagentoFile(path.join(routeUrlPath, 'Index.php'), indexContent);
    const newContent = newControllerContent(controllerNamespace, title);
    writeMagentoFile(path.join(routeUrlPath, 'NewAction.php'), newContent);
    const editContent = editControllerContent(controllerNamespace, title);
    writeMagentoFile(path.join(routeUrlPath, 'Edit.php'), editContent);
    const saveContent = saveControllerContent(controllerNamespace, modelMeta, urlMeta);
    writeMagentoFile(path.join(routeUrlPath, 'Save.php'), saveContent);
    const deleteContent = deleteControllerContent()
    writeMagentoFile(path.join(routeUrlPath, 'Delete.php'), deleteContent);
}

function baseControllerContent(controllerNamespace, moduleName, routeName, routeMiddle,) {
    return `<?php

${controllerNamespace}

use Magento\\Backend\\App\\Action;
use Magento\\Framework\\View\\Result\\PageFactory;

abstract class Base extends Action
{
    protected $pageFactory;
    
    protected $title;
    
    public const ADMIN_RESOURCE = '${moduleName}::${routeName}_${routeMiddle}';
    
    public function __construct(Action\Context $context, PageFactory $pageFactory)
    {
        parent::__construct($context);
        $this->pageFactory = $pageFactory;
    }
    
    public function execute()
    {
        $resultPage = $this-pageFactory->create();
        $resultPage->getConfig()->getTitle()->prepend(__($this-title));
        return $resultPage;
    }
    
}`;
}

function indexControllerContent(controllerNamespace, title) {

    return `<?php

${controllerNamespace}

class Index extends Base
{
    protected $title = '${title}';
}
`
}

function newControllerContent(controllerNamespace, title) {
    return `<?php

${controllerNamespace}

class NewAction extends Base
{
    protected $title = 'Add New ${title}';
}
`
}

function editControllerContent(controllerNamespace, title) {
    return `<?php

${controllerNamespace}

class Edit extends Base
{
    protected $title = 'Edit ${title}';
}
`
}

function saveControllerContent(controllerNamespace, modelMeta, urlMeta) {
    return `<?php

${controllerNamespace}

use Exception;
use Magento\\Framework\\Backend\\App\\Action;
use Magento\\Framework\\View\\Result\\PageFactory;
${modelMeta.repositoryUseName};
${modelMeta.name}Factory;

class Save extends Base
{
    private \$${modelMeta.variable}Factory;
    
    private ${modelMeta.repositoryVariable};
    
    public function __construct(Action\Context $context,
                                PageFactory $pageFactory,
                                ${modelMeta.name}Factory, ${modelMeta.variable}Factory,
                                ${modelMeta.repositoryUseName}, ${modelMeta.repositoryVariable})
    {
        parent::__construct($context, $pageFactory);
        $this->${modelMeta.variable}Factory = ${modelMeta.variable}Factory;
        $this->${modelMeta.variable}Repository = ${modelMeta.repositoryVariable};
    }
    
    
    public function execute()
    {
        $params = $this->getRequest()->getParams();
        $redirectPath = ${urlMeta.index};
        try {
            unset($params['form_key'], $params['key']);
            if ($params['id']) {
                $this->create($params);
            } else {
                $this->update($params);
            }
        } catch (Exception $exception) {
            $id = $params['id'] ?? '';
            if ($id) {
                $redirectPath = 'reward/gift/edit/id/' $id;
            }
            $this->messageManager->addErrorMessage(__("We can't save.");
        }
        $this-_redirect($redirectPath);
    }
    
    private function create(array $data): void
    {
        ${modelMeta.variable} = $this->${modelMeta.variable}Repository->build($data);
        $this->${modelMeta.variable}Repository->save(${modelMeta.variable});
    }
    
    private function update(array $data): void
    {
        ${modelMeta.variable} = $this->${modelMeta.variable}Repository->get($data['id']);
        unset($data['id']);
        ${modelMeta.variable} = $this->${modelMeta.variable}Repository->update(${modelMeta.variable}, $data);
        $this->${modelMeta.variable}Repository->save(${modelMeta.variable});
    }
    
}`;
}

function deleteControllerContent(controllerNamespace, modelMeta, urlMeta) {
    return `<?php

${controllerNamespace}

use Exception;
use Magento\\Framework\\Backend\\App\\Action;
use Magento\\Framework\\View\\Result\\PageFactory;
${modelMeta.repositoryUseName};
${modelMeta.name}Factory;

class Delete extends Base
{
    private \$${modelMeta.variable}Factory;
    
    private ${modelMeta.repositoryVariable};
    
    public function __construct(Action\Context $context,
                                PageFactory $pageFactory,
                                ${modelMeta.name}Factory, ${modelMeta.variable}Factory,
                                ${modelMeta.repositoryUseName}, ${modelMeta.repositoryVariable})
    {
        parent::__construct($context, $pageFactory);
        $this->${modelMeta.variable}Factory = ${modelMeta.variable}Factory;
        $this->${modelMeta.variable}Repository = ${modelMeta.repositoryVariable};
    }
    
    public function execute()
    {
        $id = $this->getRequest()->getParam('id');
        if ($id) {
            try {
                ${modelMeta.variable} = $this->${modelMeta.variable}Repository->get($id);
                $this->${modelMeta.variable}Repository->delete(${modelMeta.variable});
            } catch (Exception $e) {
                $this->messageManager->addErrorMessage(__("We can't delete."));
            }
        }
        $this->_redirect(${urlMeta.index});
    }
}`
}

function buildView(moduleMeta, tableMeta, urlMeta, locationMeta, modelMeta) {
    const viewDir = path.join(moduleMeta.path, 'view');
    createDirIfNotExists(viewDir);
    buildViewLayout(moduleMeta, urlMeta);
    buildViewUiComponent(moduleMeta, tableMeta, urlMeta, locationMeta, modelMeta);
}

function buildViewLayout(moduleMeta, urlMeta) {
    const layout = path.join(moduleMeta.path, 'view', 'layout');
    createDirIfNotExists(layout);
    const indexContent = `<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <body>
        <referenceContainer name="content">
            <uiComponent name="${urlMeta.base}_${urlMeta.middle}_listing"/>
        </referenceContainer>
    </body>
</page>`
    const indexFile = path.join(layout, `${urlMeta.base}_${urlMeta.middle}_index.xml`);
    writeMagentoFile(indexFile, indexContent);
    const editContent = `<?xml version="1.0"?>
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <body>
        <referenceContainer name="content">
            <uiComponent name="${urlMeta.base}_${urlMeta.middle}_form"/>
        </referenceContainer>
    </body>
</page>
`
    const editFile = path.join(layout, `${urlMeta.base}_${urlMeta.middle}_edit.xml`);
    writeMagentoFile(editFile, editContent);
    const newFile = path.join(layout, `${urlMeta.base}_${urlMeta.middle}_new.xml`);
    writeMagentoFile(newFile, editContent);
}

function buildViewUiComponent(moduleMeta, tableMeta, urlMeta, locationMeta, modelMeta) {
    const uiComponent = path.join(moduleMeta.path, 'view', 'ui_component');
    createDirIfNotExists(uiComponent);
    const uiComponentMeta = {
        base: urlMeta.base + '_' + urlMeta.middle,
        label: urlMeta.base[0].toUpperCase() + urlMeta.base.slice(1) + ' '
            + urlMeta.middle[0].toUpperCase() + urlMeta.base.slice(1),
        fromProvider: moduleMeta.namespace + "Model\\ResourceModel\\" + modelMeta.name + "\\DataProvider",
        listProvider: moduleMeta.namespace + "Ui\\Component\\DataProvider\\" + urlMeta.middle[0].toUpperCase() + urlMeta.middle.slice(1)
    }
    const formContent = buildUiComponentFormContent(uiComponentMeta, tableMeta, urlMeta, modelMeta);
    writeMagentoFile(path.join(uiComponent, uiComponentMeta.base + '_form.xml'), formContent);
    const listContent = buildUiComponentListContent(uiComponent, tableMeta, modelMeta);
    writeMagentoFile(path.join(uiComponent, uiComponentMeta.base + '_listing.xml'), listContent);
}

function buildUiComponentFormContent(uiComponentMeta, tableMeta, urlMeta, modelMeta) {
    let formContent = `<?xml version="1.0" encoding="UTF-8"?>
<form xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Ui:etc/ui_configuration.xsd">
    <argument name="data" xsi:type="array">
        <item name="js_config" xsi:type="array">
            <item name="provider" xsi:type="string">${uiComponentMeta.base}_form.${uiComponentMeta.base}_form_data_source</item>
        </item>
        <item name="label" xsi:type="string" translate="true">${uiComponentMeta.label}</item>
        <item name="template" xsi:type="string">templates/form/collapsible</item>
    </argument>
    <settings>
        <buttons>
            <button name="save" class="Magento\\Customer\\Block\\Adminhtml\\Edit\\SaveButton"/>
            <button name="reset" class="Magento\\Customer\\Block\\Adminhtml\\Edit\\ResetButton"/>
            <button name="back" class="Magento\\Customer\\Block\\Adminhtml\\Edit\\BackButton"/>
        </buttons>
        <namespace>${uiComponentMeta.base}_form</namespace>
        <dataScope>data</dataScope>
        <deps>
            <dep>${uiComponentMeta.base}_form.${uiComponentMeta}_form_data_source</dep>
        </deps>
    </settings>
    <dataSource name="${uiComponentMeta}_form_data_source">
        <argument name="data" xsi:type="array">
            <item name="js_config" xsi:type="array">
                <item name="component" xsi:type="string">Magento_Ui/js/form/provider</item>
            </item>
        </argument>
        <settings>
            <submitUrl path="${urlMeta.base}/${urlMeta.middle}/save"/>
        </settings>
        <dataProvider class="${uiComponentMeta.fromProvider}" name="${uiComponentMeta.base}_form_data_source">
            <settings>
                <requestFieldName>id</requestFieldName>
                <primaryFieldName>id</primaryFieldName>
            </settings>
        </dataProvider>
    </dataSource>
    <fieldset name="${uiComponentMeta.base}_form">
        <settings>
            <label translate="false">${uiComponentMeta.label} Information</label>
        </settings>
        <field name="id" formElement="hidden">
            <argument name="data" xsi:type="array">
                <item name="config" xsi:type="array">
                    <item name="source" xsi:type="string">${uiComponentMeta.base}</item>
                    <item name="label" xsi:type="string" translate="true">ID</item>
                </item>
            </argument>
            <settings>
                <dataType>text</dataType>
            </settings>
        </field>
`;
    for (let [columnName, value] of tableMeta.column) {
        if (columnName === tableMeta.primary.name || columnName === 'created_at' || columnName === 'updated_at') {
            continue;
        }
        let formElement = tableMeta.consts.has(columnName) ? 'select' : 'input';
        let columnLabel = hump(columnName);
        let selectClass = modelMeta.namespace + "Ui\\Component\\Listing\\Column\\" + columnLabel;
        formContent += os.EOL + `        <field name="${columnName}" formElement="${formElement}">`;
        formContent += `          <argument name="data" xsi:type="array">
                                          <item name="config" xsi:type="array">
                                              <item name="source" xsi:type="string">${columnName}</item>
                                              <item name="label" xsi:type="string" translate="true">${columnLabel}</item>
                                          </item>
                                      </argument>
`
        if (formElement === 'input') {
            formElement += `                <settings>
                                                    <dataType>text</dataType>
                                                    <validation>
                                                        <rule name="required-entity" xsi:type="boolean">true</rule>
                                                    </validation>
                                                    <dataType>text</dataType>
                                                    <visible>true</visible>
                                                    <dataScope>${uiComponentMeta.source}</dataScope>
                                                </settings>
            </field>
`
        } else {
            formElement += `                <settings>
                                                    <dataType>text</dataType>
                                                </settings>
                                                <formElements>
                                                    <select>
                                                        <settings>
                                                            <options class="${selectClass}"/>
                                                        </settings>
                                                    </select>
                                                </formElements>
`
        }
    }
    formContent += `
    </fieldset>
</form>
`
    return formContent;
}

function buildUiComponentListContent(uiComponentMeta, tableMeta, urlMeta, modelMeta) {
    let listContent = `<?xml version="1.0"?>
<listing xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Ui:etc/ui_configuration.xsd">
    <argument name="data" xsi:type="array">
        <item name="js_config" xsi:type="array">
            <item name="provider" xsi:type="string">${uiComponentMeta.base}_listing.${uiComponentMeta.base}_listing_data_source</item>
            <item name="deps" xsi:type="string">${uiComponentMeta.base}_listing.${uiComponentMeta.base}_listing_data_source</item>
        </item>
        <item name="spinner" xsi:type="string">${uiComponentMeta.base}_columns</item>
        <item name="buttons" xsi:type="array">
            <item name="add" xsi:type="array">
                <item name="name" xsi:type="string">add</item>
                <item name="label" xsi:type="string">Add New</item>
                <item name="class" xsi:type="string">primary</item>
                <item name="url" xsi:type="string">reward/gift/new</item>
            </item>
        </item>
    </argument>
    <dataSource name="${uiComponentMeta.base}_listing_data_source" component="Magento_Ui/js/grid/provider">
        <argument name="dataProvider" xsi:type="configurableObject">
            <argument name="class" xsi:type="string">${uiComponentMeta.listProvider}</argument>
            <argument name="name" xsi:type="string">${uiComponentMeta.base}_listing_data_source</argument>
            <argument name="primaryFieldName" xsi:type="string">id</argument>
            <argument name="requestFieldName" xsi:type="string">id</argument>
            <argument name="data" xsi:type="array">
                <item name="config" xsi:type="array">
                    <item name="update_url" xsi:type="url" path="mui/index/render"/>
                    <item name="storageConfig" xsi:type="array">
                        <item name="indexField" xsi:type="string">id</item>
                    </item>
                </item>
            </argument>
        </argument>
        <argument name="data" xsi:type="array">
            <item name="js_config" xsi:type="array">
                <item name="component" xsi:type="string">Magento_Ui/js/grid/provider</item>
            </item>
        </argument>
    </dataSource>
    <listingToolbar name="listing_top">
        <bookmark name="bookmarks"/>
        <columnsControls name="columns_controls"/>
        <filterSearch name="fulltext"/>
        <filters name="listing_filters"/>
        <paging name="listing_paging"/>
    </listingToolbar>
    <columns name="${uiComponentMeta.base}_columns">
        <column name="id">
            <settings>
                <filter>textRange</filter>
                <dataType>number</dataType>
                <label translate="true">ID</label>
                <sorting>desc</sorting>
            </settings>
        </column>
`
    for (let [columnName, value] of tableMeta.column) {
        let columnType = tableMeta.consts.has(columnName) ? 'select' : 'input';
        let columnLabel = hump(columnName);
        let option = modelMeta.namespace + "Ui\\Component\\Listing\\Column\\" + columnLabel;
        if (columnType === 'select') {
            listContent += os.EOL +
                `
      <column name="${columnName}"> 
           <argument name="data" xsi:type="array">
                <item name="options" xsi:type="object">${option}</item>
                <item name="config" xsi:type="array">
                    <item name="filter" xsi:type="string">select</item>
                    <item name="label" xsi:type="string" translate="true">${columnLabel}</item>
                    <item name="component" xsi:type="string">Magento_Ui/js/grid/columns/select</item>
                    <item name="dataType" xsi:type="string">select</item>
                    <item name="editor" xsi:type="array">
                        <item name="editorType" xsi:type="string">select</item>
                    </item>
                </item>
            </argument>              
        </column>   
`
        } else {
            if (value.type === 'timestamp' || value.type === 'datetime') {
                listContent += os.EOL +
                    `
        <column name="${columnName}" class="Magento\\Ui\\Component\\Listing\\Columns\\Date" component="Magento_Ui/js/grid/columns/date">
            <argument name="data" xsi:type="array">
                <item name="config" xsi:type="array">
                    <item name="dateFormat" xsi:type="string">yyyy-MM-dd</item>
                </item>
            </argument>
            <settings>
                <filter>dateRange</filter>
                <dataType>date</dataType>
                <label translate="true">Expire Date</label>
            </settings>
        </column>
`
            } else {
                listContent += os.EOL +
                    `
        <column name="${columnName}">
            <settings>
                <dataType>text</dataType>
                <label translate="true">${columnLabel}</label>
            </settings>
        </column>
`
            }
        }
    }
    const actions = ${modelMeta.namespace} +"Ui\\Component\\Listing\\Column\\" + urlMeta.middle[0].toUpperCase() + urlMeta.middle.slice(1) + "Actions";
    listContent +=
        `
        <actionsColumn name="actions" class="${actions}">
            <argument name="data" xsi:type="array">
                <item name="config" xsi:type="array">
                    <item name="resizeEnabled" xsi:type="boolean">false</item>
                    <item name="resizeDefaultWidth" xsi:type="string">107</item>
                    <item name="indexField" xsi:type="string">id</item>
                </item>
            </argument>
        </actionsColumn>
    </columns>
</listing>
`
    return listContent;
}

function buildUiColumnClass(moduleMeta, tableMeta) {
    let listDir = path.join(moduleMeta.path, 'Ui', 'Component', 'Listing');
    createDirIfNotExists(listDir);
    let columnDir = path.join(listDir, 'Column');
    createDirIfNotExists(columnDir);
    const classNamespace = moduleMeta.namespace + 'Ui\\Component\\Listing\\Column';
    for (let [column, consts] of tableMeta.consts) {
        let className = hump(column);
        let classFileName = path.join(componentDir, className + '.php');
        createDirIfNotExists(classFileName);
        let classContent = `<?php

namespace ${classNamespace};

use Magento\\Framework\\Data\\OptionSourceInterface;

class ${className} implements OptionSourceInterface
{
    public function toOptionArray(): array
    {
        return [
`
        for (let constName in consts) {
            classContent += os.EOL + `
            [
                'value' => ${consts[constName]},
                'label' => ${constName.replace('_', ' ')}
            ],           
`
        }
        classContent += `
        ];
    }
    
    public function toArray(): array
    {
        return [
`
        for (let constName in consts) {
            classContent += os.EOL + `
            ${consts[constName]} => ${constName.replace('_', ' ')},            
`
        }
        classContent += `
        ];
    }
}
`;
        writeMagentoFile(classFileName, classContent);
    }
}

function buildProvider(moduleMeta, tableMeta, urlMetaData, modelMeta) {
    const componentDataProvider = path.join(moduleMeta.path, 'Ui', 'Component', 'DataProvider');
    createDirIfNotExists(componentDataProvider);
    const componentProviderClass = urlMetaData.middle[0].toUpperCase() + urlMetaData.middle.slice(1) + 'DataProvider';
    const componentDataProviderContent = `<?php
    
namespace ${moduleMeta.namespace}Ui\\Component\\DataProvider;

use Magento\\Framework\\View\\Element\\UiComponent\\DataProvider\\DataProvider;

class ${componentProviderClass} extends DataProvider
{

}
`
    writeMagentoFile(path.join(componentDataProvider, componentProviderClass + '.php'), componentDataProviderContent);

    let modelDir = path.join(moduleMeta.path, 'Model');
    createDirIfNotExists(modelDir);
    let resourceDir = path.join(modelDir, 'ResourceModel');
    createDirIfNotExists(resourceDir);
    let resourceModelDir = path.join(resourceDir, modelMeta.name);
    createDirIfNotExists(resourceModelDir);
    const dataProviderFile = path.join(resourceModelDir, 'DataProvider.php');
    const dataProviderContent = `<?php

namespace ${moduleMeta.namespace}Model\\ResourceModel\\${modelMeta.name};

use Magento\\Framework\\App\\RequestInterface;
use Magento\\Framework\\Exception\\NoSuchEntityException;
use Magento\\Ui\\DataProvider\\AbstractDataProvider;
${modelMeta.repositoryUseName};

class DataProvider extends AbstractDataProvider
{
    private $request;
    
    private $repository;
    
    public function __construct($name,
                                $primaryFieldName,
                                $requestFieldName,
                                RequestInterface $request,
                                ${modelMeta.repositoryName} ${moduleMeta.repositoryVariable},
                                array $meta = [],
                                array $data = [])
    {
        parent::__construct($name, $primaryFieldName, $requestFieldName, $meta, $data)
        $this->request = $request;
        $this->repository = ${moduleMeta.repositoryVariable};
    }
    
    public function getData(): array
    {
        if (isset($this->loadedData)) {
            return $this->loadedData;
        }
        $this->loadedData = [];
        $requestId = $this->request->getParam($this->requestFieldName);
        if ($requestId) {
            $post = $this->repository->get($requestId);
            if (!$post->getId()) {
                throw NoSuchEntityException::singleField('id', $requestId);
            }
            $postData = $post->getData();
            $this->loadedData[$requestId] = $postData;
        }
        return $this->loadedData;
    }
    
}
`
    writeMagentoFile(dataProviderFile, dataProviderContent);
}

function buildDiXml(moduleMeta, modelMeta, urlMeta, tableMetaData) {
    const diXmlFile = path.join(moduleMeta.path, 'etc', 'di.xml');
    const collection = hump(urlMeta.base) + hump(urlMeta.middle) + 'Collection';
    const diXmlContent = `<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="urn:magento:framework:ObjectManager/etc/config.xsd">
<type name="magento\\Framework\\View\\Element\\UiComponent\\DataProvider\\CollectionFactory">
    <arguments>
        <argument name="collections" xsi:type="array">
            <item name="${urlMeta.base}_${urlMeta.middle}_listing_data_source" xsi:type="string">${collection}</item>
        </argument>
    </arguments>
</type>
<virtualType name="${collection} type="Magento\\Framework\\View\\Element\\UiComponent\\DataProvider\\SearchResult">
    <arguments>
        <argument name="mainTable" xsi:type="string">${tableMetaData.name}</argument>
        <argument name="resourceModel" xsi:type="string">${modelMeta.resourceNamespace}\\${modelMeta.name}</argument>
    </arguments>
</virtualType>
</config>
`
    if (fs.existsSync(diXmlFile)) {
        fs.appendFile(diXmlFile, diXmlContent, err => {throw err;})
    } else {
        writeMagentoFile(diXmlFile, diXmlContent);
    }
}

async function buildBackendTemplate(module, table, url, location) {
    const urlMetaData = backendUrlMeta(url);
    const tableMetaData = tableMeta(table);
    const moduleMetaData = await moduleMeta(module);
    const modelMetaData = modelMeta(moduleMetaData, table);
    const locationMeta = backendLocationMeta(location);
    buildBackendRoute(moduleMetaData, urlMetaData);
    buildController(moduleMetaData, urlMetaData, modelMetaData);
    buildAclXml(locationMeta)
    buildMenuXml(moduleMetaData, locationMeta, urlMetaData);
    buildView(moduleMetaData, tableMetaData, urlMetaData, locationMeta, modelMetaData);
    let uiDir = path.join(moduleMeta.path, 'Ui');
    createDirIfNotExists(uiDir);
    let componentDir = path.join(uiDir, 'Component');
    createDirIfNotExists(componentDir);
    if (tableMetaData.consts.size > 0) {
        buildUiColumnClass(tableMetaData);
    }
    buildProvider(modelMetaData, tableMetaData, urlMetaData, modelMetaData);
    buildDiXml(moduleMetaData, modelMetaData, urlMetaData, tableMetaData);
}

module.exports = buildBackendTemplate;