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
	applicationController
} = require('../../controllers/main/manager');
// =============================================================================
// ROUTES
// =============================================================================
app.post('/create', applicationController.post.createDocument);

app.put('/update', applicationController.put.updateDocument);

app.put('/update-status', applicationController.put.updateDocumentStatus);

module.exports = app;