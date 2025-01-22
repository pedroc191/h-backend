// =============================================================================
// PACKAGES
// =============================================================================
const moment        = require('moment');
const bcrypt        = require('bcrypt');
// =============================================================================
// HANDLERS
// =============================================================================
const h_format 	    = require('./format');
const h_validation  = require('./validation');
const h_array       = require('./array');
// =============================================================================
// SERVICES
// =============================================================================
const shopify   = require('../services/marketplace/shopify');
const billing   = require('../services/2b-apps/billing');
const agent     = require('../services/2b-apps/agent');
// =============================================================================
// GENERAL FUNCTIONS
// =============================================================================
/**
 * 
 * @param {*} update_document 
 * @param {*} new_document 
 * @param {*} old_document 
 * @param {*} shopify_field 
 * @param {*} data_base_field 
 * @returns 
 */
function evalUpdateShopifyField( update_document, new_document, old_document, shopify_field, data_base_field ){
    
    if( ['created_at','updated_at','deleted_at', 'published_at'].includes(shopify_field) && ( !old_document || old_document && h_format.shopifyDate( new_document[shopify_field] ).toISOString() != old_document[data_base_field] ) ){
        
        update_document[data_base_field] = new_document[shopify_field] != null ? h_format.shopifyDate( new_document[shopify_field] ) : null;
        update_document.changes += 1;
    }
    else if( shopify_field === 'phone' && ( !old_document || (old_document && new_document[shopify_field] != old_document[data_base_field]?.number ) ) ){
        
        if( new_document[shopify_field] ){
            
            new_document[shopify_field] = h_format.phoneShopify( new_document, new_document[shopify_field] );
        }
        update_document[data_base_field] = h_format.phoneNumber( new_document[shopify_field] );
        update_document.changes += 1;
    }
    else if( !['created_at','updated_at','deleted_at'].includes(shopify_field) && ( !old_document || (old_document && new_document[shopify_field] != old_document[data_base_field] ) ) ){
        
        if( shopify_field === 'inventory_quantity' ){
            
            update_document[data_base_field] = h_validation.evalInt( new_document[shopify_field] );
            update_document[data_base_field] = update_document[data_base_field] < 0 ? 0 : update_document[data_base_field];
        }
        else if( ['price', 'compare_at_price'].includes( shopify_field ) ){
            
            update_document[data_base_field] = h_validation.evalFloat( new_document[shopify_field] );
        }
        else if( shopify_field === 'src' ){
            
            update_document[data_base_field] = resizeUrlImage( new_document[shopify_field] );
        }
        else if( typeof new_document[shopify_field] === 'string' ){
            
            update_document[data_base_field] = new_document[shopify_field].trim();
        }
        else if( typeof new_document[shopify_field] === 'number' ){
            
            if (new_document[shopify_field] % 1 === 0) {
                update_document[data_base_field] = h_validation.evalInt( new_document[shopify_field] );
            }
            else{
                update_document[data_base_field] = h_validation.evalFloat( new_document[shopify_field] );
            }
        }
        else{
            
            update_document[data_base_field] = new_document[shopify_field];
        }
        update_document.changes += 1;
    }
    return update_document;
};
/**
* 
* @param {*} id_marketplace 
* @param {*} item_customer 
* @param {*} item_agent 
* @param {*} db_customer 
* @param {*} next_nit 
* @param {*} new_document 
* @returns 
*/
function customerObject(id_marketplace, item_customer, item_agent, db_customer = null, next_nit = null, new_document = false){
    
    let format_document = {
        changes: 0
    };
    if( process.env.UPDATE_EXIST_DATA === 'true' ){
        
        format_document.changes         += 1;
        format_document.addresses       = item_customer.addresses != null ? item_customer.addresses : [],
        format_document.addresses       = format_document.addresses.map( (item) => {
            
            return h_format.shopifyAddressObject( item );
        });
    }
    
    format_document = evalUpdateShopifyField( format_document, item_customer, db_customer, 'first_name', 'first_name' );
    format_document = evalUpdateShopifyField( format_document, item_customer, db_customer, 'last_name', 'last_name' );
    
    format_document = evalUpdateShopifyField( format_document, item_customer, db_customer, 'phone', 'phone' );
    format_document = evalUpdateShopifyField( format_document, item_customer, db_customer, 'note', 'note' );
    if( db_customer?.tags ){
        db_customer.tags = db_customer.tags.join(', ') || '';
    }
    format_document = evalUpdateShopifyField( format_document, item_customer, db_customer, 'tags', 'tags' );
    if( format_document.tags ){
        
        format_document.tags            = format_document.tags.split(', ');
        format_document.is_wholesale    = format_document.tags.includes('IS-WHOLESALE');
        format_document.is_storefront   = format_document.tags.includes('IS-STOREFRONT');
        format_document.is_affiliate    = format_document.tags.includes('IS-AFFILIATE');
    }
    let new_order_count = {
        changes: 0
    }
    new_order_count = item_customer.orders_count != db_customer?.orders_count?.total ? { total: item_customer.orders_count, changes: 1 } : { changes: 0 };
    if( new_order_count.changes > 0 ){
        format_document.changes         += 1;
        format_document.orders_count    = {
            total       : new_order_count.total ? new_order_count.total : h_validation.evalInt( item_customer.orders_count ), 
            last_year   : new_order_count.last_year ? new_order_count.last_year : h_validation.evalInt( db_customer?.orders_count?.last_year ), 
            current_year: new_order_count.current_year ? new_order_count.current_year : h_validation.evalInt( db_customer?.orders_count?.current_year ) 
        };
    }
    format_document = evalUpdateShopifyField( format_document, item_customer, db_customer, 'total_spent', 'total_spent' );
    format_document.updated_at = h_format.shopifyDate( item_customer.updated_at );
    
    if( new_document ){
        
        format_document.marketplace                 = id_marketplace;
        format_document.shopify_id                  = h_validation.evalInt( item_customer.id, null ); 
        format_document.email                       = h_validation.evalString( item_customer.email ) != null ? h_validation.evalString( item_customer.email ).toLowerCase() : null;
        
        format_document.agent                       = h_validation.evalObjectId( item_agent?._id );
        format_document.agent_email                 = h_validation.evalString( item_agent?.email );
        
        format_document.valid_moa                   = format_document.tags.includes('ignore_firstorder');
        format_document.tax_exempt                  = h_validation.evalBoolean( item_customer.tax_exempt, false);
        
        format_document.created_at                  = h_format.shopifyDate( item_customer.created_at );
        
        format_document.nit                         = next_nit.toString();
        format_document.shop                        = h_validation.evalObjectId( item_customer?.shop );
        format_document.language                    = h_validation.evalObjectId( item_customer?.language );
        format_document.type_business               = h_validation.evalObjectId( item_customer?.type_business );
        format_document.customer_type               = h_validation.evalObjectId( item_customer?.customer_type );
        format_document.product_category            = h_validation.evalObjectId( item_customer?.product_category );
        format_document.country                     = h_validation.evalString( item_customer?.country );
        format_document.state                       = h_validation.evalObjectId( item_customer?.state );
        
        format_document.birthday_date               = h_validation.evalDate( item_customer.birthday_date );
        format_document.check_terms_and_conditions  = h_validation.evalBoolean( item_customer.check_terms_and_conditions, true );
        format_document.initial_budget              = h_validation.evalString( item_customer.initial_budget );
        format_document.company_website             = h_validation.evalString( item_customer.company_website );
        format_document.instagram                   = h_validation.evalString( item_customer.instagram );
        format_document.source                      = h_validation.evalString( item_customer.source );
        
        format_document.google_add_id               = h_validation.evalString( item_customer.idGoogleAdd );
        format_document.origin_add                  = h_validation.evalString( item_customer.origin );
        format_document.utms                        = {
            utmSource	: h_validation.evalString( item_customer.utmSource ),
            utmMedium   : h_validation.evalString( item_customer.utmMedium ),
            utmCampaign	: h_validation.evalString( item_customer.utmCampaign ),
            utmTerm		: h_validation.evalString( item_customer.utmTerm ),
        };
        format_document.addresses       = item_customer.addresses != null ? item_customer.addresses : [],
        format_document.addresses       = format_document.addresses.map( (item) => {
            
            return h_format.shopifyAddressObject( item );
        });
        if( format_document.addresses.length > 0 && format_document.addresses.findIndex( (item) => item.default_shipping ) < 0 ){
            
            format_document.addresses[0].default_shipping = true;
        }
        return format_document;
    }
    else{
        
        if( format_document.changes > 0 ){
            
            delete format_document.changes;
            return { 
                query       : { 
                    marketplace : id_marketplace,
                    shopify_id  : h_validation.evalInt( item_customer.id, null ) 
                }, 
                query_user  : { 
                    marketplace : id_marketplace,
                    customer    : h_validation.evalObjectId( db_customer._id ) 
                }, 
                document    : format_document 
            };
        }
        else{
            
            return null;
        }
    }
};
/**
* 
* @param {*} id_marketplace 
* @param {*} user_data 
* @param {*} item_customer 
* @param {*} db_user 
* @param {*} new_document 
* @returns 
*/
function userObject(id_marketplace, user_data, item_customer, db_user, new_document = false){
    
    let format_document = {
        changes: 0
    };
    format_document = evalUpdateShopifyField( format_document, item_customer, db_user, 'first_name', 'first_name' );
    format_document = evalUpdateShopifyField( format_document, item_customer, db_user, 'last_name', 'last_name' );
    format_document = evalUpdateShopifyField( format_document, item_customer, db_user, 'email', 'email' );
    format_document.updated_at = h_format.shopifyDate( item_customer.updated_at );
    
    if( new_document ){
        
        format_document.marketplace     = id_marketplace;
        format_document.customer        = h_validation.evalObjectId( item_customer._id );
        format_document.role            = user_data.role;
        format_document.password        = h_validation.evalString( user_data.password, bcrypt.hashSync( '123456789', bcrypt.genSaltSync(8), null ) );
        format_document.created_at      = h_format.shopifyDate( item_customer.created_at );
        format_document.change_password = false;
        format_document.application_type= user_data.application_type;
    }
    else{
        
        if( format_document.changes > 0 ){
            
            delete format_document.changes;
            return { 
                query   : { 
                    marketplace : id_marketplace,
                    customer    : h_validation.evalObjectId( db_user.customer ) 
                }, 
                document: format_document 
            };
        }
        else{
            
            return null;
        }
    }
};
/**
* 
* @param {*} id_marketplace 
* @param {*} db_brand 
* @param {*} item_brand 
* @param {*} sku_parent 
* @param {*} languages 
* @param {*} new_document 
*/
function brandObject( id_marketplace, db_brand, item_brand, sku_parent, languages, new_document = false ){
    
    item_brand.logo             = null;
    item_brand.collection_url   = null;
    item_brand.updated_at       = new Date();
    
    let format_document = {
        changes: 0
    };
    format_document = evalUpdateShopifyField( format_document, item_brand, db_brand, 'name', 'name' );
    format_document = evalUpdateShopifyField( format_document, item_brand, db_brand, 'handle', 'handle' );
    format_document = evalUpdateShopifyField( format_document, sku_parent, db_brand, 'brand', 'tag' );
    
    let new_logo = {
        desktop: {
            category: 'image',
            sizes   : [360],
            changes : 0
        },
        mobile: {
            category: 'image',
            sizes   : [360],
            changes : 0
        },
        changes: 0
    };
    
    if( item_brand.logo ){
        
        new_logo.desktop    = evalUpdateShopifyField( new_logo.desktop , { alt: item_brand.name }               , db_brand, 'alt', 'name' );
        new_logo.desktop    = evalUpdateShopifyField( new_logo.desktop , { src: item_brand.logo?.desktop.src }  , db_brand.logo?.desktop, 'src', 'src' );
        
        new_logo.desktop    = evalUpdateShopifyField( new_logo.mobile  , { alt: item_brand.name }               , db_brand, 'alt', 'name' );
        new_logo.mobile     = evalUpdateShopifyField( new_logo.mobile  , { src: item_brand.logo?.mobile.src }   , db_brand?.logo?.mobile, 'src', 'src' );
        
        new_logo.changes    += ( new_logo.desktop.changes + new_logo.mobile.changes );
    }
    else{
        
        new_logo.changes += 1;
    }
    
    if( new_logo.changes > 0 && item_brand.logo ){
        format_document.logo = {
            desktop : { 
                category        : 'image',
                alt             : new_logo.desktop?.alt            || item_brand.name, 
                src             : new_logo.desktop?.src            || item_brand.logo?.mobile.src,
                width           : 320,
                height          : 320,
                sizes           : new_logo.desktop?.sizes
            },
            mobile  : { 
                category        : 'image',
                alt             : new_logo.mobile?.alt            || item_brand.name, 
                src             : new_logo.mobile?.src            || item_brand.logo?.mobile.src, 
                width           : 320,
                height          : 320,
                sizes           : new_logo.desktop?.sizes
            }
        };
        format_document.changes += 1;
    }
    else if( new_logo.changes > 0 ){
        format_document.logo = {
            desktop : { 
                shopify_id      : null,
                category        : null, 
                alt             : item_brand.name, 
                src             : null,
                src_collection  : null,
                width           : null,
                height          : null,
                sizes           : [1600, 1400, 1200]
            },
            mobile  : { 
                shopify_id      : null,
                category        : null, 
                alt             : item_brand.name, 
                src             : null,
                src_collection  : null,
                width           : null,
                height          : null,
                sizes           : [1000, 800, 700, 600]
            },
        };
        format_document.changes += 1;
    }
    format_document = evalUpdateShopifyField( format_document, item_brand, db_brand, 'collection_url', 'collection_url' );
    format_document.updated_at = h_format.shopifyDate( item_brand.updated_at );
    
    if( new_document ){
        
        format_document.marketplace = id_marketplace;
        format_document.created_at  = h_format.shopifyDate( new Date() );
        format_document.translate   = languages.reduce( (previous_item, current_item) => {
            
            previous_item.push({
                language        : current_item.key_code,
                name            : format_document.name,
                logo            : resizeUrlImage( format_document.logo ),
                is_translated   : false
            });
            return previous_item;
        }, []);
        
        return format_document;
    }
    else{
        
        if( format_document.changes > 0 ){
            
            return { 
                query   : { 
                    marketplace : id_marketplace,
                    _id         : h_validation.evalObjectId( db_brand._id ) 
                }, 
                document: format_document 
            };
        }
        else{
            
            return { _id: h_validation.evalObjectId( db_brand._id ) };
        }
    }
};
/**
* 
* @param {*} id_marketplace 
* @param {*} db_tag 
* @param {*} item_tag 
* @param {*} languages 
* @param {*} new_document 
* @returns 
*/
function tagObject( id_marketplace, db_tag, item_tag, languages, new_document = false ){
    
    item_tag.updated_at       = new Date();
    
    let format_document = {
        changes: 0
    };
    format_document = evalUpdateShopifyField( format_document, item_tag, db_tag, 'name', 'name' );
    format_document = evalUpdateShopifyField( format_document, item_tag, db_tag, 'handle', 'handle' );
    format_document = evalUpdateShopifyField( format_document, item_tag, db_tag, 'category', 'category' );
    format_document.updated_at = h_format.shopifyDate( item_tag.updated_at );
    
    if( new_document ){
        
        format_document.marketplace = id_marketplace;
        format_document.created_at  = h_format.shopifyDate( new Date() );
        format_document.translate   = languages.reduce( (previous_item, current_item) => {
            
            previous_item.push({
                language        : current_item.key_code,
                name            : format_document.name,
                is_translated   : false
            });
            return previous_item;
        }, []);
        
        return format_document;
    }
    else{
        
        if( format_document.changes > 0 ){
            
            return { 
                query   : { 
                    marketplace : id_marketplace,
                    _id         : h_validation.evalObjectId( db_tag._id ) 
                }, 
                document: format_document 
            };
        }
        else{
            
            return { _id: h_validation.evalObjectId( db_tag._id ) };
        }
    }
};
/**
* 
* @param {*} id_marketplace 
* @param {*} db_product_type 
* @param {*} item_product_type 
* @param {*} languages 
* @param {*} new_document 
*/
function productCategoryObject( id_marketplace, db_product_category, item_product_category, languages, new_document = false ){
    
    item_product_category.updated_at = new Date();
    
    let format_document = {
        changes: 0
    };
    format_document = evalUpdateShopifyField( format_document, item_product_category, db_product_category, 'name', 'name' );
    format_document = evalUpdateShopifyField( format_document, item_product_category, db_product_category, 'handle', 'handle' );
    format_document.updated_at = h_format.shopifyDate( item_product_category.updated_at );
    
    if( new_document ){
        
        format_document.marketplace = id_marketplace;
        format_document.created_at = h_format.shopifyDate( new Date() );
        format_document.translate  = languages.reduce( (previous_item, current_item) => {
            
            previous_item.push({
                language        : current_item.key_code,
                name            : format_document.name,
                is_translated   : false
            });
            return previous_item;
        }, []);
        
        return format_document;
    }
    else{
        
        if( format_document.changes > 0 ){
            
            return { 
                query   : { 
                    marketplace : id_marketplace,
                    _id         : h_validation.evalObjectId( db_product_category._id ) 
                }, 
                document: format_document 
            };
        }
        else{
            
            return { _id: h_validation.evalObjectId( db_product_category._id ) };
        }
    }
};
/**
* 
* @param {*} id_marketplace 
* @param {*} item_product 
* @param {*} db_variants 
* @param {*} general_settings 
* @param {*} new_document 
* @returns 
*/
function productObject(id_marketplace, item_product, db_variants, general_settings, languages, db_product = null, new_document = false) {
    
    let config_product = general_settings.config_product.find( (item) => item.category === item_product.config_product );
    if( db_product?.tags ){
        db_product.tags = db_product.tags.map( (item) => item.name ).join(', ') || '';
    }
    let format_document         = {
        changes: 0
    };
    let array_tags              = item_product.tags != '' ? h_validation.evalArray( item_product.tags?.split(', '), [] ) : [];
    
    let product_tags_config     = configProductTags( array_tags );
    
    let sort_category           = general_settings.sort_categories.findIndex( (item) => item.tags != null ? item.tags.find( (item_t) => product_tags_config.list.findIndex( (item_lt) => item_lt.name === item_t ) >= 0 ) : false );
    sort_category               = sort_category >= 0 ? sort_category : general_settings.sort_categories.length - 1;
    
    item_product.sort_category  = sort_category;
    
    let images                  = item_product.images === null ? [] : item_product.images.reduce( (previous_item, current_item, current_index) => { 
        
        let new_image = {
            changes: 0
        };
        new_image = evalUpdateShopifyField( new_image, current_item, db_product?.images ? db_product?.images[current_index] : null, 'id', 'shopify_id' );
        new_image = evalUpdateShopifyField( new_image, item_product, db_product?.images ? db_product?.images[current_index] : null, 'title', 'alt' );
        new_image = evalUpdateShopifyField( new_image, { src: current_item.src.split('?v=')[0] }, db_product?.images ? db_product?.images[current_index] : null, 'src', 'src' );
        if( new_image.src ){
            
            new_image.src_collection = resizeUrlImage( new_image.src, '320x320' );
        }
        new_image = evalUpdateShopifyField( new_image, current_item, db_product?.images ? db_product?.images[current_index] : null, 'width', 'width' );
        new_image = evalUpdateShopifyField( new_image, current_item, db_product?.images ? db_product?.images[current_index] : null, 'height', 'height' );
        previous_item.changes += new_image.changes;
        
        previous_item.data.push({
            desktop : { 
                category        : 'image',
                shopify_id      : new_image?.shopify_id     || ( db_product?.images ? db_product?.images[current_index].shopify_id : null ),
                alt             : new_image?.alt            || item_product.title, 
                src             : new_image?.src            || ( db_product?.images ? db_product?.images[current_index].src : null ),
                src_collection  : new_image?.src_collection || ( db_product?.images ? db_product?.images[current_index].src_collection : null ),
                width           : new_image?.width          || ( db_product?.images ? db_product?.images[current_index].width : null ),
                height          : new_image?.height         || ( db_product?.images ? db_product?.images[current_index].height : null ),
                sizes           : [1600, 1400, 1200]
            },
            mobile  : { 
                category        : 'image',
                shopify_id      : new_image?.shopify_id     || ( db_product?.images ? db_product?.images[current_index].shopify_id : null ),
                alt             : new_image?.alt            || item_product.title, 
                src             : new_image?.src            || ( db_product?.images ? db_product?.images[current_index].src : null ), 
                src_collection  : new_image?.src_collection || ( db_product?.images ? db_product?.images[current_index].src_collection : null ),
                width           : new_image?.width          || ( db_product?.images ? db_product?.images[current_index].width : null ),
                height          : new_image?.height         || ( db_product?.images ? db_product?.images[current_index].height : null ),
                sizes           : [1000, 800, 700, 600]
            }
        });
        return previous_item;
    }, { changes: 0, data: [] });
    let product_options         = item_product.options === null ? [] : h_array.sort( item_product.options, 'name' ).reduce( (previous_item_option, current_item_option, current_index_option) => { 
        let new_option = { 
            changes: 0
        };
        let current_handle_option = h_format.slug( current_item_option.name );
        new_option = evalUpdateShopifyField( new_option, current_item_option, db_product?.options ? db_product?.options[current_index_option] : null, 'name', 'name' );
        if( new_option.name ){
            new_option.handle = current_handle_option;
        }
        let new_option_values  = ( current_handle_option === 'size' ? sortSizeOptions( current_item_option.values, general_settings.sort_sizes ) : current_item_option.values ).reduce( (previous_item_option_value, current_item_option_value, current_index_option_value) => { 
            let new_option_value = { 
                changes: 0
            };
            new_option_value = evalUpdateShopifyField( new_option_value, { name: current_item_option_value }, db_product?.options ? db_product?.options[current_index_option]?.values[current_index_option_value] : null, 'name', 'name' );
            if( new_option_value.name ){
                new_option_value.handle = `${ current_handle_option }-${ h_format.slug( new_option_value.name ) }`;
            }
            let total_stock_value = 0;
            new_option_value.skus       = ( db_variants.changes > 0 ? db_variants.options : db_product?.variants ).reduce( (previous_item_variant, current_item_variant, current_index_variant) =>{
                
                if( current_item_variant.options[current_index_option].value === current_item_option_value ){
                    
                    let new_variant = {
                        changes: 0
                    }
                    new_variant     = evalUpdateShopifyField( new_variant, current_item_variant, { sku: ( db_variants.changes > 0 ? db_variants.options : db_product?.variants )[current_index_variant] }, 'sku', 'sku' );
                    total_stock_value     += current_item_variant.inventory_quantity;
                    
                    previous_item_option.changes   += new_variant.changes;
                    
                    previous_item_variant.push( new_variant?.sku || current_item_variant.sku );
                }
                return previous_item_variant;
            }, []);
            new_option_value                = evalUpdateShopifyField( new_option_value, { total_stock: total_stock_value }, db_product?.options ? db_product?.options[current_index_option]?.values[current_index_option_value] : null, 'total_stock', 'total_stock' );
            new_option_value.total_stock    = total_stock_value;
            previous_item_option_value.total_stock += total_stock_value;
            previous_item_option.changes    += new_option_value.changes;
            
            new_option_value                = {
                name        : new_option_value?.name || current_item_option_value,
                handle      : new_option_value?.handle || `${ current_handle_option }-${ h_format.slug( current_item_option_value ) }`,
                skus        : new_option_value.skus,
                total_stock : new_option_value.total_stock
            };
            if( current_handle_option === 'color' ){
                
                new_option_value.url = `/images/products/colors/${ new_option_value.handle }.webp`;
            }
            previous_item_option_value.values.push( new_option_value );
            
            return previous_item_option_value;
        }, { total_stock: 0, values: [] });
        previous_item_option.changes += new_option.changes;
        previous_item_option.data.push({
            name        : new_option?.name || current_item_option.name,
            handle      : new_option?.handle || current_handle_option,
            values      : new_option_values.values,
            total_stock : new_option_values.total_stock
        });
        return previous_item_option;
    }, { changes: 0, data: [] });
    
    format_document             = evalUpdateShopifyField( format_document, item_product         , db_product, 'title'           , 'title' );
    format_document             = evalUpdateShopifyField( format_document, item_product         , db_product, 'product_origin'  , 'product_origin' );
    format_document             = evalUpdateShopifyField( format_document, item_product         , db_product, 'body_html'       , 'description' );
    format_document             = evalUpdateShopifyField( format_document, item_product         , db_product, 'handle'          , 'handle' );
    
    format_document             = evalUpdateShopifyField( format_document, item_product         , db_product, 'tags'            , 'tags' );
    
    format_document             = evalUpdateShopifyField( format_document, item_product         , db_product, 'vendor'          , 'brand' );
    
    format_document             = evalUpdateShopifyField( format_document, item_product         , db_product, 'product_type'    , 'product_category' );
    
    format_document             = evalUpdateShopifyField( format_document, item_product         , db_product, 'sort_category'   , 'sort_category' );
    
    format_document             = evalUpdateShopifyField( format_document, product_tags_config  , db_product, 'max_stock'       , 'max_stock' );
    format_document             = evalUpdateShopifyField( format_document, product_tags_config  , db_product, 'moq'             , 'moq' );
    format_document             = evalUpdateShopifyField( format_document, product_tags_config  , db_product, 'sales_limit'     , 'sales_limit' );
    format_document             = evalUpdateShopifyField( format_document, item_product         , db_product, 'published_at'    , 'published_at' );
    format_document             = evalUpdateShopifyField( format_document, item_product         , db_product, 'status'          , 'status_created' );
    
    if( format_document.tags ){
        
        format_document.tags = product_tags_config.list;
    }
    if( images.changes > 0 ){
        
        format_document.images = images.data;
        format_document.changes += 1;
    }
    if( format_document.brand != '' ){
        format_document.brand = { 
            name: h_validation.evalString( format_document.brand ), 
            handle: h_format.slug( format_document.brand ) 
        };
    }
    else {
        format_document.brand = null;
    }
    if( format_document.product_category != '' ){
        format_document.product_category = { 
            name: h_validation.evalString( format_document.product_category ), 
            handle: h_format.slug( format_document.product_category ) 
        };
    }
    else {
        format_document.product_category = null;
    }
    if( product_options.changes > 0 ){
        format_document.options = product_options.data;
        format_document.changes += 1;
    }
    if( db_variants.changes > 0 ) {
        
        format_document.discounts   = {
            brand       : null,
            stock       : { apply: false, min_stock: 0, value: 0 },
            affiliate   : 0, 
            product     : 0, 
            pre_sale    : 0,
        };
        format_document.variants            = db_variants ? db_variants.variants        : [];
        format_document.variant_titles      = db_variants ? db_variants.variant_titles  : [];
        format_document.total_stock         = db_variants ? db_variants.total_stock     : 0;
        format_document.total_weight        = db_variants ? db_variants.total_weight    : 0;
        format_document.sku_parent          = db_variants ? db_variants.sku_parent      : null;
        format_document.price               = {
            min_price   : db_variants ? h_validation.evalFloat( db_variants.min_price ) : 0, 
            max_price   : db_variants ? h_validation.evalFloat( db_variants.max_price ) : 0
        };
        format_document.compare_at_price    = {
            min_price   : db_variants ? h_validation.evalFloat( db_variants.min_compare_at_price ) : 0, 
            max_price   : db_variants ? h_validation.evalFloat( db_variants.max_compare_at_price ) : 0
        };
        format_document.changes             += 1;
    }
    if( db_variants.changes > 0 || format_document.title || format_document.handle || format_document.brand || format_document.product_category || format_document.tags ){
        
        format_document.search_field    = `${ item_product.title } ${ item_product.handle } ${ item_product.vendor } ${ item_product.product_type } ${ db_variants ? db_variants.skus.join(" ") : "" } ${ db_variants ? db_variants.variant_titles.join(" ") : "" } ${ array_tags.join(" ") }`;
        format_document.changes         += 1;
    }
    if( process.env.UPDATE_EXIST_DATA === "true" ){
        
        format_document.translate  = languages.reduce( (previous_item, current_item) => {
            
            previous_item.push({
                language        : current_item.key_code,
                title           : item_product.title,
                description     : item_product.body_html,
                search_field    : format_document.search_field,
                is_translated   : false
            });
            return previous_item;
        }, []);
        format_document.custom_badges       = {
            new_product : config_product ? moment().diff( h_format.shopifyDate( item_product.created_at ) , 'months') <= config_product.new_range : false,
            best_seller : false,
            exclusive   : false,
            pre_sale    : false,
            sold_out    : format_document.total_stock === 0,
            on_sale     : !!product_tags_config.list.find( (item) => item.name.trim().toLowerCase() === 'sale' ),
            others      : []
        };
        format_document.changes += 1;
    }
    format_document.updated_at = h_format.shopifyDate( item_product.updated_at );
    
    if( new_document ){
        
        delete format_document.changes;
        format_document.marketplace         = id_marketplace;
        format_document.shopify_id          = item_product.id;
        format_document.created_at          = h_format.shopifyDate( item_product.created_at );
        format_document.additional_content  = [];
        format_document.warehouse_status    = true;
        format_document.features            = {
            strap_type                  : null,
            bust_type                   : null,
            closure_type                : null,
            crotch_type                 : null,
            back_type                   : null,
            butt_material               : null,
            external_material           : null,
            inner_material              : null,
            complementary_inner_material: [],
            uses                        : [],
            category_type               : null,
            silhouette                  : null,
            leg_lenght                  : null
        };
        format_document.product_type        = { name: null, handle: null };
        format_document.custom_badges       = {
            new_product : config_product ? moment().diff( h_format.shopifyDate( item_product.created_at ) , 'months') <= config_product.new_range : false,
            best_seller : false,
            exclusive   : false,
            pre_sale    : false,
            sold_out    : format_document.total_stock === 0,
            on_sale     : !!product_tags_config.list.find( (item) => item.name.trim().toLowerCase() === 'sale' ),
            others      : []
        };
        format_document.translate  = languages.reduce( (previous_item, current_item) => {
            
            previous_item.push({
                language        : current_item.key_code,
                title           : format_document.title,
                description     : format_document.description,
                search_field    : format_document.search_field,
                is_translated   : false
            });
            return previous_item;
        }, []);
        return format_document;
    }
    else{
        
        if( format_document.changes > 0 ){
            
            delete format_document.changes;
            return  { 
                query: { 
                    marketplace: id_marketplace,
                    _id: h_validation.evalObjectId( db_product._id )
                }, 
                document: format_document
            };
        }
        else {
            
            return null;
        }
    }
};
/**
* 
* @param {*} id_marketplace 
* @param {*} item_variant 
* @param {*} item_product 
* @param {*} new_document 
* @returns 
*/
function variantObject(id_marketplace, item_variant, item_product, db_variant = null, new_document = false){
    
    let format_document         = {
        discounts: {
            stock   : {
                value       : 0,
                min_stock   : 0
            },
            sku     : 0
        },
        changes: 0
    };
    let this_image              = item_variant.image_id === null || item_variant.image_id === '' ? null : item_product.images.find( (item_f) => item_f.id === item_variant.image_id );
    let exist_discount_stock    = item_product.discount_stock.find( (item) => item.sku === item_variant.sku && item_variant.inventory_quantity > 0 ) || { apply: false, value: 0, min_stock: 0 };

    format_document = evalUpdateShopifyField( format_document, item_variant, db_variant, 'id', 'shopify_id' );
    
    format_document = evalUpdateShopifyField( format_document, item_variant, db_variant, 'product_id', 'product_id' );
    format_document = evalUpdateShopifyField( format_document, item_variant, db_variant, 'sku', 'sku' );
    if( format_document.sku ){

        format_document.sku_parent = h_format.extractSKUParent( format_document.sku );
    }
    format_document = evalUpdateShopifyField( format_document, item_variant, db_variant, 'title', 'title' );
    format_document = evalUpdateShopifyField( format_document, item_product, db_variant, 'title', 'title_product' );
    format_document = evalUpdateShopifyField( format_document, item_product, db_variant, 'vendor', 'brand' );
    if( format_document.brand != '' ){

        format_document.brand = { 
            name    : h_validation.evalString( format_document.brand ), 
            handle  : h_format.slug( format_document.brand ) 
        };
    }
    else {

        format_document.brand = null;
    }
    format_document = evalUpdateShopifyField( format_document, item_product, db_variant, 'product_type', 'product_category' );
    if( format_document.product_category != '' ){

        format_document.product_category = { 
            name    : h_validation.evalString( format_document.product_category ), 
            handle  : h_format.slug( format_document.product_category ) 
        };
    }
    else {

        format_document.product_category = null;
    }
    format_document = evalUpdateShopifyField( format_document, item_variant, db_variant, 'price', 'price' );
    format_document = evalUpdateShopifyField( format_document, item_variant, db_variant, 'compare_at_price', 'compare_at_price' );
    
    let variant_options = h_array.sort(item_product.options, 'name').reduce( (previous_item, current_item, current_index) => {
        
        let exist_option = item_product.options[current_index].values.find( (item) => item === item_variant.option1 || item === item_variant.option2 || item === item_variant.option3 );
        let handle_option = `${ h_format.slug( current_item.name ) }-${ h_format.slug( exist_option || '' ) }`;
        
        if( !db_variant || ( db_variant && ( db_variant.options[current_index]?.name != current_item.name || db_variant.options[current_index]?.handle != handle_option || db_variant.options[current_index]?.value != exist_option ) ) ){
            
            previous_item.changes++;
        }
        let new_option = {
            name    : current_item.name,
            handle  : handle_option,
            value   : exist_option
        };
        if( h_format.slug( current_item.name ) === "color" ){
            
            new_option.url = `/images/products/colors/${ new_option.handle }.webp`;
        }
        previous_item.data.push( new_option );
        return previous_item;
    }, { changes: 0, data: [] });

    if( variant_options.changes > 0 ){
        
        format_document.options = variant_options.data;
        format_document.changes += 1;
    }
    
    let new_image = {
        desktop: {
            category: 'image',
            sizes: [1600, 1400, 1200],
            changes: 0
        },
        mobile: {
            category: 'image',
            sizes: [1000, 800, 700, 600],
            changes: 0
        },
        changes: 0
    };
    
    if( this_image ){

        new_image.desktop = evalUpdateShopifyField( new_image.desktop   , { shopify_id: this_image.id } , db_variant?.image?.desktop, 'shopify_id', 'shopify_id' );
        new_image.desktop = evalUpdateShopifyField( new_image.desktop   , item_product                  , db_variant?.image?.desktop, 'title', 'alt' );
        new_image.desktop = evalUpdateShopifyField( new_image.desktop   , { src: this_image.src }       , db_variant?.image?.desktop, 'src', 'src' );
        new_image.desktop.src_collection = resizeUrlImage( new_image.desktop.src, '320x320' );
        new_image.desktop = evalUpdateShopifyField( new_image.desktop   , { width: this_image.desktop } , db_variant?.image?.desktop, 'width', 'width' );
        new_image.desktop = evalUpdateShopifyField( new_image.desktop   , { height: this_image.desktop }, db_variant?.image?.desktop, 'height', 'height' );
        
        new_image.mobile = evalUpdateShopifyField( new_image.mobile     , { shopify_id: this_image.id } , db_variant?.image?.mobile, 'shopify_id', 'shopify_id' );
        new_image.mobile = evalUpdateShopifyField( new_image.mobile     , item_product                  , db_variant?.image?.mobile, 'title', 'alt' );
        new_image.mobile = evalUpdateShopifyField( new_image.mobile     , { src: this_image.src }       , db_variant?.image?.mobile, 'src', 'src' );
        new_image.mobile.src_collection = resizeUrlImage( new_image.mobile.src, '320x320' );
        new_image.mobile = evalUpdateShopifyField( new_image.mobile     , { width: this_image.mobile }  , db_variant?.image?.mobile, 'width', 'width' );
        new_image.mobile = evalUpdateShopifyField( new_image.mobile     , { height: this_image.mobile } , db_variant?.image?.mobile, 'height', 'height' );
        
        new_image.changes += ( new_image.desktop.changes + new_image.mobile.changes );
    }
    else{
        
        new_image.changes += 1;
    }
    
    if( new_image.changes > 0 && this_image ){
        format_document.image = {
            desktop : { 
                category        : 'image',
                shopify_id      : new_image.desktop?.shopify_id     || this_image.id,
                alt             : new_image.desktop?.alt            || item_product.title, 
                src             : new_image.desktop?.src            || this_image.src,
                src_collection  : new_image.desktop?.src_collection,
                width           : new_image.desktop?.width          || this_image.width,
                height          : new_image.desktop?.height         || this_image.height,
                sizes           : new_image.desktop?.sizes
            },
            mobile  : { 
                category        : 'image',
                shopify_id      : new_image.mobile?.shopify_id     || this_image.id,
                alt             : new_image.mobile?.alt            || item_product.title, 
                src             : new_image.mobile?.src            || this_image.src, 
                src_collection  : new_image.mobile?.src_collection,
                width           : new_image.mobile?.width          || this_image.width,
                height          : new_image.mobile?.height         || this_image.height,
                sizes           : new_image.desktop?.sizes
            }
        };
        format_document.changes += 1;
    }
    else if( new_image.changes > 0 ){
        format_document.image = {
            desktop : { 
                shopify_id      : null,
                category        : null, 
                alt             : item_product.title, 
                src             : null,
                src_collection  : null,
                width           : null,
                height          : null,
                sizes           : [1600, 1400, 1200]
            },
            mobile  : { 
                shopify_id      : null,
                category        : null, 
                alt             : item_product.title, 
                src             : null,
                src_collection  : null,
                width           : null,
                height          : null,
                sizes           : [1000, 800, 700, 600]
            },
        };
        format_document.changes += 1;
    }
    format_document = evalUpdateShopifyField( format_document, item_variant, db_variant, 'barcode', 'barcode' );
    format_document = evalUpdateShopifyField( format_document, item_variant, db_variant, 'grams', 'grams' );
    format_document = evalUpdateShopifyField( format_document, item_variant, db_variant, 'weight', 'weight' );
    format_document = evalUpdateShopifyField( format_document, item_variant, db_variant, 'weight_unit', 'weight_unit' );
    
    if( format_document.weight_unit === null ){
        
        format_document.weight_unit = 'lb';
    }
    format_document = evalUpdateShopifyField( format_document, item_variant, db_variant, 'inventory_policy', 'inventory_policy' );
    format_document = evalUpdateShopifyField( format_document, item_variant, db_variant, 'inventory_item_id', 'inventory_item_id' );
    format_document = evalUpdateShopifyField( format_document, item_variant, db_variant, 'requires_shipping', 'requires_shipping' );
    format_document = evalUpdateShopifyField( format_document, item_variant, db_variant, 'inventory_quantity', 'inventory_quantity' );
    format_document = evalUpdateShopifyField( format_document, item_variant, db_variant, 'fulfillment_service', 'fulfillment_service' );
    format_document = evalUpdateShopifyField( format_document, item_variant, db_variant, 'inventory_management', 'inventory_management' );
    format_document = evalUpdateShopifyField( format_document, item_variant, db_variant, 'sort_variant', 'sort_variant' );
    format_document = evalUpdateShopifyField( format_document, item_product, db_variant, 'status', 'status_created' );
    
    let discount_stock = {
        changes: 0
    };
    discount_stock = evalUpdateShopifyField( discount_stock, exist_discount_stock, db_variant?.discounts?.stock, 'value', 'value' );
    discount_stock = evalUpdateShopifyField( discount_stock, exist_discount_stock, db_variant?.discounts?.stock, 'min_stock', 'min_stock' );
    
    if( discount_stock.changes > 0 ){
        
        format_document.discounts.stock = { 
            apply       : false,
            value       : exist_discount_stock.value, 
            min_stock   : exist_discount_stock.min_stock 
        };
        format_document.changes += 1;
    }
    format_document.updated_at = h_format.shopifyDate( item_variant.updated_at );
    
    if( new_document ){
        
        format_document.marketplace         = id_marketplace;
        format_document.shopify_id          = item_variant.id;
        format_document.product_id          = item_variant.product_id;
        format_document.created_at          = h_format.shopifyDate( item_variant.created_at );
        format_document.warehouse_status    = true;
        format_document.product_type        = null;
        delete format_document.changes;
        
        return format_document;
    }
    else{
        let update_product = {
            _id     : db_variant._id,
            changes : 1,
        };
        update_product.title                = h_validation.evalExistField( format_document.title, db_variant.title );
        update_product.sku                  = h_validation.evalExistField( format_document.sku, db_variant.sku );
        update_product.price                = h_validation.evalExistField( format_document.price, db_variant.price );
        update_product.compare_at_price     = h_validation.evalExistField( format_document.compare_at_price, db_variant.compare_at_price );
        update_product.inventory_quantity   = h_validation.evalExistField( format_document.inventory_quantity, db_variant.inventory_quantity );
        update_product.weight               = h_validation.evalExistField( format_document.weight, db_variant.weight );
        update_product.weight_unit          = h_validation.evalExistField( format_document.weight_unit, db_variant.weight_unit );
        update_product.options              = h_validation.evalExistField( format_document.options, db_variant.options );
        update_product.discount_stock       = h_validation.evalExistField( format_document.discounts?.stock, db_variant.discounts.stock );
        if( format_document.changes > 0 ){
            
            delete format_document.changes;
            format_document.marketplace = id_marketplace;
            return  { 
                query: { 
                    marketplace: id_marketplace,
                    _id: h_validation.evalObjectId( db_variant._id )
                }, 
                document: format_document,
                product: update_product
            };
        }
        else {
            
            return {
                _id: h_validation.evalObjectId( db_variant._id ),
                product: update_product
            };
        }
    }
};
/**
* 
* @param {*} id_marketplace 
* @param {*} item_collection 
* @param {*} general_filters 
* @param {*} new_document 
* @returns 
*/
function collectionObject(id_marketplace, item_collection, db_collection, languages, general_filters, new_document = false) {
    
    let format_document = {
        changes: 0
    };
    item_collection.sort_order = item_collection.sort_order === 'manual' ? 'best-selling' : item_collection.sort_order;
    
    format_document = evalUpdateShopifyField( format_document, item_collection, db_collection, 'title', 'title' );
    format_document = evalUpdateShopifyField( format_document, item_collection, db_collection, 'handle', 'handle' );
    format_document = evalUpdateShopifyField( format_document, item_collection, db_collection, 'body_html', 'description' );
    
    let new_image = {
        desktop : { 
            alt         : null, 
            src         : null,
            width       : null,
            height      : null,
            sizes       : [3000, 2800, 2600, 2400, 2200, 2000, 1800, 1600, 1400, 1200]
        },
        mobile  : { 
            alt         : null, 
            src         : null, 
            width       : null,
            height      : null,
            sizes       : [1000, 800, 700, 600]
        },
        changes: 0
    };
    new_image.desktop = evalUpdateShopifyField( new_image.desktop, item_collection, db_collection?.image?.desktop, 'alt', 'alt' );
    new_image.desktop = evalUpdateShopifyField( new_image.desktop, item_collection, db_collection?.image?.desktop, 'src', 'src' );
    new_image.desktop = evalUpdateShopifyField( new_image.desktop, item_collection, db_collection?.image?.desktop, 'width', 'width' );
    new_image.desktop = evalUpdateShopifyField( new_image.desktop, item_collection, db_collection?.image?.desktop, 'height', 'height' );
    
    new_image.mobile = evalUpdateShopifyField( new_image.mobile, item_collection, db_collection?.image?.mobile, 'alt', 'alt' );
    new_image.mobile = evalUpdateShopifyField( new_image.mobile, item_collection, db_collection?.image?.mobile, 'src', 'src' );
    new_image.mobile = evalUpdateShopifyField( new_image.mobile, item_collection, db_collection?.image?.mobile, 'width', 'width' );
    new_image.mobile = evalUpdateShopifyField( new_image.mobile, item_collection, db_collection?.image?.mobile, 'height', 'height' );
    
    format_document.changes += new_image.changes;
    
    format_document.image = new_image;
    
    format_document = evalUpdateShopifyField( format_document, item_collection, db_collection, 'sort_order', 'sort_order' );
    format_document = evalUpdateShopifyField( format_document, item_collection, db_collection, 'disjunctive', 'disjunctive' );
    
    if ( format_document.sort_order ){
        
        format_document.sort_order = sortCollection( format_document.sort_order, db_collection?.sort_category );
    }
    format_document.rules = item_collection.rules || [];
    
    let new_query_collection = queryCollectionProduct( id_marketplace, item_collection.rules, item_collection.disjunctive );
    
    if( JSON.stringify(new_query_collection) != JSON.stringify(db_collection?.query_products || '[]') ){
        
        format_document.query_products = new_query_collection;
        format_document.changes++;
    }
    format_document = evalUpdateShopifyField( format_document, { selected_filters: JSON.stringify( general_filters ) }, { selected_filters: db_collection ? JSON.stringify( db_collection.selected_filters ) : '[]' }, 'selected_filters', 'selected_filters' );
    
    if( format_document.selected_filters ){
        
        format_document.selected_filters = JSON.parse( format_document.selected_filters );
    }
    format_document = evalUpdateShopifyField( format_document, item_collection, db_collection, 'published_at', 'published_at' );
    format_document.updated_at      = h_format.shopifyDate( item_collection.updated_at );
    if( db_collection?.status_created === null || ( db_collection?.status_created != null && ( ( db_collection?.status_created === 'active' && item_collection.published_at === null ) || ( db_collection?.status_created === 'draft' && item_collection.published_at != null ) ) ) ){
        
        format_document.status_created   = item_collection.published_at != null ? 'active' : 'draft';
        format_document.changes++;
    }
    format_document.filter_values   = {
        brands              : [],
        product_categories  : [],
        tags                : [],
        product_options     : [],
        prices              : {
            min_price: null,
            max_price: null
        }   
    };
    format_document.changes += 1;
    
    if( new_document ){
        
        delete format_document.changes;
        format_document.marketplace = id_marketplace;
        format_document.shopify_id  = h_validation.evalInt( item_collection.id, null );
        format_document.created_at  = item_collection.published_at != null ? h_format.shopifyDate( item_collection.published_at ) : h_format.shopifyDate( item_collection.updated_at );
        format_document.translate   = languages.reduce( (previous_item, current_item) => {
            
            previous_item.push({
                language    : current_item.key_code,
                title       : format_document.title,
                description : format_document.body_html,
                image       : new_image
            });
            return previous_item;
        }, []);
        
        return format_document;
    }
    else{
        
        if( format_document.changes > 0 ){
            
            return { 
                query       : {
                    marketplace: id_marketplace,
                    shopify_id  : h_validation.evalInt( item_collection.id, null ),
                    _id         : h_validation.evalObjectId( db_collection._id )
                }, 
                document    : format_document
            };
        }
        else{
            
            return null;
        }
    }
};
/**
* 
* @param {*} item_marketplace 
* @param {*} item_order 
* @param {*} order_coupon 
* @param {*} db_line_items 
* @param {*} item_business 
* @param {*} db_order 
* @param {*} new_document 
* @returns 
*/
function orderObject(item_marketplace, order_origin, item_order, extract_order_data = null, new_document = false){
    
    let format_document = {
        marketplace             : item_marketplace._id.toString(),
        token                   : h_validation.evalString( item_order.token ),
        taxes_included          : h_validation.evalBoolean( item_order.taxes_included ),
        tax_lines               : taxLinesObject( item_order.tax_lines ),
        subtotal_price          : h_validation.evalFloat( item_order.subtotal_price ),
        total_discounts         : h_validation.evalFloat( item_order.total_discounts ),
        total_line_items_price  : h_validation.evalFloat( item_order.total_line_items_price ),
        total_outstanding       : h_validation.evalFloat( item_order.total_outstanding ),
        total_price             : h_validation.evalFloat( item_order.total_price ),
        total_tax               : h_validation.evalFloat( item_order.total_tax ),
        total_shipping_price    : 0,
        checkout_id             : h_validation.evalString( item_order.checkout_id ),
        checkout_token          : h_validation.evalString( item_order.checkout_token ),
        total_weight            : h_validation.evalFloat( item_order.total_weight ),
        shipping_lines          : shippingLinesObject( item_order.shipping_lines ),
        subtotal_shipping_price : h_validation.evalFloat( item_order.total_shipping_price_set?.shop_money?.amount ),
        refunds                 : refundsObject( item_order.refunds ),
        discounts               : orderDiscountObject( [...h_validation.evalArray( extract_order_data?.discounts )].flat(), item_order ),
        fulfillments            : fulfillmentObject( item_order, extract_order_data?.db_fulfillments ),
        cancel_reason           : h_validation.evalString( item_order.cancel_reason ),
        note                    : h_validation.evalString( item_order.note ),
        financial_status        : h_validation.evalString( item_order.financial_status ),
        fulfillment_status      : h_validation.evalString( item_order.fulfillment_status ),
        order_status_url        : h_validation.evalString( item_order.order_status_url ),
        currency_code           : h_validation.evalString( item_order.currency ),
        
        updated_at              : h_format.shopifyDate( item_order.updated_at ), 
        processed_at            : h_format.shopifyDate( item_order.processed_at ),
        closed_at               : h_format.shopifyDate( item_order.closed_at ),
        cancelled_at            : h_format.shopifyDate( item_order.cancelled_at )
    };
    
    format_document.total_shipping_price = format_document.shipping_lines.reduce( (previous_item, current_item) => {
        
        previous_item += current_item.discounted_price;
        return previous_item;
    }, 0 );
    format_document.shipping_address    = orderAddressObject( item_order.shipping_address );
    
    if( process.env.UPDATE_EXIST_DATA === 'true' ){
        
        format_document.billing_address = orderAddressObject( item_order.billing_address );
        format_document.skus            = [...new Set( h_validation.evalArray( extract_order_data?.skus ) )];
        format_document.brands          = [...new Set( h_validation.evalArray( extract_order_data?.brands ) )].map( (item) => { return { name: item, handle: h_format.slug( item ) } } );
        format_document.variants        = [...new Set( h_validation.evalArray( extract_order_data?.variants ) )];
        format_document.tags            = item_order.tags.trim() != '' ? item_order.tags.trim().split(", ").map( (item) => { return { name: item, handle: h_format.slug( item ) } }) : [];
        format_document.origin          = order_origin.values[0];
    }
    if( new_document ){
        
        format_document.business        = order_origin.business ? order_origin.business.toString() : null;
        format_document.shopify_id      = h_validation.evalInt( item_order.id, null );
        format_document.origin          = order_origin.values[0];
        format_document.tags            = item_order.tags.trim() != '' ? item_order.tags.trim().split(", ").map( (item) => { return { name: item, handle: h_format.slug( item ) } }) : [];
        format_document.name            = h_validation.evalString( item_order.name );
        format_document.number          = h_validation.evalInt( item_order.number, null );
        format_document.order_number    = h_validation.evalInt( item_order.order_number, null );
        format_document.coupon          = extract_order_data.coupon;
        format_document.note_attributes = [];
        format_document.billing_address = orderAddressObject( item_order.billing_address );
        format_document.line_items      = h_validation.evalArray( extract_order_data?.ids );
        format_document.skus            = [...new Set( h_validation.evalArray( extract_order_data?.skus ) )];
        format_document.brands          = [...new Set( h_validation.evalArray( extract_order_data?.brands ) )].map( (item) => { return { name: item, handle: h_format.slug( item ) } } );
        format_document.variants        = [...new Set( h_validation.evalArray( extract_order_data?.variants ) )];
        format_document.customer        = null;
        format_document.customer_id     = null;
        format_document.storefront      = extract_order_data?.storefront || null;
        format_document.affiliate       = extract_order_data?.affiliate || null;
        format_document.created_at      = h_format.shopifyDate( item_order.created_at );
        format_document.created_invoice = false;
        format_document.invoice_items   = [];
        format_document.is_adjustment   = format_document.tags.find( (item) => item === 'adjustment' ) ? true : false;
    }
    else{
        
        format_document = { 
            query   : { 
                marketplace : item_marketplace._id.toString(), 
                shopify_id  : h_validation.evalInt( item_order.id, null ) 
            }, 
            document: format_document 
        };
    }
    return format_document;
};
/**
* 
* @param {*} item_marketplace 
* @param {*} line_item 
* @param {*} item_order 
* @param {*} new_document 
* @returns 
*/
function lineItemObject(item_marketplace, line_item, item_order, order_origin, new_document = false){
    
    let refunded_items      = h_validation.evalArray( item_order.refunds ).filter( (item_refund) => item_refund.refund_line_items.findIndex( (item_refund_item) => item_refund_item.line_item_id === line_item.id ) >= 0 );
    let tax_lines           = taxLinesObject( line_item.tax_lines );
    
    let format_document     = {
        marketplace                 : item_marketplace._id.toString(),
        sku                         : h_validation.evalString( line_item.sku ),
        name                        : h_validation.evalString( line_item.name ), 
        title                       : h_validation.evalString( line_item.title ), 
        variant_title               : h_validation.evalString( line_item.variant_title ),
        brand                       : h_validation.evalString( line_item.vendor ), 
        quantity                    : h_validation.evalInt( line_item.quantity ), 
        price                       : h_validation.evalFloat( line_item.price ), 
        total_discount              : h_validation.evalFloat( line_item.total_discount ),
        currency_code               : h_validation.evalString( item_order.currency ), 
        discounts                   : lineItemDiscountObject( item_order, line_item, order_origin.currency_format ),
        tax_lines                   : tax_lines, 
        total_taxes                 : tax_lines.reduce( (previous_item, current_item) => { previous_item += current_item.price; return previous_item; }, 0),
        fulfillable_quantity        : h_validation.evalInt( line_item.fulfillable_quantity ), 
        fulfillment_service         : h_validation.evalString( line_item.fulfillment_service ), 
        fulfillment_status          : h_validation.evalString( line_item.fulfillment_status ), 
        financial_status            : h_validation.evalString( item_order.financial_status ),
        refunded                    : refunded_items.reduce( (previous_item, current_item) => {
            
            let refund_line_item = current_item.refund_line_items.find( (item_refund) => item_refund.line_item_id === line_item.id );
            previous_item.push({ 
                shopify_id  : h_validation.evalInt( current_item.id, null ), 
                line_item_id: h_validation.evalInt( refund_line_item?.line_item_id, null ), 
                quantity    : h_validation.evalInt( refund_line_item?.quantity ),
                created_at  : h_format.shopifyDate( current_item.created_at ) 
            });
            return previous_item;
        }, []),
        gift_card                   : h_validation.evalString( line_item.gift_card ), 
        grams                       : h_validation.evalInt( line_item.grams ), 
        origin_location             : line_item.origin_location ? {
            shopify_id      : h_validation.evalInt( line_item.origin_location.id, null ), 
            country_code    : h_validation.evalString( line_item.origin_location.country_code ), 
            state_code      : h_validation.evalString( line_item.origin_location.province_code ), 
            name            : h_validation.evalString( line_item.origin_location.name ), 
            address_1       : h_validation.evalString( line_item.origin_location.address1 ), 
            address_2       : h_validation.evalString( line_item.origin_location.address2 ), 
            city            : h_validation.evalString( line_item.origin_location.city ), 
            zip             : h_validation.evalString( line_item.origin_location.zip )
        } : null, 
        product_exists              : h_validation.evalBoolean( line_item.product_exists ), 
        requires_shipping           : h_validation.evalBoolean( line_item.requires_shipping ),  
        taxable                     : h_validation.evalBoolean( line_item.taxable ),
        variant_inventory_management: line_item.variant_inventory_management,    
        updated_at                  : h_format.shopifyDate( item_order.updated_at )
    };
    if( process.env.UPDATE_EXIST_DATA === 'true' ){
        format_document.origin      = order_origin?.values[0] || null;
    }
    if( new_document ){
        
        format_document.order_id    = h_validation.evalInt( item_order.id, null );
        format_document.customer_id = h_validation.evalInt( item_order.customer?.id, null );
        format_document.shopify_id  = h_validation.evalInt( line_item.id, null );
        format_document.product_id  = h_validation.evalInt( line_item.product_id, null );
        format_document.variant_id  = h_validation.evalInt( line_item.variant_id, null );
        format_document.origin      = order_origin?.values[0] || null,
        format_document.created_at  = h_format.shopifyDate( item_order.created_at );
    }
    else{
        
        format_document = { 
            query   : { 
                marketplace : item_marketplace._id.toString(),
                shopify_id  : h_validation.evalInt( line_item.id, null ), 
                order_id    : h_validation.evalInt( item_order.id, null ) 
            },
            document: format_document 
        };
    }
    return format_document;
};
/**
* 
* @param {*} data_transaction 
* @param {*} order 
* @param {*} db_transaction 
* @param {*} new_document 
* @returns 
*/
function transactionObjects( data_transaction, item_order, line_item, db_transactions = [] ){
    
    let percentages                 = null;
    let is_storefront               = data_transaction.storefront != null && data_transaction.affiliate === null;
    let is_affiliate                = ( data_transaction.storefront != null && data_transaction.affiliate != null ) || ( data_transaction.storefront === null && data_transaction.affiliate != null );
    let data_configuration          = null;
    let new_transactions            = [];
    let type_transaction            = null;
    
    if( is_storefront ){
        
        data_configuration = data_transaction.storefront;
        type_transaction = 'storefront';
    }
    else if( is_affiliate ){
        
        data_configuration = data_transaction.affiliate;
        type_transaction = 'affiliate';
    }
    
    if( data_configuration != null ){
        
        percentages = {
            additional_commission   : data_configuration.additional_commission.value,
            commission              : data_configuration.commission,
            store_fee               : data_configuration.store_fee
        };
        
        if( line_item && db_transactions.length === 0 ){
            
            let total_order                 = h_format.currencyObject( ( line_item.price * line_item.quantity ), false ).number;
            let total_points                = 0;
            let total_commission            = 0;
            let total_additional_commission = 0;
            let total_store_fee             = 0;

            if( ( data_configuration.additional_commission.amount > 0 && item_order.total_amount_order >= data_configuration.additional_commission.amount ) || ( data_configuration.additional_commission.quantity > 0 && item_order.total_quantity_order >= data_configuration.additional_commission.quantity ) ){
                
                percentages.commission  = percentages.commission + data_configuration.additional_commission.value;
                percentages.store_fee   = percentages.store_fee - data_configuration.additional_commission.value;
            }
            if( data_configuration.system_points.units > 0 ){
                
                total_points = Math.round( ( total_order / data_configuration.system_points.units ) * data_configuration.system_points.value );
            }
            total_additional_commission = h_format.currencyObject( h_format.calcDiscountPrice( total_order, 100 - percentages.additional_commission, 1 ), false ).number;
            total_commission            = h_format.currencyObject( h_format.calcDiscountPrice( total_order, 100 - percentages.commission, 1 ), false ).number - line_item.total_discount;
            total_store_fee             = h_format.currencyObject( h_format.calcDiscountPrice( total_order, 100 - percentages.store_fee, 1 ), false ).number;
            
            new_transactions.push({
                line_item_id                : line_item.shopify_id,
                refund_id                   : null,
                percentages                 : percentages, 
                category                    : `item-order-${ type_transaction }`,
                brand                       : line_item?.brand,
                quantity                    : line_item.quantity,
                total_order                 : total_order,
                total_discount              : line_item.total_discount,
                total_taxes                 : line_item.total_taxes,
                total_shipping              : 0,
                total_additional_commission : total_additional_commission,
                total_commission            : total_commission,
                total_store_fee             : total_store_fee,
                total_adjustment            : 0,
                total_points                : total_points, 
                closing_balance             : 0, 
                last_month_statement        : null,
                created_at                  : line_item.created_at
            });
        }
        if( item_order.refunds.length > 0 && line_item != null ){
            
            new_transactions = item_order.refunds.reduce( (previous_item_refund, current_item_refund) => {
                
                current_item_refund.refund_line_items.map( (refund_item) => {
                    
                    if( refund_item.line_item_id === line_item.shopify_id && !db_transactions.find( (item) => item.refund_id === current_item_refund.shopify_id && item.line_item_id === refund_item.line_item_id ) ){
                        
                        let refund_discount             = 0;
                        let refund_taxes                = 0;
                        let refund_order                = 0;
                        let refund_additional_commission= 0;
                        let refund_commission           = 0;
                        let refund_store_fee            = 0;
                        let refund_points               = 0;
                        
                        if( line_item.discounts.length > 0 ){
                            
                            let line_item_discount = line_item.discounts.find( (item) => item.value_type === 'percentage' );
                            if( line_item_discount ){
                                
                                refund_discount = h_format.currencyObject( h_format.calcDiscountPrice( line_item.price, line_item_discount.value, line_item.quantity ) * refund_item.quantity, false ).number;
                            }
                            else{
                                
                                line_item_discount = line_item.discounts.find( (item) => item.value_type === 'fixed_amount' );
                                if( line_item_discount ){
                                    
                                    refund_discount = h_format.currencyObject( ( h_format.currencyObject( ( line_item_discount.amount / line_item.quantity ), false ).number * refund_item.quantity ), false ).number
                                }
                                else{
                                    refund_discount = 0;
                                }
                            }
                        }
                        else{
                            
                            refund_discount = 0;
                        }
                        refund_order                    = h_format.currencyObject( ( line_item.price * refund_item.quantity ), false ).number;
                        refund_taxes                    = h_format.currencyObject( ( line_item.total_taxes / line_item.quantity ) * refund_item.quantity, false ).number;
                        
                        refund_additional_commission    = h_format.currencyObject( h_format.calcDiscountPrice( refund_order, 100 - percentages.additional_commission, 1 ), false ).number;
                        refund_commission               = h_format.currencyObject( h_format.calcDiscountPrice( refund_order, 100 - percentages.commission, 1 ), false ).number - refund_discount;
                        refund_store_fee                = h_format.currencyObject( h_format.calcDiscountPrice( refund_order, 100 - percentages.store_fee, 1 ), false ).number;
                        
                        if( data_configuration.system_points.units > 0 ){
                            
                            refund_points = Math.round( ( refund_order / data_configuration.system_points.units ) * data_configuration.system_points.value );
                        }
                        previous_item_refund.push({
                            line_item_id                : line_item.shopify_id,
                            refund_id                   : refund_item.shopify_id,
                            percentages                 : percentages, 
                            category                    : `item-refund-${ type_transaction }`,
                            brand                       : line_item.brand,
                            quantity                    : refund_item.quantity,
                            total_order                 : refund_order,
                            total_discount              : refund_discount,
                            total_taxes                 : refund_taxes,
                            total_shipping              : 0,
                            total_additional_commission : refund_additional_commission,
                            total_commission            : refund_commission,
                            total_store_fee             : refund_store_fee,
                            total_adjustment            : 0,
                            total_points                : refund_points,
                            closing_balance             : 0, 
                            last_month_statement        : null,
                            created_at                  : current_item_refund.created_at
                        });
                    }
                    return refund_item;
                });
                current_item_refund.order_adjustments.map( (refund_item) => {
                    
                    if( !db_transactions.find( (item) => item.refund_id === refund_item.shopify_id  ) ){
                        
                        let refund_points = 0;
                        if( data_configuration.system_points.units > 0 ){
                            
                            refund_points = Math.round( ( refund_item.amount / data_configuration.system_points.units ) * data_configuration.system_points.value );
                        }
                        previous_item_refund.push({
                            line_item_id                : null,
                            refund_id                   : refund_item.shopify_id,
                            percentages                 : percentages, 
                            category                    : `order-refund-${ type_transaction }`,
                            brand                       : null,
                            quantity                    : 0,
                            total_order                 : refund_item.amount,
                            total_discount              : 0,
                            total_taxes                 : 0,
                            total_shipping              : 0,
                            total_additional_commission : 0,
                            total_commission            : 0,
                            total_store_fee             : 0,
                            total_adjustment            : 0,
                            total_points                : refund_points,
                            closing_balance             : 0, 
                            last_month_statement        : null,
                            created_at                  : current_item_refund.created_at
                        });
                    }
                    return refund_item;
                });
                current_item.refund_shipping_lines.map( (refund_item) => {
                    
                    if( !db_transactions.find( (item) => item.refund_id === refund_item.shopify_id  ) ){

                        previous_item_refund.push({
                            line_item_id                : null,
                            refund_id                   : current_item_refund.shopify_id,
                            percentages                 : percentages, 
                            category                    : `shipping-refund-${ type_transaction }`,
                            brand                       : null,
                            quantity                    : 0,
                            total_order                 : 0,
                            total_discount              : 0,
                            total_taxes                 : 0,
                            total_shipping              : refund_item.price,
                            total_additional_commission : 0,
                            total_commission            : 0,
                            total_store_fee             : 0,
                            total_adjustment            : 0,
                            total_points                : 0,
                            closing_balance             : 0, 
                            last_month_statement        : null,
                            created_at                  : current_item_refund.created_at
                        });
                    }
                    return refund_item;
                });
                return previous_item_refund;
            }, new_transactions);
        }
        if( item_order?.total_shipping_price != null && db_transactions.length === 0 ){
            
            new_transactions.push({
                line_item_id                : null,
                refund_id                   : null,
                percentages                 : percentages, 
                category                    : `shipping-order-${ type_transaction }`,
                brand                       : null,
                quantity                    : 0,
                total_order                 : 0,
                total_discount              : 0,
                total_taxes                 : 0,
                total_shipping              : item_order.total_shipping_price,
                total_additional_commission : 0,
                total_commission            : 0,
                total_store_fee             : 0,
                total_adjustment            : 0,
                total_points                : 0,
                closing_balance             : 0, 
                last_month_statement        : null,
                created_at                  : item_order.created_at
            });
        }
        if( data_transaction.adjustment_balance != null ){
            
            new_transactions.push({
                line_item_id                : null,
                refund_id                   : null,
                percentages                 : null, 
                category                    : `adjustment-${ type_transaction }`,
                brand                       : null,
                quantity                    : 0,
                total_order                 : 0,
                total_discount              : 0,
                total_taxes                 : 0,
                total_shipping              : 0,
                total_additional_commission : 0,
                total_commission            : 0,
                total_store_fee             : 0,
                total_adjustment            : data_transaction.adjustment_balance.total_adjustment,
                total_points                : 0,
                closing_balance             : 0,
                last_month_statement        : null,
                created_at                  : data_transaction.adjustment_balance.created_at
            });
        }
        if( data_transaction.closing_month != null ){
            
            new_transactions.push({
                line_item_id                : null,
                refund_id                   : null,
                percentages                 : null, 
                category                    : `closing-month-${ type_transaction }`,
                brand                       : null,
                quantity                    : 0,
                total_order                 : data_transaction.closing_month.total_order,
                total_discount              : data_transaction.closing_month.total_discount,
                total_taxes                 : data_transaction.closing_month.total_taxes,
                total_shipping              : data_transaction.closing_month.total_shipping,
                total_additional_commission : data_transaction.closing_month.total_additional_commission,
                total_commission            : data_transaction.closing_month.total_commission,
                total_store_fee             : data_transaction.closing_month.total_store_fee,
                total_adjustment            : data_transaction.closing_month.total_adjustment,
                total_points                : data_transaction.closing_month.total_points,
                closing_balance             : data_transaction.closing_month.closing_balance,
                last_month_statement        : {
                    closing_balance : data_transaction.closing_month.last_month_statement.closing_balance,
                    total_points    : data_transaction.closing_month.last_month_statement.total_points
                },
                created_at                  : data_transaction.closing_month.created_at
            });
        }
        new_transactions = new_transactions.map( (item_transaction) => {
            
            item_transaction.marketplace     = data_transaction?.id_marketplace  ? data_transaction.id_marketplace   : null;
            item_transaction.storefront      = data_transaction?.storefront?._id ? data_transaction.storefront._id   : null;
            item_transaction.affiliate       = data_transaction?.affiliate?._id  ? data_transaction.affiliate._id    : null;
            item_transaction.customer_id     = data_transaction?.customer_id     ? data_transaction.customer_id      : null;
            item_transaction.order_id        = item_order                        ? item_order.shopify_id             : null;
            
            return item_transaction;
        });
    }
    
    return new_transactions;
};
/**
* 
* @param {*} customer_sales 
* @returns 
*/
function bestSellerObject(object_best_seller){
    
    let sort_line_items = h_array.sort( object_best_seller.document.line_items, 'product_id' );
    
    for (const [index_item, line_item] of sort_line_items.entries()) {
        
        line_items_refunded = h_validation.evalArray( line_item.refunded ).filter( (item) => item?.created_at != null && moment( item?.created_at ).diff(moment( line_item.created_at ), 'months') <= object_best_seller.document.range_months && item?.quantity > 0 );
        let valid_refund    = ( line_item.refunded != null && line_items_refunded.length > 0 );
        if( valid_refund ){
            line_items_refunded = line_items_refunded.reduce( (previous_item, current_item) => { return previous_item + current_item.quantity }, 0 );
        }
        if( line_item.product && line_item.product != null && line_item.variant != null && ( object_best_seller.document.products.length === 0 || line_item.product_id != object_best_seller.document.products[ object_best_seller.document.products.length - 1 ].shopify_id ) ){
            
            if( object_best_seller.document.products.length > 0 && line_item.product_id != object_best_seller.document.products[ object_best_seller.document.products.length - 1 ].shopify_id ){
                
                object_best_seller.document.products[ object_best_seller.document.products.length - 1 ] = evalBestSellerOptionsVariants( object_best_seller.document, object_best_seller.document.products[ object_best_seller.document.products.length - 1 ] );
            }
            
            if( object_best_seller.document.customer_id === null ){
                
                object_best_seller.document.filter_values = getFilterValues( object_best_seller.document.filter_values, line_item.product );
            }
            
            object_best_seller.document.products.push({ 
                shopify_id          : line_item.product.shopify_id,
                brand               : line_item.product.brand, 
                product_category    : line_item.product.product_category, 
                product_type        : line_item.product.product_type, 
                sort_category       : line_item.product.sort_category, 
                total_quantity      : calcSaleQuantity( line_item, valid_refund, line_items_refunded ),
                total_amount        : calcSaleTotal( line_item, valid_refund, line_items_refunded ),
                order_quantity      : line_item.quantity,
                refund_quantity     : valid_refund ? line_items_refunded : 0,
                options             : bestSellerProductOption( line_item, valid_refund, line_items_refunded ),
                variants            : [bestSellerVariant( line_item, valid_refund, line_items_refunded )],
                sort_amount         : 999999999,
                sort_quantity       : 999999999,
                sort_general        : 999999999,
                best_seller_amount  : false,
                best_seller_quantty : false
            });
        }
        else if( line_item.product && line_item.product != null && line_item.variant != null ){
            
            let index_variant = object_best_seller.document.products[ object_best_seller.document.products.length - 1 ].variants.findIndex( (item) => item.sku === line_item.sku );
            
            if( index_variant >= 0 ){
                
                object_best_seller.document.products[ object_best_seller.document.products.length - 1 ].variants[ index_variant ].total_quantity    += calcSaleQuantity( line_item, valid_refund, line_items_refunded );
                object_best_seller.document.products[ object_best_seller.document.products.length - 1 ].variants[ index_variant ].order_quantity    += line_item.quantity;
                object_best_seller.document.products[ object_best_seller.document.products.length - 1 ].variants[ index_variant ].refund_quantity   += valid_refund ? line_items_refunded : 0;
                object_best_seller.document.products[ object_best_seller.document.products.length - 1 ].variants[ index_variant ].total_amount      += calcSaleTotal( line_item, valid_refund, line_items_refunded );
            }
            else{
                
                object_best_seller.document.products[ object_best_seller.document.products.length - 1 ].variants.push( bestSellerVariant( line_item, valid_refund, line_items_refunded ) );
            }
            object_best_seller.document.products[ object_best_seller.document.products.length - 1 ].options = object_best_seller.document.products[ object_best_seller.document.products.length - 1 ].options.map( (item_option) => {
                
                item_option.values = item_option.values.map( (item_option_value) => {
                    
                    if( item_option_value.skus.includes( line_item.sku ) ){
                        
                        item_option_value.total_quantity    += calcSaleQuantity( line_item, valid_refund, line_items_refunded );
                        item_option_value.order_quantity    += line_item.quantity;
                        item_option_value.refund_quantity   += valid_refund ? line_items_refunded : 0;
                        item_option_value.total_amount      += calcSaleTotal( line_item, valid_refund, line_items_refunded );
                    }
                    return item_option_value;
                });
                return item_option;
            });
            object_best_seller.document.products[ object_best_seller.document.products.length - 1 ].total_quantity      += calcSaleQuantity( line_item, valid_refund, line_items_refunded );
            object_best_seller.document.products[ object_best_seller.document.products.length - 1 ].order_quantity      += line_item.quantity;
            object_best_seller.document.products[ object_best_seller.document.products.length - 1 ].refund_quantity     += valid_refund ? line_items_refunded : 0;
            object_best_seller.document.products[ object_best_seller.document.products.length - 1 ].total_amount        += calcSaleTotal( line_item, valid_refund, line_items_refunded );
        }
        if( line_item.product && line_item.product != null && line_item.variant != null && sort_line_items.length === index_item + 1 ){
            
            object_best_seller.document.products[ object_best_seller.document.products.length - 1 ] = evalBestSellerOptionsVariants( object_best_seller.document, object_best_seller.document.products[ object_best_seller.document.products.length - 1 ] );
            
            if( object_best_seller.document.customer_id === null ){
                
                object_best_seller.document.filter_values.brands             = [...new Set( object_best_seller.document.filter_values.brands )];
                object_best_seller.document.filter_values.product_categories = [...new Set( object_best_seller.document.filter_values.product_categories )];
                object_best_seller.document.filter_values.tags               = [...new Set( object_best_seller.document.filter_values.tags )];
                object_best_seller.document.filter_values.product_options    = object_best_seller.document.filter_values.product_options.map( (item) => {
                    return {
                        handle: item.handle,
                        values: [...new Set( item.values )]
                    }
                });
            }
        }
        object_best_seller.document.total_quantity  += calcSaleQuantity( line_item, valid_refund, line_items_refunded );
        object_best_seller.document.order_quantity  += line_item.quantity;
        object_best_seller.document.refund_quantity += valid_refund ? line_items_refunded : 0;
        object_best_seller.document.total_amount    += calcSaleTotal( line_item, valid_refund, line_items_refunded );
    }
    object_best_seller.document.total_amount = h_format.currencyObject( object_best_seller.document.total_amount ).number;
    let limit_products              = {
        total_quantity  : Math.ceil( object_best_seller.document.total_quantity * ( object_best_seller.document.percentage_product / 100 ) ),
        total_amount    : ( object_best_seller.document.total_amount * ( object_best_seller.document.percentage_product / 100 ) )
    };
    
    let result_eval_quantity                = evalBestSellerQuantity( object_best_seller.document.products, limit_products.total_quantity );
    object_best_seller.document.products    = result_eval_quantity.sort_products;
    
    let result_eval_amount                  = evalBestSellerAmount( object_best_seller.document.products, limit_products.total_amount );
    object_best_seller.document.products    = result_eval_amount.sort_products.map( (item_product) => {
        
        return {
            marketplace         : object_best_seller.query.marketplace, 
            customer_id         : object_best_seller.query.customer_id, 
            storefront          : object_best_seller.query.storefront, 
            affiliate           : object_best_seller.query.affiliate, 
            order_origin        : object_best_seller.query.order_origin,
            product_id          : item_product.shopify_id,
            brand               : item_product.brand, 
            product_category    : item_product.product_category, 
            product_type        : item_product.product_type, 
            total_quantity      : item_product.total_quantity,
            total_amount        : item_product.total_amount,
            order_quantity      : item_product.order_quantity,
            refund_quantity     : item_product.refund_quantity,
            options             : item_product.options,
            variants            : item_product.variants,
            z_score_amount      : item_product.z_score_amount,
            z_score_quantity    : item_product.z_score_quantity,
            z_score_combinate   : item_product.z_score_combinate,
            sort_amount         : item_product.sort_amount,
            sort_quantity       : item_product.sort_quantity,
            sort_general        : item_product.sort_general,
            best_seller_amount  : item_product.best_seller_amount,
            best_seller_quantty : item_product.best_seller_quantty
        }
    });
    
    delete object_best_seller.document.line_items;
    return object_best_seller;
};
/**
* 
* @param {*} buy_again_object 
* @param {*} line_items 
* @returns 
*/
function buyAgainObject( id_marketplace, customer_id, line_items, new_document = false ){
    
    let format_document = { 
        variant_products: []
    }
    let line_items_purchase = h_array.sort(line_items, 'variant_id').reduce( (previous_item, current_item) =>{
        
        if( previous_item.length === 0 || ( previous_item.length > 0 && previous_item[ previous_item.length - 1 ].variant_id != current_item.variant_id ) ){
            
            previous_item.push( { variant_id: current_item.variant_id, quantity: current_item.quantity, created_at: new Date( moment( current_item.created_at ) ) } );
            
        }
        else{
            
            previous_item[ previous_item.length - 1 ].quantity += current_item.quantity;
            previous_item[ previous_item.length - 1 ].created_at = previous_item[ previous_item.length - 1 ].created_at >= new Date( moment( current_item.created_at ) ) ? previous_item[ previous_item.length - 1 ].created_at : new Date( moment( current_item.created_at ) );
        }
        return previous_item;
    }, [] ); 
    
    format_document.variant_products = h_array.sort(line_items_purchase, 'variant_id').reduce( (previous_item, current_item) =>{
        
        let buyed_item_index = previous_item.findIndex( (item) => item.variant_id === current_item.variant_id );
        
        if( buyed_item_index >= 0 ){
            
            previous_item[ buyed_item_index ].total_purchase += current_item.quantity;
            previous_item[ buyed_item_index ].date_last_purchase = new Date( moment( previous_item[ buyed_item_index ].date_last_purchase ) ) >= current_item.created_at ? new Date( moment( previous_item[ buyed_item_index ].date_last_purchase ) ) : current_item.created_at;
            
        }
        else{
            
            previous_item.push( { variant_id: current_item.variant_id, total_purchase: current_item.quantity, date_last_purchase: current_item.created_at } );
        }
        return previous_item;
    }, [...format_document.variant_products] );
    
    if( new_document ){
        
        format_document.marketplace = id_marketplace;
        format_document.customer_id = customer_id;
    }
    else{
        
        format_document = { 
            query   : { 
                marketplace : id_marketplace, 
                customer_id : customer_id, 
            }, 
            document: format_document 
        };
    }
    
    return format_document;
};
/**
* 
* @param {*} id_marketplace 
* @param {*} item_group 
* @returns 
*/
function shippingGroupObject( id_marketplace, item_group ){
    
    return {
        marketplace         : id_marketplace,
        shopify_id          : item_group.shopify_id,
        name                : h_validation.evalString( item_group.name ),
        handle              : h_format.slug( item_group.name ),
        general_group       : h_validation.evalBoolean( item_group.general_group, false ),
        brands              : [],
        product_types       : [],
        product_variants    : [],
    };;
}
/**
* 
* @param {*} id_marketplace 
* @param {*} item_zone 
* @param {*} shipping_types 
* @param {*} db_countries 
* @param {*} shipping_taxes 
* @returns 
*/
function shippingZoneRatesTaxesObject(id_marketplace, item_group, item_zone, db_zone, shipping_types, db_countries, db_shipping_taxes){
    
    let format_document = {
        general_group       : item_group.general_group || false,
        country_states      : [],
        standard_rates      : db_zone ? db_zone.standard_rates.reduce( (previous_item, current_item) => { 
            previous_item[current_item._id.toString()] = { 
                _id         : current_item._id.toString(), 
                min_weight  : current_item.min_weight 
            };
            return previous_item;
        }, {}) : {},
        variant_rates       : db_zone ? db_zone.variant_rates.reduce( (previous_item, current_item) => { 
            previous_item[current_item._id.toString()] = { 
                _id             : current_item._id.toString(), 
                min_total_order : current_item.min_total_order 
            };
            return previous_item;
        }, {}) : {},
        brands              : item_group.brands,
        product_types       : item_group.product_types,
        product_categories  : item_group.product_categories,
        product_variants    : item_group.product_variants,
    };
    let standard_rates  = item_zone.weight_based_shipping_rates.reduce( (previous_item, current_item) => {
        
        if( !['no invoice', 'cash on delivery'].includes( current_item.name.toLowerCase() ) ){

            let exist_shipping_type = shipping_types.find( (item_type) => item_type.handle === h_format.slug( current_item.name ) );

            let db_rate = (db_zone?.standard_rates || []).find( (item_db_rate) => item_db_rate.shopify_id === current_item.id );

            let format_rate = shippingRateObject( id_marketplace, item_group, current_item, exist_shipping_type ? exist_shipping_type : shipping_types.find( (item_type) => item_type.name === 'Standard Shipping' ), 'standard', db_rate );
            
            previous_item[db_rate ? 'update' : 'create'].push(format_rate);
        }
        return previous_item;
    }, { create: [], update: [] });
    
    let variant_rates   = item_zone.price_based_shipping_rates.reduce( (previous_item, current_item) => {
        
        if( !['no invoice', 'cash on delivery'].includes( current_item.name.toLowerCase() ) ){

            let exist_shipping_type = shipping_types.find( (item_type) => item_type.handle === h_format.slug( current_item.name ) );

            let db_rate = (db_zone?.variant_rates || []).find( (item_db_rate) => item_db_rate.shopify_id === current_item.id );
            let format_rate = shippingRateObject( id_marketplace, item_group, current_item, exist_shipping_type ? exist_shipping_type : shipping_types.find( (item_type) => item_type.name === 'Standard Shipping' ), 'variant', db_rate );
            
            previous_item[db_rate ? 'update' : 'create'].push(format_rate);
        }
        return previous_item;
    }, { create: [], update: [] });
    
    let shipping_taxes  = {
        create: [],
        update: []
    };
    for (const item_country of h_array.sort( item_zone.countries, 'code' ) ) {
        
        let db_country = db_countries.find( (item) => item.iso_code_2 === item_country.code || item.iso_code_3 === item_country.code );
        
        if( db_country && ( format_document.country_states.length === 0 || ( format_document.country_states.length > 0 && format_document.country_states[format_document.country_states.length - 1].country_code != item_country.code ) ) ){
            
            db_country.brands              = item_group.brands;
            db_country.product_types       = item_group.product_types;
            db_country.product_categories  = item_group.product_categories;
            db_country.product_variants    = item_group.product_variants;
            if( item_country.tax > 0 ){

                let db_taxes = db_shipping_taxes.find( (item) => item.country_code === db_country.iso_code_2 && item.state_code === null && item.handle === h_format.slug( item_country.tax_name ) );
                let format_taxes = shippingTaxObject( id_marketplace, 'country', db_country, item_country, db_taxes, db_taxes ? false : true );

                shipping_taxes[db_taxes ? 'update' : 'create'].push( format_taxes );
            }
            let exist_country = false;
            for (const item_province of item_country.provinces) {
                
                let exist_province  = ![null, ''].includes(item_province) && db_country.states.find( (item_db_country) => item_db_country.iso_code === item_province.code );
                if( exist_province ){
                    
                    format_document.country_states.push({ 
                        country_code: db_country.iso_code_2, 
                        state_code  : item_province.code 
                    });
                    exist_country = true;
                }
                if( exist_province && item_province.tax_percentage > 0 ){
                    
                    let db_taxes = db_shipping_taxes.find( (item) => item.country_code === db_country.iso_code_2 && item.state_code === item_province.code && item.handle === h_format.slug( item_province.tax_name ) );
                    let format_taxes = shippingTaxObject( id_marketplace, 'state', db_country, item_province, db_taxes, db_taxes ? false : true );

                    shipping_taxes[db_taxes ? 'update' : 'create'].push( format_taxes );
                }
            }
            if( format_document.country_states.length === 0 && !exist_country ){
                
                format_document.country_states.push({ 
                    country_code: db_country.iso_code_2, 
                    state_code  : null 
                });
            }
        }
    }
    if( db_zone != null ){

        format_document = { 
            query   : { 
                _id: db_zone._id.toString(), 
            }, 
            document: format_document 
        };
    }
    else{
        
        format_document.marketplace         = id_marketplace;
        format_document.shipping_group      = h_validation.evalObjectId( item_group._id );
        format_document.shopify_id          = item_zone.id;
        format_document.name                = item_zone.name;
        format_document.handle              = h_format.slug( item_zone.name );
        format_document.country_zip_codes   = [];
    }
    return { zone: format_document, rates: { standard: standard_rates, variant: variant_rates }, taxes: shipping_taxes };
};
/**
* 
* @param {*} id_marketplace 
* @param {*} item_group 
* @param {*} item_rate 
* @param {*} shipping_type 
* @param {*} type_rate 
* @returns 
*/
function shippingRateObject( id_marketplace, item_group, item_rate, shipping_type, type_rate, db_rate ){
    
    let format_document = {
        shipping_type   : h_validation.evalObjectId( shipping_type?._id ),
        rate_type       : type_rate,
        price           : h_validation.evalFloat( item_rate.price ),
        min_weight      : type_rate === 'standard' ? h_validation.evalFloat( item_rate.weight_low ) : 0,
        min_total_order : type_rate === 'variant' ? h_validation.evalFloat( item_rate.min_order_subtotal ) : 0
    };

    if( db_rate ){
        
        format_document = { 
            query   : { 
                _id: db_rate._id.toString(), 
            }, 
            document: format_document 
        };
    }
    else{

        format_document.marketplace     = id_marketplace;
        format_document.shopify_id      = item_rate.id;
        format_document.shipping_group  = h_validation.evalObjectId( item_group._id );
        format_document.shipping_zone   = null;
        format_document.need_payment    = true;
        format_document.effect_on_price = 'replace';
    }
    return format_document;
};
/**
* 
* @param {*} id_marketplace 
* @param {*} type_tax 
* @param {*} item_country 
* @param {*} db_tax 
* @param {*} new_document 
* @returns 
*/
function shippingTaxObject( id_marketplace, type_tax, item_country, shopify_tax, db_tax, new_document = false ){
    
    let format_document = {
        brands          : h_validation.evalArray( item_country.brands ),
        product_types   : h_validation.evalArray( item_country.product_types ),
        product_variants: h_validation.evalArray( item_country.product_variants ),
        type_tax        : h_validation.evalString( shopify_tax.tax_type, 'normal' ),
        percentage      : type_tax === 'country' ? h_validation.evalFloat( shopify_tax.tax ) * 100 : h_validation.evalFloat( shopify_tax.tax_percentage )
    };
    if( new_document ){
        
        format_document.marketplace     = id_marketplace;
        format_document.country_code    = item_country.iso_code_2;
        format_document.state_code      = type_tax === 'country' ? null : h_validation.evalString( shopify_tax.code );
        format_document.name            = h_validation.evalString( shopify_tax.tax_name );
        format_document.handle          = h_format.slug( shopify_tax.tax_name );
    }
    else{
        
        format_document = { 
            query   : { 
                _id: db_tax._id
            }, 
            document: format_document 
        };
    }
    return format_document;
};
/**
* 
* @param {*} item_product_options 
* @param {*} db_variants 
* @param {*} sort_sizes 
* @returns 
*/
function productOptionsObject( db_product_options, item_product_options, db_variants, sort_sizes, languages ){
    
    let new_product_options = [];
    let db_options = db_product_options || [];
    for (const [index_option, item_option] of h_validation.evalArray( item_product_options ).entries()) {
        
        let new_option = {
            name        : h_validation.evalString( item_option.name ), 
            handle      : h_format.slug( item_option.name ),
            translate   : null,
            values      : []
        };
        let index_db_option = db_options.findIndex( (item_db_option) => item_db_option.name === new_option.name );
        if( index_db_option >= 0 ){
            
            new_option.translate = db_options[index_db_option].translate;
        }
        else{
            
            new_option.translate = languages.reduce( (previous_item, current_item) => {
                
                previous_item[current_item.key_code] = {
                    name            : new_option.name,
                    is_translated   : false
                };
                return previous_item;
            }, languages.length > 0 ? {} : null);
        }
        let new_option_values = [];
        for (const item_option_value of h_validation.evalArray( new_option.handle === 'size' ? sortSizeOptions( item_option.values, sort_sizes ) : item_option.values )) {
            
            let option_value = { 
                name        : item_option_value, 
                handle      : `${ h_format.slug( item_option.name ) }-${ h_format.slug( item_option_value ) }`,
                translate   : null,
                total_stock : 0,
                variants    : []
            };
            let index_option_variant = ( db_options[index_db_option]?.values || [] ).findIndex( (item_db_option_value) => item_db_option_value.handle === option_value.handle );
            if( index_option_variant >= 0 ){
                
                option_value.translate = db_options[index_db_option]?.values[index_option_variant].translate;
            }
            else{
                
                option_value.translate = languages.reduce( (previous_item, current_item) => {
                    
                    previous_item[current_item.key_code] = {
                        name            : option_value.name,
                        is_translated   : false
                    };
                    return previous_item;
                }, languages.length > 0 ? {} : null);
            }
            for (const item_db_option of db_variants.options) {
                
                if( item_db_option.values[index_option].handle === option_value.handle ){
                    
                    option_value.total_stock += item_db_option.inventory_quantity;
                    option_value.variants.push( item_db_option.sku );
                }
            }
            new_option_values.push( option_value );
        }
        new_option.values = new_option_values;
        new_product_options.push( new_option );
    }
    return new_product_options;
};
/**
* 
* @param {*} collection_rules 
* @param {*} collection_disjunctive 
* @returns 
*/
function queryCollectionProduct(id_marketplace, collection_rules, collection_disjunctive){
    
    let array_queries      = ( collection_rules || [] ).reduce( (previous_item, current_item, current_index) => {
        
        let { operator, field } = getDBOperatorField(current_item);
        let value               = current_item.condition = !isNaN( parseFloat( current_item.condition ) ) ? parseFloat( current_item.condition ) : current_item.condition;
        
        if( ['brand.handle', 'product_category.handle', 'tags'].includes( field ) ){
            
            value = h_format.slug( value );
        }
        let index_field = previous_item.details.findIndex( (item) => item.field === field && item.operator === operator );
        if( index_field >= 0 ){
            
            if( operator === "$gte" ){
                
                previous_item.details[ index_field ].value = previous_item.details[ index_field ].value <= value ? value : previous_item.details[ index_field ].value;
            }
            else if( operator === "$lte" ){
                
                previous_item.details[ index_field ].value = previous_item.details[ index_field ].value >= value ? value : previous_item.details[ index_field ].value;
            }
            else {
                
                previous_item.details[ index_field ].value.push( value );
            }
        }
        else{
            previous_item.details.push({
                field: field,
                operator: operator,
                value: ["$gte", "$lte"].includes(operator) ? value : [value],
            });
        }
        if( current_index === collection_rules.length - 1 ){
            
            previous_item.format = h_format.findQueryProducts(id_marketplace, previous_item.details, collection_disjunctive);
        }
        return previous_item;
    }, { format: [], details: [] });
    return array_queries;
};
/**
* 
* @param {*} item_order 
* @param {*} line_item 
* @returns 
*/
function lineItemDiscountObject( item_order, line_item, currency_format ){
    
    return h_validation.evalArray( line_item.discount_allocations ).reduce( (previous_item, current_item) => {
        
        let item_discount   = h_validation.evalArray( item_order.discount_codes ).find( (item_discount) => item_discount.code === item_order.discount_applications[current_item.discount_application_index].title );
        let value_type      = h_validation.evalString( item_order.discount_applications[current_item.discount_application_index].value_type );
        let discount_value  = 0;
        
        if( value_type === "fixed_amount" ){
            
            discount_value = h_format.currencyObject( h_validation.evalFloat( item_order.discount_applications[current_item.discount_application_index].value ) / h_validation.evalInt( line_item.quantity ), false, currency_format.locale, currency_format.code ).number;
        }
        else{
            
            discount_value = h_validation.evalFloat( item_order.discount_applications[current_item.discount_application_index].value );
        }
        previous_item.push({
            discount_code       : h_validation.evalString( item_discount?.code, null ),
            description         : h_validation.evalString( item_order.discount_applications[current_item.discount_application_index].description ),
            line_item_id        : h_validation.evalInt( line_item.id, null ),
            type_discount       : h_validation.evalString( item_order.discount_applications[current_item.discount_application_index].type ),
            target_type         : h_validation.evalString( item_order.discount_applications[current_item.discount_application_index].target_type ),
            value_type          : value_type,
            allocation_method   : h_validation.evalString( item_order.discount_applications[current_item.discount_application_index].allocation_method ),
            target_selection    : h_validation.evalString( item_order.discount_applications[current_item.discount_application_index].target_selection ),
            value               : discount_value,
            amount              : h_validation.evalFloat( current_item.amount )
        });
        return previous_item;
    }, []);
};
/**
* 
* @param {*} tax_lines 
* @returns 
*/
function taxLinesObject( tax_lines ){
    
    return h_validation.evalArray( tax_lines ).reduce( (previous_item, current_item) => {
        
        previous_item.push({
            price   : h_validation.evalFloat( current_item.price ),
            rate    : h_validation.evalFloat( current_item.rate ),
            title   : h_validation.evalString( current_item.title )
        });
        return previous_item;
    }, []);
};
/**
* 
* @param {*} discounts 
* @param {*} item_order 
* @returns 
*/
function orderDiscountObject( discounts, item_order ){
    
    return h_validation.evalArray( item_order.discount_applications ).reduce( (previous_item, current_item) => {
        
        let exit_item_discount = item_order.discount_codes.find( (item_discount) => item_discount.code === current_item.code );
        
        if( h_validation.evalString( current_item.type ) != "manual" ){
            
            previous_item.push({
                line_item_id        : null,
                discount_code       : h_validation.evalString( exit_item_discount?.code ),
                description         : h_validation.evalString( current_item.description ),
                type_discount       : h_validation.evalString( current_item.type ),
                value_type          : h_validation.evalString( current_item.value_type ),
                target_type         : h_validation.evalString( current_item.target_type ),
                target_selection    : h_validation.evalString( current_item.target_selection ),
                allocation_method   : h_validation.evalString( current_item.allocation_method ),
                value               : h_validation.evalFloat( current_item.value ),
                amount              : h_validation.evalFloat( current_item.value )
            });
        }
        return previous_item;
    }, discounts );
};
/**
* 
* @param {*} shipping_lines 
* @returns 
*/
function shippingLinesObject( shipping_lines ){
    
    return h_validation.evalArray( shipping_lines ).reduce( (previous_item, current_item) => {
        
        previous_item.push({
            code                            : h_validation.evalString( current_item.code ),
            discounted_price                : h_validation.evalFloat( current_item.discounted_price ),
            price                           : h_validation.evalFloat( current_item.price ),
            source                          : h_validation.evalString( current_item.source ),
            title                           : h_validation.evalString( current_item.title ),
            tax_lines                       : taxLinesObject( current_item.tax_lines ),
            carrier_identifier              : h_validation.evalString( current_item.carrier_identifier ),
            requested_fulfillment_service_id: h_validation.evalString( current_item.requested_fulfillment_service_id )
        });
        return previous_item;
    }, []);
};
/**
* 
* @param {*} order_refunds 
* @returns 
*/
function refundsObject( order_refunds ){
    
    return h_validation.evalArray( order_refunds ).reduce( (previous_item, current_item) => {
        previous_item.push({
            shopify_id          : h_validation.evalInt( current_item.id, null ),
            note                : h_validation.evalString( current_item.note ),
            restock             : h_validation.evalBoolean( current_item.restock ),
            total_duties        : h_validation.evalFloat( current_item.total_duties_set?.shop_money ? current_item.total_duties_set.shop_money.amount : 0 ),
            order_adjustments   : h_validation.evalArray( current_item.order_adjustments ).reduce( (previous_item_adjustment, current_item_adjustment) => {
                
                previous_item_adjustment.push({
                    shopify_id  : h_validation.evalInt( current_item_adjustment.id, null ),
                    amount      : h_validation.evalFloat( current_item_adjustment.amount ),
                    tax_amount  : h_validation.evalFloat( current_item_adjustment.tax_amount ),
                    kind        : h_validation.evalString( current_item_adjustment.kind ),
                    reason      : h_validation.evalString( current_item_adjustment.reason )
                });
                return previous_item_adjustment;
            }, []),
            transactions        : h_validation.evalArray( current_item.transactions ).reduce( (previous_item_transaction, current_item_transaction) => {
                
                previous_item_transaction.push({
                    shopify_id          : h_validation.evalInt( current_item_transaction.id, null ),
                    amount              : h_validation.evalFloat( current_item_transaction.amount ),
                    autorization        : h_validation.evalString( current_item_transaction.autorization ),
                    device_id           : h_validation.evalInt( current_item_transaction.device_id, null ),
                    error_code          : h_validation.evalString( current_item_transaction.error_code ),
                    gateway             : h_validation.evalString( current_item_transaction.gateway ),
                    kind                : h_validation.evalString( current_item_transaction.kind ),
                    localtion_id        : h_validation.evalObject( current_item_transaction.location_id, null ),
                    message             : h_validation.evalString( current_item_transaction.message ),
                    source_name         : h_validation.evalString( current_item_transaction.source_name ),
                    transaction_status  : h_validation.evalString( current_item_transaction.status ),
                    created_at          : h_format.shopifyDate( current_item_transaction.created_at ),
                    processed_at        : h_format.shopifyDate( current_item_transaction.processed_at )
                });
                return previous_item_transaction;
            }, []),
            refund_line_items   : h_validation.evalArray( current_item.refund_line_items ).reduce( (previous_refund_item, current_refund_item) => {
                
                previous_refund_item.push({
                    shopify_id  : h_validation.evalInt( current_refund_item.id, null ),
                    localtion_id: h_validation.evalInt( current_refund_item.localtion_id, null ),
                    line_item_id: h_validation.evalInt( current_refund_item.line_item_id, null ),
                    quantity    : h_validation.evalInt( current_refund_item.quantity ),
                    restock_type: h_validation.evalString( current_refund_item.restock_type ),
                    subtotal    : h_validation.evalFloat( current_refund_item.subtotal ),
                    total_taxes : h_validation.evalFloat( current_refund_item.total_tax )
                });
                return previous_refund_item;
            }, []),
            refund_shipping_lines: h_validation.evalArray( current_item.refund_shipping_lines ).reduce( (previous_shipping_item, current_shipping_item) => {
                
                previous_shipping_item.push({
                    shopify_id          : h_validation.evalInt( current_shipping_item.id, null ),
                    shipping_line_id    : h_validation.evalInt( current_shipping_item.shipping_line.id, null ),
                    subtotal            : h_validation.evalFloat( current_shipping_item.subtotal ),
                    total_taxes         : h_validation.evalFloat( current_shipping_item.total_tax )
                });
                return previous_shipping_item;
            }, []),
            created_at          : h_format.shopifyDate( current_item.created_at )
        });
        return previous_item;
    }, []);
};
/**
* 
* @param {*} item_order 
* @param {*} db_order 
*/
function fulfillmentObject( item_order, db_fulfillments ){
    
    let new_fulfillments = [];
    for (const item_fulfillment of h_validation.evalArray( item_order.fulfillments )) {
        
        let exist_fulfillment   = h_validation.evalArray( db_fulfillments ).find( (item_exist_fulfillment) => item_exist_fulfillment.shopify_id === item_fulfillment.id );
        let line_items          = h_validation.evalArray( item_fulfillment.line_items ).reduce( (previous_item, current_item) =>{
            
            previous_item.push( h_validation.evalInt( current_item.id, null ) );
            return previous_item;
        }, []);
        if( exist_fulfillment && exist_fulfillment?.history_shipment_status.length > 0 ){
            
            exist_fulfillment.history_shipment_status = exist_fulfillment.history_shipment_status.map( (item_shipment_status) => {
                return {
                    status      : item_shipment_status.stauts ? item_shipment_status.stauts : item_shipment_status.status,
                    updated_at  : item_shipment_status.updated_at
                };
            });
            let exist_status = exist_fulfillment.history_shipment_status[exist_fulfillment.history_shipment_status.length - 1].status;
            if( exist_status != item_fulfillment.shipment_status ){
                
                exist_fulfillment.history_shipment_status.push({ 
                    status      : h_validation.evalString( item_fulfillment.shipment_status ), 
                    updated_at  : h_format.shopifyDate( item_fulfillment.updated_at ) 
                });
            }
            else{
                exist_fulfillment.history_shipment_status[exist_fulfillment.history_shipment_status.length - 1].updated_at = h_format.shopifyDate( item_fulfillment.updated_at );
            }
        }
        new_fulfillments.push({
            shopify_id              : h_validation.evalInt( item_fulfillment.id, null ),
            location_id             : h_validation.evalInt( item_fulfillment.location_id, null ),
            name                    : h_validation.evalString( item_fulfillment.name ),
            service                 : h_validation.evalString( item_fulfillment.service ), 
            shipment_status         : h_validation.evalString( item_fulfillment.shipment_status ),
            history_shipment_status : exist_fulfillment && exist_fulfillment?.history_shipment_status?.length > 0 ? exist_fulfillment.history_shipment_status : [ { 
                status: h_validation.evalString( item_fulfillment.shipment_status ), 
                updated_at: h_format.shopifyDate( item_fulfillment.updated_at ) 
            } ],
            fulfillment_status      : h_validation.evalString( item_fulfillment.status ), 
            tracking_company        : h_validation.evalString( item_fulfillment.tracking_company ), 
            tracking_number         : h_validation.evalString( item_fulfillment.tracking_number ), 
            tracking_numbers        : h_validation.evalArray( item_fulfillment.tracking_numbers ), 
            tracking_url            : h_validation.evalString( item_fulfillment.tracking_url ), 
            tracking_urls           : h_validation.evalArray( item_fulfillment.tracking_urls ), 
            line_items              : line_items,
            created_at              : h_format.shopifyDate( item_fulfillment.created_at ), 
            updated_at              : h_format.shopifyDate( item_fulfillment.updated_at ), 
        });
    }
    return new_fulfillments;
};

/**
* 
* @param {*} order_address 
* @returns 
*/
function orderAddressObject( order_address ){
    
    if( order_address  ){
        
        order_address.phone = h_format.phoneShopify( order_address, order_address.phone );
    }
    order_address
    return {
        first_name  : h_validation.evalString( order_address?.first_name ),
        last_name   : h_validation.evalString( order_address?.last_name ),
        phone       : order_address?.phone ? h_format.phoneNumber( order_address?.phone ) : null,
        company     : h_validation.evalString( order_address?.company ),
        address_1   : h_validation.evalString( order_address?.address1 ),
        address_2   : h_validation.evalString( order_address?.address2 ),
        country     : h_validation.evalString( order_address?.country ),
        country_code: h_validation.evalString( order_address?.country_code ),
        state       : h_validation.evalString( order_address?.province ),
        state_code  : h_validation.evalString( order_address?.province_code ),
        city        : h_validation.evalString( order_address?.city ),
        zip         : h_validation.evalString( order_address?.zip ),
        latitude    : h_validation.evalFloat( order_address?.latitude, null ),
        longitude   : h_validation.evalFloat( order_address?.longitude, null )
    };
};
/**
* 
* @param {*} item_marketplace 
* @param {*} origins_field 
* @param {*} item_tags 
* @param {*} item_name 
* @returns 
*/
function selectOriginObject( item_marketplace, origins_field, item_tags, item_name ){
    
    let selected_origin = null;
    for (const item_origin of item_marketplace[origins_field]) {
        
        if( item_origin.values.length === 1 && ( ( item_origin.search?.field === 'tags' && item_tags.length > 0 && item_tags.indexOf( item_origin.search?.value ) >= 0 ) || ( item_origin.search?.field === 'name' && item_name != null && item_name.indexOf( item_origin.search?.value ) === 0 ) ) ){
            
            selected_origin = item_origin;
            break;
        }
    }
    if( selected_origin === null ){
        
        let main_origin = item_marketplace[origins_field].find( (item_origin) => item_origin.main );
        selected_origin    = main_origin || null;
    }
    return selected_origin;
};
/**
* 
* @param {*} id_marketplace 
* @param {*} best_seller_settings 
* @param {*} customer 
* @param {*} order_origin 
* @returns 
*/
function bestSellerTemplateObject(id_marketplace, best_seller_settings, customer = null, storefront = null, affiliate = null, order_origin = null, new_document = false ){
    
    let format_document = {
        range_months        : best_seller_settings.range_months,
        percentage_variant  : best_seller_settings.percentage_variant,
        percentage_product  : best_seller_settings.percentage_product,
        order_quantity      : 0,
        refund_quantity     : 0,
        total_quantity      : 0,
        total_amount        : 0,
        line_items          : [],
        products            : [],
        selected_filters    : [],
        filter_values       : {
            brands              : [],
            product_categories  : [],
            tags                : [],
            product_options     : [],
            prices              : {
                min_price       : null,
                max_price       : null
            }
        }
    };
    
    if( new_document ){
        
        format_document.marketplace     = id_marketplace;
        format_document.customer_id     = customer?.shopify_id ? customer.shopify_id : null;
        format_document.storefront      = storefront;
        format_document.affiliate       = affiliate;
        format_document.order_origin    = order_origin;
    }
    else{
        
        format_document = { 
            query   : { 
                marketplace : id_marketplace, 
                customer_id : customer?.shopify_id ? customer.shopify_id : null, 
                storefront  : storefront, 
                affiliate   : affiliate, 
                order_origin: order_origin
            }, 
            document: format_document 
        };
    }
    
    return format_document;
};
/**
* 
* @param {*} array_fields 
* @param {*} extract_features 
* @returns 
*/
function featuresProductObject( array_fields, extract_features ){ 
    
    return array_fields.reduce( (previous_item, current_item, current_index) => {
        
        if( current_item.hefesto === "silhouette" ){
            
            previous_item[current_item.hefesto] = h_validation.evalInt( extract_features[current_item.hefesto], null );
        }
        else if( current_item.hefesto.indexOf('uses') === 0 && extract_features[current_item.hefesto] != null && typeof extract_features[current_item.hefesto] != 'object' && previous_item.uses ){
            
            if( typeof extract_features[current_item.hefesto] != 'object' ){
                
                previous_item.uses.push( extract_features[current_item.hefesto] );
            }
        }
        else if( current_item.hefesto.indexOf('uses') === 0 ){
            
            previous_item.uses = extract_features[current_item.hefesto] != null && typeof extract_features[current_item.hefesto] != 'object' ? [extract_features[current_item.hefesto]] : [];
        }
        else if( current_item.hefesto.indexOf('compInnerMat') === 0 && extract_features[current_item.hefesto] != null && typeof extract_features[current_item.hefesto] != 'object' && previous_item.complementary_inner_material ){
            
            previous_item.complementary_inner_material.push( extract_features[current_item.hefesto] );
        }
        else if( current_item.hefesto.indexOf('compInnerMat') === 0 ){
            
            previous_item.complementary_inner_material = extract_features[current_item.hefesto] != null && typeof extract_features[current_item.hefesto] != 'object' ? [extract_features[current_item.hefesto]] : [];
        }
        else{
            
            previous_item[current_item.hefesto] = typeof extract_features[current_item.hefesto] != 'object' ? extract_features[current_item.hefesto] : null;
        }
        return previous_item;
    }, {});
};
/**
* 
* @param {*} format_order 
* @param {*} select_customer 
* @returns 
*/
function updateOrderCustomers(format_order, select_customer){
    
    select_customer.orders_count.current_year   += moment( format_order.created_at ).get('year') === moment( new Date() ).get('year') ? 1 : 0;
    select_customer.orders_count.last_year      += moment( format_order.created_at ).get('year') === moment( new Date() ).get('year') - 1 ? 1 : 0;
    
    select_customer.last_billing_address         = format_order.billing_address;
    if( ( select_customer.first_order === null || ( select_customer.first_order && moment(select_customer.first_order?.created_at).diff( moment(format_order.created_at) ) > 0 ) ) ){
        
        select_customer.first_order  = {
            shopify_id  : format_order.shopify_id,
            name        : format_order.name,
            created_at  : format_order.created_at,
            total_price : format_order.total_price
        };
    }
    if( ( select_customer.last_order === null || ( select_customer.last_order && moment(format_order.created_at).diff( moment(select_customer.last_order?.created_at) ) > 0 ) ) ){
        
        select_customer.last_order   = {
            shopify_id  : format_order.shopify_id,
            name        : format_order.name,
            created_at  : format_order.created_at,
            total_price : format_order.total_price
        };
    }
    return select_customer;
}
/**
* 
* @param {*} shopify_image_src 
* @param {*} size_image_src 
* @returns 
*/
function resizeUrlImage(shopify_image_src, size_image_src = null){
    
    let base_url        = 'https://cdn.shopify.com/';
    size_image_src      = size_image_src ? `_${ size_image_src }` : '';
    shopify_image_src   = h_validation.evalString(shopify_image_src, '');
    
    shopify_image_src   = shopify_image_src.replace(new RegExp(base_url, 'g'), '');
    
    let array_directory = shopify_image_src ? shopify_image_src.split('/') : [];
    
    let file_name       = array_directory.length > 0 ? array_directory[array_directory.length - 1].split('?v=')[0] : null;
    let type_file       = file_name ? file_name.substring( file_name.lastIndexOf(".") + 1 ) : null;
    
    if( array_directory.length > 0 && file_name && type_file ){
        
        array_directory[array_directory.length - 1] = file_name.replace( `.${ type_file }`, '' );
        
        return `${ base_url }${ array_directory.join('/') }${ size_image_src }.${ type_file }?v=${ h_format.randomNumber( 1000000000, 9999999999 ) }`;
    }
    else{
        
        return null;
    }
    
    // let type_folder = image.indexOf("/4906/files/") > 0 ? "files" : "products";
    // let split_url = image.split("?v=")[0].split(`/4906/${ type_folder }/`);
    
    // return `${ split_url[0]}/4906/${ type_folder }/${ split_url[1].substring( 0, split_url[1].lastIndexOf(".") ) }_${ size }.${ split_url[1].substring( split_url[1].lastIndexOf(".") + 1 ) }`;
};
/**
* 
* @param {*} product_tags 
* @returns 
*/
function configProductTags( product_tags ){
    
    return product_tags.reduce( (previous_item, current_item) => {
        
        if( current_item.indexOf('max_') >= 0 ){
            
            previous_item.max_stock = h_validation.evalInt( current_item.replace('max_', "") );
            previous_item.max_stock = previous_item.max_stock > 0 && previous_item.max_stock <= 100 ? 100 : previous_item.max_stock;
        }
        if( current_item.indexOf('moq_') >= 0 ){
            
            previous_item.moq = h_validation.evalInt( current_item.replace('moq_', "") );
        }
        if( current_item.indexOf('limit_stock_') >= 0 ){
            
            previous_item.sales_limit = h_validation.evalInt( current_item.replace('limit_stock_', "") );
        }
        previous_item.list.push( { name: current_item, handle: h_format.slug( current_item ) } );
        
        return previous_item;
    }, { max_stock: 0, moq: 0, sales_limit: 0, list: [] });
};
/**
* 
* @param {*} sort_collection 
* @param {*} sort_category 
* @returns 
*/
function sortCollection( sort_collection, sort_category ){
    
    let new_sort = {
        sort: 'default_sort',
        sort_direction: 1
    }
    switch (sort_collection) {
        case 'alpha-asc':
        new_sort = {
            sort: 'title',
            sort_direction: 1
        }
        break;
        case 'alpha-desc':
        new_sort = {
            sort: 'title',
            sort_direction: -1
        }
        break;
        case 'best-selling':
        new_sort = {
            sort: 'default_sort',
            sort_direction: 1
        }
        break;
        case 'created':
        new_sort = {
            sort: 'created_at',
            sort_direction: 1
        }
        break;
        case 'created-desc':
        new_sort = {
            sort: 'created_at',
            sort_direction: -1
        }
        break;
        case 'price-asc':
        new_sort = {
            sort: 'price.min_price',
            sort_direction: 1
        }
        break;
        case 'price-desc':
        new_sort = {
            sort: 'price.min_price',
            sort_direction: -1
        }
        break;
        default:
        break;
    }
    
    if( sort_category ){
        new_sort = { sort_category: 1, [new_sort.sort]: new_sort.sort_direction };
    }
    else{
        new_sort = { [new_sort.sort]: new_sort.sort_direction };
    }
    return new_sort;
};
/**
* 
* @param {*} variants 
* @param {*} sort_sizes 
* @returns 
*/
function sortVariants( variants, sort_sizes ){
    
    let sort_variants = [];
    for (const [index_size, item_size] of sort_sizes.entries()) {
        
        let item_variants = variants.filter( (item_variant) => item_variant.option1 === item_size || item_variant.option2 === item_size || item_variant.option3 === item_size );
        if( item_variants.length > 0 ){
            
            sort_variants.push( item_variants );
        }
        if( index_size === sort_sizes.length - 1 ){
            
            sort_variants = sort_variants.flat();
            sort_variants.push( variants.filter( (item_variant) => !sort_variants.find( (item_sort_variant) => item_sort_variant.sku === item_variant.sku ) ) );
            sort_variants = sort_variants.flat().map( (item_sort_variant, index_sort_variant) => {
                
                item_sort_variant.sort_variant = index_sort_variant;
                return item_sort_variant;
            });
        }
    }
    return sort_variants;
};
/**
* 
* @param {*} option_values 
* @param {*} sort_sizes 
* @returns 
*/
function sortSizeOptions( option_values, sort_sizes ){
    
    let sort_options = [];
    for (const [index_size, item_size] of sort_sizes.entries()) {
        
        let exist_value = option_values.find( (item_value) => item_value === item_size );
        if( exist_value ){
            
            sort_options.push( exist_value );
        }
        if( index_size === sort_sizes.length - 1 ){
            
            sort_options.push( option_values.filter( (item_value) => !sort_options.find( (item_sort_value) => item_sort_value === item_value ) ) );
            sort_options = sort_options.flat();
        }
    }
    return sort_options;
};
/**
* 
* @param {*} item_rule 
* @returns 
*/
function getDBOperatorField(item_rule){
    
    let operator    = null;
    let field       = null;
    if( item_rule.relation.indexOf("_than") >= 0 ){
        
        operator = item_rule.relation.indexOf('greater') >= 0 ? "$gte" : "$lte";
    }
    else if( item_rule.relation.indexOf("equals") >= 0 ){
        
        operator = item_rule.relation.indexOf('not_') >= 0 ? "$ne" : "$eq";
    }
    else if( item_rule.relation.indexOf("_with") >= 0 ){
        
        operator = item_rule.relation.indexOf('starts') >= 0 ? "$regex-^" : "$regex-+$";
    }
    else if( item_rule.relation.indexOf("contains") >= 0 ){
        
        operator = item_rule.relation.indexOf('not_') >= 0 ? "$not-regex" : "$regex";
    }
    switch (item_rule.column) {
        case "vendor":
        field = "brand.handle";
        break;
        case "variant_compare_at_price":
        field = operator === "$lte" ? "compare_at_price.max_price" : "compare_at_price.min_price";
        break;
        case "variant_price":
        field = operator === "$lte" ? "price.max_price" : "price.min_price";
        break;
        case "type":
        field = "product_category.handle";
        break;
        case "tag":
        field = "tags";
        break;
        case "title":
        field = "title";
        break;
        case "variant_weight":
        field = "total_weight";
        break;
        case "variant_inventory":
        field = "total_stock";
        break;
        case "variant_title":
        field = "variant_titles";
        break;
        default:
        field = null;
    }
    return { operator, field };
};
/**
* 
* @param {*} filter_values 
* @param {*} line_item 
*/
function getFilterValues( filter_values, item_product ){
    
    if( item_product.brand != null ){
        
        filter_values.brands.push( item_product.brand.handle );
    }
    if( item_product.product_category != null ){
        
        filter_values.product_categories.push( item_product.product_category.handle );
    }
    filter_values.tags             = filter_values.tags.concat( item_product.tags.map( (item) => item.handle ) );
    filter_values.product_options  = item_product.options.reduce( (previous_item_option, current_item_option) => {
        
        let index_variant = previous_item_option.findIndex( (item) => item.handle === current_item_option.handle );
        
        if( index_variant < 0 ){
            
            previous_item_option.push({
                handle  : current_item_option.handle,
                values  : current_item_option.values.map( (item) => item.handle )
            });
        }
        else{
            
            previous_item_option[ index_variant ].values = previous_item_option[ index_variant ].values.concat( current_item_option.values.map( (item) => item.handle ) );
        }
        return previous_item_option;
        
    }, filter_values.product_options );
    
    filter_values.prices.min_price        = filter_values.prices.min_price > item_product.price.min_price || filter_values.prices.min_price === null ? item_product.price.min_price : filter_values.prices.min_price;
    filter_values.prices.max_price        = filter_values.prices.max_price < item_product.price.max_price ? item_product.price.max_price : filter_values.prices.max_price;
    
    return filter_values;
};
/**
* 
* @param {*} line_item 
* @returns 
*/
function bestSellerProductOption( line_item, valid_refund, line_items_refunded ){
    
    return line_item.product.options.map( (item_option) => {
        return {
            name            : item_option.name, 
            handle          : item_option.handle, 
            values          : item_option.values.map( (item_option_value) => {
                
                let new_item_option_value = {
                    name                : item_option_value.name,	
                    handle              : item_option_value.handle,
                    skus                : item_option_value.skus,
                    order_quantity      : 0,
                    refund_quantity     : 0,
                    total_quantity      : 0, 
                    total_amount        : 0,
                    z_score_amount      : 0,
                    z_score_quantity    : 0,
                    z_score_combinate   : 0,
                    best_seller_quantty : false,
                    best_seller_amount  : false
                };
                if( item_option_value.skus.includes( line_item.sku ) ){
                    
                    new_item_option_value.order_quantity    += line_item.quantity,
                    new_item_option_value.refund_quantity   += valid_refund ? line_items_refunded : 0,
                    new_item_option_value.total_quantity    += calcSaleQuantity( line_item, valid_refund, line_items_refunded );
                    new_item_option_value.total_amount      += calcSaleTotal( line_item, valid_refund, line_items_refunded );
                }
                return new_item_option_value;
            })
        };
    });
};
/**
* 
* @param {*} line_item 
* @returns 
*/
function bestSellerVariant( line_item, valid_refund, line_items_refunded ){
    
    return {
        shopify_id          : line_item.variant.shopify_id,
        sku                 : line_item.variant.sku,
        options             : line_item.variant.options.map( (item_option) => {
            return { 
                name    : item_option.name, 
                handle  : item_option.handle 
            };
        }),
        order_quantity      : line_item.quantity,
        refund_quantity     : valid_refund ? line_items_refunded : 0,
        total_quantity      : calcSaleQuantity( line_item, valid_refund, line_items_refunded ),
        total_amount        : calcSaleTotal( line_item, valid_refund, line_items_refunded ),
        z_score_amount      : 0,
        z_score_quantity    : 0,
        z_score_combinate   : 0,
        best_seller_quantty : false,
        best_seller_amount  : false
    };
};
/**
* 
* @param {*} line_item 
* @returns 
*/
function calcSaleQuantity( line_item, valid_refund, line_items_refunded ){
    
    if( valid_refund ){
        
        return ( line_item.quantity - line_items_refunded ) > 0 ? ( line_item.quantity - line_items_refunded ) : 0;
    }
    else{
        
        return line_item.quantity;
    }
};
/**
* 
* @param {*} line_item 
* @returns 
*/
function calcSaleTotal( line_item, valid_refund, line_items_refunded ){
    
    let total_item_price    = ( line_item.price * calcSaleQuantity( line_item, valid_refund, line_items_refunded ) ) - line_item.total_discount;
    
    return total_item_price > 0 ? total_item_price : 0;
};
/**
* 
* @param {*} list_products 
* @param {*} limit_total_quantity 
* @returns 
*/
function evalBestSellerQuantity( list_products, limit_total_quantity ){
    
    let new_limit           = limit_total_quantity;
    let average             = list_products.reduce( (previous_item, current_item) => {
        return previous_item + current_item.total_quantity;
    },0) / list_products.length;
    let standard_deviation  = Math.sqrt( list_products.reduce( (previous_item, current_item) => {
        return previous_item + Math.pow( current_item.total_quantity - average, 2 );
    }, 0) / list_products.length );
    
    let sort_products       = h_array.sort( list_products, 'total_quantity', false ).map( (item_product, index_product) => {
        
        item_product.best_seller_quantty    = new_limit >= item_product.total_quantity;
        item_product.z_score_quantity       = standard_deviation === 0 ? 0 : ( item_product.total_quantity - average ) / standard_deviation;
        
        new_limit -= item_product.total_quantity;
        
        return item_product;
    });
    
    return {
        sort_products   : sort_products,
        limit           : new_limit
    };
};
/**
* 
* @param {*} list_products 
* @param {*} limit_total_amount 
* @returns 
*/
function evalBestSellerAmount( list_products, limit_total_amount ){
    
    let new_limit           = limit_total_amount;
    let average             = list_products.reduce( (previous_item, current_item) => {
        return previous_item + current_item.total_amount;
    },0) / list_products.length;
    let standard_deviation  = Math.sqrt( list_products.reduce( (previous_item, current_item) => {
        return previous_item + Math.pow( current_item.total_amount - average, 2 );
    }, 0) / list_products.length );
    
    let sort_products       = h_array.sort( h_array.sort( h_array.sort( h_array.sort( list_products, 'total_amount', false ).map( (item_product, index_product) => {
        
        item_product.total_amount       = h_format.currencyObject( item_product.total_amount ).number;
        item_product.best_seller_amount = new_limit >= item_product.total_amount;
        item_product.z_score_amount     = standard_deviation === 0 ? 0 : ( item_product.total_amount - average ) / standard_deviation;
        item_product.z_score_combinate  = item_product.z_score_amount + item_product.z_score_quantity;
        
        new_limit -= item_product.total_amount;
        
        return item_product;
    }), 'z_score_quantity', false ).map( (item_product, index_product) => {
        item_product.sort_quantity = index_product;
        return item_product;
    }), 'z_score_amount', false ).map( (item_product, index_product) => {
        item_product.sort_amount = index_product;
        return item_product;
    }), 'z_score_combinate', false ).map( (item_product, index_product) => {
        delete item_product.z_score_quantity;
        delete item_product.z_score_amount;
        delete item_product.z_score_combinate;
        item_product.sort_general = index_product;
        return item_product;
    });
    return {
        sort_products   : sort_products,
        limit           : new_limit
    };
};

/**
* 
* @param {*} general_settings 
* @param {*} format_product 
* @returns 
*/
function evalBestSellerOptionsVariants( config_best_seller, format_product ){
    
    let limit_options   = {
        total_quantity    : Math.ceil( format_product.total_quantity * ( config_best_seller.percentage_variant / 100 ) ),
        total_amount : ( format_product.total_amount * ( config_best_seller.percentage_variant / 100 ) )
    };
    let limit_variants  = {
        total_quantity    : Math.ceil( format_product.total_quantity * ( config_best_seller.percentage_variant / 100 ) ),
        total_amount : ( format_product.total_amount * ( config_best_seller.percentage_variant / 100 ) )
    };
    format_product.options = format_product.options.map( (item_option) => {
        
        let result_eval_quantity    = evalBestSellerQuantity( item_option.values, limit_options.total_quantity );
        item_option.values          = result_eval_quantity.sort_products;
        
        let result_eval_amount      = evalBestSellerAmount( item_option.values, limit_options.total_amount );
        item_option.values          = result_eval_amount.sort_products;
        
        return item_option;
    });
    
    let result_eval_quantity        = evalBestSellerQuantity( format_product.variants, limit_variants.total_quantity );
    format_product.variants         = result_eval_quantity.sort_products;
    
    let result_eval_amount          = evalBestSellerAmount( format_product.variants, limit_variants.total_amount );
    format_product.variants         = result_eval_amount.sort_products;
    
    return format_product;
};
/**
* 
* @param {*} extract_features 
* @param {*} field_feature 
* @param {*} array_data 
* @param {*} field_central 
* @returns 
*/
function cleanCentralSKUData( extract_features, field_feature, array_data, field_central ){
    
    let data_validate = { 
        data    : [], 
        value   : null, 
        errors  : [] 
    };
    
    array_data = h_array.sort( array_data, "value" );
    for (const [index_data, item_data] of array_data.entries()) {
        
        if( !h_validation.fields.null_items.includes( item_data.value ) ){
            
            item_data.value = h_validation.fields.n_a_items.includes( item_data.value.trim().toLowerCase() ) ? "N-A" : item_data.value.toLowerCase().trim();
        }
        
        if( !h_validation.fields.null_items.includes( item_data.value ) && ( data_validate.data.length === 0 || ( data_validate.data.length > 0 && data_validate.data[data_validate.data.length - 1].value === item_data.value ) ) ){
            
            if( data_validate.data.length === 0 ){
                
                data_validate.data.push( item_data );
            }
            data_validate.value = item_data.value;
        }
        else if( !h_validation.fields.null_items.includes( item_data.value ) && data_validate.data.length > 0 && data_validate.data[data_validate.data.length - 1].value != "" && data_validate.data[data_validate.data.length - 1].value != item_data.value ){
            
            extract_features.errors[data_validate.data[data_validate.data.length - 1].sku][field_central]    = data_validate.data[data_validate.data.length - 1].value;
            extract_features.errors[data_validate.data[data_validate.data.length - 1].sku].exist_error       = true;
            
            extract_features.errors[item_data.sku][field_central]    = item_data.value;
            extract_features.errors[item_data.sku].exist_error       = true;
        }
        if( array_data.length === index_data + 1 ){
            
            extract_features.data[field_feature] = data_validate.value;
            extract_features.data.count_blank    += h_validation.fields.null_items.includes( data_validate.value ) ? 1 : 0;
            extract_features.data.count_n_a      += h_validation.fields.n_a_items.includes( data_validate.value ) ? 1 : 0;
            if( field_feature === "silhouette" && h_validation.fields.null_items.includes( data_validate.value ) ){
                
                extract_features.data.not_silhouette = true;
            }
        }
    }
    return extract_features;
};
// =================================================================================================
// PROCESS CUSTOMERS
// =================================================================================================
function processShopifyCustomers( item_marketplace, shopify_result, main_action, customer_result, agent_result, next_nit ){
    
    return shopify_result.reduce( (previous_item, current_item) => {
        
        let index_db        = previous_item.db_documents.findIndex( (item) => item.shopify_id === current_item.id );
        let select_agent    = index_db < 0 ? agent_result.find( (item_agent) => current_item.tags.split(', ').indexOf( item_agent.tag ) ) : null;
        select_agent        = select_agent ? select_agent : null;
        select_agent        = select_agent === null && index_db >= 0 ? previous_item.db_documents[index_db].agent : select_agent;
        
        if( main_action === 'create' ){
            next_nit++;
        }
        if( main_action === 'create' || ( main_action != 'create' && index_db >= 0 ) ){
            
            let format_customer = customerObject( item_marketplace._id.toString(), current_item, select_agent, index_db >= 0 ? previous_item.db_documents[index_db] : null, next_nit, main_action === 'create' );
            if( format_customer ){
                
                previous_item[main_action].push( format_customer );
            }
        }
        return previous_item;
    }, { create: [], update: [], db_documents: [...customer_result] });
};
function processAddtionalDataByCustomers( item_marketplace, customer_created, setting_result, origin_main ){
    
    let action_documents = {
        best_sellers    : [],
        discounts       : [],
        statements      : [],
        convert_leads   : []
    };
    
    for (const item_customer of customer_created) {
        
        action_documents.best_sellers.push( bestSellerTemplateObject( item_marketplace._id.toString(), setting_result.config_best_seller.find( (item) => item.category === origin_main.values[0] ), item_customer, null, null, null, true ) );
        
        if( item_customer.is_wholesale && item_marketplace.access.wholesale?.discounts ){
            
            action_documents.discounts.push( { customer: item_customer._id, discounts: [] } );
        }
        if( item_customer.is_wholesale && item_marketplace.access.wholesale?.statement ){
            
            action_documents.statements.push( { idCustomer: item_customer._id } );
        }
        if( item_customer.is_wholesale && item_marketplace.access.wholesale?.lead ){
            
            action_documents.convert_leads.push( { email: item_customer.email } );
        }
    }
    return action_documents;
};
// =================================================================================================
// PROCESS USERS
// =================================================================================================
function processCustomerUsers( item_marketplace, db_customers, user_result, action_user, origin_main ){
    
    return db_customers.reduce( (previous_item, current_item) => {
        
        let index_db    = previous_item.db_documents.findIndex( (item) => ( item.customer != null ? item.customer.toString() : null ) === current_item._id.toString() );
        
        if( action_user === 'create' || ( action_user != 'create' && index_db >= 0 ) ){
            let format_user = userObject( item_marketplace._id.toString(), { role: origin_main.customer_role, password: null, application_type: origin_main?.values[0] }, current_item, index_db >= 0 ? previous_item.db_documents[index_db] : null, action_user === 'create' );
            if( format_user ){
                
                previous_item[action_user].push( format_user );
            }
        }
        return previous_item;
    }, { create: [], update: [], db_documents: [...user_result] });
    
};
// =================================================================================================
// PROCESS BRANDS
// =================================================================================================
function processBrandData( item_marketplace, brand_result, product_result, language_result ){
    
    let db_brands           = h_array.sort( brand_result, 'name' );
    let product_data        = h_array.sort( product_result, 'brand.name' ).reduce( (previous_item, current_item) => { 
        
        if( current_item.sku_parent.brand != 'POP' && ( previous_item.length === 0 || ( previous_item.length > 0 && previous_item[ previous_item.length - 1 ].brand.name != current_item.brand.name ) ) ){
            
            previous_item.push( current_item );
        }
        return previous_item; 
    }, []);
    return product_data.reduce( (previous_item, current_item, current_index) => {
        
        let index_db        = previous_item.db_documents.findIndex( (item) => item.name === current_item.brand.name );
        let format_brand    = brandObject( item_marketplace._id.toString(), index_db >= 0 ? previous_item.db_documents[index_db] : null, current_item.brand, current_item.sku_parent, language_result, true );
        
        if( format_brand && index_db < 0 && ( previous_item.create.length === 0 || previous_item.create[ previous_item.create.length - 1 ].name != format_brand.name ) ){
            
            previous_item.create.push( format_brand );
        }
        else if ( format_brand && index_db >= 0 && ( previous_item.update.length === 0 || previous_item.update[ previous_item.update.length - 1 ].name != format_brand.name ) ){
            
            format_brand.document.tag = previous_item.db_documents[index_db].tag != null && previous_item.db_documents[index_db].tag != format_brand.document.tag ? previous_item.db_documents[index_db].tag : format_brand.document.tag;
            previous_item.delete.splice( previous_item.delete.findIndex( (item) => item.name === format_brand.document.name ), 1 );
            previous_item.update.push( format_brand );
        }
        if( current_index === existing_brands.length - 1 ){
            
            previous_item.delete = previous_item.delete.reduce( (previous_delete_item, current_delete_item) => {
                
                if( !current_delete_item.deleted ){
                    
                    previous_delete_item.push( current_delete_item._id.toString() );
                }
                return previous_delete_item;
            }, [] );
        }
        return previous_item;
    }, { create: [], update: [], delete: [...db_brands], db_documents: [...db_brands] } );
};
// =================================================================================================
// PROCESS PRODUCT TYPES
// =================================================================================================
function processProductCategoryData( item_marketplace, product_category_result, product_result, language_result ){
    
    let db_product_categories           = h_array.sort( product_category_result, 'name' );
    let existing_product_categories     = [... new Set( product_result.reduce( (previous_item, current_item) => {
        
        if( ![null, ""].includes( current_item.product_category ) ){
            
            previous_item.push( current_item.product_category );
        }
        return previous_item;
    }, [] ) )];
    return existing_product_categories.reduce( (previous_item, current_item, current_index) => {
        
        let index_db = previous_item.db_documents.findIndex( (item) => item.name === current_item );
        
        if( index_db < 0 && ( previous_item.create.length === 0 || previous_item.create[ previous_item.create.length - 1 ].name != current_item ) ){
            
            let format_product_category = productCategoryObject( item_marketplace._id.toString(), null, current_item, language_result, true );
            if( format_product_category ){
                
                previous_item.create.push( format_product_category );
            }
        }
        else if ( index_db >= 0 && ( previous_item.update.length === 0 || previous_item.update[ previous_item.update.length - 1 ].name != current_item ) ){
            
            let format_product_category = productCategoryObject( item_marketplace._id.toString(), previous_item.db_documents[index_db], current_item, language_result, false );
            if( format_product_category ){
                previous_item.delete.splice( previous_item.delete.findIndex( (item) => item.name === format_product_category.document.name ), 1 );
                previous_item.update.push( format_product_category );
            }
        }
        if( current_index === existing_product_categories.length - 1 ){
            
            previous_item.delete = previous_item.delete.reduce( (previous_delete_item, current_delete_item) => {
                
                if( !current_delete_item.delete ){
                    
                    previous_delete_item.push( current_delete_item._id.toString() );
                }
                return previous_delete_item;
            }, [] );
        }
        return previous_item;
    }, { create: [], update: [], delete: [...db_product_categories], db_documents: [...db_product_categories] } );
};
// =================================================================================================
// PROCESS PRODUCTS
// =================================================================================================
function processProductVariantData( product_variants, item_variant, main_action ){
    
    if( main_action === 'create' ){
        
        product_variants.variants.push( item_variant._id.toString() );
    }
    product_variants.skus.push( item_variant.sku );
    product_variants.variant_titles.push( item_variant.title );
    product_variants.options.push( { 
        sku                 : item_variant.sku, 
        options             : item_variant.options, 
        inventory_quantity  : item_variant.inventory_quantity 
    } );
    
    product_variants.total_stock            += item_variant.inventory_quantity;
    product_variants.total_weight           += item_variant.weight;
    product_variants.sku_parent             = item_variant.sku_parent;
    product_variants.min_compare_at_price   = product_variants.min_compare_at_price > item_variant.compare_at_price || product_variants.min_compare_at_price === 0 ? item_variant.compare_at_price : product_variants.min_compare_at_price;
    product_variants.max_compare_at_price   = product_variants.max_compare_at_price < item_variant.compare_at_price ? item_variant.compare_at_price : product_variants.max_compare_at_price;
    product_variants.min_price              = product_variants.min_price > item_variant.price || product_variants.min_price === null ? item_variant.price : product_variants.min_price;
    product_variants.max_price              = product_variants.max_price < item_variant.price ? item_variant.price : product_variants.max_price;
    product_variants.changes                += 1;
    return product_variants;
};
function processProductData( item_marketplace, main_action, shopify_products, db_data ){
    
    let action_documents    = { 
        products            : {
            create  : [],
            update  : [],
            db_data : [...db_data.product_result]
        },
        brands              : [],
        product_categories  : [],
        tags                : [],
        notifications       : {
            inventory   : [],
            price       : []
        },
        
    };
    let min_date_notification = new Date( new Date( moment().subtract(5, 'minutes') ).toISOString() );
    let brand_sku_parent = [];
    for (const item_product of shopify_products){
        
        let product_origin      = selectOriginObject( item_marketplace, 'product_origins', item_product.tags.split(", "), h_validation.evalString( item_product.name ) );
        let index_db_product    = action_documents.products.db_data.findIndex( (item) => item.shopify_id === item_product.id );
        
        if( !['Test'].includes( item_product.vendor ) && ( item_product.variants != null || item_product.variants.length > 0 ) ){
            
            item_product.product_origin = product_origin.handle;
            item_product.config_product = product_origin.values[0];
            item_product.discount_stock = item_product.tags.split(', ').reduce( (previous_item, current_item) => {
                
                if( /DISCOUNT-\d{2}-MIN-\d{2}-/.test(current_item) ){
                    let new_item = {
                        value       : parseInt(current_item.split('-')[1]),
                        min_stock   : parseInt(current_item.split('-')[3])
                    };
                    new_item.sku = current_item.replace(`DISCOUNT-${ new_item.value }-MIN-${ new_item.min_stock }-`, '');
                    previous_item.push(new_item);
                }
                return previous_item;
            }, []);
            if( ![null, ''].includes( h_validation.evalString( item_product.vendor ) ) ){
                action_documents.brands.push( h_validation.evalString( item_product.vendor ).trim() );
            }
            if( ![null, ''].includes( h_validation.evalString( item_product.tags ) ) ){
                action_documents.tags.push( h_validation.evalString( item_product.tags ).trim().split(', ').filter( (item) => !(/(NODROPSHIPPING|max_|limit_stock_|moq_|DISCOUNT-\d{2}-MIN-\d{2}-)/).test(item) ) );
            }
            if( ![null, ''].includes( h_validation.evalString( item_product.product_type ) ) ){
                action_documents.product_categories.push( h_validation.evalString( item_product.product_type ).trim() );
            }
            let db_variants         = index_db_product >= 0 ? JSON.parse( JSON.stringify( action_documents.products.db_data[index_db_product].variants ) ) : [];
            let product_variants    = { 
                variants            : [], 
                skus                : [], 
                variant_titles      : [],
                options             : [],
                sku_parent          : null,
                total_stock         : 0,
                total_weight        : 0,
                max_price           : null,
                min_price           : null,
                min_compare_at_price: 0,
                max_compare_at_price: 0,
                changes             : 0
            };
            if( main_action === 'update' && index_db_product >= 0 && item_product.variants?.length > 0 ){
                
                product_variants.variants = action_documents.products.db_data[index_db_product].variants.map( (item) => item._id.toString() );
            }
            let action_variants     = {
                create  : [],
                update  : [],
                delete  : JSON.parse( JSON.stringify( db_variants.reduce( (previous_item, current_item) => { 
                    
                    previous_item.push( { _id: current_item._id.toString(), shopify_id: current_item.shopify_id, sku: current_item.sku } ); 
                    return previous_item; 
                }, []) ) )
            };
            let notification_data   = {
                product_id  : item_product.id.toString(),
                title       : item_product.title,
                handle      : item_product.handle,
                url         : `https://shop.com/products/${ item_product.handle }`
            };
            for (const item_variant of sortVariants( item_product.variants.filter( (item_v) => ![null, ''].includes( item_v.sku ) ), db_data.setting_result.sort_sizes ) ){
                
                let index_db_variant = index_db_product < 0 ? -1 : action_documents.products.db_data[index_db_product].variants.findIndex( (item) => parseInt( item.shopify_id ) === parseInt( item_variant.id ) );
                
                if( index_db_variant < 0 ){
                    
                    let format_variant  = variantObject( item_marketplace._id.toString(), item_variant, item_product, null, true );
                    
                    if( format_variant && format_variant?.sku_parent?.brand && format_variant?.sku_parent?.brand != 'POP' ){
                        
                        brand_sku_parent.push({ 
                            brand: h_validation.evalString( item_product.vendor ), 
                            sku_parent: format_variant.sku_parent
                        });
                    }
                    if( format_variant ){
                        
                        action_variants.create.push( format_variant );
                        
                        if( new Date( format_variant.updated_at ) >= min_date_notification && format_variant.inventory_quantity >= 10 ){
                            
                            action_documents.notifications.inventory.push({...notification_data, variant: {
                                sku         : format_variant.sku,
                                options     : format_variant.options.reduce( (previous_item, current_item) => { previous_item.push( `*${ current_item.name }:* ${ current_item.value }` ); return previous_item; }, []).join(', '),
                                old_quantity: 0,
                                new_quantity: format_variant.inventory_quantity
                            } });
                        }
                    }
                }
                else if( main_action === 'update' && index_db_variant >= 0 ){
                    
                    let db_variant      = action_documents.products.db_data[index_db_product].variants[index_db_variant];
                    
                    let format_variant  = variantObject( item_marketplace._id.toString(), item_variant, item_product, db_variant, false );
                    
                    if( format_variant?.document && format_variant?.document.sku_parent?.brand && format_variant?.document.sku_parent?.brand != 'POP' && ![null, ''].includes( h_validation.evalString( item_product.vendor ) ) ){
                        
                        brand_sku_parent.push({ 
                            brand: h_validation.evalString( item_product.vendor ).trim(), 
                            sku_parent: format_variant.document.sku_parent
                        });
                    }
                    if( format_variant?.document ){
                        
                        action_variants.update.push( format_variant );
                    }
                    product_variants    = processProductVariantData( product_variants, format_variant.product, 'update' );
                    action_variants.delete.splice( action_variants.delete.findIndex( (item) => item.sku === format_variant.product.sku ), 1 );
                    
                    if( format_variant?.document && format_variant.document?.inventory_quantity != undefined && new Date( format_variant.document.updated_at ) >= min_date_notification && ( format_variant.document.inventory_quantity - db_variant.inventory_quantity >= 10 ) ){
                        
                        action_documents.notifications.inventory.push({
                            ...notification_data, 
                            variant: {
                                sku         : db_variant.sku,
                                options     : db_variant.options.reduce( (previous_item, current_item) => { previous_item.push( `*${ current_item.name }:* ${ current_item.value }` ); return previous_item; }, []).join(', '),
                                old_quantity: db_variant.inventory_quantity,
                                new_quantity: format_variant.document.inventory_quantity
                            } 
                        });
                    }
                    if( format_variant?.document && format_variant.document?.price != undefined && new Date( format_variant.document.updated_at ) >= min_date_notification && format_variant.document.price != db_variant.price ){
                        
                        action_documents.notifications.price.push({
                            ...notification_data, 
                            variant: {
                                sku         : db_variant.sku,
                                options     : db_variant.options.reduce( (previous_item, current_item) => { previous_item.push( `*${ current_item.name }:* ${ current_item.value }` ); return previous_item; }, []).join(', '),
                                old_price   : db_variant.price,
                                new_price   : format_variant.document.price
                            } 
                        });
                    }
                }
            }
            if( main_action === 'create' || ( main_action != 'create' && index_db_product >= 0 ) ){
                
                action_documents.products[main_action].push( { data: item_product, action_variants: action_variants, data_variants: product_variants, db_product: index_db_product >= 0 ? action_documents.products.db_data[index_db_product] : null } );
            }
        }
    }
    action_documents.brands = [...new Set( action_documents.brands )].reduce( (previous_item, current_item) => {
        
        let new_brand = {
            name    : current_item,
            handle  : h_format.slug( current_item )
        };
        if( db_data.brand_result.findIndex( (item) => item.handle === new_brand.handle ) < 0 ){
            
            let exist_parent = brand_sku_parent.find( (item) => item.brand === new_brand.name );
            let format_brand = brandObject( item_marketplace._id.toString(), null, new_brand, exist_parent ? exist_parent.sku_parent : null, db_data.language_result, true );
            previous_item.push( format_brand );
        }
        return previous_item;
    }, []);
    action_documents.tags = [...new Set( action_documents.tags.flat() )].reduce( (previous_item, current_item) => {
        
        let new_tag = {
            name    : current_item,
            handle  : h_format.slug( current_item ),
            category: 'product'
        };
        if( db_data.tag_result.findIndex( (item) => item.handle === new_tag.handle ) < 0 ){
            
            let format_tag = tagObject( item_marketplace._id.toString(), null, new_tag, db_data.language_result, true );
            previous_item.push( format_tag );
        }
        return previous_item;
    }, []);
    action_documents.product_categories = [...new Set( action_documents.product_categories )].reduce( (previous_item, current_item) => {
        
        let new_product_category = {
            name    : current_item,
            handle  : h_format.slug( current_item )
        };
        if( db_data.product_category_result.findIndex( (item) => item.handle === new_product_category.handle ) < 0 ){
            
            let format_product_category = productCategoryObject( item_marketplace._id.toString(), null, new_product_category, db_data.language_result, true );
            previous_item.push( format_product_category );
        }
        return previous_item;
    }, []);
    
    return action_documents;
};
// =================================================================================================
// PROCESS COLLECTIONS
// =================================================================================================
async function processCollectionData( item_marketplace, main_action, shopify_shop, shopify_collections, collection_result, language_result, setting_result ) {
    
    let action_documents    = {
        create: [],
        update: []
    };
    for (const item_collection of shopify_collections) {
        
        let index_db_collection = collection_result.findIndex( (item_db_collection) => item_db_collection.shopify_id === item_collection.id );
        
        
        let format_collection   = collectionObject( item_marketplace._id.toString(), item_collection, index_db_collection < 0 ? null : collection_result[index_db_collection], language_result, setting_result.general_filters, main_action === 'create' );
        
        if( format_collection != null && item_collection.rules && ( main_action === 'create' || ( main_action != 'create' && index_db_collection >= 0 ) ) ){
            
            action_documents[main_action].push( format_collection );
        }
        else if( format_collection != null && ( main_action === 'create' || ( main_action != 'create' && index_db_collection >= 0 ) ) ){
            
            let shopify_result = await shopify.paginateQuery( shopify_shop, shopify_shop.collection, shopify_shop.collection.products, null, item_collection.id );
            if( shopify_result.success ){
                
                let query_products = { 
                    format: { 
                        deleted: false,
                        marketplace: item_marketplace._id.toString(), 
                        shopify_id: { $in: shopify_result.body.map( (item) => item.id ) },
                        status_created: 'active',
                        status: 'active'
                    }, 
                    details : [
                        {
                            field : 'shopify_id', 
                            operator : '$in', 
                            value : shopify_result.body.map( (item) => item.id )
                        }
                    ],
                };
                if( main_action === 'create' ){
                    
                    format_collection.query_products = query_products;
                }
                else{
                    
                    format_collection.document.query_products = query_products;
                }
                action_documents[main_action].push( format_collection );
            }
        }
    }
    return action_documents;
};
// =================================================================================================
// PROCESS ORDERS
// =================================================================================================
async function processOrderData( item_marketplace, main_action, shopify_result, db_data ){
    
    let action_documents = { 
        create      : [], 
        update      : [],
        customers   : [],
        drafts      : [],
        first_orders: [],
    };
    
    for (const item_order of h_array.sort( shopify_result, 'number' )) {
        
        let  index_db_draft = db_data.draft_result.findIndex( (item_db_draft) => item_db_draft.order_id === item_order.id );
        
        let order_origin    = selectOriginObject( item_marketplace, 'order_origins', item_order.tags.split(", "), h_validation.evalString( item_order.name ) );
        let index_customer  = db_data.customer_result.findIndex( (item_customer) => item_customer.shopify_id === item_order.customer?.id );
        
        if( order_origin && order_origin.access.orders ){
            
            let index_db_order          = db_data.order_result.findIndex( (item_db_order) => item_db_order.shopify_id === item_order.id );
            let new_line_items          = {
                create  : [],
                update  : []
            };
            let create_invoice          = null;
            let extract_order_data      = {
                ids                 : [],
                discounts           : [],
                variants            : [],
                brands              : [],
                skus                : [],
                storefront          : db_data.draft_result[index_db_draft]?.note_attributes.find( (item) => item.name === 'storefront' )?.value || null,
                affiliate           : db_data.draft_result[index_db_draft]?.note_attributes.find( (item) => item.name === 'affiliate' )?.value || null,
                draft_id            : db_data.draft_result[index_db_draft]?.note_attributes.find( (item) => item.name === 'draft-order-shopify' )?.value || null,
                payment_method      : db_data.draft_result[index_db_draft]?.note_attributes.find( (item) => item.name === 'payment_method' )?.value || null,
                product_origin      : db_data.draft_result[index_db_draft]?.note_attributes.find( (item) => item.name === 'product_origins' )?.value || null,
                id_product_bundle   : db_data.draft_result[index_db_draft]?.note_attributes.find( (item) => item.name === "product_bundle" )?.value || null,
                bundle_details      : db_data.draft_result[index_db_draft]?.bundle_details || null,
                preorder_details    : db_data.draft_result[index_db_draft]?.preorder_details || null,
                id_pre_order        : db_data.draft_result[index_db_draft]?.note_attributes.find( (item) => item.name === "preorder" )?.value || null,
                coupon              : db_data.draft_result[index_db_draft]?.note_attributes.find( (item) => item.name === "coupon" )?.value || null,
                db_fulfillments     : index_db_order >= 0 ? db_data.order_result[index_db_order]?.fulfillments || [] : []
            };
            let new_transactions        = {
                create  : [],
                update  : []
            };
            let index_order_customer    = action_documents.customers.findIndex( (item_customer) => item_customer.shopify_id === item_order.customer?.id );
            
            let select_customer         = index_order_customer > 0 ? action_documents.customers[index_order_customer] : null;
            
            if( index_customer >= 0 && select_customer === null ){
                
                select_customer = {
                    query   : {
                        _id         : db_data.customer_result[index_customer]._id.toString(),
                        shopify_id  : db_data.customer_result[index_customer].shopify_id
                    },
                    document: {
                        last_billing_address: db_data.customer_result[index_customer].last_billing_address,
                        orders_count        : db_data.customer_result[index_customer].orders_count,
                        first_order         : db_data.customer_result[index_customer].first_order,
                        last_order          : db_data.customer_result[index_customer].last_order
                    }
                };
            }
            for (const line_item of item_order.line_items) {
                
                let index_db_line_item      = index_db_order >= 0 ? db_data.order_result[index_db_order].line_items.findIndex( (db_line_item) => db_line_item.shopify_id === line_item.id ) : -1;
                let db_storefront           = extract_order_data.storefront ? db_data.storefront_result.find( (item) => item._id === extract_order_data.storefront ) : null;
                let db_affiliate            = extract_order_data.affiliate ? db_data.affiliate_result.find( (item) => item._id === extract_order_data.affiliate ) : null;
                let format_line_item        = lineItemObject( item_marketplace, line_item, item_order, order_origin, index_db_line_item < 0 );
                if( db_storefront != null ){
                    
                    let commision = db_storefront.commisions.discounts.reduce( (previous_item, current_item) => {
                        
                        if( current_item.brand?.handle === h_format.slug( h_validation.evalString( line_item.vendor ) ) ){
                            
                            previous_item = current_item.valueDiscount;
                        }
                        return previous_item;
                    }, 0);
                    db_storefront = {
                        _id         : db_storefront._id,
                        commision   : commision,
                        store_fee   : 100 - commision
                    };
                }
                if( db_affiliate != null ){
                    
                    db_affiliate = {
                        _id         : db_affiliate._id,
                        commision   : db_affiliate.commision,
                        store_fee   : 100 - db_affiliate.commision
                    };
                }
                if( index_db_line_item < 0 ){
                    
                    extract_order_data.discounts.push( format_line_item.discounts );
                    if( format_line_item.variant_title != null ){
                        extract_order_data.variants.push( format_line_item.variant_title );
                    }
                    if( format_line_item.brand != null ){
                        extract_order_data.brands.push( format_line_item.brand );
                        format_line_item.brand      = { 
                            name    : format_line_item.brand, 
                            hanlde  : h_format.slug( format_line_item.brand ) 
                        };
                    }
                    extract_order_data.skus.push( format_line_item.sku );
                    
                    if( db_storefront != null || db_affiliate != null ){
                        
                        new_transactions.create.push({
                            id_marketplace  : item_marketplace._id.toString(),
                            storefront      : db_storefront,
                            affiliate       : db_affiliate,
                            customer_id     : select_customer != null   ? select_customer.query.shopify_id  : null,
                            line_item       : {
                                shopify_id      : format_line_item.shopify_id,
                                brand           : format_line_item.brand,
                                price           : format_line_item.price,
                                quantity        : format_line_item.quantity,
                                total_discount  : format_line_item.total_discount,
                                total_taxes     : format_line_item.total_taxes,
                                created_at      : format_line_item.created_at
                            }
                        });
                    }
                    format_line_item.storefront = extract_order_data.storefront;
                    format_line_item.affiliate  = extract_order_data.affiliate;
                    
                    new_line_items.create.push( format_line_item );
                }
                else {
                    
                    extract_order_data.ids.push( db_data.order_result[index_db_order].line_items[index_db_line_item]._id.toString() );
                    extract_order_data.discounts.push( format_line_item.document.discounts );
                    extract_order_data.variants.push( format_line_item.document.variant_title );
                    extract_order_data.brands.push( format_line_item.document.brand );
                    extract_order_data.skus.push( format_line_item.document.sku );
                    
                    format_line_item.document.storefront    = extract_order_data.storefront;
                    format_line_item.document.affiliate     = extract_order_data.affiliate;
                    format_line_item.document.brand         = { 
                        name    : format_line_item.document.brand, 
                        hanlde  : h_format.slug( format_line_item.document.brand ) 
                    };
                    
                    new_line_items.update.push( format_line_item );
                }
            }
            let format_order = orderObject( item_marketplace, order_origin, item_order, extract_order_data, index_db_order < 0 );
            
            if( select_customer != null ){
                
                if( select_customer.document.first_order === null ){

                    action_documents.first_orders.push( select_customer.query._id );
                }
                select_customer.document    = updateOrderCustomers( index_db_order < 0 ? format_order : format_order.document, select_customer.document );
                
                if( index_order_customer < 0 ){
                    
                    action_documents.customers.push( select_customer );
                }
                else{
                    
                    action_documents.customers[index_order_customer] = select_customer;
                }
            }
            if( index_db_order < 0 ){
                
                format_order.note_attributes    = db_data.draft_result[index_db_draft]?.note_attributes || null;
                format_order.customer           = select_customer != null ? select_customer.query._id : null;
                format_order.customer_id        = select_customer != null ? select_customer.query.shopify_id : null;
                
                action_documents.drafts.push({ 
                    query   : { order_id: format_order.shopify_id.toString() },
                    document: { deleted: true, deleted_at: new Date() } 
                });
                if( order_origin.access.invoices ){
                    
                    create_invoice = { 
                        order_id        : null, 
                        payment_method  : extract_order_data.payment_method, 
                        draft_id        : extract_order_data.draft_id 
                    };
                }
            }
            if( main_action === 'create' || ( main_action != 'create' && index_db_order >= 0 ) ){
                
                action_documents[main_action].push({
                    order               : format_order,
                    extract_order_data  : extract_order_data,
                    line_items          : new_line_items[main_action],
                    transactions        : new_transactions[main_action],
                    invoice             : create_invoice
                });
            }
        }
    }
    return action_documents;
};
async function processCreateOrder( item_marketplace, shopify_result, db_servieces ){
    try {
        
        if( shopify_result.success && shopify_result.body.length > 0 ){
            
            let shopify_data    = shopify_result.body.reduce( (previous_item, current_item) => { 
                
                previous_item.ids.push( current_item.id );
                previous_item.draft_ids.push( current_item.id.toString() );
                if( current_item.customer != null ){ 
                    
                    previous_item.customers.push( current_item.customer.id ); 
                } 
                return previous_item; 
            }, { ids: [], draft_ids: [], customers: [] });
            
            let draft_result    = await db_servieces.draft_order.find({ order_id: { $in: shopify_data.draft_ids }, step_order: 'draft-completed' }, { order_id: 1, coupon: 1, note_attributes: 1, bundle_details: 1 });
            let order_result    = await db_servieces.order.findDelete({ marketplace: item_marketplace._id.toString(), shopify_id: { $in: shopify_data.ids } }, null, null, { populate: { path: 'line_items' } });
            let customer_result = await db_servieces.customer.findDelete({ marketplace: item_marketplace._id.toString(), shopify_id: { $in: shopify_data.customers } });
            
            if( customer_result.success && order_result.success && draft_result.success ){
                
                let data_draft          = draft_result.body.reduce( (previous_item, current_item) => {
                    
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
                let storefront_result   = await db_servieces.storefront.findDelete({ marketplace: item_marketplace._id.toString(), _id: { $in: data_draft.storefront_ids } });
                let affiliate_result    = await db_servieces.affiliate.findDelete({ marketplace: item_marketplace._id.toString(), _id: { $in: data_draft.affiliate_ids } });
                
                if( storefront_result.success && affiliate_result.success ){
                    
                    let db_data             = {
                        draft_result        : draft_result.body, 
                        storefront_result   : storefront_result.body, 
                        affiliate_result    : affiliate_result.body, 
                        transaction_result  : [], 
                        order_result        : [], 
                        customer_result     : customer_result.body
                    };
                    let db_shopify_ids      = order_result.body.map( (item) => item.shopify_id );
                    let action_documents    = await processOrderData( item_marketplace, 'create', shopify_result.body.filter( (item) => !db_shopify_ids.includes( item.id ) ), db_data );
                    
                    for (const item_document of action_documents.create) {
                        
                        if( item_document.line_items.length > 0 ){
                            
                            let line_item_created = await db_servieces.order_line_items.createMany( item_document.line_items );
                            if( line_item_created.success ){
                                
                                item_document.order.line_items = line_item_created.body.map( (item) => item._id.toString() );
                                
                                for (const item_transaction of item_document.transactions) {
                                    
                                    let data_transaction    = {
                                        id_marketplace  : item_transaction.id_marketplace,
                                        storefront      : item_transaction.storefront,
                                        affiliate       : item_transaction.affiliate,
                                        customer_id     : item_transaction.customer_id,
                                        category        : item_transaction.category
                                    };
                                    let item_order          = { 
                                        shopify_id          : item_document.order.shopify_id, 
                                        total_amount_order  : item_document.order.total_line_items_price,
                                        total_quantity_order: item_document.order.line_items.reduce( (previous_item, current_item) => previous_item + current_item.quantity, 0 ),
                                        refunds             : item_document.order.refunds
                                    };
                                    let format_transaction = transactionObjects( data_transaction, item_order, item_transaction.line_item );
                                    if( format_transaction.length > 0 ){
                                        
                                        await db_servieces.storefront_transaction.createMany( format_transaction );
                                    }
                                }
                                let order_created = await db_servieces.order.create( item_document.order );
                                
                                if( order_created.success && item_document.invoice != null ){
                                    
                                    await billing.post.createInvoiceOrder({ order_id: order_created.body._id, payment_method: item_document.invoice.payment_method, draft_id: item_document.invoice.draft_id }).then( async (billing_result) => {
                                        
                                        await db_servieces.order.update({ _id: order_created.body._id }, { created_invoice: true }).catch( (order_error) => {});
                                    });
                                }
                                if( order_created.success && item_document.extract_order_data.product_origin === 'pre-order-advance' && item_document.extract_order_data.id_product_bundle ){
                                    
                                    await createPreorder( db_servieces, item_marketplace, order_created.body, null, item_document.extract_order_data.id_product_bundle, item_document.extract_order_data.bundle_details );
                                }
                                else if( order_created.success && item_document.extract_order_data.product_origin === 'pre-order-advance' ){
    
                                    await createPreorder( db_servieces, item_marketplace, order_created.body, item_document.extract_order_data.preorder_details, null, null );
                                }
                                else if( order_created.success && item_document.extract_order_data.product_origin === 'pre-order-complete' && item_document.extract_order_data.id_pre_order ){
                                    
                                    await completePreorder( db_servieces, item_marketplace, item_document.extract_order_data.id_pre_order, order_created.body._id.toString() );
                                }

                                if( order_created.success && item_document.extract_order_data.coupon ){
                                    
                                    await agent.put.couponUsed( { _id: item_document.extract_order_data.coupon, id_customer: order_created.body.customer._id.toString() } ).catch( (agent_error) => {});
                                }
                                if( order_created.success ){
                                    
                                    let product_variants_result = await db_servieces.product_variant.findDelete({ marketplace: item_marketplace._id.toString(), sku: { $in: item_document.extract_order_data.skus } });

                                    if( product_variants_result.success ){
                                        
                                        for (const item_variant of product_variants_result.body) {
                                            
                                            let index_db_variant = order_created.body.line_items.findIndex( (item) => item.sku === item_variant.sku );
                                            if( index_db_variant >= 0 ){
                                                
                                                await db_servieces.product_variant.update({ _id: item_variant._id.toString() }, { inventory_quantity: item_variant.inventory_quantity - order_created.body.line_items[index_db_variant].quantity });
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    for (const item_customer of action_documents.customers) {
                        
                        await db_servieces.customer.update( item_customer.query, item_customer.document );
                    }
                    for (const item_customer of action_documents.first_orders) {
                        
                        await agent.put.updateFirstOrder({ customer_id: item_customer }).catch( (agent_error) => {});
                    }
                    for (const item_draft of action_documents.drafts) {
                        
                        await db_servieces.draft_order.update( item_draft.query, item_draft.document );
                    }
                }
                else{
                    
                    let request_errors = [ storefront_result, affiliate_result ].filter( (item) => !item.success );
                    
                    console.log( new Date(), h_response.request( false, request_errors, 400, 'Error: Process Create Shopify Orders', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
                }
            }
            else{
                
                let request_errors = [ draft_result, customer_result, order_result ].filter( (item) => !item.success );
                
                console.log( new Date(), h_response.request( false, request_errors, 400, 'Error: Process Create Shopify Orders', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
            }
        }
        else if( !shopify_result.success ){
            
            console.log( new Date(), h_response.request( false, [shopify_result], 400, 'Error: Process Create Shopify Orders', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
        }
    } catch (process_error) {
        
        console.log( new Date(), h_response.request( false, process_error, 400, 'Error: Process Create Shopify Orders', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
    }
}
async function createPreorder(db_servieces, item_marketplace, order_data, preorder_details, id_bundle, bundle_details){
    try {
        let product_bundle_result = id_bundle != null ? await db_servieces.product_bundle.findOne({ _id: id_bundle }) : { success: true, body: null };
        let count_preorder_result = await db_servieces.preorder.count();
        if( product_bundle_result.success &&  product_bundle_result.body != null && count_preorder_result.success ){
            
            let format_preorder_items = [];
            if( bundle_details != null && bundle_details?.armed ){
                
                format_preorder_items.push({
                    marketplace : item_marketplace._id.toString(),
                    order_origin: order_data.origin,
                    customer_id : order_data.customer_id,
                    name        : `PLN-PRE-${ h_format.numberString( count_preorder_result.body + 1 ) }`,
                    number      : count_preorder_result.body + 1,
                    bundle_type : 'armed',
                    product_id  : product_bundle_result.body.product.variants[0].product_id,
                    variant_id  : product_bundle_result.body.product.variants[0].shopify_id,
                    sku         : product_bundle_result.body.product.variants[0].sku,
                    quantity    : bundle_details.armed.total_quantity,
                    life_stage  : 'open',
                    order_name  : order_data.name
                });
            }
            if( bundle_details != null && bundle_details?.custom ){
                
                format_preorder_items = bundle_details.custom.list.reduce( (previous_item, current_item) => {
                    
                    let exist_variant = product_bundle_result.body.selected_variants.find( (item_variant) => item_variant.variant.shopify_id === current_item.variant_id );
                    if( exist_variant ){
                        previous_item.push({
                            marketplace : item_marketplace._id.toString(),
                            customer_id : order_data.customer_id,
                            name        : `PLN-PRE-${ h_format.numberString( count_preorder_result.body + 1 ) }`,
                            number      : count_preorder_result.body + 1,
                            bundle_type : 'custom',
                            product_id  : exist_variant.variant.product_id,
                            variant_id  : exist_variant.variant.shopify_id,
                            sku         : exist_variant.variant.sku,
                            quantity    : current_item.quantity,
                            life_stage  : 'open',
                            order_name  : order_data.name
                        });
                    }
                    return previous_item;
                }, format_preorder_items );
            }
            if( preorder_details != null ){
                
                format_preorder_items = preorder_details.reduce( (previous_item, current_item) => {
                    
                    previous_item.push({
                        marketplace : item_marketplace._id.toString(),
                        customer_id : order_data.customer_id,
                        name        : `PLN-PRE-${ h_format.numberString( count_preorder_result.body + 1 ) }`,
                        number      : count_preorder_result.body + 1,
                        bundle_type : null,
                        product_id  : current_item.product_id,
                        variant_id  : current_item.shopify_id,
                        sku         : current_item.sku,
                        quantity    : current_item.quantity,
                        life_stage  : 'open',
                        order_name  : order_data.name
                    });
                    return previous_item;
                }, []);
            }
            if( format_preorder_items.length > 0 ){
                let format_preorder = {
                    marketplace     : item_marketplace._id.toString(),
                    customer        : order_data.customer._id,
                    advance_order   : order_data._id,
                    product_bundle  : product_bundle_result.body._id,
                    line_items      : format_preorder_items,
                    name            : `PLN-PRE-${ h_format.numberString( count_preorder_result.body + 1 ) }`,
                    number          : count_preorder_result.body + 1,
                    life_stage      : 'open'
                };
                let preorder_item_created = await db_servieces.preorder_items.createMany( format_preorder_items );
                if( preorder_item_created.success ){
                    
                    format_preorder.line_items = preorder_item_created.body.map( (item) => item._id.toString() );
                    await db_servieces.preorder.create( format_preorder );
                }
            }
        }
        else{
            
            let request_errors = [ product_bundle_result, count_preorder_result ].filter( (item) => !item.success );
            
            console.log( new Date(), h_response.request( false, request_errors, 400, 'Error: Create Pre Order Bundle', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
        }
    } catch (process_error) {
        
        console.log( new Date(), h_response.request( false, process_error, 400, 'Error: Create Pre Order Bundle', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
    }
};
async function completePreorder(db_servieces, item_marketplace, id_preorder, order_id){
    try {
        let preorder_result = await db_servieces.preorder.findOne({ _id: id_preorder })
        if( preorder_result.success && preorder_result.body != null ){
            
            let preorder_item_updated = await db_servieces.preorder_items.updateMany({ marketplace: item_marketplace._id.toString(), name: preorder_result.body.name }, { life_stage: "ordered" });
            if( preorder_item_updated.success ){
    
                await db_servieces.preorder.update({ _id: id_preorder }, { life_stage: "ordered", complete_order: order_id });
            }
        };
    } catch (process_error) {
        
        console.log( new Date(), h_response.request( false, process_error, 400, 'Error: Complete Pre Order Bundle', `At least one request failed, for the marketplace: ${ item_marketplace.name }` ) );
    }
};
// =================================================================================================
// PROCESS CENTRAL
// =================================================================================================
async function processProductFeaturesData( item_product, all_brands, central_skus, array_fields, sku_errors, default_values ){
    
    let is_store_brand      = all_brands.store_brands.indexOf( item_product.brand ) >= 0;
    let is_customer_brand   = all_brands.customer_brands.indexOf( item_product.brand ) >= 0;
    let format_product      = {
        _id                 : item_product._id,
        warehouse_status    : false,
        features            : {...default_values.product_features },
        approved_features   : true,
        variants            : []
    };
    let extract_features    = { 
        data    : {...default_values.extract_features_data }, 
        errors  : {}
    };
    if( is_customer_brand ){
        
        format_product.approved_features = false;
        format_product.features = {...default_values.product_features};
    }
    for (const item_variant of item_product.variants) {
        
        extract_features.errors[item_variant.sku] = {
            ...default_values.central_fields,
            sku: item_variant.sku,
            exist_error: false
        };
        if( central_skus[item_variant.sku] ){
            
            let new_variant = { 
                _id             : item_variant._id, 
                warehouse_status: central_skus[item_variant.sku].estadoCatalog
            };
            new_variant.warehouse_status = !new_variant.warehouse_status || is_customer_brand ? true : new_variant.warehouse_status;
            
            format_product.variants.push( new_variant );
            
            if( is_store_brand ){
                
                extract_features.data = {...central_skus[item_variant.sku].extract_data, count_blank: 0, count_n_a: 0, not_silhouette: false };
            }
        }
        else if( !central_skus[item_variant.sku] ){
            
            format_product.variants.push({ 
                _id             : item_variant._id, 
                warehouse_status: is_store_brand ? false : true 
            });
        }
    }
    if ( format_product.variants.find( (item_variant) => item_variant.warehouse_status ) ){
        
        format_product.warehouse_status = true;
    }
    for (const item_field of array_fields) {
        
        extract_features = cleanCentralSKUData( extract_features, item_field.hefesto, JSON.parse( JSON.stringify( extract_features.data[item_field.hefesto]) ), item_field.central );
    }
    extract_features.errors = Object.entries( extract_features.errors ).reduce( (previous_item, [key_item, value_item]) => {
        
        if( value_item.exist_error ){
            
            format_product.approved_features = false;
            sku_errors.variant_data.push( value_item );
        }
        else if( extract_features.data.count_blank >= Math.round( array_fields.length / 2 )  ){
            
            format_product.approved_features = false;
            sku_errors.blank_data.push( value_item );
        }
        else if( extract_features.data.count_n_a >= Math.round( array_fields.length / 2 )  ){
            
            format_product.approved_features = false;
            sku_errors.n_a_data.push( value_item );
        }
        else if( extract_features.data.not_silhouette ){
            
            format_product.approved_features = false;
            sku_errors.not_silhouette_data.push( value_item );
        }
        previous_item[key_item] = value_item;
        return previous_item;
    }, {});
    
    format_product.features = featuresProductObject( array_fields, extract_features.data );
    
    return { product: format_product, sku_errors: sku_errors };
};
module.exports = {
    data_base: {
        format: {
            // =============================================================================
            // MAIN OBJECTS FORMAT
            // =============================================================================
            customerObject,
            userObject,
            productObject,
            variantObject,
            collectionObject,
            orderObject,
            lineItemObject,
            transactionObjects,
            bestSellerObject,
            buyAgainObject,
            shippingGroupObject,
            shippingZoneRatesTaxesObject,
            shippingRateObject,
            shippingTaxObject,
            // =============================================================================
            // INTERNAL OBJECTS FORMAT
            // =============================================================================
            productOptionsObject,
            lineItemDiscountObject,
            taxLinesObject,
            orderDiscountObject,
            shippingLinesObject,
            refundsObject,
            fulfillmentObject,
            orderAddressObject,
            selectOriginObject,
            bestSellerTemplateObject
        },
        customers: {
            processShopifyCustomers,
            processAddtionalDataByCustomers
        },
        users: {
            processCustomerUsers
        },
        brands: {
            processBrandData
        },
        product_categories: {
            processProductCategoryData
        },
        products: {
            processProductData,
            processProductVariantData
        },
        collections: {
            processCollectionData
        },
        orders: {
            processOrderData,
            processCreateOrder
        },
        central:{
            processProductFeaturesData
        }
    },
    utils: {
        resizeUrlImage,
        configProductTags,
        sortVariants,
        sortSizeOptions,
        evalBestSellerOptionsVariants,
        calcSaleQuantity,
        getFilterValues
    }
}