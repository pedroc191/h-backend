const mongoose      = require('mongoose');

let marketplaceSchema = mongoose.Schema({
    name            : { type: String    , default: null },
    handle          : { type: String    , default: null },
    description     : { type: String    , default: null },
    application_type      : { type: String    , default: 'shopify' },
    credentials     : { type: {
        shop    : { type: String, default: null },
        api_key : { type: String, default: null },
        token   : { type: String, default: null },
    }, default: null },
    access          : { type: {
        products        : { type: Boolean   , default: true }, 
        users           : { type: Boolean   , default: false }, 
        customers       : { type: Boolean   , default: true }, 
        orders          : { type: Boolean   , default: true }, 
        shipping_details: { type: Boolean   , default: false },
        wholesale       : { type: {
            discounts   : { type: Boolean   , default: false },
            statement   : { type: Boolean   , default: false },
            lead        : { type: Boolean   , default: false },
        }, default: null },
    }, default: null },
    order_origins   : { type: [{
        business        : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'billing_business' },
        name            : { type: String                        , default: null },
        handle          : { type: String                        , default: null },
        values          : { type: Object                        , default: [] },
        search          : { type: {
            field   : { type: String, default: null }, // name, tags
            value   : { type: String, default: null }
        }, default: null },
        access          : { type: {
            orders          : { type: Boolean   , default: true }, 
            invoices        : { type: Boolean   , default: true }, 
            shipping_details: { type: Boolean   , default: true }
        }, default: null },
        customer_role   : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_role' },
        currency_format : { type: {
            locale  : { type: String, default: null },
            code    : { type: String, default: null }
        }, default: null },
        main            : { type: Boolean                       , default: false },
    }], default: [] },
    product_origins : { type: [{
        business        : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'billing_business' },
        name            : { type: String                        , default: null },
        handle          : { type: String                        , default: null },
        values          : { type: Object                        , default: [] },
        search          : { type: {
            field   : { type: String, default: null }, // name, tags
            value   : { type: String, default: null }
        }, default: null },
        currency_format : { type: {
            locale  : { type: String, default: null },
            code    : { type: String, default: null }
        }, default: null },
        main            : { type: Boolean                       , default: false },
    }], default: [] },
    
    created_at      : { type: Date      , default: Date.now },
    updated_at      : { type: Date      , default: Date.now },
    deleted_at      : { type: Date      , default: null },
    deleted         : { type: Boolean   , default: false },
    status          : { type: String    , default: 'active' },
});

module.exports = mongoose.model( 'back_marketplace', marketplaceSchema );