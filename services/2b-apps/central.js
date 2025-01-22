// =============================================================================
// PACKAGES
// =============================================================================
const axios             = require('axios');
// =============================================================================
// CONFIGURATION
// =============================================================================
const config_credentials   = require('../../config/credentials');
// =============================================================================
// HELPERS
// =============================================================================
const h_array           = require('../../helpers/array');
const h_response        = require('../../helpers/response');
// =============================================================================
// AXIOS INSTANCE
// =============================================================================
const axiosCentral      = axios.create({ 
    baseURL: config_credentials.external_application.central.url 
});
const options_central   = { headers: { authorization: null } };
// =============================================================================
// SERVICES
// =============================================================================
// =============================================================================
// REST FUNCTIONS
// =============================================================================
async function login(){

    return new Promise(async (resolve, reject) => {

        await axiosCentral.post(`/auth/login`, { username: config_credentials.external_application.central.user, password: config_credentials.external_application.central.password }).then( (axios_response) => {
    
            resolve( h_response.request( true, axios_response.data, 200, "Success: Central Login", "Login to Central successfully" ) );
        }).catch( (axios_error) => {
            
            reject( h_response.request( false, axios_error.response?.data ? axios_error.response.data : axios_error.response, 400, "Error: Central Login", "Login to Central error" ) );
        });
    });
};
async function listProductsBySku(req_data){

    return new Promise(async (resolve, reject) => {

        let url_api         = `/${ config_credentials.external_application.central.version }/product/by-sku`;
        let all_skus        = h_array.chunk( req_data.all_skus, 50 );
        let result_central  = {
            data    : {
                exist_skus  : [],
                missing_skus: []
            },
            errors  : []
        };
        for (const item_skus of all_skus) {

            await axiosCentral.post(url_api, { skuList: item_skus }, formatAuthentication( req_data.token ) ).then( (axios_response) => {
                
                result_central.data.exist_skus.push( axios_response.data.data );
                result_central.data.missing_skus.push( axios_response.data.missingSkus );
            }).catch( (axios_error) => {
                
                result_central.errors.push( axios_error.response?.data ? axios_error.response.data : axios_error.response );
            });
        }
        if( result_central.errors.length === 0 ){

            result_central.data.exist_skus      = result_central.data.exist_skus.flat();
            result_central.data.missing_skus    = result_central.data.missing_skus.flat();
            resolve( h_response.request( true, result_central.data, 200, "Success: List Products by SKU", "List Products successfully" ) );
        }
        else{
            
            reject( h_response.request( false, result_central.errors, 400, "Error: List Products by SKU", "List Products error" ) );
        }
    });
};
// =============================================================================
// GENERAL FUNCTIONS
// =============================================================================
function formatAuthentication( token ){
    return { headers: { Authorization: `Bearer ${ token }` } };
}
// =============================================================================
// EXPORTS
// =============================================================================
module.exports = {
    get:{
    },
    post:{
        login,
        listProductsBySku
    },
    put:{
    },
    delete:{
    }
};