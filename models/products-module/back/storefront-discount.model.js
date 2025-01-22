const mongoose  = require('mongoose');

let storeSchema = mongoose.Schema({
    marketplace     : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_marketplace' },
    storefront      : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_storefront' },
    brand           : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_brand' },
    product_variant : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_product_variant' },
    discount_type   : { type: String                        , default: 'percentage' },
    value           : { type: Number                        , default: 0 },
    discount_code   : { type: String                        , default: null },
    number_uses     : { type: Number                        , default: 0 },
    started_at      : { type: Date                          , default: null },
    ended_at        : { type: Date                          , default: null },

    created_at      : { type: Date                          , default: Date.now },
    updated_at      : { type: Date                          , default: Date.now },
    deleted_at      : { type: Date                          , default: null },
    deleted         : { type: Boolean                       , default: false },
    status          : { type: String                        , default: 'active' }
});
module.exports = mongoose.model('back_store', storeSchema);