const mongoose = require('mongoose');

const accessProductCatalogSchema = mongoose.Schema({
    marketplace : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_marketplace' },
    email       : { type: String                        , default: null },
    full_name   : { type: String                        , default: null },
    discounts   : { type: [{
        brand: { type: mongoose.Schema.Types.ObjectId   , default: null, ref: 'back_brand' },
        value: { type: Number                           , default: 0 },
    }], default: [] },
    active_days : { type: Number                        , default: 3 },
    
    created_at  : { type: Date                          , default: Date.now },
    updated_at  : { type: Date                          , default: Date.now },
    deleted_at  : { type: Date                          , default: null }, 
    created_by  : { type: String                        , default: null },
    deleted     : { type: Boolean                       , default: false },
    status      : { type: String                        , default: 'active' },
});
module.exports = mongoose.model('back_access_product_catalog', accessProductCatalogSchema);