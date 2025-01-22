let back_access_product_catalog_populate        = [
    { path: 'discounts', match: { deleted: false }, populate: [
        { path: 'brand', select: 'name', match: { status: 'active', deleted: false } }
    ] }
];
let back_application_populate                   = [
	{ path: 'role', 	populate: [
        { path: 'endpoints' , match: { status: 'active', deleted: false } }
    ] }
];
let back_country_populate                       = null;
let back_endpoint_populate                      = null;
let back_general_setting_populate               = [
    { path: 'config_basic_data' , populate: [
        { path: 'primary_language', match: { status: 'active', deleted: false }, select: 'name handle code key_code' }
    ]},
    { path: 'navigations'       , populate: [
        { path: 'header', match: { status: 'active', deleted: false }, select: 'name handle sub_navigation', populate: [
            { path: 'sub_navigation', populate: [
                { path: 'navigation_option' , match: { status: 'active', deleted: false }, select: 'category title handle url content_media icon custom_style show open_new_tab sub_navigation_type need_login translate' },
                { path: 'sub_navigation'    , match: { status: 'active', deleted: false }, select: 'category title handle url content_media icon custom_style show open_new_tab sub_navigation_type need_login translate', populate: [
                    { path: 'navigation_option' , match: { status: 'active', deleted: false }, select: 'category title handle url content_media icon custom_style show open_new_tab sub_navigation_type need_login translate' },
                    { path: 'sub_navigation'    , match: { status: 'active', deleted: false }, select: 'category title handle url content_media icon custom_style show open_new_tab sub_navigation_type need_login translate' }
                ]}
            ]}
        ]},
        { path: 'footer', match: { status: 'active', deleted: false }, select: 'name handle sub_navigation', populate: [
            { path: 'sub_navigation', populate: [
                { path: 'navigation_option' , match: { status: 'active', deleted: false }, select: 'category title handle url content_media icon custom_style show open_new_tab sub_navigation_type need_login translate' },
                { path: 'sub_navigation'    , match: { status: 'active', deleted: false }, select: 'category title handle url content_media icon custom_style show open_new_tab sub_navigation_type need_login translate', populate: [
                    { path: 'navigation_option' , match: { status: 'active', deleted: false }, select: 'category title handle url content_media icon custom_style show open_new_tab sub_navigation_type need_login translate' },
                    { path: 'sub_navigation'    , match: { status: 'active', deleted: false }, select: 'category title handle url content_media icon custom_style show open_new_tab sub_navigation_type need_login translate' }
                ]}
            ]}
        ]},
        { path: 'account', match: { status: 'active', deleted: false }, select: 'name handle sub_navigation', populate: [
            { path: 'sub_navigation', populate: [
                { path: 'navigation_option' , match: { status: 'active', deleted: false }, select: 'category title handle url content_media icon custom_style show open_new_tab sub_navigation_type need_login translate' },
                { path: 'sub_navigation'    , match: { status: 'active', deleted: false }, select: 'category title handle url content_media icon custom_style show open_new_tab sub_navigation_type need_login translate', populate: [
                    { path: 'navigation_option' , match: { status: 'active', deleted: false }, select: 'category title handle url content_media icon custom_style show open_new_tab sub_navigation_type need_login translate' },
                    { path: 'sub_navigation'    , match: { status: 'active', deleted: false }, select: 'category title handle url content_media icon custom_style show open_new_tab sub_navigation_type need_login translate' }
                ]}
            ]}
        ]}
    ]},
	{ path: 'slideshows'        , populate: [
        { path: 'home', match: { status: 'active', deleted: false }, select: 'name handle slides navigation' }
    ]},
    { path: 'general_filters'   , match: { status: 'active', deleted: false }, select: 'name handle field brands product_categories product_options tags available translate', populate: [ 
        { path: 'brands'            , match: { status: 'active', deleted: false }, select: 'name handle translate' },
        { path: 'product_categories', match: { status: 'active', deleted: false }, select: 'name handle translate' },
        { path: 'product_options'   , match: { status: 'active', deleted: false }, select: 'name handle translate values', populate: [
            { path: 'values', match: { status: 'active', deleted: false }, select: 'name handle translate' }
        ] },
        { path: 'tags'              , match: { category: 'product', status: 'active', deleted: false }, select: 'name handle translate' }
    ] },
    { path: 'languages'         , match: { status: 'active', deleted: false }, select: 'name handle key_code code flag main' },
    { path: 'pages'             , match: { status: 'active', deleted: false }, select: 'title handle description breadcrumb content header_media base_url url template coming_soon translate' }
];
let back_general_filter_populate                = [ 
    { path: 'product_options'   , match: { status: 'active', deleted: false }, select: 'name handle translate values', populate: [
        { path: 'values', match: { status: 'active', deleted: false }, select: 'name handle translate' }
    ] },
    { path: 'brands'            , match: { status: 'active', deleted: false }, select: 'name handle translate' },
    { path: 'product_categories', match: { status: 'active', deleted: false }, select: 'name handle translate' },
    { path: 'tags'              , match: { category: 'product', status: 'active', deleted: false }, select: 'name handle translate' }
];
let back_language_populate                      = null;
let back_marketplace_populate                   = null;
let back_menu_option_populate                   = null;
let back_role_populate                          = [
    { path: 'dashboard' , populate: null },
    { path: 'endpoints' , match: { status: 'active', deleted: false } },
    { path: 'menu_tree' , populate: [ 
        { path: 'menu_option'   , match: { status: 'active', deleted: false } }, 
        { path: 'sub_navigation'     , populate: [ 
            { path: 'menu_option'   , match: { status: 'active', deleted: false } }, 
            { path: 'sub_navigation'     , populate: [ 
                { path: 'menu_option', match: { status: 'active', deleted: false } 
            } ] } 
        ] } 
    ] }
];
let back_shipping_type_populate                 = null;
let back_shipping_group_populate                = [
    { path: 'shipping_zones', match: { status: 'active', deleted: false }, select: 'marketplace shipping_group shopify_id name handle country_states country_zip_codes standard_rates variant_rates', populate: [
        { path: 'standard_rates', match: { status: 'active', deleted: false }, select: 'marketplace shipping_group shipping_zone shopify_id shipping_type rate_type price min_weight min_total_order effect_on_price need_payment', populate: [
            { path: 'shipping_type', match: { status: 'active', deleted: false }, select: 'name handle category' }
        ] }, 
        { path: 'variant_rates' , match: { status: 'active', deleted: false }, select: 'marketplace shipping_group shipping_zone shopify_id shipping_type rate_type price min_weight min_total_order effect_on_price need_payment', populate: [
            { path: 'shipping_type', match: { status: 'active', deleted: false }, select: 'name handle category' }
        ] }
    ] },
    { path: 'brands'        , match: { status: 'active', deleted: false }, select: 'name handle' }
];
let back_shipping_zone_populate                 = [
    { path: 'standard_rates', match: { status: 'active', deleted: false }, select: 'marketplace shipping_group shipping_zone shopify_id shipping_type rate_type price min_weight min_total_order effect_on_price need_payment' }, 
    { path: 'variant_rates' , match: { status: 'active', deleted: false }, select: 'marketplace shipping_group shipping_zone shopify_id shipping_type rate_type price min_weight min_total_order effect_on_price need_payment' }, 
    { path: 'brands'        , match: { status: 'active', deleted: false }, select: 'name handle' },
];
let back_shipping_rate_populate                 = [
    { path: 'shipping_type', match: { status: 'active', deleted: false }, select: 'name handle' }
];
let back_shipping_tax_populate                  = null;

let agent_category_product_populate             = null;
let agent_customer_type_populate                = null;
let agent_business_type_populate                = null;
let agent_language_populate                     = null;
let agent_shop_populate                         = null;
let agent_state_populate                        = null;

let billing_business_populate                   = null;

module.exports = {
    back_access_product_catalog_populate,
    back_application_populate,
    back_country_populate,
    back_endpoint_populate,
    back_general_setting_populate,
    back_general_filter_populate,
    back_language_populate,
    back_marketplace_populate,
    back_menu_option_populate,
    back_role_populate,
    back_shipping_type_populate,
    back_shipping_group_populate,
    back_shipping_zone_populate,
    back_shipping_rate_populate,
    back_shipping_tax_populate,
    
    agent_category_product_populate,
    agent_customer_type_populate,
    agent_business_type_populate,
    agent_language_populate,
    agent_shop_populate,
    agent_state_populate,

    billing_business_populate
};