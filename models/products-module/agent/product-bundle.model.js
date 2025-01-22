const mongoose      = require('mongoose');

let productBundleSchema = mongoose.Schema({
    product                 : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_product' },
    selected_variants       : { type: [{
        variant : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_product_variant' },
        price   : { type: Number                        , default: 0 },
        quantity: { type: Number                        , default: 0 }
    }], default: [] },
    moq                     : { type: Number                        , default: 0 },
    moq_bundle              : { type: Number                        , default: 0 },
    target_bundle           : { type: Number                        , default: 0 },
    option_customize        : { type: Boolean                       , default: false },
    pay_percentage_advance  : { type: {
        armed   : { type: Number, default: 0 },
        custom  : { type: Number, default: 0 }
    }, default: null },
    config_pre_sale         : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'agent_product_pre_sale' },

    created_at              : { type: Date                          , default: Date.now },
    updated_at              : { type: Date                          , default: Date.now }, 
    deleted_at              : { type: Date                          , default: null }, 
    deleted                 : { type: Boolean                       , default: false },
    status                  : { type: String                        , default: 'active' }
});
module.exports = mongoose.model( 'agent_product_bundle', productBundleSchema );