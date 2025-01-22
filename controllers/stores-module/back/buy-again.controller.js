// =============================================================================
// PACKAGES
// =============================================================================
// =============================================================================
// HELPERS
// =============================================================================
const h_format      = require('../../../helpers/format');
const h_array       = require('../../../helpers/array');
const h_validation  = require('../../../helpers/validation');
const h_response    = require('../../../helpers/response');
// =============================================================================
// SERVICES
// =============================================================================
const {
    backBuyAgainService,
    backProductVariantService,
    backProductService,
    backAffiliateService,
} = require('../../../services/manager');
// =============================================================================
// REST FUNCTIONS
// =============================================================================
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function storeCustomerProducts(req, res) {
    
    try {
        let affiliate_result = await h_format.affiliateDiscounts( req.auth, req.query.affiliate, backAffiliateService );
        let buy_again_result = await backBuyAgainService.findOne({ customer_id: req.auth.user.customer.shopify_id });
        
        if( buy_again_result.success && buy_again_result.body && affiliate_result.success ){
                
            let variants_result = await backProductVariantService.find({ shopify_id: { $in: buy_again_result.body.variant_products.map( (item) => item.variant_id ) }, status_created: 'active', status: 'active' });

            if( variants_result.success && variants_result.body.length > 0 ){
    
                let product_result = await backProductService.find({ shopify_id: { $in: [...new Set(variants_result.body.map( (item) => item.product_id ))] }, status_created: 'active', status: 'active' },{ variants: 0 });
                if( product_result.success && product_result.body.length > 0 ){
    
                    let sort_products = [];
                    
                    for (const item_variant of buy_again_result.body.variant_products) {
                            
                        let db_variant          = variants_result.body.find( (item) => item.shopify_id === item_variant.variant_id );
                        db_variant              = db_variant ? db_variant : null;
                        let db_product          = db_variant ? product_result.body.find( (item) => item.shopify_id === db_variant.product_id ) : null;
                        let discount_product    = h_format.getDiscountBrand( req.auth.application_type, req.auth.discounts, db_product?.brand?.handle );
                        if( db_product != null && db_variant != null && discount_product ){
    
                            let inventory_variant   = db_product.max_stock > 0 && db_product.max_stock < db_variant.inventory_quantity ? db_product.max_stock : db_variant.inventory_quantity;
                            let discounts           = {
                                brand       : h_validation.evalFloat( discount_product?.value, null ), 
                                affiliate   : affiliate_result.body.discount,
                                product     : 0
                            };
                            if( db_product.config_bundle?.config_pre_sale && ( db_product.config_bundle.config_pre_sale.enable_after || ( moment(db_product.config_bundle.config_pre_sale.started_at.split('T')[0]).startOf('day').diff(moment(), 'seconds') < 0 && moment(db_product.config_bundle.config_pre_sale.ended_at.split('T')[0]).endOf('day').diff(moment(), 'seconds') > 0 ) ) ){
                                        
                                discounts.pre_sale = db_product.config_bundle.config_pre_sale.discount || 0;
                            }
                            if( db_product.config_pre_sale && ( db_product.config_pre_sale.enable_after || ( moment(db_product.config_pre_sale.started_at.split('T')[0]).startOf('day').diff(moment(), 'seconds') < 0 && moment(db_product.config_pre_sale.ended_at.split('T')[0]).endOf('day').diff(moment(), 'seconds') > 0 ) ) ){
                                        
                                discounts.pre_sale = db_product.config_pre_sale.discount || 0;
                            }
                            db_variant.quantity             = 0;
                            db_variant.inventory_quantity   = inventory_variant;
                            db_product.discounts            = discounts;
                            let format_item                 = h_format.cartItemsObject( db_product, db_variant );
                            
                            if( format_item.success ){
    
                                format_item.body.front_end.date_last_purchase    = item_variant.date_last_purchase;
                                format_item.body.front_end.total_purchase        = item_variant.total_purchase;
                                format_item.body.front_end.origin                = "buy_again";
                                sort_products.push( format_item.body.front_end );
                            }
                        }
                    }
                    let sort = h_validation.evalString( req.query.sort );
                    sort = sort === null ? null : sort === 'last_purchase' ? 'date_last_purchase' : 'total_purchase';
                    
                    let sort_direction = h_validation.evalString( req.query.sort_direction );
                    sort_direction = sort_direction === null ? null : sort_direction === 'asc' ? true : false;
                    
                    res.status(200).json( h_response.request( true, h_array.sort( sort_products, sort, sort_direction ), 200, "Success: Buy Again find", "Buy Again found" ) );
                }
                else {
    
                    res.status(400).send( h_response.request( false, product_result, 400, "Error: Buy Again find", "Product not found" ) );
                }
            }
            else {
                
                res.status(400).send( h_response.request( false, variants_result, 400, "Error: Buy Again find", "Product Variant not found" ) );
            }
        }
        else{
            
            res.status(400).send( h_response.request( false, buy_again_result, 400, "Error: Buy Again find", "Buy Again not found" ) );
        }
    } catch (process_error) {
        
        res.status(400).send( h_response.request( false, process_error, 400, "Error: Buy Again find", "Error in process" ) );
    }
};
// =============================================================================
// GENERAL FUNCTIONS
// =============================================================================
// =============================================================================
// EXPORTS
// =============================================================================
module.exports = {
    get:{
        storeCustomerProducts
    },
    post:{
    },
    put:{
    },
    delete:{
    }
};