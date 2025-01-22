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
	pageController
} = require('../../controllers/main/manager');
// =============================================================================
// ROUTES
// =============================================================================

app.post('/create', pageController.post.createDocument);

app.get('/find', pageController.post.findDocument);

module.exports = app;