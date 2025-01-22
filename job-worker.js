// =============================================================================
// PACKAGES
// =============================================================================
const express 			= require('express');
const logger 			= require('morgan');
const dotenv 			= require('dotenv');
const session 		= require('express-session');
const mongoStore	= require('connect-mongo');
// =============================================================================
// EXECUTE .ENV
// =============================================================================
dotenv.config({ path: './.env' });
// =============================================================================
// CONFIGURATION
// =============================================================================
const config_application 	= require('./config/application');
const config_credentials 	= require('./config/credentials');
const config_encrypted_keys = require('./config/encrypted-keys');
// =============================================================================
// CONFIG DATABASE
// =============================================================================
const config_db = require('./config/data-base');
const mongooseDb = config_db.mongoose.instanceDB();

mongooseDb.on('error', function(error) {

	console.error('Error in MongoDb connection: ' + error);
	config_db.mongoose.disconnecDB();
});
mongooseDb.on('disconnected', function() {
	
	config_db.mongoose.connectionDB( config_application.status === 'developer' ? config_credentials.data_base.mongodb.developer : config_credentials.data_base.mongodb.production );
});
config_db.mongoose.connectionDB( config_application.status === 'developer' ? config_credentials.data_base.mongodb.developer : config_credentials.data_base.mongodb.production );
// =============================================================================
// GLOBAL VARIABLES
// =============================================================================
global.url = `http://localhost:${ config_application.job_port }`;
// =============================================================================
// ROUTERS
// =============================================================================
let jobRouter = require('./routes/jobs-module/main.router');
// =============================================================================
// VIEW ENGINE SETUP
// =============================================================================
let app = express();

app.use( '/', jobRouter );
app.use(session({
	secret: config_encrypted_keys.session,
	resave: true,
	saveUninitialized: true,
	store: mongoStore.create({ mongoUrl: config_application.status != 'developer' ? config_credentials.data_base.mongodb.developer : config_credentials.data_base.mongodb.production }),
}));
app.use( logger( ':date[web] :remote-addr :remote-user :method :url HTTP/:http-version :status :res[content-length] - :response-time ms', 
{ 
	skip: function (req, res) { 
		return ( [304, 200].includes( res.statusCode ) ) || ( res.statusCode === 404 && ['jpg', 'jpeg', 'png', 'webp'].findIndex( (item) => req.url.indexOf( item ) >= 0 ) >= 0 )
	} 
} ) );
app.use( express.json( { limit: '50mb' } ) );

if( config_application.status === 'developer' ) {
	
	app.listen( config_application.job_port );
	console.log(`Listening on port ${ config_application.job_port }`);
}
module.exports = app;