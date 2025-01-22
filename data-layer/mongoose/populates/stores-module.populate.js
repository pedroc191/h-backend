let back_affiliate_populate                 = null;
let back_buy_again_populate                 = null;
let back_cart_populate                      = [
	{ path: 'coupon'    , match: { status: 'active', deleted: false }, select: 'name typeCoupon fixedMount discount applyEligibility limitTimes usedTimes expireDate', populate: [
        { path: 'applyEligibility.brand'    , match: { status: 'active', deleted: false }, select: 'name handle' },
        { path: 'applyEligibility.product'  , match: { status: 'active', deleted: false }, select: 'shopify_id handle' },
	] },
    { path: 'affiliate' , match: { status: 'active', deleted: false }, select: 'code commision discount' }
];
let back_draft_order_populate               = null;
let back_order_populate                     = [
    { path: 'customer'  , populate: { path: 'agent', select: 'name email phone photo' } },
    { path: 'coupon' },
    { path: 'business' },
    { path: 'line_items', select: 'shopify_id product_id sku name brand product_type grams quantity price total_taxes total_discount refunded' }
];
let back_order_line_item_populate           = null;
let back_preorder_populate                  = [
    { 
		path: 'customer', select: 'shopify_id full_name email phone agent', match: { status: 'active', deleted: false }, populate: [
			{ path: 'agent', select: 'name email phone notification agentSupports', match: { notification: true, status: 'active', deleted: false }, populate: [
				{ path: 'agentSupports', populate: [
					{ path: 'agent_id', select: 'name email phone', match: { status: 'active', deleted: false }, }
				] } 
			] }
		]
	},
    { path: 'advance_order' },
    { path: 'complete_order' },
    {
        path: 'product_bundle',
        match: { status: 'active', deleted: false },
        populate: [
            { 
                path: 'product', 
                match: { $and: [ { status: 'active' }, { status_created: 'active' }, { deleted: false } ] }, 
                select: 'shopify_id title handle price images brand varaints',
                populate: {
                    path: 'variants'
                }
            },
            { 
                path: 'selected_variants', 
                populate: { 
                    path: 'variant', 
                    match: { $and: [ { status: 'active' }, { status_created: 'active' }, { deleted: false } ] }, 
                    select: 'shopify_id sku image'
                }
            },
            { path: 'config_pre_sale' }
        ]
    },
    { path: 'line_items' }
];
let back_preorder_item_populate             = null;
let back_storefront_transaction_populate    = null;
let back_storefront_populate                = [
    { path: 'theme', match: { status: 'active', deleted: false }, select: 'name handle colors_schema' },
    { path: 'slideshow', match: { status: 'active', deleted: false }, select: 'name handle slides navigation' },
    { path: 'commissions', match: { status: 'active', deleted: false }, select: 'discounts', populate: [
        { path: 'discounts' , match: { deleted: false }, populate: [
            { path: 'brand', match: { status: 'active', deleted: false }, select: 'name handle' }
        ] }
    ]}
];
let agent_coupon_populate           = [
    { path: 'applyEligibility.brand'    , match: { status: 'active', deleted: false } },
    { path: 'applyEligibility.product'  , match: { status: 'active', deleted: false } }
];

let billing_invoice_populate        = [
    { path: 'business'                  , match: { status: 'active', deleted: false } },
    { path: 'customer'                  , match: { status: 'active', deleted: false } , populate: [
        { path: 'agent'             , match: { status: 'active', deleted: false }, select: 'name email phone photo' },
        { path: 'shop'              , match: { status: 'active', deleted: false } },
        { path: 'state'             , match: { status: 'active', deleted: false } },
        { path: 'language'          , match: { status: 'active', deleted: false } },
        { path: 'type_business'     , match: { status: 'active', deleted: false } },
        { path: 'customer_type'     , match: { status: 'active', deleted: false } },
        { path: 'product_category'  , match: { status: 'active', deleted: false } }
    ] },
    { path: 'order'                     , match: { status: 'active', deleted: false } , populate: [
        { path: 'customer', populate: { path: 'agent' } },
        { path: 'coupon' },
        { path: 'business' },
        { path: 'line_items' }
    ] },
    { path: 'counpon_id'                , match: { status: 'active', deleted: false } , populate: [
        { path: 'applyEligibility.brand'    , match: { status: 'active', deleted: false } },
        { path: 'applyEligibility.product'  , match: { status: 'active', deleted: false } }
    ] }
];
let billing_payment_populate        = [
    { path: 'business'                  , match: { status: 'active', deleted: false } },
    { path: 'customer'                  , match: { status: 'active', deleted: false } , populate: [
        { path: 'agent'             , match: { status: 'active', deleted: false }, select: 'name email phone photo' },
        { path: 'shop'              , match: { status: 'active', deleted: false } },
        { path: 'state'             , match: { status: 'active', deleted: false } },
        { path: 'language'          , match: { status: 'active', deleted: false } },
        { path: 'type_business'     , match: { status: 'active', deleted: false } },
        { path: 'customer_type'     , match: { status: 'active', deleted: false } },
        { path: 'product_category'  , match: { status: 'active', deleted: false } }
    ] }
];

module.exports = {
    back_affiliate_populate,
    back_buy_again_populate,
    back_cart_populate,
    back_draft_order_populate,
    back_order_populate,
    back_order_line_item_populate,
    back_preorder_populate,
    back_preorder_item_populate,
    back_storefront_transaction_populate,
    back_storefront_populate,

    agent_coupon_populate,
    
    billing_invoice_populate,
    billing_payment_populate
};