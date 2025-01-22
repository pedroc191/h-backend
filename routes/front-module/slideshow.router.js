// =============================================================================
// PACKAGES
// =============================================================================
const express 		= require('express');
const app 			= express.Router();
const multer      	= require('multer');
const upload      	= multer({ dest: 'temp/' });
// =============================================================================
// MIDDLEWARES
// =============================================================================
const auth 				= require('../../middlewares/authentication');
// =============================================================================
// CONTROLLERS
// =============================================================================
const { 
	slideshowController
} = require('../../controllers/main/manager');
// =============================================================================
// ROUTES
// =============================================================================

app.post('/create', slideshowController.post.createDocument);

app.get('/find/:id_handle', slideshowController.post.findDocument);

app.get('/find-all', slideshowController.post.listDocuments);

app.put('/update', slideshowController.put.updateDocument);

module.exports = app;