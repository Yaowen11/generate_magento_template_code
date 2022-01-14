class BackendController {

    constructor(magentoModuleMeta, backendUrlMeta, modelMeta) {
        this.magentoModuleMeta = magentoModuleMeta;
        this.magentoBackendUrl = backendUrlMeta;
        this.modelMeta = modelMeta;
        this.controllerNamespace = `${magentoModuleMeta.namespace}\\Controller\\Adminhtml\\${backendUrlMeta.controller[0].toUpperCase()}${backendUrlMeta.controller.slice(1)}`;
        this.controllerTitle = `${backendUrlMeta.route[0].toUpperCase()}${backendUrlMeta.route.slice(1)} ${backendUrlMeta.controller[0].toUpperCase()}${backendUrlMeta.controller.slice(1)}`;

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
    
    public const ADMIN_RESOURCE = '${this.magentoModuleMeta.name}::${this.magentoBackendUrl.controller}'
    
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
`
    }
}