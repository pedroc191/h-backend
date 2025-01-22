const mongoose      = require('mongoose');

let cartSchema = mongoose.Schema({
    marketplace : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_marketplace' },
    user        : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_user' },
    customer    : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_customer' },
    coupon      : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'agent_coupon' },
    affiliate   : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_affiliate' },
    products    : { type: Object                        , default: [] },
    save_later  : { type: Object                        , default: [] },
    wishlist    : { type: Object                        , default: [] },

    created_at  : { type: Date                          , default: Date.now },
    updated_at  : { type: Date                          , default: Date.now },
    deleted_at  : { type: Date                          , default: null },
    deleted     : { type: Boolean                       , default: false },
    status      : { type: String                        , default: 'active' },
});

module.exports = mongoose.model( 'back_cart', cartSchema );
