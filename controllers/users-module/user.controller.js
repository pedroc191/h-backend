// =============================================================================
// PACKAGES
// =============================================================================
const bcrypt        = require('bcrypt');
const jwt           = require('jsonwebtoken');
const mongoose      = require('mongoose');

// =============================================================================
// HELPERS
// =============================================================================
const h_format      = require('../../helpers/format');
const h_validation  = require('../../helpers/validation');
const h_response    = require('../../helpers/response');
const h_array       = require('../../helpers/array');
// =============================================================================
// CONFIGURATION
// =============================================================================
const config_encrypted_keys  = require('../../config/encrypted-keys');
// =============================================================================
// SERVICES
// =============================================================================
const {
    backUserService,
    backCustomerService,
    backCartService,
    backAffiliateService,
    backProductService,
    agentDiscountService,
    backStorefrontService
} = require('../../services/manager');
// =============================================================================
// REST FUNCTIONS
// =============================================================================
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function login(req, res){
    
    try {
        let format_data = [
            h_format.objectValidField( 'storefront' , h_validation.evalString( req.body.storefront, null )  , h_format.fields.types.string.name, h_format.fields.types.string.operators.not_equal, '' ),
            h_format.objectValidField( 'email'      , h_validation.evalString( req.body.email, '' )         , h_format.fields.types.string.name, h_format.fields.types.string.operators.not_equal, '' ),
            h_format.objectValidField( 'password'   , h_validation.evalString( req.body.password, '' )      , h_format.fields.types.string.name, h_format.fields.types.string.operators.not_equal, '' ),
        ];
        format_data     = h_validation.evalFields( req.body, format_data );
        
        if( format_data.is_valid ){
            
            format_data.body_object.email   = format_data.body_object.email.toLowerCase();
            let storefront_result           = format_data.body_object.storefront != null ? await backStorefrontService.findOne({ marketplace: req.auth.marketplace, handle: format_data.body_object.storefront, status: 'active' }) : { success: true, body: { _id: null } };
            if( storefront_result.success && storefront_result.body != null ){

                console.log( { marketplace: req.auth.marketplace, storefront: ( storefront_result.body?._id ? storefront_result.body._id.toString() : null ), customer: { $ne: null }, email: format_data.body_object.email } );
                let user_result = await backUserService.findOne({ marketplace: req.auth.marketplace, storefront: ( storefront_result.body?._id ? storefront_result.body._id.toString() : null ), customer: { $ne: null }, email: format_data.body_object.email });
            
                if( user_result.success && user_result.body != null && bcrypt.compareSync(format_data.body_object.password, user_result.body.password) ){
                    
                    let token_data      = { 
                        user    : user_result.body._id, 
                        email   : user_result.body.email, 
                        access  : {  
                            role        : user_result.body.role._id.toString(),
                            storefront  : storefront_result.body?._id ? storefront_result.body._id.toString() : null, 
                            is_app      : false 
                        }
                    };
                    const token_login   = jwt.sign( token_data, config_encrypted_keys.session );
                    backUserService.update({ _id: user_result.body._id }, { token_login: token_login });
                    
                    
                    let login_data = { 
                        user        : {
                            _id				: user_result.body._id.toString(),
                            name			: `${ user_result.body.first_name } ${ user_result.body.last_name }`,
                            email	        : user_result.body.email,
                            phone           : user_result.body.customer.phone ? user_result.body.customer.phone.number : null,
                            profile_image	: user_result.body.customer.profile_image,
                            token_login     : token_login
                        },
                        customer    : {
                            _id                 : user_result.body.customer._id.toString(),
                            shopify_id          : user_result.body.customer.shopify_id,
                            agent               : user_result.body.customer.agent,
                            agent_email         : user_result.body.customer.agent_email,
                            first_name          : user_result.body.customer.first_name,
                            last_name           : user_result.body.customer.last_name,
                            full_name           : user_result.body.customer.full_name,
                            email               : user_result.body.customer.email,
                            phone               : user_result.body.customer.phone ? user_result.body.customer.phone.number : null,
                            addresses           : user_result.body.customer.addresses.map( (item) => {
                                
                                item.phone = item.phone ? item.phone.number : ( user_result.body.customer.phone ? user_result.body.customer.phone.number : null );
                                return item;
                            }),
                            is_dropshipping     : user_result.body.customer.is_dropshipping,
                            special_shippings   : user_result.body.customer.special_shippings,
                            tax_exempt          : user_result.body.customer.tax_exempt,
                        },
                        cart        : null
                    };
                    if( ['wholesale', 'app-wholesale'].includes( req.auth.application_type ) ){
                        
                        let discount_result = await agentDiscountService.findOne({ customer: user_result.body.customer._id.toString(), status: 'active' });
                        
                        if( discount_result.success ){
                            
                            let db_discounts = h_format.DBDiscountBrands( req.auth.application_type, discount_result.body?.discounts || [] );

                            let cart_result = await cartProducts( req, user_result.body._id, user_result.body.customer._id, db_discounts );
                            if( cart_result.success ){
                                
                                login_data = {
                                    ...login_data,
                                    ...cart_result.body
                                };
                                res.status(200).json( h_response.request( true, login_data, 200, 'Success: User Login', `Welcome ${ user_result.body.customer.first_name } ${ user_result.body.customer.last_name }` ) );
                            }
                            else{
                                
                                res.status(400).send( cart_result );
                            }
                        }
                        else{
                            
                            res.status(400).send( h_response.request( false, discount_result, 400, 'Error: User Login', 'Discounts not found' ) );
                        }
                    }
                    else if( ['storefront', 'app-storefront'].includes( req.auth.application_type ) ){
                        
                        let cart_result = await cartProducts( req, user_result.body._id, user_result.body.customer._id, [] );
                        if( cart_result.success ){
                            
                            login_data = {
                                ...login_data,
                                ...cart_result.body
                            };
                            res.status(200).json( h_response.request( true, login_data, 200, 'Success: User Login', `Welcome ${ user_result.body.customer.first_name } ${ user_result.body.customer.last_name }` ) );
                        }
                        else{
                            
                            res.status(400).send( cart_result );
                        }
                    }
                    else{
                        
                        res.status(200).json( h_response.request( true, login_data, 200, 'Success: User Login', `Welcome ${ user_result.body.customer.first_name } ${ user_result.body.customer.last_name }` ) );
                    }
                }
                else{

                    let message_error = '';
                    if( user_result.body?.status === 'inactive' ){

                        message_error = `Inactive customer to interact with the store, please contact ${ ['wholesale', 'app-wholesale'].includes( req.auth.application_type ) ? 'your sales agent' : 'the store support' }`;
                    }
                    else if ( ( user_result.success && user_result.body === null ) || ( user_result.success && user_result.body != null && !bcrypt.compareSync(format_data.body_object.password, user_result.body.password) ) ){

                        message_error = 'Invalid Credentials';
                    }
                    else{

                        message_error = 'User not found';
                    }
                    res.status(400).send( h_response.request( false, user_result, 400, 'Error: User Login', message_error ) );
                }
            }
            else{
                
                res.status(400).send( h_response.request(false, storefront_result, 400, 'Error: User Login', 'Storefront not found' ) );
            }
        }
        else{
            
            res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: User Login', `User not login, fields required not validated` ) );
        }
    } catch (process_error) {
        
        res.status(400).send( h_response.request( false, process_error, 400, 'Error: User Login', 'User not login, process failed' ) );
    }
};
async function logout(req, res){
    
    try {
        let format_data = [
            h_format.objectValidField( 'token'      , h_validation.evalString( req.body.token, '' ) , h_format.fields.types.string.name, h_format.fields.types.string.operators.not_equal, '' ),
        ];
        format_data = h_validation.evalFields( req.body, format_data );
        
        if( format_data.is_valid ){
            
            let data_token      = await jwt.verify( format_data.body_object.token, config_encrypted_keys.session, { ignoreExpiration: true });
            let user_updated    = await backUserService.update({ storefront: data_token.access.storefront, marketplace: req.auth.marketplace, customer: { $ne: null }, email: data_token.email }, { token_login: null });
            
            if( user_updated.success ){
                
                res.status(200).json( h_response.request( true, user_updated, 200, 'Success: User Logout', '' ) );
            }
            else{
                
                res.status(400).send( h_response.request( false, user_updated, 400, 'Error: User Logout', 'An unexpected error has occurred, please try again.' ) );
            }
        }
        else{
            
            res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: User Logout', `User not logout, fields required not validated` ) );
        }
    } catch (process_error) {
        
        res.status(400).send( h_response.request( false, process_error, 400, 'Error: User Logout', 'User not logout, process failed' ) );
    }
};
async function create(req, res){
    
    try {
        let format_data = [
            h_format.objectValidField( 'role'       , h_validation.evalString( req.body.role, '' )      , h_format.fields.types.string.name, h_format.fields.types.string.operators.not_equal, '' ),
            h_format.objectValidField( 'first_name' , h_validation.evalString( req.body.first_name, '' ) , h_format.fields.types.string.name, h_format.fields.types.string.operators.not_equal, '' ),
            h_format.objectValidField( 'last_name'  , h_validation.evalString( req.body.last_name, '' )  , h_format.fields.types.string.name, h_format.fields.types.string.operators.not_equal, '' ),
            h_format.objectValidField( 'email'      , h_validation.evalString( req.body.email, '' )      , h_format.fields.types.string.name, h_format.fields.types.string.operators.not_equal, '' ),
            h_format.objectValidField( 'password'   , h_validation.evalString( req.body.password, '' )   , h_format.fields.types.string.name, h_format.fields.types.string.operators.not_equal, '' ),
        ];
        format_data = h_validation.evalFields( req.body, format_data );
        
        if( format_data.is_valid ){
            
            let user_result = await backUserService.findOne({ marketplace: req.auth.marketplace, email: format_data.body_object.email.toLowerCase() });
            
            if( user_result.success && user_result.body === null ){
                
                let user_created = await backUserService.create(format_data.body_object);
                
                if( user_created.success ){
                    
                    res.status(200).json( h_response.request( true, user_created.body, 200, 'Success: User Create', 'User created successfully' ) );
                }
                else{
                    
                    res.status(400).send( h_response.request( false, user_created, 400, 'Error: User Create', 'User not created' ) );
                }
            }
            else if ( !user_result.success ){
                
                res.status(400).send( h_response.request( false, user_result, 400, 'Error: User Create', 'User not created, user find failed' ) );
            }
            else{
                
                res.status(400).send( h_response.request( false, user_result, 400, 'Error: User Create', 'User already exist' ) );
            }
        }
        else{
            
            res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: User Create', `User not created, fields required not validated` ) );
        }
    } catch (process_error) {
        
        res.status(400).send( h_response.request( false, process_error, 400, 'Error: User Create', 'User not created, process failed' ) );
    }
};
async function update(req, res){

    try {
        let format_data = [
            h_format.objectValidField( 'id_email'   , h_validation.evalString( req.body.id_email, '' )  , h_format.fields.types.string.name, h_format.fields.types.string.operators.not_equal, '' ),
            h_format.objectValidField( 'first_name' , h_validation.evalString( req.body.first_name, '' ) , h_format.fields.types.string.name, h_format.fields.types.string.operators.not_equal, '' ),
            h_format.objectValidField( 'last_name'  , h_validation.evalString( req.body.last_name, '' )  , h_format.fields.types.string.name, h_format.fields.types.string.operators.not_equal, '' ),
        ];
        format_data = h_validation.evalFields( req.body, format_data );
        
        if( format_data.is_valid ){
            
            let find_query = h_format.findQuery( format_data.body_object.id_email, 'shopify_id', 'email' );   
            let data_update = { 
                first_name  : format_data.body_object.first_name, 
                last_name   : format_data.body_object.last_name
            };
            let user_updated = await backUserService.update(find_query, data_update);
            
            if( user_updated.success ){
                
                res.status(200).json( h_response.request( true, user_updated.body, 200, 'Success: User Update', 'User updated' ) );
            }
            else{
                
                res.status(400).send( h_response.request( false, user_updated, 400, 'Error: User Update', 'User not updated' ) );
            }
        }
        else{
            
            res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: User Update', `User not updated, fields required not validated` ) );
        }
    } catch (process_error) {
        
        res.status(400).send( h_response.request( false, process_error, 400, 'Error: User Update', 'User not updated, process failed' ) );
    }
};
async function updateStatus(req, res){

    try {
        let format_data = [
            h_format.objectValidField( 'id_email'   , h_validation.evalString( req.body.id_email, '' )  , h_format.fields.types.string.name, h_format.fields.types.string.operators.not_equal, '' ),
            h_format.objectValidField( 'status'     , h_validation.evalString( req.body.status, '' )     , h_format.fields.types.string.name, h_format.fields.types.string.operators.not_equal, '' ),
        ];
        format_data = h_validation.evalFields( req.body, format_data );
        
        if( format_data.is_valid ){
            
            let find_query      = h_format.findQuery( format_data.body_object.id_email, 'shopify_id', 'email' );
            let user_updated    = await backUserService.updateStatus(find_query, format_data.body_object.status);
            
            if( user_updated.success ){
                
                let customer_updated = await backCustomerService.update(find_query, { disabled_store: format_data.body_object.status === 'active' ? false : true });
                if (customer_updated.success) {
                    
                    res.status(200).json( h_response.request( true, user_updated.body, 200, 'Success: User Update', 'User updated' ) );
                }
                else {
                    
                    res.status(400).send( h_response.request( false, customer_updated, 400, 'Error: User Update', 'Customer not updated' ) );
                }
            }
            else{
                
                res.status(400).send( h_response.request( false, user_error, 400, 'Error: User Update', 'User not updated' ) );
            }
        }
        else{
            
            res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: User Update', `User not updated, fields required not validated` ) );
        }
    } catch (process_error) {
        
        res.status(400).send( h_response.request( false, process_error, 400, 'Error: User Update', 'User not updated, process failed' ) );
    }
};
async function updatePassword(req, res){

    try {
        let format_data = [
            h_format.objectValidField( 'id_email', h_validation.evalString( req.body.email, '' )    , h_format.fields.types.string.name, h_format.fields.types.string.operators.not_equal, '' ),
            h_format.objectValidField( 'password', h_validation.evalString( req.body.password, '' )  , h_format.fields.types.string.name, h_format.fields.types.string.operators.not_equal, '' ),
        ];
        format_data = h_validation.evalFields( req.body, format_data );
        
        if( format_data.is_valid ){
            
            let find_query      = h_format.findQuery( format_data.body_object.id_email, 'shopify_id', 'email' );
            let user_result = await backUserService.findOne( find_query );
            
            if( user_result.success ){
                
                let user_updated = await backUserService.update(find_query, { password: format_data.body_object.password });
                
                if( user_updated.success ){
                    
                    res.status(200).json( h_response.request( false, user_updated.body, 200, 'Success: Password Update', 'User updated successfully' ) );
                }
                else{
                    
                    res.status(400).send( h_response.request( false, user_updated, 400, 'Error: Password Update', 'User not updated' ) );
                }
            }
            else{
                
                res.status(400).send( h_response.request( false, user_result, 400, 'Error: Password Update', 'Password not Updated, user not found' ) );
            }
        }
        else{
            
            res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Password Update', `Password not updated, fields required not validated` ) );
        }
    } catch (process_error) {
        
        res.status(400).send( h_response.request( false, process_error, 400, 'Error: User Update', 'User not updated, process failed' ) );
    }
};
async function findAgentCustomerLead(req, res){
    
    try {
        let format_data = [
            h_format.objectValidField( 'email', h_validation.evalString( req.body.email, '' )    , h_format.fields.types.string.name, h_format.fields.types.string.operators.not_equal, '' ),
        ];
        format_data = h_validation.evalFields( req.body, format_data );
        
        if( format_data.is_valid ){
            
            let customer_result = await backCustomerService.findOne({ email: req.body.email }, { agent: 1 });
            
            if( customer_result.success && customer_result.body?.agent != null ){
                
                res.status(200).json( h_response.request( true, { agent: customer_result.body.agent }, 200, 'Success: Customer Find', 'Customer found' ) );
            }
            else if( customer_result.success && customer_result.body?.agent === null ){
                
                let lead_result = await agentLeadService.findOne({ email: req.body.email }, { agent: 1 });
                
                if( lead_result.success && lead_result.body?.agent != null ){
                    
                    res.status(200).json( h_response.request( true, { agent: lead_result.body.agent }, 200, 'Success: Lead Find', 'Lead found' ) );
                }
                else if( lead_result.success && lead_result.body?.agent === null ){
                    
                    res.status(200).json( h_response.request( true, { agent: null }, 200, 'Success: Lead Find', 'Lead not found' ) );
                }
                else{
                    
                    res.status(400).send( h_response.request( false, lead_result, 400, 'Error: Lead Find', 'Lead not found' ) );
                }
            }
            else{
                
                res.status(400).send( h_response.request( false, customer_result, 400, 'Error: Customer Find', 'Customer not found' ) );
            }
        }
        else{
            
            res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Customer Find', `Customer not found, fields required not validated` ) );
        }
    } catch (process_error) {
        
        res.status(400).send( h_response.request( false, process_error, 400, 'Error: User Update', 'User not updated, process failed' ) );
    }
};
// =============================================================================
// GENERAL FUNCTIONS
// =============================================================================
/**
* 
* @param {*} req 
* @param {*} user_id 
* @param {*} customer_id 
* @param {*} all_discounts 
* @param {*} action 
* @param {*} array_products 
* @returns 
*/
async function cartProducts( req, user_id, customer_id, all_discounts ){
    
    try {
        let cart_result         = await backCartService.findOne( user_id ? { user: user_id } : { customer: customer_id });
        let affiliate_result    = await h_format.affiliateDiscounts( req.auth, req.query.affiliate, backAffiliateService );
        
        if( cart_result.success && cart_result.body && affiliate_result.success ){
            
            let cart_products   = h_validation.evalArray( cart_result.body?.products );
            let cart_save_later = h_validation.evalArray( cart_result.body?.save_later );
            let cart_coupon     = h_validation.evalObject( cart_result.body?.coupon, null );
            
            let id_products = h_array.sort( cart_products.concat( cart_save_later ), 'product_id' ).reduce( (previous_item, current_item) =>{ 
                
                if( previous_item.length === 0 || previous_item[previous_item.length - 1] != current_item.product_id ){ 
                    
                    previous_item.push( current_item.product_id ); 
                } 
                return previous_item; 
            }, []);
            
            let product_result = await backProductService.find({ shopify_id: { $in: id_products }, status: 'active' });
            
            if( product_result.success ){
                
                if( cart_coupon && ( cart_coupon?.status != 'active' || cart_coupon?.deleted || ( cart_coupon?.limitTimes > 0 && cart_coupon?.usedTimes === cart_coupon?.limitTimes ) || ( cart_coupon?.expireDate != null && cart_coupon?.expireDate < new Date() ) ) ){
                    
                    cart_coupon = null;
                }
                let format_cart = h_format.cartObject( req.auth.application_type, [], { affiliate: affiliate_result.body, brand_discounts: all_discounts, coupon: cart_coupon, db_products: product_result.body, db_cart: cart_products, db_save_later: cart_save_later } );
                
                format_cart.body = {
                    cart: {
                        products: format_cart.body.cart.products.front_end,
                        details: format_cart.body.cart.details,
                    },
                    save_later: {
                        products: format_cart.body.save_later.products.front_end,
                        details: format_cart.body.save_later.details,
                    },
                    coupon: format_cart.body.coupon
                };
                return format_cart;
            }
            else{
                
                return h_response.request( false, product_result, 400, 'Error: Cart find', 'Cart products not found' );
            }
        }
        else if( !affiliate_result.success ){
            
            return h_response.request( false, affiliate_result, 400, 'Error: Cart find', 'Affiliate not found' );
        }
        else{
            
            return h_response.request( false, cart_result, 400, 'Error: Cart find', 'Cart not found' );
        }
    } catch (process_error) {
        
        return h_response.request( false, process_error, 400, 'Error: Cart find', 'Cart not process' );
    }
};
// =============================================================================
// EXPORTS
// =============================================================================
module.exports = {
    get:{
    },
    post:{
        login,
        logout,
        create,
        findAgentCustomerLead
    },
    put:{
        update,
        updateStatus,
        updatePassword
    },
    delete:{
    }
};