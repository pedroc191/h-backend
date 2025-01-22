module.exports = {
    userController                  : require('../users-module/user.controller'),
    roleController                  : require('../config-module/back/role.controller'),
    applicationController           : require('../config-module/back/application.controller'),
    endpointController              : require('../config-module/back/endpoint.controller'),
    customerController              : require('../users-module/customer.controller'),
    agentController                 : require('../users-module/agent.controller'),
    passwordRecoverController       : require('../users-module/password-recover.controller'),

    backJobController                  : require('../jobs-module/main.controller'),

    productController               : require('../products-module/back/product.controller'),
    discountController              : require('../products-module/agent/discount.controller'),
    collectionController            : require('../products-module/back/collection.controller'),
    bestSellerController            : require('../products-module/back/best-seller.controller'),
    brandController                 : require('../products-module/back/brand.controller'),

    affiliateController             : require('../stores-module/back/affiliate.controller'),
    shippingGroupController         : require('../stores-module/back/shipping-group.controller'),
    cartController                  : require('../stores-module/back/cart.controller'),
    orderController                 : require('../stores-module/back/order.controller'),
    preorderController              : require('../stores-module/back/preorder.controller'),
    buyAgainController              : require('../stores-module/back/buy-again.controller'),

    slideshowController             : require('../front-module/back/slideshow.controller'),
    navigationController            : require('../front-module/back/navigation.controller'),
    pageController                  : require('../front-module/back/page.controller'),

    agentAppController              : require('../apps-module/agent-app.controller'),
    billingAppController            : require('../apps-module/billing-app.controller'),
    klaviyoAppController            : require('../apps-module/klaviyo-app.controller'),
    
    generalSettingController        : require('../config-module/back/general-setting.controller'),
    languageController              : require('../config-module/back/language.controller'),

    backMarketplaceController       : require('../config-module/back/marketplace.controller')
};