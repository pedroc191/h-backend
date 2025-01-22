const mongoose      = require('mongoose');

let preorderSchema = mongoose.Schema({
    marketplace         : { type: mongoose.Schema.Types.ObjectId    , default: null, ref: 'back_marketplace' },
    customer            : { type: mongoose.Schema.Types.ObjectId    , default: null, ref: 'back_customer' },
    advance_order       : { type: mongoose.Schema.Types.ObjectId    , default: null, ref: 'back_order' },
    complete_order      : { type: mongoose.Schema.Types.ObjectId    , default: null, ref: 'back_order' },
    product_bundle      : { type: mongoose.Schema.Types.ObjectId    , default: null, ref: 'agent_product_bundle' },
    line_items          : [{ type: mongoose.Schema.Types.ObjectId   , default: null, ref: 'back_preorder_item' }],
    name                : { type: String                            , default: null },
    number              : { type: Number                            , default: null },
    order_origin        : { type: String                            , default: 'wholesale' },
    life_stage          : { type: String                            , default: 'open'       , enum: ['open', 'pending', 'closed', 'canceled', 'ordered'] }, 
    category_preorder   : { type: String                            , default: 'standard'   , enum: ['standard', 'bundle'] },

    created_at          : { type: Date                              , default: Date.now },
    updated_at          : { type: Date                              , default: Date.now },
    deleted_at          : { type: Date                              , default: null },
    deleted             : { type: Boolean                           , default: false },
    status              : { type: String                            , default: 'active' },
});

module.exports = mongoose.model( 'back_preorder', preorderSchema );