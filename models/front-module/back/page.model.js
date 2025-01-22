const mongoose  = require('mongoose');

let pageSchema = mongoose.Schema({
    marketplace : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_marketplace' },
    title       : { type: String                        , default: null },
    handle      : { type: String                        , default: null },
    description : { type: String                        , default: null },
    breadcrumb  : { type: Boolean                       , default: true },
    content     : { type: String                        , default: null },
    header_media: { type: {
        type_media  : { type: String, default: 'image' }, // image, video
        desktop     : { type: { 
            alt         : { type: String, default: null }, 
            src         : { type: String, default: null },
            width       : { type: Number, default: 3000 },
            height      : { type: Number, default: 1440 },
            sizes       : [{ type: Number, default: [3000, 2800, 2600, 2400, 2200, 2000, 1800, 1600, 1400, 1200] }]
        }, default: null },
        mobile      : { type: { 
            alt         : { type: String, default: null }, 
            src         : { type: String, default: null }, 
            width       : { type: Number, default: 1000 },
            height      : { type: Number, default: 480 },
            sizes       : [{ type: Number, default: [1000, 800, 700, 600] }]
        }, default: null },
    }, default: null },
    base_url    : { type: String                        , default: null },
    url         : { type: String                        , default: null },
    template    : { type: String                        , default: null },
    coming_soon : { type: Boolean                       , default: false },
    translate   : { type: [{
        language        : { type: String, default: 'es-CO' },
        title           : { type: String, default: null },
        content         : { type: String, default: null },
        header_media    : { type: {
            desktop : { type: { 
                src: { type: String, default: null }
            }, default: null },
            mobile  : { type: { 
                src: { type: String, default: null } 
            }, default: null },
        }, default: null },
        is_translated   : { type: Boolean, default: false }
    }], default: [] },
    
    created_at  : { type: Date                          , default: Date.now }, 
    updated_at  : { type: Date                          , default: Date.now }, 
    deleted_at  : { type: Date                          , default: null }, 
    deleted     : { type: Boolean                       , default: false },
    status      : { type: String                        , default: 'active' }
});

module.exports = mongoose.model( 'back_front_page', pageSchema );