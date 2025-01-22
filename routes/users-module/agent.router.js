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
	agentController
} = require('../../controllers/main/manager');
// =============================================================================
// ROUTES
// =============================================================================

app.post('/charge-targets', upload.single('target_file'), agentController.post.chargeTargets);

app.get('/download-target-file', auth.isAuthAdmin, agentController.get.downloadTargetFile);

app.get('/delete-target-file', auth.isAuthAdmin, agentController.get.deleteTargetFile);

app.post('/list', auth.isAuthAdmin, agentController.post.listDocuments);

app.post('/find', auth.isAuthFront, agentController.post.findDocument);

module.exports = app;
