// =============================================================================
// PACKAGES
// =============================================================================
const axios                 = require('axios');
// =============================================================================
// CONFIGURATION
// =============================================================================
const config_credentials    = require('../../config/credentials');
// =============================================================================
// HELPERS
// =============================================================================
const utils                 = require('../../helpers/utils');
// =============================================================================
// AXIOS INSTANCE
// =============================================================================
const axiosKlaviyo          = axios.create({ 
    baseURL: config_credentials.external_application.klaviyo.url, 
    headers: { 
        accept: 'application/json', 
        revision: config_credentials.external_application.klaviyo.revision, 
        'content-type': 'application/json', 
        Authorization: `Klaviyo-API-Key ${ config_credentials.external_application.klaviyo.token }` 
    } 
});
// =============================================================================
// REST FUNCTIONS
// =============================================================================
async function getProfile(id_profile){
    
    return new Promise(async (resolve, reject) => {
        
        let url_api = `/profiles/${ id_profile }`;
        await axiosKlaviyo.get(url_api).then( (axios_result) => {
            
            resolve( utils.format.formatResponseRequest( true, axios_result.data.data, 200, "Success: Get Klaviyo Profile", "Found Klaviyo Profile" ) );
        }).catch( (axios_error) => {
            
            reject( utils.format.formatResponseRequest( false, axios_error.response?.data ? axios_error.response.data : axios_error.response, 400, "Error: Get Klaviyo Profile", "Klaviyo Profiles not found" ) );
        });
    });
};
async function createProfile( data_profile){
    
    return new Promise(async (resolve, reject) => {
        
        let url_api = "/profiles";
        await axiosKlaviyo.post(url_api, { data: { type: 'profile', attributes: formatProfile( data_profile ) } }).then( (axios_result) => {
            
            resolve( utils.format.formatResponseRequest( true, axios_result.data.data, 200, "Success: Create Klaviyo Profile", "Created Klaviyo Profile" ) );
        }).catch( (axios_error) => {
            
            reject( utils.format.formatResponseRequest( false, axios_error.response?.data ? axios_error.response.data : axios_error.response, 400, "Error: Create Klaviyo Profile", "Klaviyo Profile not Created" ) );
        });
    });
};
async function updateProfile( id_profile, data_profile){
    
    return new Promise(async (resolve, reject) => {
        
        let url_api = `/profiles/${ id_profile }`;
        await axiosKlaviyo.patch(url_api, { data: { type: 'profile', id: id_profile, attributes: formatProfile( data_profile ) } }).then( (axios_result) => {
            
            resolve( utils.format.formatResponseRequest( true, axios_result.data.data, 200, "Success: Update Klaviyo Profile", "Updated Klaviyo Profile" ) );
        }).catch( (axios_error) => {
            
            reject( utils.format.formatResponseRequest( false, axios_error.response?.data ? axios_error.response.data : axios_error.response, 400, "Error: Update Klaviyo Profile", "Klaviyo Profile not Updated" ) );
        });
    });
};
async function allProfiles(){
    
    return new Promise(async (resolve, reject) => {
        
        let url_api = `/profiles?page[size]=100`;
        let all_docs = [];
        let next_page = null;
        do {
            let doc_results = await axiosKlaviyo.get(next_page || url_api).then( (axios_result) => { return axios_result.data; }).catch( (axios_error) => {
                
                reject( utils.format.formatResponseRequest( false, axios_error.response?.data ? axios_error.response.data : axios_error.response, 400, "Error: List Klaviyo Profiles", "Klaviyo Profiles not found" ) )
            });

            all_docs.push(doc_results.data);
            next_page = doc_results.links.next ? doc_results.links.next.replace(config_credentials.external_application.klaviyo.url, '') : null;
            
        } while (next_page !== null);
        
        resolve( utils.format.formatResponseRequest( true, all_docs.flat(), 200, "Success: List Klaviyo Profiles", "Found Klaviyo Profiles" ) );
    });
};

// =============================================================================
// GENERAL FUNCTIONS
// =============================================================================
function formatProfile(item_profile){
        
    let new_phone   = item_profile.phone_number && item_profile.phone_number.trim() != "" ? item_profile.phone_number.trim() : null;
    let valid_phone = new_phone ? new_phone.indexOf("+") : -1;
    valid_phone     = new_phone && valid_phone < 0 ? `+${ new_phone }` : new_phone;

    return {
        email       : item_profile.email,
        phone_number: valid_phone ? valid_phone.replace("(", "").replace(")", "").split(" ").join("") : valid_phone,
        external_id : item_profile.external_id ? item_profile.external_id : null,
        first_name  : item_profile.first_name,
        last_name   : item_profile.last_name,
        location    : {
            address1    : item_profile.location ? item_profile.location.address1    : null,
            address2    : item_profile.location ? item_profile.location.address2    : null,
            city        : item_profile.location ? item_profile.location.city        : null,
            country     : item_profile.location ? item_profile.location.country     : null,
            latitude    : item_profile.location ? item_profile.location.latitude    : null,
            longitude   : item_profile.location ? item_profile.location.longitude   : null,
            region      : item_profile.location ? item_profile.location.state       : null,
            zip         : item_profile.location ? item_profile.location.zip         : null,
            timezone    : item_profile.location ? item_profile.location.timezone    : null,
            ip          : item_profile.location ? item_profile.location.ip          : null
        },
        properties  : {
            "Accepts Marketing" : false,
            "Shopify Tags"      : item_profile.tags,
            "type_business"     : item_profile.type_business ? item_profile.type_business : null
        }
    }
}
// =============================================================================
// EXPORTS
// =============================================================================
module.exports = {
    get:{
        getProfile,
        allProfiles
    },
    post:{
        createProfile
    },
    put:{
    },
    patch:{
        updateProfile
    },
    delete:{
    }
};