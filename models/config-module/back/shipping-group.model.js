const mongoose      = require('mongoose');

let shippingGroupSchema = mongoose.Schema({
    marketplace         : { type: mongoose.Schema.Types.ObjectId     , default: null, ref: 'back_marketplace' },
    shopify_id          : { type: Number                            , default: null },
    name                : { type: String                            , default: null },
    handle              : { type: String                            , default: null },
    shipping_zones      : [{ type: mongoose.Schema.Types.ObjectId   , default: null, ref: 'back_shipping_zone' }],
    general_group       : { type: Boolean                           , default: false },
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

module.exports = mongoose.model( 'back_shipping_group', shippingGroupSchema );
