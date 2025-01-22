// =============================================================================
// PACKAGES
// =============================================================================
// =============================================================================
// HELPERS
// =============================================================================
const h_response = require('../../helpers/response.js');
// =============================================================================
// SERVICES
// =============================================================================
const agent  = require('../../services/2b-apps/agent');
// =============================================================================
// REST FUNCTIONS
// =============================================================================
async function listStates(req, res){

    await agent.get.listStates().then( (agent_result) => {

        res.status(agent_result.status).json(agent_result);
    }).catch( (agent_error) => {
        
        res.status(agent_error.status).send(agent_error);
    });
};
async function listLanguages(req, res){

    await agent.get.listLanguages().then( (agent_result) => {

        res.status(agent_result.status).json(agent_result);
    }).catch( (agent_error) => {
        
        res.status(agent_error.status).send(agent_error);
    });
};
async function listCustomerTypes(req, res){

    await agent.get.listCustomerTypes().then( (agent_result) => {

        res.status(agent_result.status).json(agent_result);
    }).catch( (agent_error) => {
        
        res.status(agent_error.status).send(agent_error);
    });
};
async function listCategoryProducts(req, res){

    await agent.get.listCategoryProducts().then( (agent_result) => {

        res.status(agent_result.status).json(agent_result);
    }).catch( (agent_error) => {
        
        res.status(agent_error.status).send(agent_error);
    });
};
async function listBusinessTypes(req, res){

    await agent.get.listBusinessTypes().then( (agent_result) => {

        res.status(agent_result.status).json(agent_result);
    }).catch( (agent_error) => {
        
        res.status(agent_error.status).send(agent_error);
    });
};
async function listInvestRange(req, res){

    await agent.get.listInvestRange().then( (agent_result) => {

        res.status(agent_result.status).json(agent_result);
    }).catch( (agent_error) => {
        
        res.status(agent_error.status).send(agent_error);
    });
};

async function createLead(req, res){
    
    await agent.post.createLead(req.body).then( (agent_result) => {

        res.status(agent_result.status).json(agent_result);
    }).catch( (agent_error) => {

        res.status(agent_error.status).send(agent_error);
    });
};
async function updateLead(req, res){
    
    await agent.put.updateLead(req.body).then( (agent_result) => {

        res.status(agent_result.status).json(agent_result);
    }).catch( (agent_error) => {
        
        res.status(agent_error.status).send(agent_error);
    });
};
async function convertLeadToCustomer(req, res){
    
    await agent.post.convertLeadToCustomer(req.body).then( (agent_result) => {

        res.status(agent_result.status).json(agent_result);
    }).catch( (agent_error) => {
        
        res.status(agent_error.status).send(agent_error);
    });
};

async function listCoupons(req, res){
    
    await agent.get.listCoupons().then( (agent_result) => {

        res.status(agent_result.status).json(agent_result);
    }).catch( (agent_error) => {
        
        res.status(agent_error.status).send(agent_error);
    });
};
async function listCouponsByCustomer(req, res){
    
    await agent.get.listCouponsByCustomer(req.auth.user.customer._id).then( (agent_result) => {

        res.status(agent_result.status).json(agent_result);
    }).catch( (agent_error) => {
        
        res.status(agent_error.status).send(agent_error);
    });
};
async function couponApplicable(req, res){
    
    await agent.post.couponApplicable(req.body).then( (agent_result) => {

        res.status(agent_result.status).json(agent_result);
    }).catch( (agent_error) => {
        
        res.status(agent_error.status).send(agent_error);
    });
};
async function couponUsed(req, res){
    
    await agent.put.couponUsed(req.body).then( (agent_result) => {

        res.status(agent_result.status).json(agent_result);
    }).catch( (agent_error) => {
        
        res.status(agent_error.status).send(agent_error);
    });
};

async function levelCustomer(req, res){

    await agent.get.levelCustomer(req.auth.user.customer._id).then( (agent_result) => {

        agent_result.body.result.total_fact = req.auth.user.customer.inputs_by_year;
        agent_result.body.result.profile_image = req.auth.user.customer.profile_image;
        agent_result.body.result.level.urlImage = `${ process.env.AGENT_APP.replace('/api', '') }${ agent_result.body.result.level.urlImage }`;
        res.status(agent_result.status).json(agent_result);
    }).catch( (agent_error) => {
        
        res.status(agent_error.status).send(agent_error);
    });
};
async function agentCustomer(req, res){

    await agent.get.agentCustomer(req.auth.user.customer._id).then( (agent_result) => {

        if( agent_result.data.body ){

            agent_result.data.body.photo = `${ process.env.AGENT_APP.replace('/api', '') }/${ agent_result.data.body.photo.replace('public/', '') }`;
        }
        res.status(agent_result.status).json(agent_result);
    }).catch( (agent_error) => {
        
        res.status(agent_error.status).send(agent_error);
    });
};
async function addProfileImage(req, res){

	await utils.files.uploadFile( req.file, "/images/agents/profiles", req.body.old_file_path, req.body.default_name_image, true, parseInt( req.body.max_size ), true, JSON.parse( req.body.max_dimension ) ).then( async (result_file) => {

        res.status(200).json( result_file );
	}).catch( (error_file) => {

		res.status(400).send( error_file );
	});
};
async function addLevelImage(req, res){

	await utils.files.uploadFile( req.file, "/images/levels/profiles", req.body.old_file_path, req.body.default_name_image, true, parseInt( req.body.max_size ), true, JSON.parse( req.body.max_dimension ) ).then( async (result_file) => {

        res.status(200).json( result_file );
	}).catch( (error_file) => {

		res.status(400).send( error_file );
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
        listStates,
        listLanguages,
        listCustomerTypes,
        listCategoryProducts,
        listBusinessTypes,
        listInvestRange,
        listCoupons,
        listCouponsByCustomer,
        levelCustomer,
        agentCustomer
    },
    post:{
        createLead,
        convertLeadToCustomer,
        couponApplicable,
        addProfileImage,
        addLevelImage
    },
    put:{
        couponUsed,
        updateLead
    },
    delete:{
    }
};