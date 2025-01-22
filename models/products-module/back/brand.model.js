const mongoose  = require('mongoose');

let brandSchema = mongoose.Schema({
    marketplace     : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_marketplace' },
    name            : { type: String                        , default: null },
    handle          : { type: String                        , default: null },
    logo            : { type: {
        desktop : { type: { 
            category        : { type: String, default: null }, 
            alt             : { type: String, default: null }, 
            src             : { type: String, default: null },
            width           : { type: Number, default: 320 }, //1083
            height          : { type: Number, default: 320 }, //1440
            sizes           : [{ type: Number, default: [360] }]
        }, default: null },
        mobile  : { type: { 
            category        : { type: String, default: null }, 
            alt             : { type: String, default: null }, 
            src             : { type: String, default: null }, 
            width           : { type: Number, default: 320 }, //480
            height          : { type: Number, default: 320 }, //360
            sizes           : [{ type: Number, default: [360] }]
        }, default: null },
    }, default: null },
    collection_url  : { type: String                        , default: null },
    tag             : { type: String                        , default: null },
    customer_brand  : { type: Boolean                       , default: false },
    notify_stock    : { type: Boolean                       , default: false },
    min_stock       : { type: Number                        , default: 20 },
    translate       : { type: [{
        language        : { type: String, default: 'es-CO' },
        name            : { type: String, default: null },
        logo            : { type: String, default: null },
        is_translated   : { type: Boolean, default: false }
    }], default: [] },
    
    created_at      : { type: Date                          , default: Date.now }, 
    updated_at      : { type: Date                          , default: Date.now }, 
    deleted_at      : { type: Date                          , default: null }, 
    deleted         : { type: Boolean                       , default: false },
    status          : { type: String                        , default: 'active' }
});

module.exports = mongoose.model( 'back_brand', brandSchema );

    //handle              : { type: String,   default: null },
    //logo                : { type: Object,   default: null },    // { alt: '', url: '' }
    //size_guide          : { type: Object,   default: [] },      // { product_type: '', values: { sizes: [], waist: [], hips: [], height: [], weight: [] } }
    //model               : { type: Object,   default: null },    // { show: { alt: '', url: '' }, hover: { alt: '', url: '' } }