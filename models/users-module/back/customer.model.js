const mongoose = require('mongoose');

let customerSchema = mongoose.Schema({
    // General Fields
    marketplace                 : { type: mongoose.Schema.Types.ObjectId    , default: null, ref: 'back_marketplace' },
    agent                       : { type: mongoose.Schema.Types.ObjectId    , default: null, ref: 'agent_user' },
    storefront                  : { type: mongoose.Schema.Types.ObjectId    , default: null, ref: 'back_storefront' },
    
    shopify_id                  : { type: Number                            , default: null },
    fresh_id                    : { type: String                            , default: null },
    klaviyo_id                  : { type: String                            , default: null },
    
    first_name                  : { type: String                            , default: null },
    last_name                   : { type: String                            , default: null },
    full_name                   : { type: String                            , default: null },
    profile_image               : { type: String                            , default: null },
    phone                       : { type: {
        code        : { type: String, default: null },
        number      : { type: String, default: null },
        format      : { type: String, default: null },
        country_code: { type: String, default: null }
    }, default: null },
    email                       : { type: String                            , default: null },
    agent_email                 : { type: String                            , default: null },
    tags                        : [{ type: String                           , default: null }],
    addresses                   : { type: [{
        id                  : { type: Number, default: null }, 
        customer_id         : { type: Number, default: null }, 
        default_shipping    : { type: Boolean, default: false }, 
        default_billing     : { type: Boolean, default: false }, 
        first_name          : { type: String, default: null }, 
        last_name           : { type: String, default: null }, 
        phone               : { type: {
            country_code: { type: String, default: null },
            code        : { type: String, default: null },
            number      : { type: String, default: null },
            format      : { type: String, default: null }
        }, default: null }, 
        company             : { type: String, default: null }, 
        address_1           : { type: String, default: null }, 
        address_2           : { type: String, default: null }, 
        country             : { type: String, default: null }, 
        country_code        : { type: String, default: null }, 
        state               : { type: String, default: null }, 
        state_code          : { type: String, default: null }, 
        city                : { type: String, default: null }, 
        zip                 : { type: String, default: null }, 
        shipping_address    : { type: Boolean, default: false }, 
        billing_address     : { type: Boolean, default: false }
    }], default: [] },
    disabled_store              : { type: Boolean                           , default: false },
    special_shippings           : { type: [{ 
        name        : { type: String, default: null }, 
        price       : { type: Number, default: null },
        main        : { type: Boolean, default: false },
        translate   : { type: [{
            language        : { type: String, default: 'es-CO' },
            name            : { type: String, default: null },
            is_translated   : { type: Boolean, default: false }
        }], default: [] }
    }], default: null },
    share_inventory             : { type: {
        active: { type: Boolean, default: false },
        emails: { type: [{ type: String, default: null }], default: [] }
    }, default: { active: false, emails: [] } },
    is_wholesale                : { type: Boolean                           , default: false },
    is_retail                   : { type: Boolean                           , default: false },
    is_storefront               : { type: Boolean                           , default: false },
    is_affiliate                : { type: Boolean                           , default: false },
    
    // Agent Fields
    main_account                : { type: Boolean                           , default: true },
    main_account_id             : { type: String                            , default: null },   
    country                     : { type: String                            , default: null },
    state                       : { type: mongoose.Schema.Types.ObjectId    , default: null, ref: 'agent_state' },
    shop                        : { type: mongoose.Schema.Types.ObjectId    , default: null, ref: 'agent_shop' },
    language                    : { type: mongoose.Schema.Types.ObjectId    , default: null, ref: 'agent_language' },
    type_business               : { type: mongoose.Schema.Types.ObjectId    , default: null, ref: 'agent_businesstype' },
    customer_type               : { type: mongoose.Schema.Types.ObjectId    , default: null, ref: 'agent_customertype' },
    product_category            : [{ type: mongoose.Schema.Types.ObjectId   , default: null, ref: 'agent_categoryproduct' }],
    note                        : { type: String                            , default: null },
    usually_send                : [{ type: String                           , default: null }],
    last_alert_date             : { type: Date                              , default: null },
    fresh_data                  : { type: Object                            , default: null },
    first_order                 : { type: {
        shopify_id  : { type: Number, default: null },
        name        : { type: String, default: null },
        total_price : { type: Number, default: 0 },
        created_at  : { type: Date, default: null }
    }, default: null },
    last_order                  : { type: {
        shopify_id  : { type: Number, default: null },
        name        : { type: String, default: null },
        total_price : { type: Number, default: 0 },
        created_at  : { type: Date, default: null }
    }, default: null },
    orders_count                : { type: { 
        total       : { type: Number, default: 0 }, 
        last_year   : { type: Number, default: 0 }, 
        current_year: { type: Number, default: 0 }, 
    }, default: { total: 0, last_year: 0, current_year: 0 } },
    total_spent                 : { type: Number                            , default: 0 },
    is_dropshipping             : { type: Boolean                           , default: false },
    birthday_date               : { type: Date                              , default: null },
    check_terms_and_conditions  : { type: Boolean                           , default: false },
    initial_budget              : { type: String                            , default: null },
    company_website             : { type: String                            , default: null },
    instagram                   : { type: String                            , default: null },
    source                      : { type: String                            , default: null },
    valid_moa                   : { type: Boolean                           , default: false },
    tax_exempt                  : { type: Boolean                           , default: false },
    google_add_id               : { type: String                            , default: null },
    origin_add                  : { type: String                            , default: null },
    utms                        : { type: {
        utmSource   : { type: String , default: null }, 
        utmMedium   : { type: String , default: null }, 
        utmCampaign : { type: String , default: null }, 
        utmTerm     : { type: String , default: null },
    }, default: null },
    
    // Billing Fields
    nit                         : { type: Number                            , default: null },
    inputs_by_year              : { type: Number                            , default: 0 }, // acumulado de inputs para el calculo del nivel 
    inputs_monthly              : { type: [{
        amount  : { type: Number    , default: 0 },
        date    : { type: String    , default: null }
    }], defualt: [] }, 
    balance                     : { type: Number                            , default: 0 },
    usually_sends               : { type: [{
        amount  : { type: Number, default: 0 },
        date    : { type: Date, default: null }
    }], default: [] },
    last_billing_address        : { type: {
        first_name  : { type: String, default: null },
        last_name   : { type: String, default: null },
        phone       : { type: {
            code        : { type: String, default: null },
            number      : { type: String, default: null },
            country_code: { type: String, default: null }
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
    blocked_payment : { type: {
        amount  : { type: Number    , default: 0 }, 
        date    : { type: Date, default: null }, 
        method  : { type: String , default: null }
    }, default: null },
    
    created_at                  : { type: Date                              , default: Date.now },
    updated_at                  : { type: Date                              , default: Date.now }, 
    deleted_at                  : { type: Date                              , default: null }, 
    deleted                     : { type: Boolean                           , default: false },
    status                      : { type: String                            , default: 'active' }
});

module.exports = mongoose.model('back_customer', customerSchema);