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
    backLanguageService
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
        h_format.objectValidField( 'id_handle', h_validation.evalString( req.params.id_handle ), h_format.fields.types.string.name, h_format.fields.types.string.operators.not_equal, null ),
    ];
    format_data = h_validation.evalFields( { id_handle: req.params.id_handle }, format_data );

    if( format_data.is_valid ){
        
        let find_query = h_format.findQuery( format_data.body_object.id_handle );
    
        await h_crud.findDocument( 'Language', backLanguageService, find_query ).then( async (result_document) => {
            
            res.status(200).json( result_document );
            
        }).catch( (error_document) => {
            
            res.status(400).send( error_document );
        });
    }
    else{
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Language fields required not validated' ) );
    }
};
/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
async function listDocuments(req, res){

    await h_crud.listDocuments('Language', backLanguageService, req.body.query, req.body.fields, req.body.options).then( async (result_document) => {

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
        h_format.objectValidField( 'name'    , h_validation.evalString( req.body.name, '' )         , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal      , '' ),
        h_format.objectValidField( 'key_code', h_validation.evalString( req.body.key_code, '' )     , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal      , '' ),
        h_format.objectValidField( 'code'    , h_validation.evalString( req.body.code, '' )         , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal      , '' ),
        h_format.objectValidField( 'flag'    , h_validation.evalString( req.body.flag, '' )         , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal      , '' ),
        h_format.objectValidField( 'primary' , h_validation.evalBoolean( req.body.primary, false )  , h_format.fields.types.boolean.name, h_format.fields.types.boolean.operators.not_equal     , null ),
    ];
    format_data = h_validation.evalFields( req.body, format_data );

    if( format_data.is_valid ){

        format_data.body_object.handle = format_data.body_object.name != null ? h_format.slug( format_data.body_object.name ) : null;
        await h_crud.createDocument('Language', backLanguageService, { name: format_data.body_object.name }, format_data.body_object, false).then( async (result_document) => {

            res.status(200).json( result_document );
            
        }).catch( (error_document) => {

            res.status(400).send( error_document );
        });
    }
    else{
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Language fields required not validated' ) );
    }
};
/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
async function updateDocument(req, res){
    
    let format_data = [
        h_format.objectValidField( 'id'      , h_validation.evalObjectId( req.param.id )            , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , null ),
        h_format.objectValidField( 'name'    , h_validation.evalString( req.body.name, '' )         , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , '' ),
        h_format.objectValidField( 'key_code', h_validation.evalString( req.body.key_code, '' )     , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , '' ),
        h_format.objectValidField( 'code'    , h_validation.evalString( req.body.code, '' )         , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , '' ),
        h_format.objectValidField( 'flag'    , h_validation.evalString( req.body.flag, '' )         , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , '' ),
        h_format.objectValidField( 'primary' , h_validation.evalBoolean( req.body.primary, false )  , h_format.fields.types.boolean.name, h_format.fields.types.boolean.operators.not_equal     , null ),
    ];
    format_data = h_validation.evalFields( {...req.body, id: req.param.id }, format_data );

    if( format_data.is_valid ){

        let document_id = format_data.body_object.id;
        delete format_data.body_object.id;

        format_data.body_object.handle = format_data.body_object.name != null ? h_format.slug( format_data.body_object.name ) : null;
        await h_crud.updateDocument('Language', backLanguageService, { _id: document_id }, format_data.body_object).then( async (result_document) => {

            res.status(200).json( result_document );
            
        }).catch( (error_document) => {

            res.status(400).send( error_document );
        });
    }
    else{
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Language fields required not validated' ) );
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

        await h_crud.updateDocument('Language', backLanguageService, { _id: document_id }, format_data.body_object).then( async (result_document) => {
            
            res.status(200).json( result_document );
        }).catch( (error_document) => {
            
            res.status(400).send( error_document );
        });
    }
    else{
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Language fields required not validated' ) );
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
        
        await h_crud.deleteDocument('Language', backLanguageService, format_data.body_object.id).then( async (result_document) => {

            res.status(200).json( result_document );
            
        }).catch( (error_document) => {

            res.status(400).send( error_document );
        });
    }
    else{
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Language fields required not validated' ) );
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
        findDocument
    },
    post:{
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