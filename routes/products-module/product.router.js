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
	productController
} = require('../../controllers/main/manager');
// =============================================================================
// ROUTES
// =============================================================================

app.post('/:id_handle/details', auth.isAuthFront, productController.post.findDocument);

app.post('/:id_handle/variants', auth.isAuthFront, productController.post.productVariants);

app.get('/sale-random-details', auth.isAuthFront, productController.get.saleRandomDetails);

app.post('/quick-search', auth.isAuthFront, productController.post.storeSearchProducts);

app.post('/recently-viewed', auth.isAuthFront, productController.post.productRecentlyViewed);

app.get('/download-price-catalog-file', auth.isAuthAdmin, productController.get.downloadPriceCatalogFile);

app.get('/delete-price-catalog-file', auth.isAuthAdmin, productController.get.deletePriceCatalogFile);

app.get('/sitemaps', productController.get.sitemaps);

app.get('/list', auth.isAuthAdmin, productController.post.listDocuments);

app.get('/reports/download/shopify-products-low-stock', auth.isAuthAdmin, productController.get.downloadProductsLowStockFile);

module.exports = app;