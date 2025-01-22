// =============================================================================
// CONFIGURATION
// =============================================================================
const config_application    = require('../../config/application');
// =============================================================================
// PACKAGES
// =============================================================================
const shopifyAPI            = require('shopify-api-node');
// =============================================================================
// HELPERS
// =============================================================================
const h_validation          = require('../../helpers/validation');
const h_response            = require('../../helpers/response');
// =============================================================================
// GENERAL FUNCTIONS
// =============================================================================
async function excuteRequest(api_instance, resource, method, params = null, document_id = null, parent_id = null){
    
    return new Promise(async (resolve, reject) => {
        
        try {
            params      = h_validation.evalObject( params, null );
            document_id = h_validation.evalInt( document_id, null );
            parent_id   = h_validation.evalInt( parent_id, null );
            
            if(parent_id && document_id){
                
                resolve( await params ? api_instance[resource][method](parent_id, document_id, params) : api_instance[resource][method](parent_id, document_id) );
            }
            else if(document_id && !parent_id){
                
                resolve( await params ? api_instance[resource][method](document_id, params) : api_instance[resource][method](document_id) );
            }
            else{

                resolve( await api_instance[resource][method](params) );
            }
        } catch (request_error) {
            
            reject( request_error );
        }
    });
}
// =============================================================================
// EXPORTS
// =============================================================================
module.exports = {
    /**
    * 
    * @param {*} credential_shop 
    * @returns 
    */
    init: ( credential_shop ) => {
        
        try {
            const shopify = new shopifyAPI({ shopName: credential_shop.shop, accessToken: credential_shop.access_token });
            
            return shopify;
            
        } catch (instance_error) {
            console.log( "instance_error", instance_error );
            throw instance_error
        }
    },
    /**
    * @description 
    * @param {Object} [api_instance] shopify-api-node api instance
    * @param {Object} [resource] Api resource that contains the methods, which query in shopify
    * @param {Object} [method] Api resource method, which executes the query to shopify
    * @param {Object} [params] (Optional) Query with the additional parameters of endpoint. Example: { limit: 250, fields:'id,name' } 
    * @param {String} [document_id] (Optional) Id from document consulted 
    * @param {String} [parent_id] (Optional) Parent id from document consulted
    * @returns 
    */
    paginateQuery: (api_instance, resource, method, params = null, document_id = null, parent_id = null) => {
        
        return new Promise(async (resolve, reject) => {
            
            let all_docs = [];
            method = Object.entries( Object.getPrototypeOf( resource ) ).reduce( (previous_item, [key, value]) =>{ if( value.toString() === method.toString() ){ previous_item = key; } return previous_item; }, "");
            resource = resource.constructor.name.replace(/^\w/, (c) => c.toLowerCase());
            let acum_documents = 0;
            await (async () => {
                
                if( parent_id && !document_id ){
                    
                    return reject( h_response.shopify( false, { params, document_id, parent_id }, { resource, method, params, document_id, parent_id }, 400, 'Error: Shopify Request', 'Shopify has encountered an error querying') );
                }
                else{
                    
                    do {
                        
                        await excuteRequest(api_instance, resource, method, params, document_id, parent_id).then( (result) => { return result; }).then( (shopify_result) => {
                            
                            all_docs.push(shopify_result);
                            acum_documents += shopify_result.length;
                            if( config_application.status === 'developer' ){ console.log( shopify_result.length, acum_documents ); }
                            params = shopify_result?.nextPageParameters || null;
                        }).catch( (shopify_error) => {
                            
                            params = null;
                            return reject( h_response.shopify( false, shopify_error, { resource, method, params, document_id, parent_id }, 400, 'Error: Shopify Request', 'Error: Shopify has encountered an error querying') );
                        });
                        
                    } while (params !== null);
                    
                    resolve( h_response.shopify( true, all_docs.flat(), { resource, method, params, document_id, parent_id }, 200, 'Success: Shopify Request', 'Shopify Request Excecute successfully') );
                }
            })().catch((shopify_error)=>{
                
                return reject( h_response.shopify( false, shopify_error, { resource, method, params, document_id, parent_id }, 400, 'Error: Shopify Request', 'Shopify has encountered an error querying') );
            });
        });
    },
    /**
    * @description 
    * @param {Object} [api_instance] shopify-api-node api instance
    * @param {Object} [resource] Api resource that contains the methods, which query in shopify
    * @param {Object} [method] Api resource method, which executes the query to shopify
    * @param {Object} [params] (Optional) Query with the additional parameters of endpoint. Example: { limit: 250, fields:'id,name' } 
    * @param {String} [document_id] (Optional) Id from document consulted 
    * @param {String} [parent_id] (Optional) Parent id from document consulted
    * @returns 
    */
    executeQuery: (api_instance, resource, method, params = null, document_id = null, parent_id = null) => {
        
        return new Promise(async (resolve, reject) => {
            
            method = Object.entries( Object.getPrototypeOf( resource ) ).reduce( (previous_item, [key, value]) =>{ if( value.toString() === method.toString() ){ previous_item = key; } return previous_item; }, "");
            resource = resource.constructor.name.replace(/^\w/, (c) => c.toLowerCase());
            await (async () => {
                
                if( parent_id && !document_id ){
                    
                    return reject( h_response.shopify( false, { params, document_id, parent_id }, { resource, method, params, document_id, parent_id }, 400, 'Error: Shopify Request', 'Shopify has encountered an error querying') );
                }
                else{
                    
                    await excuteRequest(api_instance, resource, method, params, document_id, parent_id).then( (shopify_result) => { 
                        
                        resolve( h_response.shopify( true, shopify_result, { resource, method, params, document_id, parent_id }, 200, 'Success: Shopify Request', 'Shopify Request Excecute successfully') );
                        
                    }).catch( (shopify_error) => {
                        
                        return reject( h_response.shopify( false, shopify_error, { resource, method, params, document_id, parent_id }, 400, 'Error: Shopify Request', 'Shopify has encountered an error querying') );
                    });
                    
                }
            })().catch( (shopify_error) => {
                return reject( h_response.shopify( false, shopify_error, { resource, method, params, document_id, parent_id }, 400, 'Error: Shopify Request', 'Shopify has encountered an error querying') );
            });
        });
    }
};
