// =============================================================================
// GENERAL FUNCTIONS
// =============================================================================
/**
* 
* @param {*} data 
* @param {*} status 
* @param {*} title 
* @param {*} message 
* @returns 
*/
function request( success, data, status, title, message ){
    
    let response = { 
        success     : success, 
        status      : status,
        title       : title,
        message     : message, 
        body        : data,
        app_version : global.app_version 
    };
    if( !success ){
        
        if( !data ){
            
            data = { title: "Error Connection", message: "Waiting time expired, please try again" };
        }
        response = { 
            success     : success, 
            status      : data?.status ? data.status : status,
            title       : data?.title ? data.title : title,
            message     : `${ data.message ? data.message.toString().replace(/\\/g, '/') : message }`, 
            body        : data?.stack ? data.stack.replace(/\\/g, '/').replace(/(')/g, '').replace(/(')/g, '').split('\n') : data,
            app_version : global.app_version 
        };
    }
    return response;
};
/**
 * 
 * @param {*} success 
 * @param {*} data 
 * @param {*} shopify_request resource, method, params, document_id, parent_id
 * @param {*} status 
 * @param {*} title 
 * @param {*} message 
 * @returns 
 */
function shopify( success, data, shopify_request, status, title, message ){
    let response = { 
        success     : success, 
        status      : status,
        title       : title,
        message     : message, 
        body        : data,
        shopify     : shopify_request,
        app_version : global.app_version 
    };
    if( !success ){
        
        if( !data ){
            
            data = { title: "Error Connection", message: "Waiting time expired, please try again" };
        }
        response = { 
            success     : success, 
            status      : data?.status ? data.status : status,
            title       : data?.title ? data.title : title,
            message     : `${ data.message ? data.message.toString().replace(/\\/g, '/') : message }`, 
            body        : data?.stack ? data.stack.replace(/\\/g, '/').replace(/(')/g, '').replace(/(')/g, '').split('\n') : data,
            shopify     : shopify_request,
            app_version : global.app_version 
        };
    }
    return response;
};
// =============================================================================
// EXPORTS
// =============================================================================
module.exports = {
    request,
    shopify
}