const mongoose = require('mongoose');

let storefrontTransactionSchema = mongoose.Schema({
    marketplace         : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_marketplace' },
    storefront          : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_storefront' },
    affiliate           : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_affiliate' },
    customer_id         : { type: Number                        , default: null },
    order_id            : { type: Number                        , default: null },
    line_item_id        : { type: Number                        , default: null },
    category            : { type: String                        , default: null }, // item-order-storefront, closing-month-storefront, storefront-adjustment, item-order-affiliate, closing-month-affiliate, affiliate-adjustment
    line_item_details   : { type: {
        brand           : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_brand' },
        quantity        : { type: Number                        , default: 0 },
        total_order     : { type: Number                        , default: 0 },
        total_discount  : { type: Number                        , default: 0 },
        total_taxes     : { type: Number                        , default: 0 },
        total_commission: { type: Number                        , default: 0 },
        total_store_fee : { type: Number                        , default: 0 },
        created_at      : { type: Date                          , default: Date.now }
    }, default: null },
    refund_details      : { type: [{
        brand           : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_brand' },
        quantity        : { type: Number                        , default: 0 },
        total_refund    : { type: Number                        , default: 0 },
        total_discount  : { type: Number                        , default: 0 },
        total_taxes     : { type: Number                        , default: 0 },
        total_commission: { type: Number                        , default: 0 },
        total_store_fee : { type: Number                        , default: 0 },
        created_at      : { type: Date                          , default: Date.now }
    }], default: null },
    shipping_details    : { type: {
        total_shipping  : { type: Number, default: 0 },
        total_discount  : { type: Number, default: 0 },
        total_taxes     : { type: Number, default: 0 },
        total_commission: { type: Number, default: 0 },
        total_store_fee : { type: Number, default: 0 },
        created_at      : { type: Date  , default: Date.now }
    }, default: null },
    general_details     : { type: {
        total_amount    : { type: Number, default: 0 },
        total_discount  : { type: Number, default: 0 },
        total_taxes     : { type: Number, default: 0 },
        total_commission: { type: Number, default: 0 },
        total_store_fee : { type: Number, default: 0 },
        created_at      : { type: Date  , default: Date.now }
    }, default: null },
    
    created_at          : { type: Date                          , default: Date.now },
    updated_at          : { type: Date                          , default: Date.now },
    deleted_at          : { type: Date                          , default: null },
    deleted             : { type: Boolean                       , default: false },
    status              : { type: String                        , default: 'active' }
});
module.exports = mongoose.model( 'back_storefront_transaction', storefrontTransactionSchema );