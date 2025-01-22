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
    backNavigationService,
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
    
    let language_result = await backLanguageService.find({ main: false, status: 'active' }, { key_code: 1 });

    let format_data = [
        h_format.objectValidField( 'id', h_validation.evalObjectId( req.param.id ), h_format.fields.types.string.name, h_format.fields.types.string.operators.not_equal, null ),
    ];
    format_data = h_validation.evalFields( { id: req.param.id }, format_data );
    
    if( language_result.success && format_data.is_valid ){
        
        await h_crud.findDocument('Navigation', backNavigationService, { _id: format_data.body_object.id }, req.body.fields, req.body.options, formatFrontNavigationTree, { languages: language_result.body }).then( async (result_document) => {
            
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
    if( language_result.success ){
            
        await h_crud.listDocuments('Navigation', backNavigationService, req.body.query, req.body.fields, req.body.options, formatFrontNavigationTree, { languages: language_result.body }).then( async (result_document) => {

            res.status(200).json( result_document );
            
        }).catch( (error_document) => {

            res.status(400).send( error_document );
        });
    }
    else{
        
        res.status(400).send( h_response.request( false, language_result.body, 400, 'Error: Language Find', 'Languages not found' ) );
    }
};
/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
async function createDocument(req, res){
    
    let language_result = await backLanguageService.find({ main: false, status: 'active' }, { key_code: 1 });

    let format_data     = [
        h_format.objectValidField( 'name'           , h_validation.evalString( req.body.name, '' )      , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal                  , '' ),
        h_format.objectValidField( 'navigation_tree', h_validation.evalArray( req.body.navigation_tree ), h_format.fields.types.array.name  , h_format.fields.types.array.operators.length_greater_than_or_equal, 0 )
    ];
    format_data = h_validation.evalFields( req.body, format_data );

    if( language_result.success && format_data.is_valid ){

        format_data.body_object.handle = format_data.body_object.name != null ? h_format.slug( format_data.body_object.name ) : null;

        let new_format_navigation_tree = [];

        for (const item_navigation of format_data.body_object.navigation_tree) {
            
            let new_navigation_item = await formatDBNavigationTree( item_navigation, language_result.body );
            new_format_navigation_tree.push( new_navigation_item );
        }
        format_data.body_object.navigation_tree = new_format_navigation_tree;

        await h_crud.createDocument('Navigation', backNavigationService, { name: format_data.body_object.name }, format_data.body_object, false).then( async (result_document) => {

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
        h_format.objectValidField( 'id'             , h_validation.evalObjectId( req.param.id )         , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal                  , null ),
        h_format.objectValidField( 'name'           , h_validation.evalString( req.body.name, '' )      , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal                  , '' ),
        h_format.objectValidField( 'navigation_tree', h_validation.evalArray( req.body.navigation_tree ), h_format.fields.types.array.name  , h_format.fields.types.array.operators.length_greater_than_or_equal, 0 )
    ];
    format_data = h_validation.evalFields( {...req.body, id: req.param.id }, format_data );

    if( language_result.success && format_data.is_valid ){

        let document_id = format_data.body_object.id;
        delete format_data.body_object.id;

        format_data.body_object.handle = format_data.body_object.name != null ? h_format.slug( format_data.body_object.name ) : null;
        
        let new_format_navigation_tree = [];

        for (const item_navigation of format_data.body_object.navigation_tree) {
            
            let new_navigation_item = await formatDBNavigationTree( item_navigation, language_result.body );
            new_format_navigation_tree.push( new_navigation_item );
        }
        format_data.body_object.navigation_tree = new_format_navigation_tree;

        await h_crud.updateDocument('Navigation', backNavigationService, { _id: document_id }, format_data.body_object).then( async (result_document) => {

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

        await h_crud.updateDocument('Navigation', backNavigationService, { _id: document_id }, format_data.body_object).then( async (result_document) => {
            
            res.status(200).json( result_document );
        }).catch( (error_document) => {
            
            res.status(400).send( error_document );
        });
    }
    else{
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Navigation fields required not validated' ) );
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
        
        await h_crud.deleteDocument('Navigation', backNavigationService, format_data.body_object.id).then( async (result_document) => {

            res.status(200).json( result_document );
            
        }).catch( (error_document) => {

            res.status(400).send( error_document );
        });
    }
    else{
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Navigation fields required not validated' ) );
    }
};
// =============================================================================
// GENERAL FUNCTIONS
// =============================================================================
async function formatDBNavigationTree( item_navigation, languages ){

    let new_item_navigation = {
        page        : h_validation.evalObjectId( item_navigation.page ),
        collection  : h_validation.evalObjectId( item_navigation.collection ),
        product     : h_validation.evalObjectId( item_navigation.product ),
        brand       : h_validation.evalObjectId( item_navigation.brand ),
        type        : h_validation.evalString( item_navigation.type, 'page' ),
        title       : h_validation.evalString( item_navigation.title ),
        handle      : h_validation.evalString( h_format.slug( h_validation.evalString( item_navigation.title, "" ) ) ),
        url         : h_validation.evalString( item_navigation.url ),
        image       : h_validation.evalString( item_navigation.image ),
        image_use   : h_validation.evalString( item_navigation.image_use, item_navigation.sub_menu_type ? 'background' : 'preview' ),
        icon        : h_validation.evalString( item_navigation.icon ),
        icon_type   : h_validation.evalString( item_navigation.icon_type ),
        translate   : h_validation.evalObject( item_navigation.translate, languages.reduce( (previous_item, current_item) => {
            previous_item[ current_item.key_code ] = { 
                title   : h_validation.evalString( item_navigation.title ),
                handle  : h_validation.evalString( h_format.slug( h_validation.evalString( item_navigation.title, "" ) ) ),
                url     : h_validation.evalString( item_navigation.url ),
                image   : h_validation.evalString( item_navigation.image )
            };
            return previous_item;
        }, languages.length > 0 ? {} : null) ),
        show        : h_validation.evalBoolean( item_navigation.show, true ),
        new_page    : h_validation.evalBoolean( item_navigation.new_page, false )
    };
    if( item_navigation.sub_menu_type ){
        new_item_navigation.sub_menu_type = h_validation.evalString( item_navigation.sub_menu_type, 'basic' );
    }
    if( item_navigation.sub_navigation?.length > 0 ){
        new_item_navigation.sub_navigation = await formatDBNavigationTree( item_navigation.sub_navigation, languages );
    }
    return new_item_navigation;
};
async function formatFrontNavigationTree( item_navigation, additional_data_format ){

    item_navigation.active = false;
    if( item_navigation.sub_navigation?.length > 0 ){

        let new_sub_navigation = await formatFrontNavigationTree( item_navigation.sub_navigation, additional_data_format.languages );
        if( new_sub_navigation.success ){

            item_navigation.sub_navigation = new_sub_navigation.body;
        }
    }
    return { success: true, body: item_navigation };
};
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