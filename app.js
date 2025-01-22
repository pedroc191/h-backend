// =============================================================================
// PACKAGES
// =============================================================================
const createError 	= require('http-errors');
const express 		= require('express');
const path 			= require('path');
const cookieParser	= require('cookie-parser');
const logger 		= require('morgan');
const dotenv 		= require('dotenv');
const compression   = require('compression');
const session 		= require('express-session');
const mongoStore	= require('connect-mongo');
const cors 			= require('cors');
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
// GLOBAL VARIABLES
// =============================================================================
global.url 					= '/';
global.private_subdomains 	= ['storefront', 'stores', 'admin', 'api'];
global.primary_host			= 'shop.com';
global.primary_subdomain 	= 'api';
global.routes 				= {
	images	:{
		brands			: {},
		product_types	: {},
		banners			: {},
		collections		: {},
	},
	docs	:{
		template: {}
	}
};
global.image_file_types 	= ['jpg', 'jpeg', 'png', 'ico', 'svg', 'webp'];
global.docs_file_types 		= ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'];
global.fields 				= {
	types: {
		boolean	: {
			name		: 'boolean',
			operators	: {
				equal		: 'equal',
				not_equal	: 'not_equal'
			}
		},
		number	: {
			name		: 'number',
			operators	: {
				equal					: 'equal',
				not_equal				: 'not_equal',
				greater_than			: 'greater_than',
				less_than				: 'less_than',
				greater_than_or_equal	: 'greater_than_or_equal',
				less_than_or_equal		: 'less_than_or_equal'
			}
		},
		string	: {
			name		: 'string',
			operators	: {
				equal		: 'equal',
				not_equal	: 'not_equal',
				contains	: 'contains',
				not_contains: 'not_contains',
				starts_with	: 'starts_with',
				ends_with	: 'ends_with'
			}
		},
		array	: {
			name		: 'array',
			operators	: {
				contains					: 'contains',
				not_contains				: 'not_contains',
				empty						: 'empty',
				not_empty					: 'not_empty',
				length_greater_than			: 'length_greater_than',
				length_greater_than_or_equal: 'length_greater_than_or_equal',
				length_less_than			: 'length_less_than',
				length_less_than_or_equal	: 'length_less_than_or_equal',
				length_equal				: 'length_equal',
				length_not_equal			: 'length_not_equal'
			}
		},
		object	: {
			name		: 'object',
			operators	: {
				contains	: 'contains',
				not_contains: 'not_contains',
				all_keys	: 'all_keys',
				any_keys	: 'any_keys',
			}
		},
		date	: {
			name		: 'date',
			operators	: {
				equal					: 'equal',
				not_equal				: 'not_equal',
				greater_than			: 'greater_than',
				less_than				: 'less_than',
				greater_than_or_equal	: 'greater_than_or_equal',
				less_than_or_equal		: 'less_than_or_equal',
				between					: 'between',
			}
		}
	}
};
global.app_version 			= "2.0.0";
// =============================================================================
// CONFIG DATABASE
// =============================================================================
const config_db	= require('./config/data-base');
const mongooseDb = config_db.mongoose.instanceDB();

mongooseDb.on('error', function(error) { 
	
	console.error('Error in MongoDb connection: ' + error);
	config_db.mongoose.disconnectDB(); 
});
mongooseDb.on('disconnected', function() {
	
	config_db.mongoose.connectionDB( config_application.status === 'developer' ? config_credentials.data_base.mongodb.developer : config_credentials.data_base.mongodb.production );
});
config_db.mongoose.connectionDB( config_application.status === 'developer' ? config_credentials.data_base.mongodb.developer : config_credentials.data_base.mongodb.production );
// =============================================================================
// 256 - Nada es verdad todo esta permitido. Ezio Auditore da Firenze (1459 – 1524)
// =============================================================================
// =============================================================================
// ROUTERS
// =============================================================================
const router_manager = require('./routes/main/manager');
// =============================================================================
// VIEW ENGINE SETUP
// =============================================================================

const app = express();
if( config_application.status === 'developer' ) {

	app.use(cors());
}

function shouldCompress (req, res) {
	if (req.headers['x-no-compression']) {
		// don't compress responses with this request header
		return false
	}
	// fallback to standard filter function
	return compression.filter(req, res)
}
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use( compression( { filter: shouldCompress } ) );
app.use( session({
	secret: config_encrypted_keys.session,
	resave: true,
	saveUninitialized: true,
	store: mongoStore.create({ mongoUrl: config_application.status != 'developer' ? config_credentials.data_base.mongodb.developer : config_credentials.data_base.mongodb.production }),
}));
app.use( logger( ':date[web] :remote-addr :remote-user :method :url HTTP/:http-version :status :res[content-length] - :response-time ms', { 
	skip: function (req, res) { 
		return ( [304, 200].includes( res.statusCode ) ) || ( res.statusCode === 404 && ['jpg', 'jpeg', 'png', 'webp'].findIndex( (item) => req.url.indexOf( item ) >= 0 ) >= 0 )
	} 
} ) );
app.use( express.json( { limit: '50mb' } ) );
app.use( express.urlencoded( { extended: true, limit: '50mb', parameterLimit: 1000000 } ) );
app.use( cookieParser() );
app.use( express.static( path.join(__dirname, 'public') ) );
// =============================================================================
// BASE ROUTES
// =============================================================================
app.use('/api'	, router_manager);
// =============================================================================
// CATCH 404 AND FORWARD TO ERROR HANDLER
// =============================================================================
app.use(function(req, res, next) {
	
	next(createError(404));
});
// =============================================================================
// ERROR HANDLER
// =============================================================================
app.use(function(err, req, res, next) {
	// set locals, only providing error in development
	
	res.locals.message = err.message;
	res.locals.error = config_application.status === 'developer' ? err : {};
	// render the error page
	res.status(err.status || 500);
	res.locals.error.status = res.locals.message === 'Not Found' ? 404 : res.locals.error.status;
	
	res.json({
		title		: `Error ${ res.locals.error.status }: ${ res.locals.message }`,
		status		: res.locals.error.status,
		message		: res.locals.message ? res.locals.message.toString().replace(/\\/g, '/') : '',
		description	: res.locals.error.stack ? res.locals.error.stack.replace(/\\/g, '/').replace(/(')/g, '').replace(/(')/g, '') : '',
	});
});

module.exports = app;
