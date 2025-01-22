const mongoose  = require('mongoose');

let navigationSchema = mongoose.Schema({
    marketplace     : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_marketplace' },
    name            : { type: String                        , default: null },
    handle          : { type: String                        , default: null },
    sub_navigation  : { type: [{
        navigation_option   : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_front_navigation_option' },
        sub_navigation      : { type: [{
            navigation_option   : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_front_navigation_option' },
            sub_navigation      : [{ type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_front_navigation_option' }]
        }], default: [] }
    }], default: [] },
    
    created_at  : { type: Date                          , default: Date.now }, 
    updated_at  : { type: Date                          , default: Date.now }, 
    deleted_at  : { type: Date                          , default: null }, 
    deleted     : { type: Boolean                       , default: false },
    status      : { type: String                        , default: 'active' }
});

module.exports = mongoose.model( 'back_front_navigation', navigationSchema );