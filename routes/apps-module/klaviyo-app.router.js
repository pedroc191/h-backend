// =============================================================================
// PACKAGES
// =============================================================================
const express 		= require("express");
const app 			= express.Router();
// =============================================================================
// MIDDLEWARES
// =============================================================================
const auth 				= require("../../middlewares/authentication");
// =============================================================================
// CONTROLLERS
// =============================================================================
const { 
	klaviyoAppController
} = require('../../controllers/main/manager');
// =============================================================================
// ROUTES
// =============================================================================

app.post('/create-profile', auth.isAuthAdmin, klaviyoAppController.post.createProfile);

app.put('/update-profile', auth.isAuthAdmin, klaviyoAppController.put.updateProfile);

module.exports = app;