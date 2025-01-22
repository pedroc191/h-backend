// =============================================================================
// PACKAGES
// =============================================================================
const express 		= require("express");
const app 			= express.Router();
const multer      	= require('multer');
const upload      	= multer({ dest: 'temp/' });
// =============================================================================
// MIDDLEWARES
// =============================================================================
const auth 				= require("../../middlewares/authentication");
// =============================================================================
// CONTROLLERS
// =============================================================================
const { 
	agentAppController
} = require('../../controllers/main/manager');
// =============================================================================
// ROUTES
// =============================================================================

app.get('/level/level-customer', auth.isAuthFront, agentAppController.get.levelCustomer);

app.get('/category/product/getmany', auth.isAuthFront, agentAppController.get.listCategoryProducts);

app.get('/customertype/getmany', auth.isAuthFront, agentAppController.get.listCustomerTypes);

app.get('/language/getmany', auth.isAuthFront, agentAppController.get.listLanguages);

app.get('/state/getmany', auth.isAuthFront, agentAppController.get.listStates);

app.get('/business-type/getmany', auth.isAuthFront, agentAppController.get.listBusinessTypes);

app.get('/invest-range/getmany', auth.isAuthFront, agentAppController.get.listInvestRange);

app.get('/user/get-by-customer', auth.isAuthFront, agentAppController.get.agentCustomer);

app.post('/lead/create',  agentAppController.post.createLead);

app.put('/lead/update',  agentAppController.put.updateLead);

app.get('/coupon/names', auth.isAuthFront, agentAppController.get.listCoupons);

app.get('/coupon/get-by-customer', auth.isAuthFront, agentAppController.get.listCouponsByCustomer);

app.post('/coupon/applicable', auth.isAuthFront, agentAppController.post.couponApplicable);

app.put('/coupon/used', auth.isAuthFront, agentAppController.put.couponUsed);

app.post('/agent/add-profile-image', auth.isAuthAdmin, upload.single('profile_image'), agentAppController.post.addProfileImage);

app.post('/level/add-level-image', auth.isAuthAdmin, upload.single('level_image'), agentAppController.post.addLevelImage);

module.exports = app;