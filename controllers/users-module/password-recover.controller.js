// =============================================================================
// PACKAGES
// =============================================================================
const mongoose  = require('mongoose');
const jwt       = require('jsonwebtoken');
const moment          = require('moment');
// =============================================================================
// CONFIGURATION
// =============================================================================
const config_credentials     = require('../../config/credentials');
const config_encrypted_keys  = require('../../config/encrypted-keys');
// =============================================================================
// HELPERS
// =============================================================================
const utils     = require('../../helpers/utils');
// =============================================================================
// SERVICES
// =============================================================================
const { 
    userService,
    passwordRecoverService
} = require('../../services/manager');
const mailer = require('../../services/mailers/nodemailer');
// =============================================================================
// REST FUNCTIONS
// =============================================================================
async function create(req, res){
    
    let form_data = { 
        id_email : req.body.id_email ? utils.validation.validString( req.body.id_email ) : null
    };

    let valid_fields = utils.validation.validFields( form_data );
    
    if( valid_fields.valid ){
            
        let find_query = formatQuery(form_data);
        await userService.findOne( find_query ).then( async (user_result) => {

            if( user_result.body != null ){

                const token_recover = jwt.sign( { user: user_result.body._id, email: user_result.body.email }, config_encrypted_keys.session, { expiresIn: '5h' } );
                
                await passwordRecoverService.create({ user: user_result.body._id, token_recover: token_recover, date_limit: new Date( moment().add(5, 'hours') ) }).then( (password_created) => {

                    let message = utils.files.getTemplateEmail('forgot-password', { recover_link: `${ process.env.STOREFRONT_URL }/account/change-password?token_recover=${ token_recover }`, url_base: process.env.BACK_URL });
                    mailer.sendEmail( config_credentials.mailer.general, `Shop.com <${ config_credentials.mailer.general.user }>`, user_result.body.email, 'Shop.com - Recover Password', message ).then( (mailer_result) => {

                        res.status(200).json( utils.format.formatResponseRequest( true, { token_recover: token_recover }, 200, "Success: Password Recovery Create", "Your request was successfully received, you will soon receive an email with instructions to change your password" ) );

                    }).catch( (mailer_error) => {

                        res.status(400).send( utils.format.formatResponseRequest( false, mailer_error, 400, "Error: Password Recovery Create", "Password Recovery email not send" ) );
                    });
                }).catch( (password_error) => {

                    res.status(400).send( utils.format.formatResponseRequest( false, password_error, 400, "Error: Password Recovery Create", "Password Recovery not created" ) );
                });
            }
            else{

                res.status(400).send( utils.format.formatResponseRequest( false, user_result, 400, "Error: Password Recovery Create", "Password Recovery not created, user not found" ) );
            }
        }).catch( (user_error) => {

            res.status(400).send( utils.format.formatResponseRequest( false, user_error, 400, "Error: Password Recovery Create", "Password Recovery not created, user find failed" ) );
        });
    }
    else{
        
        res.status(400).send( utils.format.formatResponseRequest( false, valid_fields, 400, "Error: Password Recovery Create", `Password Recovery not created, missing data ${ valid_fields.fields.join(', ') }` ) );
    }
};
// =============================================================================
// GENERAL FUNCTIONS
// =============================================================================
function formatQuery( req_params ){
    
    let find_query = { status: 'active' }
    if( mongoose.isValidObjectId( req_params.id_email ) ){
            
        let object_id = new mongoose.Types.ObjectId( req_params.id_email );
        
        if( object_id === req_params.id_email ){

            find_query._id = req_params.id_email;
        }
        else{
            
            find_query.email = req_params.id_email.toLowerCase();
        }
    }
    else{
        
        find_query.email = req_params.id_email.toLowerCase();
    }
    return find_query;
};
// =============================================================================
// EXPORTS
// =============================================================================
module.exports = {
    get:{
    },
    post:{
        create
    },
    put:{
    },
    delete:{
    }
};