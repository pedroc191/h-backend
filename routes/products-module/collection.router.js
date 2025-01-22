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
	collectionController
} = require('../../controllers/main/manager');
// =============================================================================
// ROUTES
// =============================================================================

app.post('/:id_handle', auth.isAuthFront, collectionController.post.storeCollectionProducts);

app.get('/sitemaps', collectionController.get.sitemaps);

app.get('/products/sitemaps', collectionController.get.productSitemaps);

module.exports = app;