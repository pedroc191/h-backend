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
	roleController
} = require('../../controllers/main/manager');
// =============================================================================
// ROUTES
// =============================================================================
app.post('/create', roleController.post.createDocument);

app.put('/update', roleController.put.updateDocument);

app.put('/update-status', roleController.put.updateDocumentStatus);

app.delete('/delete', roleController.delete.deleteDocument);

module.exports = app;