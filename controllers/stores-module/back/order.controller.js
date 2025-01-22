// =============================================================================
// PACKAGES
// =============================================================================
const moment                = require('moment');
const mongoose              = require('mongoose');
// =============================================================================
// CONFIGURATION
// =============================================================================
const config_credentials    = require('../../../config/credentials');
// =============================================================================
// HELPERS
// =============================================================================
const h_format              = require('../../../helpers/format');
const h_validation          = require('../../../helpers/validation');
const h_response            = require('../../../helpers/response');
const h_file                = require('../../../helpers/file');
const h_crud                = require('../../../helpers/crud');
const h_array               = require('../../../helpers/array');
const h_excel               = require('../../../helpers/excel');
const h_shopify             = require('../../../helpers/shopify');
// =============================================================================
// SERVICES
// =============================================================================
const {
    userService,
    orderService,
    orderLineItemService,
    shippingGroupService,
    cartService,
    shippingTaxService,
    shippingRateService,
    businessService,
    generalSettingService,
    productService,
    productBundleService,
    preorderBundleItemService,
    preorderBundleService,
    
    backCustomerService,
    backProductVariantService,
    backDraftOrderService,
    backMarketplaceService,
    backOrderService,
    backCartService,
    backProductService,
    backStorefrontService,
    backOrderLineItemService,
    agentProductBundleService,
    backPreorderService,
    backPreorderItemService,
    backShippingZoneService,
    backShippingTypeService,
    backShippingTaxService,
    backAffiliateService
} = require('../../../services/manager');
const shopify           = require('../../../services/marketplace/shopify');
const billing           = require('../../../services/2b-apps/billing');
const agent             = require('../../../services/2b-apps/agent');
const credentials = require('../../../config/credentials');
// =============================================================================
// SHOPIFY INSTANCE
// =============================================================================
const api_shopify 	    = shopify.init( config_credentials.shopify.shop_us );
// =============================================================================
// REST FUNCTIONS
// =============================================================================
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function create(req, res){
    
    try {
        
        let marketplace_result = await backMarketplaceService.findOne({ _id: req.auth.marketplace }, { credentials: 1 });
        if( marketplace_result.success && marketplace_result.body != null && req.body.shopify_draft_id ){
            
            let api_shopify = shopify.init( marketplace_result.body.credentials );
            let req_body    = {
                customer_id     : req.body.customer_id,
                user_id         : req.body.user_id,
                draft_id        : req.body.shopify_draft_id,
                coupon          : req.body.coupon,
                product_origin  : req.body.product_origin,
                note_attributes : req.body.note_attributes
            };
            
            let complete_draft_result = await completeDraftOrder(api_shopify, req_body, req.body.db_draft_id);
            if( complete_draft_result.success ){
                
                res.status(200).json( complete_draft_result );
            }
            else{
                
                console.log("======================================================================================");
                console.log( new Date(), "create", "completeDraftOrder", req_body.customer_id, complete_draft_result );
                res.status(400).send( complete_draft_result );
            }
        }
        else if( marketplace_result.success && marketplace_result.body != null ){
            
            req.body.business           = marketplace_result.body.order_origins.find( (item) => item.values.indexOf( req.auth.application_type.replace('app-', '') ) >= 0 )?.business || null;
            let api_shopify             = shopify.init( marketplace_result.body.credentials );
            let shopify_order_result    = await createShopifyOrder(api_shopify, req.auth, req.body);
            
            if( shopify_order_result.success ){
                res.status(200).json( shopify_order_result );
            }
            else{
                
                console.log("======================================================================================");
                console.log( new Date(), "create", "createShopifyOrder", req.body.customer_id, shopify_order_result );
                res.status(400).send( shopify_order_result );
            }
        }
        
    } catch (process_error) {
        
        console.log("======================================================================================");
        console.log( new Date(), "create", "create", req.body.customer_id, process_error );
        res.status(400).send( h_response.request( false, { status: "order-not-created", step_order: "draft-not-created", order_error: { error_db: process_error } }, 400, "Error: Order Create", "Shopify Order not Created, Draft Order not created, please contact your Sales Agent" ) );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function createDBOrderShopify(req, res){
    
    try {
        res.json({ result: req.body?.id });
        let marketplace_result = await backMarketplaceService.findOne({ handle: req.query.marketplace });
        
        if( marketplace_result.success && marketplace_result.body != null ){
            
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
            await h_shopify.data_base.orders.processCreateOrder( marketplace_result.body, { success: true, body: [req.body] }, db_servieces );
        }
        else{
            
            console.log("======================================================================================");
            console.log( new Date(), "createDBOrderShopify", "backMarketplaceService.findOne", req.query.marketplace, marketplace_result );
        }
    } catch (process_error) {
        
        console.log("======================================================================================");
        console.log( new Date(), "createDBOrderShopify", "createDBOrderShopify", req.body.id, process_error );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function createDraftOrder(req, res){
    
    try {
        
        let marketplace_result = await backMarketplaceService.findOne({ _id: req.auth.marketplace }, { credentials: 1, order_origins: 1 });
        if( marketplace_result.success && marketplace_result.body != null ){
            
            req.body.business       = marketplace_result.body.order_origins.find( (item) => item.values.indexOf( req.auth.application_type.replace('app-', '') ) >= 0 )?.business || null;
            let api_shopify         = shopify.init( marketplace_result.body.credentials );
            let draft_order_result  = await createDraftOrderDBShopify(api_shopify, req.auth, req.body);
            
            if( draft_order_result.success ){
                
                res.status(200).json( draft_order_result );
            }
            else{
                
                console.log("======================================================================================");
                console.log( new Date(), "createDraftOrder", "createDraftOrder", draft_order_result );
                res.status(400).send( draft_order_result );
            }
        }
        else{
            
            console.log("======================================================================================");
            console.log( new Date(), "createDraftOrder", "backMarketplaceService.findOne", req.auth.marketplace, marketplace_result );
            res.status(400).send( h_response.request( false, { status: "draft-not-created", step_order: "draft-not-created", order_error: { error_db: marketplace_result } }, 400, "Error: Draft Order Create", "Draft Order not Created" ) );
        }
    } catch (process_error) {
        
        console.log("======================================================================================");
        console.log( new Date(), "createDraftOrder", "createDraftOrder", process_error );
        res.status(400).send( h_response.request( false, { status: "draft-not-created", step_order: "draft-not-created", order_error: { error_db: process_error } }, 400, "Error: Draft Order Create", "Draft Order not Created" ) );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function completeDraftOrderShopify(req, res){
    
    try {
        let req_body = {
            user_id         : req.body.user_id || null,
            customer_id     : req.body.customer_id || null,
            coupon          : req.body.coupon,
            draft_id        : req.body.draft_id,
            product_origin  : req.body.product_origin,
            note_attributes : req.body.note_attributes
        };
        let db_draft_id = req_body.note_attributes.find( (item) => item.name === "draft-order-db" )?.value || null;
        
        let marketplace_result = await backMarketplaceService.findOne({ _id: req.auth.marketplace }, { credentials: 1 });
        let draft_order_result = await backDraftOrderService.find(db_draft_id ? { _id: db_draft_id } : { draft_id: req_body.draft_id });
        
        if( marketplace_result.success && marketplace_result.body != null && draft_order_result.success && draft_order_result.body != null ){
            
            let api_shopify             = shopify.init( marketplace_result.body.credentials );
            let complete_draft_result   = await completeDraftOrder(api_shopify, req_body, db_draft_id);
            if( complete_draft_result.success ){
                
                res.status(200).json( complete_draft_result );
            }
            else{
                
                console.log("======================================================================================");
                console.log( new Date(), "completeDraftOrderShopify", "completeDraftOrder", req_body.customer_id, complete_draft_result );
                res.status(400).send( complete_draft_result );
            }
        }
        else{
            
            let process_error = [ marketplace_result, draft_order_result ].filter( (item) => !item.success );
            console.log("======================================================================================");
            console.log( new Date(), "completeDraftOrderShopify", "completeDraftOrder", req_body.customer_id, process_error );
            res.status(400).send( h_response.request( false, { status: "draft-not-completed", step_order: "draft-not-completed", order_error: { error_db: process_error } }, 400, "Error: Draft Order", "Draft Order not found" ) );
        }
    } catch (process_error) {
        
        console.log("======================================================================================");
        console.log( new Date(), "completeDraftOrderShopify", "completeDraftOrder", req.body.customer_id, process_error );
        res.status(400).send( h_response.request( false, { status: "draft-not-completed", step_order: "draft-not-completed", order_error: { error_db: process_error } }, 400, "Error: Draft Order Complete", "Draft Order not Completed" ) );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function find(req, res) {
    
    try {
        if( !req.body.query ){
            
            req.body.query = h_format.findQuery( req.params.id_name, 'shopify_id', 'name' );
        }
        await h_crud.findDocument( 'Order', backOrderService, req.body.query, req.body.fields, req.body.options ).then( (document_result) => {
            
            res.status(200).json( document_result );
        }).catch( (document_error) => {
            
            res.status(400).send( document_error );
        });
    } catch (process_error) {
        
        res.status(400).send( h_response.request( false, process_error, 400, "Error: Order Find", "Order not found" ) );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function list(req, res) {
    
    try {
        if( !req.body.query ){
            
            let min_date = req.body.min_date ? h_format.dbDate( moment( req.body.min_date ), true ) : h_format.dbDate( moment( new Date('2015-01-01T00:00:00') ), true );
            let max_date = req.body.max_date ? h_format.dbDate( moment( req.body.max_date ), false ) : h_format.dbDate( moment(), false );
            
            let query_orders = {
                $and: [
                    { created_at: { $gte: new Date( min_date ) } },
                    { created_at: { $lte: new Date( max_date ) } }
                ]
            };
            if( req.auth.user.customer ){
                
                query_orders.$and.push( { customer: req.auth.user.customer._id.toString() } );
            }
            let regex_search = req.body.search ? req.body.search : '';
            
            if( regex_search != '' ) {
                
                regex_search = { $regex: regex_search, $options: 'i' };
                query_orders.$and.push({ 
                    $and: [
                        { is_adjustment: false },
                        {
                            $or: [
                                { name: regex_search }, 
                                { 
                                    shipping_address: { 
                                        $elemMatch: { 
                                            first_name: regex_search,
                                            last_name:  regex_search, 
                                            company:    regex_search, 
                                            address_1:  regex_search, 
                                            address_2:  regex_search, 
                                            country:    regex_search, 
                                            state:      regex_search, 
                                            city:       regex_search, 
                                            zip:        regex_search, 
                                        } 
                                    } 
                                }, 
                                { 
                                    billing_address: { 
                                        $elemMatch: { 
                                            first_name: regex_search,
                                            last_name:  regex_search, 
                                            company:    regex_search, 
                                            address_1:  regex_search, 
                                            address_2:  regex_search, 
                                            country:    regex_search, 
                                            state:      regex_search, 
                                            city:       regex_search, 
                                            zip:        regex_search, 
                                        } 
                                    } 
                                }, 
                                { 
                                    skus:  { $elemMatch: regex_search }
                                }, 
                                { 
                                    brands:  { $elemMatch: { name: regex_search } }
                                }, 
                                { 
                                    variants: { $elemMatch: regex_search }
                                }
                            ]
                        }
                    ]
                });
            }
            req.body.query = query_orders;
        }
        
        await h_crud.listDocuments( 'Order', backOrderService, req.body.query, req.body.fields, req.body.options ).then( (document_result) => {
            
            res.status(200).json( document_result );
        }).catch( (document_error) => {
            
            res.status(400).send( document_error );
        });
    } catch (process_error) {
        
        res.status(400).send( h_response.request( false, process_error, 400, "Error: Order List", "Order List not found" ) );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function validCheckout(req, res){
    
    try {
        
        let marketplace_result  = await backMarketplaceService.findOne({ _id: req.auth.marketplace }, { credentials: 1, order_origins: 1 });
        let valid_checkout      = await validDataCheckout( req.auth, req.body.checkout, req.query );
        
        if( marketplace_result.success && marketplace_result.body != null && valid_checkout.success ){
            
            valid_checkout.body.data.details        = valid_checkout.body.details;
            valid_checkout.body                     = valid_checkout.body.data;
            valid_checkout.body.details.draft_order = true;
            
            req.body.draft_order.business   = marketplace_result.body.order_origins.find( (item) => item.values.indexOf( req.auth.application_type.replace('app-', '') ) >= 0 )?.business || null;
            let api_shopify                 = shopify.init( marketplace_result.body.credentials );
            let draft_order_result          = await createDraftOrderDBShopify(api_shopify, req.auth, req.body.draft_order);
            
            if( draft_order_result.success ){
                
                valid_checkout.body.draft_order         = draft_order_result.body;
                
                res.status(200).json( valid_checkout );
            }
            else{
                
                valid_checkout.body.details.draft_order = false;
                valid_checkout.body.error               = draft_order_result;
                
                valid_checkout.message = `${ valid_checkout.message }${ errorMessageDetails( valid_checkout.body.details ) }`;
                res.status(400).send( valid_checkout );
            }
        }
        else if( !valid_checkout.success ){
            
            valid_checkout.message = `${ valid_checkout.message }${ errorMessageDetails( valid_checkout.body.details ) }`;
            res.status(400).send( valid_checkout );
        }
        else{
            
            let valid_checkout = { 
                details : {
                    draft_order     : false,
                    customer        : false,
                    products        : false,
                    rates           : false,
                    country_taxes   : false,
                    state_taxes     : false,
                    shipping_address: false,
                    billing_address : false
                }, 
                general : false,
                data    : null,
                error   : marketplace_result
            };
            res.status(400).send( h_response.request( false, valid_checkout, 400, 'Error: Validate Checkout', `Process Validate Checkout not successful${ errorMessageDetails( valid_checkout.details ) }` ) );
        }
    } catch (process_error) {
        
        let valid_checkout = { 
            details : {
                draft_order     : false,
                customer        : false,
                products        : false,
                rates           : false,
                country_taxes   : false,
                state_taxes     : false,
                shipping_address: false,
                billing_address : false
            }, 
            general : false,
            data    : null,
            error   : process_error
        };
        res.status(400).send( h_response.request( false, valid_checkout, 400, 'Error: Validate Checkout', `Process Validate Checkout not successful${ errorMessageDetails( valid_checkout.details ) }` ) );
    }
    
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function shippingOptions(req, res){
    
    try {
        
        let valid_shipping_options = await validShippingOptions( req.auth, req.body, req.query.affiliate, true );
        
        if( valid_shipping_options.success ){
            
            valid_shipping_options.title    = "Success: Shipping Options";
            valid_shipping_options.message  = "Shipping Options found";
            valid_shipping_options.body.data.details = valid_shipping_options.body.details;
            valid_shipping_options.body = valid_shipping_options.body.data;
            res.status(200).json( valid_shipping_options );
        }
        else{
            
            valid_shipping_options.message = `${ valid_shipping_options.message }${ errorMessageDetails( valid_shipping_options.body.details ) }`;
            res.status(400).send( valid_shipping_options );
        }
    } catch (process_error) {
        
        let valid_shipping_options = { 
            details : {
                customer        : false,
                products        : false,
                rates           : false,
                country_taxes   : false,
                state_taxes     : false
            }, 
            general : false,
            data    : null,
            error   : process_error
        };
        res.status(400).send( h_response.request( false, valid_shipping_options, 400, 'Error: Validation Shipping Options', `Process Validation Shipping Options not successful${ errorMessageDetails( valid_shipping_options.details ) }` ) );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function updateInvoiceItems(req, res){
    
    await orderService.update({ _id: req.params.id }, { invoice_items: JSON.parse( req.body.invoice_items ) }).then( (order_updated) => {
        
        res.status(200).json( h_response.request( true, order_updated.body, 200, "Success: Order Update", "Order Updated Successfully" ) );
    }).catch( (order_error) => {
        
        res.status(400).send( h_response.request( false, order_error, 400, "Error: Order Update", "Order not Updated" ) );
    });
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function createDBOrderDropshipping( req, res ){
    
    // let shopify_data = JSON.parse( req.body.order );
    
    // await backCustomerService.findOne({ shopify_id: shopify_data.customer.id }).then( async (customer_result) => {
        
    //     await businessService.find({ type: "main", status: "active" }).then( async (business_result) => {
        
    //         await createDBOrder( shopify_data, customer_result.body, null, business_result.body ).then( async (order_result) =>{
        
    //             res.status(200).json( order_result );
    
    //         }).catch( async (order_error) => {
        
    //             console.log("======================================================================================");
    //             console.log("order_error", order_error);
    //             res.status(400).send( order_error );
    //         });
    //     }).catch( (business_error) => {
        
    //         res.status(400).send( h_response.request( false, business_error, 400, "Error: Order Dropshipping", "Business not found" ) );
    //     });
    // }).catch( (customer_error) => {
        
    //     res.status(400).send( h_response.request( false, customer_error, 400, "Error: Order Dropshipping", "Customer not found" ) );
    // });
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function downloadTransactionFile(req, res){
    
    await billing.get.listTransactions(req.auth, req.query, req.auth.user.customer._id).then( async (billing_result) => {
        
        let data_file = [{
            title: `${ req.auth.user.customer.full_name } - Transaction List`,
            max_num_columns: 6,
            sheet_name: `${ req.auth.user.customer.full_name } - Transaction List`,
            body_data: [],
            cols: [
                { wch: 20 },
                { wch: 30 },
                { wch: 20 },
                { wch: 20 },
                { wch: 20 },
                { wch: 20 },
            ]
        }];
        data_file[0].body_data = billing_result.body.body.map( (item) => {
            
            let reference       = "";
            let document_date   = moment(item.document_date.toString().split(".")[0]).format('L');
            
            if( item.document === 'Invoice' ){
                
                reference = item.invoice?.order ? item.invoice.order.name : "";
            }
            else if( item.document === "Payment" ){
                
                reference = item.payment.note;
            }
            else if( item.document === "CreditNote" ){
                
                reference = item.creditNote.order ? item.creditNote.order.name : item.creditNote.reference;
            }
            let status = item.status_name ? item.status_name : "";
            
            return { 
                row: { 
                    columns: [ 
                        { name: "document_date"     , value: document_date      , index_column: 0, num_columns: 1, num_rows: 1 }, 
                        { name: "reference"         , value: reference          , index_column: 1, num_columns: 1, num_rows: 1 }, 
                        { name: "document"          , value: item.document      , index_column: 2, num_columns: 1, num_rows: 1 }, 
                        { name: "amount"            , value: item.amount        , index_column: 3, num_columns: 1, num_rows: 1 }, 
                        { name: "balance"           , value: item.balance       , index_column: 4, num_columns: 1, num_rows: 1 } , 
                        { name: "status"            , value: status             , index_column: 5, num_columns: 1, num_rows: 1 } 
                    ] 
                } 
            }
        });
        await h_excel.createFile( `Transaction List - ${ req.query.from }-${ req.query.to }`, `/documents/templates/excel/format-transaction-list.xlsx`, data_file, null, 2, formatBodyTransactionFile ).then( (format_file) => {
            
            res.status(200).json( h_response.request( true, format_file, 200, "Success: Download File", `${ req.auth.user.customer.full_name } - Transaction List Downloaded` ) );
        }).catch( (format_file_error) => {
            
            res.status(400).send( h_response.request( false, format_file_error, 400, "Error: Format", "Transactions List File format not validated" ) );
        });
        
    }).catch( (billing_error) => {
        
        res.status(400).send( h_response.request( false, billing_error, 400, "Error: Format", "Transactions List File format not validated" ) );
        
    });
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function deleteTransactionFile(req, res){
    
    await utils.files.deleteFile( `./public/downloads/`, req.body.url_file.replace("/downloads/", "").split("?")[0], 'xlsx').then( (delete_file) => {
        
        res.status(200).json( delete_file );
    }).catch( (delete_file_error) => {
        
        res.status(400).send( delete_file_error );
    });
};
// =============================================================================
// GENERAL FUNCTIONS
// =============================================================================
/**
* 
* @param {*} req 
* @param {*} shipping_data 
* @param {*} coupon 
* @returns 
*/
async function getShippingRatesTaxes(exist_customer, req_auth, shipping_data, coupon){
    
    try {
        let line_items_data = shipping_data.line_items.reduce( (previous_item, current_item, current_index) => { 
            if( current_item.brand != null ) { 
                previous_item.brands.push( current_item.brand?.handle );
            }
            if( current_item.product_type != null ) {
                previous_item.product_types.push( current_item.product_type?.handle );
            }
            if( current_item.product_category != null ) {
                previous_item.product_categories.push( current_item.product_category?.handle );
            }
            previous_item.product_variants.push( current_item.variant_id );
            
            if( current_index === shipping_data.line_items.length - 1 ){
                
                previous_item.brands = [...new Set( previous_item.brands )];
                previous_item.product_types = [...new Set( previous_item.product_types )];
                previous_item.product_categories = [...new Set( previous_item.product_categories )];
            }
            return previous_item;
        }, { brands: [], prouct_types: [], product_categories: [], product_variants: [] } )
        let find_query_zones = {
            marketplace: req_auth.marketplace,
            $or: [
                { country_states: { $elemMatch: { country_code: shipping_data.country_code, state_code: shipping_data.state_code } } },
                { country_zip_codes: { $elemMatch: { country_code: shipping_data.country_code, zip_code: shipping_data.zip_code } } }
            ]
        };
        if( line_items_data.brands.length > 0 ){
            
            find_query_zones.$or.push({ brands: { $in: line_items_data.brands } });
        }
        if( line_items_data.product_types.length > 0 ){
            
            find_query_zones.$or.push({ product_types: { $in: line_items_data.product_types } });
        }
        if( line_items_data.product_categories.length > 0 ){
            
            find_query_zones.$or.push({ product_categories: { $in: line_items_data.product_categories } });
        }
        if( line_items_data.product_variants.length > 0 ){
            
            find_query_zones.$or.push({ product_variants: { $in: line_items_data.product_variants } });
        }
        let find_query_taxes = {
            marketplace: req_auth.marketplace,
            $or: [ 
                { $and: [ { country_code: shipping_data.country_code }, { state_code: null } ] }, 
                { $and: [ { country_code: shipping_data.country_code }, { state_code: shipping_data.state_code } ] } 
            ]
        };
        let shipping_zone_result    = await backShippingZoneService.find(find_query_zones);
        let shipping_tax_result     = ( ( exist_customer && req_auth.user.customer.tax_exempt === false ) || ['storefront', 'app-storefront'].includes( req_auth.application_type ) ) ? await backShippingTaxService.find(find_query_taxes) : { success: true, body: [] };
        let shipping_type_result    = await backShippingTypeService.find({ marketplace: req_auth.marketplace });
        
        if( shipping_zone_result.success && shipping_zone_result.body.length > 0 && shipping_tax_result.success && shipping_type_result.success && shipping_type_result.body.length > 0 ){
            
            let shipping_rates  = [];
            let shipping_taxes  = {
                country : null,
                state   : null
            };
            if( ['wholesale', 'app-wholesale'].includes(req_auth.application_type) && shipping_data.country_code != null && shipping_data.product_origin && shipping_data.product_origin.indexOf('pre-order') >= 0 && shipping_data.type_checkout === 'advance' ){
                
                shipping_rates = [
                    {        
                        _id             : "191919191919191919191919",
                        shipping_type   : {
                            name    : 'No Need Shipping',
                            handle  : 'no-need-shipping',
                            category: 'standard'
                        },
                        priority        : 1,
                        price           : 0,
                        rate_type       : "standard",
                        need_payment    : true, 
                    }
                ];
            }
            else if( ['wholesale', 'app-wholesale'].includes(req_auth.application_type) && shipping_data.country_code != null && coupon != null && coupon.typeCoupon === 'free shipping' ){
                
                shipping_rates = [
                    {
                        _id             : "191919191919191919191919",
                        shipping_type   : {
                            name    : 'Free Shipping',
                            handle  : 'free-shipping',
                            category: 'standard'
                        },  
                        priority        : 1,
                        price           : 0,
                        rate_type       : "standard", 
                        need_payment    : true, 
                    }
                ];
            }
            else if( ['wholesale', 'app-wholesale'].includes(req_auth.application_type) && exist_customer && shipping_data.country_code != null && req_auth.user.customer.special_shippings.length > 0 ){
                
                shipping_rates = req_auth.user.customer.special_shippings.map( (item_shipping) => {
                    
                    return {
                        _id             : "191919191919191919191919",
                        shipping_type   : {
                            name    : item_shipping.name,
                            handle  : h_format.slug( item_shipping.name ),
                            category: item_shipping.category
                        },  
                        priority        : 1,
                        price           : item_shipping.price,
                        rate_type       : "standard", 
                        need_payment    : true, 
                    }
                });
            }
            else if ( shipping_data.country_code != null ){
                
                if( ['wholesale', 'app-wholesale'].includes(req_auth.application_type) ){
                    
                    for (const item_zone of shipping_zone_result.body) {
                        
                        let total_weight    = 0;
                        let subtotal_order  = 0;
                        let rate_priority   = 3; 
                        if( item_zone.country_zip_codes.some( (item) => item.country_code === shipping_data.country_code && item.zip_code === shipping_data.zip_code ) ){
                            
                            rate_priority = 3;
                        }
                        else if( item_zone.country_states.some( (item) => item.country_code === shipping_data.country_code && shipping_data.state_code != null && item.state_code === shipping_data.state_code ) ){
                            
                            rate_priority = 2;
                        }
                        else if( item_zone.country_states.some( (item) => item.country_code === shipping_data.country_code && item.state_code === null ) ){
                            
                            rate_priority = 1;
                        }
                        shipping_data.line_items.reduce( (previous_item, current_item, current_index) => {
                            
                            if( item_zone.general_group || ( item_zone.brands.indexOf( current_item.brand.handle ) >= 0 || item_zone.product_categories.indexOf( current_item.product_category.handle ) >= 0 || item_zone.product_variants.indexOf( current_item.variant_id ) >= 0 ) ){
                                
                                total_weight     += ( current_item.weight * current_item.quantity );
                                subtotal_order   += ( current_item.price_total * current_item.quantity );
                                
                                previous_item.push( current_item );
                            }
                            if( current_index === shipping_data.line_items.length - 1 ){
                                
                                if( previous_item.length > 0 || total_weight > 0 || subtotal_order > 0 ){
                                    
                                    let max_price = 0;
                                    shipping_rates.push( item_zone.standard_rates.reduce( (previous_item_rate, current_item_rate) => {
                                        
                                        if( current_item_rate.min_weight <= total_weight ){
                                            
                                            current_item_rate.priority       = rate_priority;
                                            current_item_rate.shipping_type  = shipping_type_result.body[current_item_rate.shipping_type.toString()];
                                            
                                            max_price = current_item_rate.price > max_price ? current_item_rate.price : max_price;
                                            previous_item_rate.push({
                                                _id             : current_item_rate._id,
                                                shipping_type   : current_item_rate.shipping_type,  
                                                priority        : current_item_rate.priority,
                                                price           : current_item_rate.price,
                                                rate_type       : current_item_rate.rate_type, 
                                                need_payment    : current_item_rate.need_payment, 
                                            });
                                        }
                                        return previous_item_rate;
                                    }, []) );
                                    shipping_rates.push( item_zone.variant_rates.reduce( (previous_item_rate, current_item_rate) => {
                                        
                                        if( current_item_rate.min_total_order <= subtotal_order ){
                                            
                                            current_item_rate.priority       = rate_priority;
                                            current_item_rate.shipping_type  = shipping_type_result.body[current_item_rate.shipping_type.toString()];
                                            if( current_item_rate.effect_on_price === "add" ){
                                                
                                                current_item_rate.price = ( max_price + current_item_rate.price );
                                            }
                                            else if( current_item_rate.effect_on_price === 'sustrac' ){
                                                
                                                current_item_rate.price = ( max_price - current_item_rate.price );
                                            }
                                            previous_item_rate.push({
                                                _id             : current_item_rate._id,
                                                shipping_type   : current_item_rate.shipping_type,  
                                                priority        : current_item_rate.priority,
                                                price           : current_item_rate.price,
                                                rate_type       : current_item_rate.rate_type, 
                                                need_payment    : current_item_rate.need_payment, 
                                            });
                                        }
                                        return previous_item_rate;
                                    }, []) );
                                }
                            }
                            return previous_item;
                        }, []);
                    }
                    
                    shipping_rates = h_array.sort(shipping_rates.flat(), 'shipping_type.handle').reduce( (previous_item, current_item) => {
                        
                        if( previous_item.length === 0 || ( previous_item.length > 0 && previous_item[previous_item.length - 1].shipping_type.handle != current_item.shipping_type.handle ) ){
                            
                            previous_item.push( current_item );
                        }
                        else if( previous_item.length > 0 && previous_item[previous_item.length - 1].shipping_type.handle === current_item.shipping_type.handle && previous_item[previous_item.length - 1].priority <= current_item.priority ){
                            
                            previous_item[previous_item.length - 1] = current_item.price >= previous_item[previous_item.length - 1].price ? current_item : previous_item[previous_item.length - 1];
                        }
                        return previous_item;
                    }, []);
                }
                else if( ['storefront', 'app-storefront'].includes(req_auth.application_type) ){
                    
                    let subtotal_order = shipping_data.line_items.reduce( (previous_item, current_item) => {
                        
                        previous_item   += ( current_item.price_total * current_item.quantity );
                        return previous_item;
                    });
                    shipping_rates = [
                        {
                            _id             : "191919191919191919191919",
                            shipping_type   : {
                                name    : subtotal_order < 100 ? 'Standard Shipping' : 'Free Shipping',
                                handle  : subtotal_order < 100 ? 'standard-shipping' : 'free-shipping',
                                category: 'standard'
                            },  
                            priority        : 1,
                            price           : subtotal_order < 100 ? 12 : 0,
                            rate_type       : "standard", 
                            need_payment    : true, 
                        }
                    ];
                }
                shipping_type_result.body = shipping_type_result.body.reduce( (previous_item, current_item) => {
                    
                    previous_item[current_item._id.toString()] = {
                        name    : current_item.name,
                        handle  : current_item.handle,
                        category: current_item.category
                    };
                    return previous_item;
                }, {});
                
                for (const item_tax of shipping_tax_result.body) {
                    
                    if( ['storefront', 'app-storefront'].includes(req_auth.application_type) || ( ['wholesale', 'app-wholesale'].includes(req_auth.application_type) && ['FL'].includes(shipping_data.state_code) ) ){
                        
                        shipping_taxes.state    = ( ( shipping_taxes.state === null && item_tax.state_code != null ) || ( shipping_taxes.state != null && item_tax.state_code != null && item_tax.percentage > shipping_taxes.state?.percentage ) ) ? item_tax : shipping_taxes.state;
                        shipping_taxes.country  = ( ( shipping_taxes.country === null && item_tax.state_code === null ) || ( shipping_taxes.country != null && item_tax.state_code === null && item_tax.percentage > shipping_taxes.country?.percentage ) ) ? item_tax : shipping_taxes.country;
                    }
                }
                shipping_taxes.country  = shipping_taxes.country != null ? {
                    _id         : shipping_taxes.country._id,
                    country_code: shipping_taxes.country.country_code,
                    percentage  : shipping_taxes.country.percentage,
                    name        : shipping_taxes.country.name,
                    handle      : shipping_taxes.country.handle,
                    type_tax    : shipping_taxes.country.type_tax
                } : shipping_taxes.country;
                
                shipping_taxes.state    = shipping_taxes.state != null ? {
                    _id         : shipping_taxes.state._id,
                    country_code: shipping_taxes.state.country_code,
                    state_code  : shipping_taxes.state.state_code,
                    percentage  : shipping_taxes.state.percentage,
                    name        : shipping_taxes.state.name,
                    handle      : shipping_taxes.state.handle,
                    type_tax    : shipping_taxes.state.type_tax
                } : shipping_taxes.state;
            }
            
            if( shipping_rates.length > 0 ){
                
                return h_response.request( true, { products: shipping_data.line_items, rates: shipping_rates, taxes: shipping_taxes, coupon: coupon }, 200, "Success: Calculate Shipping", "Shipping Rates found" );
            }
            else{
                
                return h_response.request( false, { products: shipping_data.line_items, rates: shipping_rates, taxes: shipping_taxes, coupon: coupon }, 400, "Error: Calculate Shipping", "Shipping Rates not found" );
            }
        }
        else{
            
            console.log( shipping_zone_result );
            let process_error = [ shipping_zone_result, shipping_tax_result, shipping_type_result ].filter( (item) => !item.success );
            
            return h_response.request( false, process_error, 400, 'Error: Calculate Shipping', 'Process Calculate Shipping failed');
        }
    } catch (process_error) {
        
        return h_response.request( false, process_error, 400, 'Error: Calculate Shipping', 'Process Calculate Shipping failed');
    }
};
/**
* 
* @param {*} req_auth 
* @param {*} data_shipping 
* @param {*} affiliate_code 
* @param {*} new_rates 
* @returns 
*/
async function validShippingOptions( req_auth, data_shipping, affiliate_code, new_rates = false ){
    
    let valid_shipping_options = { 
        details : {
            customer        : true,
            products        : true,
            rates           : true,
            country_taxes   : true,
            state_taxes     : true
        }, 
        general : true,
        data    : null,
        error   : null
    };
    try {
        let exist_customer  = ( req_auth.token.is_app && req_auth.user.customer ) || ( !req_auth.token.is_app && req_auth.user.customer );
        let shipping_data   = {
            line_items  : data_shipping.shipping_info.products,
            country_code: data_shipping.shipping_address.country_code,
            state_code  : data_shipping.shipping_address.state_code,
            zip_code    : data_shipping.shipping_address.zip_code
        };
        let order_data      = {
            product_origin  : data_shipping.product_origin,
            type_checkout   : data_shipping.type_checkout,
            shipping_info   : data_shipping.shipping_info,
            coupon          : null
        };
        let shipping_info   = null;
        
        if( ( exist_customer || ['storefront', 'app-storefront'].includes( req_auth.application_type ) ) && ( ['cart', 'save-later'].includes( order_data.product_origin ) || ( order_data.product_origin.indexOf('pre-order') >= 0 && order_data.type_checkout === 'complete' ) ) ){
            
            let cart_result         = { success: true, body: { products: [], save_later: [], coupon: null } };
            if( exist_customer ){
                
                cart_result = await backCartService.findOne( req_auth.token.is_app ? { customer: req_auth.user.customer._id.toString() } : { user: req_auth.user._id.toString() } );
            }
            let affiliate_result    = await h_format.affiliateDiscounts( req_auth, affiliate_code, backAffiliateService );
            
            if( cart_result.success && cart_result.body != null && affiliate_result.success ){
                
                let cart_products   = ( exist_customer && ['cart', 'save-later'].includes( order_data.product_origin ) ) ? h_validation.evalArray( cart_result.body?.products ) : order_data.shipping_info.products;
                let cart_save_later = order_data.product_origin === 'save-later' ? h_validation.evalArray( cart_result.body?.save_later ) : [];
                let cart_coupon     = h_validation.evalObject( cart_result.body?.coupon, null );
                
                let id_products = h_array.sort( cart_products.concat( cart_save_later ), 'product_id' ).reduce( (previous_item, current_item) =>{ 
                    
                    if( previous_item.length === 0 || previous_item[previous_item.length - 1] != current_item.product_id ){ 
                        
                        previous_item.push( current_item.product_id ); 
                    } 
                    return previous_item; 
                }, []);
                
                let product_result = await backProductService.find({ shopify_id: { $in: id_products }, status: 'active', status_created: 'active' });
                
                if( product_result.success ){
                    
                    if( cart_coupon && ( ( cart_coupon?.limitTimes > 0 && cart_coupon?.usedTimes === cart_coupon?.limitTimes ) || ( cart_coupon?.expireDate != null && cart_coupon?.expireDate < new Date() ) ) ){
                        
                        cart_coupon = null;
                    }
                    let data_cart       = { 
                        affiliate       : affiliate_result.body, 
                        brand_discounts : req_auth.discounts, 
                        coupon          : cart_coupon, 
                        db_products     : product_result.body, 
                        db_cart         : cart_products, 
                        db_save_later   : cart_save_later 
                    };
                    let format_cart     = h_format.cartObject( req_auth.application_type, [], data_cart );
                    
                    shipping_data.line_items    = order_data.product_origin === 'save-later' ? format_cart.body.save_later.products.front_end : format_cart.body.cart.products.front_end;
                    order_data.coupon           = format_cart.body.coupon;
                    shipping_info               = await getShippingRatesTaxes( exist_customer, req_auth, shipping_data, order_data.coupon );
                    
                    if( shipping_info.success ){
                        
                        if( shipping_info.body.products.length === order_data.shipping_info.products.length ){
                            
                            order_data.shipping_info.products       = h_array.sort( order_data.shipping_info.products, 'variant_id' );
                            valid_shipping_options.details.products = h_array.sort( shipping_info.body.products, 'variant_id' ).reduce( (previous_item, current_item, current_index) => {
                                
                                let exist_product = order_data.shipping_info.products[current_index];
                                if( previous_item ){
                                    
                                    previous_item = ( exist_product && exist_product?.variant_id === current_item.variant_id && current_item.quantity === exist_product?.quantity && current_item.price_total === exist_product?.price_total );
                                }
                                return previous_item;
                            }, true );
                            if( new_rates ){
                                
                                valid_shipping_options.details.rates= {
                                    valid   : true,
                                    values  : []
                                };
                                order_data.shipping_info.rates      = h_array.sort( shipping_info.body.rates, 'price' );
                            }
                            else{
                                
                                valid_shipping_options.details.rates = order_data.shipping_info.rates.reduce( (previous_item, current_item, current_index, self_array) => {
                                    
                                    let exist_rate = shipping_info.body.rates.find( (item) => item.shipping_type.handle === current_item.shipping_type.handle && item.shipping_type.category === current_item.shipping_type.category && item.price === current_item.price );
                                    
                                    if( exist_rate ){
                                        
                                        previous_item.values.push( exist_rate );
                                    }
                                    if( current_index === self_array.length - 1 ){
                                        
                                        previous_item.valid = ( previous_item.values.length === self_array.length );
                                    }
                                    return previous_item;
                                }, { valid: true, values: [] } );
                            }
                            valid_shipping_options.details.rates    = valid_shipping_options.details.rates.valid;
                            if( new_rates ){
                                
                                order_data.shipping_info.taxes = shipping_info.body.taxes;
                            }
                            else{
                                
                                valid_shipping_options.details.country_taxes  = ( ( shipping_info.body.taxes.country === null && order_data.shipping_info.taxes.country === null ) || ( shipping_info.body.taxes.country != null && order_data.shipping_info.taxes.country != null && shipping_info.body.taxes.country.percentage === order_data.shipping_info.taxes.country.percentage ) );
                                valid_shipping_options.details.state_taxes    = ( ( shipping_info.body.taxes.state === null && order_data.shipping_info.taxes.state === null ) || ( shipping_info.body.taxes.state != null && order_data.shipping_info.taxes.state != null && shipping_info.body.taxes.state.percentage === order_data.shipping_info.taxes.state.percentage && shipping_info.body.taxes.state.type === order_data.shipping_info.taxes.state.type ) );
                            }
                            valid_shipping_options.data = order_data;
                            
                            if( !( valid_shipping_options.details.products && valid_shipping_options.details.rates && valid_shipping_options.details.country_taxes && valid_shipping_options.details.state_taxes ) ){
                                
                                valid_shipping_options.data.shipping_info = shipping_info.body;
                            }
                        }
                        else{
                            
                            valid_shipping_options.details.products = false;
                        }
                    }
                    else{
                        
                        valid_shipping_options.details.products       = false;
                        valid_shipping_options.details.rates          = false;
                        valid_shipping_options.details.country_taxes  = false;
                        valid_shipping_options.details.state_taxes    = false;
                        
                        valid_shipping_options.error = shipping_info;
                    }
                }
                else{
                    
                    valid_shipping_options.details.products = false;
                    
                    valid_shipping_options.error = product_result;
                }
            }
            else if( !affiliate_result.success ){
                
                valid_shipping_options.details.products = false;
                
                valid_shipping_options.error = h_response.request( false, affiliate_result, 400, 'Error: Cart find', 'Affiliate not found' );
            }
            else{
                
                valid_shipping_options.details.products = false;
                
                valid_shipping_options.error = cart_result;
            }
        }
        else if( ( exist_customer || ['storefront', 'app-storefront'].includes( req_auth.application_type ) ) && order_data.product_origin.indexOf('pre-order') >= 0 && order_data.type_checkout === 'advance' ){
            
            shipping_info               = await getShippingRatesTaxes( exist_customer, req_auth, shipping_data, order_data.coupon );
            
            if( !shipping_info.success ){
                
                valid_shipping_options.details.products       = false;
                valid_shipping_options.details.rates          = false;
                valid_shipping_options.details.country_taxes  = false;
                valid_shipping_options.details.state_taxes    = false;
                
                valid_shipping_options.error = shipping_info;
            }
            else{
                
                valid_shipping_options.data = order_data;
            }
        }
        else{
            
            valid_shipping_options.details.customer = false;
            
            valid_shipping_options.error = { message: 'Customer not found' };
        }
        valid_shipping_options.general = valid_shipping_options.details.products && valid_shipping_options.details.rates && valid_shipping_options.details.country_taxes && valid_shipping_options.details.state_taxes && valid_shipping_options.details.customer;
        
        if( valid_shipping_options.general ){
            
            return h_response.request( true, valid_shipping_options, 200, 'Success: Validation Shipping Options', 'Process Validation Shipping Options successfully' );
        }
        else{
            
            return h_response.request( false, valid_shipping_options, 400, 'Error: Validation Shipping Options', `Process Validation Shipping Options not successful` );
        }
    } catch (process_error) {
        
        valid_shipping_options.general              = false;
        valid_shipping_options.details.customer     = false;
        valid_shipping_options.details.products     = false;
        valid_shipping_options.details.rates        = false;
        valid_shipping_options.details.country_taxes= false;
        valid_shipping_options.details.state_taxes  = false;
        valid_shipping_options.error = process_error;
        
        return h_response.request( false, valid_shipping_options, 400, 'Error: Validation Shipping Options', `Process Validation Shipping Options not successful` );
    }
};
/**
* 
* @param {*} req_auth 
* @param {*} data_checkout 
* @param {*} req_query 
* @returns 
*/
async function validDataCheckout( req_auth, data_checkout, req_query ){
    
    let valid_checkout = { 
        details : {
            customer        : true,
            products        : true,
            rates           : true,
            country_taxes   : true,
            state_taxes     : true,
            shipping_address: true,
            billing_address : true
        }, 
        general : true,
        data    : null,
        error   : null
    };
    try {
        let index_shipping_address = data_checkout.need_validate.shipping_address ? req_auth.user.customer.addresses.findIndex( (item) => item.id === data_checkout.shipping_address.id ) : 1;
        let index_billing_address  = data_checkout.need_validate.billing_address ? req_auth.user.customer.addresses.findIndex( (item) => item.id === data_checkout.billing_address.id ) : 1;
        
        if( index_shipping_address >= 0 && index_billing_address >= 0 ){
            
            if( data_checkout.need_validate.shipping_address && data_checkout.need_validate.billing_address ){
                
                let exist_shipping_address              = req_auth.user.customer.addresses[index_shipping_address];
                let exist_billing_address               = req_auth.user.customer.addresses[index_billing_address];
                valid_checkout.details.shipping_address = exist_shipping_address.country_code === data_checkout.shipping_address.country_code && exist_shipping_address.state_code === data_checkout.shipping_address.state_code && exist_shipping_address.zip === data_checkout.shipping_address.zip;
                valid_checkout.details.billing_address  = exist_billing_address.country_code === data_checkout.billing_address.country_code && exist_billing_address.state_code === data_checkout.billing_address.state_code && exist_billing_address.zip === data_checkout.billing_address.zip;
            }
            let valid_shipping_options = await validShippingOptions( req_auth, data_checkout, req_query.affiliate );
            
            if( valid_shipping_options.success ){
                
                valid_checkout.data                 = valid_shipping_options.body.data;
                valid_checkout.data.shipping_address= data_checkout.shipping_address;
                valid_checkout.data.billing_address = data_checkout.billing_address;
                
                
            }
            else{
                
                valid_checkout.details.customer     = valid_shipping_options.body.details.customer;
                valid_checkout.details.products     = valid_shipping_options.body.details.products;
                valid_checkout.details.rates        = valid_shipping_options.body.details.rates;
                valid_checkout.details.country_taxes= valid_shipping_options.body.details.country_taxes;
                valid_checkout.details.state_taxes  = valid_shipping_options.body.details.state_taxes;
                
                valid_checkout.error                = valid_shipping_options.body.error;
            }
        }
        else{
            
            valid_checkout.details.shipping_address = false;
            valid_checkout.details.billing_address  = false;
        }
        
        valid_checkout.general = valid_checkout.details.products && valid_checkout.details.rates && valid_checkout.details.country_taxes && valid_checkout.details.state_taxes && valid_checkout.details.customer && valid_checkout.details.shipping_address && valid_checkout.details.billing_address;
        
        if( valid_checkout.general ){
            
            return h_response.request( true, valid_checkout, 200, 'Success: Validate Checkout', 'Process Validate Checkout successfully' );
        }
        else{
            
            return h_response.request( false, valid_checkout, 400, 'Error: Validate Checkout', `Process Validate Checkout not successful` );
        }
    } catch (process_error) {
        
        console.log( process_error );
        valid_checkout.general              = false;
        valid_checkout.details.customer     = false;
        valid_checkout.details.products     = false;
        valid_checkout.details.rates        = false;
        valid_checkout.details.country_taxes= false;
        valid_checkout.details.state_taxes  = false;
        valid_checkout.error                = process_error;
        
        return h_response.request( false, valid_checkout, 400, 'Error: Validate Checkout', `Process Validate Checkout not successful` );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function createDraftOrderDBShopify(api_shopify, req_auth, draft_order){
    
    try {
        
        draft_order.shopify_draft_order.note_attributes = draft_order.shopify_draft_order.note_attributes.map( (item) => {
            
            if( item.name === 'business' ){
                
                item.value = draft_order.business.toString();
            }
            return item;
        });
        let exist_customer          = ( req_auth.token.is_app && req_auth.user.customer ) || ( !req_auth.token.is_app && req_auth.user.customer );
        let shopify_data            = draft_order.shopify_draft_order;
        let format_draft_order_db   = { 
            marketplace     : req_auth.marketplace,
            step_order      : 'draft-created', 
            customer        : draft_order.customer_id, 
            product_origin  : draft_order.product_origin,
            preorder_details: {
                bundle  : draft_order.preorder_bundle_list,
                standard: draft_order.preorder_standard_list
            },
            note_attributes : shopify_data.note_attributes,
            shopify_object  : shopify_data
        };
        let draft_order_created     = await backDraftOrderService.create( format_draft_order_db );
        
        if( draft_order_created.success && draft_order_created.body != null ){
            
            shopify_data.note_attributes.push({ name: "draft-order-db", value: draft_order_created.body._id.toString() });
            let note_attributes             = [...shopify_data.note_attributes];
            
            delete shopify_data.note_attributes;
            
            let shopify_draft_order_created = await shopify.executeQuery( api_shopify, api_shopify.draftOrder, api_shopify.draftOrder.create, shopify_data );
            
            if( shopify_draft_order_created.success && shopify_draft_order_created.body != null ){
                
                note_attributes.push({ name: "draft-order-shopify", value: shopify_draft_order_created.body.id });
                
                await backDraftOrderService.update({ _id: draft_order_created.body._id.toString() }, { step_order: "draft-created", draft_id: shopify_draft_order_created.body.id, note_attributes: note_attributes });
                
                let body_request = { 
                    db_draft_id     : draft_order_created.body._id.toString(), 
                    shopify_draft_id: shopify_draft_order_created.body.id, 
                    user_id         : exist_customer ? req_auth.user._id.toString()         : null, 
                    customer_id     : exist_customer ? req_auth.user.customer._id.toString(): null, 
                    note_attributes : note_attributes 
                };
                return h_response.request( true, body_request, 200, "Success: Draft Order Create", "Draft Order created successfully" );
            }
            else {
                
                await backDraftOrderService.update({ _id: draft_order_created.body._id.toString() }, { step_order: "draft-not-created", error_db: { shopify_error: shopify_draft_order_created } });
                
                console.log("======================================================================================");
                console.log( new Date(), "createDraftOrderShopify", "shopify.executeQuery.draftOrder.create", shopify_data.customer.id, shopify_draft_order_created );
                return h_response.request( false, shopify_draft_order_created, 400, "Error: Draft Order Create", "Draft Order not Created" );
            }
        }
        else{
            
            console.log("======================================================================================");
            console.log( new Date(), "createDraftOrderShopify", "backDraftOrderService.create", shopify_data.customer.id, draft_order_created );
            return h_response.request( false, draft_order_created, 400, "Error: Draft Order Create", "Draft Order not Created" );
        }
    } catch (process_error) {
        
        console.log("======================================================================================");
        console.log( new Date(), "createDraftOrderShopify", "createDraftOrderShopify", draft_order.shopify_draft_order.customer.id, process_error );
        return h_response.request( false, { status: "draft-not-created", step_order: "draft-not-created", order_error: { error_db: process_error } }, 400, "Error: Draft Order Create", "Draft Order not Created" );
    }
};
async function createShopifyOrder(api_shopify, req_auth, draft_order){
    
    try {
        
        let create_draft_order = await createDraftOrderDBShopify( api_shopify, req_auth, draft_order );
        
        if( create_draft_order.success ){
            
            let req_body = {
                customer_id     : create_draft_order.body.customer_id,
                user_id         : create_draft_order.body.user_id,
                draft_id        : create_draft_order.body.shopify_draft_id,
                coupon          : draft_order.coupon,
                product_origin  : draft_order.product_origin,
                note_attributes : create_draft_order.body.note_attributes
            };
            
            let complete_draft_result = await completeDraftOrder(api_shopify, req_body, create_draft_order.body.db_draft_id);
            if( complete_draft_result.success ){
                
                res.status(200).json( complete_draft_result );
            }
            else{
                
                console.log("======================================================================================");
                console.log( new Date(), "completeDraftOrderShopify", "completeDraftOrder", req_body.customer_id, complete_draft_result );
                res.status(400).send( complete_draft_result );
            }
        }
        else{
            
            return create_draft_order;
        }
    } catch (process_error) {
        
        console.log("======================================================================================");
        console.log( new Date(), "createShopifyOrder", "createShopifyOrder", shopify_data.customer.id, process_error );
        return h_response.request( false, { status: "order-not-created", step_order: "draft-not-created", order_error: { error_db: process_error } }, 400, "Error: Order Create", "Shopify Order not Created, Draft Order not created, please contact your Sales Agent" );
    }
};
/**
* 
* @param {*} shopify_data 
* @param {*} customer 
* @param {*} order_coupon 
* @param {*} business_result 
* @returns 
*/
async function createDBOrder( shopify_data, customer, order_coupon, business_result ){
    
    return new Promise( async (resolve, reject) => {
        
        // await orderService.findOneDelete({ shopify_id: shopify_data.id }).then( async (order_result) => {
            
        //     if(order_result.body === null ){
        
        //         let line_item_documents = await shopify_data.line_items.map( (line_item) => {
            
        //             return utils.format.formatLineItem(line_item, shopify_data, true);
        //         });
        //         await orderLineItemService.createMany( line_item_documents ).then( async (line_item_created) => {
            
        //             let db_line_items   = await line_item_created.body.reduce( (previous_item, current_item) => {
            
        //                 previous_item.line_items.push( current_item );
        //                 previous_item.discounts.push( current_item.discounts );
        //                 previous_item.ids.push( current_item._id );
        //                 previous_item.variants.push( { variant_title: current_item.variant_title } );
        //                 previous_item.brands.push( current_item.brand );
        //                 previous_item.skus.push( { sku: current_item.sku } );
        
        //                 return previous_item;
        //             }, { order_id: shopify_data.id, line_items: [], ids: [], discounts: [], variants: [], brands: [], skus: [] });
        
        //             let format_order = utils.format.formatOrder(shopify_data, order_coupon, db_line_items, business_result, true);
        //             let item_customer = null;
        //             if( shopify_data.customer != null && customer != null ){
        
        //                 format_order.customer = customer._id;
        //                 format_order.customer_id = customer.shopify_id;
        
        //                 item_customer = {...customer};
        
        //                 item_customer.orders_count.current_year += 1;
        
        //                 if( item_customer.first_order === null || moment( item_customer.first_order.created_at ).diff( moment( format_order.created_at ) ) > 0 ){
        
        //                     item_customer.first_order = {
        //                         shopify_id: format_order.shopify_id,
        //                         name: format_order.name,
        //                         created_at: format_order.created_at
        //                     };
        //                 }
        //                 if( item_customer.last_order === null || moment( format_order.created_at ).diff( moment( item_customer.last_order.created_at ) ) > 0 ){
        
        //                     item_customer.last_order = {
        //                         shopify_id: format_order.shopify_id,
        //                         name: format_order.name,
        //                         created_at: format_order.created_at
        //                     };
        //                 }
        //             }
        //             await orderService.create( format_order ).then( async (order_created) => {
            
        //                 if( item_customer != null ){
        
        //                     let update_customer = { 
        //                         first_order : item_customer.first_order, 
        //                         last_order  : item_customer.last_order, 
        //                         orders_count: item_customer.orders_count 
        //                     };
        //                     await backCustomerService.update({ _id: item_customer._id }, update_customer ).catch( (customer_error) => {
            
        //                         // utils.format.formatErrorSlackApi( `Order ${ order_created.body.name } - Customer Updated`, 'backCustomerService.update', 0, customer_error );
        //                     });
        //                     if( order_coupon != null ){
        
        //                         await agent.put.couponUsed( { _id: order_coupon._id, id_customer: item_customer._id } ).then( (agent_result) => {}).catch( (agent_error) => {});
        //                     }
        //                     let draft_id        = order_created.body.note_attributes.find( (item) => item.name === "draft-order-shopify" );
        //                     let payment_method  = order_created.body.note_attributes.find( (item) => item.name === "payment_method" );
        
        //                     if( !customer.is_dropshipping && customer.agent && customer.agent.slackUser ){
        
        //                         // let message_order = slack.formatMessageOrder( order_created.body, customer );
        
        //                         // await slack.sendMessage( api_slack, customer.agent.slackUser.id, message_order );
        //                     }
        //                     await billing.post.createInvoiceOrder({ order_id: order_created.body._id, payment_method: payment_method ? payment_method.value : null, draft_id: draft_id ? parseInt( draft_id.value ) : null }).then( async (billing_result) => {
            
        //                         await orderService.update({ _id: order_created.body._id }, { created_invoice: true }).catch( (order_error) => {});
        //                     }).catch( (billing_error) => {});
        
        //                     await updateStockProduct( order_created.body.line_items );
        //                 }
        //                 resolve( h_response.request( true, { status: "created-order", step_order: "created-order", shopify_id: order_created.body.shopify_id, order_name: order_created.body.name }, 200, "Success: Order Create", "Order created successfully" ) );
        
        //             }).catch( (order_error) => {
            
        //                 reject( h_response.request( false, { status: "processing-order", step_order: "processing-order", order_error: { order: order_error } }, 400, "Error: Order Create", "DB Order not Created" ) );
        //             });
        //         }).catch( (line_item_error) => {
            
        //             reject( h_response.request( false, { status: "processing-order", step_order: "processing-order", order_error: { line_item_order: line_item_error } }, 400, "Error: Order Create", "DB Order not Created, Line Items not Created" ) );
        //         });
        //     }
        //     else{
        
        //         resolve( h_response.request( true, { status: "created-order", step_order: "created-order", order_error: null, order_name: order_result.body.name }, 200, "Success: Order Create", "Order created successfully" ) );
        //     }
        // }).catch( (order_error) => {
            
        //     reject( h_response.request( false, { status: "processing-order", step_order: "processing-order", order_error: { order: order_error } }, 400, "Error: Order Create", "DB Order not Created, Failed find validation" ) );
        // });
    });
};
/**
* 
* @param {*} req_body 
* @param {*} db_draft_id 
* @param {*} draft_order_data 
* @returns 
*/
async function completeDraftOrder(api_shopify, req_body, db_draft_id){
    
    try {
        let shopify_complete = await shopify.executeQuery( api_shopify, api_shopify.draftOrder, api_shopify.draftOrder.complete, { payment_pending: true }, parseInt( req_body.draft_id ) );
        
        if( shopify_complete.success ){
            
            if( req_body.product_origin.indexOf('pre-order') === 0 && ( req_body.user_id != null || req_body.customer_id != null ) ){
                
                let queryUpdateCart = req_body.product_origin === 'save-later' ? {} : { coupon: null };
                
                if( req_body.product_origin === 'save-later' ){
                    
                    queryUpdateCart.save_later = [];
                }
                else{
                    
                    queryUpdateCart.products = [];
                }
                await backCartService.update( req_body.user_id != null ? { user: req_body.user_id } : { customer: req_body.customer_id }, queryUpdateCart );
            }
            if( req_body.coupon != null ){
                
                await agent.put.couponUsed({ _id: req_body.coupon, id_customer: req_body.customer_id });
            }
            
            if( db_draft_id ){
                
                await backDraftOrderService.update({ _id: db_draft_id }, { order_id: shopify_complete.body.order_id.toString(), step_order: "draft-completed" });
            }
            
            let variant_result = backProductVariantService.find({ shopify_id: { $in: shopify_complete.body.line_items.map( (item) => item.variant_id ) } }, { shopify_id: 1, inventory_quantity: 1 });
            
            if( variant_result.success ){
                
                for (const item_variant of variant_result.body) {
                    
                    let line_item = shopify_complete.body.line_items.find( (item) => item.variant_id === item_variant.shopify_id );
                    if( line_item ){
                        
                        await backProductVariantService.update({ shopify_id: item_variant.shopify_id }, { inventory_quantity: item_variant.inventory_quantity - line_item.quantity >= 0 ? item_variant.inventory_quantity - line_item.quantity : 0 });
                    }
                }
            }
            
            return h_response.request( true, { status: "created-shopify-order", step_order: "draft-completed", order_error: null, product_origin: req_body.product_origin }, 200, "Success: Order Create", "Order Created and Completed" );
        }
        else{
            
            if( db_draft_id ){
                
                await backDraftOrderService.update({ _id: db_draft_id }, { step_order: "draft-not-completed", error_db: { shopify_error: shopify_complete } });
            }
            console.log("======================================================================================");
            console.log( new Date(), "completeDraftOrder", "shopify.executeQuery.draftOrder.complete", req_body.customer_id, shopify_error );
            return h_response.request( false, { status: "order-not-created", step_order: "draft-not-completed", order_error: { shopify: shopify_complete } }, 400, "Error: Order Create", "Draft Order Created but not Completed, please contact your Sales Agent" );
        }
    } catch (process_error) {
        
        return h_response.request( false, { status: "draft-not-completed", step_order: "draft-not-completed", error_db: { process_error: process_error } }, 400, "Error: Draft Order", "Draft Order not completed" );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function createInvoice(req, res){
    
    await orderService.find({ $and: [ { created_invoice: false } ] }).then( async (order_result) => {
        
        if( order_result.body.length > 0 ){
            
            let draft_id = order_result.body[0].note_attributes.find( (item) => item.name === "draft-order-shopify" );
            let payment_method  = order_result.body[0].note_attributes.find( (item) => item.name === "payment_method" );
            
            payment_method = !payment_method && order_result.body[0].note_attributes.find( (item) => item.name === "Order Match" ) ? { value: "dropshipping" } : payment_method;
            
            await billing.post.createInvoiceOrder({ order_id: order_result.body[0]._id, payment_method: payment_method ? payment_method.value : null, draft_id: draft_id ? parseInt( draft_id.value ) : null }).then( async (billing_result) => {
                
                await orderService.update({ _id: order_result.body[0]._id }, { created_invoice: true }).then( (order_updated) => {
                    
                    res.status(200).json( h_response.request(true, { order: order_updated, invoice: billing_result }, 200, 'Sync. Create Invoices', `Invoice Order ${ order_result.body[0].name } Created Successfuly`) );
                }).catch( (order_error) => {
                    
                    res.status(200).json( h_response.request(false, order_error, 400, 'Sync. Create Invoices', 'orderService.update failed') );
                });
            }).catch( (billing_error) => {
                
                res.status(200).json( h_response.request(false, billing_error, 400, `Order ${ order_result.body[0].name } - Invoice Created`, 'billing.post.createInvoiceOrder failed') );
            });
        }
        else{
            
            res.status(200).json( h_response.request(true, { data: "No Orders" }, 200, `No Orders`, 'No Orders') );
        }
    }).catch( (order_error) => {
        
        res.status(200).json( h_response.request(false, order_error, 400, 'Sync. Create Invoices', 'orderService.find failed') );
    });
};
/**
* 
* @param {*} data_template 
* @param {*} template_file { item_sheet, first_reg, arr_columns, index_col, column } 
* @param {*} data_file { file, data_sheet, index_data, item_data }
* @param {*} format_currency { locale, code }
* @returns 
*/
async function formatBodyTransactionFile( data_template, template_file, data_file, format_currency ){
    
    let formula_excel = null;
    let index_row = parseInt( template_file.first_reg );
    let cell_file = `${ template_file.column }${ index_row + data_file.index_data }`;
    let cell_template = `${ template_file.column }${ template_file.first_reg }`;
    let item_file = data_file.item_data.row.columns.find( (item) => item.index_column === template_file.index_col );
    
    if( item_file ){
        
        data_template.Sheets[template_file.item_sheet][cell_file] = excel.addCellExcel( data_template, data_template.Sheets[template_file.item_sheet][cell_template], item_file.value, format_currency, formula_excel );
    }
    
    return data_template;
};
/**
* 
* @param {*} list_variants 
*/
async function updateStockProduct(list_variants){
    
    await backProductVariantService.find({ sku: list_variants.map( (item) => item.sku ) }).then( async (variant_result) => {
        
        for (const item_variant of variant_result.body) {
            
            let update_variant =  list_variants.find( (item) => item.sku === item_variant.sku );
            if( update_variant ){
                
                let update_quantity = item_variant.inventory_quantity - update_variant.quantity;
                
                await backProductVariantService.update({ shopify_id: item_variant.shopify_id }, { inventory_quantity: ( update_quantity >= 0 ? update_quantity : 0 ) }).then( (vairant_updated) => {});
            }
        }
    });
};

function errorMessageDetails( valid_details ){
    
    let messages = [];
    
    if( valid_details.draft_order && valid_details.draft_order === false ){
        
        messages.push('Draft Order not created');
    }
    if( !valid_details.customer ){
        
        messages.push('Customer not validated');
    }
    if( !valid_details.shipping_address ){
        
        messages.push('Shipping Address not validated');
    }
    if( !valid_details.billing_address ){
        
        messages.push('Billing Address not validated');
    }
    if( !valid_details.products ){
        
        messages.push('Products not validated');
    }
    if( !valid_details.rates ){
        
        messages.push('Shipping Rates not validated');
    }
    if( !valid_details.country_taxes ){
        
        messages.push('Shipping Country Taxes not validated');
    }
    if( !valid_details.state_taxes ){
        
        messages.push('Shipping State Taxes not validated');
    }
    
    return messages.length > 0 ? `: ${ messages.join('\n - ') }` : '';
};
// =============================================================================
// EXPORTS
// =============================================================================
module.exports = {
    get:{
        createInvoice,
        downloadTransactionFile
    },
    post:{
        list,
        find,
        create,
        createDBOrderShopify,
        createDBOrderDropshipping,
        createDraftOrder,
        completeDraftOrderShopify,
        shippingOptions,
        validCheckout,
        deleteTransactionFile
    },
    put:{
        updateInvoiceItems
    },
    delete:{
    }
};