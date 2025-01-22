const router = require('express').Router();

const indexRouter                   = require('../index.router');

const userRouter                    = require('../users-module/user.router');
const roleRouter                    = require('../users-module/role.router');
const applicationRouter             = require('../users-module/application.router');
const endpointRouter                = require('../users-module/endpoint.router');
const customerRouter                = require('../users-module/customer.router');
const agentRouter                   = require('../users-module/agent.router');
const passwordRecoverRouter         = require('../users-module/password-recover.router');

const productRouter                 = require('../products-module/product.router');
const collectionRouter              = require('../products-module/collection.router');
const brandRouter                   = require('../products-module/brand.router');
const discountRouter                = require('../products-module/discount.router');
const accessProductCatalogRouter    = require('../products-module/access-product-catalog.router');

const affiliateRouter               = require('../stores-module/affiliate.router');
const shippingGroupRouter           = require('../stores-module/shipping-group.router');
const cartRouter                    = require('../stores-module/cart.router');
const orderRouter                   = require('../stores-module/order.router');
const preorderRouter                = require('../stores-module/preorder.router');
const countryRouter                 = require('../stores-module/country.router');
const buyAgainRouter                = require('../stores-module/buy-again.router');

const slideshowRouter               = require('../front-module/slideshow.router');
const navigationRouter              = require('../front-module/navigation.router');
const elementGridRouter             = require('../front-module/element-grid.router');
const pageRouter                    = require('../front-module/page.router');
const galleryFilesRouter            = require('../front-module/gallery-file.router');

const agentAppRouter                = require('../apps-module/agent-app.router');
const billingAppRouter              = require('../apps-module/billing-app.router');
const klaviyoAppRouter              = require('../apps-module/klaviyo-app.router');

const generalSettingRouter          = require('../config-module/back/general-setting.router');
const languageRouter                = require('../config-module/back/language.router');

router.use( '/'						    , indexRouter );

router.use( '/users'				    , userRouter );
router.use( '/roles'				    , roleRouter );
router.use( '/applications'		        , applicationRouter );
router.use( '/endpoints'			    , endpointRouter );
router.use( '/customers'			    , customerRouter );
router.use( '/agents'			        , agentRouter );
router.use( '/password-recovers'	    , passwordRecoverRouter );

router.use( '/products'			        , productRouter );
router.use( '/collections'			    , collectionRouter );
router.use( '/brands'			        , brandRouter );
router.use( '/discounts'			    , discountRouter );
router.use( '/access-product-catalog'   , accessProductCatalogRouter );

router.use( '/affiliates'			    , affiliateRouter );
router.use( '/shipping-groups'		    , shippingGroupRouter );
router.use( '/carts'				    , cartRouter );
router.use( '/orders'				    , orderRouter );
router.use( '/preorders'		        , preorderRouter );
router.use( '/countries'			    , countryRouter );
router.use( '/buy-again'			    , buyAgainRouter );

router.use( '/front/slideshows'	        , slideshowRouter );
router.use( '/front/navigations'	    , navigationRouter );
router.use( '/front/element-grids'	    , elementGridRouter );
router.use( '/front/pages'	            , pageRouter );
router.use( '/front/gallery-files'	    , galleryFilesRouter );

router.use( '/app-agent'			    , agentAppRouter );
router.use( '/app-billing'			    , billingAppRouter );
router.use( '/app-klaviyo'			    , klaviyoAppRouter );

router.use( '/general-settings'		    , generalSettingRouter );
router.use( '/languages'		        , languageRouter );

const backMarketplaceRouter = require( '../config-module/back/marketplace.router' ); 

router.use( '/marketplace'		    , backMarketplaceRouter );
module.exports = router;