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
	navigationController
} = require('../../controllers/main/manager');
// =============================================================================
// ROUTES
// =============================================================================

app.post('/create', navigationController.post.createDocument);

app.get('/find/:id_handle', navigationController.post.findDocument);

app.get('/find-all', navigationController.post.listDocuments);

app.put('/update', navigationController.put.updateDocument);

module.exports = app;