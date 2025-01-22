const mongoose      = require('mongoose');

let bestSellerSchema = mongoose.Schema({
    marketplace         : { type: mongoose.Schema.Types.ObjectId    , default: null, ref: 'back_marketplace' },
    customer_id         : { type: Number                            , default: null },
    storefront          : { type: mongoose.Schema.Types.ObjectId    , default: null, ref: 'back_storefront' },
    affiliate           : { type: mongoose.Schema.Types.ObjectId    , default: null, ref: 'back_affiliate' },
    order_origin        : { type: String                            , default: null },
    range_months        : { type: Number                            , default: 3 },	
    percentage_variant  : { type: Number                            , default: 80 },
    percentage_product  : { type: Number                            , default: 80 },
    total_quantity      : { type: Number                            , default: 0 },
    order_quantity      : { type: Number                            , default: 0 },
    refund_quantity     : { type: Number                            , default: 0 },
    total_amount        : { type: Number                            , default: 0 },
    products            : [{ type: mongoose.Schema.Types.ObjectId   , default: null, ref: 'back_best_seller_product' }],
    selected_filters    : [{ type: mongoose.Schema.Types.ObjectId   , default: null, ref: 'back_general_filter' }],  
    filter_values       : { type: {
        brands              : [{ type: String, default: null }],
        product_categories  : [{ type: String, default: null }],
        tags                : [{ type: String, default: null }],
        product_options     : { type: [{
            handle  : { type: String, default: null },
            values  : [{ type: String, default: null }]
        }], default: null },
        prices: { type: {
            min_price: { type: Number, default: null },
            max_price: { type: Number, default: null }
        }, default: null },
    }, default: { brands: [], product_categories: [], tags: [], product_options: [], prices: { min_price: null, max_price: null } } },
    
    created_at          : { type: Date                              , default: Date.now }, 
    updated_at          : { type: Date                              , default: Date.now }, 
    deleted_at          : { type: Date                              , default: null }, 
    deleted             : { type: Boolean                           , default: false },
    status              : { type: String                            , default: 'active' }
});

module.exports = mongoose.model( 'back_best_seller', bestSellerSchema );