// =============================================================================
// HELPERS
// =============================================================================
const h_response    = require('../../../helpers/response');
const h_validation  = require('../../../helpers/validation');
const h_format      = require('../../../helpers/format');
const h_crud          = require('../../../helpers/crud');
// =============================================================================
// SERVICES
// =============================================================================
const {
    backMenuOptionService,
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
        
        await h_crud.findDocument('Menu Option', backMenuOptionService, { _id: format_data.body_object.id }, req.body.fields, req.body.options).then( async (result_document) => {
            
            res.status(200).json( result_document );
            
        }).catch( (error_document) => {
            
            res.status(400).send( error_document );
        });
    }
    else{
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Menu Option fields required not validated' ) );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function listDocuments(req, res){
    
    await h_crud.listDocuments('Menu Option', backMenuOptionService, req.body.query, req.body.fields, req.body.options).then( async (result_document) => {
        
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
        h_format.objectValidField( 'name'           , h_validation.evalString( req.body.name, '' )              , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal, '' ),
        h_format.objectValidField( 'url'            , h_validation.evalString( req.body.url, '' )               , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal, '' ),
        h_format.objectValidField( 'icon'           , h_validation.evalString( req.body.icon, '' )              , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal, '' ),
        h_format.objectValidField( 'custom_css'     , h_validation.evalString( req.body.custom_css, '' )        , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal, '' ),
        h_format.objectValidField( 'is_dashboard'   , h_validation.evalBoolean( req.body.is_dashboard, false )  , h_format.fields.types.boolean.name, h_format.fields.types.string.operators.not_equal, null )
    ];
    format_data = h_validation.evalFields( req.body, format_data );
    
    if( format_data.is_valid ){
        
        await h_crud.createDocument('Menu Option', backMenuOptionService, { email: format_data.body_object.email }, format_data.body_object, false).then( async (result_document) => {
            
            res.status(200).json( result_document );
            
        }).catch( (error_document) => {
            
            res.status(400).send( error_document );
        });
    }
    else{
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Menu Option fields required not validated' ) );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function updateDocument(req, res){
    
    let format_data = [
        h_format.objectValidField( 'id'             , h_validation.evalObjectId( req.param.id )                 , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal, null ),
        h_format.objectValidField( 'name'           , h_validation.evalString( req.body.name, '' )              , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal, '' ),
        h_format.objectValidField( 'url'            , h_validation.evalString( req.body.url, '' )               , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal, '' ),
        h_format.objectValidField( 'icon'           , h_validation.evalString( req.body.icon, '' )              , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal, '' ),
        h_format.objectValidField( 'custom_css'     , h_validation.evalString( req.body.custom_css, '' )        , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal, '' ),
        h_format.objectValidField( 'is_dashboard'   , h_validation.evalBoolean( req.body.is_dashboard, false )  , h_format.fields.types.boolean.name, h_format.fields.types.string.operators.not_equal, null )
    ];
    format_data = h_validation.evalFields( {...req.body, id: req.param.id }, format_data );
    
    if( format_data.is_valid ){
        
        let document_id = format_data.body_object.id;
        delete format_data.body_object.id;
        
        await h_crud.updateDocument('Menu Option', backMenuOptionService, { _id: document_id }, format_data.body_object).then( async (result_document) => {
            
            res.status(200).json( result_document );
            
        }).catch( (error_document) => {
            
            res.status(400).send( error_document );
        });
    }
    else{
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Menu Option fields required not validated' ) );
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
        await h_crud.updateDocument('Menu Option', backMenuOptionService, { _id: document_id }, format_data.body_object).then( async (result_document) => {
            
            res.status(200).json( result_document );
        }).catch( (error_document) => {
            
            res.status(400).send( error_document );
        });
    }
    else{
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Menu Option fields required not validated' ) );
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
        
        await h_crud.deleteDocument('Menu Option', backMenuOptionService, format_data.body_object.id).then( async (result_document) => {
            
            res.status(200).json( result_document );
            
        }).catch( (error_document) => {
            
            res.status(400).send( error_document );
        });
    }
    else{
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Menu Option fields required not validated' ) );
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