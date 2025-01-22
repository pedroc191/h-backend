// =============================================================================
// PACKAGES
// =============================================================================
const express 		= require("express");
const app 			= express.Router();
// =============================================================================
// MIDDLEWARES
// =============================================================================
const auth 				= require("../../middlewares/authentication");
// =============================================================================
// CONTROLLERS
// =============================================================================
const { 
	billingAppController
} = require('../../controllers/main/manager');
// =============================================================================
// ROUTES
// =============================================================================

app.get('/transactions', auth.isAuthFront, billingAppController.get.listTransactions);

app.get('/statement/get-by-customer', auth.isAuthFront, billingAppController.get.statementCustomer);

app.get('/statement/create', auth.isAuthFront, billingAppController.post.createStatement);

app.post('/invoice/insert/by-order', auth.isAuthFront, billingAppController.post.createInvoiceOrder);

app.post('/payment/pay-order', auth.isAuthFront, billingAppController.post.payOrder);

app.get('/document/print/:document_type/:document_id', auth.isAuthFront, billingAppController.get.printDocument);

app.post('/invoice/get-by-orders', auth.isAuthFront, billingAppController.post.listInvoices);

module.exports = app;