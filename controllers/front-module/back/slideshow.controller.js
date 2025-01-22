// =============================================================================
// HELPERS
// =============================================================================
const h_format      = require('../../../helpers/format');
const h_validation  = require('../../../helpers/validation');
const h_response    = require('../../../helpers/response');
const h_file        = require('../../../helpers/file');
const h_crud          = require('../../../helpers/crud');
// =============================================================================
// SERVICES
// =============================================================================
const { 
    backSlideShowService,
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
    
    let format_data     = [
        h_format.objectValidField( 'id', h_validation.evalObjectId( req.param.id ), h_format.fields.types.string.name, h_format.fields.types.string.operators.not_equal, null ),
    ];
    format_data = h_validation.evalFields( { id: req.param.id }, format_data );
    
    if( language_result.success && format_data.is_valid ){
        
        await h_crud.findDocument('Slideshow', backSlideShowService, { _id: format_data.body_object.id }, req.body.fields, req.body.options).then( async (result_document) => {
            
            result_document.body.slides = result_document.body.slides.map( (item_slide, index_slide) => {
                
                let new_item_slide = formatDBSlides( item_slide, language_result.body );
                if( new_item_slide.image ){
                    
                    new_item_slide.image.loading = index_slide === 0 ? 'eager' : 'lazy';
                }
                return new_item_slide;
            });
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
        
        await h_crud.listDocuments('Slideshow', backSlideShowService, req.body.query, req.body.fields, req.body.options).then( async (result_document) => {
            
            for (const item_slideshow of result_document.body) {
                
                item_slideshow.slides = item_slideshow.slides.map( (item_slide, index_slide) => {
                    
                    let new_item_slide = formatDBSlides( item_slide, language_result.body );
                    if( new_item_slide.image ){
                        
                        new_item_slide.image.loading = index_slide === 0 ? 'eager' : 'lazy';
                    }
                    return new_item_slide;
                });
            }
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
        h_format.objectValidField( 'name'           , h_validation.evalString( req.body.name )                          , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal                  , null ),
        h_format.objectValidField( 'slides'         , h_validation.evalArray( req.body.slides )                         , h_format.fields.types.array.name  , h_format.fields.types.array.operators.length_greater_than_or_equal, 0 ),
        h_format.objectValidField( 'navigation'     , h_validation.evalObject( req.body.navigation )                    , h_format.fields.types.object.name , h_format.fields.types.object.operators.any_keys                   , 'arrows' ),
        h_format.objectValidField( 'content_width'  , h_validation.evalString( req.body.content_width, 'full-width' )   , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal                  , '' )
    ];
    format_data = h_validation.evalFields( req.body, format_data );
    
    if( language_result.success && format_data.is_valid ){
        
        format_data.body_object.handle = format_data.body_object.name != null ? h_format.slug( format_data.body_object.name ) : null;
        
        let new_format_slides = [];
        for (const item_slide of format_data.body_object.slides) {
            
            let new_slide_item = formatDBSlides( item_slide, language_result.body );
            new_format_slides.push( new_slide_item );
        }
        format_data.body_object.slides = new_format_slides;
        
        await h_crud.createDocument('Slideshow', backSlideShowService, { name: format_data.body_object.name }, format_data.body_object, false).then( async (result_document) => {
            
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
        h_format.objectValidField( 'id'             , h_validation.evalObjectId( req.param.id )                         , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal                  , null ),
        h_format.objectValidField( 'name'           , h_validation.evalString( req.body.name )                          , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal                  , null ),
        h_format.objectValidField( 'slides'         , h_validation.evalArray( req.body.slides )                         , h_format.fields.types.array.name  , h_format.fields.types.array.operators.length_greater_than_or_equal, 0 ),
        h_format.objectValidField( 'navigation'     , h_validation.evalObject( req.body.navigation )                    , h_format.fields.types.object.name , h_format.fields.types.object.operators.any_keys                   , 'arrows' ),
        h_format.objectValidField( 'content_width'  , h_validation.evalString( req.body.content_width, 'full-width' )   , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal                  , '' )
    ];
    format_data = h_validation.evalFields( {...req.body, id: req.param.id }, format_data );
    
    if( language_result.success && format_data.is_valid ){
        
        let document_id = format_data.body_object.id;
        delete format_data.body_object.id;
        
        format_data.body_object.handle = format_data.body_object.name != null ? h_format.slug( format_data.body_object.name ) : null;
        
        let new_format_slides = [];
        
        for (const item_slide of format_data.body_object.slides) {
            
            let new_slide_item = formatDBSlides( item_slide, language_result.body );
            new_format_slides.push( new_slide_item );
        }
        format_data.body_object.slides = new_format_slides;
        
        await h_crud.updateDocument('Slideshow', backSlideShowService, { _id: document_id }, format_data.body_object).then( async (result_document) => {
            
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
        
        await h_crud.updateDocument('Slideshow', backSlideShowService, { _id: document_id }, format_data.body_object).then( async (result_document) => {
            
            res.status(200).json( result_document );
        }).catch( (error_document) => {
            
            res.status(400).send( error_document );
        });
    }
    else{
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Slideshow fields required not validated' ) );
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
        
        await h_crud.deleteDocument('Slideshow', backSlideShowService, format_data.body_object.id).then( async (result_document) => {
            
            res.status(200).json( result_document );
            
        }).catch( (error_document) => {
            
            res.status(400).send( error_document );
        });
    }
    else{
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Slideshow fields required not validated' ) );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function uploadBanner(req, res){
    
    let format_data = [
        h_format.objectValidField( 'path', h_validation.evalObject( req.body.path, { base: '/images/banners', old_file: '' } )                                          , h_format.fields.types.object.name, h_format.fields.types.object.operators.any_keys, 'base' ),
        h_format.objectValidField( 'name', h_validation.evalObject( req.body.name, { default: '', unique_type: false } )                                                , h_format.fields.types.object.name, h_format.fields.types.object.operators.any_keys, 'default' ),
        h_format.objectValidField( 'file', h_validation.evalObject( req.body.file, { max_size: 512000, is_image: false, max_dimension: { width: 200, height: 200 } } )  , h_format.fields.types.object.name, h_format.fields.types.object.operators.any_keys, 'max_size' )
    ];
    format_data = h_validation.evalFields( req.body, format_data );
    
    if( format_data.is_valid ){
        
        let format_data_path = [
            h_format.objectValidField( 'base'       , h_validation.evalString( req.body.path.base, '/images/banners' ) , h_format.fields.types.string.name, h_format.fields.types.string.operators.not_equal, '' ),
            h_format.objectValidField( 'old_file'   , h_validation.evalString( req.body.path.old_file, '' )            , h_format.fields.types.string.name, h_format.fields.types.string.operators.not_equal, null )
        ]
        format_data_path = h_validation.evalFields( format_data.body_object.path, format_data_path );
        
        let format_data_name = [
            h_format.objectValidField( 'default'    , h_validation.evalString( req.body.name.default, '' )          , h_format.fields.types.string.name , h_format.fields.types.string.operators.not_equal  , '' ),
            h_format.objectValidField( 'unique_type', h_validation.evalBoolean( req.body.name.unique_type, false )  , h_format.fields.types.boolean.name, h_format.fields.types.boolean.operators.not_equal , null )
        ];
        format_data_name = h_validation.evalFields( format_data.body_object.name, format_data_name );
        
        let format_data_file = [
            h_format.objectValidField( 'max_size'       , h_validation.evalNumber( req.body.file.max_size, 512000 )                             , h_format.fields.types.number.name , h_format.fields.types.number.operators.not_equal  , 0 ),
            h_format.objectValidField( 'is_image'       , h_validation.evalBoolean( req.body.file.is_image, false )                             , h_format.fields.types.boolean.name, h_format.fields.types.boolean.operators.not_equal , null ),
            h_format.objectValidField( 'max_dimension'  , h_validation.evalObject( req.body.file.max_dimension, { width: 200, height: 200 } )   , h_format.fields.types.object.name , h_format.fields.types.object.operators.any_keys   , 'width' )
        ];
        format_data_file = h_validation.evalFields( format_data.body_object.file, format_data_file );
        if( format_data_path.is_valid && format_data_name.is_valid && format_data_file.is_valid ){
            
            await h_file.upload( req.file, options ).then( async (file_result) => {
                
                res.status(200).json( file_result );
                
            }).catch( (file_error) => {
                
                res.status(400).send( file_error );
            });
        }
        else{
            
            res.status(400).send( h_response.request( false, [{ path: format_data_path.valid_fields }, { name: format_data_name.valid_fields }, { file: format_data_file.valid_fields }], 400, 'Error: Validate Data', 'Slideshow Image fields required not validated' ) );
        }
    }
    else{
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Slideshow Image fields required not validated' ) );
    }
};
// =============================================================================
// GENERAL FUNCTIONS
// =============================================================================
function formatDBSlides( item_slide, languages ){
    
    let new_item_slide = {
        show    : item_slide.show ? item_slide.show : true,
        link    : h_validation.evalObject( item_slide.link, null ) ? {
            type    : h_validation.evalString( item_slide.link.type, 'background' ),
            value   : h_validation.evalString( item_slide.link.value, null ),
            label   : h_validation.evalString( item_slide.link.label, null )
        } : null,
        content : h_validation.evalObject( item_slide.content, null ) ? {
            width       : h_validation.evalString( item_slide.content.width, 'full-width' ),
            orientation : h_validation.evalString( item_slide.content.orientation, 'center-center' ),
            title       : h_validation.evalObject( item_slide.content.title, null ) ? {
                content     : h_validation.evalString( item_slide.content.title.content ),
                orientation : h_validation.evalString( item_slide.content.title.orientation, 'center-center' )
            } : null,
            subtitle    : h_validation.evalObject( item_slide.content.subtitle, null ) ? {
                content     : h_validation.evalString( item_slide.content.subtitle.content ),
                orientation : h_validation.evalString( item_slide.content.subtitle.orientation, 'center-center' )
            } : null,
            translate   : h_validation.evalObject( item_slide.content.translate, languages.reduce( (previous_item, current_item) => {
                previous_item[ current_item.key_code ] = {
                    title   : {
                        content     : h_validation.evalString( item_slide.content.title?.content )
                    },
                    subtitle: {
                        content     : h_validation.evalString( item_slide.content.subtitle?.content )
                    }
                };
                return previous_item;
            }, languages.length > 0 ? {} : null) )
        } : null,
        image   : h_validation.evalObject( item_slide.image, null ) ? {
            desktop : h_validation.evalObject( item_slide.image.desktop, null ) ? {
                alt         : h_validation.evalString( item_slide.image.desktop.alt ),
                src         : h_validation.evalString( item_slide.image.desktop.src ),
                width       : h_validation.evalNumber( item_slide.image.desktop.width, 3000 ),
                height      : h_validation.evalNumber( item_slide.image.desktop.height, 1440 ),
                sizes       : h_validation.evalArray( item_slide.image.desktop.sizes, [3000, 2800, 2600, 2400, 2200, 2000, 1800, 1600, 1400, 1200] ),
                translate   : h_validation.evalObject( item_slide.image.desktop.translate, languages.reduce( (previous_item, current_item) => {
                    previous_item[ current_item.key_code ] = {
                        alt : h_validation.evalString( item_slide.image.desktop.alt ),
                        src : h_validation.evalString( item_slide.image.desktop.src )
                    }
                    return previous_item;
                }, languages.length > 0 ? {} : null) )
            } : null,
            mobile  : h_validation.evalObject( item_slide.image.mobile, null ) ? {
                alt         : h_validation.evalString( item_slide.image.mobile.alt ),
                src         : h_validation.evalString( item_slide.image.mobile.src ),
                width       : h_validation.evalNumber( item_slide.image.mobile.width, 1000 ),
                height      : h_validation.evalNumber( item_slide.image.mobile.height, 480 ),
                sizes       : h_validation.evalArray( item_slide.image.mobile.sizes, [1000, 800, 700, 600] ),
                translate   : h_validation.evalObject( item_slide.image.mobile.translate, languages.reduce( (previous_item, current_item) => {
                    previous_item[ current_item.key_code ] = {
                        alt : h_validation.evalString( item_slide.image.desktop.alt ),
                        src : h_validation.evalString( item_slide.image.desktop.src )
                    }
                    return previous_item;
                }, languages.length > 0 ? {} : null) )
            } : null
        } : null
    };
    return new_item_slide;
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
        createDocument,
        uploadBanner
    },
    put:{
        updateDocument,
        updateDocumentStatus
    },
    delete:{
        deleteDocument
    }
};