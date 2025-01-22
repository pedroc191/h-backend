// =============================================================================
// PACKAGES
// =============================================================================
const express 		= require('express');
const app 			= express.Router();
const multer      	= require('multer');
const upload      	= multer({ dest: 'temp/' });
// ============================a=================================================
// MIDDLEWARES
// =============================================================================
const auth 				= require('../../middlewares/authentication');
// =============================================================================
// CONTROLLERS
// =============================================================================
const { 
	shippingGroupController
} = require('../../controllers/main/manager');
// =============================================================================
// ROUTES
// =============================================================================

app.get('/list', shippingGroupController.get.list);

app.get('/list-types', shippingGroupController.get.listTypes);

app.get('/list-countries', shippingGroupController.get.listCountries);

app.get('/list-shipping-rates/:group_id', shippingGroupController.get.listShippingRates);

app.post('/save-country-shipping-rates/:group_id/:country_code', shippingGroupController.post.saveCountryShippingRates);

app.post('/charge-shipping-rates', upload.single('rate_file'), shippingGroupController.post.chargeShippingRates);

app.get('/download-rates-file/:group_id', shippingGroupController.get.downloadShippingRateFile);

app.get('/delete-rates-file/:group_id', shippingGroupController.get.deleteShippingRateFile);

module.exports = app;