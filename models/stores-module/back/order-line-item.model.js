const mongoose = require('mongoose');

let orderLineItemSchema = mongoose.Schema({
    marketplace             : { type: mongoose.Schema.Types.ObjectId, default: null,  ref: 'back_marketplace' },
    storefront              : { type: mongoose.Schema.Types.ObjectId, default: null,  ref: 'back_storefront' },
    shopify_id              : { type: Number                        , default: null },
    order_id                : { type: Number                        , default: null },
    customer_id             : { type: Number                        , default: null },
    product_id              : { type: Number                        , default: null },
    variant_id              : { type: Number                        , default: null },
    origin                  : { type: String                        , default: 'wholesale' },
    name                    : { type: String                        , default: null },
    variant_title           : { type: String                        , default: null },
    title                   : { type: String                        , default: null },
    sku                     : { type: String                        , default: null },
    brand                   : { type: {
        name    : { type: String , default: null },
        handle  : { type: String , default: null },
    }, default: null },
    quantity                : { type: Number                        , default: 0 },
    price                   : { type: Number                        , default: 0 },
    currency_code           : { type: String                        , default: null },
    total_discount          : { type: Number                        , default: 0 },
    total_taxes             : { type: Number                        , default: 0 },
    discounts               : { type: [{
        discount_code       : { type: String, default: null },
        description         : { type: String, default: null },
        line_item_id        : { type: Number, default: null },
        type_discount       : { type: String, default: null },
        target_type         : { type: String, default: null },
        value_type          : { type: String, default: null },
        allocation_method   : { type: String, default: null },
        target_selection    : { type: String, default: null },
        value               : { type: Number, default: 0 },
        amount              : { type: Number, default: null }
    }], default: [] },
    tax_lines               : { type: [{
        price   : { type: Number, default: 0 },
        rate    : { type: Number, default: 0 },
        title   : { type: String, default: null }
    }], default: [] },
    taxable                 : { type: Boolean                       , default: false },
    grams                   : { type: Number                        , default: 0 },
    origin_location         : { type: {
        shopify_id      : { type: Number, default: null }, 
        country_code    : { type: String, default: null }, 
        state_code      : { type: String, default: null }, 
        name            : { type: String, default: null }, 
        address_1       : { type: String, default: null }, 
        address_2       : { type: String, default: null }, 
        city            : { type: String, default: null }, 
        zip             : { type: String, default: null }
    }, default: null },
    requires_shipping       : { type: Boolean                       , default: true },
    fulfillable_quantity    : { type: Number                        , default: 0 },
    fulfillment_service     : { type: String                        , default: null },
    fulfillment_status      : { type: String                        , default: null },
    financial_status        : { type: String                        , default: null },
    refunded                : { type: [{ 
        shopify_id  : { type: Number, default: null }, 
        line_item_id: { type: Number, default: null }, 
        quantity    : { type: Number, default: null },
        created_at  : { type: Date  , default: Date.now } 
    }], default: [] },

    created_at              : { type: Date                          , default: Date.now },
    updated_at              : { type: Date                          , default: Date.now },
    deleted_at              : { type: Date                          , default: null },
    deleted                 : { type: Boolean                       , default: false },
    status                  : { type: String                        , default: 'active' },
});

module.exports = mongoose.model( 'back_order_line_item', orderLineItemSchema );
