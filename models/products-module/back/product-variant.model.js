const mongoose = require('mongoose');

let productVariantSchema = mongoose.Schema({
    marketplace         : { type: mongoose.Schema.Types.ObjectId, default: null,  ref: 'back_marketplace' },
    shopify_id          : { type: Number                        , default: null },
    product_id          : { type: Number                        , default: null },
    sku                 : { type: String                        , default: null },
    reference           : { type: String                        , default: null },
    sku_parent          : { type: {
        sku_type: { type: Number    , default: null }, 
        variant : { type: {
            standard    : { type: String, default: null }, 
            original    : { type: String, default: null }, 
            width_pack  : { type: String, default: null }
        }, default: null }, 
        num_ref : { type: String    , default: null }, 
        brand   : { type: String    , default: null }, 
        country : { type: String    , default: null }, 
        valid   : { type: Boolean   , default: true }
    }, default: null },
    title               : { type: String                        , default: null },
    title_product       : { type: String                        , default: null },
    brand               : { type: {
        name    : { type: String, default: null },
        handle  : { type: String, default: null }
    }, default: null },
    product_category    : { type: {
        name    : { type: String, default: null },
        handle  : { type: String, default: null }
    }, default: null },
    product_type        : { type: {
        name    : { type: String, default: null },
        handle  : { type: String, default: null }
    }, default: null },
    discount_price      : { type: Number                        , default: 0 },
    price               : { type: Number                        , default: 0 },
    compare_at_price    : { type: Number                        , default: 0 },
    options             : { type: [{
        name    : { type: String , default: null }, 
        handle  : { type: String , default: null }, 
        value   : { type: String , default: null },
        url     : { type: String , default: null },
    }], default: [] },
    image               : { type: {
        desktop : { type: { 
            shopify_id      : { type: Number, default: null },
            category        : { type: String, default: null }, 
            alt             : { type: String, default: null }, 
            src             : { type: String, default: null },
            src_collection  : { type: String, default: null },
            width           : { type: Number, default: 1440 }, //1083
            height          : { type: Number, default: 1440 }, //1440
            sizes           : [{ type: Number, default: [1600, 1400, 1200] }]
        }, default: null },
        mobile  : { type: { 
            shopify_id      : { type: Number, default: null },
            category        : { type: String, default: null }, 
            alt             : { type: String, default: null }, 
            src             : { type: String, default: null }, 
            src_collection  : { type: String, default: null },
            width           : { type: Number, default: 480 }, //480
            height          : { type: Number, default: 480 }, //360
            sizes           : [{ type: Number, default: [1000, 800, 700, 600] }]
        }, default: null },
    }, default: null },
    barcode             : { type: String                        , default: null },
    grams               : { type: Number                        , default: 0 },
    weight              : { type: Number                        , default: 0 },
    weight_unit         : { type: String                        , default: null },
    inventory_policy    : { type: String                        , default: null },
    inventory_item_id   : { type: Number                        , default: null },
    requires_shipping   : { type: Boolean                       , default: true },
    inventory_quantity  : { type: Number                        , default: 0 },
    fulfillment_service : { type: String                        , default: null },
    inventory_management: { type: String                        , default: null },
    sort_variant        : { type: Number                        , default: 999999999 },
    warehouse_status    : { type: Boolean                       , default: true }, 
    discounts           : { type: {
        stock   : { type: {
            value       : { type: Number, default: 0 }, 
            min_stock   : { type: Number, default: 0 }
        }, default: { value: 0, min_stock: 0 } },
        sku     : { type: Number, default: null }
    }, default: { stock: { value: 0, min_stock: 0 }, sku: null } },

    created_at          : { type: Date                          , default: Date.now }, 
    updated_at          : { type: Date                          , default: Date.now }, 
    deleted_at          : { type: Date                          , default: null }, 
    deleted             : { type: Boolean                       , default: false },
    status_created      : { type: String                        , default: null },
    status              : { type: String                        , default: 'active' }
});

module.exports = mongoose.model( 'back_product_variant', productVariantSchema );