const mongoose  = require('mongoose');

let productOptionValueSchema = mongoose.Schema({
    marketplace : { type: mongoose.Schema.Types.ObjectId, default: null,  ref: 'back_marketplace' },
    name        : { type: String                        , default: null },
    handle      : { type: String                        , default: null },
    translate   : { type: [{
        language        : { type: String, default: 'es-CO' },
        name            : { type: String, default: null },
        is_translated   : { type: Boolean, default: false }
    }], default: [] },

    created_at  : { type: Date                          , default: Date.now }, 
    updated_at  : { type: Date                          , default: Date.now }, 
    deleted_at  : { type: Date                          , default: null }, 
    deleted     : { type: Boolean                       , default: false },
    status      : { type: String                        , default: 'active' }
});

module.exports = mongoose.model( 'back_product_option_value', productOptionValueSchema );