const mongoose      = require('mongoose');
const { shopify } = require('../../../config/credentials');

let shippingZoneSchema = mongoose.Schema({
    marketplace         : { type: mongoose.Schema.Types.ObjectId    , default: null, ref: 'back_marketplace' },
    shopify_id          : { type: Number                            , default: null },
    shipping_group      : { type: mongoose.Schema.Types.ObjectId    , default: null, ref: 'back_shipping_group' },
    general_group       : { type: Boolean                           , default: false },
    name                : { type: String                            , default: null },
    handle              : { type: String                            , default: null },
    country_states      : { type: [{
        country_code: { type: String, default: null },
        state_code  : { type: String, default: null },
    }], default: [] },
    country_zip_codes   : { type: [{
        country_code: { type: String, default: null },
        zip_code    : { type: String, default: null },
    }], default: [] },
    standard_rates      : [{ type: mongoose.Schema.Types.ObjectId   , default: null, ref: 'back_shipping_rate' }],
    variant_rates       : [{ type: mongoose.Schema.Types.ObjectId   , default: null, ref: 'back_shipping_rate' }],
    brands              : [{ type: String                           , default: null }],
    product_categories  : [{ type: String                           , default: null }],
    product_types       : [{ type: String                           , default: null }],
    product_variants    : [{ type: Number                           , default: null }],
    
    created_at          : { type: Date                              , default: Date.now },
    updated_at          : { type: Date                              , default: Date.now }, 
    deleted_at          : { type: Date                              , default: null }, 
    deleted             : { type: Boolean                           , default: false },
    status              : { type: String                            , default: 'active' }
});

module.exports = mongoose.model( 'back_shipping_zone', shippingZoneSchema );
