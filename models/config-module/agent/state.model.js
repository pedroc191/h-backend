const mongoose = require('mongoose');

let stateSchema = mongoose.Schema({
    name        : { type: String    , default: null },
    country     : { type: String    , default: null },
    created_at  : { type: Date      , default: Date.now},
    updated_at  : { type: Date      , default: Date.now },
    created_by  : { type: String    , default: null },
    deleted_at  : { type: Date      , default: null }, 
    deleted     : { type: Boolean   , default: false },
    status      : { type: String    , default: 'active' }
});

module.exports = mongoose.model('agent_state', stateSchema);