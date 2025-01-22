const mongoose      = require('mongoose');

let buyAgainSchema = mongoose.Schema({
    marketplace         : { type: mongoose.Schema.Types.ObjectId, default: null,  ref: 'back_marketplace' },
    customer_id         : { type: Number                        , default: null },
    variant_products    : { type: Object                        , default: [] },
    
    created_at          : { type: Date                          , default: Date.now },
    updated_at          : { type: Date                          , default: Date.now },
    deleted_at          : { type: Date                          , default: null },
    deleted             : { type: Boolean                       , default: false },
    status              : { type: String                        , default: 'active' },
});

module.exports = mongoose.model( 'back_buy_again', buyAgainSchema );