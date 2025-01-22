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
	discountController
} = require('../../controllers/main/manager');
// =============================================================================
// ROUTES
// =============================================================================

app.get('/download-discount-file', auth.isAuthAdmin, discountController.get.downloadDiscountFile);

app.get('/delete-discount-file', auth.isAuthAdmin, discountController.get.deleteDiscountFile);

module.exports = app;
