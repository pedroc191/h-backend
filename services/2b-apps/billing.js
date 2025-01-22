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
const axiosBilling    = axios.create({ 
    baseURL: config_credentials.external_application.billing.url, 
    headers: { 
        authorization: config_credentials.external_application.billing.token 
    } 
});
// =============================================================================
// REST FUNCTIONS
// =============================================================================
async function createInvoiceOrder(req_data){

    return new Promise(async (resolve, reject) => {

        let url_api = "/invoice/insert/by-order";
        await axiosBilling.post(url_api, req_data).then( (axios_response) => {

            resolve( h_response.request( true, axios_response.data, 200, "Success: Invoice Create", "Invoice Created" ) );
        }).catch( (axios_error) => {

            reject( h_response.request( false, axios_error.response?.data ? axios_error.response.data : axios_error.response, 400, "Error: Invoice Create", "Invoice not Created" ) );
        })
    });
};
async function createInvoiceOrderCron(req_data){

    return new Promise(async (resolve, reject) => {

        let url_api = "/invoice/insert-by-order-to-cron";
        await axiosBilling.post(url_api, req_data).then( (axios_response) => {

            resolve( h_response.request( true, axios_response.data, 200, "Success: Invoice Create", "Invoice Created" ) );
        }).catch( (axios_error) => {

            reject( h_response.request( false, axios_error.response?.data ? axios_error.response.data : axios_error.response, 400, "Error: Invoice Create", "Invoice not Created" ) );
        })
    });
};
async function statementCustomer(id_customer, req_query){

    return new Promise(async (resolve, reject) => {

        let url_api = `/statement/get-by-customer/${id_customer}`
        if (req_query.popul){
    
            url_api = `${ url_api }&popul=${ req_query.popul }`;
        }
        await axiosBilling.get(url_api).then( (axios_response) => {

            axios_response.data.customer = {
                _id: id_customer,
                first_order: axios_response.data.customer.first_order,
                valid_moa: axios_response.data.customer.valid_moa
            };
            resolve( h_response.request( true, axios_response.data, 200, "Success: Find Statement", "Statement Found" ) );
        }).catch( (axios_error) => {

            reject( h_response.request( false, axios_error.response?.data ? axios_error.response.data : axios_error.response, 400, "Error: Find Statement", "Statement Not Found" ) );
        });
    });
};
async function createStatement(req_data){

    return new Promise(async (resolve, reject) => {

        let url_api = "/statement/create";
        await axiosBilling.post(url_api, req_data).then( (axios_response) => {

            resolve( h_response.request( true, axios_response.data, 200, "Success: Create Statement", "Statement Created" ) );
        }).catch( (axios_error) => {

            reject( h_response.request( false, axios_error.response?.data ? axios_error.response.data : axios_error.response, 400, "Error: Create Statement", "Statement Not Created" ) );
        });
    });
};
async function payOrder(req_data, customer_id){

    return new Promise(async (resolve, reject) => {

        let url_api = `/payorder/${ customer_id }`;
        await axiosBilling.post(url_api, req_data).then( (axios_response) => {

            resolve( h_response.request( true, axios_response.data, 200, "Success: Payment Process", "Payment Processed" ) );
        }).catch( (axios_error) => {

            reject( h_response.request( false, axios_error.response?.data ? axios_error.response.data : axios_error.response, 400, "Error: Payment Process", "Payment not Processed" ) );
        });
    });
};
async function listTransactions(req_auth, req_query, customer_id) {

    return new Promise(async (resolve, reject) => {

        let url_api = `/transaction/getmany?token=${ req_auth.token }&customer=${ customer_id }`;
        
        url_api = Object.entries(req_query).reduce( (previous_item, [key_param, value_param]) => {
            
            previous_item += `&${key_param}=${value_param}`;
            return previous_item;
        }, url_api);

        await axiosBilling.get(url_api).then( (axios_response) => {
            
            resolve( h_response.request( true, axios_response.data, 200, "Success: List Transactions", "List Transactions found" ) );
        }).catch((axios_error) => {
            
            reject( h_response.request( false, axios_error.response?.data ? axios_error.response.data : axios_error.response, 400, "Error: List Transactions", "List Transactions not Found" ) );
        });
    });
};
async function printDocument(document_type, document_id){
    
    return new Promise(async (resolve, reject) => {

        let url_api = `/document/print/${ document_type }/${ document_id }`;
        await axiosBilling.get(url_api).then( (axios_response) => {
    
            resolve( h_response.request( true, axios_response.data, 200, "Success: Print Document", "Printed Document" ) );
        }).catch((axios_error) => {
            
            reject( h_response.request( false, axios_error.response?.data ? axios_error.response.data : axios_error.response, 400, "Error: Print Document", "Not Printed Document" ) );
        });
    });
};
async function listInvoices(req_data){
    
    return new Promise(async (resolve, reject) => {

        let url_api = `/invoice/get-by-orders`;
        await axiosBilling.post(url_api, req_data).then( (axios_response) => {
    
            resolve( h_response.request( true, axios_response.data, 200, "Success: List Invoices", "List Invoices found" ) );
        }).catch((axios_error) => {
            
            reject( h_response.request( false, axios_error.response?.data ? axios_error.response.data : axios_error.response, 400, "Error: List Invoices", "List Invoices not Found" ) );
        });
    });
};
// =============================================================================
// EXPORTS
// =============================================================================
module.exports = {
    get:{
        statementCustomer,
        listTransactions,
        printDocument
    },
    post:{
        createInvoiceOrder,
        createInvoiceOrderCron,
        payOrder,
        listInvoices,
        createStatement
    },
    put:{
    },
    delete:{
    }
};