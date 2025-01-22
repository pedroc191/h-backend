const mongoose  = require('mongoose');

let generalFilterSchema = mongoose.Schema({
    marketplace         : { type: mongoose.Schema.Types.ObjectId    , default: null, ref: 'back_marketplace' },
    name                : { type: String                            , default: null },
    handle              : { type: String                            , default: null },
    field               : { type: String                            , default: null }, // brand, product_category, tags, options
    brands              : [{ type: mongoose.Schema.Types.ObjectId   , default: null, ref: 'back_brand' }],
    product_cateogries  : [{ type: mongoose.Schema.Types.ObjectId   , default: null, ref: 'back_product_category' }],
    tags                : [{ type: mongoose.Schema.Types.ObjectId   , default: null, ref: 'back_tag' }],
    product_options     : { type: mongoose.Schema.Types.ObjectId    , default: null, ref: 'back_product_option' },
    available           : { type: Boolean                           , default: true },
    translate           : { type: [{
        language        : { type: String, default: 'es-CO' },
        name            : { type: String, default: null },
        is_translated   : { type: Boolean, default: false }
    }], default: [] },
    
    created_at          : { type: Date                              , default: Date.now }, 
    updated_at          : { type: Date                              , default: Date.now }, 
    deleted_at          : { type: Date                              , default: null }, 
    deleted             : { type: Boolean                           , default: false },
    status              : { type: String                            , default: 'active' }
});

module.exports = mongoose.model( 'back_general_filter', generalFilterSchema );