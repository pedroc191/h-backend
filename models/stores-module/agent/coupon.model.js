const mongoose = require('mongoose');

let couponSchema = mongoose.Schema({
    name            : { type: String                            , default: null, required: true },
    typeCoupon      : { type: String                            , default: 'percentage', enum: { values: [ 'percentage', 'fixed amount', 'free shipping' ], message: '{VALUE} is not supported' }, required: true },
    fixedMount      : { type: Number                            , default: null }, // fixed amount,
    discount        : { type: Number                            , default: null, min: 0, max: 100 }, // percentage
    productFree     : [{ type: mongoose.Schema.Types.ObjectId   , default: null, ref: 'back_product_variant' }],
    minRequirement  : { type: {
        type    : { type: String, default: 'none', enum: { values: ['none', 'min_purchase_amount', 'min_quantities_item'] } },
        value   : { type: Number, default: null }
    } },
    applyFor        : { type: String                            , default: 'all', enum: { values: ['all', 'specific'], message: '{VALUE} is not supported' }, required: true },
    applyEligibility: {
        type: { type: String, default: 'all_brand', enum: { values: ['all_brand', 'specific_brand', 'specific_product'], message: '{VALUE} is not supported' }, required: true },
        brand: [{ type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_brand' }],
        product: [{ type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_product_variant' }]
    },
    customers       : [{ type: {
        customerId  : { type: mongoose.Schema.Types.ObjectId    , default: null, ref: 'back_customer' },
        usedTimes   : { type: Number                            , default: 0 },
        usedDate    : { type: Date                              , default: null },
        active      : { type: Boolean                           , default: false },
    }, default: null }],
    limitTimes      : { type: Number                            , default: 1, min: 1, required: true },
    usedTimes       : { type: Number                            , default: 0, required: true },
    limitDate       : { type: Boolean                           , default: false },
    activeDate      : { type: Date                              , default: null },
    expireDate      : { type: Date                              , default: null },
    
    created_at      : { type: Date                              , default: Date.now },
    updated_at      : { type: Date                              , default: Date.now },
    deleted_at      : { type: Date                              , default: null },
    deleted         : { type: Boolean                           , default: false },
    status          : { type: String                            , default: 'active' },
});

module.exports = mongoose.model( 'agent_coupon', couponSchema );