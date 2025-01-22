// =============================================================================
// PACKAGES
// =============================================================================
const express 		= require('express');
const app 			= express.Router();
// =============================================================================
// MIDDLEWARES
// =============================================================================
const auth 				= require('../../../middlewares/authentication');
// =============================================================================
// CONTROLLERS
// =============================================================================
const { 
	generalSettingController
} = require('../../../controllers/main/manager');
// =============================================================================
// ROUTES
// =============================================================================

app.get('/find', auth.isAuthFront, generalSettingController.post.findDocuemnt);

app.put('/update', generalSettingController.put.updateDocument);

module.exports = app;