// =============================================================================
// PACKAGES
// =============================================================================
const jwt           = require('jsonwebtoken');
// =============================================================================
// CREDENTIALS
// =============================================================================
const config_encrypted_keys   = require('../../../config/encrypted-keys');
// =============================================================================
// HELPERS
// =============================================================================
const h_format      = require('../../../helpers/format');
const h_validation  = require('../../../helpers/validation');
const h_response    = require('../../../helpers/response');
const h_crud          = require('../../../helpers/crud');
// =============================================================================
// SERVICES
// =============================================================================
const { 
    backApplicationService
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
        
        await h_crud.findDocument('Application', backApplicationService, { _id: format_data.body_object.id }, req.body.fields, req.body.options).then( async (result_document) => {
            
            res.status(200).json( result_document );
            
        }).catch( (error_document) => {
            
            res.status(400).send( error_document );
        });
    }
    else{
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Application fields required not validated' ) );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function listDocuments(req, res){
    
    await h_crud.listDocuments('Application', backApplicationService, req.body.query, req.body.fields, req.body.options ).then( async (result_document) => {
        
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
        h_format.objectValidField( 'name'       , h_validation.evalString( req.body.name, null )        , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal                  , '' ),
        h_format.objectValidField( 'description', h_validation.evalString( req.body.description, null ) , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal                  , '' ),
        h_format.objectValidField( 'host'       , h_validation.evalString( req.body.host, null )        , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal                  , '' ),
        h_format.objectValidField( 'endpoints'  , h_validation.evalArray( req.body.endpoints, null )    , h_format.fields.types.array.name  , h_format.fields.types.array.operators.length_greater_than_or_equal, 0 ),
        h_format.objectValidField( 'test_mode'  , h_validation.evalBoolean( req.body.test_mode, false ) , h_format.fields.types.boolean.name, h_format.fields.types.boolean.operators.not_equal                 , null )
    ];
    format_data = h_validation.evalFields( req.body, format_data );
    
    if( format_data.is_valid ){
        
        format_data.body_object.handle = format_data.body_object.name != null ? h_format.slug( format_data.body_object.name ) : null;
        
        await h_crud.createDocument( 'Application', backApplicationService, { name: format_data.body_object.name }, format_data.body_object, false ).then( async (result_document) => {
            
            const token_login = jwt.sign( { 
                user    : result_document.body._id.toString(), 
                handle  : result_document.body.handle, 
                access  : { host: result_document.body.host, is_app: true }
            }, config_encrypted_keys.session );
            
            let application_updated = await backApplicationService.update({ _id: result_document.body._id }, { token: token_login });
            
            if( application_updated.success && application_updated.body != null ){
                
                result_document.body.token = token_login;
                res.status(200).json( result_document );
            }
            else{
                
                res.status(400).send( h_response.request( false, application_updated, 400, 'Error: Request', 'Application Created, but not updated token' ) );
            }
        }).catch( (error_document) => {
            
            res.status(400).send( error_document );
        });
    }
    else{
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Application fields required not validated' ) );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function updateDocument(req, res){
    
    let format_data = [
        h_format.objectValidField( 'id'         , h_validation.evalObjectId( req.param.id )             , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal                  , null ),
        h_format.objectValidField( 'name'       , h_validation.evalString( req.body.name, null )        , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal                  , null ),
        h_format.objectValidField( 'description', h_validation.evalString( req.body.description, null ) , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal                  , null ),
        h_format.objectValidField( 'host'       , h_validation.evalString( req.body.host, null )        , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal                  , null ),
        h_format.objectValidField( 'endpoints'  , h_validation.evalArray( req.body.endpoints, null )    , h_format.fields.types.array.name  , h_format.fields.types.array.operators.length_greater_than_or_equal, 0 ),
        h_format.objectValidField( 'test_mode'  , h_validation.evalBoolean( req.body.test_mode, false ) , h_format.fields.types.boolean.name, h_format.fields.types.boolean.operators.not_equal                 , null )
    ];
    format_data = h_validation.evalFields( {...req.body, id: req.param.id }, format_data );
    
    if( format_data.is_valid ) {
        
        let document_id = format_data.body_object.id;
        delete format_data.body_object.id;

        format_data.body_object.handle = format_data.body_object.name != null ? h_format.slug( format_data.body_object.name ) : null;
        
        const token_login = jwt.sign( { 
            user    : document_id, 
            handle  : format_data.body_object.handle, 
            access  : { host: format_data.body_object.host, is_app: true }
        }, config_encrypted_keys.session );
        
        format_data.body_object.token = token_login;
        
        await h_crud.updateDocument('Application', backApplicationService, { _id: document_id }, format_data.body_object).then( async (result_document) => {
            
            res.status(200).json( result_document );
        }).catch( (error_document) => {
            
            res.status(400).send( error_document );
        });
    }
    else{
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Application fields required not validated' ) );
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
        await h_crud.updateDocument('Application', backApplicationService, { _id: document_id }, format_data.body_object).then( async (result_document) => {
            
            res.status(200).json( result_document );
        }).catch( (error_document) => {
            
            res.status(400).send( error_document );
        });
    }
    else{
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Application fields required not validated' ) );
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
        
        await h_crud.deleteDocument('Application', backApplicationService, format_data.body_object.id).then( async (result_document) => {
            
            res.status(200).json( result_document );
            
        }).catch( (error_document) => {
            
            res.status(400).send( error_document );
        });
    }
    else{
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Application fields required not validated' ) );
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