const mongoose  = require('mongoose');

const link_type_options = ['background', 'button-solid', 'button-line'];

const orientation_options = ['top-left', 'top-center', 'top-right', 'center-left', 'center-center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right'];

let slideshowSchema = mongoose.Schema({
    marketplace : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_marketplace' },
    storefront  : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_storefront' },
    name        : { type: String                        , default: null },
    handle      : { type: String                        , default: null },
    slides      : { type: [ {
        show        : { type: Boolean, default: true },
        content     : { type: {
            width       : { type: String, default: 'container', enum: ['container', 'full-width'] },
            orientation : { type: String, default: 'center-center', enum: orientation_options },
            title       : { type: {
                content     : { type: String, default: null },
                orientation : { type: String, default: 'center-center', enum: orientation_options },
            }, default: null },
            subtitle    : { type: {
                content     : { type: String, default: null },
                orientation : { type: String, default: 'center-center', enum: orientation_options },
            }, default: null },
            btn_action  : { type: {
                type_btn: { type: String    , default: 'background', enum: link_type_options },
                show    : { type: Boolean   , default: false },
                label   : { type: String    , default: null },
                icon    : { type: String    , default: null },
                url     : { type: String    , default: null },
            }, default: null },
        }, default: null },
        media       : { type: {
            type_media  : { type: String, default: 'image' }, // image, video
            use_media   : { type: String, default: 'background' }, // default: 'background', 'preview', 'section'
            orientation : { type: String, default: 'center-center', enum: orientation_options },
            desktop     : { type: { 
                alt         : { type: String    , default: null }, 
                src         : { type: String    , default: null },
                width       : { type: Number    , default: 3000 },
                height      : { type: Number    , default: 1440 },
                sizes       : [{ type: Number   , default: [3000, 2800, 2600, 2400, 2200, 2000, 1800, 1600, 1400, 1200] }]
            }, default: null },
            mobile      : { type: { 
                alt         : { type: String    , default: null }, 
                src         : { type: String    , default: null }, 
                width       : { type: Number    , default: 1000 },
                height      : { type: Number    , default: 480 },
                sizes       : [{ type: Number   , default: [1000, 800, 700, 600] }]
            }, default: null },
        }, default: null },
        translate   : { type: [{
            language        : { type: String, default: 'es-CO' },
            content         : { type: {
                title       : { type: String, default: null },
                subtitle    : { type: String, default: null },
                btn_action  : { type: {
                    label   : { type: String, default: null },
                }, default: null },
            }, default: null },
            image           : { type: {
                desktop : { type: {
                    src: { type: String, default: null },
                }, default: null },
                mobile  : { type: {
                    src: { type: String, default: null },
                }, default: null },
            }},
            is_translated   : { type: Boolean, default: false }
        }], default: [] }
    } ], default: [] }, 
    navigation  : { type: {
        arrows : { type: Boolean, default: true },
        dots   : { type: Boolean, default: true },
    }, default: null },

    created_at  : { type: Date                          , default: Date.now }, 
    updated_at  : { type: Date                          , default: Date.now }, 
    deleted_at  : { type: Date                          , default: null }, 
    deleted     : { type: Boolean                       , default: false },
    status      : { type: String                        , default: 'active' }
});

module.exports = mongoose.model( 'back_front_slideshow', slideshowSchema );

/*  
images, items format:

display_application.desktop_store = true
{ 
    show: false, 
    background_link: '', 
    title: '', 
    subtitle: '', 
    text_orientation: 'top-left, top-center, top-right, center-left, center-center, center-right, bottom-left, bottom-center, bottom-right', 
    images: { 
        desktop: { alt: '', url: '' }, 
        mobile: { alt: '', url: '' } 
    } 
}

display_application.mobile_store = true
{ 
    show: false, 
    background_link: '', 
    title: '', 
    subtitle: '', 
    text_orientation: 'top-left, top-center, top-right, center-left, center-center, center-right, bottom-left, bottom-center, bottom-right', 
    image: { alt: '', url: '' } 
} 
*/