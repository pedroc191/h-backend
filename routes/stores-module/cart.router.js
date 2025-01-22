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
	cartController
} = require('../../controllers/main/manager');
// =============================================================================
// ROUTES
// =============================================================================

app.post('/products', auth.isAuthFront, cartController.post.products);

app.post('/products-nav', auth.isAuthFront, cartController.post.productsNav);

app.put('/add', auth.isAuthFront, cartController.put.addProductCart);

app.put('/add-nav', auth.isAuthFront, cartController.put.addProductCartNav);

app.put('/update-product', auth.isAuthFront, cartController.put.updateProduct);

app.put('/update-product-nav', auth.isAuthFront, cartController.put.updateProductNav);

app.put('/remove', auth.isAuthFront, cartController.put.removeProductCart);

app.put('/remove-nav', auth.isAuthFront, cartController.put.removeProductCartNav);

app.put('/add-save-later', auth.isAuthFront, cartController.put.addSaveLater);

app.put('/update-save-later', auth.isAuthFront, cartController.put.updateSaveLater);

app.put('/remove-save-later', auth.isAuthFront, cartController.put.removeSaveLater);

app.put('/delete-save-later', auth.isAuthFront, cartController.put.deleteSaveLater);

app.post('/charge-products', auth.isAuthFront, upload.single('cart_file'), cartController.post.chargeProducts);

app.put('/add-coupon-code', auth.isAuthFront, cartController.put.addCouponCode);

app.get('/download-cart-file', auth.isAuthFront, cartController.get.downloadCartFile);

app.post('/delete-cart-file', auth.isAuthFront, cartController.post.deleteCartFile);

app.post('/list-add-best-sellers', auth.isAuthFront, cartController.post.listAddBestSellers);

app.post('/advance-preorder', auth.isAuthFront, cartController.post.advancePreorder);

app.post('/complete-preorder', auth.isAuthFront, cartController.post.completePreorder);

app.post('/checkout-order', auth.isAuthFront, cartController.post.checkoutOrder);

module.exports = app;
