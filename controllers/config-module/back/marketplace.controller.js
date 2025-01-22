// =============================================================================
// HELPERS
// =============================================================================
const h_format      = require('../../../helpers/format');
const h_validation  = require('../../../helpers/validation');
const h_response    = require('../../../helpers/response');
const h_crud        = require('../../../helpers/crud');
// =============================================================================
// SERVICES
// =============================================================================
const { 
    backMarketplaceService
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
        
        await h_h_crud.findDocument('Marketplace', backMarketplaceService, { _id: format_data.body_object.id }, req.body.fields, req.body.options).then( async (result_document) => {
            
            res.status(200).json( result_document );
            
        }).catch( (error_document) => {
            
            res.status(400).send( error_document );
        });
    }
    else{
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Marketplace fields required not validated' ) );
    }
};
/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
async function listDocuments(req, res){

    await h_h_crud.listDocuments('Marketplace', backMarketplaceService, req.body.query, req.body.fields, req.body.options).then( async (result_document) => {

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
        h_format.objectValidField( 'name'           , h_validation.evalString( req.body.name )              , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal      , null ),
        h_format.objectValidField( 'type'           , h_validation.evalString( req.body.type, 'shopify' )   , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal      , null ),
        h_format.objectValidField( 'description'    , h_validation.evalString( req.body.description, '' )   , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal      , null ),
        h_format.objectValidField( 'credentials'    , h_validation.evalObject( req.body.credentials, null ) , h_format.fields.types.object.name , h_format.fields.types.object.operators.not_equal      , null ),
        h_format.objectValidField( 'access'         , h_validation.evalObject( req.body.access, null )      , h_format.fields.types.object.name , h_format.fields.types.object.operators.contains     , 'products' ),
        h_format.objectValidField( 'order_origins'  , h_validation.evalArray( req.body.order_origins, [] )  , h_format.fields.types.array.name  , h_format.fields.types.array.operators.length_greater_than     , 0 ),
    ];
    format_data     = h_validation.evalFields( req.body, format_data );

    if( format_data.is_valid ){

        format_data.body_object.handle = format_data.body_object.name != null ? h_format.slug( format_data.body_object.name ) : null;
        await h_h_crud.createDocument('Marketplace', backMarketplaceService, { name: format_data.body_object.name }, format_data.body_object, false).then( async (result_document) => {

            res.status(200).json( result_document );
            
        }).catch( (error_document) => {

            res.status(400).send( error_document );
        });
    }
    else{
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Marketplace fields required not validated' ) );
    }
};
/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
async function updateDocument(req, res){
    
    let format_data = [
        h_format.objectValidField( 'name'           , h_validation.evalString( req.body.name )              , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal      , null ),
        h_format.objectValidField( 'type'           , h_validation.evalString( req.body.type, 'shopify' )   , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal      , null ),
        h_format.objectValidField( 'description'    , h_validation.evalString( req.body.description, '' )   , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal      , null ),
        h_format.objectValidField( 'credentials'    , h_validation.evalObject( req.body.credentials, null ) , h_format.fields.types.object.name , h_format.fields.types.object.operators.not_equal      , null ),
        h_format.objectValidField( 'access'         , h_validation.evalObject( req.body.access, null )      , h_format.fields.types.object.name , h_format.fields.types.object.operators.contains     , 'products' ),
        h_format.objectValidField( 'order_origins'  , h_validation.evalArray( req.body.order_origins, [] )  , h_format.fields.types.array.name  , h_format.fields.types.array.operators.length_greater_than     , 0 ),
    ];
    format_data     = h_validation.evalFields( {...req.body, id: req.param.id }, format_data );

    if( format_data.is_valid ){

        let document_id = format_data.body_object.id;
        delete format_data.body_object.id;

        format_data.body_object.handle = format_data.body_object.name != null ? h_format.slug( format_data.body_object.name ) : null;
        await h_h_crud.updateDocument('Marketplace', backMarketplaceService, { _id: document_id }, format_data.body_object).then( async (result_document) => {

            res.status(200).json( result_document );
            
        }).catch( (error_document) => {

            res.status(400).send( error_document );
        });
    }
    else{
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Marketplace fields required not validated' ) );
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

        await h_h_crud.updateDocument('Marketplace', backMarketplaceService, { _id: document_id }, format_data.body_object).then( async (result_document) => {
            
            res.status(200).json( result_document );
        }).catch( (error_document) => {
            
            res.status(400).send( error_document );
        });
    }
    else{
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Marketplace fields required not validated' ) );
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
        
        await h_h_crud.deleteDocument('Marketplace', backMarketplaceService, format_data.body_object.id).then( async (result_document) => {

            res.status(200).json( result_document );
            
        }).catch( (error_document) => {

            res.status(400).send( error_document );
        });
    }
    else{
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Marketplace fields required not validated' ) );
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