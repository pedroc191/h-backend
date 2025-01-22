// =============================================================================
// PACKAGES
// =============================================================================
// =============================================================================
// HELPERS
// =============================================================================
const h_response = require('../../../helpers/response');
const h_format = require('../../../helpers/format');
const h_validation = require('../../../helpers/validation');
const h_array = require('../../../helpers/array');
// =============================================================================
// SERVICES
// =============================================================================
const {
    backPreorderItemService,
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
async function listProducts(req, res) {
    
    try {
        let affiliate_result = await h_format.affiliateDiscounts( req.auth, req.query.affiliate, backAffiliateService );
        let preorder_item_result = await backPreorderItemService.find({ customer_id: req.auth.user.customer.shopify_id, life_stage: { $in: ['pending', 'open'] } })
        if( preorder_item_result.success && affiliate_result.success ){
            
            let variants_result = await backProductVariantService.find({ shopify_id: { $in: [...new Set(preorder_item_result.body.map( (item) => item.variant_id ))] }, status_created: 'active', status: 'active' });
            let product_result = await backProductService.find({ shopify_id: { $in: [...new Set(preorder_item_result.body.map( (item) => item.product_id ))] }, status_created: 'active', status: 'active' },{ variants: 0 });
            
            if( variants_result.success && product_result.success ){
                
                let preorder_products = [];
                for (const item_preorder of preorder_item_result.body) {
                    
                    let db_variant = variants_result.body.find( (item) => item.shopify_id === item_preorder.variant_id );
                    
                    if( db_variant ){
                        
                        let db_product = product_result.body.find( (item) => item.shopify_id === db_variant.product_id );
                        
                        if( db_product ){
                            
                            let discount_product    = h_format.getDiscountBrand( req.auth.application_type, req.auth.discounts, db_product.brand?.handle );
                            discount_product        = discount_product ? discount_product.value : null;
                            
                            if( discount_product ){
                                
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
                                db_variant.quantity             = item_preorder.quantity;
                                db_variant.inventory_quantity   = inventory_variant;
                                db_product.discounts            = discounts;
                                let format_item                 = h_format.cartItemsObject( db_product, db_variant );
                                
                                if( format_item.success ){
                                    
                                    format_item.body.front_end.life_stage    = item_preorder.life_stage;
                                    format_item.body.front_end.origin        = "preorder";
                                    preorder_products.push(  format_item.body.front_end );
                                }
                            }
                        }
                    }
                }
                res.status(200).json( h_response.request( true, h_array.sort( preorder_products, 'life_stage' ), 200, "Success: Preorder Products find", "Preorder Products found" ) );
            }
            else{
                
                let process_error = [ variants_result, product_result ].find( (item) => !item.success );
                res.status(400).send( h_response.request( false, process_error, 400, "Error: Preorder Products find", "Preorder Products not found, Products not found" ) );
            }
        }
        else{
            let process_error = [ preorder_item_result, affiliate_result ].find( (item) => !item.success );
            
            res.status(400).send( h_response.request( false, process_error, 400, "Error: Preorder Products find", "Preorder Products not found, Preorder Items not found" ) );
        }
    } catch (process_error) {
        
        res.status(400).send( h_response.request( false, process_error, 400, "Error: Preorder Products find", "Preorder Products not found" ) );
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
        listProducts
    },
    post:{
    },
    put:{
    },
    delete:{
    }
};