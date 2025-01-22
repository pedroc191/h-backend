// =============================================================================
// HELPERS
// =============================================================================
const h_response    = require('../../../helpers/response');
const h_validation  = require('../../../helpers/validation');
const h_format      = require('../../../helpers/format');
const h_crud        = require('../../../helpers/crud');
// =============================================================================
// SERVICES
// =============================================================================
const {
    backAccessProductCatalogService,
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
        
        await h_crud.findDocument('Access Product Catalog', backAccessProductCatalogService, { _id: format_data.body_object.id }, req.body.fields, req.body.options).then( async (result_document) => {
            
            res.status(200).json( result_document );
            
        }).catch( (error_document) => {
            
            res.status(400).send( error_document );
        });
    }
    else{
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Access Product Catalog fields required not validated' ) );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function listDocuments(req, res){
    
    await h_crud.listDocuments('Access Product Catalog', backAccessProductCatalogService, req.body.query, req.body.fields, req.body.options).then( async (result_document) => {
        
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
    
    let format_data = [
        h_format.objectValidField( 'email'        , h_validation.evalString( req.body.email, '' )     , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal      , '' ),
        h_format.objectValidField( 'discounts'    , h_validation.evalArray( req.body.endpoints, null ), h_format.fields.types.array.name  , h_format.fields.types.array.operators.not_empty       , 0 ),
        h_format.objectValidField( 'active_days'  , h_validation.evalInt( req.body.active_days, 0 )   , h_format.fields.types.number.name , h_format.fields.types.number.operators.greater_than   , 0 )
    ];
    format_data = h_validation.evalFields( req.body, format_data );
    
    if( format_data.is_valid ){
        
        format_data.body_object.full_name = h_validation.evalString( req.body.full_name, '' );
        await h_crud.createDocument('Access Product Catalog', backAccessProductCatalogService, { email: format_data.body_object.email }, format_data.body_object, false).then( async (result_document) => {
            
            res.status(200).json( result_document );
            
        }).catch( (error_document) => {
            
            res.status(400).send( error_document );
        });
    }
    else{
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Access Product Catalog fields required not validated' ) );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function updateDocument(req, res){
    
    let format_data = [
        h_format.objectValidField( 'id'          , h_validation.evalObjectId( req.param.id )         , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal      , null ),
        h_format.objectValidField( 'email'       , h_validation.evalString( req.body.email, '' )     , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal      , '' ),
        h_format.objectValidField( 'discounts'   , h_validation.evalArray( req.body.endpoints, null ), h_format.fields.types.array.name  , h_format.fields.types.array.operators.not_empty       , 0 ),
        h_format.objectValidField( 'active_days' , h_validation.evalInt( req.body.active_days, 0 )   , h_format.fields.types.number.name , h_format.fields.types.number.operators.greater_than   , 0 )
    ];
    format_data = h_validation.evalFields( {...req.body, id: req.param.id }, format_data );
    
    if( format_data.is_valid ){
        
        let document_id = format_data.body_object.id;
        delete format_data.body_object.id;
        format_data.body_object.full_name = h_validation.evalString( req.body.full_name, '' );
        await h_crud.updateDocument('Access Product Catalog', backAccessProductCatalogService, { _id: document_id }, format_data.body_object).then( async (result_document) => {
            
            res.status(200).json( result_document );
            
        }).catch( (error_document) => {
            
            res.status(400).send( error_document );
        });
    }
    else{
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Access Product Catalog fields required not validated' ) );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function updateDocumentStatus(req, res){
    
    let format_data = [
        h_format.objectValidField( 'id'      , h_validation.evalObjectId( req.param.id )         , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal, null ),
        h_format.objectValidField( 'status'  , h_validation.evalString( req.body.status, null )  , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal, null ),
    ];
    format_data = h_validation.evalFields( {...req.body, id: req.param.id }, format_data );
    
    if( format_data.is_valid ) {
        
        let document_id = format_data.body_object.id;
        delete format_data.body_object.id;
        await h_crud.updateDocument('Access Product Catalog', backAccessProductCatalogService, { _id: document_id }, format_data.body_object).then( async (result_document) => {
            
            res.status(200).json( result_document );
        }).catch( (error_document) => {
            
            res.status(400).send( error_document );
        });
    }
    else{
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Access Product Catalog fields required not validated' ) );
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
    
    if( format_data.is_valid ){
        
        await h_crud.deleteDocument('Access Product Catalog', backAccessProductCatalogService, format_data.body_object.id).then( async (result_document) => {
            
            res.status(200).json( result_document );
            
        }).catch( (error_document) => {
            
            res.status(400).send( error_document );
        });
    }
    else{
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Access Product Catalog fields required not validated' ) );
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
        updateDocumentStatus
    },
    delete:{
        deleteDocument
    }
};