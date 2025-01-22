const mongoose  = require('mongoose');

let storefrontSchema = mongoose.Schema({
    marketplace                 : { type: mongoose.Schema.Types.ObjectId    , default: null, ref: 'back_marketplace' },
    owner                       : { type: mongoose.Schema.Types.ObjectId    , default: null, ref: 'back_customer' },
    referring_store             : { type: mongoose.Schema.Types.ObjectId    , default: null, ref: 'back_storefront' },

    // Store Settings
    name                        : { type: String                            , default: null },
    initials                    : { type: String                            , default: null },
    logo                        : { type: String                            , default: null },
    favicon                     : { type: String                            , default: null },
    slogan                      : { type: String                            , default: null },
    domain                      : { type: String                            , default: null },
    subdomain                   : { type: String                            , default: null },
    email                       : { type: String                            , default: null },
    phone                       : { type: {
        code        : { type: String, default: null },
        number      : { type: String, default: null },
        format      : { type: String, default: null },
        country_code: { type: String, default: null }
    }, default: null },
    social_networks             : { type: [{
        name        : { type: String, default: null },
        url         : { type: String, default: null },
        icon        : { type: String, default: null }
    }], default: [] },
    locations                   : { type: [{
        name    : { type: String , default: null },
        address : { type: String , default: null },
        url     : { type: String , default: null },
        main    : { type: Boolean, default: false }
    }], default: [] },
    theme                       : { type: mongoose.Schema.Types.ObjectId    , default: null, ref: 'back_storefront_theme' },
    slideshow                   : { type: mongoose.Schema.Types.ObjectId    , default: null, ref: 'back_front_slideshow' },
    collection_style            : { type: String                            , default: "grid" }, // list - grid
    commissions                 : { type: mongoose.Schema.Types.ObjectId    , default: null, ref: 'agent_discount' },

    // Payment Information
    charge_methods              : { 
        type: { 
            paypal      : { type: {
                email: { type: String, default: null }
            }, default: null }, 
            bank_deposit : { type: { 
                account_number: { type: String, default: null }, 
                routing_number: { type: String, default: null } 
            }, default: null }, 
            wallets     : { type: [{
                token   : { type: String, default: null },
                address : { type: String, default: null }
            }], default: []
            }, 
            credit_card : { type: { 
                number      : { type: String, default: null },  
                name        : { type: String, default: null },  
                date        : { type: String, default: null },  
                cvv         : { type: String, default: null }, 
                card_type   : { type: String, default: null } 
            }, default: null }
        } , 
        default: null
    },
    payment_methods             : { 
        type: { 
            paypal      : { type: {
                email: { type: String, default: null }
            }, default: null }, 
            bank_deposit : { type: { 
                account_number: { type: String, default: null }, 
                routing_number: { type: String, default: null } 
            }, default: null }, 
            wallets     : { type: [{
                token   : { type: String, default: null },
                address : { type: String, default: null }
            }], default: []
            }, 
            credit_card : { type: { 
                number      : { type: String, default: null },  
                name        : { type: String, default: null },  
                date        : { type: String, default: null },  
                cvv         : { type: String, default: null }, 
                card_type   : { type: String, default: null } 
            }, default: null }
        } , 
        default: null
    },
    change_payment_info         : { type: Boolean                           , default: false },     

    // Config Admin
    hidden_navigation_options   : [{ type: mongoose.Schema.Types.ObjectId   , default: null, ref: 'back_front_navigation_option' }],
    hidden_brands               : [{ type: mongoose.Schema.Types.ObjectId   , default: null, ref: 'back_brand' }],
    primary_language            : { type: String                            , default: "en-US" },

    first_order                 : { type: Object                            , default: null },
    last_order                  : { type: Object                            , default: null },

    created_at                  : { type: Date                              , default: Date.now },
    updated_at                  : { type: Date                              , default: Date.now },
    deleted_at                  : { type: Date                              , default: null },
    deleted                     : { type: Boolean                           , default: false },
    status                      : { type: String                            , default: 'active' }
});
module.exports = mongoose.model('back_storefront', storefrontSchema);