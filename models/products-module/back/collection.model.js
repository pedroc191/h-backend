const mongoose      = require('mongoose');

let collectionSchema = mongoose.Schema({
    marketplace     : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_marketplace' },
    shopify_id      : { type: Number                        , default: null },
    title           : { type: String                        , default: null },
    handle          : { type: String                        , default: null },
    description     : { type: String                        , default: null },
    image           : { type: {
        desktop : { type: { 
            alt         : { type: String, default: null }, 
            src         : { type: String, default: null },
            width       : { type: Number, default: 3000 },
            height      : { type: Number, default: 1440 },
            sizes       : [{ type: Number, default: [3000, 2800, 2600, 2400, 2200, 2000, 1800, 1600, 1400, 1200] }]
        }, default: null },
        mobile  : { type: { 
            alt         : { type: String, default: null }, 
            src         : { type: String, default: null }, 
            width       : { type: Number, default: 1000 },
            height      : { type: Number, default: 480 },
            sizes       : [{ type: Number, default: [1000, 800, 700, 600] }]
        }, default: null },
    }, default: null }, 
    sort_order      : { type: Object                        , default: null }, // alpha-asc, alpha-des, best-selling, created, created-desc, price-asc, price-desc
    sotr_category   : { type: Boolean                       , default: true },
    disjunctive     : { type: Boolean                       , default: false },
    rules           : { type: Object                        , default: [] }, 
    query_products  : { type: {
        format  : { type: Object, default: {} },
        details : { type: Object, default: [] }
    }, default: null },
    selected_filters: [{ type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_general_filter' }],  
    filter_values   : { type: {
        brands              : [{ type: String, default: null }],
        product_categories  : [{ type: String, default: null }],
        tags                : [{ type: String, default: null }],
        product_options     : { type: [{
            handle  : { type: String, default: null },
            values  : [{ type: String, default: null }]
        }], default: null },
        prices: { type: {
            min_price: { type: Number, default: null },
            max_price: { type: Number, default: null }
        }, default: null },
    }, default: { brands: [], product_categories: [], tags: [], product_options: [], prices: { min_price: null, max_price: null } } },
    translate       : { type: [{
        language        : { type: String, default: 'es-CO' },
        title           : { type: String, default: null },
        description     : { type: String, default: null },
        image           : { type: {
            desktop : {
                src : { type: String, default: null },
            },
            mobile  : {
                src : { type: String, default: null },
            },
        } , default: null },
        is_translated   : { type: Boolean, default: false }
    }], default: [] },
    status_created  : { type: String                        , default: null },
    published_at    : { type: Date                          , default: null },
    
    created_at      : { type: Date                          , default: Date.now }, 
    updated_at      : { type: Date                          , default: Date.now }, 
    deleted_at      : { type: Date                          , default: null }, 
    deleted         : { type: Boolean                       , default: false },
    status          : { type: String                        , default: 'active' }
});

module.exports = mongoose.model( 'back_collection', collectionSchema );