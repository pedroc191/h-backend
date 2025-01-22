const mongoose  = require('mongoose');

let menuOptionSchema = mongoose.Schema({
    name            : { type: String    , default: null },
    url             : { type: String    , default: null },
    icon            : { type: String    , default: null },
    custom_css      : { type: String    , default: null },
    is_dashboard    : { type: Boolean   , default: false },
    
    created_at      : { type: Date      , default: Date.now },
    updated_at      : { type: Date      , default: Date.now }, 
    deleted_at      : { type: Date      , default: null }, 
    deleted         : { type: Boolean   , default: false },
    status          : { type: String    , default: 'active' }
});

module.exports = mongoose.model( 'back_menu_option', menuOptionSchema );