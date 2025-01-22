const mongoose      = require('mongoose');

const invoiceSchema = mongoose.Schema({
    business            : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'billing_business' },
    customer            : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_customer' },
    order               : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_order' }, //puede estar o no
    coupon_id           : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'agent_coupon' },
    id_migration        : { type: String                        , default: null },
    draft_id            : { type: String                        , default: null },
    date                : { type: Date                          , default: Date.now },
    reference           : { type: String                        , default: null }, // numero de orden o referencia de factura(custom)
    method              : { type: String                        , default: 'automatic', enum: { values: ['automatic', 'manual'] } },
    address             : { type: Object                        , default: null },
    test                : { type: Boolean                       , default: false},
    number              : { type: Number                        , default: 0 },
    total_amount        : { type: Number                        , default: 0 },
    paid                : { type: Boolean                       , default: false },
    voided              : { type: Boolean                       , default: false },
    printed             : { type: Boolean                       , default: false },
    status_document     : { type: Number                        , default: 0 }, // 0= Pending, 1=Paid, 2= Partially Paid, 3=Cancelled
    status_name         : { type: String                        , default: 'Pending', enum: { values: ['Pending', 'Paid', 'Partially Paid', 'Cancelled'] } },
    
    note                : { type: String                        , default: null },
    line_items          : { type: Array                         , default: [] },
    shipping            : { type: Number                        , default: 0},
    tax                 : { type: Number                        , default: 0},

    discount_invoice    : { type: Object                        , default: null },
    total_discounts     : { type: Number                        , default: 0 },
    origin_migration    : { type: Boolean                       , default: false },
    data_origin         : { type: Object                        , default: null },

    created_at          : { type: Date                          , default: Date.now },
    updated_at          : { type: Date                          , default: Date.now },
    deleted_at          : { type: Date                          , default: null }, 
    deleted             : { type: Boolean                       , default: false },
    status              : { type: String                        , default: 'active' },
});

module.exports = mongoose.model( 'billing_invoice', invoiceSchema );
