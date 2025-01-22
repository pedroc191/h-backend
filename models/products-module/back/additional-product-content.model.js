const mongoose = require('mongoose');

let additionalProductContentSchema = mongoose.Schema({
    marketplace     : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_marketplace' },
    title           : { type: String                        , default: null },
    handle          : { type: String                        , default: null },
    content_type    : { type: String                        , default: null }, // file, image, video, text
    content_value   : { type: {
        localtion       : { type: String, default: null }, // gallery, bottom_description, top_description, new_tab
        location_tab    : { type: String, default: null },
        location_sort   : { type: String, default: null }, // first, last, custom
        location_index  : { type: Number, default: null },
        desktop         : { type: { 
            description : { type: String, default: null },
            alt         : { type: String, default: null }, 
            src         : { type: String, default: null },
            width       : { type: Number, default: 3000 },
            height      : { type: Number, default: 1440 },
            sizes       : [{ type: Number, default: [3000, 2800, 2600, 2400, 2200, 2000, 1800, 1600, 1400, 1200] }]
        }, default: null },
        mobile          : { type: { 
            description : { type: String, default: null },
            alt         : { type: String, default: null }, 
            src         : { type: String, default: null }, 
            width       : { type: Number, default: 1000 },
            height      : { type: Number, default: 480 },
            sizes       : [{ type: Number, default: [1000, 800, 700, 600] }]
        }, default: null },
    }, default: null },
    condition       : { type: {
        category: { type: String, default: null }, // product, brand, product-type, tag
        value   : { type: Object, default: {} }
    }, default: null },
    translate       : { type: [{
        language        : { type: String, default: 'es-CO' },
        title           : { type: String, default: null },
        content_value   : { type: {
            location_tab: { type: String, default: null },
            desktop     : { type: { 
                description : { type: String, default: null },
                src         : { type: String, default: null },
            }, default: null },
            mobile      : { type: { 
                description : { type: String, default: null },
                src         : { type: String, default: null }, 
            }, default: null },
        }, default: null },
        is_translated   : { type: Boolean, default: false }
    }], default: [] },
    
    created_at       : { type: Date                          , default: Date.now }, 
    updated_at       : { type: Date                          , default: Date.now }, 
    deleted_at       : { type: Date                          , default: null }, 
    deleted          : { type: Boolean                       , default: false },
    status           : { type: String                        , default: 'active' }
});
module.exports = mongoose.model( 'back_additional_product_content', additionalProductContentSchema );

//https://www.youtube.com/watch?v=p6cH8PLgd_U&ab_channel=CatalogUS