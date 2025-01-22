const mongoose      = require('mongoose');

let roleSchema = mongoose.Schema({
    dashboard   : { type: mongoose.Schema.Types.ObjectId    , default: null, ref: 'back_front_navigation_option' },
    name        : { type: String                            , default: null },
    handle      : { type: String                            , default: null },
    endpoints   : [{ type: mongoose.Schema.Types.ObjectId   , default: null, ref: 'back_api_endpoint' }],
    navigation  : { type: mongoose.Schema.Types.ObjectId    , default: null, ref: 'back_front_navigation' },
    test_mode   : { type: Boolean                           , default: false },
    
    created_at  : { type: Date                              , default: Date.now },
    updated_at  : { type: Date                              , default: Date.now }, 
    deleted_at  : { type: Date                              , default: null }, 
    deleted     : { type: Boolean                           , default: false },
    status      : { type: String                            , default: 'active' }
});
module.exports = mongoose.model( 'back_role', roleSchema );