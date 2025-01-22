const mongoose      = require('mongoose');

let discountSchema = mongoose.Schema({
    customer    : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_customer'},
    discounts   : { type: [{
        brand           : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_brand' },
        valueDiscount   : { type: Number                        , default: 0, min: 0, max: 100 },
        deleted         : { type: Boolean                       , default: false },
    }], default: [] },
    
    updated_by  : { type: String                        , default: null },
    created_by  : { type: String                        , default: null },
    created_at  : { type: Date                          , default: Date.now }, 
    updated_at  : { type: Date                          , default: Date.now }, 
    deleted_at  : { type: Date                          , default: null }, 
    deleted     : { type: Boolean                       , default: false },
    status      : { type: String                        , default: 'active' }
});

module.exports = mongoose.model( 'agent_discount', discountSchema );