let back_customer_populate          = [
	{ path: 'agent'             , match: { status: 'active', deleted: false }, select: 'name email phone photo' },
	{ path: 'shop'              , match: { status: 'active', deleted: false } },
    { path: 'state'             , match: { status: 'active', deleted: false } },
    { path: 'language'          , match: { status: 'active', deleted: false } },
    { path: 'type_business'     , match: { status: 'active', deleted: false } },
    { path: 'customer_type'     , match: { status: 'active', deleted: false } },
    { path: 'product_category'  , match: { status: 'active', deleted: false } }
];
let back_user_populate              = [ 
	{ path: 'role'      , match: { status: 'active', deleted: false }, populate: [
        { path: 'dashboard' , match: { status: 'active', deleted: false } , populate: null },
        { path: 'endpoints' , match: { status: 'active', deleted: false } },
        { path: 'navigation', match: { status: 'active', deleted: false } }
    ] }, 
	{ path: 'customer'  , match: { status: 'active', deleted: false }, populate: null }, 
	{ path: 'agent'     , match: { status: 'active', deleted: false } }
];

let agent_lead_populate             = [
    { path: 'agent'             , match: { status: 'active', deleted: false } }
];
let agent_user_populate             = [
	{ path: 'agentSupports', populate: [
		{ path: 'agent_id', select: 'name email' }
	] }
];

module.exports = {
    back_customer_populate,
    back_user_populate,
    agent_lead_populate,
    agent_user_populate
};