const mongoose  = require('mongoose');

let preorderItemSchema = mongoose.Schema({
    marketplace : { type: mongoose.Schema.Types.ObjectId, default: null,  ref: 'back_marketplace' },
    customer_id : { type: Number                        , default: null },
    name        : { type: String                        , default: null },
    number      : { type: Number                        , default: null },
    order_origin: { type: String                        , default: 'wholesale' },
    bundle_type : { type: String                        , default: null }, // armed, custom
    product_id  : { type: Number                        , default: null },
    variant_id  : { type: Number                        , default: null },
    sku         : { type: String                        , default: null },
    quantity    : { type: Number                        , default: 0 },

    life_stage  : { type: String                        , default: 'open' }, //open, pending, closed, canceled, ordered
    order_name  : { type: String                        , default: null },

    created_at  : { type: Date                          , default: Date.now },
    updated_at  : { type: Date                          , default: Date.now },
    deleted_at  : { type: Date                          , default: null },
    deleted     : { type: Boolean                       , default: false },
    status      : { type: String                        , default: 'active' },
});

module.exports = mongoose.model( 'back_preorder_item', preorderItemSchema );