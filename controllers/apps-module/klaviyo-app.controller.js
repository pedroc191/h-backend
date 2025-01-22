// =============================================================================
// PACKAGES
// =============================================================================
// =============================================================================
// HELPERS
// =============================================================================
// =============================================================================
// SERVICES
// =============================================================================
const klaviyo  = require('../../services/mailers/klaviyo.js');
// =============================================================================
// REST FUNCTIONS
// =============================================================================
async function createProfile(req, res){

    await klaviyo.post.createProfile( req.body.data_profile ).then( (klaviyo_result) => {

        res.status(klaviyo_result.status).json(klaviyo_result);
    }).catch( (klaviyo_error) => {
        
        res.status(klaviyo_error.status).send(klaviyo_error);
    });
};
async function updateProfile(req, res){

    await klaviyo.patch.updateProfile(req.body.id_profile, req.body.data_profile).then( (klaviyo_result) => {

        res.status(klaviyo_result.status).json(klaviyo_result);
    }).catch( (klaviyo_error) => {
        
        res.status(klaviyo_error.status).send(klaviyo_error);
    });
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
        createProfile
    },
    put:{
        updateProfile
    },
    delete:{
    }
};