// =============================================================================
// HELPERS
// =============================================================================
const h_crud        = require('../../../helpers/crud');
const h_format      = require('../../../helpers/format');
const h_response    = require('../../../helpers/response');
const h_validation  = require('../../../helpers/validation');
// =============================================================================
// SERVICES
// =============================================================================
const {
    backGeneralSettingService,
} = require('../../../services/manager');
// =============================================================================
// REST FUNCTIONS
// =============================================================================

async function findDocuemnt(req, res){
    
    let application_type = ['app-wholesale', 'app-storefront'].includes( req.auth.application_type) ? 'app_mobile' : req.auth.application_type;
        
    await h_crud.findDocument( 'General Settings', backGeneralSettingService, { marketplace: req.auth.marketplace, status: 'active', config_basic_data: { $elemMatch: { category: application_type } } }, { app_version: 1, config_basic_data: 1, charge_methods: 1, payment_methods: 1, navigations: 1, slideshows: 1, languages: 1, pages: 1 } ).then( (result_document) => {
        
        result_document.body.config_basic_data  = result_document.body.config_basic_data.filter( (config_basic_data) => config_basic_data.category === application_type )[0];
        result_document.body.navigations        = result_document.body.navigations.reduce( (previous_item_navigation, current_item_navigation) =>{
            
            if( current_item_navigation.category === application_type ){

                previous_item_navigation.header     = h_format.navigationTreeObject( current_item_navigation.header?.sub_navigation || [] );
                previous_item_navigation.footer     = h_format.navigationTreeObject( current_item_navigation.footer?.sub_navigation || [] );
                previous_item_navigation.account    = h_format.navigationTreeObject( current_item_navigation.account?.sub_navigation || [] );
            }
            return previous_item_navigation;
        }, { header: [], footer: [], account: [] });
        result_document.body.slideshows         = result_document.body.slideshows.filter( (slideshow) => slideshow.category === application_type )[0];
        result_document.body.charge_methods     = result_document.body.charge_methods.reduce( (previous_item_method, current_item_method) =>{
            if( current_item_method[`${ application_type }_available`] === true ){
                previous_item_method.push({
                    category: current_item_method.category,
                    variants: current_item_method.variants.reduce( (previous_item_variant, current_item_variant) =>{
                        if( current_item_variant[`${ application_type }_available`] === true ){
                            previous_item_variant.push(current_item_variant.name);
                        }
                        return previous_item_variant;
                    }, [])
                });
            }
            return previous_item_method;
        }, []);
        result_document.body.payment_methods    = result_document.body.payment_methods.reduce( (previous_item_method, current_item_method) =>{
            if( current_item_method[`${ application_type }_available`] === true ){
                previous_item_method.push({
                    category: current_item_method.category,
                    variants: current_item_method.variants.reduce( (previous_item_variant, current_item_variant) =>{
                        if( current_item_variant[`${ application_type }_available`] === true ){
                            previous_item_variant.push(current_item_variant.name);
                        }
                        return previous_item_variant;
                    }, [])
                });
            }
            return previous_item_method;
        }, []);
        result_document.body = {
            app_version         : result_document.body.app_version,
            config_basic_data   : result_document.body.config_basic_data,
            navigations         : result_document.body.navigations,
            slideshows          : result_document.body.slideshows,
            languages           : result_document.body.languages,
            pages               : result_document.body.pages,
            charge_methods      : result_document.body.charge_methods,
            payment_methods     : result_document.body.payment_methods
        };
        res.status(200).json( result_document );
    }).catch( (error_document) => {
        
        res.status(400).send( error_document );
    });
};
async function updateDocument(req, res){
    
    let format_data = [
        h_format.objectValidField( 'id'                 , h_validation.evalObjectId( req.param.id )                     , h_format.fields.types.string.name, h_format.fields.types.string.operators.not_equal, null ),
        h_format.objectValidField( 'config_basic_data'  , h_validation.evalObject( req.body.config_basic_data, null )   , h_format.fields.types.object.name, h_format.fields.types.object.operators.not_equal, null )
    ];
    format_data = h_validation.evalFields( {...req.body, id: req.param.id }, format_data );
    
    if( format_data.is_valid ) {
        
        let document_id = format_data.body_object.id;
        delete format_data.body_object.id;
        
        await h_crud.updateDocument('General Settings', backGeneralSettingService, { _id: document_id }, format_data.body_object).then( async (result_document) => {
            
            res.status(200).json( result_document );
        }).catch( (error_document) => {
            
            res.status(400).send( error_document );
        });
    }
    else{
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'General Settings fields required not validated' ) );
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
        findDocuemnt
    },
    put:{
        updateDocument
    },
    delete:{
    }
};