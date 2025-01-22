// =============================================================================
// PACKAGES
// =============================================================================
// =============================================================================
// HELPERS
// =============================================================================
const h_array       = require('../../../helpers/array');
const h_format      = require('../../../helpers/format');
const h_validation  = require('../../../helpers/validation');
const h_response    = require('../../../helpers/response');
const h_file        = require('../../../helpers/file');
const excel         = require('../../../helpers/excel');
// =============================================================================
// SERVICES
// =============================================================================
const {
    backCartService,
    backAffiliateService,
    agentUserService,
    backPreorderService,
    backPreorderItemService,
    backProductService,
    backCustomerService,
    backProductVariantService,
    backUserService,
    backGeneralSettingService,
    agentProductBundleService
} = require('../../../services/manager');
const agent     = require('../../../services/2b-apps/agent');
// =============================================================================
// REST FUNCTIONS
// =============================================================================
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function products(req, res){
    
    let format_cart = await cartObjectByAction( req, req.auth.user?._id || null, req.auth.user.customer?._id || null, req.auth?.discounts || [], 'list-products' );
    if( format_cart.success ){
        
        let cart_updated = await updateCart( req.auth.user._id || null, req.auth.user.customer?._id || null, format_cart ); 
        if ( cart_updated.success ) {
            
            res.status(200).json( cart_updated );
        }
        else {
            
            return res.status(400).send( cart_updated );
        }
    }
    else {
        
        res.status(400).send( format_cart );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function productsNav(req, res){
    
    let format_cart = await cartObjectByAction( req, req.auth.user?._id || null, req.auth.user.customer?._id || null, req.auth?.discounts || [], 'list-products-nav', req.body.products );
    if( format_cart.success ){
        
        let cart_updated = await updateCart( req.auth.user._id || null, req.auth.user.customer?._id || null, format_cart ); 
        if ( cart_updated.success ) {
            
            res.status(200).json( cart_updated );
        }
        else {
            
            return res.status(400).send( cart_updated );
        }
    }
    else {
        
        res.status(400).send( format_cart );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function checkoutOrder(req, res){
    
    let format_cart = await cartObjectByAction( req, req.auth.user?._id || null, req.auth.user.customer?._id || null, req.auth?.discounts || [], req.body.action, req.body.products, req.body.product_origin );
    if( format_cart.success ){
        
        format_cart.body = {
            products: req.body.product_origin === 'cart' ? format_cart.body.cart.products.front_end : format_cart.body.save_later.products.front_end,
            details : req.body.product_origin === 'cart' ? format_cart.body.cart.details            : format_cart.body.save_later.details,
            coupon  : req.body.product_origin === 'cart' ? format_cart.body.coupon                  : null,
            order   : {
                customer: req.body.action === 'list-products' ? req.auth.user.customer  : null,
                user    : req.body.action === 'list-products' ? req.auth.user           : null
            }
        };
        if( req.body.action === 'list-products' ){
            delete format_cart.body.order.customer.is_dropshipping;
            delete format_cart.body.order.customer.special_shippings;
            delete format_cart.body.order.customer.tax_exempt;
        }
        res.status(200).json( format_cart );
    }
    else {
        
        res.status(400).send( format_cart );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function advancePreorder(req, res){
    
    try {
        let affiliate_result        = await h_format.affiliateDiscounts( req.auth, req.query.affiliate, backAffiliateService );
        let item_variant            = null;
        let item_product            = null;
        let valid_bundle_list       = {
            armed   : null,
            custom  : []
        };
        let total_advance           = 0;
        let product_bundle_populate = { 
            populate: [
                { path: 'product', populate: { path: 'variants', match: { status: 'active', deleted: false } } }, 
                { path: 'selected_variants', populate: { path: 'variant', match: { status: 'active', deleted: false } } }, 
                { path: 'config_pre_sale', match: { status: 'active', deleted: false } }
            ] 
        };
        let product_result          = { success: false, body: null };
        product_result              = req.body.type === 'bundle' ? await agentProductBundleService.findOne( { _id: req.body.id }, null, product_bundle_populate ) : await backProductService.findOne({ _id: req.body.id });
        
        if( product_result.success && product_result.body != null ){
            
            let brand_discount = h_format.getDiscountBrand( req.auth.application_type, req.auth.discounts, req.body.type === 'bundle' ? product_result.body.product.brand?.handle : product_result.body.brand?.handle );
            
            if( brand_discount && !product_result.body.config_pre_sale || ( product_result.body.config_pre_sale && moment( product_result.body.config_pre_sale.ended_at ).endOf('day').utc().diff( moment() ) >= 0 ) ){
                
                if( req.body.type === 'bundle' ){
                    
                    let original_bundle_list    = req.body.preorder_bundle_list;
                    let valid_armed             = original_bundle_list.armed && original_bundle_list.armed.variant_id && original_bundle_list.armed.total_quantity > 0;
                    let valid_custom            = ( original_bundle_list.custom && ( ( original_bundle_list.custom.total_quantity > 0 && original_bundle_list.custom.total_quantity % product_result.body.moq === 0 ) || original_bundle_list.custom.total_quantity === 0 ) )
                    let total_current_bundle    = 0;
                    let total_custom_bundle     = 0;
                    let quantity_current_bundle = 0;
                    let quantity_custom_bundle  = 0;
                    let valid_count_variants    = true;
                    if( valid_armed ){
                        
                        total_current_bundle        = h_format.currencyObject( h_format.calcDiscountPrice( product_result.body.product.price.max_price, 100 - product_result.body.pay_percentage.armed, original_bundle_list.armed.total_quantity ) * original_bundle_list.armed.total_quantity, false).number;
                        quantity_current_bundle     = original_bundle_list.armed.total_quantity;
                        valid_bundle_list.armed           = {};
                        valid_bundle_list.armed.variant_id= product_result.body.product.variants[0].shopify_id;
                        valid_bundle_list.armed.quantity  = original_bundle_list.armed.total_quantity;
                    }
                    if( valid_custom ){
                        
                        total_custom_bundle     = h_format.currencyObject( h_format.calcDiscountPrice( product_result.body.product.price.max_price, 100 - product_result.body.pay_percentage.custom, Math.round( original_bundle_list.custom?.total_quantity / product_result.body.moq ) ) * Math.round( original_bundle_list.custom?.total_quantity / product_result.body.moq ), false).number;
                        quantity_custom_bundle  = Math.round( original_bundle_list.custom.total_quantity / product_result.body.moq );
                        valid_bundle_list.custom      = original_bundle_list.custom.list.reduce( (previous_item, current_item) => {
                            
                            let exist_variant = product_result.body.selected_variants.find( (item_variant) => item_variant.variant.shopify_id === current_item.variant_id );
                            
                            if( exist_variant ){
                                
                                previous_item.push({
                                    variant_id  : exist_variant.variant.shopify_id,
                                    quantity    : current_item.quantity
                                });
                            }
                            return previous_item;
                        }, []);
                        valid_count_variants    = valid_bundle_list.custom.length === original_bundle_list.custom.list.length;
                    }
                    let total_quantity          = quantity_current_bundle + quantity_custom_bundle;
                    total_advance               = total_current_bundle + total_custom_bundle;
                    
                    if( total_quantity > 0 && total_advance > 0 && valid_count_variants ){
                        
                        item_variant            = product_result.body.product.variants[0];
                        item_variant.price      = total_advance;
                        item_variant.image      = product_result.body.product.images[0] || null;
                        
                        item_product            = product_result.body.product;
                        item_product.discounts  = {
                            brand       : brand_discount.value,
                            affiliate   : affiliate_result.body.discount,
                            product     : 0,
                            pre_sale    : product_result.body.config_pre_sale?.discount || 0
                        };
                    }
                    else{
                        
                        res.status(400).send( h_response.request( false, { total_quantity, total_advance, valid_count_variants }, 400, "Error: Pre-order", "Product not Validated" ) );
                    }
                }
                else{
                    
                    total_advance           = product_result.body.variants.reduce( (previous_item, current_item) => { 
                        let select_variant = req.body.preorder_standard_list.find( (item) => item.variant_id === current_item.shopify_id );
                        if( select_variant ){
                            
                            let price_variant = h_format.currencyObject( h_format.calcDiscountPrice( current_item.price.max_price, 100 - ( product_result.body.config_pre_sale?.advance_percentage || 0 ), select_variant.quantity ), false).number;
                            previous_item += price_variant * select_variant.quantity;
                        }
                        return previous_item;
                    }, 0);
                    item_variant            = product_result.body.variants[0];
                    item_variant.price      = total_advance;
                    item_variant.image      = product_result.body.images[0] || null;
                    
                    item_product            = product_result.body;
                    item_product.discounts  = {
                        brand       : brand_discount.value,
                        affiliate   : affiliate_result.body.discount,
                        product     : 0,
                        pre_sale    : product_result.body.config_pre_sale?.discount || 0
                    };
                }
            }
            else{
                
                res.status(400).send( h_response.request( false, { success: false, body: null }, 400, "Error: Pre-order", "Product not available" ) );
            }
        }
        else{
            
            res.status(400).send( h_response.request( false, product_result, 400, "Error: Pre-order", "Product not found" ) );
        }
        if( item_product != null && item_variant != null ){
            
            item_product = {
                discounts       : item_product.discounts,
                title           : `Pre-Order Advance Payment for ${ item_variant.sku }`,
                handle          : h_format.slug( `Pre-Order Advance Payment for ${ item_variant.sku }` ),
                brand           : item_product.brand,
                product_type    : item_product.product_type,
                product_category: item_product.product_category,
                sales_limit     : 0,
                moq             : 0
            };
            item_variant = {
                shopify_id          : null,
                product_id          : null,
                sku                 : `ADVPRO-${ item_variant.sku }`,
                price               : item_variant.price,
                image               : item_variant.image,
                quantity            : 1,
                discounts           : {
                    brand: item_product.discounts.brand,
                    stock: { 
                        apply       : false, 
                        value       : 0, 
                        min_stock   : 0 
                    }
                },
                title_product       : `Pre-Order Advance Payment for ${ item_variant.sku }`,
                weight              : 1,
                grams               : 454,
                inventory_quantity  : 1,
                options             : item_variant.options
            };
            let format_cart_item = h_format.cartItemsObject( item_product, item_variant );
            format_cart_item.body.front_end.origin = "pre-order";
            let pre_order = {
                products: [ format_cart_item.body.front_end ],
                details : {
                    count               : 1,
                    subtotal            : total_advance,
                    subtotal_coupon     : 0,
                    total               : total_advance,
                    discount_coupon     : {
                        fixed_amount        : 0,
                        percentage_amount   : 0
                    }
                },
                coupon  : null,
                order   : {
                    customer: req.auth.user.customer,
                    user    : req.auth.user,
                }
            };
            delete pre_order.order.customer.is_dropshipping;
            delete pre_order.order.customer.special_shippings;
            delete pre_order.order.customer.tax_exempt;
            res.status(200).send( h_response.request( true, pre_order, 200, "Success: Pre-order", "Product Validated" ) );
        }
        else{
            
            res.status(400).send( h_response.request( false, { item_product, item_variant }, 400, "Error: Pre-order", "Product not Validated" ) );
        }
    } catch (process_error) {
        
        res.status(400).send( h_response.request( false, process_error, 400, "Error: Pre-order", "Product not process" ) );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function completePreorder(req, res){
    
    try {
        let preorder_populate = {
            populate: [
                { 
                    path: 'product', 
                    match: { status: 'active', deleted: false }, 
                    populate: [
                        { path: 'variants'          , match: { status: 'active', deleted: false }, options: { sort: { sort_variant: 1 } } },
                        { path: 'config_pre_sale'   , match: { status: 'active', deleted: false } }
                    ] 
                },
                {
                    path: 'product_bundle',
                    match: { status: 'active', deleted: false },
                    populate: [
                        { 
                            path: 'product', 
                            match: { $and: [ { status: 'active' }, { status_created: 'active' }, { deleted: false } ] }, 
                            select: 'shopify_id title handle price images brand varaints',
                            populate: {
                                path: 'variants'
                            }
                        },
                        { 
                            path: 'selected_variants', 
                            populate: { 
                                path: 'variant', 
                                match: { $and: [ { status: 'active' }, { status_created: 'active' }, { deleted: false } ] }, 
                                select: 'shopify_id product_id sku image'
                            }
                        },
                        { path: 'config_pre_sale' }
                    ]
                },
                { path: 'line_items' }
            ]
        };
        let preorder_result = await backPreorderService.findOne({ _id: req.body.id, customer: req.auth.user.customer._id.toString(), life_stage: 'open', status: 'active' }, null, preorder_populate);
        let affiliate_result= await h_format.affiliateDiscounts( req.auth, req.query.affiliate, backAffiliateService );
        let user_result     = await backUserService.findOne({ customer: req.auth.user.customer._id.toString(), status: 'active' }, { first_name: 1, last_name: 1, email: 1, token_login: 1 }, user_populate);
        
        if( preorder_result.success && preorder_result.body != null && user_result.success && user_result.body != null && affiliate_result.success ){
            
            let product_bundle      = preorder_result.body.product_bundle;
            let preorder_products   = [];
            if( preorder_result.body.preorder_category === 'bundle' && product_bundle != null && product_bundle.product != null ){
                
                let product_ids = [...new Set( product_bundle.selected_variants.reduce( (previous_item, current_item) =>{
                    if( current_item.variant && current_item.variant.product_id != product_bundle.product.shopify_id ){
                        previous_item.push( current_item.variant.product_id );
                    }
                    return previous_item;
                }, []) )];
                
                let product_result = product_ids.length > 0 ? await backProductService.find({ _id: product_ids, status: 'active' }) : { success: true, body: [] };
                if( product_result.success ){
                    
                    preorder_products = product_result.body.concat( product_bundle.product );
                }
                else{
                    
                    res.status(400).send( h_response.request( false, product_result, 400, "Error: Pre-order", "Pre-order not Available" ) );
                }
            }
            else if( preorder_result.body.preorder_category === 'standard' && preorder_result.body.product != null ){
                
                preorder_products.push( preorder_result.body.product );
            }
            else{
                
                res.status(400).send( h_response.request( false, { product_bundle: product_bundle, product: product_bundle?.product }, 400, "Error: Pre-order", "Pre-order not Available" ) );
            }
            if( preorder_products.length > 0 ){
                
                let format_cart = h_format.cartObject( req.auth.application_type, [], { affiliate: affiliate_result.body, brand_discounts: req.auth.discounts, coupon: null, db_products: preorder_products, db_cart: preorder_result.body.line_items, db_save_later: [] } );
                
                if( format_cart.success ){
                    
                    format_cart.body.cart.products.front_end = format_cart.body.cart.products.front_end.map( (item) => {
                        
                        item.origin = 'pre-order';
                        if( preorder_result.body.advance_order != null && preorder_result.body.preorder_category === 'bundle' && preorder_result.body.line_items.find( (item_line) => item_line.variant_id === item.variant_id && item_line.bundle_type === 'armed' ) ){
                            
                            item.total_discount = item.total_discount * ( ( 100 - product_bundle.pay_percentage_advance.armed ) / 100 );
                            item.discount_price = h_format.currencyObject( h_format.calcDiscountPrice( item.price, item.total_discount, item.quantity ), false ).number;
                        }
                        else if( preorder_result.body.advance_order != null  && preorder_result.body.preorder_category === 'bundle' && preorder_result.body.line_items.find( (item_line) => item_line.variant_id === item.variant_id && item_line.bundle_type === 'custom' ) ){
                            
                            item.total_discount = item.total_discount * ( ( 100 - product_bundle.pay_percentage_advance.custom ) / 100 );
                            item.discount_price = h_format.currencyObject( h_format.calcDiscountPrice( item.price, item.total_discount, item.quantity ), false ).number;
                        }
                        else if( preorder_result.body.advance_order != null  && preorder_result.body.preorder_category === 'standard' ){
                            
                            item.total_discount = item.total_discount * ( ( 100 - preorder_result.body.product.config_pre_sale.advance_percentage ) / 100 );
                            item.discount_price = h_format.currencyObject( h_format.calcDiscountPrice( item.price, item.total_discount, item.quantity ), false ).number;
                        }
                        return item;
                    });
                    format_cart.title   = 'Success: Pre-order';
                    format_cart.message = 'Pre-order Available';
                    format_cart.body    = { 
                        products    : format_cart.body.cart.products.front_end, 
                        details     : format_cart.body.cart.details,
                        coupon      : null,
                        order       : {
                            customer: req.auth.user.customer,
                            user    : req.auth.user,
                            preorder: { 
                                id  : req.body.id, 
                                name: preorder_result.body.name 
                            }, 
                            valid   : true 
                        }
                    };
                    delete format_cart.body.order.customer.is_dropshipping;
                    delete format_cart.body.order.customer.special_shippings;
                    delete format_cart.body.order.customer.tax_exempt;
                    res.status(200).json( format_cart );
                }
                else{
                    
                    res.status(400).send( format_cart );
                }
            }
        }
        else{
            
            let process_error = [ preorder_result, user_result, affiliate_result ].filter( (item) => !item.success );
            res.status(400).send( h_response.request( false, process_error, 400, "Error: Pre-order", "Pre-order not process" ) );
        }
    } catch (process_error) {
        
        res.status(400).send( h_response.request( false, process_error, 400, "Error: Pre-order", "Pre-order not process" ) );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function addProductCart(req, res) {
    
    await actionCart(req, res, 'add-products-cart');
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function addProductCartNav(req, res) {
    
    await actionCart(req, res, 'add-products-cart-nav');
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function updateProduct(req, res){
    
    await actionCart(req, res, 'update-products-cart');
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function updateProductNav(req, res){
    
    await actionCart(req, res, 'update-products-cart-nav');
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function removeProductCart(req, res) {
    
    await actionCart(req, res, 'remove-products-cart');
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function removeProductCartNav(req, res) {
    
    await actionCart(req, res, 'remove-products-cart-nav');
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function addSaveLater(req, res) {
    
    await actionCart(req, res, 'add-products-save-later');
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function updateSaveLater(req, res) {
    
    await actionCart(req, res, 'update-products-save-later');
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function removeSaveLater(req, res) {
    
    await actionCart(req, res, 'remove-products-save-later');
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function deleteSaveLater(req, res) {
    
    await actionCart(req, res, 'delete-products-save-later');
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function chargeProducts(req, res) {
    
    try {
        let file_result = await excel.readFile( req, `${ req.auth.user.customer.first_name } ${ req.auth.user.customer.last_name } - Cart List`, JSON.parse( req.body.multi_sheets ), req.body.currency_data );
        if( file_result.success ){
            
            let data_products = file_result.data.reduce( (previous_item, current_item) =>{
                
                let valid_sku       = h_validation.evalString( current_item.row.sku );
                let valid_quantity  = h_validation.evalInt( current_item.row.quantity );
                
                if( previous_item.length === 0 || ( previous_item[previous_item.length - 1].sku != valid_sku && valid_sku != null && valid_quantity > 0 ) ){
                    
                    previous_item.push({ sku: valid_sku, quantity: valid_quantity });
                }
                else if( previous_item[previous_item.length - 1].sku === valid_sku && valid_sku != null && valid_quantity > 0 ){
                    
                    previous_item[previous_item.length - 1].quantity += valid_quantity;
                }
                return previous_item;
            }, []);
            let variant_result = await backProductVariantService.find({ sku: data_products.map( (item) => item.sku ), status: 'active' });
            if( variant_result.success ) {
                
                req.body.products = JSON.stringify( data_products.reduce( (previous_item, current_item) =>{ 
                    
                    let db_variant = variant_result.body.find( (item) => item.sku === current_item.sku );
                    if( db_variant ){ 
                        
                        previous_item.push({ product_id: db_variant.product_id, variant_id: db_variant.shopify_id, quantity: current_item.quantity }); 
                    } 
                    return previous_item; 
                }, []) );
                
                if( JSON.parse( req.body.is_file ) ){
                    
                    await actionCart(req, res, 'add-products-cart');
                }
                else{
                    
                    let user_result = await backUserService.findOne({ customer: req.body.customer });
                    if( user_result.success ) {
                        
                        req.auth = {
                            token: {
                                access:{
                                    is_app: false
                                }
                            },
                            data: {
                                _id: user_result.body._id,
                                customer: {
                                    _id: req.body.customer
                                }
                            }
                        };
                        await actionCart(req, res, 'add-products-cart');
                    }
                    else {
                        
                        res.status(400).send( h_response.request( false, user_result, 400, "Error: Cart Products", "User not found" ) );
                    }
                }
            }
            else {
                
                res.status(400).send( h_response.request( false, variant_result, 400, "Error: Cart Products Variants", "Cart Products Variants not found" ) );
            }
        }
        else {
            
            file_error.title = "Error: Upload File";
            file_error.message = "Cart File not Uploaded";
            res.status(400).send(file_error);
        };
    } catch (process_error) {
        
        res.status(400).send( h_response.request( false, process_error, 400, "Error: Cart Products", "Cart Products not process" ) );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function addCouponCode(req, res){
    
    try {
        
        let cart_updated = await backCartService.update({ user: req.auth.user._id.toString() }, { coupon: req.body.coupon });
        if( cart_updated.success && cart_updated.body != null ){
            
            let format_cart = await cartObjectByAction( req, req.auth.user._id || null, req.auth.user.customer?._id || null, req.auth.discounts );
            if( format_cart.success ){
                res.status(200).json( format_cart );
                
            }
            else if( !format_cart.success ){
                
                res.status(format_cart.status).send( format_cart );
            }
        }
        else{
            
            res.status(400).send( h_response.request( false, cart_updated, 400, "Error: Cart Update", "Cart not updated" ) );
        }
    } catch (process_error) {
        
        res.status(400).send( h_response.request( false, process_error, 400, "Error: Coupon Code", "Coupon Code not process" ) );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function downloadCartFile(req, res){
    
    try {
        let user_result = await backUserService.findOne({ customer: req.query.customer });;
        
        if( user_result.success && user_result.body ){
            
            let customer_name = user_result.body.customer.full_name;
            
            let new_file = req.query.new_file ? JSON.parse( req.query.new_file ) : false;
            let origin = req.query.origin ? req.query.origin : 'cart';
            let data_file = [{
                title: `${ customer_name } - Cart List`,
                max_num_columns: 3,
                sheet_name: "Cart List",
                body_data: [],
                cols: [
                    { wch: 30 },
                    { wch: 20 },
                    { wch: 20 },
                ]
            }];
            if( new_file ){
                
                for (const item_product of [...Array(70).keys()]) {
                    
                    data_file[0].body_data.push({ 
                        row: { 
                            columns: [ 
                                { name: "sku",                  value: "",   index_column: 0, num_columns: 1, num_rows: 1 }, 
                                { name: "quantity",             value: "",   index_column: 1, num_columns: 1, num_rows: 1 }, 
                                { name: "discount_price",       value: "",   index_column: 2, num_columns: 1, num_rows: 1 }
                            ] 
                        } 
                    });
                    await createCartFile(res, customer_name, data_file);
                }
            }
            else{
                
                let cart_result = await backCartService.findOne({ user: user_result.body._id });
                
                if( cart_result.success && cart_result.body ){
                    
                    let data_cart = origin === 'cart' ? cart_result.body.products : cart_result.body.save_later;
                    for (const item_product of data_cart) {
                        
                        item_product.discount_price = h_format.currencyObject( h_format.calcDiscountPrice( item_product.price, item_product.discount_product, item_product.quantity), false ).number;
                        data_file[0].body_data.push({ 
                            row: { 
                                columns: [ 
                                    { name: "sku",              value: item_product.sku,                index_column: 0, num_columns: 1, num_rows: 1 }, 
                                    { name: "quantity",         value: item_product.quantity,           index_column: 1, num_columns: 1, num_rows: 1 }, 
                                    { name: "discount_price",   value: item_product.discount_price,     index_column: 2, num_columns: 1, num_rows: 1 } 
                                ] 
                            } 
                        });
                    }
                    await createCartFile(res, customer_name, data_file);
                }
                else{
                    
                    res.status(400).send( h_response.request( false, cart_result, 400, "Error: Cart find", "Cart not found" ) );
                }
            }
        }
        else{
            
            res.status(400).send( h_response.request( false, user_result, 400, "Error: Cart find", "Customer not found" ) );
        }
    } catch (process_error) {
        
        res.status(400).send( h_response.request( false, process_error, 400, "Error: Download File", "Cart List File not process" ) );
        
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function deleteCartFile(req, res){
    
    let file_delete = await h_file.remove( `./public/downloads/`, req.body.url_file.replace("/downloads/", "").split("?")[0], 'xlsx');
    if( file_delete.success ){
        
        res.status(200).json( file_delete );
    }
    else {
        
        res.status(400).send( file_delete );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function listAddBestSellers(req, res){
    
    try {
        
        let setting_result  = await backGeneralSettingService.findOne({ status: 'active' });
        let affiliate_result= await h_format.affiliateDiscounts( req.auth, req.query.affiliate, backAffiliateService );
        let format_cart     = await cartObjectByAction( req, req.auth.user?._id || null, req.auth.user.customer?._id || null, req.auth?.discounts || [], req.body.action, req.body.products, req.body.product_origin );
        
        if( setting_result.success && setting_result.body && affiliate_result.success && format_cart.success ){
            
            let cart_products   = req.body.product_origin === 'cart' ? format_cart.body.cart.products.front_end : format_cart.body.save_later.products.front_end;
            let find_query      = { marketplace: req.auth.marketplace, shopify_id: { $nin: cart_products.map( (item) => item.product_id ) } };
            if( ['wholesale', 'app-wholesale'].includes( req.auth.application_type ) ){
                
                find_query['brand.handle'] = { $in: h_format.discountOnlyBrands( req.auth.discounts ) };
            }
            let product_result  = await backProductService.find(find_query, { variants: 0, skus: 0, variant_titles: 0, additional_content: 0, published_at: 0, updated_at: 0, deleted_at: 0, delete: 0, status: 0, status_created: 0 }, { default_sort: 1 }, { limit: 8 });
            if( product_result.success && product_result.body.length > 0 ){
                
                product_result.body = product_result.body.reduce( (previous_item, current_item) => {
                    
                    let exist_discount  = h_format.getDiscountBrand( req.auth.application_type, req.auth.discounts, current_item.brand?.handle );
                    let discounts       = {
                        brand       : h_validation.evalFloat( exist_discount?.value, null ), 
                        affiliate   : affiliate_result.body.discount,
                        product     : 0 
                    };
                    let format_product = h_format.productCollectionObject( current_item, discounts );
                    
                    if( format_product.success ){
                        
                        previous_item.push( format_product.body );
                    }
                    return previous_item;
                }, []);
                res.status(200).json( h_response.request( true, product_result.body, 200, "Success: Best Seller Collection find", "Best Seller Collection found" ) );
            }
            else {
                
                res.status(400).send( h_response.request( false, product_result, 400, "Error: Best Seller Collection find", "Best Seller Collection not found" ) );
            }
        }
        else if( !format_cart.success ){
            
            res.status(400).send( format_cart );
        }
        else {
            
            res.status(400).send( h_response.request( false, setting_result, 400, "Error: Product find", "General Settings not found" ) );
        }
    } catch (process_error) {
        
        res.status(400).send( h_response.request( false, process_error, 400, "Error: Best Seller Collection find", "Best Seller Collection not process" ) );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
* @param {*} format_cart 
*/
async function updateCart(user_id, customer_id, format_cart){
    
    try {
        let cart_updated = await backCartService.update( user_id ? { user: user_id } : { customer: customer_id }, { products: format_cart.body.cart.products.data_base, save_later: format_cart.body.save_later.products.data_base, coupon: format_cart.body.coupon } );
        
        if( cart_updated.success && cart_updated.body ){
            
            format_cart.body = {
                exist_cart: format_cart.body.exist_cart,
                coupon: format_cart.body.coupon,
                cart: {
                    products: format_cart.body.cart.products.front_end,
                    details: format_cart.body.cart.details
                },
                save_later: {
                    products: format_cart.body.save_later.products.front_end,
                    details: format_cart.body.save_later.details
                },
                update_product_cart: format_cart.body.update_product_cart
            }
            return format_cart;
        }
        else{
            
            return h_response.request( false, cart_updated, 400, "Error: Cart update", "Cart not updated" );
        }
    } catch (process_error) {
        
        return h_response.request( false, process_error, 400, "Error: Cart update", "Cart not updated" );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
* @param {*} format_cart 
*/
async function createCart(req, format_cart){
    try {
        let cart_created = await backCartService.create({ user: req.auth.user._id, customer: req.auth.user.customer._id, products: format_cart.body.cart.products.data_base, save_later: format_cart.body.save_later.products.data_base, coupon: format_cart.body.coupon });
        
        if( cart_created.success && cart_created.body ){
            
            format_cart.title = "Success: Cart create";
            format_cart.message = "Cart was successfully created";
            format_cart.body = {
                exist_cart: format_cart.body.exist_cart,
                coupon: format_cart.body.coupon,
                cart: {
                    products: format_cart.body.cart.products.front_end,
                    details: format_cart.body.cart.details
                },
                save_later: {
                    products: format_cart.body.save_later.products.front_end,
                    details: format_cart.body.save_later.details
                },
                update_product_cart: format_cart.body.update_product_cart
            }
            return format_cart;
        }
        else{
            
            return h_response.request( false, cart_created, 400, "Error: Cart create", "Cart not created" );
        }
    } catch (process_error) {
        
        return h_response.request( false, process_error, 400, "Error: Cart create", "Cart not created" );
    }
};
// =============================================================================
// GENERAL FUNCTIONS
// =============================================================================
async function createCartFile(res, customer_name, data_file){
    
    let format_file = await excel.createFile( `${ customer_name } - Cart List`, '/documents/templates/excel/format-cart.xlsx', data_file, 'A1', 3, formatBodyCartFile, null, null );
    if( format_file.success ){
        
        res.status(200).json( h_response.request( true, format_file, 200, "Success: Download File", "Cart List File downloaded" ) );
    }
    else{
        
        format_file.title = "Error: Download File";
        format_file.message = "Cart List File not downloaded";
        
        res.status(400).send( format_file );
    }
}
/**
* 
* @param {*} data_template 
* @param {*} template_file { item_sheet, first_reg, arr_columns, index_col, column } 
* @param {*} data_file { file, data_sheet, index_data, item_data }
* @param {*} format_currency { locale, code }
* @returns 
*/
async function formatBodyCartFile( data_template, template_file, data_file, format_currency ){
    
    let formula_excel = null;
    let index_row = parseInt( template_file.first_reg );
    let cell_file = `${ template_file.column }${ index_row + data_file.index_data }`;
    let cell_template = `${ template_file.column }${ template_file.first_reg }`;
    let item_file = data_file.item_data.row.columns.find( (item) => item.index_column === template_file.index_col );
    
    if( item_file ){
        
        data_template.Sheets[template_file.item_sheet][cell_file] = excel.addCell( data_template, data_template.Sheets[template_file.item_sheet][cell_template], item_file.value, format_currency, formula_excel );
    }
    
    return data_template;
};
/**
* 
* @param {*} req 
* @param {*} res 
* @param {*} action_cart 
*/
async function actionCart(req, res, action_cart){
    
    let data_products   = req.body.products;
    let preorders       = data_products.filter( (item) => item.preorder > 0 );
    
    if( preorders.length > 0 ){
        
        await addPreorder(req, preorders, ( !req.auth.token?.access.is_app && req.auth?.user ? null : ( req.auth.user.customer?._id || null ) ) );
    }
    let format_cart = await cartObjectByAction( req, req.auth.user._id || null, req.auth.user.customer?._id || null, req.auth?.discounts || [], action_cart, data_products);
    
    if( format_cart.success && format_cart.body.exist_cart === true && action_cart.indexOf('-nav') < 0 ){
        
        let cart_updated = await updateCart( req.auth.user._id || null, req.auth.user.customer?._id || null, format_cart );
        if( cart_updated.success ){
            
            res.status(200).json( cart_updated );
        }
        else{
            
            res.status(400).send( cart_updated );
        }
    }
    else if( format_cart.success && req.auth.user._id && format_cart.body.exist_cart === false && action_cart.indexOf('-nav') < 0 ){
        
        let cart_created = await createCart( req, format_cart );
        if( cart_created.success ){
            
            res.status(200).json( cart_created );
        }
        else{
            
            res.status(400).send( cart_created );
        }
    }
    else if( format_cart.success && action_cart.indexOf('-nav') >= 0 ){

        format_cart.body = {
            exist_cart: format_cart.body.exist_cart,
            coupon: format_cart.body.coupon,
            cart: {
                products: format_cart.body.cart.products.front_end,
                details: format_cart.body.cart.details
            },
            save_later: {
                products: format_cart.body.save_later.products.front_end,
                details: format_cart.body.save_later.details
            },
            update_product_cart: format_cart.body.update_product_cart
        };
        res.status(200).json( format_cart );
    }
    else {
        
        res.status(400).send(format_cart);
    }
};
/**
* 
* @param {*} req 
* @param {*} user_id 
* @param {*} customer_id 
* @param {*} all_discounts 
* @param {*} action 
* @param {*} array_products 
* @returns 
*/
async function cartObjectByAction( req, user_id, customer_id, all_discounts = [], action = 'list-products', array_products = [], origin = null ){
    
    try {
        let cart_fields = null;
        if( origin === 'cart' ){
            cart_fields = { save_later: 0 };
        }
        else if( origin === 'save_later' ){
            cart_fields = { products: 0 };
        }
        let cart_result         = action.indexOf('-nav') < 0 ? await backCartService.findOne( user_id ? { user: user_id } : { customer: customer_id }, cart_fields ) : { success: true, body: { products: [] } };
        let affiliate_result    = await h_format.affiliateDiscounts( req.auth, req.query.affiliate, backAffiliateService );
        
        if( cart_result.success && cart_result.body && affiliate_result.success ){
            
            let cart_products   = h_validation.evalArray( cart_result.body?.products, [] );
            let cart_save_later = h_validation.evalArray( cart_result.body?.save_later, [] );
            let cart_coupon     = h_validation.evalObject( cart_result.body?.coupon, null );

            if( action.indexOf('-nav') >= 0 ){
                cart_products   = req.body.cart.map( (item) => {

                    return {
                        product_id  : parseInt( item.split(':')[0] ),
                        variant_id  : parseInt( item.split(':')[1] ),
                        quantity    : parseInt( item.split(':')[2] ),
                        origin      : 'cart'
                    };
                });
                console.log( array_products );
                array_products = array_products.map( (item) => {

                    item.origin = 'cart';
                    return item;
                });
            }
            if( !['list-products'].includes(action) ){
                
                let update_products = h_format.actionsCart( cart_products, cart_save_later, action.replace('-nav', ''), array_products );
                
                cart_products       = update_products.db_cart;
                cart_save_later     = update_products.db_save_later;
            }
            console.log( cart_products );
            let id_products = h_array.sort( cart_products.concat( cart_save_later ), 'product_id' ).reduce( (previous_item, current_item) =>{ 
                
                if( previous_item.length === 0 || previous_item[previous_item.length - 1] != current_item.product_id ){ 
                    
                    previous_item.push( current_item.product_id ); 
                } 
                return previous_item; 
            }, []);
            let product_result = await backProductService.find({ marketplace: req.auth.marketplace, shopify_id: { $in: id_products }, status: 'active' });
            
            if( product_result.success ){
                
                if( cart_coupon && ( ( cart_coupon?.limitTimes > 0 && cart_coupon?.usedTimes === cart_coupon?.limitTimes ) || ( cart_coupon?.expireDate != null && cart_coupon?.expireDate < new Date() ) ) ){
                    
                    cart_coupon = null;
                }
                let format_cart = h_format.cartObject( req.auth.application_type, array_products, { affiliate: affiliate_result.body, brand_discounts: all_discounts, coupon: cart_coupon, db_products: product_result.body, db_cart: cart_products, db_save_later: cart_save_later } );
                
                if( action != null ){
                    
                    format_cart.body.exist_cart = cart_result.body != null;
                }
                return format_cart;
            }
            else{
                
                return h_response.request( false, product_result, 400, "Error: Cart find", "Cart products not found" );
            }
        }
        else if( !affiliate_result.success ){
            
            return h_response.request( false, affiliate_result, 400, "Error: Cart find", "Affiliate not found" );
        }
        else{
            
            return h_response.request( false, cart_result, 400, "Error: Cart find", "Cart not found" );
        }
    } catch (process_error) {
        
        return h_response.request( false, process_error, 400, "Error: Cart find", "Cart not process" );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
* @param {*} preorders 
*/
async function addPreorder(req, preorders, customer_id){
    
    return new Promise( async (resolve, reject) => {
        
        let agent_result    = await agentUserService.findOne({ email: req.auth.user.customer.agent_email });
        let customer_result = customer_id ? await backCustomerService.findOne({ _id: customer_id }) : { success: true, body: null };
        
        if( agent_result.success && ( !customer_id || ( customer_id && customer_result.success && customer_result.body ) ) ){
            
            let preorder_count = await backPreorderService.count();
            
            if( preorder_count.success && preorder_count.body ){
                
                let preorder_data   = {
                    marketplace: req.auth.marketplace,
                    name: `PLN-PRE-${ h_format.numberString( preorder_count.body + 1 ) }`,
                    number: preorder_count.body + 1,
                    store_code: "PLN-US",
                    created_at: new Date(),
                    updated_at: new Date()
                };
                let preorder_items  = preorders.map( (item_product) => {
                    
                    let new_p_item = {...preorder_data};
                    new_p_item.customer_id  = req.auth.user.customer.shopify_id;
                    new_p_item.product_id   = item_product.product_id;
                    new_p_item.variant_id   = item_product.variant_id;
                    new_p_item.sku          = item_product.sku;
                    new_p_item.quantity     = item_product.preorder;
                    
                    return new_p_item;
                });
                
                let preorder_items_created = await backPreorderItemService.createMany( preorder_items );
                if( preorder_items_created.success && preorder_items_created.body.length > 0 ){
                    
                    preorder_data.customer      = req.auth.user.customer._id;
                    preorder_data.line_items    = preorder_items_created.body.map( (item) => item._id );
                    
                    let preorder_created = await backPreorderService.create( preorder_data );
                    
                    if( preorder_created.success && preorder_created.body && agent_result.body ){
                        
                        await notificationPreorder( agent_result.body, customer_id, customer_result.body, req.auth.user.customer, preorder_created.body, req.auth.user.customer );
                    }
                }
            }
        }
        resolve( true );
    });
};
/**
* 
* @param {*} agent_customer 
* @param {*} customer_id 
* @param {*} db_customer 
* @param {*} auth_customer 
* @param {*} preorder_item 
*/
async function notificationPreorder( agent_customer, customer_id, db_customer, auth_customer, preorder_item ){
    
    let agent_supports = h_validation.evalArray( agent_customer.agentSupports ).reduce( (previous_item, current_item) => { 
        
        if( current_item.notifications ){ 
            
            previous_item.push( {
                id: current_item.agent_id._id.toString(),
                name: current_item.agent_id.name,
                email: current_item.agent_id.email,
                support: true
            } ); 
        } 
        return previous_item;
    }, [] );
    let notify_agents = [
        {
            id: agent_customer._id.toString(),
            name: agent_customer.name,
            email: agent_customer.email,
            support: false
        }
    ].concat( agent_supports );
    
    let body_notification = {
        data: {
            module  : "preorder",
            ids     : [ preorder_item._id.toString() ],
            customer: {
                id      : customer_id ? db_customer._id.toString() : auth_customer._id.toString(),
                name    : customer_id ? db_customer.full_name      : auth_customer.full_name,
                email   : customer_id ? db_customer.email          : auth_customer.email
            },
            agents  : notify_agents,
            body    : {
                type    : "create",
                list    : [
                    {
                        id              : preorder_item._id.toString(),
                        preorder_name   : preorder_item.name,
                        items           : preorder_item.line_items.map((line_item) => {
                            return{
                                sku                 : line_item.sku,
                                preorder_name       : preorder_item.name,
                                quantity            : line_item.quantity,
                                stock               : 0,
                                date                : preorder_item.created_at,
                                url_preorder_agent  : "",
                                url_preorder_store  : "https://shop.com/account/dashboard/preorders",
                                status              : line_item.life_stage
                            }
                        })
                    }
                ]
            }
        }
    };
    await agent.post.sendNotificationPre-order( body_notification ).catch( (error) => { console.log( error ); }); 
};
// =============================================================================
// EXPORTS
// =============================================================================
module.exports = {
    get:{
        downloadCartFile
    },
    post:{
        checkoutOrder,
        listAddBestSellers,
        products,
        productsNav,
        deleteCartFile,
        chargeProducts,
        advancePreorder,
        completePreorder
    },
    put:{
        addProductCart,
        addProductCartNav,
        updateProduct,
        updateProductNav,
        removeProductCart,
        removeProductCartNav,
        addSaveLater,
        updateSaveLater,
        removeSaveLater,
        deleteSaveLater,
        addCouponCode
    },
    delete:{
    }
};