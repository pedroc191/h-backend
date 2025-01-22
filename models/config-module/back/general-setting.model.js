const mongoose      = require('mongoose');

let backGeneralSettingSchema = mongoose.Schema({
    marketplace             : { type: mongoose.Schema.Types.ObjectId    , default: null, ref: 'back_marketplace' },
    app_version             : { type: String                            , default: null },
    config_best_seller      : { type: [{
        category            : { type: String , default: null },
        range_months        : { type: Number, default: 3 },
        percentage_product  : { type: Number, default: 80 }, 
        percentage_variant  : { type: Number, default: 80 }
    }], default: [] },
    config_product          : { type: [{
        category    : { type: String , default: null },
        new_range   : { type: Number, default: 3 }, // Months
        max_stock   : { type: Number, default: 60 }
    }], default: [] },
    config_storefront       : { type: {
        service_charge      : { type: Number, default: 10 },
        minimum_sale_amount : { type: Number, default: 1 }
    }, default: null },
    config_shipping_rates   : { type: [{
        category: { type: String, default: null },
        general : { type: Number, default: null }
    }], default: [] },
    config_basic_data       : { type: [{ 
        category            : { type: String                        , default: null },
        name                : { type: String                        , default: null }, 
        description         : { type: String                        , default: null },
        contact_information : { type: { 
            phones          : { type: [{
                calls   : { type: Boolean, default: false },
                whatsapp: { type: Boolean, default: false }, 
                sms     : { type: Boolean, default: false }, 
                number  : { type: String , default: null }, 
                url     : { type: String , default: null }
            }], default: [] },  
            emails          : { type: [{
                use     : { type: String , default: 'general' }, // general, contact, sales, support, billing, agent, storefront, app
                value   : { type: String , default: null }
            }], default: [] }, 
            social_networks : { type: [{
                name    : { type: String , default: null },
                url     : { type: String , default: null },
                icon    : { type: String , default: null }
            }], default: [] },
            locations       : { type: [{
                name    : { type: String , default: null },
                address : { type: String , default: null },
                url     : { type: String , default: null },
                main    : { type: Boolean, default: false }
            }], default: [] }
        }, default:  null },
        copyright           : { type: String                        , default: null },
        primary_language    : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_language' },
        currency_format     : { type: {
            locale  : { type: String    , default: 'en-US' }, 
            currency: { type: String    , default: 'USD' }
        }, default: null }
    }], default: [] },
    navigations             : { type: [{
        category: { type: String                        , default: null },
        header  : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_front_navigation' },
        footer  : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_front_navigation' },
        account : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_front_navigation' }
    }], default: [] },
    slideshows              : { type: [{
        category: { type: String                        , default: null },
        home    : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_front_slideshow' }
    }], default: [] },
    
    commissions             : { type: [{
        category: { type: String, default: null },
        current : { type: Number, default: 10 },
        referral: { type: Number, default: 0 },
        scale   : { type: [{
            min_sale: { type: Number, default: 0 },
            max_sale: { type: Number, default: 0 },
            value   : { type: Number, default: 0 }
        }], default: [] }
    }], default: [] },
    charge_methods          : { type: [{
        categoy                 : { type: String , default: null },
        wholesale_available     : { type: Boolean, default: false },
        storefront_available    : { type: Boolean, default: false },
        app_mobile_available    : { type: Boolean, default: false },
        variants                : { type: [{
            name                    : { type: String , default: null },
            wholesale_available     : { type: Boolean, default: false },
            storefront_available    : { type: Boolean, default: false },
            app_mobile_available    : { type: Boolean, default: false },
        }], default: [] },
    }], default: null },
    payment_methods         : { type: [{
        categoy                 : { type: String , default: null },
        wholesale_available     : { type: Boolean, default: false },
        storefront_available    : { type: Boolean, default: false },
        app_mobile_available    : { type: Boolean, default: false },
        variants                : { type: [{
            name                    : { type: String , default: null },
            wholesale_available     : { type: Boolean, default: false },
            storefront_available    : { type: Boolean, default: false },
            app_mobile_available    : { type: Boolean, default: false },
        }], default: [] },
    }], default: null },

    sort_categories         : { type: [{
        name        : { type: String    , default: null },
        handle      : { type: String    , default: null },
        tags        : [{ type: String   , default: null}],
        products    : { type: Object    , default: [] },
        translate   : { type: [{
            language        : { type: String , default: 'es-CO' },
            name            : { type: String , default: null },
            is_translated   : { type: Boolean, default: false }
        }], default: [] }
    }], default: [] },
    sort_sizes              : [{ type: String                           , default: null}],
    general_filters         : [{ type: mongoose.Schema.Types.ObjectId   , default: null, ref: 'back_general_filter' }],
    product_options         : [{ type: mongoose.Schema.Types.ObjectId   , default: null, ref: 'back_product_option' }],
    languages               : [{ type: mongoose.Schema.Types.ObjectId   , default: null, ref: 'back_language' }],
    pages                   : [{ type: mongoose.Schema.Types.ObjectId   , default: null, ref: 'back_front_page' }],
    translates              : { type: Object                            , default: null },
    private_subdomains      : [{ type: String                           , default: null }],
    acces_dynamic_apps      : { type: [{
        name    : { type: String , default: null },
        handle  : { type: String , default: null },
        url     : { type: String , default: null },
        token   : { type: String , default: null },
    }], default: null },

    created_at              : { type: Date                              , default: Date.now }, 
    updated_at              : { type: Date                              , default: Date.now }, 
    deleted_at              : { type: Date                              , default: null }, 
    deleted                 : { type: Boolean                           , default: false },
    status                  : { type: String                            , default: 'active' }
});

module.exports = mongoose.model( 'back_general_setting', backGeneralSettingSchema );