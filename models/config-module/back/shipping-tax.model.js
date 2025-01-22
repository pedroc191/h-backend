const mongoose      = require('mongoose');

let shippingTaxSchema = mongoose.Schema({
    marketplace         : { type: mongoose.Schema.Types.ObjectId    , default: null, ref: 'back_marketplace' },
    country_code        : { type: String                            , default: null },
    state_code          : { type: String                            , default: null },
    brands              : [{ type: mongoose.Schema.Types.ObjectId   , default: null, ref: 'back_brand' }],
    product_categories  : [{ type: mongoose.Schema.Types.ObjectId   , default: null, ref: 'back_product_category' }],
    product_types       : [{ type: mongoose.Schema.Types.ObjectId   , default: null, ref: 'back_product_type' }],
    product_variants    : [{ type: mongoose.Schema.Types.ObjectId   , default: null, ref: 'back_product_variant' }],
    name                : { type: String                            , default: null },
    handle              : { type: String                            , default: null },
    type_tax            : { type: String                            , default: 'normal' },
    percentage          : { type: Number                            , default: null },
    
    created_at          : { type: Date                              , default: Date.now },
    updated_at          : { type: Date                              , default: Date.now }, 
    deleted_at          : { type: Date                              , default: null }, 
    deleted             : { type: Boolean                           , default: false },
    status              : { type: String                            , default: 'active' }
});

module.exports = mongoose.model( 'back_shipping_tax', shippingTaxSchema );
