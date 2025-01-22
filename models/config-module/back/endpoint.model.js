const mongoose      = require('mongoose');

let endpointSchema = mongoose.Schema({
    name            : { type: String    , default: null },
    handle          : { type: String    , default: null },
    model           : { type: String    , default: null },
    request_method  : { type: String    , default: null },
    path            : { type: String    , default: null },
    method          : { type: String    , default: null },
    description     : { type: String    , default: null },
    test_mode       : { type: Boolean   , default: false },

    created_at      : { type: Date      , default: Date.now }, 
    updated_at      : { type: Date      , default: Date.now }, 
    deleted_at      : { type: Date      , default: null }, 
    deleted         : { type: Boolean   , default: false },
    status          : { type: String    , default: 'active' }
});

module.exports = mongoose.model( 'back_api_endpoint', endpointSchema );