// =============================================================================
// PACKAGES
// =============================================================================
const axios         = require('axios');
// =============================================================================
// CONFIGURATION
// =============================================================================
const config_credentials   = require('../../config/credentials');
// =============================================================================
// HELPERS
// =============================================================================
const h_response    = require('../../helpers/response');
// =============================================================================
// AXIOS INSTANCE
// =============================================================================
const axiosAgent    = axios.create({ 
    baseURL: config_credentials.external_application.agent.url, 
    headers: { 
        Authorization: config_credentials.external_application.agent.token 
    } 
});
// =============================================================================
// SERVICES
// =============================================================================
const {
    agentDiscountService
} = require('../manager');
// =============================================================================
// REST FUNCTIONS
// =============================================================================
async function listStates(){

    return new Promise(async (resolve, reject) => {

        let url_api = "/state/getmany";
        await axiosAgent.get(url_api).then( (axios_response) => {
    
            resolve( h_response.request( true, axios_response.data, 200, "Success: States List", "States List found" ) );
        }).catch( (axios_error) => {
            
            reject( h_response.request( false, axios_error.response?.data ? axios_error.response.data : axios_error.response, 400, "Error: States List", "States List not found" ) );
        });
    });
};
async function listLanguages(){

    return new Promise(async (resolve, reject) => {

        let url_api = "/language/getmany";
        await axiosAgent.get(url_api).then( (axios_response) => {
    
            resolve( h_response.request( true, axios_response.data, 200, "Success: Language List", "Language List found" ) );
        }).catch( (axios_error) => {
            
            reject( h_response.request( false, axios_error.response?.data ? axios_error.response.data : axios_error.response, 400, "Error: Language List find", "Languages List not found" ) );
        });
    });
};
async function listCustomerTypes(){

    return new Promise(async (resolve, reject) => {

        let url_api = "/customertype/getmany";
        await axiosAgent.get(url_api).then( (axios_response) => {
    
            resolve( h_response.request( true, axios_response.data, 200, "Success: Customer Type List", "Customer Type List found" ) );
        }).catch( (axios_error) => {
            
            reject( h_response.request( false, axios_error.response?.data ? axios_error.response.data : axios_error.response, 400, "Error: Customer Type List", "Customer Type List not found" ) );
        });
    });
};
async function listCategoryProducts(){

    return new Promise(async (resolve, reject) => {

        let url_api = "/category/product/getmany";
        await axiosAgent.get(url_api).then( (axios_response) => {
    
            resolve( h_response.request( true, axios_response.data, 200, "Success: Category Product List", "Category Product List found" ) );
        }).catch( (axios_error) => {
            
            reject( h_response.request( false, axios_error.response?.data ? axios_error.response.data : axios_error.response, 400, "Error: Category Product List", "Category Product not found" ) );
        });
    });
};
async function listBusinessTypes(){

    return new Promise(async (resolve, reject) => {

        let url_api = "/business-type/getmany";
        await axiosAgent.get(url_api).then( (axios_response) => {
    
            resolve( h_response.request( true, axios_response.data, 200, "Success: Business Type List", "Business Type List found" ) );
        }).catch( (axios_error) => {
            
            reject( h_response.request( false, axios_error.response?.data ? axios_error.response.data : axios_error.response, 400, "Error: Business Type find", "Business Type not found" ) );
        });
    });
};
async function listInvestRange(){

    return new Promise(async (resolve, reject) => {

        let url_api = "/invest-range/getmany";
        await axiosAgent.get(url_api).then( (axios_response) => {
    
            resolve( h_response.request( true, axios_response.data, 200, "Success: Invest Range List", "Invest Range List found" ) );
        }).catch( (axios_error) => {
            
            reject( h_response.request( false, axios_error.response?.data ? axios_error.response.data : axios_error.response, 400, "Error: Invest Range", "Invest Range not found" ) );
        });
    });
};
/**
 * 
 * @param {*} req_data 
 * @returns 
 */
async function createLead(req_data){
    
    return new Promise(async (resolve, reject) => {
        
        let url_api = "/lead/new-upsert";
        await axiosAgent.post(url_api, req_data).then( (axios_response) => {

            resolve( h_response.request( true, axios_response.data, 200, "Success: Lead Created", "Lead not Created" ) );
        }).catch( (axios_error) => {

            reject( h_response.request( false, axios_error.response?.data ? axios_error.response.data : axios_error.response, 400, "Error: Lead Create", "Lead Not Created" ) );
        });
    });
};
/**
 * 
 * @param {*} req_data 
 * @returns 
 */
async function updateLead(req_data){
    
    return new Promise(async (resolve, reject) => {
        
        let url_api = `/lead/new-upsert`;

        await axiosAgent.post(url_api, req_data).then( (axios_response) => {
    
            resolve( h_response.request( true, axios_response.data, 200, "Success: Lead Updated", "Lead not Updated" ) );
        }).catch( (axios_error) => {
            reject( h_response.request( false, axios_error.response?.data ? axios_error.response.data : axios_error.response, 400, "Error: Lead Update", "Lead Not Updated" ) );
        });
    });
};
/**
 * 
 * @param {*} req_data 
 */
async function convertLeadToCustomer(req_data){

    return new Promise(async (resolve, reject) => {
        
        let url_api = `/customer/convert-lead`;

        await axiosAgent.post(url_api, req_data).then( (axios_response) => {
    
            resolve( h_response.request( true, axios_response.data, 200, "Success: Convert Lead", "Lead Converted" ) );
        }).catch( (axios_error) => {
            
            reject( h_response.request( false, axios_error.response?.data ? axios_error.response.data : axios_error.response, 400, "Error: Lead Convert", "Lead Not Converted" ) );
        });
    });
};
/**
 * 
 * @param {*} req_data 
 * @returns 
 */
async function couponApplicable(req_data){
    
    return new Promise(async (resolve, reject) => {

        let url_api = "/coupon/applicable";
        await axiosAgent.post(url_api, req_data).then( (axios_response) => {
            
            resolve( h_response.request( true, axios_response.data, 200, "Success: Coupon Applicable", "Coupon Applied" ) );
        }).catch( (axios_error) => {
            
            reject( h_response.request( false, axios_error.response?.data ? axios_error.response.data : axios_error.response, 400, "Error: Coupon Applicable", "Coupon not Applied" ) );
        });
    });
};
/**
 * 
 * @param {*} req_data 
 * @returns 
 */
async function couponUsed(req_data){
    
    return new Promise(async (resolve, reject) => {

        let url_api = "/coupon/used";
        await axiosAgent.put(url_api, req_data).then( (axios_response) => {
            
            resolve( h_response.request( true, axios_response.data, 200, "Success: Coupon Use", "Coupon Used" ) );
        }).catch( (axios_error) => {
            
            reject( h_response.request( false, axios_error.response?.data ? axios_error.response.data : axios_error.response, 400, "Error: Coupon Use", "Coupon not updated" ) );
        });
    });
};
async function listCoupons(){
    
    return new Promise(async (resolve, reject) => {

        let url_api = "/coupon/names";
        await axiosAgent.get(url_api).then( (axios_response) => {
            
            resolve( h_response.request( true, axios_response.data, 200, "Success: Coupon List", "Coupon found" ) );
        }).catch( (axios_error) => {
            
            reject( h_response.request( false, axios_error.response?.data ? axios_error.response.data : axios_error.response, 400, "Error: Coupon List", "Coupon not found" ) );
        });
    });
};
/**
 * 
 * @param {*} customer_id 
 * @returns 
 */
async function listCouponsByCustomer(customer_id){
    
    return new Promise(async (resolve, reject) => {

        let url_api = `/coupon/get-by-customer?customer=${ customer_id }`;
        await axiosAgent.get(url_api).then( (axios_response) => {
            
            resolve( h_response.request( true, axios_response.data, 200, "Success: Coupons by Customer", "Coupon found" ) );
        }).catch( (axios_error) => {
            
            reject( h_response.request( false, axios_error.response?.data ? axios_error.response.data : axios_error.response, 400, "Error: Coupons by Customer", "Coupon not found" ) );
        });
    });
};
/**
 * 
 * @param {*} id_customer 
 * @returns 
 */
async function levelCustomer(id_customer){

    return new Promise(async (resolve, reject) => {

        let url_api = `/level/level-customer/${ id_customer }`;
        await axiosAgent.get(url_api).then( (axios_response) => {
            
            resolve( h_response.request( true, axios_response.data, 200, "Success: Level Customer", "Level Customer found" ) );
        }).catch( (axios_error) => {
            
            reject( h_response.request( false, axios_error.response?.data ? axios_error.response.data : axios_error.response, 400, "Error: Level Customer", "Level Customer not found" ) );
        });
    });
};
/**
 * 
 * @param {*} valid_token 
 * @returns 
 */
async function validDiscounts(valid_token){
    
    return new Promise(async (resolve, reject) => {

        if( valid_token.token && valid_token.token != null && valid_token.data.user?.customer != null && valid_token.token.access && !valid_token.token.access.is_app ) {

            let discount_result = await agentDiscountService.findOne({ customer: valid_token.data.user.customer._id, status: "active" });
            
            if( discount_result.success ){

                let discounts = ( discount_result.body?.discounts || [] ).reduce( (previous_item, current_item) => { 
                
                    if( !current_item.deleted && current_item.brand ){

                        previous_item.push( { brand: current_item.brand.name, value: parseFloat( current_item.valueDiscount ) } )
                    }
                    return previous_item;
                }, []);
                resolve( discounts );
            }
            else{
                
                reject( h_response.request( false, discount_result, 400, "Error: Discount find", "Discount not found" ) );
            }
        }
        else{
            
            resolve( [] );
        }
    });
};
/**
 * 
 * @param {*} req_data 
 * @returns 
 */
async function createDraftOrder(req_data){

    return new Promise(async (resolve, reject) => {

        let url_api = "/draft-order/create";
        await axiosAgent.post(url_api, req_data).then( (axios_response) => {
            
            resolve( h_response.request( true, axios_response.data, 200, "Success: Draft Order Create", "Draft Order Created" ) );
        }).catch( (axios_error) => {
            
            reject( h_response.request( false, axios_error.response?.data ? axios_error.response.data : axios_error.response, 400, "Error: Draft Order Create", "Draft Order not Created" ) );
        });
    });
};
/**
 * 
 * @param {*} req_data 
 * @returns 
 */
async function updateDraftOrder(req_data){

    return new Promise(async (resolve, reject) => {

        let url_api = `/draft-order/update/${ req_data.db_draft_id }${ req_data.type_id ? `?type_id=${ req_data.type_id }` : '' }`;
        await axiosAgent.put(url_api, req_data.update).then( (axios_response) => {
            
            resolve( h_response.request( true, axios_response.data, 200, "Success: Draft Order Update", "Draft Order Updated" ) );
        }).catch( (axios_error) => {

            reject( h_response.request( false, axios_error.response?.data ? axios_error.response.data : axios_error.response, 400, "Error: Draft Order Update", "Draft Order not Updated" ) );
        });
    });
};
/**
 * 
 * @param {*} id_customer 
 * @returns 
 */
async function agentCustomer(id_customer){
    
    return new Promise(async (resolve, reject) => {

        let url_api = `/user/get-by-customer/${ id_customer }`;
        await axiosAgent.get(url_api).then( (axios_response) => {
            
            resolve( h_response.request( true, axios_response.data, 200, "Success: Agent Customer", "Agent Customer Found" ) );
        }).catch( (axios_error) => {
            
            reject( h_response.request( false, axios_error.response?.data ? axios_error.response.data : axios_error.response, 400, "Error: Agent Customer", "Agent Customer not found" ) );
        });
    });
};
/**
 * 
 * @param {*} req_data 
 * @returns 
 */
async function sendNotificationGeneral(req_data){
    
    return new Promise(async (resolve, reject) => {

        let url_api = `/notification/send`;
        await axiosAgent.post(url_api, req_data).then( (axios_response) => {
            
            resolve( h_response.request( true, axios_response.data, 200, "Success: Agent Notification", "Send Notification" ) );
        }).catch( (axios_error) => {
            
            reject( h_response.request( false, axios_error.response?.data ? axios_error.response.data : axios_error.response, 400, "Error: Agent Notification", "Notification not sent" ) );
        });
    });
};
async function sendNotificationPreorder(req_data){
    
    return new Promise(async (resolve, reject) => {

        let url_api = `/notification/send-pre-order`;
        await axiosAgent.post(url_api, req_data).then( (axios_response) => {
            
            resolve( h_response.request( true, axios_response.data, 200, "Success: Agent Notification", "Send Notification" ) );
        }).catch( (axios_error) => {
            
            reject( h_response.request( false, axios_error.response?.data ? axios_error.response.data : axios_error.response, 400, "Error: Agent Notification", "Notification not sent" ) );
        });
    });
};
async function updateFirstOrder(req_data){
    
    let url_api = `/customer/update-stage-customer/${ req_data.customer_id }`;
    await axiosAgent.put(url_api).then( (axios_response) => {
        
        resolve( h_response.request( true, axios_response.data, 200, "Success: Agent Notification", "First Order update" ) );
    }).catch( (axios_error) => {
        
        reject( h_response.request( false, axios_error.response?.data ? axios_error.response.data : axios_error.response, 400, "Error: Agent Notification", "First Order not update" ) );
    });
}
// =============================================================================
// EXPORTS
// =============================================================================
module.exports = {
    get:{
        listStates,
        listLanguages,
        listCustomerTypes,
        listCategoryProducts,
        listBusinessTypes,
        listInvestRange,
        listCoupons,
        listCouponsByCustomer,
        levelCustomer,
        validDiscounts,
        agentCustomer
    },
    post:{
        createLead,
        convertLeadToCustomer,
        couponApplicable,
        createDraftOrder,
        sendNotificationGeneral,
        sendNotificationPreorder
    },
    put:{
        couponUsed,
        updateLead,
        updateDraftOrder,
        updateFirstOrder
    },
    delete:{
    }
};