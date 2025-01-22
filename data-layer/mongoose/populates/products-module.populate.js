let back_additional_product_content_populate    = null;
let back_best_seller_populate                   = [ 
    { path: 'selected_filters', select: 'name handle translate values', match: { status: 'active', deleted: false }, populate: [ 
        { path: 'product_options'     , match: { status: 'active', deleted: false }, select: 'name handle translate values', populate: [
            { path: 'values', select: 'name handle translate', match: { status: 'active', deleted: false } }
        ] },
        { path: 'brands'              , match: { status: 'active', deleted: false }, select: 'name handle translate' },
        { path: 'product_categories'  , match: { status: 'active', deleted: false }, select: 'name handle translate' },
        { path: 'tags'                , match: { category: 'product', status: 'active', deleted: false }, select: 'name handle translate' }
    ]}
];
let back_best_seller_product_populate           = null;
let back_brand_populate                         = null;
let back_product_category_populate              = null;
let back_product_type_populate                  = null;
let back_product_option_populate                = [
    { path: 'values', select: 'name handle translate', match: { status: 'active', deleted: false } }
];
let back_product_option_value_populate          = null;
let back_tag_populate                           = null;
let back_collection_populate                    = [
    { path: 'selected_filters', select: 'name handle translate values', match: { status: 'active', deleted: false }, populate: [ 
        { path: 'product_options'     , match: { status: 'active', deleted: false }, select: 'name handle translate values', populate: [
            { path: 'values', select: 'name handle translate', match: { status: 'active', deleted: false } }
        ] },
        { path: 'brands'              , match: { status: 'active', deleted: false }, select: 'name handle translate' },
        { path: 'product_categories'  , match: { status: 'active', deleted: false }, select: 'name handle translate' },
        { path: 'tags'                , match: { category: 'product', status: 'active', deleted: false }, select: 'name handle translate' }
    ]}
];
let back_product_populate                       = [
    { path: 'variants'          , match: { status: 'active', deleted: false }, options: { sort: { sort_variant: 1 } } },
    { path: 'config_bundle'     , match: { status: 'active', deleted: false } },
    { path: 'config_pre_sale'   , match: { status: 'active', deleted: false } },
    // { path: 'additional_content', match: { status: 'active', deleted: false } }
];
let back_product_variant_populate               = null;
let back_storefront_discount_populate           = [
    { path: 'brand'          , match: { status: 'active', deleted: false }, select: 'name handle' }
];
let agent_discount_populate                     = [
	{ path: 'discounts' , match: { deleted: false }, populate: [
        { path: 'brand', match: { status: 'active', deleted: false }, select: 'name handle' }
    ] }
];
let agent_product_bundle_populate               = [
    { path: 'product', match: { status: 'active', deleted: false } }
];
let agent_product_pre_sale_populate             = [
    { path: 'product', match: { status: 'active', deleted: false } }
];

module.exports = {
    back_additional_product_content_populate,
    back_best_seller_populate,
    back_best_seller_product_populate,
    back_brand_populate,
    back_product_category_populate,
    back_product_type_populate,
    back_product_option_populate,
    back_product_option_value_populate,
    back_tag_populate,
    back_collection_populate,
    back_product_populate,
    back_product_variant_populate,
    back_storefront_discount_populate,
    agent_discount_populate,
    agent_product_bundle_populate,
    agent_product_pre_sale_populate
};