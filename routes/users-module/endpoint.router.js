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
	endpointController
} = require('../../controllers/main/manager');
// =============================================================================
// ROUTES
// =============================================================================
app.post('/create', endpointController.post.createDocument);

app.put('/update', endpointController.put.updateDocument);

app.put('/update-status', endpointController.put.updateDocumentStatus);

module.exports = app;