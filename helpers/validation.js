// =============================================================================
// PACKAGES
// =============================================================================
const mongoose          = require('mongoose');
const moment            = require('moment');
const jwt               = require('jsonwebtoken');
const createDOMPurify   = require('dompurify');
const { JSDOM }         = require('jsdom');

const window            = new JSDOM('').window;
const DOMPurify         = createDOMPurify(window);
// =============================================================================
// CONFIGURATION
// =============================================================================
const config_encrypted_keys  = require('../config/encrypted-keys');
// =============================================================================
// GENERAL FUNCTIONS
// =============================================================================
/**
* 
* @param {*} valid_compare 
* @param {*} data_value 
* @returns 
*/
function booleanField( valid_compare, data_value ){
    
    switch( valid_compare.operator){
        case "equal":
        return valid_compare.value === data_value;
        case "not_equal":
        return valid_compare.value != data_value;
        default:
        return false;
    }
};
/**
 * 
 * @param {*} valid_compare 
 * @param {*} data_value 
 * @returns 
 */
function numberField( valid_compare, data_value ){
    
    switch( valid_compare.operator){
        case "equal":
        return valid_compare.value === data_value;
        case "not_equal":
        return valid_compare.value != data_value;
        case "greater_than":
        return data_value > valid_compare.value;
        case "greater_than_or_equal":
        return data_value >= valid_compare.value;
        case "less_than":
        return data_value < valid_compare.value;
        case "less_than_or_equal":
        return data_value <= valid_compare.value;
        default:
        return false;
    }
};
/**
* 
* @param {*} valid_compare 
* @param {*} data_value 
* @returns 
*/
function stringField( valid_compare, data_value ){
    
    switch( valid_compare.operator){
        case "equal":
        return valid_compare.value === data_value?.trim();
        case "not_equal":
        return valid_compare.value != data_value?.trim();
        case "contains":
        return data_value?.trim().includes( valid_compare.value );
        case "not_contains":
        return !data_value?.trim().includes( valid_compare.value );
        case "starts_with":
        return data_value?.trim().startsWith( valid_compare.value );
        case "ends_with":
        return data_value?.trim().endsWith( valid_compare.value );
        default:
        return false;
    }
};
/**
* 
* @param {*} valid_compare 
* @param {*} data_value 
* @returns 
*/
function arrayField( valid_compare, data_value ){
    
    switch( valid_compare.operator){
        case "contains":
        return data_value.includes( valid_compare.value );
        case "not_contains":
        return !data_value.includes( valid_compare.value );
        case "empty":
        return data_value.length === 0;
        case "not_empty":
        return data_value.length > 0;
        case "length_greater_than":
        return data_value.length > valid_compare.value;
        case "length_greater_than_or_equal":
        return data_value.length >= valid_compare.value;
        case "length_less_than":
        return data_value.length < valid_compare.value;
        case "length_less_than_or_equal":
        return data_value.length <= valid_compare.value;
        case "length_equal":
        return data_value.length === valid_compare.value;
        case "length_not_equal":
        return data_value.length != valid_compare.value;
        default:
        return false;
    }
};
/**
* 
* @param {*} valid_compare 
* @param {*} data_value 
* @returns 
*/
function objectField( valid_compare, data_value ){
    
    switch( valid_compare.operator){
        case "not_equal":
        return valid_compare.value != data_value;
        case "contains":
        return data_value.hasOwnProperty( valid_compare.value );
        case "not_contains":
        return !data_value.hasOwnProperty( valid_compare.value );
        case "all_keys":
        return Object.keys( data_value ).every( (key) => valid_compare.value.includes( key ) );
        case "any_keys":
        return Object.keys( data_value ).some( (key) => key );
        default:
        return false;
    }
};
/**
* 
* @param {*} valid_compare 
* @param {*} data_value 
* @returns 
*/
function dateField( valid_compare, data_value ){
    
    switch( valid_compare.operator){
        case "equal":
        return moment(valid_compare.value).isSame( moment(data_value) );
        case "not_equal":
        return !moment(valid_compare.value).isSame( moment(data_value) );
        case "greater_than":
        return moment(data_value).isAfter( moment(valid_compare.value) );
        case "greater_than_or_equal":
        return moment(data_value).isSameOrAfter( moment(valid_compare.value) );
        case "less_than":
        return moment(data_value).isBefore( moment(valid_compare.value) );
        case "less_than_or_equal":
        return moment(data_value).isSameOrBefore( moment(valid_compare.value) );
        case "between":
        return moment(data_value).isBetween( moment(valid_compare.value[0]), moment(valid_compare.value[1]) );
        default:
        return false;
    }
};
/**
* 
* @param {*} valid_compare 
* @param {*} data_value 
* @returns 
*/
function evalTypeField( valid_compare, data_value ){
    
    switch( valid_compare.type ){
        
        case "boolean":
        
        return data_value === undefined ? false : booleanField( valid_compare, data_value );
        case "number":
        
        return data_value === undefined ? false : numberField( valid_compare, data_value );
        case "string":
        
        return data_value === undefined ? false : stringField( valid_compare, data_value );
        case "array":
        
        return data_value === undefined ? false : arrayField( valid_compare, data_value );
        case "object":
        
        return data_value === undefined ? false : objectField( valid_compare, data_value );
        case "date":
        
        return data_value === undefined ? false : dateField( valid_compare, data_value );
        default:
        
        return false;
    }
};
/**
* 
* @param {*} req_data 
* @param {*} valid_data 
* @param {*} valid_values 
*/
function evalFields( req_data, valid_data ){
    
    let valid_error = valid_data.reduce( (previous_item, current_item) => {
        
        let result_valid = evalTypeField( current_item.compare, current_item.value );
        
        previous_item[result_valid ? 'valid_fields' : 'error_fields'].push({ 
            field       : current_item.field, 
            req_data    : req_data[current_item.field], 
            valid_data  : current_item.value, 
            is_valid    : result_valid,
            message     : `Field: ${ current_item.field } is ${ result_valid ? 'valid' : 'invalid' }`
        });
        previous_item.body_object[current_item.field] = current_item.value;
        previous_item.valid_count += result_valid ? 0 : 1;
        
        return previous_item;
    }, { valid_count: 0, valid_fields: [], error_fields: [], body_object: {} });
    
    return {
        is_valid    : valid_error.valid_count === 0,
        valid_fields: valid_error.valid_fields,
        error_fields: valid_error.error_fields,
        body_object : valid_error.body_object
    };
};
/**
* 
* @param {*} eval_array 
* @param {*} default_value 
* @returns 
*/
function evalObject( eval_object, default_value = {} ){
    
    try {
        if( typeof eval_object === 'string' && eval_object != null ){
            
            eval_object = JSON.parse( eval_object );
        }
        return eval_object === null || typeof eval_object != 'object' ? default_value : eval_object;
    } catch (error) {
        
        return default_value;
    }
};
/**
* 
* @param {*} eval_array 
* @param {*} default_value 
* @returns 
*/
function evalArray( eval_array, default_value = [] ){
    
    try {
        if( typeof eval_array === 'string' && eval_array != null ){
            
            eval_array = JSON.parse( eval_array );
        }
        return eval_array === null || !Array.isArray( eval_array ) ? default_value : eval_array;
    } catch (error) {
        
        return default_value;
    }
};
/**
 * 
 * @param {*} text 
 * @param {*} default_value 
 * @returns 
 */
function evalString( text = null, default_value = null ){

    if( typeof text === 'string' && text != null ){
        
        let sanitizedText = DOMPurify.sanitize(text).trim();
        if( sanitizedText === null || typeof sanitizedText != 'string' || sanitizedText.trim() === '' ){
            
            return default_value;
        }
        else{
            
            return sanitizedText;
        }
    }
    else{
        
        return default_value;
    }
};
/**
* 
* @param {*} boolean_value 
* @param {*} default_value 
* @returns 
*/
function evalBoolean( boolean_value, default_value = false ){
    
    return boolean_value === null || typeof boolean_value != 'boolean' ? default_value : boolean_value;
}
/**
* 
* @param {String} number 
* @param {Number} default_value 
* @returns 
*/
function evalFloat( number, default_value = 0 ){
    
    return number === null || isNaN( parseFloat( number ) ) ? default_value : parseFloat( number );
};
/**
* 
* @param {String} number 
* @param {Number} default_value 
* @returns 
*/
function evalInt( number, default_value = 0 ){
    
    return number === null || isNaN( parseInt( number ) ) ? default_value : parseInt( number );
};
/**
* 
* @param {*} id 
* @param {*} default_value 
* @returns 
*/
function evalObjectId( id, default_value = null ){
    
    let object_id   = id && id.toString().length === 24 ? new mongoose.Types.ObjectId( id ) : "";
    if( id != null && mongoose.isValidObjectId( id ) && object_id && object_id.toString() === id.toString() ){
        
        return id.toString();
    }
    else{
        return default_value;
    }
};
/**
 * 
 * @param {*} date 
 * @param {*} default_value 
 * @returns 
 */
function evalDate( date, default_value = null ){
    
    return date === null || !moment( date ).isValid() ? default_value : moment( date ).toDate();
}
/**
* 
* @param {Object} array 
* @returns 
*/
function evalArrayStrings( array ){
    
    array = JSON.parse( array );
    
    return array.find( (item) => evalString( item ) === null ) ? [] : array; 
};
/**
* 
* @param {*} token 
* @param {*} ignore 
* @returns 
*/
function verifyToken( token, ignore = true, message = "Session Expired, please login again" ){
    
    try {
        
        return jwt.verify(token, config_encrypted_keys.session, { ignoreExpiration: ignore });
    } 
    catch (error_token) {
        
        if (error_token instanceof jwt.TokenExpiredError ) {
            
            return { success: false, body: error_token, message: message };
        }
        throw error_token;
    }
};
/**
 * 
 * @param {*} exist_field 
 * @param {*} default_value 
 * @returns 
 */
function evalExistField( exist_field, default_value ){
    
    return ( exist_field || default_value );
}
// =============================================================================
// EXPORTS
// =============================================================================
module.exports = {
    booleanField,
    numberField,
    stringField,
    arrayField,
    objectField,
    dateField,
    evalTypeField,
    evalFields,
    evalObject,
    evalArray,
    evalString,
    evalBoolean,
    evalFloat,
    evalInt,
    evalObjectId,
    evalDate,
    evalArrayStrings,
    evalExistField,
    verifyToken,
    fields:{
        central_product_features: [
            {
                central: "straps",
                hefesto: "strap_type"
            },
            {
                central: "bust",
                hefesto: "bust_type"
            },
            {
                central: "closure",
                hefesto: "closure_type"
            },
            {
                central: "crotch",
                hefesto: "crotch_type"
            },
            {
                central: "back",
                hefesto: "back_type"
            },
            {
                central: "buttMaterial",
                hefesto: "butt_material"
            },
            {
                central: "externalMaterial",
                hefesto: "external_material"
            },
            {
                central: "innerMaterial",
                hefesto: "inner_material"
            },
            {
                central: "compInnerMat1",
                hefesto: "compInnerMat1"
            },
            {
                central: "compInnerMat2",
                hefesto: "compInnerMat2"
            },
            {
                central: "uses1",
                hefesto: "uses1"
            },
            {
                central: "uses2",
                hefesto: "uses2"
            },
            {
                central: "uses3",
                hefesto: "uses3"
            },
            {
                central: "uses4",
                hefesto: "uses4"
            },
            {
                central: "uses5",
                hefesto: "uses5"
            },
            {
                central: "uses6",
                hefesto: "uses6"
            },
            {
                central: "uses7",
                hefesto: "uses7"
            },
            {
                central: "prducttype",
                hefesto: "category_type"
            },
            {
                central: "silueta",
                hefesto: "silhouette"
            },
            {
                central: "legLenght",
                hefesto: "leg_lenght"
            },
        ],
        null_items: [null, ""],
        n_a_items: ["n/a", "n / a", "n /a", "n/ a", "n-a", "n - a", "n -a", "n- a"]
    }
}