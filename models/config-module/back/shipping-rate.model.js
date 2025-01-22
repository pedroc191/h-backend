const mongoose      = require('mongoose');

let shippingRateSchema = mongoose.Schema({
    marketplace     : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_marketplace' },
    shopify_id      : { type: Number                        , default: null },
    shipping_group  : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_shipping_group' },
    shipping_zone   : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_shipping_zone' },
    shipping_type   : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_shipping_type' },
    rate_type       : { type: String                        , default: 'standard', enum: ['standard', 'variant'] },
    price           : { type: Number                        , default: 0 },
    min_weight      : { type: Number                        , default: 0 },
    min_total_order : { type: Number                        , default: 0 },
    effect_on_price : { type: String                        , default: 'replace', enum: ['replace', 'add', 'subtract'] },
    need_payment    : { type: Boolean                       , default: true },

    created_at      : { type: Date                          , default: Date.now },
    updated_at      : { type: Date                          , default: Date.now }, 
    deleted_at      : { type: Date                          , default: null }, 
    deleted         : { type: Boolean                       , default: false },
    status          : { type: String                        , default: 'active' }
});

module.exports = mongoose.model( 'back_shipping_rate', shippingRateSchema );
