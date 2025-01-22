const mongoose          = require('mongoose');

let applicationSchema   = mongoose.Schema({
    marketplace     : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_marketplace' },
    name            : { type: String                        , default: null },
    handle          : { type: String                        , default: null },
    description     : { type: String                        , default: null },
    host            : { type: String                        , default: null },
    token           : { type: String                        , default: null },
    role            : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_role' },
    test_mode       : { type: Boolean                       , default: false },
    exact_version   : { type: Boolean                       , default: false },
    
    created_at      : { type: Date                          , default: Date.now }, 
    updated_at      : { type: Date                          , default: Date.now }, 
    deleted_at      : { type: Date                          , default: null }, 
    deleted         : { type: Boolean                       , default: false },
    status          : { type: String                        , default: 'active' }
});
module.exports = mongoose.model( 'back_api_application', applicationSchema );