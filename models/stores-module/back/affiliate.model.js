const mongoose  = require('mongoose');

let affiliateSchema = mongoose.Schema({
    marketplace : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_marketplace' },
    storefront  : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_storefront' },
    customer    : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_customer' },
    code        : { type: String                        , default: null },
    commision   : { type: Number                        , default: 10 },
    discount    : { type: Number                        , default: 20 },
    days_to_pay : { type: Number                        , default: 30 },

    created_at  : { type: Date                          , default: Date.now },
    updated_at  : { type: Date                          , default: Date.now },
    deleted_at  : { type: Date                          , default: null },
    deleted     : { type: Boolean                       , default: false },
    status      : { type: String                        , default: 'active' }
});
module.exports = mongoose.model('back_affiliate', affiliateSchema);