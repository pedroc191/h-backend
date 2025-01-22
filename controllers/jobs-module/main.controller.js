// =============================================================================
// PACKAGES
// =============================================================================
const moment    		= require('moment');
const fs                = require('fs');
const sharp             = require('sharp');
const axios             = require('axios');
// =============================================================================
// AXIOS INSTANCE
// =============================================================================
const axiosFile    = axios.create({ responseType: 'arraybuffer' });
// =============================================================================
// HELPERS
// =============================================================================
const h_format      = require('../../helpers/format');
const h_validation  = require('../../helpers/validation');
const h_array       = require('../../helpers/array');
const h_file        = require('../../helpers/file');
const h_response    = require('../../helpers/response');
const h_shopify     = require('../../helpers/shopify');
// =============================================================================
// SERVICES
// =============================================================================
const { 
    backGeneralSettingService, 
    agentUserService,  
    backCustomerService, 
    backUserService, 
    agentDiscountService,
    backBestSellerService,
    backBrandService,
    backProductCategoryService,
    backProductService,
    backProductVariantService,
    backOrderService,
    backOrderLineItemService,
    backBuyAgainService,
    backPreorderService,
    backPreorderItemService,
    backShippingGroupService,
    backShippingZoneService,
    backShippingRateService,
    backShippingTaxService,
    backShippingTypeService,
    backLanguageService,
    backMarketplaceService,
    backGeneralFilterService,
    backProductOptionService,
    backProductOptionValueService,
    backTagService,
    backDraftOrderService,
    backStorefrontService,
    backAffiliateService,
    backStorefrontTransactionService,
    backCartService,
    backAccessProductCatalogService,
    backApplicationService,
    backAdditionalProductContentService,
    backCollectionService,
    backBestSellerProductService,
    agentProductBundleService,
    backCountryService
}               = require('../../services/manager');
const shopify   = require('../../services/marketplace/shopify');
// const slack     = require('../../services/messages/slack');
const billing   = require('../../services/2b-apps/billing');
const agent     = require('../../services/2b-apps/agent');
const central   = require('../../services/2b-apps/central');
// =============================================================================
// SHOPIFY INSTANCE
// =============================================================================
// =============================================================================
// GENERAL FUNCTIONS
// =============================================================================

async function createBannerImagesWebp( base_path, array_widths ){
    
    await h_file.list(`${ base_path }/`).then( (file_list) => {
        
        for (const item_file of file_list.data ) {
            
            let file_path = item_file.replace(base_path, '');
            
            if( file_path.indexOf('_full.webp') >= 0 || file_path.indexOf('.webp') < 0 ){
                
                setTimeout(async () => {
                    
                    for (const item_size of array_widths) {
                        
                        let file_name = `${ file_path.split('.')[0].split('_')[0] }`;
                        
                        let file_sharp = sharp( `${ base_path }/${ file_path }` ).resize(item_size);
                        
                        if( !file_path.indexOf( '.webp' ) ){
                            
                            file_sharp = file_sharp.webp({ quality: 80 });
                        }
                        file_sharp.toFile(`${ base_path }/${ file_name }_${ item_size || 'full' }.webp`, (file_error, file_result) => {
                            
                            if( file_error ){
                                
                                console.log( file_error );
                            }
                        });
                    }
                }, 3000); 
            }
        }
    });
};

async function syncShopifyDataByMarketplace( function_process_data ){
    
    let marketplace_result = await backMarketplaceService.find({ status: 'active', type_store: 'shopify', access: { $ne: null }, order_origins: { $ne: [] } });
    for (const item_marketplace of ( marketplace_result.success ? marketplace_result.body : [] )) {
        
        await function_process_data( item_marketplace );
    }
};
async function processCreateShopifyCustomers( item_marketplace ){
    
    try {
        
        const api_marketplace 	= shopify.init( item_marketplace.credentials );
        let params       = {
            //created_at_min: new Date( moment().subtract(4, 'months') ).toISOString(), 
            //created_at_max: new Date( moment() ).toISOString(), 
            limit: 250 
        }; 
        let origin_main         = item_marketplace.order_origins.find( (item) => item.main );
        
        let shopify_result      = await shopify.paginateQuery(api_marketplace, api_marketplace.customer, api_marketplace.customer.list, params);
        
        let setting_result      = await backGeneralSettingService.findOne({ marketplace: item_marketplace._id.toString(), status: 'active' }, { best_seller: 1 }, { populate: null });
        
        let user_result         = await backUserService.findDelete({ marketplace: item_marketplace._id.toString(), type_app: origin_main?.handle || null });
        let agent_result        = await agentUserService.find({ status: 'active' }, { _id: 1, email: 1 }, null, { populate: null });
        
        let last_customer       = await backCustomerService.findDelete({ nit: { $ne: null } }, { nit: 1 }, { nit: -1 }, { limit: 1 });
        let customer_result     = await backCustomerService.findDelete({ marketplace: item_marketplace._id.toString(), shopify_id: { $in: shopify_result.body.map( (item) => item.id ) } }, null, null, { populate: null });
        
        let customer_role       = origin_main?.customer_role.toString();
        
        if( shopify_result.success && customer_result.success && last_customer.success && user_result.success && agent_result.success && setting_result.success ){
            
            let next_nit            = last_customer.body[0].nit;
            let db_shopify_ids      = customer_result.body.map( (item) => item.shopify_id );
            let action_documents    = await h_shopify.data_base.customers.processShopifyCustomers( item_marketplace, shopify_result.body.filter( (item) => !db_shopify_ids.includes( item.id ) ), 'create', [], agent_result.body, next_nit );
            
            if( action_documents.create.length > 0 ){
                
                let customer_created    = await backCustomerService.createMany( action_documents.create );
                if( customer_created.success && user_result.success && item_marketplace.access.users ){
                    
                    action_documents = h_shopify.data_base.users.processCustomerUsers( item_marketplace, customer_created.body, user_result.body, 'create', origin_main );
                    
                    if( action_documents.create.length > 0 ){
                        
                        backUserService.createMany( action_documents.create );
                    }
                }
                if( customer_created.success ){
                    
                    let action_documents = h_shopify.data_base.customers.processAddtionalDataByCustomers( item_marketplace, customer_created.body, setting_result.body, origin_main );
                    
                    if( action_documents.best_sellers.length > 0 ){
                        
                        backBestSellerService.createMany( action_documents.best_sellers );
                    }
                    for (const item_discount of action_documents.discounts) {
                        
                        agentDiscountService.create( item_discount );
                    }
                    for (const item_statement of action_documents.statements) {
                        
                        await billing.post.createStatement( item_statement );
                    }
                    for (const item_convert_lead of action_documents.convert_leads) {
                        
                        await agent.post.convertLeadToCustomer( item_convert_lead );
                    }
                }
            }
        }
        else{
            
            let request_errors = [ customer_result, user_result, agent_result, shopify_result, setting_result ].filter( (item) => !item.success );
            
            console.log( new Date(), h_response.request( false, request_errors, 400, 'Error: Process Create Shopify Customers', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
        }
    } catch (process_error) {
        
        console.log( new Date(), h_response.request( false, process_error, 400, 'Error: Process Create Shopify Customers', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
    }
};
async function processUpdateShopifyCustomers( item_marketplace ){
    
    try {
        
        const api_marketplace 	= shopify.init( item_marketplace.credentials );
        let params              = {
            // updated_at_min: new Date( moment().subtract(2, 'hours') ).toISOString(), 
            // updated_at_max: new Date( moment() ).toISOString(), 
            limit: 250 
        }; 
        let shopify_result      = await shopify.paginateQuery(api_marketplace, api_marketplace.customer, api_marketplace.customer.list, params);
        let agent_result        = await agentUserService.find({}, { _id: 1, email: 1 }, null, { populate: null });
        let customer_result     = await backCustomerService.find({ marketplace: item_marketplace._id.toString(), shopify_id: { $in: shopify_result.body.map( (item) => item.id ) } }, null, null, { populate: null });
        let origin_main         = item_marketplace.order_origins.find( (item) => item.main );
        
        if( shopify_result.success && agent_result.success && customer_result.success ){
            
            let db_shopify_ids          = customer_result.body.map( (item) => item.shopify_id );
            let action_documents        = h_shopify.data_base.customers.processShopifyCustomers( item_marketplace, shopify_result.body.filter( (item) => db_shopify_ids.includes( item.id ) ), 'update', customer_result.body, agent_result.body );
            let list_customer_updated   = [];
            for (const [index_customer, item_customer] of action_documents.update.entries()) {
                
                let customer_updated = await backCustomerService.update( item_customer.query, item_customer.document );
                if( customer_updated.success && item_marketplace.access.users ){
                    
                    list_customer_updated.push({
                        ...item_customer.document,
                        _id: item_customer.query_user.customer
                    });
                }
            }
            if( item_marketplace.access.users ){
                
                let user_result     = await backUserService.find({ marketplace: item_marketplace._id.toString(), customer: { $in: list_customer_updated.map( (item) => item._id ) } }, null, null, { populate: null });
                if( user_result.success && user_result.body.length > 0 ){
                    
                    action_documents = h_shopify.data_base.users.processCustomerUsers( item_marketplace, list_customer_updated, user_result.body, 'update', origin_main );
                    
                    for (const [index_user, item_user] of action_documents.update.entries()) {
                        
                        await backUserService.update( item_user.query, item_user.document );
                    }
                }
                else{
                    
                    console.log( new Date(), h_response.request( false, user_result, 400, 'Error: Process Update Shopify Customers', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
                }
            }
        }
        else{
            
            let request_errors = [ shopify_result, agent_result, customer_result ].filter( (item) => !item.success );
            
            console.log( new Date(), h_response.request( false, request_errors, 400, 'Error: Process Update Shopify Customers', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
        }
    } catch (process_error) {
        
        console.log( new Date(), h_response.request( false, process_error, 400, 'Error: Process Update Shopify Customers', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
    }
};
async function processNextYearCustomerCountOrders( item_marketplace ){
    
    try {
        let customer_result = await backCustomerService.findDelete({ marketplace: item_marketplace._id.toString() }, { orders_count: 1 }, null, { populate: null });
        let order_result    = await backOrderService.find({ marketplace: item_marketplace._id.toString(), created_at: { $gte: h_format.dbDate( moment().utc().startOf('year'), true ).toISOString() } }, { customer: 1 }, null, { populate: null } );
        if( customer_result.success && order_result.success ){
            
            for (const item_customer of customer_result.body) {
                
                let current_year_orders = order_result.body.filter( (item) => item.customer.toString() === item_customer._id.toString() );
                await backCustomerService.update({ _id: item_customer._id }, { orders_count: { total: item_customer.orders_count.total, current_year: current_year_orders.length, last_year: item_customer.orders_count.current_year } });
            }
        }
        else{
            
            let request_errors = [ customer_result, order_result ].filter( (item) => !item.success );
            
            console.log( new Date(), h_response.request( false, request_errors, 400, 'Error: Process Next Year Customer Count Orders', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
        }
    } catch (process_error) {
        
        console.log( new Date(), h_response.request( false, process_error, 400, 'Error: Process Next Year Customer Count Orders', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
    }
};
async function processShopifyProductBrands( item_marketplace ){
    
    try {
        
        let brand_result    = await backBrandService.findDelete({ marketplace: item_marketplace._id.toString() }, { name: 1, collection_url: 1, logo: 1 });
        let language_result = await backLanguageService.find({ status: 'active', main: false }, { key_code: 1 }, null, { populate: null });
        let product_result  = await backProductService.find({ marketplace: item_marketplace._id.toString(), brand: { $ne: null }, sku_parent: { $ne: null } }, { brand: 1, sku_parent: 1 }, null, { populate: null });
        
        if( brand_result.success && product_result.success && product_result.body.length > 0 ){
            
            let action_documents    = h_shopify.data_base.brands.processBrandData( item_marketplace, brand_result.body, product_result.body, language_result.body );
            
            let discount_result     = await agentDiscountService.find({ marketplace: item_marketplace._id.toString(), discounts: { $elemMatch: { brand: { $in: action_documents.delete } } } }, null, null, { populate: null });
            
            if( action_documents.create.length > 0 ){
                
                await backBrandService.createMany( action_documents.create );
            }
            
            for (const item_brand of action_documents.update) {
                
                let new_brand                   = {...item_brand};
                new_brand.document.deleted      = false;
                new_brand.document.deleted_at   = null;
                await backBrandService.update( new_brand.query, new_brand.document );
            }
            
            for (const item_discount of ( discount_result.success && action_documents.delete.length > 0 ? discount_result.body : [] )) {
                
                let new_discounts = [];
                if( item_discount.discounts != null && item_discount.discounts.length > 0 ){
                    
                    new_discounts = item_discount.discounts.filter( (item_exist_discount) => item_exist_discount.brand && action_documents.delete.indexOf( item_exist_discount.brand ? item_exist_discount.brand.toString() : null ) < 0 );
                }
                await agentDiscountService.update({ _id: item_discount._id }, { discounts: new_discounts });
            }
            if( action_documents.delete.length > 0 ){
                
                await backBrandService.deleteMany({ marketplace: item_marketplace._id.toString() }, { _id: { $in: action_documents.delete } });
            }
        }
        else{
            
            let request_errors = [ brand_result, product_result ].filter( (item) => !item.success );
            
            console.log( new Date(), h_response.request( false, request_errors, 400, 'Error: Process Shopify Product Brands', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
        }
    } catch (process_error) {
        
        console.log( new Date(), h_response.request( false, process_error, 400, 'Error: Process Shopify Product Brands', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
    }
};
async function processShopifyProductCategories( item_marketplace ){
    
    let product_category_result = await backProductCategoryService.findDelete({ marketplace: item_marketplace._id.toString() }, { name: 1, collection_url: 1, logo: 1 });
    let language_result     = await backLanguageService.find({ status: 'active', main: false }, { key_code: 1 }, null, { populate: null });
    let product_result      = await backProductService.find({ $and: [{ marketplace: item_marketplace._id.toString() }, { product_type: { $nin: [null, ''] } }] }, { product_type: 1 }, null, { populate: null });
    
    if( product_category_result.success && product_result.success ){
        
        let action_documents    = h_shopify.data_base.product_categories.processProductCategoryData( item_marketplace, product_category_result.body, product_result.body, language_result.body );
        
        if( action_documents.create.length > 0 ){
            
            await backProductCategoryService.createMany( action_documents.create );
        }
        
        for (const item_brand of action_documents.update) {
            
            let new_brand                   = {...item_brand};
            new_brand.document.deleted      = false;
            new_brand.document.deleted_at   = null;
            await backProductCategoryService.update( new_brand.query, new_brand.document );
        }
        
        if( action_documents.delete.length > 0 ){
            
            await backProductCategoryService.deleteMany({ $and: [{ marketplace: item_marketplace._id.toString() }, { name: { $in: action_documents.delete.map( (item_product_type) => item_product_type.name ) } }] });
        }
    }
    else{
        
        let request_errors = [ product_category_result, product_result ].filter( (item) => !item.success );
        
        console.log( new Date(), h_response.request( false, request_errors, 400, 'Error: Process Shopify Product Types', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
    }
};
async function processProductOptions( id_marketplace, product_options, product_option_result, language_result ){
    
    product_options = h_array.groupField( h_array.sort( product_options.flat(), 'name' ), 'name', ['values'] );
    for (const item_option of product_options) {
        
        let filter_values = h_array.removeRepeat( item_option.values, 'handle' );
        let index_option = product_option_result.findIndex( (item) => item.handle === item_option.handle );
        if( index_option < 0 ){
            
            let option_value_created = await backProductOptionValueService.createMany( filter_values.map( (item) => { 
                return { 
                    marketplace: id_marketplace,
                    name: item.name, 
                    handle: item.handle, 
                    translate: language_result.map( (item_language) => { 
                        return { 
                            language: item_language.key_code, 
                            name: item.name, 
                            is_translated: false 
                        };
                    } )
                };
            } ) );
            if( option_value_created.success ){
                
                await backProductOptionService.create({ 
                    marketplace: id_marketplace,
                    name: item_option.name, 
                    handle: item_option.handle, 
                    translate: language_result.map( (item_language) => { 
                        return { 
                            language: item_language.key_code, 
                            name: item_option.name, 
                            is_translated: false 
                        };
                    } ), 
                    values: option_value_created.body.map( (item) => item._id.toString() ) 
                });
            }
        }
        else{
            
            let new_options_values = product_option_result[index_option].values.map( (item) => item._id.toString() );
            let create_option_values = [];
            
            for (const item_option_value of filter_values) {
                
                let index_option_value = product_option_result[index_option].values.findIndex( (item) => item.handle === item_option_value.handle );
                if( index_option_value < 0 && create_option_values.findIndex( (item) => item.handle === item_option_value.handle ) < 0 ){
                    
                    create_option_values.push({ 
                        marketplace : id_marketplace,
                        name        : item_option_value.name, 
                        handle      : item_option_value.handle, 
                        translate   : language_result.map( (item_language) => { 
                            return { 
                                language: item_language.key_code, 
                                name: item_option_value.name, 
                                is_translated: false 
                            };
                        } ) 
                    });
                }
                else{
                    
                    await backProductOptionValueService.update( { _id: product_option_result[index_option].values[index_option_value]._id.toString() }, { name: item_option_value.name, handle: item_option_value.handle } );
                }
            }
            if( create_option_values.length > 0 ){
                
                let option_value_created = await backProductOptionValueService.createMany( create_option_values );
                if( option_value_created.success ){
                    
                    new_options_values = new_options_values.concat( option_value_created.body.map( (item) => item._id.toString() ) );
                    await backProductOptionService.update( { _id: product_option_result[index_option]._id.toString() }, { values: new_options_values } );
                }
            }
        }
    }
};
async function processCreateShopifyProducts( item_marketplace ){
    
    const api_marketplace 	= shopify.init( item_marketplace.credentials );
    let params               = {
        // created_at_min: new Date( moment().subtract(2, 'hours') ).toISOString(), 
        // created_at_max: new Date( moment() ).toISOString(), 
        limit: 250 
    };
    let shopify_result          = await shopify.paginateQuery(api_marketplace, api_marketplace.product, api_marketplace.product.list, params);
    let setting_result          = await backGeneralSettingService.findOne({ marketplace: item_marketplace._id.toString(), status: 'active' }, { sort_categories: 1, sort_sizes: 1, config_product: 1 }, { populate: null });
    let language_result         = await backLanguageService.find({ status: 'active', main: false }, { key_code: 1 }, null, { populate: null });
    let brand_result            = await backBrandService.find({ marketplace: item_marketplace._id.toString() });
    let product_category_result = await backProductCategoryService.find({ marketplace: item_marketplace._id.toString() });
    let product_option_result   = await backProductOptionService.find({ marketplace: item_marketplace._id.toString() });
    let tag_result              = await backTagService.find({ marketplace: item_marketplace._id.toString(), category: 'product' });
    
    if( shopify_result.success && shopify_result.body.length > 0 && setting_result.success && setting_result.body && language_result.success && language_result.body.length > 0 && brand_result.success && product_category_result.success && product_option_result.success && tag_result.success ){
        
        let product_result  = await backProductService.findDelete({ marketplace: item_marketplace._id.toString(), shopify_id: { $in: shopify_result.body.map( (item) => item.id ) } }, { shopify_id: 1, variants: 1 }, null, { populate: { path: 'variants', select: 'shopify_id' } });
        
        if( product_result.success ){
            
            let db_data = {
                product_result          : [], 
                brand_result            : brand_result.body, 
                product_category_result : product_category_result.body, 
                tag_result              : tag_result.body,
                language_result         : language_result.body, 
                setting_result          : setting_result.body
            };
            let db_shopify_ids      = product_result.body.map( (item) => item.shopify_id );
            let action_documents    = h_shopify.data_base.products.processProductData( item_marketplace, 'create', h_array.sort( shopify_result.body.filter( (item) => !db_shopify_ids.includes( item.id ) ), 'vendor' ), db_data );
            let products_create     = [];
            let product_options     = [];
            
            for (const item_product of action_documents.products.create) {
                
                if( item_product.action_variants.create.length > 0 ){
                    
                    let variant_created = await backProductVariantService.createMany( item_product.action_variants.create );
                    if( variant_created.success ){
                        
                        item_product.data_variants = variant_created.body.reduce( (previous_item, current_item) => {
                            
                            previous_item = h_shopify.data_base.products.processProductVariantData( previous_item, current_item, 'create' );
                            return previous_item;
                        }, item_product.data_variants);
                        
                        let format_product = h_shopify.data_base.format.productObject( item_marketplace._id.toString(), item_product.data, item_product.data_variants, setting_result.body, language_result.body, null, true );
                        if( format_product ){
                            
                            products_create.push( format_product );
                        }
                        if( format_product && format_product.options ){
                            
                            product_options.push( format_product.options );
                        }
                    }
                }
            }
            if( products_create.length > 0 ){
                
                await backProductService.createMany( products_create );
            }
            if( product_options.length > 0 ){
                
                await processProductOptions( item_marketplace._id.toString(), product_options, product_option_result.body, language_result.body );
            }
            if( action_documents.brands.length > 0 ){
                
                await backBrandService.createMany( action_documents.brands );
            }
            if( action_documents.product_categories.length > 0 ){
                
                await backProductCategoryService.createMany( action_documents.product_categories );
            }
            if( action_documents.tags.length > 0 ){
                
                await backTagService.createMany( action_documents.tags );
            }
        }
        else{
            
            console.log( new Date(), h_response.request( false, [product_result], 400, 'Error: Process Create Shopify Products', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
        }
    }
    else{
        
        let request_errors = [ shopify_result, setting_result, language_result, brand_result, product_category_result, product_option_result ].filter( (item) => !item.success );
        
        console.log( new Date(), h_response.request( false, request_errors, 400, 'Error: Process Create Shopify Products', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
    }
};
async function processUpdateShopifyProducts( item_marketplace ){
    
    const api_marketplace 	= shopify.init( item_marketplace.credentials );
    let params               = {
        // updated_at_min: new Date( moment().subtract(5, 'minutes') ).toISOString(), 
        // updated_at_max: new Date( moment() ).toISOString(),
        // ids: "7068694183995", 
        limit: 250 
    };
    
    let shopify_result          = await shopify.paginateQuery(api_marketplace, api_marketplace.product, api_marketplace.product.list, params);
    let setting_result          = await backGeneralSettingService.findOne({ marketplace: item_marketplace._id.toString(), status: 'active' }, { sort_categories: 1, config_product: 1, sort_sizes: 1 }, { populate: null });
    let language_result         = await backLanguageService.find({ status: 'active', main: false }, { key_code: 1 }, null, { populate: null });
    let brand_result            = await backBrandService.find({ marketplace: item_marketplace._id.toString() });
    let product_category_result = await backProductCategoryService.find({ marketplace: item_marketplace._id.toString() });
    let product_option_result   = await backProductOptionService.find({ marketplace: item_marketplace._id.toString() });
    let tag_result              = await backTagService.find({ marketplace: item_marketplace._id.toString(), category: 'product' });
    
    if( shopify_result.success && shopify_result.body.length > 0 && setting_result.success && setting_result.body && language_result.success && language_result.body.length > 0 && brand_result.success && product_category_result.success && product_option_result.success && tag_result.success ){
        
        let product_result  = await backProductService.find({ marketplace: item_marketplace._id.toString(), shopify_id: { $in: shopify_result.body.map( (item) => item.id ) } }, null, null, { populate: { path: 'variants' } });
        
        if( product_result.success ){
            
            let db_data = {
                product_result          : product_result.body, 
                brand_result            : brand_result.body, 
                product_category_result : product_category_result.body, 
                tag_result              : tag_result.body,
                language_result         : language_result.body, 
                setting_result          : setting_result.body
            };
            let db_shopify_ids      = product_result.body.map( (item) => item.shopify_id );
            let action_documents    = h_shopify.data_base.products.processProductData( item_marketplace, 'update', h_array.sort( shopify_result.body.filter( (item) => db_shopify_ids.includes( item.id ) ), 'vendor' ), db_data );
            let product_options     = [];
            
            for (const [index_product, item_product] of action_documents.products.update.entries()){
                
                if( item_product.action_variants.create.length > 0 ){
                    
                    let variant_created = await backProductVariantService.createMany( item_product.action_variants.create );
                    if( variant_created.success ){
                        
                        item_product.data_variants = variant_created.body.reduce( (previous_item, current_item) => {
                            
                            previous_item = h_shopify.data_base.products.processProductVariantData( previous_item, current_item, 'create' );
                            return previous_item;
                        }, item_product.data_variants);
                    }
                }
                for (const item_variant of item_product.action_variants.update) {
                    
                    let updated_variant = await backProductVariantService.update( item_variant.query, item_variant.document );
                    if( !updated_variant.success ){
                        
                        console.log( item_variant.query, item_variant.document, updated_variant );
                    }
                }
                if( item_product.action_variants.delete.length > 0 ){
                    
                    await backProductVariantService.deleteMany( { _id: { $in: item_product.action_variants.delete } });
                }
                
                let format_product = h_shopify.data_base.format.productObject( item_marketplace._id.toString(), item_product.data, item_product.data_variants, setting_result.body, language_result.body, item_product.db_product, false );
                if( format_product?.document ){
                    
                    let updated_product = await backProductService.update( format_product.query, format_product.document );
                    if( !updated_product.success ){
                        
                        console.log( format_product.query, format_product.document, updated_product );
                    }
                }
                if( format_product?.document && format_product.document.options ){
                    
                    product_options.push( format_product.document.options );
                }
            }
            if( product_options.length > 0 ){
                
                await processProductOptions( item_marketplace._id.toString(), product_options, product_option_result.body, language_result.body );
            }
            if( action_documents.brands.length > 0 ){
                
                await backBrandService.createMany( action_documents.brands );
            }
            if( action_documents.product_categories.length > 0 ){
                
                await backProductCategoryService.createMany( action_documents.product_categories );
            }
            if( action_documents.tags.length > 0 ){
                
                await backTagService.createMany( action_documents.tags );
            }
        }
        else{
            
            console.log( new Date(), h_response.request( false, [product_result], 400, 'Error: Process Update Shopify Products', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
        }
    }
    else{
        
        let request_errors = [ shopify_result, setting_result, language_result, brand_result, product_category_result, product_option_result ].filter( (item) => !item.success );
        
        console.log( new Date(), h_response.request( false, request_errors, 400, 'Error: Process Update Shopify Products', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
    }
};
async function processDeleteShopifyProducts( item_marketplace ){
    
    const api_marketplace 	= shopify.init( item_marketplace.credentials );
    let params               = {
        limit: 250
    };
    let shopify_result      = await shopify.paginateQuery(api_marketplace, api_marketplace.product, api_marketplace.product.list, params);
    let product_result      = await backProductService.find({ marketplace: item_marketplace._id.toString() }, { shopify_id: 1, variants: 1 }, null, { populate: { path: 'variants', select: '_id shopify_id' }, lean: true });
    
    if( shopify_result.success && product_result.success ) {
        
        let shopify_products = shopify_result.body.reduce( (previous_item, current_item) => {
            
            previous_item.push({
                shopify_id  : current_item.id,
                variants    : current_item.variants.map( (item) => item.id )
            });
            return previous_item;
        }, []);
        let action_documents = { 
            delete_products: [], 
            delete_variants: [] 
        };
        for (const [index_product, item_product] of product_result.body.entries()) {
            
            let index_shopify = shopify_products.findIndex( (item) => item.shopify_id === item_product.shopify_id );
            
            if( index_shopify < 0 ){ 
                
                action_documents.delete_products.push( item_product.shopify_id ); 
            }
            else{
                
                for (const item_variant of item_product.variants) {
                    
                    if( !shopify_products[index_shopify].variants.includes( item_variant.shopify_id ) ){
                        
                        action_documents.delete_variants.push( item_variant.shopify_id );
                    }
                }
            }
            if( index_product === product_result.body.length - 1 ){
                
                if( action_documents.delete_products.length > 0 ){
                    
                    let product_deleted = await backProductService.deleteMany( { marketplace: item_marketplace._id.toString(), shopify_id: { $in: action_documents.delete_products } } );
                    if( product_deleted.success ){
                        
                        await backProductVariantService.deleteMany({ marketplace: item_marketplace._id.toString(), product_id: { $in: action_documents.delete_products } });
                    }
                }
                if( action_documents.delete_variants.length > 0 ) {
                    
                    await backProductVariantService.deleteMany({ marketplace: item_marketplace._id.toString(), shopify_id: { $in: action_documents.delete_variants } });
                }
            }
        }
    }
    else{
        
        let request_errors = [ shopify_result, product_result ].filter( (item) => !item.success );
        
        console.log( new Date(), h_response.request( false, request_errors, 400, 'Error: Process Delete Shopify Products', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
    }
};
async function processUpdateBestSellers( item_marketplace ){
    
    try {
        let setting_result = await backGeneralSettingService.findOne({ status: 'active' }, { config_best_seller: 1, sort_sizes: 1, general_filters: 1 }, { populate: null });
        // let customer_result = await backCustomerService.findDelete({ status: 'active' });
        
        if( item_marketplace.order_origins.length > 0 && setting_result.success && setting_result.body.config_best_seller != null ){
            
            let max_range_months = Object.entries( setting_result.body.config_best_seller ).reduce( (previous_item, [key_item, value_item] ) => {
                
                if( value_item.range_months && value_item.range_months > previous_item ){
                    
                    previous_item = value_item.range_months;
                }
                return previous_item;
            }, 0 );
            let query_line_items = {
                $and: [
                    { marketplace: item_marketplace._id.toString() },
                    { customer_id: { $ne: null } },
                    { created_at: { $gte: h_format.dbDate( moment().utc().subtract( max_range_months + 1, 'months' ).startOf('month') ).toISOString() } },
                    { status: 'active' },
                    { deleted: false }
                ]
            };
            let order_origins = item_marketplace.order_origins.reduce( (previous_item, current_item) => {
                
                let config_best_seller = ( setting_result.body.config_best_seller.find( (item) => item.category === current_item.values[0] ) || setting_result.body.config_best_seller.find( (item) => item.category === 'wholesale' ) );
                if( !current_item.main ){
                    
                    previous_item.others.push( h_shopify.data_base.format.bestSellerTemplateObject( item_marketplace._id.toString(), config_best_seller, null, null, null, current_item.values[0], false ) );
                }
                else{
                    previous_item.main = h_shopify.data_base.format.bestSellerTemplateObject( item_marketplace._id.toString(), config_best_seller, null, null, null, current_item.values[0], false );
                    // for (const item_customer of customer_result.body) {
                    
                    //     previous_item.customers.push( h_shopify.data_base.format.bestSellerTemplateObject( item_marketplace._id.toString(), config_best_seller, item_customer, null, null, null, true ) );
                    // }
                }
                return previous_item;
            }, { main: null, others: [], customers: [] });
            
            // console.log( order_origins.customers[0] );
            // let best_seller_main_created = await backBestSellerService.createMany( [order_origins.main] );
            // let best_seller_others_created = await backBestSellerService.createMany( order_origins.others );
            // let best_seller_customers_created = await backBestSellerService.createMany( order_origins.customers );
            
            let line_item_result    = await backOrderLineItemService.find( query_line_items, null, { created_at: 1 } );
            let product_result      = await backProductService.findDelete();
            
            if( line_item_result.success && line_item_result.body.length > 0 && product_result.success && product_result.body.length > 0 ){
                
                let order_customers = [...new Set(line_item_result.body.map( (item) => item.customer_id ) ) ];
                let customer_result = await backCustomerService.findDelete({ shopify_id: { $in: order_customers }, status: 'active' }, null, null, { populate: null });
                
                if( customer_result.success && customer_result.body.length > 0 ){
                    
                    let sort_customers_orders = h_array.sort( line_item_result.body, 'customer_id' ).reduce( (previous_item, current_item) =>{ 
                        
                        let exist_product = product_result.body.find( (item) => item.shopify_id === current_item.product_id );
                        if( exist_product ){
                            
                            let exist_variant = exist_product ? exist_product.variants.find( (item) => item.shopify_id === current_item.variant_id ) : null;
                            
                            let new_line_item       = {...current_item};
                            new_line_item.product   = exist_product || null;
                            new_line_item.variant   = exist_variant || null;
                            new_line_item.storefront= new_line_item.storefront != null ? new_line_item.storefront.toString() : null;
                            new_line_item.affiliate = new_line_item.affiliate != null ? new_line_item.affiliate.toString() : null;
                            
                            previous_item.main_origin.document.line_items.push( new_line_item );
                            
                            let db_customer = customer_result.body.find( (item) => item.shopify_id === new_line_item.customer_id );
                            if( db_customer && ( previous_item.customers.length === 0 || previous_item.customers[ previous_item.customers.length - 1 ].query.customer_id != new_line_item.customer_id ) ){
                                
                                if( previous_item.customers[ previous_item.customers.length - 1 ] && previous_item.customers[ previous_item.customers.length - 1 ]?.document ){
                                    
                                    console.log( previous_item.customers[ previous_item.customers.length - 1 ].document.line_items.length );
                                }
                                previous_item.customers.push( h_shopify.data_base.format.bestSellerTemplateObject( item_marketplace._id.toString(), setting_result.body.config_best_seller.find( (item) => item.category === 'wholesale' ), db_customer, null, null, null, false ) );
                                previous_item.customers[ previous_item.customers.length - 1 ].document.line_items.push( new_line_item );
                            }
                            else if( db_customer && previous_item.customers[ previous_item.customers.length - 1 ].query.customer_id === new_line_item.customer_id ){
                                
                                previous_item.customers[ previous_item.customers.length - 1 ].document.line_items.push( new_line_item );
                            }
                            previous_item.products.push( current_item.product_id );
                            
                            let index_order_origin = previous_item.other_order_origins.findIndex( (item) => item.order_origin === new_line_item.origin );
                            if( index_order_origin >= 0 ){
                                
                                previous_item.other_order_origins[ index_order_origin ].document.line_items.push( new_line_item );
                            }
                            if( new_line_item.storefront != null ){
                                
                                previous_item.storefronts.push( new_line_item );
                            }
                            if( new_line_item.affiliate != null ){
                                
                                new_line_item.affiliates.push( new_line_item );
                            }
                        }
                        return previous_item; 
                    }, { customers: [], products: [], storefronts: [], affiliates: [], main_origin: order_origins.main, other_order_origins: order_origins.others });
                    
                    let sort_storefronts_orders = h_array.sort( sort_customers_orders.storefronts, 'storefront' ).reduce( (previous_item, current_item) =>{
                        
                        if( previous_item.length === 0 || previous_item[ previous_item.length - 1 ].query.storefront != current_item.storefront ){
                            
                            previous_item.push( h_shopify.data_base.format.bestSellerTemplateObject( item_marketplace._id.toString(), setting_result.body.config_best_seller.find( (item) => item.category === 'storefront' ), null, current_item.storefront, null, null ) );
                            previous_item[ previous_item.length - 1 ].document.line_items.push( current_item );
                        }
                        else if( previous_item[ previous_item.length - 1 ].query.storefront === current_item.storefront ){
                            
                            previous_item[ previous_item.length - 1 ].document.line_items.push( current_item );
                        }
                        return previous_item;
                    }, []);
                    delete sort_customers_orders.storefronts;
                    let sort_affiliates_orders = h_array.sort( sort_customers_orders.affiliates, 'affiliate' ).reduce( (previous_item, current_item) =>{
                        
                        if( previous_item.length === 0 || previous_item[ previous_item.length - 1 ].query.affiliate != current_item.affiliate ){
                            
                            previous_item.push( h_shopify.data_base.format.bestSellerTemplateObject( item_marketplace._id.toString(), setting_result.body.config_best_seller.find( (item) => item.category === 'affiliate' ), null, null, current_item.affiliate, null ) );
                            previous_item[ previous_item.length - 1 ].document.line_items.push( current_item );
                        }
                        else if( previous_item[ previous_item.length - 1 ].query.affiliate === current_item.affiliate ){
                            
                            previous_item[ previous_item.length - 1 ].document.line_items.push( current_item );
                        }
                        previous_item.push( current_item );
                        
                        return previous_item;
                    }, []);
                    delete sort_customers_orders.affiliates;
                    
                    let best_seller_products = product_result.body.reduce( (previous_item, current_item) =>{
                        
                        if( sort_customers_orders.products.find( (item) => item === current_item.shopify_id ) ){
                            
                            previous_item.order_products.push( current_item );
                        }
                        else{
                            
                            previous_item.stock_products.push( current_item );
                        }
                        return previous_item;
                    }, { order_products: [], stock_products: [] });
                    
                    for (const item_customer_best_seller of sort_customers_orders.customers) {
                        
                        let new_best_sellers = h_shopify.data_base.format.bestSellerObject( item_customer_best_seller );
                        let best_seller_product_removed = await backBestSellerProductService.removeMany( item_customer_best_seller.query );
                        
                        if( best_seller_product_removed.success ){
                            
                            let best_seller_product_created = await backBestSellerProductService.createMany( new_best_sellers.document.products );
                            if( best_seller_product_created.success ){
                                
                                new_best_sellers.document.products = best_seller_product_created.body.map( (item) => item._id.toString() );
                                let best_seller_updated = await backBestSellerService.update( item_customer_best_seller.query, new_best_sellers.document );
                                
                                if( !best_seller_updated.success ){
                                    
                                    console.log( "Customer", "best_seller_updated", best_seller_updated );
                                    break;
                                }
                            }
                            else{
                                
                                console.log( "Customer", "best_seller_product_created", best_seller_product_created );
                                break;
                            }
                        }
                    }
                    for (const item_storefront_best_seller of sort_storefronts_orders) {
                        
                        let new_best_sellers = h_shopify.data_base.format.bestSellerObject( item_storefront_best_seller );
                        new_best_sellers.document.selected_filters = setting_result.body.general_filters;
                        let best_seller_product_removed = await backBestSellerProductService.removeMany( item_storefront_best_seller.query );
                        
                        if( best_seller_product_removed.success ){
                            
                            let best_seller_product_created = await backBestSellerProductService.createMany( new_best_sellers.document.products );
                            if( best_seller_product_created.success ){
                                
                                new_best_sellers.document.products = best_seller_product_created.body.map( (item) => item._id.toString() );
                                let best_seller_updated = await backBestSellerService.update( item_storefront_best_seller.query, new_best_sellers.document );
                                
                                if( !best_seller_updated.success ){
                                    
                                    console.log( "Customer", "best_seller_updated", best_seller_updated );
                                    break;
                                }
                            }
                            else{
                                
                                console.log( "Customer", "best_seller_product_created", best_seller_product_created );
                                break;
                            }
                        }
                    }
                    for (const item_affiliate_best_seller of sort_affiliates_orders) {
                        
                        let new_best_sellers = h_shopify.data_base.format.bestSellerObject( item_affiliate_best_seller );
                        let best_seller_product_removed = await backBestSellerProductService.removeMany( item_affiliate_best_seller.query );
                        
                        if( best_seller_product_removed.success ){
                            
                            let best_seller_product_created = await backBestSellerProductService.createMany( new_best_sellers.document.products );
                            if( best_seller_product_created.success ){
                                
                                new_best_sellers.document.products = best_seller_product_created.body.map( (item) => item._id.toString() );
                                let best_seller_updated = await backBestSellerService.update( item_affiliate_best_seller.query, new_best_sellers.document );
                                
                                if( !best_seller_updated.success ){
                                    
                                    console.log( "Customer", "best_seller_updated", best_seller_updated );
                                    break;
                                }
                            }
                            else{
                                
                                console.log( "Customer", "best_seller_product_created", best_seller_product_created );
                                break;
                            }
                        }
                    }
                    for (const item_order_origin_best_seller of sort_customers_orders.other_order_origins) {
                        
                        let new_best_sellers = h_shopify.data_base.format.bestSellerObject( item_order_origin_best_seller );
                        new_best_sellers.document.selected_filters = setting_result.body.general_filters;
                        let best_seller_product_removed = await backBestSellerProductService.removeMany( item_order_origin_best_seller.query );
                        
                        if( best_seller_product_removed.success ){
                            
                            let best_seller_product_created = await backBestSellerProductService.createMany( new_best_sellers.document.products );
                            if( best_seller_product_created.success ){
                                
                                new_best_sellers.document.products = best_seller_product_created.body.map( (item) => item._id.toString() );
                                let best_seller_updated = await backBestSellerService.update( item_order_origin_best_seller.query, new_best_sellers.document );
                                
                                if( !best_seller_updated.success ){
                                    
                                    console.log( "Customer", "best_seller_updated", best_seller_updated );
                                    break;
                                }
                            }
                            else{
                                
                                console.log( "Customer", "best_seller_product_created", best_seller_product_created );
                                break;
                            }
                        }
                    }
                    if( sort_customers_orders.main_origin.document.line_items.length > 0 ){
                        
                        let new_best_sellers = h_shopify.data_base.format.bestSellerObject( sort_customers_orders.main_origin );
                        let sort_products = [];
                        new_best_sellers.document.selected_filters = setting_result.body.general_filters;
                        let best_seller_product_removed = await backBestSellerProductService.removeMany( sort_customers_orders.main_origin.query );
                        
                        if( best_seller_product_removed.success ){
                            
                            sort_products = new_best_sellers.document.products.map( (item) => {
                                return {
                                    product_id: item.product_id,
                                    sort_general: item.sort_general
                                }
                            });
                            let best_seller_product_created = await backBestSellerProductService.createMany( new_best_sellers.document.products );
                            if( best_seller_product_created.success ){
                                
                                new_best_sellers.document.products = best_seller_product_created.body.map( (item) => item._id.toString() );
                                let best_seller_updated = await backBestSellerService.update( sort_customers_orders.main_origin.query, new_best_sellers.document );
                                
                                if( !best_seller_updated.success ){
                                    
                                    console.log( "Customer", "best_seller_updated", best_seller_updated );
                                }
                            }
                            else{
                                
                                console.log( "Customer", "best_seller_product_created", best_seller_product_created );
                            }
                        }
                        
                        for (const item_product of sort_products) {
                            
                            let index_best_seller = best_seller_products.order_products.findIndex( (item) => item.shopify_id === item_product.product_id );
                            if( index_best_seller >= 0 ){
                                
                                best_seller_products.order_products[index_best_seller].custom_badges.best_seller = true;
                                await backProductService.update( { marketplace: item_marketplace._id.toString(), shopify_id: item_product.product_id }, { default_sort: item_product.sort_general, custom_badges: best_seller_products.order_products[index_best_seller].custom_badges } );
                            }
                        }
                        let index_best_sellers = h_array.sort( sort_products, 'sort_general', false ).sort_general;
                        for (const item_product of h_array.sort( best_seller_products.stock_products, 'total_stock', false )) {
                            
                            index_best_sellers += 1;
                            await backProductService.update( { marketplace: item_marketplace._id.toString(), _id: item_product._id }, { default_sort: index_best_sellers } );
                        }
                    }
                    let clean_best_sellers = h_shopify.data_base.format.bestSellerTemplateObject( item_marketplace._id.toString(), setting_result.body.config_best_seller.find( (item) => item.category === 'wholesale' ), null, null, null, null, false );
                    
                    await backBestSellerService.updateMany({ $and: [, { customer: { $nin: customer_result.body.map( (item) => item.shopify_id ) } }, { customer: { $ne: null } }, { marketplace: clean_best_sellers.query.marketplace }] }, clean_best_sellers.document );
                    
                }
                else if( !product_result.success ){
                    
                    console.log( "product_result.success", product_result );
                }
                else if( !customer_result.success ){
                    
                    console.log( "customer_result.success", customer_result );
                }
            }
            else if( !line_item_result.success ){
                
                console.log( new Date(), h_response.request( false, [line_item_result], 400, 'Error: Process Update Best Sellers', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
            }
        }
        else if( !setting_result.success ){
            
            console.log( new Date(), h_response.request( false, [setting_result], 400, 'Error: Process Update Best Sellers', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
        }
    } catch (process_error) {
        
        console.log( new Date(), h_response.request( false, process_error, 400, 'Error: Process Update Best Sellers', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
    }
};
async function processGeneralFilters( item_marketplace ){
    
    try {
        let product_option_result   = await backProductOptionService.find({ marketplace: item_marketplace._id.toString(), status: 'active' });
        let brand_result            = await backBrandService.find({ marketplace: item_marketplace._id.toString(), status: 'active' });
        let product_category_result = await backProductCategoryService.find({ marketplace: item_marketplace._id.toString(), status: 'active' });
        let tag_result              = await backTagService.find({ marketplace: item_marketplace._id.toString() }, null, null, { populate: null });
        let general_filters         = await backGeneralFilterService.find({ marketplace: item_marketplace._id.toString(), status: 'active' }, null, null, { populate: null });
        let setting_result          = await backGeneralSettingService.findOne({ marketplace: item_marketplace._id.toString(), status: 'active' }, { sort_sizes: 1 }, { populate: null });
        
        if( product_option_result.success && brand_result.success && product_category_result.success && tag_result.success && general_filters.success && setting_result.success ){
            
            for (const item_filter of general_filters.body) {
                
                if ( item_filter.field === 'brand' ){
                    
                    await backGeneralFilterService.update({ marketplace: item_marketplace._id.toString(), _id: item_filter._id.toString() }, { brands: h_array.sort( brand_result.body, 'name' ).map( (item) => item._id.toString() ) });
                }
                else if ( item_filter.field === 'product_category' ){
                    
                    await backGeneralFilterService.update({ marketplace: item_marketplace._id.toString(), _id: item_filter._id.toString() }, { product_categories: h_array.sort( product_category_result.body, 'name' ).map( (item) => item._id.toString() ) });
                }
                else if ( item_filter.field === 'tags' ){
                    
                    await backGeneralFilterService.update({ marketplace: item_marketplace._id.toString(), _id: item_filter._id.toString() }, { tags: h_array.sort( tag_result.body, 'name' ).map( (item) => item._id.toString() ) });
                }
                else if( item_filter.field === 'options' ){
                    
                    for (const item_option of product_option_result.body) {
                        
                        if( item_option.handle === 'size' ){
                            
                            let sort_sizes = h_array.sortCompare( setting_result.body.sort_sizes, item_option.values, 'name' ).concat( item_option.values.filter( (item) => setting_result.body.sort_sizes.indexOf( item.name ) < 0 ) );
                            
                            await backProductOptionService.update({ marketplace: item_marketplace._id.toString(), _id: item_option._id.toString() }, { values: sort_sizes.map( (item) => item._id.toString() ) });
                        }
                        else{
                            
                            await backProductOptionService.update({ marketplace: item_marketplace._id.toString(), _id: item_option._id.toString() }, { values: h_array.sort( item_option.values, 'name' ).map( (item) => item._id.toString() ) });
                        }
                        await backGeneralFilterService.update({ marketplace: item_marketplace._id.toString(), _id: item_filter._id }, { product_options: product_option_result.body._id.toString() });
                    }
                }
            }
        }
        else {
            
            let request_errors = [ product_option_result, brand_result, product_category_result, tag_result, general_filters, setting_result ].filter( (item) => !item.success );
            
            console.log( new Date(), h_response.request( false, request_errors, 400, 'Error: Process General Filters', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
        }
    } catch (process_error) {
        
        console.log( new Date(), h_response.request( false, process_error, 400, 'Error: Process General Filters', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
    }
};
async function processCreateShopifyCollections( item_marketplace ){
    
    const api_marketplace 	= shopify.init( item_marketplace.credentials );
    let params               = {
        // published_at_min: new Date( moment().subtract(2, 'hours') ).toISOString(), 
        // published_at_max: new Date( moment() ).toISOString(), 
        limit: 250 
    };
    let smart_collections   = await shopify.paginateQuery(api_marketplace, api_marketplace.smartCollection, api_marketplace.smartCollection.list, params);
    let custom_collections  = await shopify.paginateQuery(api_marketplace, api_marketplace.customCollection, api_marketplace.customCollection.list, params);
    
    let language_result     = await backLanguageService.find({ status: 'active', main: false }, { key_code: 1 }, null, { populate: null });
    let setting_result      = await backGeneralSettingService.findOne({ marketplace: item_marketplace._id.toString(), status: 'active' }, { general_filters: 1 });
    let collection_result   = await backCollectionService.find({ marketplace: item_marketplace._id.toString() });
    
    if( smart_collections.success && custom_collections.success && setting_result.success && setting_result.body && collection_result.success && language_result.success && language_result.body ){
        
        let shopify_collections = smart_collections.body.concat( custom_collections.body );
        let db_shopify_ids      = collection_result.body.map( (item) => item.shopify_id );
        let action_documents    = await h_shopify.data_base.collections.processCollectionData( item_marketplace, 'create', api_marketplace, shopify_collections.filter( (item) => !db_shopify_ids.includes( item.id ) ), [], language_result.body, setting_result.body );
        
        let products_data = [];
        for (const item_collection of action_documents.create) {
            
            let product_result = await backProductService.find( item_collection.query_products.format, { brand: 1, product_category: 1, tags: 1, options: 1, price: 1, collections: 1 }, null, { populate: null } );
            
            if( product_result.success ){
                
                if( product_result.body.length > 0 ){
                    
                    for (const item_product of product_result.body) {
                        
                        item_collection.filter_values = h_shopify.utils.getFilterValues( item_collection.filter_values, item_product );
                    }
                    
                    item_collection.filter_values.brands             = [...new Set( item_collection.filter_values.brands )];
                    item_collection.filter_values.product_categories = [...new Set( item_collection.filter_values.product_categories )];
                    item_collection.filter_values.tags               = [...new Set( item_collection.filter_values.tags )];
                    item_collection.filter_values.product_options    = item_collection.filter_values.product_options.map( (item) => {
                        return {
                            handle: item.handle,
                            values: [...new Set( item.values )]
                        }
                    });
                }
                let collection_created = await backCollectionService.create( item_collection );
                if( collection_created.success ){
                    
                    for (const item_product of product_result.body) {
                        
                        let index_product = products_data.findIndex( (item) => item._id === item_product._id.toString() );
                        
                        if( index_product >= 0 && products_data[ index_product ].collections.indexOf( collection_created.body._id.toString() ) < 0 ){
                            
                            products_data[ index_product ].collections.push( collection_created.body._id.toString() );
                        }
                        else if( item_product.collections.indexOf( collection_created.body._id.toString() ) < 0 ){
                            
                            products_data.push({
                                _id: item_product._id.toString(),
                                collections: item_product.collections.concat( [ collection_created.body._id.toString() ] )
                            });
                        }
                    }
                }
            }
        }
        if( products_data.length > 0 ){
            
            for (const item_product of products_data) {
                
                await backProductService.update( { _id: item_product._id }, { collections: item_product.collections } );
            }
        }
    }
    else{
        
        let request_errors = [ smart_collections, custom_collections, setting_result, collection_result, language_result ].filter( (item) => !item.success );
        
        console.log( new Date(), h_response.request( false, request_errors, 400, 'Error: Process Create Shopify Collections', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
    }
};
async function processUpdateShopifyCollections( item_marketplace ){
    
    const api_marketplace 	= shopify.init( item_marketplace.credentials );
    let params               = {
        // updated_at_min: new Date( moment().subtract(2, 'hours') ).toISOString(), 
        // updated_at_max: new Date( moment() ).toISOString(), 
        limit: 250 
    };
    let smart_collections   = await shopify.paginateQuery(api_marketplace, api_marketplace.smartCollection, api_marketplace.smartCollection.list, params);
    let custom_collections  = await shopify.paginateQuery(api_marketplace, api_marketplace.customCollection, api_marketplace.customCollection.list, params);
    
    let setting_result      = await backGeneralSettingService.findOne({ marketplace: item_marketplace._id.toString(), status: 'active' }, { general_filters: 1 });
    
    if( smart_collections.success && custom_collections.success && setting_result.success && setting_result.body ){
        
        let shopify_collections = smart_collections.body.concat( custom_collections.body );
        let collection_result   = await backCollectionService.find({ marketplace: item_marketplace._id.toString(), shopify_id: { $in: shopify_collections.map( (item) => item.id ) } });
        if( collection_result.success && collection_result.body.length > 0 ){
            
            let db_shopify_ids      = collection_result.body.map( (item) => item.shopify_id );
            let action_documents    = await h_shopify.data_base.collections.processCollectionData( item_marketplace, 'update', api_marketplace, shopify_collections.filter( (item) => db_shopify_ids.includes( item.id ) ), collection_result.body, [], setting_result.body );
            
            let products_data = [];
            for (const item_collection of action_documents.update) {
                
                let product_result = await backProductService.find( item_collection.document.query_products.format, { brand: 1, product_category: 1, tags: 1, options: 1, price: 1, collections: 1 }, null, { populate: null } );
                
                if( product_result.success && product_result.body.length > 0 ){
                    
                    for (const item_product of product_result.body) {
                        
                        let index_product = products_data.findIndex( (item) => item._id === item_product._id.toString() );
                        if( index_product >= 0 && products_data[ index_product ].collections.indexOf( item_collection.query._id.toString() ) < 0 ){
                            
                            products_data[ index_product ].collections.push( item_collection.query._id.toString() );
                        }
                        else if( item_product.collections.indexOf( item_collection.query._id.toString() ) < 0 ){
                            
                            products_data.push({
                                _id: item_product._id.toString(),
                                collections: item_product.collections.concat( [ item_collection.query._id.toString() ] )
                            });
                        }
                        item_collection.filter_values = h_shopify.utils.getFilterValues( item_collection.document.filter_values, item_product );
                    }
                    
                    item_collection.document.filter_values.brands             = [...new Set( item_collection.document.filter_values.brands )];
                    item_collection.document.filter_values.product_categories = [...new Set( item_collection.document.filter_values.product_categories )];
                    item_collection.document.filter_values.tags               = [...new Set( item_collection.document.filter_values.tags )];
                    item_collection.document.filter_values.product_options    = item_collection.document.filter_values.product_options.map( (item) => {
                        return {
                            handle: item.handle,
                            values: [...new Set( item.values )]
                        }
                    });
                    await backCollectionService.update( item_collection.query, item_collection.document );
                }
            }
            if( products_data.length > 0 ){
                
                for (const item_product of products_data) {
                    
                    await backProductService.update( { _id: item_product._id }, { collections: item_product.collections } );
                }
            }
        }
        else if( !collection_result.success ){
            
            console.log( new Date(), h_response.request( false, [collection_result], 400, 'Error: Process Update Shopify Collections', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
        }
    }
    else{
        
        let request_errors = [ smart_collections, custom_collections, setting_result ].filter( (item) => !item.success );
        
        console.log( new Date(), h_response.request( false, request_errors, 400, 'Error: Process Update Shopify Collections', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
    }
};
async function processCreateShopifyOrder( item_marketplace ){
    
    const api_marketplace 	= shopify.init( item_marketplace.credentials );
    let params              = {
        created_at_min: new Date( moment().subtract(15, 'days') ).toISOString(), 
        created_at_max: new Date( moment() ).toISOString(), 
        status: 'any',
        fulfillment_status: 'any', 
        limit: 250 
    };
    let db_servieces        = {
        draft_order             : backDraftOrderService, 
        order                   : backOrderService,
        customer                : backCustomerService,
        storefront              : backStorefrontService,
        affiliate               : backAffiliateService,
        order_line_items        : backOrderLineItemService,
        storefront_transaction  : backStorefrontTransactionService,
        product_bundle          : agentProductBundleService,
        preorder                : backPreorderService,
        preorder_items          : backPreorderItemService,
        product_variant         : backProductVariantService
    };
    let shopify_result  = await shopify.paginateQuery(api_marketplace, api_marketplace.order, api_marketplace.order.list, params);
    
    await h_shopify.data_base.orders.processCreateOrder( item_marketplace, shopify_result, db_servieces );
};


async function processUpdateShopifyOrders( item_marketplace, api_marketplace, params ){
    
    // const api_marketplace 	= shopify.init( item_marketplace.credentials );
    // let params               = {
    //     created_at_min: new Date( moment().subtract(2, 'hours') ).toISOString(), 
    //     created_at_max: new Date( moment() ).toISOString(), 
    //     status: 'any',
    //     fulfillment_status: 'any', 
    //     limit: 250 
    // };
    let shopify_result  = await shopify.paginateQuery(api_marketplace, api_marketplace.order, api_marketplace.order.list, params);
    if( shopify_result.success && shopify_result.body?.length > 0 ){
        
        let shopify_data    = shopify_result.body.reduce( (previous_item, current_item) => { 
            
            previous_item.ids.push( current_item.id );
            previous_item.draft_ids.push( current_item.id.toString() );
            if( current_item.customer != null ){ 
                
                previous_item.customers.push( current_item.customer.id ); 
            } 
            return previous_item; 
        }, { ids: [], draft_ids: [], customers: [] });
        
        let draft_result    = await backDraftOrderService.findDelete({ order_id: { $in: shopify_data.draft_ids }, step_order: 'draft-completed' }, { order_id: 1, coupon: 1, note_attributes: 1, bundle_details: 1 });
        let order_result    = await backOrderService.findDelete({ marketplace: item_marketplace._id.toString(), shopify_id: { $in: shopify_data.ids } }, null, null, { populate: { path: 'line_items' } });
        let customer_result = await backCustomerService.findDelete({ marketplace: item_marketplace._id.toString(), shopify_id: { $in: shopify_data.customers } });
        
        if( customer_result.success && order_result.success && draft_result.success ){
            
            console.log( order_result.body.length );
            let data_draft = draft_result.body.reduce( (previous_item, current_item) => {
                
                let storefront_id = current_item.note_attributes.find( (item) => item.name === 'storefront' )?.value || null;
                let affiliate_id = current_item.note_attributes.find( (item) => item.name === 'affiliate' )?.value || null;
                if( storefront_id != null ){
                    previous_item.storefront_ids.push( storefront_id );
                }
                if( affiliate_id != null ){
                    previous_item.affiliate_ids.push( affiliate_id );
                }
                return previous_item;
            }, { storefront_ids: [], affiliate_ids: [] });
            let storefront_result   = await backStorefrontService.findDelete({ marketplace: item_marketplace._id.toString(), _id: { $in: data_draft.storefront_ids } });
            let affiliate_result    = await backAffiliateService.findDelete({ marketplace: item_marketplace._id.toString(), _id: { $in: data_draft.affiliate_ids } });
            let transaction_result  = await backStorefrontTransactionService.find({ marketplace: item_marketplace._id.toString(), order_id: { $in: shopify_data.ids } });
            
            if( storefront_result.success && affiliate_result.success && transaction_result.success ){
                
                let db_data             = {
                    draft_result        : draft_result.body, 
                    storefront_result   : storefront_result.body, 
                    affiliate_result    : affiliate_result.body, 
                    transaction_result  : transaction_result.body, 
                    order_result        : order_result.body, 
                    customer_result     : customer_result.body
                }
                let db_shopify_ids      = order_result.body.map( (item) => item.shopify_id );
                let action_documents    = await h_shopify.data_base.orders.processOrderData( item_marketplace, 'update', shopify_result.body.filter( (item) => db_shopify_ids.includes( item.id ) ), db_data );
                
                console.log( 'orders:', action_documents.update.length );
                for (const [index_document, item_document] of action_documents.update.entries()) {
                    
                    for (const line_item of item_document.line_items) {
                        
                        let line_item_updated = await backOrderLineItemService.update( line_item.query, line_item.document );
                        if( !line_item_updated.success ){
                            
                            console.log(line_item.query, line_item.document, line_item_updated);
                        }
                    }
                    for (const item_transaction of item_document.transactions) {
                        
                        let data_transaction = {
                            id_marketplace: item_transaction.id_marketplace,
                            storefront: item_transaction.storefront,
                            affiliate: item_transaction.affiliate,
                            customer_id: item_transaction.customer_id,
                            category: item_transaction.category
                        };
                        let item_order          = { 
                            shopify_id          : item_document.order.document.shopify_id, 
                            total_amount_order  : item_document.order.document.total_line_items_price,
                            total_quantity_order: item_document.order.document.line_items.reduce( (previous_item, current_item) => previous_item + current_item.quantity, 0 ),
                            refunds             : item_document.order.document.refunds
                        };
                        let format_transaction = h_shopify.data_base.format.transactionObjects( data_transaction, item_order, item_transaction.line_item, transaction_result.body.filter( (item) => item.order_id === item_document.order.shopify_id ) );
                        if( format_transaction.length > 0 ){
                            
                            await backStorefrontTransactionService.createMany( format_transaction );
                        }
                    }
                    let order_updated = await backOrderService.update( item_document.order.query, item_document.order.document );
                    if( !order_updated.success ){
                        
                        console.log(item_document.order.query, item_document.order.document, order_updated);
                    }
                    else{
                        
                        console.log( 'order:', index_document + 1, action_documents.update.length );
                    }
                }
            }
            else{
                
                let request_errors = [ storefront_result, affiliate_result, transaction_result ].filter( (item) => !item.success );
                
                console.log( new Date(), h_response.request( false, request_errors, 400, 'Error: Process Create Shopify Orders', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
            }
        }
        else{
            
            let request_errors = [ draft_result, customer_result, order_result ].filter( (item) => !item.success );
            
            console.log( new Date(), h_response.request( false, request_errors, 400, 'Error: Process Create Shopify Orders', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
        }
    }
    else{
        
        console.log( new Date(), h_response.request( false, [shopify_result], 400, 'Error: Process Create Shopify Orders', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
    }
};
async function processFirstSyncShopifyOrder( item_marketplace ){
    
    const api_marketplace 	= shopify.init( item_marketplace.credentials );
    
    let first_year  = moment().get( 'year' ) - 2017;
    let years       = Array.from({ length: first_year + 1 }, (_, i) => first_year - i).reverse();
    let months      = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    for (const item_year of years) {
        
        for (const item_month of months) {
            
            let params = {
                created_at_min      : moment().subtract(item_year, 'years').startOf('year').add(item_month - 1, 'months').startOf('month').toISOString(), 
                created_at_max      : moment().subtract(item_year, 'years').startOf('year').add(item_month - 1, 'months').endOf('month').toISOString(), 
                status              : 'any',
                fulfillment_status  : 'any',
                limit               : 250 
            };
            console.log( params );
            await processUpdateShopifyOrders( item_marketplace, api_marketplace, params );
        }
    }
};
async function processCurrentSyncShopifyOrder( item_marketplace ){
    
    const api_marketplace 	= shopify.init( item_marketplace.credentials );
    
    let params = {
        created_at_min      : new Date( moment().subtract(5, 'minutes') ).toISOString(), 
        created_at_max      : new Date( moment() ).toISOString(), 
        status              : 'any',
        fulfillment_status  : 'any',
        limit               : 250 
    };
    await processCreateShopifyOrder( item_marketplace, api_marketplace, params );
};
async function processBuyAgain( item_marketplace ){
    
    let order_result = await backOrderService.find({ marketplace: item_marketplace._id.toString(), created_at: { $gte: h_format.dbDate( moment().utc().subtract( 1, 'days' ) ).toISOString() } }, { customer: 1, customer_id: 1 }, null, { populate: null });
    
    if( order_result.success ){
        
        let list_customers = [...new Set( order_result.body.reduce( (previous_item, current_item) => { 
            
            if( current_item.customer != null ){ 
                
                previous_item.push( current_item.customer_id ); 
            } 
            return previous_item; 
        }, [] ) )];
        let customer_result     = await backCustomerService.find({ marketplace: item_marketplace._id.toString(), shopify_id: { $in: list_customers } }, null, { shopify_id: 1 }, { populate: null });
        let buy_again_result    = await backBuyAgainService.find({ marketplace: item_marketplace._id.toString(), customer_id: { $in: list_customers } }, null, { customer_id: 1 });
        let line_item_result    = await backOrderLineItemService.find({ marketplace: item_marketplace._id.toString(), customer_id: { $in: list_customers } }, null, { customer_id: 1, variant_id: 1 });
        
        if( customer_result.success && line_item_result.success  && buy_again_result.success ){
            
            let buy_again_create = [];
            for (const item_customer of customer_result.body) {
                
                let line_items = line_item_result.body.filter( (item) => item.customer_id === item_customer.shopify_id );
                let buy_again = buy_again_result.body.find( (item) => item.customer_id === item_customer.shopify_id );
                
                if( buy_again ){
                    
                    let buy_again_object = h_shopify.data_base.format.buyAgainObject( item_marketplace._id.toString(), item_customer.shopify_id, line_items );
                    
                    await backBuyAgainService.update( buy_again_object.query, buy_again_object.document );
                }
                else{
                    
                    buy_again_create.push( h_shopify.data_base.format.buyAgainObject( item_marketplace._id.toString(), item_customer.shopify_id, line_items, true ) );
                }
            }
            if( buy_again_create.length > 0 ){
                
                await backBuyAgainService.createMany( buy_again_create );
            }
        }
        else{
            
            let request_errors = [ customer_result, line_item_result, buy_again_result ].filter( (item) => !item.success );
            
            console.log( new Date(), h_response.request( false, request_errors, 400, 'Error: Process Buy Again', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
        }
    }
    else{
        
        console.log( new Date(), h_response.request( false, [order_result], 400, 'Error: Process Buy Again', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
    }
};
async function processVerifyStockPreorder( item_marketplace ){
    
    let preorder_result = await backPreorderService.find({ marketplace: item_marketplace._id.toString(), status: 'active', life_stage: { $ne: 'closed' }, customer: { $ne: null } }, null, { customer: 1 });
    
    if( preorder_result.success ){
        
        let result_documents = await preorder_result.body.reduce( (previous_item, current_item, current_index) => {
            
            if( current_item.customer && current_item.customer?.agent && ( previous_item.customer_preorders.length === 0 || ( previous_item.customer_preorders.length > 0 && previous_item.customer_preorders[ previous_item.customer_preorders.length - 1 ].shopify_id != current_item.customer.shopify_id ) ) ){
                
                previous_item.customer_preorders.push({ 
                    ...current_item.customer, 
                    preorders: [
                        { 
                            id          : current_item._id.toString(),
                            name        : current_item.name, 
                            line_items  : current_item.line_items,
                            stock_items : [],
                            closed_items: [],
                            created_at  : current_item.created_at
                        }
                    ] 
                });
                previous_item.skus.push( current_item.line_items.map( (item) => item.sku ) );
            }
            else if( current_item.customer && current_item.customer?.agent ){
                
                previous_item.customer_preorders[ previous_item.customer_preorders.length - 1 ].preorders.push( { 
                    id          : current_item._id.toString(),
                    name        : current_item.name, 
                    line_items  : current_item.line_items,
                    stock_items : [],
                    closed_items: [],
                    created_at  : current_item.created_at
                } );
                previous_item.skus.push( current_item.line_items.map( (item) => item.sku ) );
            }
            if( preorder_result.body.length - 1 === current_index ){
                
                previous_item.skus = [...new Set( previous_item.skus.flat() )];
            }
            
            return previous_item;
        }, { skus: [], customer_preorders: [] });
        
        let variant_result = await backProductVariantService.find({ marketplace: item_marketplace._id.toString(), sku: { $in: result_documents.skus }, status: 'active' });
        
        if( variant_result.success ){
            
            let update_preorders = {
                pending_items: {
                    names: [],
                    skus: []
                },
                pending_preorders: [],
                closed_items: {
                    names: [],
                    skus: []
                },
                closed_preorders: []
            };
            for (const item_customer of result_documents.customer_preorders) {
                
                let notification_stock = {
                    module: 'preorder',
                    ids: [],
                    customer: {
                        id: item_customer._id.toString(),
                        name: item_customer.full_name,
                        email: item_customer.email
                    },
                    agents: [],
                    body: { 
                        type: 'stock', 
                        list: []
                    }
                };
                for (const item_preorder of item_customer.preorders) {
                    
                    let stock_items = [];
                    let closed_items = [];
                    for (const line_item of item_preorder.line_items) {
                        
                        let db_variant = variant_result.body.find( (item) => item.sku === line_item.sku );
                        let pending_days = moment( new Date() ).diff( moment( line_item.created_at ), 'days' );
                        
                        if( db_variant && db_variant.inventory_quantity >= line_item.quantity && line_item.life_stage === 'open' && pending_days < 60 ){
                            
                            let new_line_item = line_item;
                            new_line_item.inventory_quantity = db_variant.inventory_quantity;
                            stock_items.push( new_line_item );
                        }
                        else if( pending_days >= 60 ){
                            
                            closed_items.push( line_item );
                        }
                    }
                    item_preorder.stock_items   = stock_items;
                    item_preorder.closed_items  = closed_items;
                    
                    if( item_preorder.stock_items.length > 0 ){
                        
                        update_preorders.pending_items.names.push( item_preorder.name );
                        update_preorders.pending_items.items.push( item_preorder.stock_items.map( (item) => item.sku ) );
                        notification_stock.ids.push( item_preorder.id );
                        notification_stock.body.list.push({
                            id: item_preorder.id,
                            preorder_name: item_preorder.name,
                            items: item_preorder.stock_items.map( (item) =>{
                                return {
                                    sku: item.sku,
                                    preorder_name: item_preorder.name,
                                    quantity: item.quantity,
                                    stock: item.inventory_quantity,
                                    date: item_preorder.created_at,
                                    url_preorder_agent: '',
                                    url_preorder_store: 'https://shop.com/account/dashboard/preorders',
                                    status: 'pending'
                                }
                            })
                        });
                    }
                    if( item_preorder.stock_items.length > 0 && item_preorder.line_items.length === item_preorder.stock_items.length ){
                        
                        update_preorders.pending_preorders.push( item_preorder.name );
                    }
                    if( item_preorder.closed_items.length > 0 ){
                        
                        update_preorders.closed_items.names.push( item_preorder.name );
                        update_preorders.closed_items.items.push( item_preorder.closed_items.map( (item) => item.sku ) );
                    }
                    if( item_preorder.closed_items.length > 0 && item_preorder.line_items.length === item_preorder.closed_items.length ){
                        
                        update_preorders.closed_preorders.push( item_preorder.name );
                    }
                }
                
                if( notification_stock.ids.length > 0 && notification_stock.body.list.length > 0 ){
                    
                    notification_stock.agents = [{ id: item_customer.agent._id.toString(), name: item_customer.agent.name, email: item_customer.agent.email, support: false }].concat( item_customer.agent.agentSupports.reduce( (previous_item, current_item) => {
                        
                        if( current_item.notification ){
                            
                            previous_item.push({
                                id: current_item.agent_id._id.toString(),
                                name: current_item.agent_id.name,
                                email: current_item.agent_id.email,
                                support: true
                            });
                        }
                        return previous_item;
                    }, []) );
                    
                    await agent.post.sendNotificationPreorder( notification_stock ); 
                }
            }
            update_preorders.pending_items.items    = update_preorders.pending_items.items.flat();
            update_preorders.closed_items.items     = update_preorders.closed_items.items.flat();
            
            if( update_preorders.pending_items.names.length > 0 ){
                
                await backPreorderItemService.updateMany({ $and: [ { name: { $in: update_preorders.pending_items.names } }, { sku: { $in: update_preorders.pending_items.skus } } ] }, { life_stage: 'pending' });
            }
            if( update_preorders.closed_items.names.length > 0 ){
                
                await backPreorderItemService.updateMany({ $and: [ { name: { $in: update_preorders.closed_items.names } }, { sku: { $in: update_preorders.closed_items.skus } } ] }, { life_stage: 'pending' });
            }
            if( update_preorders.pending_preorders.length > 0 ){
                
                await backPreorderService.updateMany({ name: { $in: update_preorders.pending_preorders } }, { life_stage: 'pending' });
            }
            if( update_preorders.closed_items.length > 0 ){
                
                await backPreorderService.updateMany({ name: { $in: update_preorders.closed_preorders } }, { life_stage: 'closed' });
            }
        }
        else{
            
            console.log( new Date(), h_response.request( false, [variant_result], 400, 'Error: Verify Stock Preorder', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
        }
    }
    else{
        
        console.log( new Date(), h_response.request( false, [preorder_result], 400, 'Error: Verify Stock Preorder', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
    }
};
async function processSyncShippingGroups( item_marketplace ){
    
    const api_marketplace 	    = shopify.init( item_marketplace.credentials );
    let shopify_result          = await shopify.paginateQuery( api_marketplace, api_marketplace.shippingZone, api_marketplace.shippingZone.list, { limit : 250 } );
    let country_result          = await backCountryService.find();
    let shipping_type_result    = await backShippingTypeService.find({ marketplace: item_marketplace._id.toString() });
    let shipping_group_result   = await backShippingGroupService.find({ marketplace: item_marketplace._id.toString() });
    let shipping_tax_result     = await backShippingTaxService.find({ marketplace: item_marketplace._id.toString() });
    
    if( shopify_result.success && country_result.success && shipping_type_result.success && shipping_group_result.success){
        
        let shipping_taxes  = {
            create: [],
            update: []
        };
        
        let zones_by_group = h_array.sort(shopify_result.body, 'profile_id').reduce( (previous_item, current_item) => {
            
            let zone_group_id = h_validation.evalString( current_item.profile_id ) ? h_validation.evalFloat( current_item.profile_id.replace('gid://shopify/DeliveryProfile/', ''), null ) : null;
            
            if( zone_group_id != null && ( previous_item.length === 0 || previous_item[ previous_item.length - 1].shopify_id != zone_group_id ) ){
                
                previous_item.push({ shopify_id: zone_group_id, zones: [current_item] });
            }
            else if( zone_group_id != null ){
                
                previous_item[previous_item.length - 1].zones.push( current_item );
            }
            return previous_item;
        }, []);
        
        for (const [index_group, item_group] of zones_by_group.entries()) {
            
            let index_db_group = shipping_group_result.body.findIndex( (item) => item.shopify_id === item_group.shopify_id );
            
            let exist_group = null;
            if( index_db_group >= 0 ){
                
                exist_group = shipping_group_result.body[ index_db_group ];
            }
            else{
                let new_group   = {
                    name            : `Group ${ shipping_group_result.body.length + index_group + 1 }`,
                    shopify_id      : item_group.shopify_id,
                    general_group   : false
                };
                let format_group = h_shopify.data_base.format.shippingGroupObject( item_marketplace._id.toString(), new_group );
                
                let shipping_group_created = await backShippingGroupService.create(format_group);
                
                exist_group = shipping_group_created.success ? shipping_group_created.body : null;
            }
            if( exist_group != null ){
                
                let group_zones = exist_group.shipping_zones.map( (item) => item._id.toString() );
                for (const item_zone of item_group.zones) {
                    
                    if( item_zone.weight_based_shipping_rates.length > 0 || item_zone.price_based_shipping_rates.length > 0 ){

                        let exist_zone  = exist_group.shipping_zones.find( (item) => item.shopify_id === item_zone.id );
                        let format_document   = h_shopify.data_base.format.shippingZoneRatesTaxesObject( item_marketplace._id.toString(), exist_group, item_zone, exist_zone || null, shipping_type_result.body, country_result.body, shipping_tax_result.body);
                        
                        shipping_taxes.create  = shipping_taxes.create.concat( format_document.taxes.create );
                        shipping_taxes.update  = shipping_taxes.update.concat( format_document.taxes.update );

                        let shipping_zone_updated = null;
                        if( exist_zone ){

                            shipping_zone_updated = format_document.zone.document;
                        }
                        else{
                            
                            format_document.zone.standard_rates = [];
                            format_document.zone.variant_rates  = [];
                            let shipping_zone_created = await backShippingZoneService.create( format_document.zone );
                            if( shipping_zone_created.success ){
                                
                                group_zones.push( shipping_zone_created.body._id.toString() );
                                shipping_zone_updated = shipping_zone_created.body;
                            }
                        }
                        if( shipping_zone_updated != null ){
                            
                            format_document.rates.standard.create  = format_document.rates.standard.create.map( (item_rate) => {
                                    
                                item_rate.shipping_zone = h_validation.evalObjectId( shipping_zone_updated._id );
                                
                                return item_rate;
                            });
                            format_document.rates.variant.create   = format_document.rates.variant.create.map( (item_rate) => {
                                
                                item_rate.shipping_zone = h_validation.evalObjectId( shipping_zone_updated._id );
                                
                                return item_rate;
                            });
                            for (const item_rate of format_document.rates.standard.update) {
                                
                                let rate_updated = await backShippingRateService.update( item_rate.query, item_rate.document );
                                if( rate_updated.success && shipping_zone_updated.standard_rates[item_rate.query._id] ){
                                    
                                    shipping_zone_updated.standard_rates[item_rate.query._id].min_weight = rate_updated.body.min_weight;
                                }
                            }
                            for (const item_rate of format_document.rates.variant.update) {
                                
                                let rate_updated = await backShippingRateService.update( item_rate.query, item_rate.document );
                                if( rate_updated.success && shipping_zone_updated.variant_rates[item_rate.query._id] ){
                                    
                                    shipping_zone_updated.variant_rates[item_rate.query._id].min_total_order = rate_updated.body.min_total_order;
                                }
                            }
                            let standard_rate_created   = { success: true, body: [] };
                            let variant_rate_created    = { success: true, body: [] };

                            if( format_document.rates.standard.create.length > 0 ){
                                
                                standard_rate_created = await backShippingRateService.createMany( format_document.rates.standard.create );
                            }
                            if( format_document.rates.variant.create.length > 0 ){
                                
                                variant_rate_created = await backShippingRateService.createMany( format_document.rates.variant.create );
                            }
                            
                            if( standard_rate_created.success && variant_rate_created.success ){
                                
                                shipping_zone_updated.standard_rates = h_array.sort( Object.entries( shipping_zone_updated.standard_rates ).reduce( (previous_item, [key_item, value_item]) => {

                                    previous_item.push( value_item );
                                    return previous_item;
                                }, standard_rate_created.body), 'min_weight', true ).map( (item) => item._id.toString() );
                                shipping_zone_updated.variant_rates  = h_array.sort( Object.entries( shipping_zone_updated.variant_rates ).reduce( (previous_item, [key_item, value_item]) => {

                                    previous_item.push( value_item );
                                    return previous_item;
                                }, variant_rate_created.body), 'min_total_order', true ).map( (item) => item._id.toString() );
                                
                                await backShippingZoneService.update( exist_zone ? format_document.zone.query : { _id: shipping_zone_updated._id.toString() }, shipping_zone_updated );
                            }

                            if( format_document.taxes.create.length > 0 ){
                                
                                let shipping_taxes_created = await backShippingTaxService.createMany( format_document.taxes.create );

                                if( shipping_taxes_created.success ){
                                    
                                    shipping_tax_result.body = shipping_tax_result.body.concat( shipping_taxes_created.body );
                                }
                            }
                            for (const item_tax of format_document.taxes.update) {
                                
                                await backShippingTaxService.update( item_tax.query, item_tax.document );
                            }
                        }
                    }
                }
                await backShippingGroupService.update({ _id: exist_group._id.toString() }, { shipping_zones: group_zones });
            }
        }
    }
    else{
        
        let request_errors = [ shopify_result, country_result, shipping_type_result, shipping_group_result ].filter( (item) => !item.success );
        
        console.log( new Date(), h_response.request( false, request_errors, 400, 'Error: Sync Shipping Groups', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
    }
};




async function processSyncCentralProducts( item_marketplace ){
    
    let setting_result  = await backGeneralSettingService.findOne({ marketplace: item_marketplace._id.toString(), status: 'active' }, { app_central: 1 });
    let brand_result    = await backBrandService.find({ marketplace: item_marketplace._id.toString(), status: 'active' });
    let product_result  = await backProductService.find({ marketplace: item_marketplace._id.toString(), status: 'active', status_created: 'active', tags: { $not: { $elemMatch: { name: 'POP' } } } }, { variants: 1, product_type: 1, brand: 1 }, { brand: 1 }, { populate: { path: 'variants', select: 'sku inventory_quantity' } });
    
    if( setting_result.success && brand_result.success && product_result.success ){
        
        await central.post.listProductsBySku({ token: setting_result.body.app_central.token, all_skus: product_result.body.map( (item) => item.variants.map( (item_s) => item_s.sku ) ).flat() }).then( async (central_result) => {
            
            let all_brands = brand_result.body.reduce( (previous_item, current_item) =>{
                if( current_item.customer_brand ){
                    
                    previous_item.customer_brands.push( current_item.name );
                }
                else{
                    
                    previous_item.store_brands.push( current_item.name );
                }
                return previous_item;
            }, { store_brands: [], customer_brands: [] });
            
            all_brands.store_brands     = [...new Set( all_brands.store_brands )];
            all_brands.customer_brands  = [...new Set( all_brands.customer_brands )];
            
            let central_skus                    = {};
            let array_fields                    = h_validation.fields.central_product_features;
            let sku_errors                      = {
                variant_data        : [],
                blank_data          : [],
                n_a_data            : [],
                not_silhouette_data : [],
                repeat_data         : [],
                missing_data        : []
            };
            let default_values = {
                product_features        : {},
                extract_features_data   : {},
                central_fields          : {}
            }
            
            for (const item_central_variant of central_result.data.exist_skus) {
                
                if( !central_skus[item_central_variant.sku] ){
                    
                    central_skus[item_central_variant.sku] = {
                        estadoCatalog: ( item_central_variant.estadoCatalog != "" && (utils.validation.validString(item_central_variant.estadoCatalog, 'Inactivo').toLowerCase() != 'inactivo') ),
                        extract_data: {}
                    };
                    for (const item_field of array_fields) {
                        central_skus[item_central_variant.sku].extract_data[item_field.hefesto] = [];
                        central_skus[item_central_variant.sku].extract_data[item_field.hefesto].push({ 
                            sku     : item_central_variant.sku, 
                            value   : item_central_variant[item_field.central] ? item_central_variant[item_field.central].toString().trim() : null 
                        });
                    }
                }
                else{
                    
                    sku_errors.repeat_data.push( item_central_variant.sku );
                }
            }
            sku_errors.missing_data = central_result.data.missing_skus;
            for (const item_field of [...array_fields]) {
                
                default_extract_features_data[item_field.hefesto] = [];
                default_central_fields[item_field.central] = "";
                
                if( item_field.hefesto.indexOf('uses') === 0 && default_product_features.uses ){
                    
                    default_product_features.uses.push( null );
                }
                else if( item_field.hefesto.indexOf('uses') === 0 ){
                    
                    default_product_features.uses = [null];
                }
                else if( item_field.hefesto.indexOf('compInnerMat') === 0 && default_product_features.complementary_inner_material ){
                    
                    default_product_features.complementary_inner_material.push( null );
                }
                else if( item_field.hefesto.indexOf('compInnerMat') === 0 ){
                    
                    default_product_features.complementary_inner_material = [null];
                }
                else{
                    
                    default_product_features[item_field.hefesto] = null;
                }
            }
            default_extract_features_data = {...default_extract_features_data, count_blank: 0, count_n_a: 0, not_silhouette: false };
            
            for (const item_product of product_result.body) {
                
                let result_process = h_shopify.data_base.central.processProductFeaturesData( item_product, all_brands, central_skus, array_fields, sku_errors, default_values );
                
                sku_errors = result_process.sku_errors;
                let product_updated = await backProductService.update( { _id: item_product._id }, { features: result_process.product.features, approved_features: result_process.product.approved_features, warehouse_status: result_process.product.warehouse_status });
                if( product_updated.success ){
                    
                    for (const item_variant of result_process.product.variants) {
                        
                        let variant_updated = await backProductVariantService.update( { _id: item_variant._id },{ warehouse_status: item_variant.warehouse_status });
                        if( !variant_updated.success ){
                            
                            console.log( new Date(), h_response.request( false, variant_updated, 400, 'Error: Sync Central Products', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
                        }
                    }
                }
                else{
                    
                    console.log( new Date(), h_response.request( false, product_updated, 400, 'Error: Sync Central Products', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
                }
            }
            
            let count_errors      = {
                variant_data        : sku_errors.variant_data.length,
                blank_data          : sku_errors.blank_data.length,
                n_a_data            : sku_errors.n_a_data.length,
                not_silhouette_data : sku_errors.not_silhouette_data.length,
                repeat_data         : sku_errors.repeat_data.length,
                missing_data        : sku_errors.missing_data.length
            };
        }).catch( (central_error) => {
            
            console.log( new Date(), h_response.request( false, central_error, 400, 'Error: Sync Central Products', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
        });
    }
    else{
        
        let request_errors = [ setting_result, brand_result, product_result ].filter( (item) => !item.success );
        
        console.log( new Date(), h_response.request( false, request_errors, 400, 'Error: Sync Central Products', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
    }
};
// =============================================================================
// CUSTOMER JOB FUNCTIONS
// =============================================================================
async function syncCreateCustomers(){
    
    await syncShopifyDataByMarketplace( processCreateShopifyCustomers );
};
async function syncUpdateCustomers(){
    
    await syncShopifyDataByMarketplace( processUpdateShopifyCustomers );
};
async function updateCountOrders(){
    
    await syncShopifyDataByMarketplace( processNextYearCustomerCountOrders );
}
// =============================================================================
// BRAND JOB FUNCTIONS
// =============================================================================
async function syncBrands(){
    
    await syncShopifyDataByMarketplace( processShopifyProductBrands );
};
// =============================================================================
// PRODUCT TYPE JOB FUNCTIONS
// =============================================================================
async function syncProductCategories(){
    
    await syncShopifyDataByMarketplace( processShopifyProductCategories );
};
// =============================================================================
// PRODUCT JOB FUNCTIONS
// =============================================================================
async function syncCreateProducts(){
    
    await syncShopifyDataByMarketplace( processCreateShopifyProducts );
};
async function syncUpdateProducts(){
    
    await syncShopifyDataByMarketplace( processUpdateShopifyProducts );
};
async function syncDeleteProducts(){
    
    await syncShopifyDataByMarketplace( processDeleteShopifyProducts );
};
async function syncUpdateBestSellers(){
    
    await syncShopifyDataByMarketplace( processUpdateBestSellers );
};
// =============================================================================
// FILTERS JOB FUNCTIONS
// =============================================================================
async function syncGeneralFilters(){
    
    await syncShopifyDataByMarketplace( processGeneralFilters );
};
// =============================================================================
// COLLECTION JOB FUNCTIONS
// =============================================================================
async function syncCreateCollections(){
    
    await syncShopifyDataByMarketplace( processCreateShopifyCollections );
};
async function syncUpdateCollections(){
    
    await syncShopifyDataByMarketplace( processUpdateShopifyCollections );
};
// =============================================================================
// ORDER JOB FUNCTIONS
// =============================================================================
async function syncCreateOrders(){
    
    await syncShopifyDataByMarketplace( processCurrentSyncShopifyOrder );
};
async function syncUpdateOrders(){
    
    await syncShopifyDataByMarketplace( processUpdateShopifyOrders );
};
async function syncBuyAgain(){
    
    await syncShopifyDataByMarketplace( processBuyAgain );
};

async function firstSyncShopifyOrder(){
    
    await syncShopifyDataByMarketplace( processFirstSyncShopifyOrder );
};
// =============================================================================
// PREORDER JOB FUNCTIONS
// =============================================================================
async function verifyStockPreorder(){
    
    await syncShopifyDataByMarketplace( processVerifyStockPreorder );
};
// =============================================================================
// SHIPPING JOB FUNCTIONS
// =============================================================================
async function syncShippingGroups(){
    
    await syncShopifyDataByMarketplace( processSyncShippingGroups );
};
async function syncUpdateData(){
    try {
        let updated_access_1 = await backAccessProductCatalogService.updateMany({ deleted_at: { $ne: null } }, { marketplace: "6733c68d683c5c17c67a7a6c", deleted: true });
        let updated_access_2 = await backAccessProductCatalogService.updateMany({ deleted_at: null }, { marketplace: "6733c68d683c5c17c67a7a6c", deleted: false });
        
        let updated_application_1 = await backApplicationService.updateMany({ deleted_at: { $ne: null } }, { marketplace: "6733c68d683c5c17c67a7a6c", deleted: true });
        let updated_application_2 = await backApplicationService.updateMany({ deleted_at: null }, { marketplace: "6733c68d683c5c17c67a7a6c", deleted: false });
        
        let updated_content_1 = await backAdditionalProductContentService.updateMany({ deleted_at: { $ne: null } }, { marketplace: "6733c68d683c5c17c67a7a6c", deleted: true });
        let updated_content_2 = await backAdditionalProductContentService.updateMany({ deleted_at: null }, { marketplace: "6733c68d683c5c17c67a7a6c", deleted: false });
        
        let updated_cart_1 = await backCartService.updateMany({ deleted_at: { $ne: null } }, { marketplace: "6733c68d683c5c17c67a7a6c", affiliate: null, deleted: true });
        let updated_cart_2 = await backCartService.updateMany({ deleted_at: null }, { marketplace: "6733c68d683c5c17c67a7a6c", affiliate: null, deleted: false });
        
        let updated_draft_1 = await backDraftOrderService.updateMany({ deleted_at: { $ne: null } }, { marketplace: "6733c68d683c5c17c67a7a6c", shopify_object: null, deleted: true });
        let updated_draft_2 = await backDraftOrderService.updateMany({ deleted_at: null }, { marketplace: "6733c68d683c5c17c67a7a6c", shopify_object: null, deleted: false });
        
        let draft_order_result = await backDraftOrderService.findDelete({ shopify: { $ne: null } });
        for (const item_draft of draft_order_result.body) {
            
            let draft_update_result = await backDraftOrderService.update({ _id: item_draft._id.toString() }, { shopify_object: JSON.parse( item_draft.shopify ) });
            if( draft_update_result.success ){
                
            }
        }
        
        let updated_preorder_item_1 = await backPreorderItemService.updateMany({ deleted_at: { $ne: null } }, { marketplace: "6733c68d683c5c17c67a7a6c", bundle_type: null, deleted: true });
        let updated_preorder_item_2 = await backPreorderItemService.updateMany({ deleted_at: null }, { marketplace: "6733c68d683c5c17c67a7a6c", bundle_type: null, deleted: false });
        
        let updated_preorder_1 = await backPreorderService.updateMany({ deleted_at: { $ne: null } }, { marketplace: "6733c68d683c5c17c67a7a6c", advance_order: null, complete_order: null, product_bundle: null, deleted: true });
        let updated_preorder_2 = await backPreorderService.updateMany({ deleted_at: null }, { marketplace: "6733c68d683c5c17c67a7a6c", advance_order: null, complete_order: null, product_bundle: null, deleted: false });
        
        let updated_customer_1 = await backCustomerService.updateMany({ deleted_at: { $ne: null } }, { marketplace: "6733c68d683c5c17c67a7a6c", storefront: null, deleted: true });
        let updated_customer_2 = await backCustomerService.updateMany({ deleted_at: null }, { marketplace: "6733c68d683c5c17c67a7a6c", storefront: null, deleted: false });
        
        let updated_user_1 = await backUserService.updateMany({ deleted_at: { $ne: null } }, { marketplace: "6733c68d683c5c17c67a7a6c", storefront: null, deleted: true });
        let updated_user_2 = await backUserService.updateMany({ deleted_at: null }, { marketplace: "6733c68d683c5c17c67a7a6c", storefront: null, deleted: false });
        
        let removed_best_seller = await backBestSellerService.removeMany({});
        let removed_collection = await backCollectionService.removeMany({});
        
        db.getCollection("back_users").updateMany({}, { $unset: { delete: 1 } });
        db.getCollection("back_customers").updateMany({}, { $unset: { delete: 1 } });
        db.getCollection("back_pre_orders").updateMany({}, { $unset: { delete: 1 } });
        db.getCollection("back_pre_order_items").updateMany({}, { $unset: { delete: 1 } });
        db.getCollection("back_draft_orders").updateMany({}, { $unset: { delete: 1 } });
        db.getCollection("back_carts").updateMany({}, { $unset: { delete: 1 } });
        db.getCollection("back_additional_product_contents").updateMany({}, { $unset: { delete: 1 } });
        db.getCollection("back_applications").updateMany({}, { $unset: { delete: 1 } });
        db.getCollection("back_access_product_catalogs").updateMany({}, { $unset: { delete: 1 } });
        
        
        db.getCollection("back_users").updateMany({ deleted_at: null }, { $set: { 
            marketplace: ObjectId("6733c68d683c5c17c67a7a6c"), 
            deleted: false
        } });
        db.getCollection("back_users").updateMany({ deleted_at: { $ne: null } }, { $set: { 
            marketplace: ObjectId("6733c68d683c5c17c67a7a6c"), 
            deleted: true
        } });
        
        db.getCollection("back_customers").updateMany({ deleted_at: null }, { $set: { 
            marketplace: ObjectId("6733c68d683c5c17c67a7a6c"), 
            deleted: false, 
            is_wholesale: true, 
            is_retail: false, 
            is_storefront: false, 
            is_affiliate: false 
        } });
        db.getCollection("back_customers").updateMany({ deleted_at: { $ne: null } }, { $set: { 
            marketplace: ObjectId("6733c68d683c5c17c67a7a6c"), 
            deleted: true,
            is_wholesale: true,
            is_retail: false,
            is_storefront: false,
            is_affiliate: false 
        } });
        
        db.getCollection("back_brands").updateMany({ deleted_at: null }, { $set: { 
            marketplace: ObjectId("6733c68d683c5c17c67a7a6c"),
            deleted: false 
        } });
        db.getCollection("back_brands").updateMany({ deleted_at: { $ne: null } }, { $set: { 
            marketplace: ObjectId("6733c68d683c5c17c67a7a6c"),
            deleted: true 
        } });
        
        db.getCollection("back_products").updateMany({ deleted_at: null }, { $set: { 
            marketplace: ObjectId("6733c68d683c5c17c67a7a6c"),
            deleted: false 
        } });
        db.getCollection("back_products").updateMany({ deleted_at: { $ne: null } }, { $set: { 
            marketplace: ObjectId("6733c68d683c5c17c67a7a6c"),
            deleted: true 
        } });
        
        db.getCollection("back_product_variants").updateMany({ deleted_at: null }, { $set: { 
            marketplace: ObjectId("6733c68d683c5c17c67a7a6c"),
            deleted: false 
        } });
        db.getCollection("back_product_variants").updateMany({ deleted_at: { $ne: null } }, { $set: { 
            marketplace: ObjectId("6733c68d683c5c17c67a7a6c"),
            deleted: true 
        } });
        
        db.getCollection("back_orders").updateMany({ deleted_at: null }, { $set: { 
            marketplace: ObjectId("6733c68d683c5c17c67a7a6c"),
            deleted: false 
        } });
        db.getCollection("back_orders").updateMany({ deleted_at: { $ne: null } }, { $set: { 
            marketplace: ObjectId("6733c68d683c5c17c67a7a6c"),
            deleted: true 
        } });
        
        db.getCollection("back_order_line_items").updateMany({ deleted_at: null }, { $set: { 
            marketplace: ObjectId("6733c68d683c5c17c67a7a6c"),
            deleted: false 
        } });
        db.getCollection("back_order_line_items").updateMany({ deleted_at: { $ne: null } }, { $set: { 
            marketplace: ObjectId("6733c68d683c5c17c67a7a6c"),
            deleted: true 
        } });
        
        db.getCollection("back_products").updateMany({}, { $unset: { filters: 1, delete: 1, skus: 1 } });
        db.getCollection("back_product_variants").updateMany({}, { $unset: { delete: 1 } });
        
        db.getCollection("back_orders").updateMany({}, { $unset: { delete: 1, currency: 1 } });
        db.getCollection("back_order_line_items").updateMany({}, { $unset: { delete: 1 } });
        
        db.getCollection("back_product_variants").updateMany({}, { $set: { 
            marketplace: ObjectId("6733c68d683c5c17c67a7a6c"), 
            brand: null, 
            product_category: null, 
            product_type: null, 
            image: null 
        } });
        db.getCollection("back_products").updateMany({}, { $set: { 
            marketplace: ObjectId("6733c68d683c5c17c67a7a6c"), 
            discount_price: { min_price: 0, max_price: 0 }, 
            config_bundle: null, 
            config_pre_sale: null, 
            custom_badges: null, 
            brand: null, 
            product_category: null, 
            product_type: null, 
            options: null,
            collections: [], 
            images: [], 
            translate: [],
            variant_titles: []
        } });
        
        db.getCollection("back_orders").updateMany({}, { $set: { 
            marketplace: ObjectId("6733c68d683c5c17c67a7a6c"), 
            storefront: null, 
            affiliate: null,
            currency_code: 'USD',
            is_adjustment: false,
            skus: [],
            brands: []
        } });     
        db.getCollection("back_order_line_items").updateMany({}, { $set: { 
            marketplace: ObjectId("6733c68d683c5c17c67a7a6c"), 
            storefront: null, 
            brand: null, 
            product_category: null,
            product_type: null,
            origin: null
        } });
        db.getCollection("back_order_line_items").updateMany({ refunded: { $ne: null } }, { $set: { 
            refunded: { $cond: { if: { $isArray: "$refunded" }, then: "$refunded", else: ["$refunded"] } }
        } });
        db.getCollection("back_order_line_items").updateMany({ refunded: null }, { $set: { 
            refunded: []
        } });
        db.getCollection("back_carts").updateMany({}, { $set: { 
            marketplace: ObjectId("6733c68d683c5c17c67a7a6c"), 
            customer: null, 
            whishlist: []
        } });
        
        return { success: true, message: 'All data was updated successfully' };
    } catch (process_error) {
        console.log( process_error );
        return { success: false, error: process_error };
    }
    
};
// =============================================================================
// AUDITH JOB FUNCTION
// =============================================================================
async function audithProductVariantsRepeat( item_marketplace ){
    
    return new Promise(async (resolve, reject) => {
        
        let product_result = await backProductService.findDelete({ marketplace: item_marketplace._id.toString() }, null, null, { populate: null });
        let variant_result = await backProductVariantService.findDelete({ marketplace: item_marketplace._id.toString() });
        
        if( product_result.success && product_result.body.length > 0 && variant_result.success && variant_result.body.length > 0 ){
            
            let all_variants = product_result.body.map( (item) => item.variants.map( (item) => item.toString() ) ).flat();
            let not_asign_variants = variant_result.body.reduce( (previous_item, current_item) => {
                
                if( all_variants.indexOf( current_item._id.toString() ) < 0 ){
                    
                    previous_item.variants.data.push( current_item._id.toString() );
                    previous_item.products.data.push( current_item.product_id );
                }
                return previous_item;
            }, { variants: { count: 0, data: [] }, products: { count: 0, data: [] } });
            
            not_asign_variants.products.data = [...new Set(not_asign_variants.products.data)];
            not_asign_variants.products.count = not_asign_variants.products.data.length;
            not_asign_variants.variants.count = not_asign_variants.variants.data.length;
            
            resolve( { repeat_variants: not_asign_variants.variants, products_not_updated_variants: not_asign_variants.products } );
        }
    });
};
async function audithRepeatDraftOrders( item_marketplace ){
    
    return new Promise( async(resolve, reject) => {
        
        const api_marketplace   = shopify.init( item_marketplace.credentials );
        let data_preorders      = [];
        let shopify_result      = await shopify.paginateQuery( api_marketplace, api_marketplace.draftOrder, api_marketplace.draftOrder.list, { ids: data_preorders.join(',') } );
        
        if( shopify_result.success && shopify_result.body.length > 0 ){
            
            let order_ids = shopify_result.body.reduce( (previous_item, current_item) => { 
                if( current_item.status === 'completed' ){ 
                    previous_item.push( current_item.order_id ); 
                } 
                return previous_item; 
            }, [] );
            let all_draft = [];
            let order_result = await backOrderService.find({ marketplace: item_marketplace._id.toString(), shopify_id: { $in: order_ids } });
            if( order_result.success && order_result.body.length > 0 ){
                
                for (const item_draft_id of data_preorders) {
                    
                    let item_draft = shopify_result.body.find( (item) => item.id === item_draft_id );
                    
                    if( item_draft ){
                        
                        all_draft.push({
                            customer        : item_draft.customer.id,
                            draft_id        : item_draft_id,
                            status          : item_draft.status,
                            total_draft     : item_draft.total_price,
                            skus            : item_draft.line_items.map( (item) => `${ item.sku } ${ item.quantity }` ).join(', '),
                            shipping_address: Object.entries(item_draft.shipping_address).map( ([key_item, value_item]) => value_item ).join(', '),
                            compare_draft   : [],
                            repeat_group    : '',
                            order_id        : item_draft.status === 'completed' ? order_result.body.find( (item) => item.shopify_id === item_draft.order_id )?.shopify_id : null,
                            order_name      : item_draft.status === 'completed' ? order_result.body.find( (item) => item.shopify_id === item_draft.order_id )?.name : null,
                            index           : all_draft.length
                        });
                    }
                    else{
                        all_draft.push({
                            customer        : item_draft.customer.id,
                            draft_id        : item_draft_id,
                            status          : item_draft.status,
                            total_draft     : item_draft.total_price,
                            skus            : item_draft.line_items.map( (item) => `${ item.sku } ${ item.quantity }` ).join(', '),
                            shipping_address: Object.entries(item_draft.shipping_address).map( ([key_item, value_item]) => value_item ).join(', '),
                            compare_draft   : [],
                            repeat_group    : '',
                            order_id        : null,
                            order_name      : null,
                            index           : all_draft.length
                        });
                    }
                }
                for (const item_draft of all_draft) {
                    
                    let compare_drafts = [...all_draft].reduce( (previous_item, current_item) => {
                        
                        if( item_draft.customer === current_item.customer && current_item.total_draft === item_draft.total_draft && current_item.skus === item_draft.skus && current_item.shipping_address === item_draft.shipping_address  ){
                            
                            previous_item.push( current_item.draft_id );
                        }
                        return previous_item;
                    }, []).join(', ');
                    
                    item_draft.compare_draft = compare_drafts;
                }
                for (const [index_compare, item_compare] of [...new Set(all_draft.map( (item) => item.compare_draft ))].entries()) {
                    
                    for (const item_repeat of all_draft.filter( (item) => item.compare_draft === item_compare && item.compare_draft != '' ) ) {
                        
                        all_draft[item_repeat.index].repeat_group = `repeat-group-draft-${ index_compare + 1 }`;
                    }
                }
                for (const item_draft of all_draft) {
                    
                    delete item_draft.customer;
                    delete item_draft.shipping_address;
                    delete item_draft.compare_draft;
                    delete item_draft.index;
                    delete item_draft.skus;
                }
                resolve(all_draft);
            }
        }
    });
};
async function extractProductImages( item_marketplace ){
    
    const api_marketplace   = shopify.init( item_marketplace.credentials );
    let shopify_result      = await shopify.executeQuery(api_marketplace, api_marketplace.product, api_marketplace.product.list);
    if( shopify_result.success && shopify_result.body.length > 0 ){
        
        shopify_result.body = h_array.sort( shopify_result.body, 'vendor' );
        let group_brands = [...new Set( shopify_result.body.map( (item) => item.vendor ) ) ];
        
        if (!fs.existsSync('./public/images/products')){
            
            fs.mkdirSync('./public/images/products');
            fs.mkdirSync('./public/images/products/brands');
            fs.mkdirSync('./public/images/products/brands/original');
            fs.mkdirSync('./public/images/products/brands/webp');
        }
        for (const [index_brand, item_brand] of group_brands.entries()) {
            
            let base_path_original  = `./public/images/products/brands/original/${ item_brand }`;
            let base_path_webp      = `./public/images/products/brands/webp/${ item_brand }`;
            
            if (!fs.existsSync(base_path_original)){
                
                fs.mkdirSync(base_path_original);
            }
            if (!fs.existsSync(base_path_webp)){
                
                fs.mkdirSync(base_path_webp);
            }
            
            for (const item_product of JSON.parse( JSON.stringify( shopify_result.body ) ).filter( (item) => item.vendor === item_brand && item_product.variants.length > 0 ) ) {
                
                let sku_parent = h_format.extractSKUParent(item_product.variants[0].sku);
                let path_product_original   = `${ base_path_original }/${ sku_parent.variant.width_pack ? sku_parent.variant.width_pack : sku_parent.variant.standard }`;
                let path_product_webp       = `${ base_path_webp }/${ sku_parent.variant.width_pack ? sku_parent.variant.width_pack : sku_parent.variant.standard }`;
                
                if (!fs.existsSync(path_product_original)){
                    
                    fs.mkdirSync(path_product_original);
                }
                if (!fs.existsSync(path_product_webp)){
                    
                    fs.mkdirSync(path_product_webp);
                }
                for (const item_iamge of item_product.images) {
                    
                    await axiosFile.get(item_iamge.src).then( (response) => {
                        
                        let new_file = item_iamge.src.split('/')[item_iamge.src.split('/').length - 1].split('?v=')[0].split('.');
                        
                        new_file.splice(-1);
                        
                        new_file = new_file.join('');
                        sharp( response.data )
                        .jpeg({ quality: 100 })
                        .toFile(`${ path_product_original }/${ new_file }.jpg`, (file_error, file_result) => {
                            
                            if( file_error ){
                                
                                console.log( file_error );
                            }
                        });
                        sharp( response.data )
                        .webp({ quality: 100 })
                        .toFile(`${ path_product_webp }/${ new_file }.webp`, (file_error, file_result) => {
                            
                            if( file_error ){
                                
                                console.log( file_error );
                            }
                        });
                    }).catch( (error) => {
                        
                        console.log( `axiosFile.get ${ item_iamge.src } ${ item_product.id }` );
                    });
                }
            }
            console.log( index_brand, group_brands.length - 1);
        }
    }
};
// =============================================================================
// TEST FUNCTIONS
// =============================================================================
async function test(){
    
    
};
// =============================================================================
// GENERAL FUNCTIONS
// =============================================================================
async function updateCentralToken(){
    
    await central.post.login().then( async (central_result) => {
        
        await backGeneralSettingService.update({ status: 'active' }, { app_central: { token: central_result.data.token } });
    });
};
async function syncCentralProducts(){
    
    await syncShopifyDataByMarketplace( processSyncCentralProducts );
};
// =============================================================================
// EXPORTS
// =============================================================================
module.exports = {
    audith:{
        audithProductVariantsRepeat,
        syncUpdateData
    },
    job:{
        customers:{
            syncCreateCustomers,
            syncUpdateCustomers,
            updateCountOrders
        },
        products: {
            syncBrands,
            syncProductCategories,
            syncCreateProducts,
            syncUpdateProducts,
            syncUpdateBestSellers,
            syncDeleteProducts
        },
        filters: {
            syncGeneralFilters
        },
        collections: { 
            syncCreateCollections,
            syncUpdateCollections
        },
        orders: {
            syncCreateOrders,
            syncUpdateOrders,
            syncBuyAgain,
            firstSyncShopifyOrder
        },
        shippings:{
            syncShippingGroups
        },
        preorders:{
            verifyStockPreorder
        },
        central:{
            updateCentralToken,
            syncCentralProducts
        },
    },
    general:{
        test
    }
};
