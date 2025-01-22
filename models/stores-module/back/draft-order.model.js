const mongoose      = require('mongoose');

let draftOrderSchema = mongoose.Schema({
    marketplace     : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_marketplace' },
    draft_id        : { type: String                        , default: null },
    order_id        : { type: String                        , default: null },
    customer        : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_customer' },
    coupon          : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'agent_coupon' },
    product_origin  : { type: String                        , default: null }, // cart, cart-later, pre-order-advance, pre-order-complete, pre-order-bundle-advance, pre-order-bundle-complete
    shopify_object  : { type: Object                        , default: null },
    note_attributes : { type: Object                        , default: null },
    bundle_details  : { type: {
        armed : { type: {
            variant_id      : { type: Number, default: null }, 
            total_quantity  : { type: Number, default: 0 }
        }, default: null }, 
        custom  : { type: {
            list            : { type: [{
                variant_id  : { type: Number, default: null }, 
                quantity    : { type: Number, default: 0 }
            }], default: [] }, 
            total_quantity  : { type: Number, default: 0 }
        }, default: { list: [], total_quantity: 0 } }
    } , default: null },
    preorder_details  : { type: [{
        variant_id  : { type: Number, default: null }, 
        quantity    : { type: Number, default: 0 }
    }], default: [] },
    step_order      : { type: String                        , default: null }, // draft-created, processing-order, created-order, order-not-created
    error_db        : { type: Object                        , default: null },
    error_payment   : { type: Object                        , default: null },


    created_at      : { type: Date                          , default: Date.now },
    updated_at      : { type: Date                          , default: Date.now },
    deleted_at      : { type: Date                          , default: null },
    deleted         : { type: Boolean                       , default: false },
    status          : { type: String                        , default: 'active' },
});

module.exports = mongoose.model( 'back_draft_order', draftOrderSchema );