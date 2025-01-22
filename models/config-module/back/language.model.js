const mongoose = require('mongoose');

let languageSchema = mongoose.Schema({
    name        : { type: String    , default: null },
    handle      : { type: String    , default: null },
    key_code    : { type: String    , default: null },
    code        : { type: String    , default: null },
    flag        : { type: String    , default: null },
    main        : { type: Boolean   , default: false },

    created_at  : { type: Date      , default: Date.now },
    updated_at  : { type: Date      , default: Date.now }, 
    deleted_at  : { type: Date      , default: null }, 
    deleted     : { type: Boolean   , default: false },
    status      : { type: String    , default: 'active' }
});

module.exports = mongoose.model('back_language', languageSchema);