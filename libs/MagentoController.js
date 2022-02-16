const path = require('path');
const MagentoCommons = require('./MagentoCommons');

class MagentoController {

    #moduleMeta;
    
    #backendUrl;
    
    #modelMeta;
    
    #controllerNamespace;
    
    #controllerTitle;
    
    constructor(moduleMeta, modelMeta) {
        this.#moduleMeta = moduleMeta;
        this.#modelMeta = modelMeta;
    }

    buildBackendController(backendUrlMeta, imageColumn) {
        this.#backendUrl = backendUrlMeta;
        this.#controllerNamespace = `${this.#moduleMeta.namespace}\\Controller\\Adminhtml\\${backendUrlMeta.controller[0].toUpperCase()}${backendUrlMeta.controller.slice(1)}`;
        this.#controllerTitle = `${backendUrlMeta.route[0].toUpperCase()}${backendUrlMeta.route.slice(1)} ${backendUrlMeta.controller[0].toUpperCase()}${backendUrlMeta.controller.slice(1)}`;
        const adminController = path.join(this.#moduleMeta.realPath, 'Controller', 'Adminhtml', `${backendUrlMeta.controller[0].toUpperCase()}${backendUrlMeta.controller.slice(1)}`);
        MagentoCommons.syncRecursionCreateDir(adminController);
        MagentoCommons.asyncWriteFile(path.join(adminController, 'Base.php'), this.#abstractBaseController);
        MagentoCommons.asyncWriteFile(path.join(adminController, 'Index.php'), this.#indexController);
        MagentoCommons.asyncWriteFile(path.join(adminController, 'NewAction.php'), this.#newController);
        MagentoCommons.asyncWriteFile(path.join(adminController, 'Save.php'), this.#saveController);
        MagentoCommons.asyncWriteFile(path.join(adminController, 'Edit.php'), this.#editController);
        MagentoCommons.asyncWriteFile(path.join(adminController, 'Delete.php'), this.#deleteController);
        if (imageColumn) {
            MagentoCommons.asyncWriteFile(path.join(adminController, 'Upload.php'), this.#uploadController(imageColumn));
        }
    }

    get #abstractBaseController() {
        return `<?php
        
namespace ${this.#controllerNamespace};

use Magento\\Backend\\App\\Action;
use Magento\\Backend\\App\\Action\\Context;
use Magento\\Framework\\View\\Result\\PageFactory;

abstract class Base extends Action
{
    protected $pageFactory;
    
    protected $title;
    
    public const ADMIN_RESOURCE = '${this.#moduleMeta.name}::${this.#backendUrl.controller}';
    
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
    }

    get #indexController() {
        return `<?php

namespace ${this.#controllerNamespace};

class Index extends Base
{
    protected $title = '${this.#controllerTitle}';
}`
    }

    get #newController() {
        return `<?php

namespace ${this.#controllerNamespace};

class NewAction extends Base
{
    protected $title = 'Add New ${this.#controllerTitle}';
}`
    }

    get #editController() {
        return `<?php

namespace ${this.#controllerNamespace};

class Edit extends Base
{
    protected $title = 'Edit ${this.#controllerTitle}';
}`
    }

    get #saveController() {
        return `<?php

namespace ${this.#controllerNamespace};

use Exception;
use Magento\\Framework\\Exception\\CouldNotSaveException;
use Magento\\Backend\\App\\Action\\Context;
use Magento\\Framework\\View\\Result\\PageFactory;
${this.#modelMeta.repositoryUseName};

class Save extends Base
{    
    private ${this.#modelMeta.repositoryVariable};
    
    public function __construct(Context $context,
                                PageFactory $pageFactory,
                                ${this.#modelMeta.repositoryName} ${this.#modelMeta.repositoryVariable})
    {
        parent::__construct($context, $pageFactory);
        $this->${this.#modelMeta.variable.slice(1)}Repository = ${this.#modelMeta.repositoryVariable};
    }
    
    
    public function execute()
    {
        $params = $this->getRequest()->getParams();
        $redirectPath = '${this.#backendUrl.url}/index';
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
                $redirectPath = '${this.#backendUrl.route}/${this.#backendUrl.controller}/edit/id/'. $id;
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
        ${this.#modelMeta.variable} = $this->${this.#modelMeta.variable.slice(1)}Repository->build($data);
        $this->${this.#modelMeta.variable.slice(1)}Repository->save(${this.#modelMeta.variable});
    }
  
    /**
     * @throws CouldNotSaveException
     */
    private function update(array $data): void
    {
        $id = (int)$data['id'];
        unset($data['id']);
        ${this.#modelMeta.variable} = $this->${this.#modelMeta.variable.slice(1)}Repository->get($id);
        ${this.#modelMeta.variable} = $this->${this.#modelMeta.variable.slice(1)}Repository->update(${this.#modelMeta.variable}, $data);
        $this->${this.#modelMeta.variable.slice(1)}Repository->save(${this.#modelMeta.variable});
    }
};
`
    }

    get #deleteController() {
        return `<?php

namespace ${this.#controllerNamespace};

use Exception;
use Magento\\Backend\\App\\Action\\Context;
use Magento\\Framework\\View\\Result\\PageFactory;
${this.#modelMeta.repositoryUseName};

class Delete extends Base
{
    private ${this.#modelMeta.repositoryVariable};
    
    public function __construct(Context $context,
                                PageFactory $pageFactory,
                                ${this.#modelMeta.repositoryName} ${this.#modelMeta.repositoryVariable})
    {
        parent::__construct($context, $pageFactory);
        $this->${this.#modelMeta.variable.slice(1)}Repository = ${this.#modelMeta.repositoryVariable};
    }
    
    public function execute()
    {
        $id = $this->getRequest()->getParam('id');
        if ($id) {
            try {
                ${this.#modelMeta.variable} = $this->${this.#modelMeta.variable.slice(1)}Repository->get((int)$id);
                $this->${this.#modelMeta.variable.slice(1)}Repository->delete(${this.#modelMeta.variable});
            } catch (Exception $e) {
                $this->messageManager->addErrorMessage(__("We can't delete."));
            }
        }
        $this->_redirect('${this.#backendUrl.url}/index');
    }
}`
    }

    #uploadController(columnName) {
        return `<?php

namespace ${this.#controllerNamespace};

use Magento\\Backend\\App\\Action\\Context;
use Magento\\Backend\\App\\Action;
use Magento\\Framework\\App\\Action\\HttpPostActionInterface;
use Magento\\Framework\\Controller\\ResultFactory;
use Magento\\Catalog\\Model\\ImageUploader;
use Exception;

class Upload extends Action implements HttpPostActionInterface
{
    protected $imageUploader;
    
    public function __construct(Context $context, ImageUploader $imageUploader)
    {
        parent::__construct($context);
        $this->imageUploader = $imageUploader;
    }
    
    public function execute()
    {
        $imageId = $this->_request->getParam('param_name', '${columnName}');
        try {
            $result = $this->imageUploader->saveFileToTmpDir($imageId);
        } catch (Exception $exception) {
            $result = ['error' => $exception->getMessage(), 'code' => $exception->getCode()];
        }
        return $this->resultFactory->create(ResultFactory::TYPE_JSON)->setData($result);
    }

}`
    }
}

module.exports = MagentoController;
