// =============================================================================
// PACKAGES
// =============================================================================
const express 		= require('express');
const app 			= express.Router();
// =============================================================================
// MIDDLEWARES
// =============================================================================
const auth 				= require('../../middlewares/authentication');
// =============================================================================
// CONTROLLERS
// =============================================================================
const { 
	affiliateController
} = require('../../controllers/main/manager');
// =============================================================================
// ROUTES
// =============================================================================

app.post('/find', auth.isAuthFront, affiliateController.post.findDocument);

app.post('/list', auth.isAuthFront, affiliateController.post.listDocuments);

app.post('/create', auth.isAuthFront, affiliateController.post.createDocument);

app.put('/update', auth.isAuthFront, affiliateController.put.updateDocument);

app.post('/disabled', auth.isAuthFront, affiliateController.put.disabledDocument);

module.exports = app;
