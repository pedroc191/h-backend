// =============================================================================
// PACKAGES
// =============================================================================
// =============================================================================
// HELPERS
// =============================================================================
const h_format      = require('../../../helpers/format');
const h_array       = require('../../../helpers/array');
const h_validation  = require('../../../helpers/validation');
const h_response    = require('../../../helpers/response');
const h_crud        = require('../../../helpers/crud');
// =============================================================================
// SERVICES
// =============================================================================
const {
    backStorefrontService,
    backAffiliateService,
    backCustomerService,
} = require('../../../services/manager');
// =============================================================================
// REST FUNCTIONS
// =============================================================================
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function findDocument(req, res){
    
    try {
        let storefront_result = req.auth.storefront === null ? await backStorefrontService.find({ marketplace: req.auth.marketplace, subdomain: 'storefront' }, { _id: 1 }) : { success: true, body: { _id: req.auth.storefront } };
        
        if( storefront_result.success && storefront_result.body != null ){
            
            let affiliate_result = await backAffiliateService.findOne({ marketplace: req.auth.marketplace, customer: req.auth.user.customer._id.toString(), storefront: storefront_result.body._id.toString() });
            
            if( affiliate_result.success && affiliate_result.body != null ){
                
                res.status(200).json( h_response.request( true, affiliate_result.body, 200, 'Success: Affiliate Find', 'Affiliate found successfully') );
            }
            else{
                
                res.status(400).send( h_response.request( false, {}, 400, 'Error: Affiliate Find', 'Affiliate not found') );
            }
        }
        else{
            
            res.status(400).send( h_response.request( false, {}, 400, 'Error: Affiliate Find', 'Storefront not found') );
        }
    } catch (process_error) {
        
        res.status(400).send( h_response.request( false, process_error, 400, 'Error: Affiliate Find', 'The process of finding an affiliate has failed') );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function listDocuments(req, res){
    
    await h_crud.listDocuments('Affiliate', backAffiliateService, req.body.query, req.body.fields, req.body.options).then( async (result_document) => {
        
        res.status(200).json( result_document );
        
    }).catch( (error_document) => {
        
        res.status(400).send( error_document );
    });
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function createDocument(req, res){
    
    try {
        let storefront_result = req.auth.storefront === null ? await backStorefrontService.find({ marketplace: req.auth.marketplace, subdomain: 'storefront' }, { _id: 1 }) : { success: true, body: { _id: req.auth.storefront } };
        
        if( storefront_result.success && storefront_result.body != null ){
            
            let affiliate_result = await backAffiliateService.find({ marketplace: req.auth.marketplace, customer: req.auth.user.customer._id.toString(), storefront: storefront_result.body._id.toString() });
            
            if( affiliate_result.success && affiliate_result.body === null ){
                
                let max_attempts    = 10;
                let attempts        = 0;
                let unique_code     = null;
                
                while( attempts <= max_attempts || unique_code === null ){
                    
                    let exist_code = await validateExistCodeAffiliate( req.auth.marketplace, storefront_result.body._id.toString(), req.auth.user.customer, generateAffiliateCode() );
                    
                    if( exist_code.success ){
                        
                        unique_code = exist_code.body.code;
                        break;
                    }
                    else{
                        
                        attempts++;
                    }
                }
                if( unique_code != null ){
                    
                    let body_create = { 
                        marketplace : req_auth.marketplace, 
                        customer    : req.auth.user.customer, 
                        storefront  : storefront_result.body._id.toString(),
                        code        : unique_code
                    };
                    let affiliate_created = await backAffiliateService.create( body_create );
                    
                    if( affiliate_created.success ){
                        
                        await backCustomerService.update( req.auth.user.customer._id.toString(), { is_affiliate: true } );
                        res.status(200).json( h_response.request( true, affiliate_created.body, 200, 'Success: Affiliate Create', 'Customer successfully registered as an affiliate') );
                    }
                    else{
                        
                        res.status(400).send( h_response.request( false, affiliate_created, 400, 'Error: Affiliate Create', 'Affiliate could not be registered') );
                    }
                }
                else{
                    
                    res.status(400).send( h_response.request( false, {}, 400, 'Error: Affiliate Create', 'Affiliate code could not be generated please try again') );
                }
            }
            else{
                
                res.status(200).send( h_response.request( false, affiliate_result.body, 200, 'Success: Affiliate Create', 'Customer is already registered as an affiliate') );
            }
        }
        else{
            
            res.status(400).send( h_response.request( false, {}, 400, 'Error: Affiliate Create', 'Storefront not found') );
        }
    } catch (process_error) {
        
        res.status(400).send( h_response.request( false, process_error, 400, 'Error: Affiliate Create', 'The process of registering an affiliate has failed') );
    }
};
async function updateDocument(req, res){
    
    try {
        let format_data = [
            h_format.objectValidField('discount'    , h_validation.evalInt(req.body.discount, 20)   , h_format.fields.types.number.name, h_format.fields.types.number.operators.not_equal, null ),
            h_format.objectValidField('commision'   , h_validation.evalInt(req.body.commision, 20)  , h_format.fields.types.number.name, h_format.fields.types.number.operators.not_equal, null ),
            h_format.objectValidField('days_to_pay' , h_validation.evalInt(req.body.days_to_pay, 30), h_format.fields.types.number.name, h_format.fields.types.number.operators.not_equal, null )
        ];
        
        format_data = h_validation.evalFields( req.body, format_data );
        
        if( format_data.is_valid ){
            
            let storefront_result = req.auth.storefront === null ? await backStorefrontService.find({ marketplace: req.auth.marketplace, subdomain: 'storefront' }, { _id: 1 }) : { success: true, body: { _id: req.auth.storefront } };
            
            if( storefront_result.success && storefront_result.body != null ){
                
                if( !req.body.query ){
                    
                    req.body.query = { marketplace: req.auth.marketplace, customer: req.auth.user.customer._id.toString(), storefront: storefront_result.body._id.toString() };
                }
                await h_crud.updateDocument('Affiliate', backAffiliateService, req.body.query, req.body.options).then( async (result_document) => {
                    
                    res.status(200).json( result_document );
                    
                }).catch( (error_document) => {
                    
                    res.status(400).send( error_document );
                });
            }
            else{
                
                res.status(400).send( h_response.request( false, {}, 400, 'Error: Affiliate Update', 'Storefront not found') );
            }
        }
        else{
            
            res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Affiliate fields required not validated' ) );
        }
    } catch (process_error) {
        
        res.status(400).send( h_response.request( false, process_error, 400, 'Error: Affiliate Update', 'The process of updating an affiliate has failed') );
    }
}
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function disabledDocument(req, res){
    
    try {
        let storefront_result = req.auth.storefront === null ? await backStorefrontService.find({ marketplace: req.auth.marketplace, subdomain: 'storefront' }, { _id: 1 }) : { success: true, body: { _id: req.auth.storefront } };
        
        if( storefront_result.success && storefront_result.body != null ){
            
            let affiliate_result = await backAffiliateService.findOne({ marketplace: req.auth.marketplace, customer: req.auth.user.customer._id.toString(), storefront: storefront_result.body._id.toString() });
            
            if( affiliate_result.success && affiliate_result.body != null ){
                
                let affiliate_disabled = await backAffiliateService.update( affiliate_result.body._id.toString(), { status: 'inactive' } );
                
                if( affiliate_disabled.success ){
                    
                    await backCustomerService.update( req.auth.user.customer._id.toString(), { is_affiliate: false } );
                    res.status(200).json( h_response.request( true, affiliate_disabled.body, 200, 'Success: Affiliate Disabled', 'Affiliate successfully disabled') );
                }
                else{
                    
                    res.status(400).send( h_response.request( false, affiliate_disabled, 400, 'Error: Affiliate Disabled', 'Affiliate could not be disabled') );
                }
            }
            else{
                
                res.status(400).send( h_response.request( false, {}, 400, 'Error: Affiliate Disabled', 'Affiliate not found') );
            }
        }
        else{
            
            res.status(400).send( h_response.request( false, {}, 400, 'Error: Affiliate Create', 'Storefront not found') );
        }
    } catch (process_error) {
        
        res.status(400).send( h_response.request( false, process_error, 400, 'Error: Affiliate Disabled', 'The process of disabling an affiliate has failed') );
    }
};
// =============================================================================
// GENERAL FUNCTIONS
// =============================================================================
// =============================================================================
// EXPORTS
// =============================================================================
module.exports = {
    get:{
    },
    post:{
        findDocument,
        listDocuments,
        createDocument
    },
    put:{
        updateDocument,
        disabledDocument
    },
    delete:{
    }
};
