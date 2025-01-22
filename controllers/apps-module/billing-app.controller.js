// =============================================================================
// PACKAGES
// =============================================================================
// =============================================================================
// HELPERS
// =============================================================================
const h_response = require('../../helpers/response.js');
// =============================================================================
// SERVICES
// =============================================================================
const billing  = require('../../services/2b-apps/billing');
// =============================================================================
// REST FUNCTIONS
// =============================================================================
async function createInvoiceOrder(req, res){
    
    await billing.post.createInvoiceOrder(req.body).then( (billing_result) => {
        
        res.status(billing_result.status).json(billing_result);
    }).catch( (billing_error) => {
        
        res.status(billing_error.status).send(billing_error);
    });
};
async function createInvoiceOrderCron(req, res){
    
    await billing.post.createInvoiceOrderCron(req.body).then( (billing_result) => {
        
        res.status(billing_result.status).json(billing_result);
    }).catch( (billing_error) => {
        
        res.status(billing_error.status).send(billing_error);
    });
};
async function statementCustomer(req, res){
    
    let id_customer = req.query.customer ? req.query.customer : null;

    id_customer = id_customer === null && req.auth != null ? req.auth.user.customer._id.toString() : id_customer;

    await billing.get.statementCustomer(id_customer, req.query).then( (billing_result) => {
        
        res.status(billing_result.status).json(billing_result);
    }).catch( (billing_error) => {
        
        res.status(billing_error.status).send(billing_error);
    });
};
async function createStatement(req, res){
    
    await billing.post.createStatement(req.body).then( (billing_result) => {
        
        res.status(billing_result.status).json(billing_result);
    }).catch( (billing_error) => {
        
        res.status(billing_error.status).send(billing_error);
    });
};
async function payOrder(req, res){
    
    await billing.post.payOrder(req.body, req.auth.user.customer._id.toString()).then( (billing_result) => {
            
        res.status(billing_result.status).json(billing_result);
    }).catch( (billing_error) => {
        
        res.status(billing_error.status).send(billing_error);
    });
};
async function listTransactions(req, res) {
    
    await billing.get.listTransactions(req.auth, req.query, req.auth.user.customer._id.toString()).then( (billing_result) => {
        
        billing_result.body = billing_result.body.data;
        res.status(billing_result.status).json(billing_result);
    }).catch( (billing_error) => {
        
        res.status(400).send(billing_error);
    });
};
async function printDocument(req, res) {
    
    await billing.get.printDocument(req.params.document_type, req.params.document_id).then( (billing_result) => {
        
        res.render('print-documents/print-billing-document', { html_document: billing_result.body });
    }).catch( (billing_error) => {
        
        res.status(billing_error.status).send(billing_error);
    });
};
async function listInvoices(req, res){
    
    await billing.post.listInvoices(req.body).then( (billing_result) => {
            
        res.json(billing_result);
    }).catch( (billing_error) => {
        
        res.status(billing_error.status).send(billing_error);
    });
};
// =============================================================================
// GENERAL FUNCTIONS
// =============================================================================
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