const mongoose      = require('mongoose');

let productPreSaleSchema = mongoose.Schema({
    product                 : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_product' },
    pay_percentage_advance  : { type: Number                        , default: 0 },
    moq                     : { type: Number                        , default: 0 },
    discount                : { type: Number                        , default: 0 },
    enable_after            : { type: Boolean                       , default: true },
    started_at              : { type: Date                          , default: null },
    ended_at                : { type: Date                          , default: null },

    created_at              : { type: Date                          , default: Date.now },
    updated_at              : { type: Date                          , default: Date.now }, 
    deleted_at              : { type: Date                          , default: null }, 
    deleted                 : { type: Boolean                       , default: false },
    status                  : { type: String                        , default: 'active' }
});
module.exports = mongoose.model( 'agent_product_pre_sale', productPreSaleSchema );