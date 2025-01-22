const mongoose  = require('mongoose');

let navigationOptionSchema = mongoose.Schema({
    marketplace         : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_marketplace' },
    category            : { type: String                        , default: 'page' }, // page, dashboard, account, collection, product
    title               : { type: String                        , default: null },
    name                : { type: String                        , default: null },
    handle              : { type: String                        , default: null, unique: true },
    url                 : { type: String                        , default: null },
    content_media       : { type: {
        type_media  : { type: String, default: 'image' }, // image, video, iframe
        use_media   : { type: String, default: 'background' }, // default: 'background', 'preview', 'section'
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
    icon                : { type: {
        category: { type: String, default: null }, // css, svg, image
        value   : { type: String, default: null },
        color   : { type: String, default: null },
    }, default: null },
    custom_style        : { type: String                        , default: null }, 
    show                : { type: Boolean                       , default: false }, 
    open_new_tab        : { type: Boolean                       , default: false }, 
    sub_navigation_type : { type: String                        , default: 'basic' }, // default: 'basic', 'full_width', 'container_width'
    need_login      : { type: Boolean                       , default: false },
    translate       : { type: [{
        language        : { type: String, default: 'es-CO' },
        title           : { type: String, default: null },
        is_translated   : { type: Boolean, default: false }
    }], default: [] },
    
    created_at      : { type: Date                          , default: Date.now }, 
    updated_at      : { type: Date                          , default: Date.now }, 
    deleted_at      : { type: Date                          , default: null }, 
    deleted         : { type: Boolean                       , default: false },
    status          : { type: String                        , default: 'active' }
});

module.exports = mongoose.model( 'back_front_navigation_option', navigationOptionSchema );

/*
    nav_tree, item format:
    { 
        name: '', 
        handle: '', 
        type: '', 
        url: '', 
        icon: {
            css o url: '',
        }, 
        show: true, 
        new_page: true, 
        mega_menu: true, 
        childrens: [] 
    }
*/