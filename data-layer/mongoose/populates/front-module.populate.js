let back_navigation_populate                    = [
    { path: 'childrens', match: { status: 'active', deleted: false }, select: 'category title handle url content_media icon show open_new_tab sub_menu_type need_login translate', populate: [
        { path: 'navigation_option' , match: { status: 'active', deleted: false }, select: 'category title handle url content_media icon show open_new_tab sub_menu_type need_login translate' },
        { path: 'childrens'         , match: { status: 'active', deleted: false }, select: 'category title handle url content_media icon show open_new_tab sub_menu_type need_login translate'}
    ]}
];
let back_navigation_option_populate             = null;
let back_page_populate                          = null;
let back_slideshow_populate                     = null;
let back_storefront_theme_populate              = null;

module.exports = {
    back_navigation_populate,
    back_navigation_option_populate,
    back_page_populate,
    back_slideshow_populate,
    back_storefront_theme_populate
};