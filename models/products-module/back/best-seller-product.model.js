const mongoose      = require('mongoose');

let bestSellerProductSchema = mongoose.Schema({
    marketplace         : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_marketplace' },
    customer_id         : { type: Number                        , default: null },
    storefront          : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_storefront' },
    affiliate           : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_affiliate' },
    order_origin        : { type: String                        , default: null },
    product_id          : { type: Number                        , default: null }, 
    brand               : { type: {
        name    : { type: String    , default: null },	
        handle  : { type: String    , default: null }
    }, default: null }, 
    product_category    : { type: {
        name    : { type: String    , default: null },	
        handle  : { type: String    , default: null }
    }, default: null }, 
    product_type        : { type: {
        name    : { type: String    , default: null },	
        handle  : { type: String    , default: null }
    }, default: null }, 
    order_quantity      : { type: Number                        , default: 0 },
    refund_quantity     : { type: Number                        , default: 0 },
    total_quantity      : { type: Number                        , default: 0 }, 
    total_amount        : { type: Number                        , default: 0 },
    sort_amount         : { type: Number                        , default: 999999999 },
    sort_quantity       : { type: Number                        , default: 999999999 },
    sort_general        : { type: Number                        , default: 999999999 },
    best_seller_quantty : { type: Boolean                       , default: false },
    best_seller_amount  : { type: Boolean                       , default: false },
    options             : { type: [{
        name            : { type: String, default: null }, 
        handle          : { type: String, default: null }, 
        values          : { type: [{ 
            name                : { type: String    , default: null },	
            handle              : { type: String    , default: null },
            order_quantity      : { type: Number    , default: 0 },
            refund_quantity     : { type: Number    , default: 0 },
            total_quantity      : { type: Number    , default: 0 }, 
            total_amount        : { type: Number    , default: 0 },
            sort_amount         : { type: Number    , default: 999999999 },
            sort_quantity       : { type: Number    , default: 999999999 },
            sort_general        : { type: Number    , default: 999999999 },
            best_seller_quantty : { type: Boolean   , default: false },
            best_seller_amount  : { type: Boolean   , default: false }
        }], default: [] },
    }], default: [] }, 
    variants            : { type: [{
        shopify_id          : { type: Number    , default: null }, 
        sku                 : { type: String    , default: null },
        order_quantity      : { type: Number    , default: 0 },
        refund_quantity     : { type: Number    , default: 0 },
        total_quantity      : { type: Number    , default: 0 }, 
        total_amount        : { type: Number    , default: 0 },
        sort_amount         : { type: Number    , default: 999999999 },
        sort_quantity       : { type: Number    , default: 999999999 },
        sort_general        : { type: Number    , default: 999999999 },
        best_seller_quantty : { type: Boolean   , default: false },
        best_seller_amount  : { type: Boolean   , default: false }
    }], default: [] },
    
    created_at          : { type: Date                          , default: Date.now }, 
    updated_at          : { type: Date                          , default: Date.now }, 
    deleted_at          : { type: Date                          , default: null }, 
    deleted             : { type: Boolean                       , default: false },
    status              : { type: String                        , default: 'active' }
});

module.exports = mongoose.model( 'back_best_seller_product', bestSellerProductSchema );