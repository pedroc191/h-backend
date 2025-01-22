// =============================================================================
// DATA LAYERS
// =============================================================================
const syncLayer   = require( '../data-layer/mongoose/sync.layer' );
const crudLayer   = require( '../data-layer/mongoose/crud.layer' );
// =============================================================================
// CONFIG MODULE - POPULATES
// =============================================================================
const configPopulate = require( '../data-layer/mongoose/populates/config-module.populate' );
// =============================================================================
// FRONT MODULE - POPULATES
// =============================================================================
const frontPopulate = require( '../data-layer/mongoose/populates/front-module.populate' );
// =============================================================================
// PRODUCTS MODULE - POPULATES
// =============================================================================
const productsPopulate = require( '../data-layer/mongoose/populates/products-module.populate' );
// =============================================================================
// STORES MODULE - POPULATES
// =============================================================================
const storesPopulate = require( '../data-layer/mongoose/populates/stores-module.populate' );
// =============================================================================
// USERS MODULE - POPULATES
// =============================================================================
const usersPopulate = require( '../data-layer/mongoose/populates/users-module.populate' );

module.exports = {
    // =============================================================================
    // CONFIG MODULE - POPULATES
    // =============================================================================
    backAccessProductCatalogService     : new syncLayer( require('../models/config-module/back/access-product-catalog.model')       , configPopulate.back_access_product_catalog_populate ),
    backApplicationService              : new syncLayer( require('../models/config-module/back/application.model')                  , configPopulate.back_application_populate ),
    backCountryService                  : new crudLayer( require('../models/config-module/back/country.model')                      , configPopulate.back_country_populate ),
    backEndpointService                 : new crudLayer( require('../models/config-module/back/endpoint.model')                     , configPopulate.back_endpoint_populate ),
    backGeneralSettingService           : new crudLayer( require('../models/config-module/back/general-setting.model')              , configPopulate.back_general_setting_populate ),
    backGeneralFilterService            : new syncLayer( require('../models/config-module/back/general-filter.model')               , configPopulate.back_general_filter_populate ),
    backMarketplaceService              : new crudLayer( require('../models/config-module/back/marketplace.model')                  , configPopulate.back_marketplace_populate ),
    backLanguageService                 : new crudLayer( require('../models/config-module/back/language.model')                     , configPopulate.back_language_populate ),
    backMenuOptionService               : new crudLayer( require('../models/config-module/back/menu-option.model')                  , configPopulate.back_menu_option_populate ),
    backRoleService                     : new crudLayer( require('../models/config-module/back/role.model')                         , configPopulate.back_role_populate ),
    backShippingGroupService            : new syncLayer( require('../models/config-module/back/shipping-group.model')               , configPopulate.back_shipping_group_populate ),
    backShippingZoneService             : new syncLayer( require('../models/config-module/back/shipping-zone.model')                , configPopulate.back_shipping_zone_populate ),
    backShippingRateService             : new syncLayer( require('../models/config-module/back/shipping-rate.model')                , configPopulate.back_shipping_rate_populate ),
    backShippingTaxService              : new syncLayer( require('../models/config-module/back/shipping-tax.model')                 , configPopulate.back_shipping_tax_populate ),
    backShippingTypeService             : new crudLayer( require('../models/config-module/back/shipping-type.model')                , configPopulate.back_shipping_type_populate ),
    
    agentBusinessTypeService            : new crudLayer( require('../models/config-module/agent/business-type.model')               , configPopulate.agent_business_type_populate ),
    agentCategoryProductService         : new crudLayer( require('../models/config-module/agent/category-product.model')            , configPopulate.agent_category_product_populate ),
    agentCustomerTypeService            : new crudLayer( require('../models/config-module/agent/customer-type.model')               , configPopulate.agent_customer_type_populate ),
    agentLanguageService                : new crudLayer( require('../models/config-module/agent/language.model')                    , configPopulate.agent_language_populate ),
    agentShopService                    : new crudLayer( require('../models/config-module/agent/shop.model')                        , configPopulate.agent_shop_populate ),
    agentStateService                   : new crudLayer( require('../models/config-module/agent/state.model')                       , configPopulate.agent_state_populate ),
    
    billingBusinessService              : new crudLayer( require('../models/config-module/billing/business.model')                  , configPopulate.billing_business_populate ),
    // =============================================================================
    // FRONT MODULE - POPULATES
    // =============================================================================
    backNavigationService               : new crudLayer( require('../models/front-module/back/navigation.model')                    , frontPopulate.back_navigation_populate ),
    backNavigationOptionService         : new crudLayer( require('../models/front-module/back/navigation-option.model')             , frontPopulate.back_navigation_option_populate ),
    backPageService                     : new crudLayer( require('../models/front-module/back/page.model')                          , frontPopulate.back_page_populate ),
    backSlideShowService                : new crudLayer( require('../models/front-module/back/slideshow.model')                     , frontPopulate.back_slideshow_populate ),
    backStorefrontThemeService          : new crudLayer( require('../models/front-module/back/storefront-theme.model')              , frontPopulate.back_storefront_theme_populate ),
    // =============================================================================
    // PRODUCTS MODULE - POPULATES
    // =============================================================================
    backAdditionalProductContentService : new syncLayer( require('../models/products-module/back/additional-product-content.model') , productsPopulate.back_additional_product_content_populate ),
    backBestSellerService               : new syncLayer( require('../models/products-module/back/best-seller.model')                , productsPopulate.back_best_seller_populate ),
    backBestSellerProductService        : new syncLayer( require('../models/products-module/back/best-seller-product.model')        , productsPopulate.back_best_seller_product_populate ),
    backBrandService                    : new syncLayer( require('../models/products-module/back/brand.model')                      , productsPopulate.back_brand_populate ),
    backProductCategoryService          : new syncLayer( require('../models/products-module/back/product-category.model')           , productsPopulate.back_product_category_populate ),
    backProductTypeService              : new syncLayer( require('../models/products-module/back/product-type.model')               , productsPopulate.back_product_type_populate ),
    backProductOptionService            : new syncLayer( require('../models/products-module/back/product-option.model')             , productsPopulate.back_product_option_populate ),
    backProductOptionValueService       : new syncLayer( require('../models/products-module/back/product-option-value.model')       , productsPopulate.back_product_option_value_populate ),
    backTagService                      : new syncLayer( require('../models/products-module/back/tag.model')                        , productsPopulate.back_tag_populate ),
    backCollectionService               : new syncLayer( require('../models/products-module/back/collection.model')                 , productsPopulate.back_collection_populate ),
    backProductService                  : new syncLayer( require('../models/products-module/back/product.model')                    , productsPopulate.back_product_populate ),
    backProductVariantService          : new syncLayer( require('../models/products-module/back/product-variant.model')            , productsPopulate.back_product_variant_populate ),
    backStorefrontDiscountService       : new syncLayer( require('../models/products-module/back/storefront-discount.model')        , productsPopulate.back_storefront_discount_populate ),

    agentDiscountService                : new crudLayer( require('../models/products-module/agent/discount.model')                  , productsPopulate.agent_discount_populate ),
    agentProductBundleService           : new crudLayer( require('../models/products-module/agent/product-bundle.model')            , productsPopulate.agent_product_bundle_populate ),
    agentProductPreSaleService          : new crudLayer( require('../models/products-module/agent/product-pre-sale.model')          , productsPopulate.agent_product_pre_sale_populate ),
    // =============================================================================
    // STORES MODULE - POPULATES
    // =============================================================================
    backAffiliateService                : new syncLayer( require('../models/stores-module/back/affiliate.model')                    , storesPopulate.back_affiliate_populate ),
    backBuyAgainService                 : new syncLayer( require('../models/stores-module/back/buy-again.model')                    , storesPopulate.back_buy_again_populate ),
    backCartService                     : new syncLayer( require('../models/stores-module/back/cart.model')                         , storesPopulate.back_cart_populate ),
    backDraftOrderService               : new syncLayer( require('../models/stores-module/back/draft-order.model')                  , storesPopulate.back_draft_order_populate ),
    backOrderService                    : new syncLayer( require('../models/stores-module/back/order.model')                        , storesPopulate.back_order_populate ),
    backOrderLineItemService            : new syncLayer( require('../models/stores-module/back/order-line-item.model')              , storesPopulate.back_order_line_item_populate ),
    backPreorderService                 : new syncLayer( require('../models/stores-module/back/preorder.model')                     , storesPopulate.back_preorder_populate ),
    backPreorderItemService             : new syncLayer( require('../models/stores-module/back/preorder-item.model')                , storesPopulate.back_preorder_item_populate ),
    backStorefrontTransactionService    : new syncLayer( require('../models/stores-module/back/storefront-transaction.model')       , storesPopulate.back_storefront_transaction_populate ),
    backStorefrontService               : new syncLayer( require('../models/stores-module/back/storefront.model')                   , storesPopulate.back_storefront_populate ),
    
    agentCouponService                  : new crudLayer( require('../models/stores-module/agent/coupon.model')                      , storesPopulate.agent_coupon_populate ),
    
    billingInvoiceService               : new crudLayer( require('../models/stores-module/billing/invoice.model')                   , storesPopulate.billing_invoice_populate ),
    billingPaymentService               : new crudLayer( require('../models/stores-module/billing/payment.model')                   , storesPopulate.billing_payment_populate ),
    // =============================================================================
    // USERS MODULE - POPULATES
    // =============================================================================
    backCustomerService                 : new syncLayer( require('../models/users-module/back/customer.model')                      , usersPopulate.back_customer_populate ),
    backUserService                     : new syncLayer( require('../models/users-module/back/user.model')                          , usersPopulate.back_user_populate ),
    
    agentLeadService                    : new crudLayer( require('../models/users-module/agent/lead.model')                         , usersPopulate.agent_lead_populate ),
    agentUserService                    : new crudLayer( require('../models/users-module/agent/agent.model')                        , usersPopulate.agent_user_populate )
}