// =============================================================================
// PACKAGES
// =============================================================================
const express 		= require('express');
const app 			= express.Router();
// ============================a=================================================
// MIDDLEWARES
// =============================================================================
const auth 				= require('../../middlewares/authentication');
// =============================================================================
// CONTROLLERS
// =============================================================================
const { 
	orderController
} = require('../../controllers/main/manager');
// =============================================================================
// ROUTES
// =============================================================================

app.post('/find/:id_name', auth.isAuthFront, orderController.post.find);

app.post('/list', auth.isAuthAdmin, orderController.post.list);

app.post('/shipping-options', auth.isAuthFront, orderController.post.shippingOptions);

app.post('/valid-checkout', auth.isAuthFront, orderController.post.validCheckout);

app.post('/create', auth.isAuthFront, orderController.post.create);

app.post('/create/dropshipping', auth.isAuthAdmin, orderController.post.createDBOrderDropshipping);

app.post('/create/draft/agent', auth.isAuthAdmin, orderController.post.completeDraftOrderShopify);

app.post('/create/draft/shopify', auth.isAuthFront, orderController.post.createDraftOrder);

app.post('/complete/draft/shopify', auth.isAuthAdmin, orderController.post.completeDraftOrderShopify);

app.post('/create/shopify', orderController.post.createDBOrderShopify);

app.put('/update/:id/invoice-items', auth.isAuthAdmin, orderController.put.updateInvoiceItems);

app.get('/transactions/download-file', auth.isAuthAdmin, orderController.get.downloadTransactionFile);

app.post('/transactions/delete-file', auth.isAuthAdmin, orderController.post.deleteTransactionFile);

module.exports = app;