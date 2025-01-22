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
	customerController,
	orderController
} = require('../../controllers/main/manager');
// =============================================================================
// ROUTES
// =============================================================================

app.post('/find', auth.isAuthFront, customerController.post.find);

app.get('/list', auth.isAuthAdmin, customerController.get.list);

app.post('/create', auth.isAuthAdmin, customerController.post.create);

app.put('/update', auth.isAuthAdmin, customerController.put.update);

app.post('/by-agent', auth.isAuthAdmin, customerController.post.listByAgent);

app.post('/orders', auth.isAuthAdmin, orderController.post.list);

app.post('/admin/create', auth.isAuthAdmin, customerController.post.createAdmin);

app.post('/valid-email', customerController.post.validEmail);

app.post('/add-profile-image', auth.isAuthFront, upload.single('profile_image'), customerController.post.addProfileImage);

app.post('/address/list', auth.isAuthFront, customerController.get.listAddresses);

app.put('/address/save', auth.isAuthFront, customerController.put.saveAddress);

app.put('/address/delete', auth.isAuthFront, customerController.delete.deleteAddress);

app.get('/agent', auth.isAuthFront, customerController.get.findAgent);

app.get('/redirect-payment-page', customerController.get.redirectPaymentCustomer);

module.exports = app;