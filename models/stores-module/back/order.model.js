const mongoose      = require('mongoose');

let orderSchema = mongoose.Schema({
    marketplace             : { type: mongoose.Schema.Types.ObjectId    , default: null, ref: 'back_marketplace' },
    customer                : { type: mongoose.Schema.Types.ObjectId    , default: null, ref: 'back_customer' },
    coupon                  : { type: mongoose.Schema.Types.ObjectId    , default: null, ref: 'agent_coupon' },
    business                : { type: mongoose.Schema.Types.ObjectId    , default: null, ref: 'billing_business' },
    storefront              : { type: mongoose.Schema.Types.ObjectId    , default: null, ref: 'back_storefront' },
    affiliate               : { type: mongoose.Schema.Types.ObjectId    , default: null, ref: 'back_affiliate' },
    shopify_id              : { type: Number                            , default: null },
    customer_id             : { type: Number                            , default: null },
    origin                  : { type: String                            , default: 'wholesale' },
    name                    : { type: String                            , default: null },
    number                  : { type: Number                            , default: null },
    order_number            : { type: Number                            , default: null },
    tags                    : { type: [{
        name    : { type: String, default: null },
        handle  : { type: String, default: null }
    }], default: [] },
    token                   : { type: String                            , default: null },
    currency                : { type: String                            , default: null },
    line_items              : [{ type: mongoose.Schema.Types.ObjectId   , default: null, ref: 'back_order_line_item' }],
    discounts               : { type: [{
        line_item_id        : { type: Number, default: null },
        discount_code       : { type: String, default: null },
        description         : { type: String, default: null },
        type_discount       : { type: String, default: null },
        value_type          : { type: String, default: null },
        target_type         : { type: String, default: null },
        target_selection    : { type: String, default: null },
        allocation_method   : { type: String, default: null },
        value               : { type: Number, default: 0 },
        amount              : { type: Number, default: 0 }
    }], default: [] },
    skus                    : [{ type: String                           , default: null }],
    brands                  : { type: [{
        name    : { type: String, default: null },
        handle  : { type: String, default: null }
    }], default: [] },
    variants                : [{ type: String                           , default: null }],
    taxes_included          : { type: Boolean                           , default: false },
    tax_lines               : { type: [{
        price   : { type: Number, default: 0 },
        rate    : { type: Number, default: 0 },
        title   : { type: String, default: null }
    }], default: [] },
    subtotal_price          : { type: Number                            , default: 0 },
    total_discounts         : { type: Number                            , default: 0 },
    total_line_items_price  : { type: Number                            , default: 0 },
    total_outstanding       : { type: Number                            , default: 0 },
    total_price             : { type: Number                            , default: 0 },
    subtotal_shipping_price : { type: Number                            , default: 0 },
    total_shipping_price    : { type: Number                            , default: 0 },
    total_tax               : { type: Number                            , default: 0 },
    checkout_id             : { type: Number                            , default: null },
    checkout_token          : { type: String                            , default: null },
    payment_details         : { type: {
        amount              : { type: Number, default: 0 },
        currency            : { type: String, default: null },
        payment_terms_name  : { type: String, default: null },
        payment_terms_type  : { type: String, default: null },
        due_in_days         : { type: Number, default: 0 },
        payment_schedules   : { type: [{
            amount                  : { type: Number, default: 0 },
            currency                : { type: String, default: null },
            issued_at               : { type: Date  , default: null },
            due_at                  : { type: Date  , default: null },
            completed_at            : { type: Date  , default: null },
            expected_payment_method : { type: String, default: null },
        }], default: [] },
    }, default: null },
    total_weight            : { type: Number                            , default: 0 },
    billing_address         : { type: {
        first_name  : { type: String, default: null },
        last_name   : { type: String, default: null },
        phone       : { type: {
            country_code: { type: String, default: null },
            code        : { type: String, default: null },
            number      : { type: String, default: null },
            format      : { type: String, default: null }
        }, default: null },
        company     : { type: String, default: null },
        address_1   : { type: String, default: null },
        address_2   : { type: String, default: null },
        country     : { type: String, default: null },
        country_code: { type: String, default: null },
        state       : { type: String, default: null },
        state_code  : { type: String, default: null },
        city        : { type: String, default: null },
        zip         : { type: String, default: null },
        latitude    : { type: Number, default: null },
        longitude   : { type: Number, default: null }
    }, default: null },
    shipping_address        : { type: {
        first_name  : { type: String, default: null },
        last_name   : { type: String, default: null },
        phone       : { type: {
            country_code: { type: String, default: null },
            code        : { type: String, default: null },
            number      : { type: String, default: null },
            format      : { type: String, default: null }
        }, default: null }, 
        company     : { type: String, default: null },
        address_1   : { type: String, default: null },
        address_2   : { type: String, default: null },
        country     : { type: String, default: null },
        country_code: { type: String, default: null },
        state       : { type: String, default: null },
        state_code  : { type: String, default: null },
        city        : { type: String, default: null },
        zip         : { type: String, default: null },
        latitude    : { type: Number, default: null },
        longitude   : { type: Number, default: null }
    }, default: null },
    shipping_lines          : { type: [{
        code                            : { type: String, default: null },
        discounted_price                : { type: Number, default: 0 },
        price                           : { type: Number, default: 0 },
        source                          : { type: String, default: null },
        title                           : { type: String, default: null },
        tax_lines                       : { type: [{
            price   : { type: Number, default: 0 },
            rate    : { type: Number, default: 0 },
            title   : { type: String, default: null }
        }], default: [] },
        carrier_identifier              : { type: String, default: null },
        requested_fulfillment_service_id: { type: String, default: null }
    }], default: [] },
    fulfillments            : { type: [{
        shopify_id              : { type: Number, default: null },
        location_id             : { type: Number, default: null },
        name                    : { type: String, default: null },
        service                 : { type: String, default: null }, 
        shipment_status         : { type: String, default: null },
        history_shipment_status : { type: [{ 
            status      : { type: String, default: null }, 
            updated_at  : { type: Date  , default: null } 
        }], default: [] },
        fulfillment_status      : { type: String, default: null }, 
        tracking_company        : { type: String, default: null }, 
        tracking_number         : { type: String, default: null }, 
        tracking_numbers        : [{ type: String, default: null }], 
        tracking_url            : { type: String, default: null }, 
        tracking_urls           : [{ type: String, default: null }], 
        line_items              : [{ type: Number, default: null }],
        created_at              : { type: Date, default: null }, 
        updated_at              : { type: Date, default: null }, 
    }], default: [] },
    refunds                 : { type: [{
        shopify_id              : { type: Number, default: null },
        note                    : { type: String, default: null },
        restock                 : { type: Boolean, default: true },
        total_duties            : { type: Number, default: 0 },
        order_adjustments       : { type: [{
            shopify_id  : { type: Number, default: null },
            amount      : { type: Number, default: 0 },
            tax_amount  : { type: Number, default: 0 },
            kind        : { type: String, default: null },
            reason      : { type: String, default: null }
        }], default: [] },
        transactions            : { type: [{
            shopify_id          : { type: Number, default: null },
            amount              : { type: Number, default: 0 },
            autorization        : { type: String, default: null },
            device_id           : { type: Number, default: null },
            error_code          : { type: String, default: null },
            gateway             : { type: String, default: null },
            kind                : { type: String, default: null },
            localtion_id        : { type: String, default: null },
            message             : { type: String, default: null },
            source_name         : { type: String, default: null },
            transaction_status  : { type: String, default: null },
            created_at          : { type: Date, default: null },
            processed_at        : { type: Date, default: null }
        }], default: [] },
        refund_line_items       : { type: [{
            shopify_id  : { type: Number, default: null },
            localtion_id: { type: Number, default: null },
            line_item_id: { type: Number, default: null },
            quantity    : { type: Number, default: 0 },
            restock_type: { type: String, default: null },
            subtotal    : { type: Number, default: 0 },
            total_taxes : { type: Number, default: 0 }
        }], default: [] },
        refund_shipping_lines   : { type: [{
            shopify_id      : { type: Number, default: null },
            shipping_line_id: { type: Number, default: null },
            subtotal        : { type: Number, default: 0 },
            total_taxes     : { type: Number, default: 0 }
        }], default: [] },
        created_at              : { type: Date, default: null },
    }], default: [] },
    cancel_reason           : { type: String                            , default: null },
    note                    : { type: String                            , default: null },
    note_attributes         : { type: Object                            , default: [] },
    financial_status        : { type: String                            , default: null },
    fulfillment_status      : { type: String                            , default: null },
    order_status_url        : { type: String                            , default: null },
    currency_code           : { type: String                            , default: null },
    created_invoice         : { type: Boolean                           , default: false },
    invoice_items           : { type: [{
        shopify_id  : { type: Number, default: null }, 
        sku         : { type: String, default: null }, 
        quantity    : { type: Number, default: 0 }, 
        price       : { type: Number, default: 0 }
    }], default: [] },
    is_adjustment           : { type: Boolean                           , default: false },

    created_at              : { type: Date                              , default: Date.now },
    updated_at              : { type: Date                              , default: Date.now }, 
    deleted_at              : { type: Date                              , default: null },
    processed_at            : { type: Date                              , default: null },
    closed_at               : { type: Date                              , default: null },
    cancelled_at            : { type: Date                              , default: null }, 
    deleted                 : { type: Boolean                           , default: false },
    status                  : { type: String                            , default: 'active' }
});

module.exports = mongoose.model( 'back_order', orderSchema );
