// =============================================================================
// PACKAGES
// =============================================================================
// =============================================================================
// HELPERS
// =============================================================================
const h_format      = require('../../../helpers/format');
const h_validation  = require('../../../helpers/validation');
const h_response    = require('../../../helpers/response');
const h_crud        = require('../../../helpers/crud');
// =============================================================================
// CREDENTIALS
// =============================================================================
// =============================================================================
// SERVICES
// =============================================================================
const {
    backBrandService,
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
    
    let format_data = [
        h_format.objectValidField( 'id', h_validation.evalObjectId( req.param.id ), h_format.fields.types.string.name, h_format.fields.types.string.operators.not_equal, null ),
    ];
    format_data = h_validation.evalFields( { id: req.param.id }, format_data );
    
    if( format_data.is_valid ){
        
        await h_crud.findDocument('Brand', backBrandService, { _id: format_data.body_object.id }, req.body.fields, req.body.options).then( async (result_document) => {
            
            res.status(200).json( result_document );
            
        }).catch( (error_document) => {
            
            res.status(400).send( error_document );
        });
    }
    else{
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Brand fields required not validated' ) );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function listDocuments(req, res){
    
    await h_crud.listDocuments('Brand', backBrandService, req.body.query, req.body.fields, req.body.options).then( async (result_document) => {
        
        result_document.body = result_document.body.map( (item_brand) => { 

            if( item_brand.logo != null ){

                item_brand.logo = `${ item_brand.logo }?v=${ h_format.randomNumber( 1000000000, 9999999999 ) }`;
            } 
            return item_brand; 
        });
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
async function updateDocument(req, res){
    
    let format_data = [
        h_format.objectValidField( 'logo'           , h_validation.evalString( req.body.logo, null )            , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal      , '' ),
        h_format.objectValidField( 'collection_url' , h_validation.evalString( req.param.collection_url, null ) , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal      , '' ),
        h_format.objectValidField( 'customer_brand' , h_validation.evalBoolean( req.body.customer_brand, false ), h_format.fields.types.boolean.name, h_format.fields.types.boolean.operators.not_equal     , null ),
        h_format.objectValidField( 'notify_stock'   , h_validation.evalBoolean( req.body.notify_stock, false )  , h_format.fields.types.boolean.name, h_format.fields.types.boolean.operators.not_equal     , null ),
        h_format.objectValidField( 'min_stock'      , h_validation.evalInt( req.body.min_stock, 0 )             , h_format.fields.types.number.name , h_format.fields.types.number.operators.not_equal      , 0 )
    ];
    format_data = h_validation.evalFields( {...req.body, id: req.param.id }, format_data );
    
    if( format_data.is_valid ){
        
        let document_id = format_data.body_object.id;
        delete format_data.body_object.id;
        
        format_data.body_object.handle = format_data.body_object.name != null ? h_format.slug( format_data.body_object.name ) : null;
        await h_crud.updateDocument('Brand', backBrandService, { _id: document_id }, format_data.body_object).then( async (result_document) => {
            
            res.status(200).json( result_document );
            
        }).catch( (error_document) => {
            
            res.status(400).send( error_document );
        });
    }
    else{
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Brand fields required not validated' ) );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function updateDocumentStatus(req, res){
    
    let format_data = [
        h_format.objectValidField( 'id'      , h_validation.evalObjectId( req.param.id )         , h_format.fields.types.string.name, h_format.fields.types.string.operators.not_equal, null ),
        h_format.objectValidField( 'status'  , h_validation.evalString( req.body.status, null )  , h_format.fields.types.string.name, h_format.fields.types.string.operators.not_equal, null ),
    ];
    format_data = h_validation.evalFields( {...req.body, id: req.param.id }, format_data );
    
    if( format_data.is_valid ) {
        
        let document_id = format_data.body_object.id;
        delete format_data.body_object.id;
        
        await h_crud.updateDocument('Brand', backBrandService, { _id: document_id }, format_data.body_object).then( async (result_document) => {
            
            res.status(200).json( result_document );
        }).catch( (error_document) => {
            
            res.status(400).send( error_document );
        });
    }
    else{
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Brand fields required not validated' ) );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function deleteDocument(req, res){
    
    let format_data = [
        h_format.objectValidField( 'id', h_validation.evalObjectId( req.param.id ), h_format.fields.types.string.name, h_format.fields.types.string.operators.not_equal, null ),
    ];
    format_data = h_validation.evalFields( { id: req.param.id }, format_data );
    
    if( format_data.is_valid ) {
        
        await h_crud.deleteDocument('Brand', backBrandService, format_data.body_object.id).then( async (result_document) => {
            
            res.status(200).json( result_document );
            
        }).catch( (error_document) => {
            
            res.status(400).send( error_document );
        });
    }
    else{
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Brand fields required not validated' ) );
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
    },
    put:{
        updateDocument,
        updateDocumentStatus
    },
    delete:{
        deleteDocument
    }
};