// =============================================================================
// PACKAGES
// =============================================================================
const mongoose      = require('mongoose');
const moment        = require('moment');
const cryptoJS 	    = require("crypto-js");
// =============================================================================
// HELPERS
// =============================================================================
const h_response    = require('../../helpers/response');
const h_file        = require('../../helpers/file');
const h_validation  = require('../../helpers/validation');
const h_format      = require('../../helpers/format');
const h_crud        = require('../../helpers/crud');
const h_shopify     = require('../../helpers/shopify');
const h_excel        = require('../../helpers/excel');
// =============================================================================
// CONFIGURATION
// =============================================================================
const config_credentials   = require('../../config/credentials');
// =============================================================================
// SERVICES
// =============================================================================
const {
    backCustomerService,
    backUserService,
    billingBusinessService,
    backGeneralSettingService,
    agentDiscountService,
    backBuyAgainService,
    backBestSellerService,
    backOrderService,
    backStorefrontService,
    agentUserService,
    backAffiliateService
} = require('../../services/manager');
const shopify       = require('../../services/marketplace/shopify');
const billing       = require('../../services/2b-apps/billing');
// =============================================================================
// SHOPIFY INSTANCE
// =============================================================================
const api_shopify 	= shopify.init( config_credentials.shopify.shop_us );
// =============================================================================
// REST FUNCTIONS
// =============================================================================
async function createAdmin(req, res){
    try {
        let business_result = await billingBusinessService.find({ type: "main" });
        if( business_result.sucess ){
            
            req.body.customer.shop = business_result.body.find( (item) => item.name === req.body.store === "Silvia Cobos" ? "VIDA LEATHER LLC" : "PLN DISTRIBUTIONS LLC" )._id.toString();
            req.body.customer.agent_email = req.body.agent_email;
            req.body.customer.store = req.body.store;
            req.body.customer.is_admin = req.body.is_admin;
            
            await create(req, res);
        }
        else{
            
            res.status(400).send( h_response.request( false, business_result, 400, "Error: Customer Create", "Customer not created" ) );
        }
    } catch (process_error) {
        
        res.status(400).send( h_response.request( false, process_error, 400, "Error: Customer Create", "Customer not created" ) );
        
    }
};
async function create(req, res){
    
    try {
        
        let valid_result = validDataCustomer( req, 'create' );
        
        if( valid_result.is_valid ){
            
            valid_result.body_object.basic_data_customer.address = valid_result.body_object.address;
            let exist_customer = await validExistCustomer( req, false, valid_result.body_object.basic_data_customer );
            
            if( exist_customer.success ){
                
                let shopify_result = await createShopifyCustomer( valid_result.body_object.basic_data_customer );
                
                if( shopify_result.success ){
                    
                    let customer_result = await createDBCustomerUser( req, valid_result.body_object.basic_data_customer, shopify_result.body.shopify_customer );
                    
                    if( customer_result.success ){
                        
                        let category_settings   = valid_result.body_object.basic_data_customer.is_wholesale ? 'wholesale' : 'storefront';
                        let clean_best_sellers  = h_shopify.data_base.format.bestSellerTemplateObject( req.auth.marketplace, exist_customer.body.general_settings.config_best_seller.find( (item) => item.category === category_settings ), { shopify_id: create_db_result.body.customer_db.shopify_id }, null, null, null, true);
                        
                        await agentDiscountService.create({ customer: customer_result.body.customer_db._id, discounts: [] }).catch( (discount_error) => {});
                        
                        await backBuyAgainService.create({ marketplace: req.auth.marketplace, customer_id: customer_result.body.customer_db.shopify_id }).catch( (buy_again_error) => {});
                        
                        await backBestSellerService.create( clean_best_sellers.document ).catch( (best_seller_error) => {});
                        
                        await billing.post.createStatement( { idCustomer: customer_result.body.customer_db._id } ).catch( (billing_error) => {});
                        
                        res.status(200).json( h_response.request( true, { shopify_customer: shopify_customer, db_customer: customer_result.body.customer_db, db_user: customer_result.body.user_db }, 200, "Success: Customer Create", "Customer and User created" ) );
                    }
                    else{
                        
                        res.status(400).send( customer_result );
                    }
                }
                else{
                    
                    res.status(400).send( shopify_result );
                }
            }
            else{
                
                res.status(400).send( exist_customer );
            }
        }
        else{
            
            res.status(400).send( h_response.request( false, format_basic_data_customer.error_fields.concat( format_address.error_fields ), 400, 'Error: Validate Data', 'Customer fields required not validated' ) );
        }
    } catch (process_error) {
        
        res.status(400).send( h_response.request( false, process_error, 400, "Error: Customer Create", "Customer not created" ) );
    }
};
async function update(req, res){
    
    try {
        let valid_result = validDataCustomer( req, 'update' );
        
        if( valid_result.is_valid ){
            
            let exist_customer = await validExistCustomer( req, true, valid_result.body_object.basic_data_customer );
            if (exist_customer.success) {
                
                valid_result.body_object.basic_data_customer.shopify_id = exist_customer.body.customer.shopify_id;
                
                let update_shopify_result = await updateShopifyCustomer( valid_result.body_object.basic_data_customer );
                if (update_shopify_result.success) {
                    
                    let update_db_result = await updateDBCustomerUser( valid_result.body_object.basic_data_customer, update_shopify_result.body.shopify_customer, exist_customer.body.user );
                    if (update_db_result.success) {
                        
                        let update_data = {
                            user: {
                                id              : exist_customer.body.user._id.toString(),
                                name            : `${ valid_result.body_object.basic_data_customer.first_name } ${ valid_result.body_object.basic_data_customer.last_name }`,
                                email           : valid_result.body_object.basic_data_customer.email,
                                profile_image   : exist_customer.body.customer.profile_image
                            },
                            customer: {
                                _id             : exist_customer.body.customer._id.toString(),
                                agent           : exist_customer.body.customer.agent._id.toString(),
                                agent_email     : exist_customer.body.customer.agent_email,
                                first_name      : valid_result.body_object.basic_data_customer.first_name,
                                last_name       : valid_result.body_object.basic_data_customer.last_name,
                                full_name       : `${ valid_result.body_object.basic_data_customer.first_name } ${ valid_result.body_object.basic_data_customer.last_name }`,
                                email           : valid_result.body_object.basic_data_customer.email,
                                phone           : valid_result.body_object.basic_data_customer.phone
                            }
                        }
                        if( valid_result.body_object.basic_data_customer.phone != null ){
                            
                            update_data.customer.phone = h_format.phoneNumber( valid_result.body_object.basic_data_customer.phone );
                        }
                        if( valid_result.body_object.basic_data_customer.is_affiliate === true ){
                            
                            await createAffiliate( req.auth, exist_customer.body.customer._id.toString() );
                        }
                        valid_result.body_object.basic_data_customer.profile_image  = exist_customer.body.customer.profile_image;
                        valid_result.body_object.basic_data_customer.addresses      = exist_customer.body.customer.addresses;
                        res.status(200).json( h_response.request( true, req.auth.token.access.is_app ? valid_result.body_object.basic_data_customer : update_data, 200, "Success: Customer Update", "Customer and User updated" ) );
                    }
                    else {
                        
                        res.status(400).send( update_db_result );
                    }
                }
                else {
                    res.status(400).send( update_shopify_result );
                }
            }
            else {
                
                res.status(400).send( exist_customer );
            }
        }
        else{
            
            res.status(400).send( h_response.request( false, valid_result.error_fields, 400, "Error: Customer Update", "Customer fields required not validated" ) );
        }
    } catch (process_error) {
        
        res.status(400).send( h_response.request( false, process_error, 400, "Error: Customer Update", "Customer not updated" ) );
        
    }
};
async function addProfileImage(req, res){
    
    try {
        let result_file = await h_file.upload( req.file, req.body.base_path, { old_path: req.body.old_file_path, default_file_name: `profile_${ req.auth.user.customer._id }`, unique_name_type: true, max_size: parseInt( req.body.max_size ), is_image: true, max_dimension: JSON.parse( req.body.max_dimension ) } );
        
        if( result_file.success ){
            
            let customer_updated = await backCustomerService.update({ _id: req.auth.user.customer._id }, { profile_image: result_file.body.url })
            
            if( customer_updated.success ){
                
                res.status(200).json( h_response.request( true, result_file.body, 200, "Success: Upload File", "Profile Image updated" ) );
            }
            else{
                
                res.status(400).send( h_response.request( false, customer_updated, 400, "Error: Upload File", "Profile Image not updated, Customer not updated" ) );
            }
        }
        else{
            
            res.status(400).send( h_response.request( false, result_file.body, 400, "Error: Upload File", "Profile Image not updated" ) );
        }
    } catch (process_error) {
        
        res.status(400).send( h_response.request( false, process_error, 400, "Error: Customer Profile Image", "Profile Image not added" ) );
    }
};
async function find(req, res){
    
    try {
        let format_data = [
            h_format.objectValidField( 'id_email', h_validation.evalString( req.body.query.id_email, '' ), h_format.fields.types.string.name, h_format.fields.types.string.operators.not_equal, '' ),
        ];
        format_data = h_validation.evalFields( req.body.query, format_data );
        
        if( format_data.is_valid ){
            
            let find_query = h_format.findQuery( format_data.body_object.id_email, 'shopify_id', 'email' );
            
            await h_crud.findDocument('Customer', backCustomerService, find_query, req.body.fields, req.body.options ).then( (result_document) => {
                
                res.status(200).json( result_document );
                
            }).catch( (error_document) => {
                
                res.status(400).send( error_document );
            })
        }
        else{
            
            res.status(400).send( h_response.request( false, format_data.error_fields, 400, "Error: Customer Find", `Customer not found, fields required not validated` ) );
        }
        
    } catch (process_error) {
        
        res.status(400).send( h_response.request( false, process_error, 400, "Error: Customer Find", "Customer not found, process failed" ) );
    }
};
async function validEmail(req, res){
    try {
        let customer_result = await backCustomerService.findOne({ email: req.body.email.toLowerCase() });
        
        if( customer_result.success && customer_result.body != null ){
            
            let user_result = await backUserService.findOne({ email: customer_result.body.email.toLowerCase() });
            
            if( user_result.success && user_result.body && user_result.body.status === 'active' ){
                
                res.status(200).json( h_response.request(true, { email: user_result.body.email }, 200, "Success: Valid Email", "Customer found") );
            }
            else if( user_result.success && user_result.body && user_result.body.status === 'inactive' ){
                
                res.status(400).send( h_response.request(false, customer_result, 400, "Error: Valid Email", "Inactive customer to interact with the store, please contact your sales agent") );
            }
            else{
                
                res.status(400).send( h_response.request(false, user_result, 400, "Error: Valid Email", "Customer not found") );
            }
        }
        else{
            
            res.status(400).send( h_response.request(false, customer_result, 400, "Error: Valid Email", "Customer not found") );
        }
    } catch (process_error) {
        
        res.status(400).send( h_response.request( false, process_error, 400, "Error: Customer Valid Email", "Customer not validated" ) );
    }
};
async function listAddresses(req, res){
    
    try {
        let query_customer = req.body.query;
        if( !req.body.query ){
            
            query_customer = req.auth.user?.customer ? { _id: req.auth.user.customer._id.toString() } : h_format.findQuery( req.query.id_email, 'shopify_id', 'email' );
        }
        
        await h_crud.findDocument('Customer', backCustomerService, query_customer, { _id: 1, addresses: 1, shopify_id: 1 }, { populate: null }).then( async (customer_result) => {
            
            let addresses = customer_result.body.addresses.map( (item) => {
                
                item.phone = item.phone?.number || null;
                return item;
            });
            res.status(200).json( h_response.request( true, addresses, 200, "Success: Customer Address List", "Customer Address found") );
            
        }).catch( (customer_error) => {
            
            res.status(400).send( h_response.request(false, customer_error, 400, "Error: Customer Address List", "Customer Address not found") );
        });
    } catch (process_error) {
        
        res.status(400).send( h_response.request( false, process_error, 400, "Error: Customer Address List", "Customer Address not found" ) );
        
    }
};
async function saveAddress(req, res){
    
    try {
        let query_customer = req.body.query;
        if( !req.body.query ){
            
            query_customer = req.auth.user?.customer ? { _id: req.auth.user.customer._id.toString() } : h_format.findQuery( req.query.id_email, 'shopify_id', 'email' );
        }
        let valid_address = [
            h_format.objectValidField( 'id'                 , h_validation.evalInt( req.body.address?.id, null )                    , h_format.fields.types.number.name , h_format.fields.types.number.operators.not_equal  , '' ),
            h_format.objectValidField( 'customer_id'        , h_validation.evalInt( req.body.address?.customer_id, null )           , h_format.fields.types.number.name , h_format.fields.types.number.operators.not_equal  , null ),
            h_format.objectValidField( 'first_name'         , h_validation.evalString( req.body.address?.first_name, null )         , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , null ),
            h_format.objectValidField( 'last_name'          , h_validation.evalString( req.body.address?.last_name, null )          , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , null ),
            h_format.objectValidField( 'phone'              , h_validation.evalString( req.body.address?.phone, null )              , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , null ),
            h_format.objectValidField( 'company'            , h_validation.evalString( req.body.address?.company, null )            , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , null ),
            h_format.objectValidField( 'city'               , h_validation.evalString( req.body.address?.city, null )               , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , null ),
            h_format.objectValidField( 'zip'                , h_validation.evalString( req.body.address?.zip, null )                , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , null ),
            h_format.objectValidField( 'country'            , h_validation.evalString( req.body.address?.country, null )            , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , null ),
            h_format.objectValidField( 'country_code'       , h_validation.evalString( req.body.address?.country_code, null )       , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , null ),
            h_format.objectValidField( 'state'              , h_validation.evalString( req.body.address?.state, null )              , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , null ),
            h_format.objectValidField( 'state_code'         , h_validation.evalString( req.body.address?.state_code, null )         , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , null ),
            h_format.objectValidField( 'address_1'          , h_validation.evalString( req.body.address?.address_1, null )          , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , null ),
            h_format.objectValidField( 'address_2'          , h_validation.evalString( req.body.address?.address_2, null )          , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , null ),
            h_format.objectValidField( 'default_shipping'   , h_validation.evalBoolean( req.body.address?.default_shipping, false ) , h_format.fields.types.boolean.name, h_format.fields.types.string.operators.not_equal  , null ),
            h_format.objectValidField( 'default_billing'    , h_validation.evalBoolean( req.body.address?.default_billing, false )  , h_format.fields.types.boolean.name, h_format.fields.types.string.operators.not_equal  , null )
        ];
        valid_address = h_validation.evalFields( req.body.address, valid_address );
        
        if( valid_address.is_valid ){
            
            await h_crud.findDocument('Customer', backCustomerService, query_customer, { _id: 1, addresses: 1, shopify_id: 1 }, { populate: null }).then( async (customer_result) => {
                
                let format_address = h_format.customerAddressObject( valid_address.body_object, valid_address.body_object.id === null );
                
                let update_addresses = customer_result.body.addresses.map( (item) => { return { data_base: item, front_end: { ...item, new: false } } } );
                let default_shipping_address= update_addresses.find( (item) => item.data_base.default_shipping );
                let default_billing_address = update_addresses.find( (item) => item.data_base.default_billing );
                
                let update_shopify_address = { success: false, body: null };
                let create_shopify_address = { success: false, body: null };
                
                default_shipping_address    = default_shipping_address?.data_base || format_address.data_base;
                default_billing_address     = default_billing_address?.data_base || null;
                
                if( ( default_billing_address && default_billing_address?.id != format_address.data_base.id ) && format_address.data_base.default_billing === true ){
                    
                    default_billing_address = format_address.data_base;
                }
                if( format_address.data_base.id != null ){
                    
                    update_shopify_address = await updateShopifyAddress( customer_result.body.shopify_id, format_address, update_addresses, default_shipping_address );
                    
                    if( update_shopify_address.success ){
                        
                        update_addresses            = update_shopify_address.body.update_addresses;
                        default_shipping_address    = update_shopify_address.body.default_shipping_address;
                    }
                }
                else{
                    
                    format_address.shopify.customer_id      = customer_result.data.shopify_id;
                    format_address.data_base.customer_id    = customer_result.data.shopify_id;
                    create_shopify_address = await createShopifyAddress( customer_result.body.shopify_id, format_address, update_addresses, default_shipping_address );
                    if( create_shopify_address.success ){
                        
                        update_addresses            = create_shopify_address.body.update_addresses;
                        default_shipping_address    = create_shopify_address.body.default_shipping_address;
                    }
                }
                if( ( update_shopify_address.success || create_shopify_address.success ) && default_shipping_address && update_addresses.findIndex( (item) => item.data_base.default_shipping && item.data_base.id === default_shipping_address.id ) < 0 ){
                    
                    update_addresses = update_addresses.map( (item) => {
                        
                        item.data_base.default_shipping = false;
                        item.front_end.default_shipping = false;
                        if( item.data_base.id === default_shipping_address.id ){
                            
                            item.data_base.default_shipping = true;
                            item.front_end.default_shipping = true;
                        }
                        return item;
                    });
                    await shopify.executeQuery( api_shopify, api_shopify.customerAddress, api_shopify.customerAddress.default, undefined, default_shipping_address.id, customer_result.body.shopify_id ).catch( (shopify_error) => {});
                }
                if( ( update_shopify_address.success || create_shopify_address.success ) && default_billing_address ){
                    
                    update_addresses = update_addresses.map( (item) => {
                        
                        item.data_base.default_billing = false;
                        item.front_end.default_billing = false;
                        if( item.data_base.id === default_billing_address.id ){
                            
                            item.data_base.default_billing = true;
                            item.front_end.default_billing = true;
                        }
                        return item;
                    });
                }
                if( update_shopify_address.success || create_shopify_address.success ){
                    
                    let customer_updated = await backCustomerService.update({ shopify_id: customer_result.body.shopify_id }, { addresses: update_addresses.map( (item) => item.data_base ) });
                    
                    if( customer_updated.success ){
                        
                        await h_crud.findDocument('Customer', backCustomerService, { _id: customer_result.body._id }, { _id: 1, addresses: 1, shopify_id: 1 }, { populate: null }).then( (document_result) => {
                            
                            document_result.title = "Success: Customer Address Update";
                            document_result.message = "Customer was successfully update";
                            document_result.body = document_result.body.addresses.map( (item_address) => {
                                
                                let exist_address   = update_addresses.find( (update_item) => update_item.front_end.id === item_address.id );
                                let new_address = {
                                    ...item_address
                                };
                                new_address.phone  = new_address.phone?.number || null;
                                new_address.new    = exist_address ? exist_address.front_end.new : false;
                                return new_address;
                            });
                            res.status(200).json(document_result);
                        }).catch( (document_error) => {
                            
                            res.status(400).send(document_error);
                        });
                    }
                    else{
                        
                        res.status(400).send( h_response.request( false, customer_updated, 400, "Error: Customer Address Update", "Customer not updated" ) );
                    }
                }
                else{
                    
                    let process_error = [ update_shopify_address, create_shopify_address ].find( (item) => !item.success );
                    res.status(400).send( h_response.request( false, process_error, 400, "Error: Customer Address Update", "Customer Address not updated" ) );
                }
            }).catch( (customer_error) => {
                
                res.status(400).send(customer_error);
            });
        }
        else{
            
            res.status(400).send( h_response.request( false, valid_address.error_fields, 400, "Error: Customer Address Update", "Customer Address fields required not validated" ) );
        }
    } catch (process_error) {
        
        res.status(400).send( h_response.request( false, process_error, 400, "Error: Customer Address Update", "Customer Address not updated" ) );
    }
};
async function deleteAddress(req, res){
    
    try {
        let query_customer = req.body.query;
        if( !req.body.query ){
            
            query_customer = req.auth.user?.customer ? { _id: req.auth.user.customer._id.toString() } : h_format.findQuery( req.query.id_email, 'shopify_id', 'email' );
        }
        let valid_address = [
            h_format.objectValidField( 'id', h_validation.evalInt( req.body.address.id, null ), h_format.fields.types.number.name, h_format.fields.types.number.operators.not_equal, null )
        ];
        valid_address = h_validation.evalFields( req.body, valid_address );
        
        if( valid_address.is_valid ){
            
            await h_crud.findDocument('Customer', backCustomerService, query_customer, { _id: 1, addresses: 1, shopify_id: 1 }, { populate: null }).then( async (customer_result) => {
                
                let update_addresses = customer_result.body.addresses.map( (item) => { return { data_base: item, front_end: { ...item, new: false } } } );
                let default_shipping_address= update_addresses.find( (item) => item.data_base.default_shipping );
                let default_billing_address = update_addresses.find( (item) => item.data_base.default_billing );
                
                default_shipping_address    = default_shipping_address?.data_base || update_addresses.find( (item) => item.data_base.id != valid_address.body_object.id );
                default_billing_address     = default_billing_address?.data_base || update_addresses.find( (item) => item.data_base.id != valid_address.body_object.id );
                
                if( default_shipping_address && update_addresses.findIndex( (item) => item.data_base.default_shipping && item.data_base.id === default_shipping_address.id ) < 0 ){
                    
                    update_addresses = update_addresses.map( (item) => {
                        
                        item.data_base.default_shipping = false;
                        item.front_end.default_shipping = false;
                        if( item.data_base.id === default_shipping_address.id ){
                            
                            item.data_base.default_shipping = true;
                            item.front_end.default_shipping = true;
                        }
                        return item;
                    });
                    await shopify.executeQuery( api_shopify, api_shopify.customerAddress, api_shopify.customerAddress.default, undefined, default_shipping_address.id, customer_result.body.shopify_id ).catch( (shopify_error) => {});
                }
                if( default_billing_address ){
                    
                    update_addresses = update_addresses.map( (item) => {
                        
                        item.data_base.default_billing = false;
                        item.front_end.default_billing = false;
                        if( item.data_base.id === default_billing_address.id ){
                            
                            item.data_base.default_billing = true;
                            item.front_end.default_billing = true;
                        }
                        return item;
                    });
                }
                let shopify_address_deleted = await shopify.executeQuery( api_shopify, api_shopify.customerAddress, api_shopify.customerAddress.delete, undefined, valid_address.body_object.id, customer_result.body.shopify_id );
                
                if( shopify_address_deleted.success ) {
                    
                    update_addresses.splice( update_addresses.findIndex( (item) => item.id === valid_address.body_object.id ), 1 );
                }
                else{
                    
                    res.status(400).send( h_response.request( false, shopify_address_deleted, 400, "Error: Customer Address Delete", "Shopify Address not deleted" ) );
                }
                let customer_updated = await backCustomerService.update({ shopify_id: customer_result.body.shopify_id }, { addresses: update_addresses.map( (item) => item.data_base ) });
                
                if( customer_updated.success ){
                    
                    await h_crud.findDocument('Customer', backCustomerService, { _id: customer_result.body._id }, { _id: 1, addresses: 1, shopify_id: 1 }, { populate: null }).then( (document_result) => {
                        
                        document_result.title = "Success: Customer Address Delete";
                        document_result.message = "Customer was successfully delete";
                        document_result.body = document_result.body.addresses.map( (item_address) => {
                            
                            let exist_address   = update_addresses.find( (update_item) => update_item.front_end.id === item_address.id );
                            let new_address = {
                                ...item_address
                            };
                            new_address.phone  = new_address.phone?.number || null;
                            new_address.new    = exist_address ? exist_address.front_end.new : false;
                            return new_address;
                        });
                        res.status(200).json(document_result);
                    }).catch( (document_error) => {
                        
                        res.status(400).send(document_error);
                    });
                }
                else{
                    
                    res.status(400).send( h_response.request( false, customer_updated, 400, "Error: Customer Address Update", "Customer not updated" ) );
                }
            }).catch( (customer_error) => {
                
                res.status(400).send(customer_error);
            });
        }
        else{
            
            res.status(400).send( h_response.request( false, valid_address.error_fields, 400, "Error: Customer Address Delete", "Customer Address fields required not validated" ) );
        }
    } catch (process_error) {
        
        res.status(400).send( h_response.request( false, process_error, 400, "Error: Customer Address Delete", "Customer Address not deleted" ) );
    }
};
async function listByAgent(req, res){
    
    await agentUserService.findOne({ email: req.body.email.toLowerCase() }).then( async (agent_result) => {
        let agents = [];
        let find_query = { agent: { $ne: null }, email: { $ne: null } };
        if( agent_result.body && req.body.role != 'administrator' ){
            
            agents.push( agent_result.body._id.toString() );
            
            if( agent_result.body.agentSupportId ){
                
                agents.push( agent_result.body.agentSupportId.toString() );
            }
            find_query = { agent: { $in: agents }, email: { $ne: null } };
        }
        await backCustomerService.find(find_query, null, null, { populate: null }).then( (customer_result) => {
            
            let customer_list = customer_result.body.reduce( (previous_item, current_item) => {
                
                previous_item.push({
                    id: current_item._id,
                    email: current_item.email,
                    label: `${ current_item.full_name } - ${ current_item.email }`,
                    value: current_item
                });
                
                return previous_item;
            }, []);
            res.status(200).json( h_response.request(true, customer_list, 200, "Success: Customer Find", "Customers found") );
            
        }).catch( (customer_error) => {
            
            res.status(400).send( h_response.request(false, customer_error, 400, "Error: Customer Find", "Customers not found") );
        });
        
    }).catch( (agent_error) => {
        
        res.status(400).send( h_response.request(false, agent_error, 400, "Error: Customer Find", "Agent not found") );
    });
};
async function redirectPaymentCustomer(req, res){
    try {
        let customer_result = await backCustomerService.findOne({ shopify_id: req.query.shopify_id });
        
        if( customer_result.success && customer_result.body != null ){
            
            res.status(200).json( h_response.request(true, { url: `https://shop.com/landing/pay-balance?customer=${ customer_result.body._id.toString() }` }, 200, "Success: Payment Page", "Redirect Payment Page") );
        }
        else{
            
            res.status(400).send( h_response.request(false, customer_result, 400, "Error: Payment Page", "Customer not found") );
        }
    } catch (process_error) {
        
        res.status(400).send( h_response.request( false, process_error, 400, "Error: Redirect Payment", "Customer not found" ) );
    }
};
async function list(req, res){
    
    await h_crud.listDocuments('Customer', backCustomerService, req.body.query, req.body.fields, req.body.options ).then( (result_document) => {
        
        res.status(200).json( result_document );
        
    }).catch( (error_document) => {
        
        res.status(400).send( error_document );
    });
};
async function findAgent(req, res){
    
    try {
        let customer_result = await backCustomerService.findOne({ _id: req.auth.user.customer._id.toString() }, { agent: 1 }, { populate: { path: 'agent', select: 'name email phone photo' } });
        
        if( customer_result.success && customer_result.body != null ){
            
            res.status(200).json( h_response.request(true, customer_result.body.agent, 200, "Success: Agent Find", "Agent found") );
        }
        else{
            
            res.status(400).send( h_response.request(false, customer_result, 400, "Error: Agent Find", "Agent not found") );
        }
    }
    catch (process_error) {
        
        res.status(400).send( h_response.request( false, process_error, 400, "Error: Agent Find", "Agent not found" ) );
    }
};
async function listConvertionCustomersByAdds(req, res){
    
    try {
        let customer_result = await backCustomerService.find({ $and: [ { google_add_id: { $ne: null } }, { created_at: { $gte: new Date( moment(req.body.min_date) ) } }, { created_at: { $lte: new Date( moment(req.body.max_date) ) } } ] }, { shopify_id: 1, full_name: 1, email: 1, phone: 1, first_order: 1, google_add_id: 1, origin_add: 1, utms: 1, created_at: 1 }, null, { populate: null });
        
        if( customer_result.success ){
            
            let list_first_orders = customer_result.body.reduce( (previous_item, current_item) => { 
                
                if( current_item.first_order ){ 
                    previous_item.push( current_item.first_order.shopify_id ) 
                } 
                return previous_item; 
            }, []);
            let order_result = await backOrderService.find({ shopify_id: { $in: list_first_orders } }, { shopify_id: 1, total_price: 1 }, null, { populate: null });
            
            if( order_result.success ){
                let name_file = `Convertion Leads Google Add - ${ moment(req.body.min_date).month() + 1 }-${ moment(req.body.min_date).year() } - ${ moment(req.body.max_date).month() + 1 }-${ moment(req.body.max_date).year() }`;
                let data_file = [{
                    title: "Convertion Leads Google Add",
                    max_num_columns: 12,
                    sheet_name: "Convertion Leads Google Add",
                    body_data: [],
                    cols: [
                        { wch: 20 },
                        { wch: 20 },
                        { wch: 20 },
                        { wch: 20 },
                        { wch: 20 },
                        { wch: 20 },
                        { wch: 20 },
                        { wch: 20 },
                        { wch: 20 },
                        { wch: 20 },
                        { wch: 20 },
                        { wch: 20 },
                    ]
                }];
                let list_customers = customer_result.body.reduce( (previous_item, current_item) => {
                    
                    let exist_order     = current_item.first_order ? order_result.body.find( (item) => item.shopify_id === current_item.first_order.shopify_id ) : null;
                    if( exist_order ){
                        
                        let format_customer = {
                            shopify_id          : current_item.shopify_id,
                            full_name           : current_item.full_name,
                            add_name            : "",
                            currency            : "USD",                        
                            email               : current_item.email,
                            encripted_email     : cryptoJS.SHA256(current_item.email).toString(),
                            phone               : current_item.phone,
                            google_add_id       : current_item.google_add_id,
                            origin_add          : current_item.origin_add,
                            utmSource           : current_item.utms ? current_item.utms.utmSource : null, 
                            utmMedium           : current_item.utms ? current_item.utms.utmMedium : null,
                            utmCampaign         : current_item.utms ? current_item.utms.utmCampaign : null,
                            utmTerm             : current_item.utms ? current_item.utms.utmTerm : null,
                            order_id            : exist_order ? current_item.first_order.shopify_id : null,
                            order_name          : exist_order ? current_item.first_order.name : null,
                            order_date          : exist_order ?  new Date( current_item.first_order.created_at ).toISOString().replace(".000Z", "") : null,
                            order_value         : exist_order ? exist_order.total_price : null,
                            created_at          : current_item.created_at
                        };
                        data_file[0].body_data.push({ 
                            row: { 
                                columns: [ 
                                    { name: "google_add_id"         , value: format_customer.google_add_id                                              , index_column: 0   , num_columns: 1, num_rows: 1 }, 
                                    { name: "convertion_name"       , value: ""                                                                         , index_column: 1   , num_columns: 1, num_rows: 1 }, 
                                    { name: "created_at"            , value: format_customer.order_date ? format_customer.order_date : ""               , index_column: 2   , num_columns: 1, num_rows: 1 },  
                                    { name: "order_value"           , value: format_customer.order_value ? format_customer.order_value : ""             , index_column: 3   , num_columns: 1, num_rows: 1 },
                                    { name: "currency"              , value: format_customer.currency                                                   , index_column: 4   , num_columns: 1, num_rows: 1 },
                                    { name: "encripted_email"       , value: cryptoJS.SHA256(format_customer.email).toString()                          , index_column: 5   , num_columns: 1, num_rows: 1 },
                                    { name: "add_personalization"   , value: ""                                                                         , index_column: 6   , num_columns: 1, num_rows: 1 },
                                    { name: "email"                 , value: format_customer.email                                                      , index_column: 7   , num_columns: 1, num_rows: 1 },
                                    { name: "customer_created_at"   , value: new Date( format_customer.created_at ).toISOString().replace(".000Z", "")  , index_column: 8   , num_columns: 1, num_rows: 1 },
                                    { name: "utm_term"              , value: format_customer.utmTerm        ? format_customer.utmTerm       : ""        , index_column: 9   , num_columns: 1, num_rows: 1 },
                                    { name: "utm_campaing"          , value: format_customer.utmCampaign    ? format_customer.utmCampaign   : ""        , index_column: 10  , num_columns: 1, num_rows: 1 },
                                    { name: "utm_source"            , value: format_customer.utmSource      ? format_customer.utmSource     : ""        , index_column: 11  , num_columns: 1, num_rows: 1 },
                                ] 
                            } 
                        });
                        previous_item.push( format_customer );
                    }
                    return previous_item;
                }, []);
                
                await h_excel.createFile( { name: name_file, template: '/documents/templates/excel/format-convertion-lead-google-add.xlsx', data: data_file, cell_title: null, row_first_reg: 8 }, formatBodyGoogleAddsFile ).then( (format_file) => {
                    
                    format_file.body.list = list_customers;
                    res.status(200).json( format_file );
                    
                }).catch( (format_file_error) => {
                    
                    format_file_error.title = "Error: Download File";
                    format_file_error.message = "Cart List File not downloaded";
                    
                    res.status(400).send( format_file_error );
                });
            }
            else{
                
                res.status(400).send( h_response.request(false, order_result, 400, "Error: Customers find", "Orders not found") );
            }
        }
        else{
            
            res.status(400).send( h_response.request(false, customer_result, 400, "Error: Customers find", "Customers not found") );
        }
    } catch (process_error) {
        
        res.status(400).send( h_response.request( false, process_error, 400, "Error: Customers List", "Customers not found" ) );
        
    }
};
async function listOtherCustomersByAdds(req, res){
    try {
        let customer_result = await backCustomerService.find({ $and: [ { 'utms.utmCampaign': { $ne: null } }, { created_at: { $gte: new Date( moment(req.body.min_date) ) } }, { created_at: { $lte: new Date( moment(req.body.max_date) ) } } ] }, { shopify_id: 1, full_name: 1, email: 1, phone: 1, first_order: 1, google_add_id: 1, origin_add: 1, utms: 1, created_at: 1 }, null, { populate: null });
        
        if( customer_result.success ){
            let list_first_orders = customer_result.body.reduce( (previous_item, current_item) => { 
                
                if( current_item.first_order ){ 
                    previous_item.push( current_item.first_order.shopify_id ) 
                } 
                return previous_item; 
            }, []);
            let order_result = await backOrderService.find({ shopify_id: { $in: list_first_orders } }, { shopify_id: 1, total_price: 1 }, null, { populate: null });
            if( order_result.success ){
                
                let name_file = `Other Leads Google Add - ${ moment(req.body.min_date).month() + 1 }-${ moment(req.body.min_date).year() } - ${ moment(req.body.max_date).month() + 1 }-${ moment(req.body.max_date).year() }`;
                let data_file = [{
                    title: "Other Leads Google Add",
                    max_num_columns: 12,
                    sheet_name: "Other Leads Google Add",
                    body_data: [],
                    cols: [
                        { wch: 20 },
                        { wch: 20 },
                        { wch: 20 },
                        { wch: 20 },
                        { wch: 20 },
                        { wch: 20 },
                        { wch: 20 },
                        { wch: 20 },
                        { wch: 20 },
                        { wch: 20 },
                        { wch: 20 },
                        { wch: 20 },
                    ]
                }];
                let list_customers = customer_result.body.reduce( (previous_item, current_item) => {
                    
                    let exist_order     = current_item.first_order ? order_result.body.find( (item) => item.shopify_id === current_item.first_order.shopify_id ) : null;
                    if( !(current_item.google_add_id && exist_order) ){
                        
                        let format_customer = {
                            shopify_id          : current_item.shopify_id,
                            full_name           : current_item.full_name,
                            add_name            : "",
                            currency            : "USD",                        
                            email               : current_item.email,
                            encripted_email     : cryptoJS.SHA256(current_item.email).toString(),
                            phone               : current_item.phone,
                            google_add_id       : current_item.google_add_id,
                            origin_add          : current_item.origin_add,
                            utmSource           : current_item.utms ? current_item.utms.utmSource : null, 
                            utmMedium           : current_item.utms ? current_item.utms.utmMedium : null,
                            utmCampaign         : current_item.utms ? current_item.utms.utmCampaign : null,
                            utmTerm             : current_item.utms ? current_item.utms.utmTerm : null,
                            order_id            : exist_order ? current_item.first_order.shopify_id : null,
                            order_name          : exist_order ? current_item.first_order.name : null,
                            order_date          : exist_order ?  new Date( current_item.first_order.created_at ).toISOString().replace(".000Z", "") : null,
                            order_value         : exist_order ? exist_order.total_price : null,
                            created_at          : current_item.created_at
                        };
                        data_file[0].body_data.push({ 
                            row: { 
                                columns: [ 
                                    { name: "google_add_id"         , value: format_customer.google_add_id                                              , index_column: 0   , num_columns: 1, num_rows: 1 }, 
                                    { name: "convertion_name"       , value: ""                                                                         , index_column: 1   , num_columns: 1, num_rows: 1 }, 
                                    { name: "created_at"            , value: format_customer.order_date ? format_customer.order_date : ""               , index_column: 2   , num_columns: 1, num_rows: 1 },  
                                    { name: "order_value"           , value: format_customer.order_value ? format_customer.order_value : ""             , index_column: 3   , num_columns: 1, num_rows: 1 },
                                    { name: "currency"              , value: format_customer.currency                                                   , index_column: 4   , num_columns: 1, num_rows: 1 },
                                    { name: "encripted_email"       , value: cryptoJS.SHA256(format_customer.email).toString()                          , index_column: 5   , num_columns: 1, num_rows: 1 },
                                    { name: "add_personalization"   , value: ""                                                                         , index_column: 6   , num_columns: 1, num_rows: 1 },
                                    { name: "email"                 , value: format_customer.email                                                      , index_column: 7   , num_columns: 1, num_rows: 1 },
                                    { name: "customer_created_at"   , value: new Date( format_customer.created_at ).toISOString().replace(".000Z", "")  , index_column: 8   , num_columns: 1, num_rows: 1 },
                                    { name: "utm_term"              , value: format_customer.utmTerm        ? format_customer.utmTerm       : ""        , index_column: 9   , num_columns: 1, num_rows: 1 },
                                    { name: "utm_campaing"          , value: format_customer.utmCampaign    ? format_customer.utmCampaign   : ""        , index_column: 10  , num_columns: 1, num_rows: 1 },
                                    { name: "utm_source"            , value: format_customer.utmSource      ? format_customer.utmSource     : ""        , index_column: 11  , num_columns: 1, num_rows: 1 },
                                ] 
                            } 
                        });
                    }
                    return previous_item;
                });
                
                await h_excel.createFile( name_file, '/documents/templates/excel/format-other-lead-google-add.xlsx', data_file, null, 2, formatBodyGoogleAddsFile, null, null ).then( (format_file) => {
                    
                    format_file.list = list_customers;
                    res.status(200).json( format_file );
                    
                }).catch( (format_file_error) => {
                    
                    format_file_error.title = "Error: Download File";
                    format_file_error.message = "Cart List File not downloaded";
                    
                    res.status(400).send( format_file_error );
                });
            }
            else {
                
                res.status(400).send( h_response.request(false, order_result, 400, "Error: Customers find", "Orders not found") );
            }
        }
        else{
            
            res.status(400).send( h_response.request(false, customer_result, 400, "Error: Customers find", "Customers not found") );
        }
    } catch (process_error) {
        
        res.status(400).send( h_response.request( false, process_error, 400, "Error: Customers List", "Customers not found" ) );
    }
};
async function createCustomerMX(req, res){
    
    await customerMxService.findOne({ email: req.body.email }).then( async (customer_result) => {
        
        if( customer_result.body === null ){
            
            let form_customer = {
                first_name      : req.body.first_name,
                last_name       : req.body.last_name,
                email           : req.body.email,
                phone           : req.body.phone.replace( /([( )-])/g, ""),
                state           : req.body.state,
                state_code      : req.body.state_code,
                city            : req.body.city,
                type_business   : req.body.type_business,
            };
            let shopify_customer = {
                email                   : form_customer.email,
                first_name              : form_customer.first_name.trim() || null,
                last_name               : form_customer.last_name.trim() || null,
                password                : form_customer.password ? form_customer.password : '123456789',
                password_confirmation   : form_customer.password ? form_customer.password : '123456789',
                addresses               : [
                    {
                        first_name      : form_customer.first_name.trim() || null,
                        last_name       : form_customer.last_name.trim() || null,
                        company         : '',
                        address1        : '',
                        address2        : null,
                        country         : "Mexico",
                        country_code    : "MX",
                        province        : form_customer.state,
                        province_code   : form_customer.state_code,
                        city            : form_customer.city,
                        zip             : '',
                        phone           : form_customer.phone
                    }
                ],
                send_email_invite       : false
            };
            await shopify.executeQuery( api_shopify_mx, api_shopify_mx.customer, api_shopify_mx.customer.create, shopify_customer).then( async (shopify_created) => {
                
                let db_customer = {
                    shopify_id      : shopify_created.data.id,
                    email           : form_customer.email,
                    first_name      : form_customer.first_name,
                    last_name       : form_customer.last_name,
                    full_name       : `${ form_customer.first_name } ${ form_customer.last_name }`.trim(),
                    phone           : form_customer.phone,
                    address         : shopify_created.data.addresses.reduce( (previous_item, current_item) => {
                        previous_item = {
                            id              : current_item.id,
                            customer_id     : shopify_created.data.id,
                            default_shipping: current_item.default,
                            default_billing : current_item.default,
                            first_name      : current_item.first_name,
                            last_name       : current_item.last_name,
                            phone           : current_item.phone,
                            company         : current_item.company,
                            address_1       : current_item.address1,
                            address_2       : current_item.address2,
                            country         : current_item.country,
                            country_code    : current_item.country_code,
                            state           : current_item.province,
                            state_code      : current_item.province_code,
                            city            : current_item.city,
                            zip             : current_item.zip
                        };
                        return previous_item;
                    }, {}),
                    type_business   : form_customer.type_business
                };
                await customerMxService.create( db_customer ).then( (customer_created) => {
                    
                    if( customer_created.success ){
                        
                        let message_customer = `
                        <table>
                            <thead>
                                <tr>
                                    <td>Customer Data</td>
                                </tr>
                            </thead>
                        </table>
                        <table>
                            <tbody>
                                <tr>
                                    <td>Shopify Id</td>
                                    <td>${ db_customer.shopify_id }</td>
                                </tr>
                                <tr>
                                    <td>Email</td>
                                    <td>${ db_customer.email }</td>
                                </tr>
                                <tr>
                                    <td>First Name</td>
                                    <td>${ db_customer.first_name }</td>
                                </tr>
                                <tr>
                                    <td>Last Name</td>
                                    <td>${ db_customer.last_name }</td>
                                </tr>
                                <tr>
                                    <td>Phone</td>
                                    <td>${ db_customer.phone }</td>
                                </tr>
                            </tbody>
                        </table>
                        <table>
                            <thead>
                                <tr>
                                    <td>Customer Address</td>
                                </tr>
                            </thead>
                        </table>
                        <table>
                            <tbody>
                                <tr>
                                    <td>State</td>
                                    <td>${ db_customer.address.state } (${ db_customer.address.state_code })</td>
                                </tr>
                                <tr>
                                    <td>City</td>
                                    <td>${ db_customer.address.city }</td>
                                </tr>
                            </tbody>
                        </table>`;
                        mailer.sendEmail( config_credentials.mailer.mexico, `Hefesto Notification <${ config_credentials.mailer.mexico.user }>`, config_credentials.mailer.mexico.user, `Create Customer - ${ db_customer.full_name }`, message_customer).catch( (mailer_error) => {
                            console.log( mailer_error );
                        });
                        res.status(200).json( h_response.request(true, { shopify_id: shopify_created.data.id }, 200, "Success: Customer Create", "Customer created") );
                    }
                }).catch( (customer_error) => {
                    
                    res.status(400).send( h_response.request(false, customer_error, 400, "Error: Customer Create", "Customer not created") );
                });
            }).catch( (shopify_error) => {
                
                res.status(400).send( h_response.request(false, shopify_error.data, 400, "Error: Customer Create", "Shopify Customer not created") );
            });
        }
        else{
            
            res.status(200).send( h_response.request(true, { shopify_id: customer_result.body.shopify_id }, 200, "Success: Customer Create", "Customer exist width this email") );
        }
    }).catch( (customer_error) => {
        
        res.status(400).send( h_response.request(false, customer_error, 400, "Error: Customer Update", "Customer not updated") );
    });
};
async function updateCustomerMX(req, res){
    
    let form_customer ={ 
        bussiness_name: req.body.bussiness_name, 
        have_experience: req.body.have_experience, 
        target_sell: req.body.target_sell, 
        social_networks: req.body.social_networks 
    };
    await customerMxService.findOne({ shopify_id: req.body.shopify_id }).then( async (customer_result) => {
        
        if( customer_result.body != null ){
            
            await customerMxService.update({ shopify_id: req.body.shopify_id }, form_customer).then( (customer_updated) => {
                
                res.status(200).json( h_response.request(true, { shopify_id: customer_result.body.shopify_id }, 200, "Success: Customer Update", "Customer updated") );
            }).catch( (customer_error) => {
                
                res.status(400).send( h_response.request(false, customer_error, 400, "Error: Customer Update", "Customer not updated") );
            });
        }
        else{
            
            res.status(400).send( h_response.request(false, customer_result, 400, "Error: Customer Update", "Customer not Exist") );
        }
    }).catch( (customer_error) => {
        
        res.status(400).send( h_response.request(false, customer_error, 400, "Error: Customer Update", "Customer not updated") );
    });
};
// =============================================================================
// GENERAL FUNCTIONS
// =============================================================================
async function validExistCustomer( req, is_exist, form_data ){
    
    try {
        let setting_result      = await backGeneralSettingService.findOne({ marketplace: req.auth.marketplace, status: 'active' }, { config_best_seller: 1 });
        let shopify_result      = await shopify.executeQuery( api_shopify, api_shopify.customer, api_shopify.customer.search, { query: `email:${ form_data.old_email }` });
        let customer_result     = await backCustomerService.findOne({ email: form_data.old_email });
        let user_result         = await backUserService.findOne({ email: form_data.old_email, customer: { $ne: null }, agent: null });
        
        if( setting_result.success && shopify_result.success && customer_result.success && user_result.success ){
            
            if( ( !is_exist && customer_result.body === null && user_result.body === null ) || ( is_exist && customer_result.body && user_result.body ) ) {
                
                let result = { 
                    general_settings: setting_result.body,
                    shopify_customer: shopify_result.body.length > 0 ? shopify_result.body[0] : null,
                    marketplace     : req.auth.marketplace || null
                };
                if( is_exist ){
                    result.customer = customer_result.body;
                    result.user = user_result.body;
                }
                return h_response.request( true, result, 200, `Success: Customer ${ !is_exist ? 'Create' : 'Update' }`, `Customer ${ !is_exist ? 'created' : 'updated' }` );
            }
            else{
                
                return h_response.request( false, customer_result, 400, `Error: Customer ${ !is_exist ? 'Create' : 'Update' }`, `Customer not ${ !is_exist ? 'created' : 'updated' }, Customer exist width this email` );
            }
        }
        else{
            
            let process_error = [ setting_result, shopify_result, customer_result, user_result ].find( (item) => !item.success );
            
            return h_response.request( false, process_error, 400, `Error: Customer ${ !is_exist ? 'Create' : 'Update' }`, `Customer not ${ !is_exist ? 'created' : 'updated' }` );
        }
    } catch (process_error) {
        
        return h_response.request( false, process_error, 400, `Error: Customer ${ !is_exist ? 'Create' : 'Update' }`, `Customer not ${ !is_exist ? 'created' : 'updated' }` );
    }
};
async function createShopifyCustomer(form_data){
    try {
        let shopify_customer = {
            email                   : form_data.email,
            first_name              : form_data.first_name,
            last_name               : form_data.last_name,
            password                : form_data.password != null ? form_data.password : '123456789',
            password_confirmation   : form_data.password != null ? form_data.password : '123456789',
            note                    : form_data.note,
            tags                    : form_data.tags != [] ? form_data.tags.join(', ') : '',
            addresses               : form_data.address != null ? [
                {
                    first_name      : form_data.address.first_name?.trim() || null,
                    last_name       : form_data.address.last_name?.trim() || null,
                    company         : form_data.address.company,
                    address1        : form_data.address.address_1,
                    address2        : form_data.address.address_2 || null,
                    country         : form_data.address.country,
                    country_code    : form_data.address.country_code,
                    province        : form_data.address.state,
                    province_code   : form_data.address.state_code,
                    city            : form_data.address.city,
                    zip             : form_data.address.zip,
                    phone           : form_data.address.phone
                }
            ] : [],
            tax_exempt              : form_data.tax_exempt,
            send_email_invite       : false
        };
        let shopify_created = await shopify.executeQuery( api_shopify, api_shopify.customer, api_shopify.customer.create, shopify_customer );
        
        if( shopify_created.body != null ){
            
            return h_response.request( true, { shopify_customer: shopify_created.body }, 200, "Success: Customer Create", "Customer created, Shopify Customer Created" );
        }
        else{
            
            return h_response.request( false, shopify_created, 400, "Error: Customer Create", "Customer not created, Shopify Customer not Created" );
        }
    } catch (process_error) {
        
        return h_response.request( false, process_error, 400, "Error: Customer Create", "Customer not created, Shopify Customer not Created" );
        
    }
};
async function updateShopifyCustomer(form_data){
    
    try {
        let shopify_customer = {
            email                   : form_data.email,
            first_name              : form_data.first_name,
            last_name               : form_data.last_name,
            note                    : form_data.note,
            tax_exempt              : form_data.tax_exempt
        };
        let shopify_updated = await shopify.executeQuery( api_shopify, api_shopify.customer, api_shopify.customer.update, shopify_customer, form_data.shopify_id );
        
        if( shopify_updated.success ){
            
            return h_response.request( true, { shopify_customer: shopify_updated.body }, 200, "Success: Customer Update", "Customer updated, Shopify Customer Updated" );
        }
        else{
            
            return h_response.request( false, shopify_updated, 400, "Error: Customer Update", "Customer not updated, Shopify Customer not Updated" );
        }
    } catch (process_error) {
        
        return h_response.request( false, process_error, 400, "Error: Customer Update", "Customer not updated, Shopify Customer not Updated" );
    }
};
async function createDBCustomerUser(req, form_data, shopify_customer){
    try {
        let storefront_result       = form_data.storefront != null ? await backStorefrontService.findOne({ marketplace: req.auth.marketplace, handle: form_data.storefront, status: 'active' }) : { success: true, body: { handle: form_data.storefront } };
        let agent_result            = await agentUserService.findOne({ email: form_data.agent_email });
        let customer_last_result    = await backCustomerService.find({ marketplace: req.auth.marketplace, nit: { $ne: null } }, { nit: 1 }, { nit: -1 }, { limit: 1 });
        if( storefront_result.success && storefront_result.body != null && agent_result.success && agent_result.body != null && customer_last_result.success ) {
            
            let next_nit            = customer_last_result.body[0].nit;
            form_data.storefront    = storefront_result.body._id ? storefront_result.body._id.toString() : null;
            let format_customer     = h_format.customerObject( shopify_customer, agent_result.body, form_data, next_nit, null, true );
            let customer_created    = await backCustomerService.create( format_customer );
            
            if( customer_created.success ){
                
                let origin_customer = form_data.is_wholesale ? 'wholesale' : 'storefront';
                let user_data       = { 
                    marketplace     : req.auth.marketplace, 
                    storefront      : form_data.storefront,
                    password        : form_data.password ? form_data.password : '123456789', 
                    role            : req.auth.marketplace.order_origins.find( (item) => item.values[0] === origin_customer ).customer_role, 
                    application_type: origin_customer,
                    change_password : form_data.change_password
                };
                let format_user     = h_format.userObject( customer_created.body, user_data, null, true );
                let user_created    = await backUserService.create(format_user);
                
                if( user_created.success ){
                    
                    return h_response.request( true, { agent_db: agent_result.body, customer_db: customer_created.body, user_db: user_created.body }, 200, "Success: Customer Create", "Customer created" );
                }
                else{
                    
                    return h_response.request( false, user_created, 400, "Error: Customer Create", "User not created" );
                }
            }
            else{
                
                return h_response.request( false, customer_created, 400, "Error: Customer Create", "Customer not created" );
            }
        }
        else{
            
            let process_error = [ agent_result, customer_last_result, storefront_result ].find( (item) => !item.success );
            return h_response.request( false, process_error, 400, "Error: Customer Create", "Customer not created" );
        }
    } catch (process_error) {
        
        return h_response.request( false, process_error, 400, "Error: Customer Create", "Customer not created" );
    }
};
async function updateDBCustomerUser(form_data, shopify_customer, db_user){
    try {
        let agent_result = await agentUserService.findOne({ email: form_data.agent_email });
        if( agent_result.success && agent_result.body != null ) {
            
            let format_customer     = h_format.customerObject( shopify_customer, agent_result.body, form_data, null, false );
            let customer_updated    = await backCustomerService.update( format_customer.query, format_customer.document );
            
            if( customer_updated.success ){
                
                let format_user     = h_format.userObject( shopify_customer, { change_password: form_data.change_password }, db_user, false );
                let user_updated    = await backUserService.update(format_user.query, format_user.document);
                
                if( user_updated.success ){
                    
                    return h_response.request( true, { customer_db: customer_updated.body, user_db: user_updated.body }, 200, "Success: Customer Update", "Customer updated" );
                }
                else{
                    
                    return h_response.request( false, user_updated, 400, "Error: Customer Update", "User not updated" );
                }
            }
            else{
                
                return h_response.request( false, customer_updated, 400, "Error: Customer Update", "Customer not updated" );
            }
        }
        else{
            
            let process_error = [ agent_result ].find( (item) => !item.success );
            return h_response.request( false, process_error, 400, "Error: Customer Update", "Customer not updated" );
        }
    } catch (process_error) {
        
        return h_response.request( false, process_error, 400, "Error: Customer Update", "Customer not updated" );
        
    }
};
async function updateShopifyAddress(shopify_id, format_address, update_addresses, default_shipping_address ){
    try {
        let shopify_updated = await shopify.executeQuery( api_shopify, api_shopify.customerAddress, api_shopify.customerAddress.update, format_address.shopify, format_address.shopify.id, shopify_id );
        
        if( shopify_updated.success ){
            
            let index_address = update_addresses.findIndex( (item) => item.data_base.id === format_address.data_base.id );
            if( index_address >= 0 ){
                
                update_addresses[index_address].data_base = format_address.data_base;
                update_addresses[index_address].front_end = format_address.data_base;
            }
            if( default_shipping_address.id != format_address.data_base.id && format_address.data_base.default_shipping ){
                
                default_shipping_address = format_address.data_base;
            }
            return h_response.request( true, { update_addresses: update_addresses, default_shipping_address: default_shipping_address }, 200, "Success: Customer Address Update", "Shopify Address updated" );
        }
        else {
            
            return h_response.request( false, shopify_updated, 400, "Error: Customer Address Update", "Shopify Address not updated" );
        }
    } catch (process_error) {
        
        return h_response.request( false, process_error, 400, "Error: Customer Address Update", "Shopify Address not updated" );
    }
};
async function createShopifyAddress(shopify_id, format_address, update_addresses, default_shipping_address){
    try {
        let shopify_created = await shopify.executeQuery( api_shopify, api_shopify.customerAddress, api_shopify.customerAddress.create, format_address.shopify, null, shopify_id );
        
        if( shopify_created.success ){
            
            format_address.data_base.id = shopify_created.data.id;
            if( update_addresses.length === 0 ){
                
                default_shipping_address                    = format_address.data_base;
                format_address.data_base.default            = true;
                format_address.data_base.default_shipping   = true;
                format_address.data_base.default_billing    = true;
            }
            update_addresses.push( { data_base: format_address.data_base, front_end: { ...format_address.data_base, new: true } } );
            
            if( default_shipping_address.id != format_address.data_base.id && format_address.data_base.default_shipping ){
                
                default_shipping_address = format_address.data_base;
            }
            return h_response.request( true, { update_addresses: update_addresses, default_shipping_address: default_shipping_address }, 200, "Success: Customer Address Create", "Shopify Address created" );
        }
        else{
            
            return h_response.request( false, shopify_created, 400, "Error: Customer Address Create", "Shopify Address not created" );
        }
    } catch (process_error) {
        
        return h_response.request( false, process_error, 400, "Error: Customer Address Create", "Shopify Address not created" );
    }
};
function validDataCustomer(req, main_action){
    
    let format_basic_data_customer = [
        h_format.objectValidField( 'agent'      , h_validation.evalObjectId( req.body.agent, null )     , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , '' ),
        h_format.objectValidField( 'agent_email', h_validation.evalString( req.body.agent_email, null ) , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , '' ),
        h_format.objectValidField( 'old_email'  , h_validation.evalString( req.body.old_email, null )   , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , null ),
        h_format.objectValidField( 'first_name' , h_validation.evalString( req.body.first_name, null )  , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , null ),
        h_format.objectValidField( 'last_name'  , h_validation.evalString( req.body.last_name, null )   , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , null ),
        h_format.objectValidField( 'email'      , h_validation.evalString( req.body.email, null )       , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , null ),
        h_format.objectValidField( 'phone'      , h_validation.evalString( req.body.phone, null )       , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , null )
    ];
    if( main_action === 'create' ){
        
        format_basic_data_customer = format_basic_data_customer.concat([
            h_format.objectValidField( 'password'       , h_validation.evalString( req.body.password, null )        , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , null ),
            h_format.objectValidField( 'is_wholesale'   , h_validation.evalBoolean( req.body.is_wholesale, false )  , h_format.fields.types.boolean.name, h_format.fields.types.boolean.operators.not_equal , null ),
            h_format.objectValidField( 'is_retail'      , h_validation.evalBoolean( req.body.is_retail, false )     , h_format.fields.types.boolean.name, h_format.fields.types.boolean.operators.not_equal , null )
        ]);
    }
    else if( req.auth.token.access.is_app === true ){
        
        format_basic_data_customer = format_basic_data_customer.concat([
            h_format.objectValidField( 'change_password', h_validation.evalBoolean( req.body.change_password, false ) , h_format.fields.types.boolean.name, h_format.fields.types.boolean.operators.not_equal , null )
        ]);
    }
    let format_address = {
        is_valid    : true,
        body_object : {
            address : null
        },
        error_fields: []
    };
    if( req.body.is_wholesale ){
        
        let format_additional_data_customer = [];
        
        if( req.auth.token.access.is_app === true ){
            
            format_additional_data_customer = [
                h_format.objectValidField( 'note'               , h_validation.evalString( req.body.note, null )                , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal                  , undefined ),
                h_format.objectValidField( 'tax_exempt'         , h_validation.evalBoolean( req.body.tax_exempt, false )        , h_format.fields.types.boolean.name, h_format.fields.types.boolean.operators.not_equal                 , null ),
                h_format.objectValidField( 'tags'               , h_validation.evalArray( req.body.tags, [] )                   , h_format.fields.types.array.name  , h_format.fields.types.array.operators.length_greater_than_or_equal, 0 ),
                h_format.objectValidField( 'birthday_date'      , h_validation.evalString( req.body.birthday_date, null )       , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal                  , undefined ),
                h_format.objectValidField( 'initial_budget'     , h_validation.evalString( req.body.initial_budget, null )      , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal                  , undefined ),
                h_format.objectValidField( 'shop'               , h_validation.evalString( req.body.shop, null )                , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal                  , undefined ),
                h_format.objectValidField( 'language'           , h_validation.evalString( req.body.language, null )            , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal                  , undefined ),
                h_format.objectValidField( 'type_business'      , h_validation.evalString( req.body.type_business, null )       , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal                  , undefined ),
                h_format.objectValidField( 'country'            , h_validation.evalString( req.body.country, null )             , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal                  , undefined ),
                h_format.objectValidField( 'state'              , h_validation.evalString( req.body.state, null )               , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal                  , undefined ),
                h_format.objectValidField( 'instagram'          , h_validation.evalString( req.body.instagram, null )           , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal                  , undefined ),
                h_format.objectValidField( 'company_website'    , h_validation.evalString( req.body.company_website, null )     , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal                  , undefined ),
                h_format.objectValidField( 'is_dropshipping'    , h_validation.evalBoolean( req.body.is_dropshipping, false )   , h_format.fields.types.boolean.name, h_format.fields.types.boolean.operators.not_equal                 , undefined ),
                h_format.objectValidField( 'is_affiliate'       , h_validation.evalBoolean( req.body.is_affiliate, false )      , h_format.fields.types.boolean.name, h_format.fields.types.boolean.operators.not_equal                 , null )
            ];
        }
        if( main_action === 'create' ){
            
            format_address = [
                h_format.objectValidField( 'first_name'     , h_validation.evalString( req.body.address.first_name, null )  , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , null ),
                h_format.objectValidField( 'last_name'      , h_validation.evalString( req.body.address.last_name, null )   , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , null ),
                h_format.objectValidField( 'company'        , h_validation.evalString( req.body.address.company, null )     , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , null ),
                h_format.objectValidField( 'address_1'      , h_validation.evalString( req.body.address.address_1, null )   , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , null ),
                h_format.objectValidField( 'address_2'      , h_validation.evalString( req.body.address.address_2, null )   , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , undefined ),
                h_format.objectValidField( 'country'        , h_validation.evalString( req.body.address.country, null )     , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , null ),
                h_format.objectValidField( 'country_code'   , h_validation.evalString( req.body.address.country_code, null ), h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , null ),
                h_format.objectValidField( 'state'          , h_validation.evalString( req.body.address.state, null )       , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , null ),
                h_format.objectValidField( 'state_code'     , h_validation.evalString( req.body.address.state_code, null )  , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , null ),
                h_format.objectValidField( 'city'           , h_validation.evalString( req.body.address.city, null )        , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , null ),
                h_format.objectValidField( 'zip'            , h_validation.evalString( req.body.address.zip, null )         , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , null ),
                h_format.objectValidField( 'phone'          , h_validation.evalString( req.body.address.phone, null )       , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , null )
            ];
            format_additional_data_customer = format_additional_data_customer.concat([
                h_format.objectValidField( 'check_terms_and_conditions' , h_validation.evalBoolean( req.body.check_terms_and_conditions, false ), h_format.fields.types.boolean.name, h_format.fields.types.boolean.operators.not_equal , null ),
                h_format.objectValidField( 'source'                     , h_validation.evalString( req.body.source, null )                      , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , '' ),
                h_format.objectValidField( 'idGoogleAdd'                , h_validation.evalString( req.body.idGoogleAdd, null )                 , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , '' ),
                h_format.objectValidField( 'origin'                     , h_validation.evalString( req.body.origin, null )                      , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , '' ),
                h_format.objectValidField( 'utmSource'                  , h_validation.evalString( req.body.utmSource, null )                   , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , '' ),
                h_format.objectValidField( 'utmMedium'                  , h_validation.evalString( req.body.utmMedium, null )                   , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , '' ),
                h_format.objectValidField( 'utmCampaign'                , h_validation.evalString( req.body.utmCampaign, null )                 , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , '' ),
                h_format.objectValidField( 'utmTerm'                    , h_validation.evalString( req.body.utmTerm, null )                     , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , '' )
            ]);
        }
        format_basic_data_customer = format_basic_data_customer.concat( format_additional_data_customer );
    }
    else if( main_action === 'create' ){
        
        let format_additional_data_customer = [
            h_format.objectValidField( 'storefront', h_validation.evalObjectId( req.body.storefront, null ), h_format.fields.types.string.name, h_format.fields.types.string.operators.not_equal, undefined ),
        ];
        format_basic_data_customer = format_basic_data_customer.concat( format_additional_data_customer );
    }
    format_basic_data_customer  = h_validation.evalFields( req.body, format_basic_data_customer );
    format_address              = format_address.is_valid ? format_address : h_validation.evalFields( req.body, format_address );
    
    return { 
        is_valid: format_basic_data_customer.is_valid && format_address.is_valid,
        body_object: {
            basic_data_customer: format_basic_data_customer.body_object,
            address: format_address.body_object
        },
        error_fields: format_basic_data_customer.error_fields.concat( format_address.error_fields )
    };
}
/**
* 
* @param {*} data_template 
* @param {*} template_file { item_sheet, first_reg, arr_columns, index_col, column } 
* @param {*} data_file { file, data_sheet, index_data, item_data }
* @param {*} format_currency { locale, code }
* @returns 
*/
async function formatBodyGoogleAddsFile( data_template, template_file, data_file, format_currency ){
    
    let formula_excel = null;
    let index_row = parseInt( template_file.first_reg );
    let cell_file = `${ template_file.column }${ index_row + data_file.index_data }`;
    let cell_template = `${ template_file.column }${ template_file.first_reg }`;
    let item_file = data_file.item_data.row.columns.find( (item) => item.index_column === template_file.index_col );
    
    if( item_file ){
        
        data_template.Sheets[template_file.item_sheet][cell_file] = h_excel.addCellExcel( data_template, data_template.Sheets[template_file.item_sheet][cell_template], item_file.value, format_currency, formula_excel );
    }
    
    return data_template;
};
/**
 * 
 * @returns 
 */
function generateAffiliateCode(){
    
    const letters       = 'abcdefghijklmnopqrstuvwxyz';
    const numbers       = '0123456789';
    const totalLength   = 9;
    const numberCount   = 4;
    
    let result = [];
    let letterCount = totalLength - numberCount;
    
    // Generar letras aleatorias
    for (let i = 0; i < letterCount; i++) {
        const randomLetter = letters.charAt(Math.floor(Math.random() * letters.length));
        result.push(randomLetter);
    }
    
    // Generar números aleatorios
    for (let i = 0; i < numberCount; i++) {
        const randomNumber = numbers.charAt(Math.floor(Math.random() * numbers.length));
        result.push(randomNumber);
    }
    
    // Mezclar el resultado para que letras y números estén en posiciones aleatorias
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    
    return result.join('').toUpperCase();
};
/**
 * 
 * @param {*} marketplace_id 
 * @param {*} storefront_id 
 * @param {*} customer_id 
 * @param {*} code 
 * @returns 
 */
async function validateExistCodeAffiliate( marketplace_id, storefront_id, customer_id, code ){
    
    try {
        
        let affiliete_result = await backAffiliateService({ marketplace: marketplace_id, customer: customer_id, storefront: storefront_id, code: code }, { code: 1 });
        if( affiliete_result.success && affiliete_result.body === null ){
            
            return { success: true, body: { validate: true, code: code } };
        }
        else{
            
            return { success: false, body: null, error: affiliete_result }
        }
    } catch (process_error) {
        
        return { success: false, body: null, error: process_error };
    }
};
// =============================================================================
// EXPORTS
// =============================================================================
module.exports = {
    get:{
        redirectPaymentCustomer,
        list,
        listAddresses,
        findAgent
    },
    post:{
        listByAgent,
        create,
        createAdmin,
        find,
        addProfileImage,
        validEmail
    },
    put:{
        update,
        saveAddress
    },
    delete:{
        deleteAddress
    }
};