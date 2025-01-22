const mongoose = require('mongoose');

let businessTypeSchema = mongoose.Schema({
    name        : { type: String    , default: null },
    created_at  : { type: Date      , default: Date.now },
    updated_at  : { type: Date      , default: Date.now }, 
    deleted_at  : { type: Date      , default: null }, 
    deleted     : { type: Boolean   , default: false },
    status      : { type: String    , default: 'active' }
});

module.exports = mongoose.model('agent_businesstype', businessTypeSchema);