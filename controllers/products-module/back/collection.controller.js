// =============================================================================
// PACKAGES
// =============================================================================
const moment        = require('moment');
// =============================================================================
// HELPERS
// =============================================================================
const h_format      = require('../../../helpers/format');
const h_validation  = require('../../../helpers/validation');
const h_response    = require('../../../helpers/response');
const h_crud        = require('../../../helpers/crud');
// =============================================================================
// CREDENTIALS
// =============================================================================
// =============================================================================
// SERVICES
// =============================================================================
const {
    backAccessProductCatalogService, 
    backCollectionService,
    backProductService,
    backGeneralSettingService,
    backBestSellerService,
    backLanguageService,
    backAffiliateService
} = require('../../../services/manager');
// =============================================================================
// REST FUNCTIONS
// =============================================================================
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function findDocument(req, res){
    
    let format_data = [
        h_format.objectValidField( 'id', h_validation.evalObjectId( req.param.id ), h_format.fields.types.string.name, h_format.fields.types.string.operators.not_equal, null ),
    ];
    format_data = h_validation.evalFields( { id: req.param.id }, format_data );
    
    if( format_data.is_valid ){
        
        await h_crud.findDocument('Collection', backCollectionService, { _id: format_data.body_object.id }, req.body.fields, req.body.options).then( async (result_document) => {
            
            res.status(200).json( result_document );
            
        }).catch( (error_document) => {
            
            res.status(400).send( error_document );
        });
    }
    else{
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Collection fields required not validated' ) );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function listDocuments(req, res){
    
    await h_crud.listDocuments('Collection', backCollectionService, req.body.query, req.body.fields, req.body.options).then( async (result_document) => {
        
        result_document.body = result_document.body.map( (item_collection) => { 
            
            if( item_collection.image != null ){
                
                item_collection.image.desktop.src    = item_collection.image.desktop.src ? `${ item_collection.image.desktop.src }?v=${ h_format.randomNumber( 1000000000, 9999999999 ) }` : null;
                item_collection.image.mobile.src     = item_collection.image.mobile.src ? `${ item_collection.image.mobile.src }?v=${ h_format.randomNumber( 1000000000, 9999999999 ) }` : null;
            } 
            return item_collection; 
        });
        res.status(200).json( result_document );
        
    }).catch( (error_document) => {
        
        res.status(400).send( error_document );
    });
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function updateDocument(req, res){
    
    let language_result = await backLanguageService.find({ main: false, status: 'active' }, { key_code: 1 });
    
    let format_data     = [
        h_format.objectValidField( 'title'          , h_validation.evalString( req.body.title )                 , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal                  , null ),
        h_format.objectValidField( 'description'    , h_validation.evalString( req.body.description )           , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal                  , '' ),
        h_format.objectValidField( 'image'          , h_validation.evalObject( req.body.image, null )           , h_format.fields.types.object.name , h_format.fields.types.object.operators.contains                   , 'desktop' ),// { desktop: { alt: '', url: '' }, mobile: { alt: '', url: '' } }
        h_format.objectValidField( 'sort_order'     , h_validation.evalString( req.body.sort_order )            , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal                  , null ),// alpha-asc, alpha-des, best-selling, created, created-desc, price-asc, price-desc
        h_format.objectValidField( 'sotr_category'  , h_validation.evalBoolean( req.body.sort_category, true )  , h_format.fields.types.boolean.name, h_format.fields.types.boolean.operators.not_equal                 , null ),
        h_format.objectValidField( 'disjunctive'    , h_validation.evalBoolean( req.body.disjunctive, false )   , h_format.fields.types.boolean.name, h_format.fields.types.boolean.operators.not_equal                 , null ),
        h_format.objectValidField( 'rules'          , h_validation.evalArray( req.body.rules )                  , h_format.fields.types.array.name  , h_format.fields.types.array.operators.length_greater_than_or_equal, 0 ),
        h_format.objectValidField( 'query_products' , h_validation.evalObject( req.body.query_products )        , h_format.fields.types.object.name , h_format.fields.types.object.operators.any_keys                   , '' ),
        h_format.objectValidField( 'translate'      , h_validation.evalObject( req.body.translate, null )       , h_format.fields.types.object.name , h_format.fields.types.object.operators.not_equal                  , {} )
    ];
    format_data     = h_validation.evalFields( {...req.body, id: req.param.id }, format_data );
    
    if( language_result.success && format_data.is_valid ){
        
        let document_id = format_data.body_object.id;
        delete format_data.body_object.id;
        
        format_data.body_object.handle = format_data.body_object.title != null ? h_format.slug( format_data.body_object.title ) : null;
        if( format_data.body_object.translate === null ){
            
            format_data.body_object.translate = language_result.body.reduce( (previous_item, current_item) => {
                
                previous_item[ current_item.key_code ] = {
                    title       : format_data.body_object.title,
                    description : format_data.body_object.description,
                    image       : {
                        desktop : {
                            alt: format_data.body_object.image?.desktop.alt || format_data.body_object.title,
                            src: format_data.body_object.image?.desktop.src || resizeUrlImage( format_document.image?.desktop.src ),
                        },
                        mobile  : {
                            alt: format_data.body_object.image?.mobile.alt || format_data.body_object.title,
                            src: format_data.body_object.image?.mobile.src || resizeUrlImage( format_document.image?.mobile.src )
                        }
                    }
                };
                return previous_item;
                
            }, language_result.body.length > 0 ? {} : null);
        }
        await h_crud.updateDocument('Collection', backCollectionService, { _id: document_id }, format_data.body_object).then( async (result_document) => {
            
            res.status(200).json( result_document );
            
        }).catch( (error_document) => {
            
            res.status(400).send( error_document );
        });
    }
    else if( !format_data.is_valid ){
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Navigation fields required not validated' ) );
    }
    else if( !language_result.success ){
        
        res.status(400).send( h_response.request( false, language_result.body, 400, 'Error: Language Find', 'Languages not found' ) );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function updateDocumentStatus(req, res){
    
    let format_data = [
        h_format.objectValidField( 'id'      , h_validation.evalObjectId( req.param.id )         , h_format.fields.types.string.name, h_format.fields.types.string.operators.not_equal, null ),
        h_format.objectValidField( 'status'  , h_validation.evalString( req.body.status, null )  , h_format.fields.types.string.name, h_format.fields.types.string.operators.not_equal, null ),
    ];
    format_data = h_validation.evalFields( {...req.body, id: req.param.id }, format_data );
    
    if( format_data.is_valid ) {
        
        let document_id = format_data.body_object.id;
        delete format_data.body_object.id;
        
        await h_crud.updateDocument('Collection', backCollectionService, { _id: document_id }, format_data.body_object).then( async (result_document) => {
            
            res.status(200).json( result_document );
        }).catch( (error_document) => {
            
            res.status(400).send( error_document );
        });
    }
    else{
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Collection fields required not validated' ) );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function deleteDocument(req, res){
    
    let format_data = [
        h_format.objectValidField( 'id', h_validation.evalObjectId( req.param.id ), h_format.fields.types.string.name, h_format.fields.types.string.operators.not_equal, null ),
    ];
    format_data = h_validation.evalFields( { id: req.param.id }, format_data );
    
    if( format_data.is_valid ) {
        
        await h_crud.deleteDocument('Collection', backCollectionService, format_data.body_object.id).then( async (result_document) => {
            
            res.status(200).json( result_document );
            
        }).catch( (error_document) => {
            
            res.status(400).send( error_document );
        });
    }
    else{
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Collection fields required not validated' ) );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function storeCollectionProducts(req, res){
    
    /*
    {
    query: Object,
    fields: Object,
    options: {
    paginated: {
    page: Number,
    per_page: Number,
    },
    sort: Object,
    populate: Object,
    lean: Boolean
    }
    }
    */
    try {
        let result_body = {
            marketplace     : req.auth.marketplace,
            filters         : {
                use             : req.body.get_filters ? req.body.get_filters : false,
                query_products  : [],
                selected        : [],
                product_values  : {},
                sort            : req.body.options.sort,
                values          : req.body.filters != null ? {
                    price               : req.body.filters?.price               ? req.body.filters.price                                                : null,
                    search              : req.body.filters?.search              ? h_validation.evalString( req.body.filters.search, '' ).toLowerCase()  : '',
                    brands              : req.body.filters?.brands              ? h_validation.evalArray( req.body.filters.brands )                     : [],
                    product_categories  : req.body.filters?.product_categories  ? h_validation.evalArray( req.body.filters.product_categories )         : [],
                    product_options     : req.body.filters?.product_options     ? h_validation.evalArray( req.body.filters.product_options )            : [],
                    tags                : req.body.filters?.tags                ? h_validation.evalArray( req.body.filters.tags )                       : []
                } : null,
            },
            collection      : {
                find_query          : req.body.query ? req.body.query : h_format.findQuery( req.params.id_handle ),
                id                  : null,
                shopify_id          : null,
                handle              : req.params.id_handle,
                title               : req.params.id_handle === 'search' ? 'Search Result' : req.params.id_handle.split('-').join(' '),
                description         : '',
                image               : null,
                paginated_products  : { documents: [], filters: null },
                valid_collection    : false,
                product_discounts   : req.auth.discounts,
                include_variants    : false,// ['price-catalog', 'customer-price-catalog'].includes(req.params.id_handle),
                access_catalog      : false
            },
            paginated       : {
                page                : req.body.options.paginated.page       ? h_validation.evalInt( req.body.options.paginated.page, 1 )    : 1,
                per_page            : req.body.options.paginated.per_page   ? h_validation.evalInt( req.body.options.paginated.per_page, )  : 0,
            },
            product_fields  : req.body.fields ? req.body.fields : { 
                description         : 0,
                variant_titles      : 0, 
                additional_content  : 0, 
                published_at        : 0, 
                updated_at          : 0, 
                deleted_at          : 0, 
                deleted             : 0, 
                status              : 0, 
                status_created      : 0 
            },
            product_options : { 
                lean    : req.body.options.lean ? req.body.options.lean : true, 
                populate: ( ( !req.body.options?.populate || req.body.options?.populate === null ) ? [] : req.body.options.populate ).concat( [
                    {
                        path    : 'config_bundle',
                        match   : { status: 'active', delete: false },
                        select  : 'name moq config_pre_sale selected_variants',
                        populate: [
                            {
                                path    : 'selected_variants',
                                math    : { variant: { $ne: null } },
                                populate: {
                                    path    : 'variant',
                                    match   : { $and: [ { status: 'active', delete: false } ] },
                                    select  : 'image',
                                }
                            },
                            {
                                path    : 'config_pre_sale',
                                select  : 'enable_after started_at ended_at'
                            }
                        ]
                    },
                    {
                        path    : 'config_pre_sale',
                        select  : 'enable_after started_at ended_at'
                    }
                ] ) 
            }
        };
        if( result_body.collection.include_variants ){
            
            result_body.product_options.populate.push({ path: 'variants', match: { status: 'active', deleted: false }, options: { sort: { sort_variant: 1 } } });
        }
        else{
            
            result_body.product_fields.variants  = 0;
        }
        result_body.collection.find_query.status_created = 'active';
        result_body.collection.find_query.marketplace    = req.auth.marketplace;
        if( req.params.id_handle === 'price-catalog' ){
            
            let access_result = await backAccessProductCatalogService.findOne({ marketplace: req.auth.marketplace, _id: req.body.id_catalog, email: h_validation.evalString( req.body.email_catalog, '' ).toLowerCase() }); 
            if( access_result.success ){
                
                let valid_access = access_result.body != null && moment().diff(moment(access_result.body.created_at), 'seconds') < ( access_result.body.active_days * 24 * 60 * 60 );
                
                if( access_result.body != null ){
                    
                    if( valid_access ){
                        
                        result_body.collection.product_discounts    = access_result.body.discounts.map( (item) => { return { brand: item.brand.handle, value: item.value } });
                        result_body.collection.title                = 'Price Catalog';
                        result_body.collection.data_catalog         = {
                            email: access_result.body.email,
                            full_name: access_result.body.full_name,
                            time_left: ( access_result.body.active_days * 24 * 60 * 60 ) - moment().diff(moment(access_result.body.created_at), 'seconds')
                        };
                        result_body.collection.access_catalog       = true;
                        await listProducts( req, res, result_body );
                    }
                    else{
                        
                        await backAccessProductCatalogService.delete(access_result.body._id.toString());
                    }
                }
                if( access_result.body === null || !valid_access ){
                    
                    delete result_body.collection.title;
                    delete result_body.collection.product_discounts;
                    res.status(200).json( h_response.request( false, result_body.collection, 400, 'Error: Price Catalog', 'Expired Access, please contact your sales agent to obtain new access' ) );
                }
            }
            else {
                
                res.status(400).send( h_response.request( false, access_result, 400, 'Error: Price Catalog', 'Expired Access, please contact your sales agent to obtain new access' ) );
            }
        }
        else{
            
            await listProducts( req, res, result_body );
        }
    } catch (process_error) {
        
        res.status(400).send( h_response.request( false, process_error, 400, 'Error: Collection Products find', 'Collection Products not found' ) );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function sitemaps(req, res){
    
    let collection_result = await backCollectionService.find({ status: 'active' });
    if( collection_result.success ){
        
        res.status(200).json( collection_result.body.map( (item) => item.handle ) );
    }
    else{
        
        res.status(400).send([]);
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function productSitemaps(req, res){
    
    let collection_result = await backCollectionService.find({ status: 'active' });
    
    if( collection_result.success && collection_result.body.length > 0 ){
        
        let all_collections = collection_result.body.map( (item) => {
            
            return {
                handle: item.handle,
                query_products: item.query_products
            }
        }).concat( [{ handle: 'search', query_products: {} }, { handle: 'best-sellers', query_products: {} }]);
        
        let sitemaps = [];
        for (const item_collection of all_collections) {
            
            let query_products = { 
                $and: [
                    { status_created: 'active'},
                    { status: 'active' }
                ]
            }
            if( !['search', 'best-sellers'].includes( item_collection.handle ) ){
                
                query_products.$and.push( item_collection.query_products );
            }
            let product_result = await backProductService.find( query_products );
            
            if( product_result.success && product_result.body.length > 0 ){
                
                sitemaps = sitemaps.concat( product_result.body.map( (item) => {
                    return {
                        handle: item_collection.handle,
                        product:{
                            handle: item.handle
                        }
                    }
                }));
            }
        }
        res.status(200).json( sitemaps );
    }
    else{
        
        res.status(400).send([]);
    }
};
// =============================================================================
// GENERAL FUNCTIONS
// =============================================================================
/**
* 
* @param {*} req 
* @param {*} res 
* @param {*} result_body 
*/
async function listProducts( req, res, result_body ){
    
    let setting_result = await backGeneralSettingService.findOne({ marketplace: req.auth.marketplace, status: 'active' }, { sort_categories: 1, sort_sizes: 1, general_filters: 1 });
    
    if( setting_result.success ){
        
        let get_products    = req._parsedOriginalUrl.pathname.indexOf('/products') >= 0;
        
        let filter_result   = await filterProducts( req, result_body );
        
        if( filter_result.success ){
            
            result_body = filter_result.body;
            let paginate_result = await paginatedProducts( req, setting_result.body, result_body );
            
            if( paginate_result.success && !get_products ){
                
                result_body.collection = {
                    title               : result_body.collection.title,
                    handle              : result_body.collection.handle,
                    image               : result_body.collection.image,
                    description         : result_body.collection.description,
                    paginated_products  : paginate_result.body,
                    access_catalog      : result_body.collection.access_catalog,
                    sort_by_category    : result_body.filters.sort.sort_category ? true : false,
                    translate           : result_body.collection.translate
                }
                res.status(200).json( h_response.request( true, result_body.collection, 200, 'Success: Collection find', 'Collection found' ) );
            }
            else if( paginate_result.success ){
                
                res.status(200).json( paginate_result );
            }
            else{
                
                res.status(400).send( paginate_result );
            }
        }
        else{
            
            res.status(400).send( filter_result );
        }
    }
    else{
        
        res.status(400).send( h_response.request( false, setting_result, 400, `Error: Collection Products find`, 'General Settings not found' ) );
    }
};
/**
* 
* @param {*} req 
* @param {*} result_body 
* @returns 
*/
async function filterProducts( req, result_body ){
    
    try {
        let discount_brands = ['wholesale', 'app-wholesale'].includes( req.auth.application_type ) ? h_format.discountOnlyBrands( [...result_body.collection.product_discounts] ) : [];
        
        if( ['best-sellers', 'new-products', 'search', 'price-catalog', 'customer-price-catalog'].includes( req.params.id_handle ) ){
            
            if( req.params.id_handle === 'best-sellers' ){
                
                let best_seller_fileds = { 
                    products            : 0, 
                    range_month         : 0, 
                    percentage_variant  : 0, 
                    percentage_product  : 0, 
                    total_quantity      : 0, 
                    order_quantity      : 0, 
                    refund_quantity     : 0, 
                    total_amount        : 0 
                };
                if( result_body.filters.use ) { 
                    best_seller_fileds.selected_filters = 0;
                    best_seller_fileds.filter_values    = 0;
                };
                let best_seller_result = await backBestSellerService.findOne({ marketplace: req.auth.marketplace, customer: null, storefront: null, affiliate: null }, best_seller_fileds, { populate: null } );
                if( best_seller_result.success ) {
                    if( result_body.filters.use ){
                        
                        result_body.filters.selected        = best_seller_result.body != null ? best_seller_result.body.selected_filters: [];
                        result_body.filters.product_values  = best_seller_result.body != null ? best_seller_result.body.filter_values   : [];
                    }
                    result_body.collection.valid_collection = true;
                    
                    result_body.filters.query_products  = queryFilterProducts( result_body.marketplace, result_body.filters.values, result_body.filters.query_products, false, discount_brands);
                    if( result_body.filters.sort === null ){
                        
                        result_body.filters.sort = { sort_category: 1, default_sort: 1 };
                    }
                    else if( !result_body.filters.sort?.sort_category ){
                        
                        result_body.filters.sort.sort_category = 1;
                    }
                    return { success: true, body: result_body };
                }
                else {
                    
                    return h_response.request( false, best_seller_result, 400, "Error: Best Seller Products find", "Best Seller Products not found" );
                }
            }
            else{
                
                result_body.collection.valid_collection = true;
                
                if( result_body.filters.sort === null ){
                    
                    result_body.filters.sort = { [req.params.id_handle === 'new-products' ? 'created_at' : 'default_sort'] : req.params.id_handle === 'new-products' ? -1 : 1 };
                    if( req.params.id_handle != 'new-products' ){
                        
                        result_body.filters.sort.sort_category = 1;
                    }
                }
                result_body.filters.query_products       = queryFilterProducts( result_body.marketplace, result_body.filters.values, result_body.filters.query_products, false, discount_brands);
                
                return { success: true, body: result_body };
            }
        }
        else{
            
            let collection_fileds = result_body.filters.use ? null : { 
                selected_filters: 0,
                filter_values: 0
            };
            let collection_result = await backCollectionService.findOne(result_body.collection.find_query, collection_fileds, { populate: null } );
            
            if ( collection_result.success ) {
                
                if(collection_result.body != null){
                    
                    result_body.collection.id                   = collection_result.body._id;
                    result_body.collection.shopify_id           = collection_result.body.shopify_id;
                    result_body.collection.handle               = collection_result.body.handle;
                    result_body.collection.title                = collection_result.body.title;
                    result_body.collection.description          = collection_result.body.description;
                    result_body.collection.image                = collection_result.body.image;
                    result_body.collection.paginated_products   = {};
                    result_body.collection.valid_collection     = true;
                    result_body.collection.translate            = collection_result.body.translate;
                    result_body.filters.query_products          = queryFilterProducts( result_body.marketplace, result_body.filters.values, collection_result.body.query_products.details.concat( result_body.filters.query_products ), collection_result.body.disjunctive, discount_brands);
                    
                    if( result_body.filters.use ){
                        
                        result_body.filters.selected        = collection_result.body?.selected_filters  || [];
                        result_body.filters.product_values  = collection_result.body?.filter_values     || [];
                    }
                    if( result_body.filters.sort === null ){
                        
                        result_body.filters.sort = collection_result.body.sort_order;
                    }
                    else if( !result_body.filters.sort?.sort_category ){
                        
                        result_body.filters.sort.default_sort = 1;
                    }
                    
                    return { success: true, body: result_body };
                }
                else{
                    
                    delete result_body.collection.title;
                    result_body.collection.paginated_products   = { documents: [], filters: null };
                    return h_response.request( false, result_body.collection, 400, "Error: Collection find", "Collection not found" );
                }
            }
            else {
                
                return h_response.request( false, collection_result, 400, "Error: Collection find", "Collection not found" );
            }
        }
    } catch (process_error) {
        
        return h_response.request( false, process_error, 400, "Error: Collection Products find", "Collection Products not found" );
    }
};
/**
* 
* @param {*} req 
* @param {*} general_settings 
* @param {*} result_body 
* @returns 
*/
async function paginatedProducts( req, general_settings, result_body ){
    
    try {
        console.log( result_body.filters.query_products );
        let affiliate_result    = await h_format.affiliateDiscounts( req.auth, req.query.affiliate, backAffiliateService );
        let product_result      = await backProductService.findPaginate( result_body.filters.query_products, result_body.paginated.page, result_body.paginated.per_page, result_body.product_fields, result_body.filters.sort, result_body.product_options );
        if ( product_result.success && affiliate_result.success ) {
            
            let list_products_by_categories = product_result.body.documents.length > 0 ? [...general_settings.sort_categories] : [];
            
            product_result.body.documents   = product_result.body.documents.reduce( (previous_item, current_item, current_index ) => {
                
                let exist_discount  = h_format.getDiscountBrand( req.auth.application_type, req.auth.discounts, current_item.brand?.handle );
                let discounts       = {
                    brand       : h_validation.evalFloat( exist_discount?.value, null ), 
                    affiliate   : affiliate_result.body.discount,
                    product     : 0
                };
                let format_product  = h_format.productCollectionObject( current_item, discounts, result_body.collection.include_variants, general_settings.sort_categories.length - 1 );
                
                if( format_product.success ){
                    
                    list_products_by_categories[ format_product.body.sort_category ].products.push( format_product.body );
                    previous_item.push( format_product.body );
                }
                if( current_index === product_result.body.documents.length - 1 ){
                    
                    list_products_by_categories = list_products_by_categories.map( (item) => item.products ).flat();
                }
                return previous_item;
            }, []);

            let paginated_products          = {
                documents       : list_products_by_categories,
                sort_categories : general_settings.sort_categories.map( (item) => { item.products = []; return item; }),
                sort_by_category: result_body.filters.sort.sort_category ? true : false,
                filters         : null,
                total_documents : product_result.body.documents.length,
                page            : result_body.paginated.page,
                next_page       : product_result.body.next_page,
                prev_page       : product_result.body.prev_page,
                total_pages     : product_result.body.total_pages
            };
            
            if( result_body.filters.use && product_result.body.documents.length > 0 ){
                
                paginated_products.filters = {
                    selected: result_body.filters.selected,
                    values  : result_body.filters.product_values,
                };
            }
            return h_response.request( true, paginated_products, 200, "Success: Collection Products find", "Collection Products found" );
        }
        else {
            
            return h_response.request( false, product_result, 400, "Error: Collection Products find", "Collection Products not found" );
        }
    } catch (process_error) {
        
        return h_response.request( false, process_error, 400, "Error: Collection Products find", "Collection Products not found" );
    }
};
/**
* 
* @param {*} id_marketplace 
* @param {*} filter_values 
* @param {*} query_products 
* @param {*} disjunctive_query 
* @param {*} product_discounts 
* @returns 
*/
function queryFilterProducts( id_marketplace, filter_values, query_products, disjunctive_query, product_discounts ){
    
    let filter_index = query_products.reduce( (previous_item, current_item, current_index) => {
        if( current_item.field === 'brand-handle' && current_item.operator === '$nin' ){
            product_discounts = product_discounts.filter( (item) => current_item.value.indexOf( item ) < 0 );
            previous_item['brand-handle-$nin'] = current_index; 
        }
        if( current_item.field === 'brand-handle' && current_item.operator === '$eq' ){
            previous_item['brand-handle-$eq'] = current_index; 
        }
        if( current_item.field === 'brand-handle' && current_item.operator === '$in' ){
            previous_item['brand-handle-$in'] = current_index; 
        }
        if( current_item.field === 'price.min_price' && current_item.operator === '$gte' ){
            previous_item['price-min_price-$gte'] = current_index; 
        }
        if( current_item.field === 'price.max_price' && current_item.operator === '$lte' ){
            previous_item['price-max_price-$lte'] = current_index; 
        }
        if( current_item.field === 'product_category' && current_item.operator === '$in' ){
            previous_item['product_category-$in'] = current_index; 
        }
        return previous_item;
    }, { 'brand-handle-$in': -1, 'brand-handle-$nin': -1, 'brand-handle-$eq': -1, 'price.min_price': -1, 'price.max_price': -1, 'product_category-$in': -1 } );
    
    if( product_discounts.length > 0 ){
        
        if( filter_index['brand-handle-$in'] >= 0 ){
            
            query_products[filter_index['brand-handle-$in']].value = ( filter_values?.brands.length > 0 ? filter_values?.brands : query_products[filter_index['brand-handle-$in']].value ).filter( (item) => product_discounts.indexOf( item ) >= 0 );
        }
        if( filter_index['brand-handle-$eq'] >= 0 ){
            
            if( product_discounts.indexOf( query_products[filter_index['brand-handle-$eq']].value[0] ) < 0 ){
                
                delete query_products.splice(filter_index['brand-handle-$eq'], 1);
                if( filter_index['brand-handle-$in'] >= 0 ){
                    
                    query_products[filter_index['brand-handle-$in']].value = [];
                }
                else{
                    
                    query_products.push({ field: 'brand.handle', operator: '$in', value: [] });
                }
            }
        }
        else{
            
            query_products.push({ field: 'brand.handle', operator: '$in', value: filter_values?.brands.length > 0 ? filter_values?.brands.filter( (item) => product_discounts.indexOf( item ) >= 0 ) : product_discounts });
        }
    }
    else{
        
        if( filter_index['brand-$in'] >= 0 ){
            
            query_products[filter_index['brand-$in']].value = ( filter_values?.brands.length > 0 ? filter_values?.brands : query_products[filter_index['brand-$in']].value );
        }
        else if( filter_values?.brands.length > 0 ){
            
            query_products.push({ field: 'brand', operator: '$in', value: filter_values?.brands });
        }
    }
    
    if( filter_index['price-min_price-$gte'] >= 0  ){
        
        query_products[filter_index['price-min_price-$gte']].value = filter_values?.price.min_price;
    }
    else if( filter_values?.price?.min_price ){
        
        query_products.push({ field: 'price.min_price', operator: '$gte', value: filter_values?.price.min_price });
    }
    
    if( filter_index['price-max_price-$lte'] >= 0  ){
        
        query_products[filter_index['price-max_price-$lte']].value = filter_values?.price.max_price;
    }
    else if( filter_values?.price?.max_price ){
        
        query_products.push({ field: 'price.max_price', operator: '$lte', value: filter_values?.price.max_price });
    }
    
    if( filter_index['product_category-$in'] >= 0  ){
        
        query_products[filter_index['product_category-$in']].value = ( filter_values?.product_categories.length > 0 ? filter_values?.product_categories : query_products[filter_index['product_category-$in']].value );
    }
    else if( filter_values?.product_categories && filter_values?.product_categories.length > 0 ){
        
        query_products.push({ field: 'product_category', operator: '$in', value: filter_values?.product_categories });
    }
    if( filter_values?.search && filter_values?.search != '' ){
        
        query_products.push({ field: 'search_field', operator: '$regex', value: filter_values?.search });
    }
    if( filter_values?.product_options && filter_values?.product_options?.length > 0 ){
        
        query_products.push({ field: 'options', operator: '$in', value: filter_values?.product_options });
    }
    return h_format.findQueryProducts(id_marketplace, query_products, disjunctive_query, product_discounts);
};
// =============================================================================
// EXPORTS
// =============================================================================
module.exports = {
    get:{
        sitemaps,
        productSitemaps
    },
    post:{
        findDocument,
        listDocuments,
        storeCollectionProducts
    },
    put:{
        updateDocument,
        updateDocumentStatus
    },
    delete:{
        deleteDocument
    }
};