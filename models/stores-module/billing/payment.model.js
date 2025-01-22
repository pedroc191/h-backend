const mongoose = require('mongoose');

const paymentSchema = mongoose.Schema({
    id_migration        : { type: String                        , default: null },
    business            : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'billing_Business' },
    customer            : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_Customer' },
    date                : { type: Date                          , default: Date.now },
    voided              : { type: Boolean                       , default: false },
    printed             : { type: Boolean                       , default: false },
    reference           : { type: String                        , default: null },
    number              : { type: Number                        , default: null },
    total_amount        : { type: Number                        , default: null },
    test                : { type: Boolean                       , default: false},
    method              : { type: String                        , default: null, enum: { values: ['automatic', 'manual']                        , default: 'automatic' } },
    operation_type      : { type: String                        , default: null },
    note                : { type: String                        , default: null },
    order_shopify       : { type: String                        , default: null },
    order_name          : { type: String                        , default: null },
    payment_type        : { type: String                        , default: null },
    customer_shopify_id : { type: String                        , default: null },
    draft               : { type: String                        , default: null }, // draft id order shopify
    paypal_invoice      : { type: String                        , default: null }, // invoiceNumber
    project_orign       : { type: String                        , default: 'catalog store' },
    origin_migration    : { type: Boolean                       , default: false },

    created_at          : { type: Date                          , default: Date.now },
    updated_at          : { type: Date                          , default: Date.now }, 
    deleted_at          : { type: Date                          , default: null }, 
    deleted             : { type: Boolean                       , default: false },
    status              : { type: String                        , default: 'active' },
});

module.exports = mongoose.model('billing_Payment', paymentSchema);