// =============================================================================
// PACKAGES
// =============================================================================
const express 			= require('express');
const app 				= express.Router();
const cron 				= require('node-cron');
// =============================================================================
// CONTROLLER
// =============================================================================
const {
    backJobController
} = require('../../controllers/main/manager');

// cron.schedule('50 9 * * *',    jobController.job.customers.syncCreateCustomers); // Shopify

// cron.schedule('45 10 * * *',    jobController.job.customers.addCustomersToAgents); // Data Base

// cron.schedule('55 10 * * *',    jobController.job.products.syncCreateProducts); // Shopify

// cron.schedule('15 11 * * *',   jobController.job.collections.syncCreateCollections); // Shopify

// cron.schedule('20 11 * * *',    jobController.job.products.syncBrands); // Shopify and Data Base

// cron.schedule('53 11 * * *',    jobController.job.orders.syncCreateOrders); // Shopify

// cron.schedule('11 */2 * * *',   jobController.job.products.syncCreateProducts); // Shopify


// cron.schedule('40 11 * * *',  jobController.job.collections.syncUpdateCollections); // Shopify

// cron.schedule('50 11 * * *',   jobController.job.products.syncUpdateProducts); // Shopify

// cron.schedule('32 * * * *',     jobController.job.preorders.verifyStockPreorder); // Data Base

// cron.schedule('07 10 * * *',     jobController.job.customers.syncUpdateCustomers); // Shopify

// cron.schedule('50 * * * *',     jobController.job.orders.syncCustomerToOrders); // Data Base

// cron.schedule('20 12 * * *',     jobController.job.orders.syncUpdateOrders); // Shopify

// cron.schedule('37 00 * * *',    jobController.job.orders.syncBuyAgain); // Data Base

// cron.schedule('40 12 * * *',    jobController.job.products.updateBestSellers); // Data Base

// cron.schedule('50 03 * * *',    jobController.general.test); // Data Base

app.get('/test', async function(req, res){

    let result = await backJobController.job.products.syncUpdateProducts(); // jobController.job.shippings.syncShippingGroups();

    res.json( result );
    //res.render('index.ejs')
});

module.exports = app;