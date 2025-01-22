// =============================================================================
// HANDLERS
// =============================================================================
const h_response 		= require('./response');
const h_validation 		= require('./validation');
const h_array 		    = require('./array');
const h_file 		    = require('./file');
const h_format 		    = require('./format');
// =============================================================================
// EXPORTS
// =============================================================================
module.exports = {
    response    : h_response,
    validation  : h_validation,
    array       : h_array,
    files       : h_file,
    format      : h_format
};