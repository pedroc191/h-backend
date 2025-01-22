// =============================================================================
// PACKAGES
// =============================================================================
// =============================================================================
// HELPERS
// =============================================================================
const h_format      = require('../../../helpers/format');
const h_validation  = require('../../../helpers/validation');
const h_response    = require('../../../helpers/response');
const h_file        = require('../../../helpers/file');
const h_crud        = require('../../../helpers/crud');
const h_array       = require('../../../helpers/array');
const h_excel       = require('../../../helpers/excel');
// =============================================================================
// SERVICES
// =============================================================================
const {
    backCollectionService,
    backBrandService,
    backProductService,
    agentUserService,
    backAffiliateService,
    backProductVariantService
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
    
    try {
        
        let collection_result   = await getCollectionData( req );
        let affiliate_result    = await h_format.affiliateDiscounts( req.auth, req.query.affiliate, backAffiliateService );
        if( collection_result.success && affiliate_result.success ){
            
            let find_query  = {};
            if( !req.body.query ){
                find_query  = h_format.findQuery( req.params.id_handle );
                find_query  = {
                    ...find_query,
                    marketplace: req.auth.marketplace,
                    status_created: 'active',
                    warehouse_status: true
                };
            }
            else{
                find_query = {
                    ...req.body.query,
                    marketplace: req.auth.marketplace,
                    status_created: 'active',
                    warehouse_status: true
                };
            }
            await h_crud.findDocument( 'Product', backProductService, find_query, req.body.fields, req.body.options ).then( async (docuemnt_result) => {
                
                if( docuemnt_result.success ){
                    
                    let exist_discount  = h_format.getDiscountBrand( req.auth.application_type, req.auth.discounts, docuemnt_result.body.brand?.handle );
                    let discounts       = {
                        brand       : h_validation.evalFloat( exist_discount?.value, null ), 
                        affiliate   : affiliate_result.body.discount,
                        product     : 0
                    };
                    let format_product  = h_format.productObject( docuemnt_result.body, discounts );
                    
                    if( format_product.success ){
                        
                        let brand_result = await backBrandService.findOne({ handle: format_product.body.brand?.handle, collection_url: { $ne: null } });
                        if( brand_result.success && brand_result.body ){
                            
                            format_product.body.brand = {
                                ...format_product.body.brand,
                                url : brand_result.body ? brand_result.body.collection_url : ''
                            };
                            format_product.body.collection_data = collection_result.body;
                            res.status(200).json( h_response.request( true, format_product.body, 200, 'Success: Product find', 'Product found' ) );
                        }
                        else{
                            
                            res.status(400).send( h_response.request( false, brand_result, 400, 'Error: Product find', 'Brand not found' ) );
                        }
                    }
                    else{
                        
                        res.status(400).send( format_product );
                    }
                }
                else{
                    
                    res.status(400).send( h_response.request( false, docuemnt_result, 400, 'Error: Product find', 'Product not found' ) );
                }
            }).catch( (document_error) => {
                
                res.status(400).send( h_response.request( false, document_error, 400, 'Error: Product find', 'Product not found' ) );
            });
        }
        else{
            let request_errors = [ collection_result, affiliate_result ].filter( (item) => !item.success );
            
            res.status(400).send( h_response.request( false, request_errors, 400, 'Error: Product find', 'Product not found' ) );
        }
    } catch (process_error) {
        
        res.status(400).send( h_response.request( false, process_error, 400, 'Error: Product find', 'Error in process' ) );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function listDocuments(req, res){
    
    /*
    if( paginate_data.search != '' ){
    
    find_query.$and.push({ search_field: { $regex: paginate_data.search, $options: 'i' } });
    }
    if( paginate_data.brand ){
    
    find_query.$and.push({ brand: paginate_data.brand });
    }
    if( paginate_data.exist_tags ){
    
    find_query.$and.push({ tags: { $elemMatch: { tag: { $in: paginate_data.exist_tags } } } });
    }
    if( paginate_data.not_exist_tags ){
    
    find_query.$and.push({ tags: { $elemMatch: { tag: { $nin: paginate_data.not_exist_tags } } } });
    }
    if( paginate_data.status_created ){
    
    find_query.$and.push({ status_created: paginate_data.status_created });
    }
    */
    await h_crud.listDocuments('Product', backProductService, req.body.query, req.body.fields, req.body.options).then( async (result_document) => {
        
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
async function storeSearchProducts(req, res){
    
    try {
        let affiliate_result    = await h_format.affiliateDiscounts( req.auth, req.query.affiliate, backAffiliateService );
        if( affiliate_result.success ){
            
            req.body.options.populate   = ( ( !req.body.options?.populate || req.body.options?.populate === null ) ? [] : h_validation.evalArray( req.body.options?.populate ) ).concat( [
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
            ] );
            let product_discounts       = req.auth.discounts.map( (item) => item.brand );
            let sort_query              = req.body.options?.sort ? req.body.options.sort : { default_sort: 1 };
            let paginated_query         = { 
                page: req.body.options?.paginated?.page || 1, 
                per_page: ( req.body.options?.paginated?.per_page || 4 ) + 1 
            };
            delete req.body.options.sort;
            delete req.body.options.paginated;
            
            let find_query = { 
                marketplace     : req.auth.marketplace, 
                status          : 'active', 
                status_created  : 'active',
                warehouse_status: true
            };
            find_query.search_field = { $regex: `^(?=.*${ req.body.search })${ product_discounts.length === 0 ? '(?!.*private-label)' : '' }.*` , $options: 'i' };
            if( product_discounts.length > 0 ){
                
                find_query['brand.handle'] = { $in: product_discounts };
            }
            find_query = h_array.sortByProperty( Object.entries( find_query ).map( ([key_item, value_item]) => {
                return { [key_item]: value_item };
            }) )
            let product_result = await backProductService.findPaginate( { $and: find_query }, paginated_query.page, paginated_query.per_page, req.body.fields, sort_query, req.body.options );
            
            if( product_result.success ){
                
                let result_products = product_result.body.documents.reduce( (previous_item, current_item) => {
                    
                    let exist_discount  = h_format.getDiscountBrand( req.auth.application_type, req.auth.discounts, current_item.brand?.handle );
                    let discounts       = {
                        brand       : h_validation.evalFloat( exist_discount?.value, null ), 
                        affiliate   : affiliate_result.body.discount,
                        product     : 0
                    };
                    let format_product  = h_format.productCollectionObject( current_item, discounts );
                    if( format_product.success ){
                        
                        previous_item.push( format_product.body );
                    }
                    return previous_item;
                }, []);
                res.status(200).json( h_response.request( true, result_products, 200, 'Success: Product find', 'Product not found' ) );
                
            }
            else{
                
                res.status(400).send( h_response.request( false, product_result, 400, 'Error: Product find', 'Product not found' ) );
            }
        }
        else{
            
            res.status(400).send( h_response.request( false, affiliate_result, 400, 'Error: Product find', 'Product not found' ) );
        }
    } catch (process_error) {
        
        res.status(400).send( h_response.request( false, process_error, 400, 'Error: Search Products', 'Error in process' ) );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function deleteProductShopify(req, res){
    
    res.json( true );
    
    let product_result = await backProductService.findOne({ shopify_id: req.body.id }, { variants: 1 }, { populate: null });
    
    if( product_result.success ){
        
        await backProductService.delete( product_result.body_id.toString() );
        if ( product_result.body.variants.length > 0 ){
            
            await backProductVariantService.deleteMany({ _id: { $in: product_result.body.variants } });
        }
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function productRecentlyViewed( req, res ){
    
    try {
        let affiliate_result    = await h_format.affiliateDiscounts( req.auth, req.query.affiliate, backAffiliateService );
        
        let find_query_products = { $and: [{ _id: { $in: JSON.parse(req.body.ids) } }, { status: 'active' }, { status_created: 'active' }] };
        if( ['wholesale', 'app-wholesale'].includes( req.auth.application_type ) ){
            
            find_query_products.$and.push({ 'brand.handle': { $in: h_format.discountOnlyBrands( req.auth.discounts ) } });
        }
        let product_result      = await backProductService.find( find_query_products, null, { default_sort: 1 });
        
        
        if( affiliate_result.success && product_result.success) {
            
            product_result.body = product_result.body.reduce( (previous_item, current_item) => { 
                
                let exist_discount  = h_format.getDiscountBrand( req.auth.application_type, req.auth.discounts, current_item.brand?.handle );
                let discounts       = {
                    brand       : h_validation.evalFloat( exist_discount?.value, null ), 
                    affiliate   : affiliate_result.body.discount,
                    product     : 0 
                };
                let format_product = h_format.productCollectionObject( current_item, discounts );
                
                if( format_product.success ) {
                    
                    previous_item.push( format_product.body );
                }
                else{
                    
                    console.log( format_product );
                }
                return previous_item;
            }, []);
            res.status(200).json( h_response.request( true, product_result.body, 200, "Success: Products find", "Products found" ) );
        }
        else {
            let process_error = [ affiliate_result, product_result ].filter( (item) => !item.success );
            res.status(400).send( h_response.request( false, process_error, 400, "Error: Products find", "Products not found" ) );
        };
    } catch (process_error) {
        
        res.status(400).send( h_response.request( false, process_error, 400, "Error: Products find", "Error in process" ) );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function sitemaps(req, res){
    
    let product_result = await backProductService.find({ status: 'active', status_created: 'active' });
    if( product_result.success && product_result.body.length > 0 ){
        
        res.status(200).json( product_result.body.map( (item) => item.handle ) );
        
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
async function downloadPriceCatalogFile(req, res){
    
    try {
        
        let product_result = await backProductService.find({ marketplace: req.auth.marketplace, status: 'active', status_created: 'active', warehouse_status: true, brand: { $in: req.auth.discounts.map( (item) => item.brand ) } }, { shopify_id: 1, title: 1, sku_parent: 1, variants: 1, brand: 1, product_type: 1 }, { default_sort: 1 }, { populate: { path: 'variants', select: 'sku title options price' } });
        if( product_result.success && product_result.body.length > 0 ){
            
            let data_file = [
                {
                    title: `${ req.auth.user.customer.first_name } ${ req.auth.user.customer.last_name } - Price Catalog`,
                    max_num_columns: 7,
                    sheet_name: `${ req.auth.user.customer.first_name } ${ req.auth.user.customer.last_name } - Price Catalog`,
                    body_data: [],
                    cols: [ { wch: 30 }, { wch: 40 }, { wch: 20 }, { wch: 40 }, { wch: 20 }, { wch: 20 }, { wch: 20 } ]
                }
            ];
            for (const item_product of product_result.body) {
                
                let discount = req.auth.discounts.find( (item) => item.brand === item_product.brand );
                discount = discount ? discount.value : null;
                item_product.variants       = item_product.variants.map( (item) => {
                    
                    let columns =[
                        { name: 'sku_parent'    , value: item_product.sku_parent != null ? item_product.sku_parent.num_ref : ''                                                                                                         , index_column: 0, num_columns: 1, num_rows: 1 },
                        { name: 'sku'           , value: item.sku                                                                                                                                                                       , index_column: 1, num_columns: 1, num_rows: 1 },
                        { name: 'brand'         , value: item_product.brand?.name                                                                                                                                                             , index_column: 2, num_columns: 1, num_rows: 1 },
                        { name: 'options'       , value: item.options.reduce( (previous_item, current_item) => { if( current_item.value != null ){ previous_item.push( current_item.value ) } return previous_item; }, []).join(' / ')  , index_column: 3, num_columns: 1, num_rows: 1 },
                        { name: 'price'         , value: utils.format.formatCurrency( item.price ).number                                                                                                                               , index_column: 4, num_columns: 1, num_rows: 1 },
                        { name: 'discount'      , value: discount                                                                                                                                                                       , index_column: 5, num_columns: 1, num_rows: 1 },
                        { name: 'discount_price', value: utils.format.formatCurrency( utils.format.calcDiscountPrice( item.price, discount, 1 ), false ).number                                                                         , index_column: 6, num_columns: 1, num_rows: 1 },
                    ];
                    data_file[0].body_data.push( { row: { columns: columns } } );
                    return item;
                });
            }
            let create_file = await h_excel.createFile( `Price Catalog`, `/documents/templates/excel/format-price-list.xlsx`, data_file, null, 2, formatBodyPriceCatalogFile );
            if( create_file.success ){
                
                res.status(200).json( create_file );
            }
            else{
                
                res.status(400).send( create_file );
            }
        }
        else{
            
            res.status(400).send( h_response.request( false, product_result, 400, 'Error: Price Catalog', 'Products not found' ) );
        }
    } catch (process_error) {
        
        res.status(400).send( h_response.request( false, process_error, 400, 'Error: Price Catalog', 'Error in process' ) );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function deletePriceCatalogFile(req, res){
    
    let remove_file = await h_file.remove( './public/downloads/', 'Price Catalog.xlsx', 'xlsx');
    if( remove_file.success ){
        
        res.status(200).json( remove_file );
    }
    else{
        
        res.status(200).json( remove_file );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function downloadProductsLowStockFile(req, res){
    
    try {
        
        let agent_result = await agentUserService.find({ role: 'admin', slackUser: { $ne: null } });
        let brand_result = await backBrandService.find({ marketplace: req.auth.marketplace, notify_stock: true }, { name: 1, min_stock: 1 });
        
        if( agent_result.success && agent_result.body && brand_result.success && brand_result.body.length > 0 ){
            
            let product_result = await backProductService.find({ marketplace: req.auth.marketplace, search_field: { $not: /POP/ }, brand: { $in: brand_result.body.map( (item) => item.name ) }, status_created: 'active' }, null, { brand: 1 }, { populate: { path: 'variants' } });
            
            if( product_result.success && product_result.body.length > 0 ){
                
                let data_file = h_format.fileReportProductsLowStock( brand_result.body, product_result.body, moment() );
                let file_list = h_file.list('./public/downloads');
                if( file_list.success ){
                    
                    for (const item_file of file_list.body) {
                        
                        if( item_file.indexOf('shopify-products-low-stock') >= 0 ){
                            
                            await h_file.remove( './public/downloads', item_file.replace('./public/downloads', '' ) );
                        }
                    }
                }
                let create_file = await h_excel.createFile(`shopify-products-low-stock-${ moment().format('MM-YYYY') }`, '/documents/templates/excel/format-products-low-stock.xlsx', data_file, null, 2, formatProductLowStockBodyFile);
                if( create_file.success ){
                    
                    res.status(200).json( h_response.request( true, create_file, 200, 'Success: Download Report', 'File Created' ) );
                    
                }
                else {
                    
                    res.status(400).send( h_response.request( false, create_file, 400, 'Error: Download Report', 'File format not validated' ) );
                }
            }
            else{
                
                res.status(400).send( h_response.request( false, product_result, 400, 'Error: Download Report', 'Products not found' ) );
            }
        }
        else{
            
            res.status(400).send( h_response.request( false, agent_result, 400, 'Error: Download Report', 'Agents not found' ) );
        }
    } catch (process_error) {
        
        res.status(400).send( h_response.request( false, process_error, 400, 'Error: Download Report', 'Error in process' ) );
    }
};
/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
async function saleRandomDetails(req, res){
    
    
    try {
        
        let collection_result   = await getCollectionData( req );
        let affiliate_result    = await h_format.affiliateDiscounts( req.auth, req.query.affiliate, backAffiliateService );
        let product_result      = await backProductService.aggregate([ { $match: { tags: { $elemMatch: { tag: 'sale' } }, status: 'active', status_created: 'active' } }, { $sample: { size: 1 } }, { $project: { _id: 1 } } ]);
        
        if( collection_result.success && affiliate_result.success && product_result.success ){
            
            let find_query  = h_format.findQuery( product_result.body[0]._id );
            find_query      = {
                ...find_query,
                marketplace: req.auth.marketplace,
                status_created: 'active',
                warehouse_status: true
            };
            await h_crud.findDocument( 'Product', backProductService, find_query ).then( async (docuemnt_result) => {
                
                let exist_discount  = h_format.getDiscountBrand( req.auth.application_type, req.auth.discounts, docuemnt_result.body.brand?.handle );
                let discounts       = {
                    brand       : h_validation.evalFloat( exist_discount?.value, null ), 
                    affiliate   : affiliate_result.body.discount 
                };
                let format_product  = h_format.productObject( docuemnt_result.body, discounts );
                
                if( format_product.success ){
                    
                    let brand_result = await backBrandService.findOne({ handle: format_product.body.brand?.handle, collection_url: { $ne: null } });
                    if( brand_result.success && brand_result.body ){
                        
                        format_product.body.brand = {
                            ...format_product.body.brand,
                            url : brand_result.body ? brand_result.body.collection_url : ''
                        };
                        format_product.body.collection_data = collection_result.body;
                        res.status(200).json( h_response.request( true, format_product.body, 200, 'Success: Product find', 'Product found' ) );
                    }
                    else{
                        
                        res.status(400).send( h_response.request( false, brand_result, 400, 'Error: Product find', 'Brand not found' ) );
                    }
                }
                else{
                    
                    res.status(400).send( format_product );
                }
            }).catch( (document_error) => {
                
                res.status(400).send( h_response.request( false, document_error, 400, 'Error: Product find', 'Product not found' ) );
            });
        }
        else{
            let request_errors = [ collection_result, affiliate_result, product_result ].filter( (item) => !item.success );
            
            res.status(400).send( h_response.request( false, request_errors, 400, 'Error: Product find', 'Product not found' ) );
        }
    } catch (process_error) {
        
        res.status(400).send( h_response.request( false, process_error, 400, 'Error: Product find', 'Error in process' ) );
    }
};
async function productVariants(req, res){

    try {
        let find_query  = {};
        if( !req.body.query ){
            find_query  = h_format.findQuery( req.params.id_handle );
            find_query  = {
                ...find_query,
                marketplace: req.auth.marketplace,
                status_created: 'active',
                warehouse_status: true
            };
        }
        else{
            find_query = {
                ...req.body.query,
                marketplace: req.auth.marketplace,
                status_created: 'active',
                warehouse_status: true
            };
        }
        let find_fields = req.body.fields ? req.body.fields : { 
            shopify_id  : 1,
            reference   : 1,
            sku_parent  : 1,
            variants    : 1 
        };
        let product_result = await backProductService.findOne( find_query, find_fields, { populate: { path: 'variants', match: { status: 'active', status_created: 'active', warehouse_status: true, deleted: false } } });
        if( product_result.success && product_result.body != null ){

            res.status(200).json( h_response.request( true, product_result.body, 200, 'Success: Product Variants find', 'Product Variants found' ) );
        }
        else{
            
            res.status(400).send( h_response.request( false, product_result, 400, 'Error: Product Variants find', 'Product Variants not found' ) );
        }
    } catch (process_error) {

        res.status(400).send( h_response.request( false, process_error, 400, 'Error: Product Variants find', 'Error in process' ) );
    }
};
// =============================================================================
// GENERAL FUNCTIONS
// =============================================================================
/**
* 
* @param {*} req 
* @returns 
*/
async function getCollectionData( req ){
    
    try {
        
        let collection_result = {
            title   : req.body.handle_collection === 'new-products' ? 'New Products' : 'Best Sellers',
            handle  : req.body.handle_collection === 'new-products' ? 'new-products' : 'best-sellers'
        };
        if( req.body.handle_collection && !['best-sellers', 'new-products'].includes( req.body.handle_collection ) ){
            
            collection_result = await backCollectionService.findOne({ marketplace: req.auth.marketplace, handle: req.body.handle_collection }, { title: 1, handle: 1 });
            
            if( collection_result.success ){
                
                collection_result = {
                    title   : collection_result.body?.title ? collection_result.body.title : 'Best Sellers',
                    handle  : collection_result.body?.handle ? collection_result.body.handle : 'best-sellers'
                };
                return h_response.request( true, collection_result, 200, 'Success: Collection find', 'Collection found' );
            }
            else {
                
                return h_response.request( false, collection_result, 400, 'Error: Collection find', 'Collection not found' );
            }
        }
        else {
            
            return h_response.request( true, collection_result, 200, 'Success: Collection find', 'Collection found' );
        }
    } catch (process_error) {
        
        return h_response.request( false, process_error, 400, 'Error: Collection find', 'Error in process' );
    }
};
/**
* 
* @param {*} data_template 
* @param {*} template_file { item_sheet, first_reg, arr_columns, index_col, column } 
* @param {*} data_file { file, data_sheet, index_data, item_data }
* @param {*} format_currency { locale, code }
* @returns 
*/
async function formatBodyPriceCatalogFile( data_template, template_file, data_file, format_currency ){
    
    
    let formula_excel = null;
    let cell_file = `${ template_file.column }${ parseInt( template_file.first_reg ) + data_file.index_data }`;
    let item_file = data_file.item_data.row.columns.find( (item) => item.index_column === template_file.index_col );
    let cell_template = `${ template_file.column }${ template_file.first_reg }`;
    if( item_file ){
        data_template.Sheets[template_file.item_sheet][cell_file] = h_excel.addCell( data_template, data_template.Sheets[template_file.item_sheet][cell_template], item_file.value, format_currency, formula_excel );
    }
    
    return data_template;
};
/**
* 
* @param {*} data_template 
* @param {*} template_file { item_sheet, first_reg, arr_columns, index_col, column } 
* @param {*} data_file { file, data_sheet, index_data, item_data }
* @param {*} format_currency { locale, code }
* @returns 
*/
async function formatProductLowStockBodyFile( data_template, template_file, data_file, format_currency ){
    
    let formula_excel   = null;
    let cell_file       = `${ template_file.column }${ parseInt( template_file.first_reg ) + data_file.index_data }`;
    let item_file       = data_file.item_data.row.columns.find( (item) => item.index_column === template_file.index_col );
    let cell_template   = `${ template_file.column }${ template_file.first_reg }`;
    
    if( item_file ){
        
        data_template.Sheets[template_file.item_sheet][cell_file] = h_excel.addCell( data_template, data_template.Sheets[template_file.item_sheet][cell_template], item_file.value, format_currency, formula_excel );
    }
    return data_template;
};
// =============================================================================
// EXPORTS
// =============================================================================
module.exports = {
    get:{
        downloadPriceCatalogFile,
        deletePriceCatalogFile,
        sitemaps,
        downloadProductsLowStockFile,
        saleRandomDetails
    },
    post:{
        findDocument,
        productVariants,
        listDocuments,
        storeSearchProducts,
        deleteProductShopify,
        productRecentlyViewed
    },
    put:{
    },
    delete:{
    }
};