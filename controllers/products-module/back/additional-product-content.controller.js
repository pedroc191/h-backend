// =============================================================================
// PACKAGES
// =============================================================================
// =============================================================================
// HELPERS
// =============================================================================
const h_format      = require('../../../helpers/format');
const h_validation  = require('../../../helpers/validation');
const h_response    = require('../../../helpers/response');
const h_crud          = require('../../../helpers/crud');
// =============================================================================
// CREDENTIALS
// =============================================================================
// =============================================================================
// SERVICES
// =============================================================================
const {
    backAdditionalProductContentService,
    backLanguageService,
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
    
    let language_result = await backLanguageService.find({ main: false, status: 'active' }, { key_code: 1 });
    
    let format_data     = [
        h_format.objectValidField( 'id', h_validation.evalObjectId( req.param.id ), h_format.fields.types.string.name, h_format.fields.types.string.operators.not_equal, null ),
    ];
    format_data = h_validation.evalFields( { id: req.param.id }, format_data );
    
    if( language_result.success && format_data.is_valid ){
        
        await h_crud.findDocument('Additional Product Content', backAdditionalProductContentService, { _id: format_data.body_object.id }, req.body.fields, req.body.options).then( async (result_document) => {
            if( result_document.body.translate === null ){

                result_document.body.translate = language_result.body.reduce( (previous_item, current_item) => {
                
                    previous_item[ current_item.key_code ] = {
                        title       : result_document.body.title,
                        description : result_document.body.description,
                        url         : result_document.body.url,
                        content     : result_document.body.content
                    };
                    return previous_item;
                    
                }, language_result.body.length > 0 ? {} : null);
            }
            res.status(200).json( result_document );
            
        }).catch( (error_document) => {
            
            res.status(400).send( error_document );
        });
    }
    else if( !format_data.is_valid ){
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Navigation fields required not validated' ) );
    }
    else if( !language_result.success ){
        
        res.status(400).send( h_response.request( false, language_result.body, 400, 'Error: Language Find', 'Languages not found' ) );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function listDocuments(req, res){
    
    let language_result = await backLanguageService.find({ main: false, status: 'active' }, { key_code: 1 });
    
    await h_crud.listDocuments('Additional Product Content', backAdditionalProductContentService, req.body.query, req.body.fields, req.body.options).then( async (result_document) => {
        
        result_document.body = result_document.body.map( (item_content) => { 
            
            if( ['image-link', 'image-preview'].includes( item_content.type ) ){
                
                item_content.url = `${ item_content.url }?v=${ h_format.randomNumber( 1000000000, 9999999999 ) }`;
            } 
            if( item_content.translate === null ){
                
                item_content.translate = language_result.body.reduce( (previous_item, current_item) => {
                
                    previous_item[ current_item.key_code ] = {
                        title       : item_content.title,
                        description : item_content.description,
                        url         : item_content.url,
                        content     : item_content.content
                    };
                    return previous_item;
                    
                }, language_result.body.length > 0 ? {} : null);
            }
            return item_content; 
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
async function createDocument(req, res){
    
    let language_result = await backLanguageService.find({ main: false, status: 'active' }, { key_code: 1 });
    
    let format_data     = [
        h_format.objectValidField( 'title'              , h_validation.evalString( req.body.title )                         , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , null ),
        h_format.objectValidField( 'description'        , h_validation.evalString( req.body.description )                   , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , '' ),
        h_format.objectValidField( 'type'               , h_validation.evalString( req.body.type )                          , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , null ),
        h_format.objectValidField( 'url'                , h_validation.evalString( req.body.url )                           , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , null ),
        h_format.objectValidField( 'content'            , h_validation.evalString( req.body.content, null )                 , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , '' ),
        h_format.objectValidField( 'content_location'   , h_validation.evalString( req.body.content_location, 'gallery' )   , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , null ),
        h_format.objectValidField( 'condition'          , h_validation.evalObject( req.body.condition, null )               , h_format.fields.types.object.name , h_format.fields.types.object.operators.contains   , 'type' ),
        h_format.objectValidField( 'translate'          , h_validation.evalObject( req.body.translate, null )               , h_format.fields.types.object.name , h_format.fields.types.object.operators.not_equal  , {} )
    ];
    format_data     = h_validation.evalFields( req.body, format_data );
    
    if( language_result.success && format_data.is_valid ){
        
        format_data.body_object.handle = format_data.body_object.title != null ? h_format.slug( format_data.body_object.title ) : null;
        if( format_data.body_object.translate === null ){

            format_data.body_object.translate = language_result.body.reduce( (previous_item, current_item) => {
            
                previous_item[ current_item.key_code ] = {
                    title       : format_data.body_object.title,
                    description : format_data.body_object.description,
                    url         : format_data.body_object.url,
                    content     : format_data.body_object.content
                };
                return previous_item;
                
            }, language_result.body.length > 0 ? {} : null);
        }
        await h_crud.createDocument('Additional Product Content', backAdditionalProductContentService, { handle: format_data.body_object.handle }, format_data.body_object).then( async (result_document) => {
            
            res.status(200).json( result_document );
            
        }).catch( (error_document) => {
            
            res.status(400).send( error_document );
        });
    }
    else if( !format_data.is_valid ){
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Navigation fields required not validated' ) );
    }
    else if( !language_result.success ){
        
        res.status(400).send( h_response.request( false, language_result.body, 400, 'Error: Language Find', 'Languages not found' ) );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function updateDocument(req, res){
    
    let language_result = await backLanguageService.find({ main: false, status: 'active' }, { key_code: 1 });
    
    let format_data     = [
        h_format.objectValidField( 'title'              , h_validation.evalString( req.body.title )                         , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , null ),
        h_format.objectValidField( 'description'        , h_validation.evalString( req.body.description )                   , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , '' ),
        h_format.objectValidField( 'type'               , h_validation.evalString( req.body.type )                          , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , null ),
        h_format.objectValidField( 'url'                , h_validation.evalString( req.body.url )                           , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , null ),
        h_format.objectValidField( 'content'            , h_validation.evalString( req.body.content, null )                 , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , '' ),
        h_format.objectValidField( 'content_location'   , h_validation.evalString( req.body.content_location, 'gallery' )   , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , null ),
        h_format.objectValidField( 'condition'          , h_validation.evalObject( req.body.condition, null )               , h_format.fields.types.object.name , h_format.fields.types.object.operators.contains   , 'type' ),
        h_format.objectValidField( 'translate'          , h_validation.evalObject( req.body.translate, null )               , h_format.fields.types.object.name , h_format.fields.types.object.operators.not_equal  , {} )
    ];
    format_data     = h_validation.evalFields( {...req.body, id: req.param.id }, format_data );
    
    if( language_result.success && format_data.is_valid ){
        
        let document_id = format_data.body_object.id;
        delete format_data.body_object.id;
        
        format_data.body_object.handle = format_data.body_object.title != null ? h_format.slug( format_data.body_object.title ) : null;
        if( format_data.body_object.translate === null ){

            format_data.body_object.translate = language_result.body.reduce( (previous_item, current_item) => {
            
                previous_item[ current_item.key_code ] = {
                    title       : format_data.body_object.title,
                    description : format_data.body_object.description,
                    url         : format_data.body_object.url,
                    content     : format_data.body_object.content
                };
                return previous_item;
                
            }, language_result.body.length > 0 ? {} : null);
        }
        await h_crud.updateDocument('Additional Product Content', backAdditionalProductContentService, { _id: document_id }, format_data.body_object).then( async (result_document) => {
            
            res.status(200).json( result_document );
            
        }).catch( (error_document) => {
            
            res.status(400).send( error_document );
        });
    }
    else if( !format_data.is_valid ){
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Navigation fields required not validated' ) );
    }
    else if( !language_result.success ){
        
        res.status(400).send( h_response.request( false, language_result.body, 400, 'Error: Language Find', 'Languages not found' ) );
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
        
        await h_crud.updateDocument('Additional Product Content', backAdditionalProductContentService, { _id: document_id }, format_data.body_object).then( async (result_document) => {
            
            res.status(200).json( result_document );
        }).catch( (error_document) => {
            
            res.status(400).send( error_document );
        });
    }
    else{
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Additional Product Content fields required not validated' ) );
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
        
        await h_crud.deleteDocument('Additional Product Content', backAdditionalProductContentService, format_data.body_object.id).then( async (result_document) => {
            
            res.status(200).json( result_document );
            
        }).catch( (error_document) => {
            
            res.status(400).send( error_document );
        });
    }
    else{
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Additional Product Content fields required not validated' ) );
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