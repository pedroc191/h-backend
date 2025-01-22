const mongoose      = require('mongoose');

let productSchema = mongoose.Schema({
    marketplace         : { type: mongoose.Schema.Types.ObjectId    , default: null, ref: 'back_marketplace' },
    product_origin      : { type: String                            , default: null },
    shopify_id          : { type: Number                            , default: null },
    collections         : [{ type: mongoose.Schema.Types.ObjectId   , default: null, ref: 'back_collection' }],
    default_sort        : { type: Number                            , default: 999999999 },
    is_best_seller      : { type: Boolean                           , default: false },
    title               : { type: String                            , default: null },
    description         : { type: String                            , default: null },
    handle              : { type: String                            , default: null },
    tags                : { type: [{
        name    : { type: String, default: null },
        handle  : { type: String, default: null }
    }], default: [] },
    variant_titles      : [{ type: String, default: null }],
    translate           : { type: [{
        language    : { type: String, default: 'es-CO' },
        title       : { type: String, default: null },
        description : { type: String, default: null },
        search_field: { type: String, default: null },
    }], default: [] },
    images              : { type: [{
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
    }], default: [] },
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
    sort_category       : { type: Number                            , default: null },
    options             : { type: [{
        name        : { type: String , default: null },
        handle      : { type: String , default: null },
        values      : { type: [{
            name    : { type: String , default: null },
            handle  : { type: String , default: null },
            skus    : [{ type: String, default: null }],
            url     : { type: String, default: null },
            total_stock : { type: Number, default: 0 },
        }], default: [] },
        total_stock : { type: Number, default: 0 },
    }], default: [] },
    variants            : [{ type: mongoose.Schema.Types.ObjectId   , default: null, ref: 'back_product_variant' }],
    config_bundle       : { type: mongoose.Schema.Types.ObjectId    , default: null, ref: 'agent_product_bundle' },
    config_pre_sale     : { type: mongoose.Schema.Types.ObjectId    , default: null, ref: 'agent_product_pre_sale' },
    search_field        : { type: String                            , default: "" },
    total_stock         : { type: Number                            , default: 0 },
    max_stock           : { type: Number                            , default: 0 },
    moq                 : { type: Number                            , default: 0 },
    sales_limit         : { type: Number                            , default: 0 },
    custom_badges       : { type: {
        new_product : { type: Boolean, default: false },
        best_seller : { type: Boolean, default: false },
        exclusive   : { type: Boolean, default: false },
        pre_sale    : { type: Boolean, default: false },
        sold_out    : { type: Boolean, default: false },
        on_sale     : { type: Boolean, default: false },
        others      : [{ type: String, default: null }]
    }, default: null },
    total_weight        : { type: Number                            , default: 0 },
    discount_price      : { type: {
        min_price: { type: Number, default: 0 },
        max_price: { type: Number, default: 0 }
    }, default: { min_price: 0, max_price: 0 } },
    price               : { type: {
        min_price: { type: Number, default: 0 },
        max_price: { type: Number, default: 0 }
    }, default: { min_price: 0, max_price: 0 } },
    compare_at_price    : { type: {
        min_price: { type: Number, default: 0 },
        max_price: { type: Number, default: 0 }
    }, default: { min_price: 0, max_price: 0 } }, 
    discounts           : { type: {
        brand           : { type: Number, default: null }, 
        stock           : { type: {
            apply       : { type: Boolean   , default: false },
            min_stock   : { type: Number    , default: 0 },
            value       : { type: Number    , default: 0 }
        }, default: { apply: false, min_stock: 0, value: 0 } },
        affiliate       : { type: Number, default: 0 },
        product         : { type: Number, default: 0 },
        pre_sale        : { type: Number, default: 0 }
    }, default: { brand: 0, variant_stock: false, affiliate: 0, product: 0, pre_sale: 0 } },
    reference           : { type: String                            , default: null },
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
    additional_content  : [{ type: mongoose.Schema.Types.ObjectId   , default: null, ref: 'back_additional_product_content' }],
    published_at        : { type: Date                              , default: null },
    features            : { type: [{
        strap_type                  : { type: {
            name    : { type: String, default: null },
            handle  : { type: String, default: null },
        }, default: null }, 
        bust_type                   : { type: {
            name    : { type: String, default: null },
            handle  : { type: String, default: null },
        }, default: null }, 
        closure_type                : { type: {
            name    : { type: String, default: null },
            handle  : { type: String, default: null },
        }, default: null }, 
        crotch_type                 : { type: {
            name    : { type: String, default: null },
            handle  : { type: String, default: null },
        }, default: null }, 
        back_type                   : { type: {
            name    : { type: String, default: null },
            handle  : { type: String, default: null },
        }, default: null }, 
        butt_material               : { type: {
            name    : { type: String, default: null },
            handle  : { type: String, default: null },
        }, default: null }, 
        external_material           : { type: {
            name    : { type: String, default: null },
            handle  : { type: String, default: null },
        }, default: null }, 
        inner_material              : { type: {
            name    : { type: String, default: null },
            handle  : { type: String, default: null },
        }, default: null }, 
        complementary_inner_material: { type: [{
            name    : { type: String, default: null },
            handle  : { type: String, default: null },
        }], default: null }, 
        uses                        : { type: [{
            name    : { type: String, default: null },
            handle  : { type: String, default: null },
        }], default: null }, 
        category_type               : { type: {
            name    : { type: String, default: null },
            handle  : { type: String, default: null },
        }, default: null }, 
        silhouette                  : { type: Number, default: null }, 
        leg_lenght                  : { type: {
            name    : { type: String, default: null },
            handle  : { type: String, default: null },
        }, default: null }, 
    }], default: null },
    approved_features   : { type: Boolean                           , default: false },
    warehouse_status    : { type: Boolean                           , default: true },

    created_at          : { type: Date                              , default: Date.now }, 
    updated_at          : { type: Date                              , default: Date.now }, 
    deleted_at          : { type: Date                              , default: null }, 
    deleted             : { type: Boolean                           , default: false },
    status_created      : { type: String                            , default: null },
    status              : { type: String                            , default: 'active' }
});

module.exports = mongoose.model( 'back_product', productSchema );