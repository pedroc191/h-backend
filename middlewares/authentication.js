// =============================================================================
// CONFIGURATION
// =============================================================================
const config_encrypted_keys  = require('../config/encrypted-keys');
const config_application      = require('../config/application');
// =============================================================================
// HELPERS
// =============================================================================
const h_response     = require('../helpers/response');
const h_validation   = require('../helpers/validation');
const h_format       = require('../helpers/format');
// =============================================================================
// SERVICES
// =============================================================================
const { 
    backUserService, 
    backApplicationService,
    agentDiscountService,
    backMarketplaceService,
    backStorefrontService
} = require('../services/manager');
// =============================================================================
// GENERAL VARIABLES
// =============================================================================
let fileds_user = {
    _id: 1,
    role: 1,
    customer: 1,
    marketplace: 1,
    status: 1,
    first_name: 1,
    last_name: 1,
    email: 1,
    token_login: 1
}
let populate_user = {
    populate: [
        { 
            path: 'customer', 
            match: { 
                status: 'active', 
                deleted: false 
            }, 
            select: '_id shopify_id agent agent_email first_name last_name full_name profile_image email phone addresses is_dropshipping valid_moa first_order special_shippings tax_exempt', 
            populate: null 
        }
    ]
};
// =============================================================================
// EXPORTS
// =============================================================================
/**
* 
* @param {*} req 
* @param {*} res 
* @param {*} next 
* @returns 
*/
const isAuthAdmin = async(req, res, next) =>{
    
    let token = getAccessToken(req);
    if (!token) {
        
        return res.status(403).send( h_response.request( false, { token: null, error: null }, 403, "Error: Authorize Request", "A token is required for authentication" ) );
    }
    else{
        
        await validAccessToken(req, token).then( (valid_result) => {
            
            req.auth = valid_result.body;
            next();
        }).catch ( (valid_error) =>{
            
            return res.status(valid_error.status).send(valid_error);
        });
    }
    
};
/**
* 
* @param {*} req 
* @param {*} res 
* @param {*} next 
* @returns 
*/
const isAuthFront = async(req, res, next) =>{
    
    let token = getAccessToken(req);
    
    if (!token) {
        
        return res.status(403).send( h_response.request( false, { token: null, error: null }, 403, "Error: Authorize Request", "A token is required for authentication" ) );
    }
    else{
        
        await validAccessToken(req, token).then( (valid_result) => {
            
            req.auth = valid_result.body;
            next();
        }).catch ( (valid_error) =>{
            
            return res.status(403).send(valid_error);
        });
    }
};
// =============================================================================
// GENERAL FUNCTIONS
// =============================================================================
function formatAuthUser(user_object){
    
    return {
        _id				: user_object._id.toString(),
        name			: `${ user_object.first_name } ${ user_object.last_name }`,
        email	        : user_object.email,
        phone           : user_object.customer.phone ? user_object.customer.phone.number : null,
        profile_image	: user_object.customer.profile_image,
        token_login     : user_object.token_login,
        customer    : {
            _id                 : user_object.customer._id.toString(),
            shopify_id          : user_object.customer.shopify_id,
            agent               : user_object.customer.agent,
            agent_email         : user_object.customer.agent_email,
            first_name          : user_object.customer.first_name,
            last_name           : user_object.customer.last_name,
            full_name           : user_object.customer.full_name,
            email               : user_object.customer.email,
            phone               : user_object.customer.phone ? user_object.customer.phone.number : null,
            addresses           : user_object.customer.addresses.map( (item) => {
                
                item.phone = item.phone ? item.phone.number : ( user_object.customer.phone ? user_object.customer.phone.number : null );
                return item;
            }),
            is_dropshipping     : user_object.customer.is_dropshipping,
            special_shippings   : user_object.customer.special_shippings,
            tax_exempt          : user_object.customer.tax_exempt,
        }
    }
};
/**
* 
* @param {*} req 
* @returns 
*/
function getAccessToken(req){
    
    let token = req.body?.token ? req.body.token : undefined; 
    token = !token && req.query && req.query.token ? decodeURI( req.query.token ) : token;
    token = !token && req.headers && req.headers['x-access-token'] ? req.headers['x-access-token'] : token;
    
    token = token ? h_validation.evalString( token ) : token;
    token = token === null || token === "null" ? undefined : token;
    
    return token;
};
/**
* 
* @param {*} req 
* @param {*} user_info 
* @param {*} get_marketplace 
* @returns 
*/
async function validAccessUser(user_info, marketplace, storefront, application_type){
    
    return new Promise(async (resolve, reject) => {
        
        try {
            let discounts           = [];
            let storefront_result   = storefront != null ? await backStorefrontService.findOne({ subdomain: storefront, status: 'active' }, { name: 1, subdomain: 1 }) : { success: true, body: null };
            let marketplace_result  = await backMarketplaceService.findOne({ handle: marketplace, status: 'active' }, { name: 1, handle: 1 });
            let user_result         = await backUserService.findOne({ _id: user_info.user, status: 'active' }, fileds_user, populate_user);
            
            if( user_result.success && user_result.body != null && storefront_result.success && marketplace_result.success && marketplace_result.body != null && ( user_result.body.marketplace.toString() === marketplace_result.body._id.toString() ) ){
                
                let discount_result = ['wholesale', 'app-wholesale'].includes( application_type ) ? await agentDiscountService.findOne({ customer: user_result.body.customer._id.toString(), status: "active" }) : { success: true, body: null };
                
                if( discount_result.success ){
                    
                    discounts       = h_format.DBDiscountBrands( application_type, discount_result.body != null ? discount_result.body.discounts : [] );
                    let body_auth   = { 
                        token           : user_info, 
                        app_version     : global.app_version, 
                        user            : formatAuthUser(user_result.body),
                        marketplace     : user_result.body.marketplace.toString(), 
                        storefront      : storefront_result.body != null ? storefront_result.body._id.toString() : null,
                        application_type: application_type, 
                        discounts       : discounts 
                    }
                    resolve( h_response.request( true, body_auth, 200, "Success: User find", "User found" ) );
                }
                else {
                    
                    reject( h_response.request( false, { token: null, error: discount_result }, 400, "Error: Discount find", "Discount not found" ) );
                }
                // if( user_result.body.role.test_mode || config_application.status === 'developer' || user_result.body.role.endpoints.find( (item_endpoint) => item_endpoint.path === req.baseUrl && item_endpoint.method === req.route.path && item_endpoint.request_method === req.method ) ){
                
                // }
                // else{
                
                //     reject( { status: 401, success: false, message: 'Error: You do not have permissions for this endpoint', data: { token: null, error: null } } );
                // }
            }
            else {
                
                reject( h_response.request( false, { token: null, error: null }, 403, "Error: Authorize User", "User not exist" ) );
            }
        } catch (process_error) {
            
            console.log( process_error );
            reject( h_response.request( false, { token: null, error: process_error }, 400, "Error: Process User", "Error in process user" ) );
        }
    });
};
/**
* 
* @param {*} req 
* @param {*} user_info 
* @param {*} get_marketplace 
* @returns 
*/
async function validAccessApplication(req, user_info, marketplace, storefront, application_type){
    
    return new Promise(async (resolve, reject) => {
        
        try {
            let storefront_result   = storefront != null ? await backStorefrontService.findOne({ subdomain: storefront, status: 'active' }, { name: 1, subdomain: 1 }) : { success: true, body: null };
            let marketplace_result  = await backMarketplaceService.findOne({ handle: marketplace, status: 'active' }, { name: 1, handle: 1 });
            let application_result  = await backApplicationService.findOne({ handle: user_info.handle, host: user_info.access.host, status: 'active' }, { name: 1, handle: 1, test_mode: 1, exact_version: 1, marketplace: 1 }, { populate: null });
            
            if( application_result.success && application_result.body != null && storefront_result.success && marketplace_result.success && marketplace_result.body != null && ( application_result.body.marketplace.toString() === marketplace_result.body._id.toString() ) ){
                
                let header_origin       = req.headers.origin ? req.headers.origin.replace(/(?:http|https):\/\/+/, "").replace("www.", "") : null;
                let valid_app_version   = req.query.app_version === "null" || !application_result.body.exact_version || ( req.query.app_version != "null" && application_result.body.exact_version && global.app_version === req.query.app_version );
                let valid_header_origin = ( header_origin && header_origin === user_info.access.host ) || ( !header_origin && ( req.query.test_postman === config_encrypted_keys.test ) );
                // let valid_endpoint      = application_result.body.endpoints.find( (item_endpoint) => item_endpoint.path === req.baseUrl && item_endpoint.method === req.route.path && item_endpoint.request_method === req.method );
                // valid_app_version && ( application_result.body.test_mode || config_application.status === 'developer' || ( valid_header_origin && valid_endpoint ) )
                let user_result         = req.query.customer ? await backUserService.findOne({ customer: req.query.customer }, fileds_user, populate_user) : { success: true, body: null };
                let discount_result     = req.query.customer ? await agentDiscountService.findOne({ customer: req.query.customer, status: "active" }) : { success: true, body: null };
                if( user_result.success && discount_result.success && valid_app_version && ( application_result.body.test_mode || config_application.status === 'developer' || valid_header_origin ) ){
                    
                    let body_auth = { 
                        token           : user_info, 
                        app_version     : global.app_version, 
                        user            : application_result.body,
                        marketplace     : application_result.body.marketplace.toString(), 
                        storefront      : storefront_result.body != null ? storefront_result.body._id.toString() : null,
                        application_type: application_type,
                        discounts       : h_format.DBDiscountBrands( application_type, discount_result.body != null ? discount_result.body.discounts : [] )
                    }
                    if( user_result.body != null ){
                        
                        body_auth.user          = formatAuthUser(user_result.body);
                    }
                    resolve( h_response.request( true, body_auth, 200, "Success: Application find", "Application found" ) );
                }
                else if ( !valid_app_version ){
                    
                    reject( h_response.request( false, { token: null, error: null }, 400, "Error: Store Version", "Store version not updated, please reload the page" ) );
                }
                // else if( !valid_header_origin ){
                
                //     reject( h_response.request( false, { token: null, error: null }, 403, "Error: Authorize Application", "You do not have permissions for this endpoint" ) );
                // }
                else{
                    reject( h_response.request( false, { token: null, error: null }, 403, "Error: Authorize Application", "Unauthorized Application for this request" ) );
                }
            }
            else{
                
                reject( h_response.request( false, { token: null, error: null }, 403, "Error: Authorize Application", "Application not exist" ) );
            }
        } catch (process_error) {
            
            console.log( process_error );
            reject( h_response.request( false, { token: null, error: process_error }, 400, "Error: Process Application", "Error in process application" ) );
        }
    });
};

/**
* 
* @param {*} req 
* @param {*} token 
* @returns 
*/
function validAccessToken(req, token ){
    
    return new Promise(async (resolve, reject) => {
        
        let split_token             = token.split(' ');
        token                       = split_token[0];
        let get_marketplace         = split_token.length > 1 ? h_validation.evalString( split_token[1], null )          : null;
        let get_application_type    = split_token.length > 1 ? h_validation.evalString( split_token[2], 'wholesale' )   : 'wholesale';
        let get_storefront          = req.query.storefront ? h_validation.evalString( req.query.storefront, null )      : null;
        let user_info               = h_validation.verifyToken( token );
        
        user_info = !user_info.access?.is_app && user_info.access?.handle != 'customer' ? h_validation.verifyToken( token, false ) : user_info;
        
        if( !user_info.access && user_info.success != undefined ){
            
            return reject( h_response.request( false, { token: null, data: user_info.data }, 403, "Error: Authentication", user_info.message ) );
        }
        else if( !user_info.access && user_info.success === undefined ){
            
            return reject( h_response.request( false, user_info, 403, "Error: Authentication", "Verified Credentials failed" ) );
        }
        else if( get_marketplace === null ){
            
            return reject( h_response.request( false, { token: null, data: null }, 403, "Error: Authentication", "Marketplace not found" ) );
        }
        else if( user_info.access.is_app === false && ( req.query.app_version === "undefined" || ( ['app-wholesale', 'app-storefront'].includes( get_application_type ) || ( req.query.app_version != "null" && global.app_version === req.query.app_version ) ) ) ){
            
            await validAccessUser(user_info, get_marketplace, get_storefront, get_application_type).then( (valid_result) => {
                
                resolve( valid_result );
            }).catch( (valid_error) => {
                
                reject( valid_error );
            });
        }
        else if( user_info.access.is_app ){
            
            await validAccessApplication(req, user_info, get_marketplace, get_storefront, get_application_type).then( (valid_result) => {
                
                resolve( valid_result );
            }).catch( (valid_error) => {
                
                reject( valid_error );
            });
        }
        else{
            
            return reject( h_response.request( false, { token: null, data: null }, 400, "Error: Store Version", "Store version not updated, please reload the page" ) );
        }
    });
};
module.exports = {
    isAuthAdmin,
    isAuthFront
};