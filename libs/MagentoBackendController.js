const path = require('path');
const MagentoCommons = require('./MagentoCommons');

class MagentoBackendController {

    constructor(moduleMeta, backendUrlMeta, modelMeta) {
        this.moduleMeta = moduleMeta;
        this.backendUrl = backendUrlMeta;
        this.modelMeta = modelMeta;
        this.controllerNamespace = `${moduleMeta.namespace}\\Controller\\Adminhtml\\${backendUrlMeta.controller[0].toUpperCase()}${backendUrlMeta.controller.slice(1)}`;
        this.controllerTitle = `${backendUrlMeta.route[0].toUpperCase()}${backendUrlMeta.route.slice(1)} ${backendUrlMeta.controller[0].toUpperCase()}${backendUrlMeta.controller.slice(1)}`;

    }

    initController() {
        const controllerPath = path.join(this.moduleMeta.realPath, 'Controller');
        MagentoCommons.createDirIfNotExists(controllerPath);
        const adminController = path.join(controllerPath, 'adminhtml');
        MagentoCommons.createDirIfNotExists(adminController);
        MagentoCommons.asyncWriteFile(path.join(adminController, 'Base.php'), this.abstractBaseController);
        MagentoCommons.asyncWriteFile(path.join(adminController, 'Index.php'), this.indexController);
        MagentoCommons.asyncWriteFile(path.join(adminController, 'NewAction.php'), this.newController);
        MagentoCommons.asyncWriteFile(path.join(adminController, 'Save.php'), this.saveController);
        MagentoCommons.asyncWriteFile(path.join(adminController, 'Edit.php'), this.editController);
        MagentoCommons.asyncWriteFile(path.join(adminController, 'Delete.php'), this.deleteController);
    }

    get abstractBaseController() {
        this.abstractBaseContent = `<?php
use ${this.controllerNamespace};

use Magento\\Backend\\App\\Action;
use Magento\\Backend\\App\\Action\\Context;
use Magento\\Framework\\View\\Result\\PageFactory;

abstract class Base extends Action
{
    protected $pageFactory;
    
    protected $title;
    
    public const ADMIN_RESOURCE = '${this.moduleMeta.name}::${this.backendUrl.controller}'
    
    public function __construct(Context $context, PageFactory $pageFactory)
    {
        parent::__construct($context);
        $this->pageFactory = $pageFactory;
    }
    
    public function execute()
    {
        $resultPage = $this->pageFactory->create();
        $resultPage->getConfig()->getTitle()->prepend(__($this->title));
        return $resultPage;
    }

}`;
        return this.abstractBaseContent;
    }

    get indexController() {
        this.indexControllerContent = `<?php

use ${this.controllerNamespace};

class Index extends Base
{
    protected $title = '${this.controllerTitle}';
}`
        return this.indexControllerContent;
    }

    get newController() {
        this.newControllerContent = `<?php

use ${this.controllerNamespace};

class NewAction extends Base
{
    protected $title = 'Add New ${this.controllerTitle}';
}`
        return this.newControllerContent;
    }

    get editController() {
        this.editControllerContent = `<?php

use ${this.controllerNamespace};

class Edit extends Base
{
    protected $title = 'Edit ${this.controllerTitle}';
}`
        return this.editControllerContent;
    }

    get saveController() {
        this.saveControllerContent = `<?php

use ${this.controllerNamespace};

use Exception;
use Magento\\Framework\\Exception\\CouldNotSaveException;
use Magento\\Backend\\App\\Action\\Context;
use Magento\\Framework\\View\\Result\\PageFactory;
${this.modelMeta.repositoryUseName};

class Save extends Base
{    
    private ${this.modelMeta.repositoryVariable};
    
    public function __construct(Context $context,
                                PageFactory $pageFactory,
                                ${this.modelMeta.repositoryName} ${this.modelMeta.repositoryVariable})
    {
        parent::__construct($context, $pageFactory);
        $this->${this.modelMeta.variable.slice(1)}Repository = ${this.modelMeta.repositoryVariable};
    }
    
    
    public function execute()
    {
        $params = $this->getRequest()->getParams();
        $redirectPath = '${this.backendUrl.url}/index';
        try {
            unset($params['form_key'], $params['key']);
            if ($params['id']) {
                $this->update($params);
            } else {
                $this->create($params);
            }
        } catch (Exception $exception) {
            $id = $params['id'] ?? '';
            if ($id) {
                $redirectPath = '${this.backendUrl.route}/${this.backendUrl.controller}/edit/id/'. $id;
            }
            $this->messageManager->addErrorMessage(__("We can't save."));
        }
        $this->_redirect($redirectPath);
    }
    
    /**
     * @throws CouldNotSaveException
     */
    private function create(array $data): void
    {
        ${this.modelMeta.variable} = $this->${this.modelMeta.variable.slice(1)}Repository->build($data);
        $this->${this.modelMeta.variable.slice(1)}Repository->save(${this.modelMeta.variable});
    }
  
    /**
     * @throws CouldNotSaveException
     */
    private function update(array $data): void
    {
        $id = (int)$data['id'];
        unset($data['id']);
        ${this.modelMeta.variable} = $this->${this.modelMeta.variable.slice(1)}Repository->get($id);
        ${this.modelMeta.variable} = $this->${this.modelMeta.variable.slice(1)}Repository->update(${this.modelMeta.variable}, $data);
        $this->${this.modelMeta.variable.slice(1)}Repository->save(${this.modelMeta.variable});
    }
};
`
        return this.saveControllerContent;
    }

    get deleteController() {
        this.deleteControllerContent = `<?php

use ${this.controllerNamespace};

use Exception;
use Magento\\Backend\\App\\Action\\Context;
use Magento\\Framework\\View\\Result\\PageFactory;
${this.modelMeta.repositoryUseName};

class Delete extends Base
{
    private ${this.modelMeta.repositoryVariable};
    
    public function __construct(Context $context,
                                PageFactory $pageFactory,
                                ${this.modelMeta.repositoryName} ${this.modelMeta.repositoryVariable})
    {
        parent::__construct($context, $pageFactory);
        $this->${this.modelMeta.variable.slice(1)}Repository = ${this.modelMeta.repositoryVariable};
    }
    
    public function execute()
    {
        $id = $this->getRequest()->getParam('id');
        if ($id) {
            try {
                ${this.modelMeta.variable} = $this->${this.modelMeta.variable.slice(1)}Repository->get((int)$id);
                $this->${this.modelMeta.variable.slice(1)}Repository->delete(${this.modelMeta.variable});
            } catch (Exception $e) {
                $this->messageManager->addErrorMessage(__("We can't delete."));
            }
        }
        $this->_redirect('${this.backendUrl.url}/index');
    }
}`
        return this.deleteControllerContent;
    }
}

module.exports = MagentoBackendController;
