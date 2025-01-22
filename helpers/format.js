// =============================================================================
// CONFIGURATION
// =============================================================================
const config_application    = require('../config/application');
// =============================================================================
// PACKAGES
// =============================================================================
const slugify 		        = require('slugify');
const removeDiacritics      = require('diacritics').remove;
const moment                = require('moment');
const mongoose              = require('mongoose');
const { 
    parsePhoneNumberWithError,
    isValidPhoneNumber
} = require('libphonenumber-js');
// =============================================================================
// HANDLERS
// =============================================================================
const h_response 	        = require('./response');
const h_validation          = require('./validation');
const h_array               = require('./array');
// =============================================================================
// GENERAL FUNCTIONS
// =============================================================================
/**
* 
* @param {*} field_value 
* @param {*} shopify_id_key 
* @returns 
*/
function findQuery( field_value, shopify_id_key = 'shopify_id', extra_field = 'handle' ){
    
    let find_query  = { status: 'active' }
    let object_id   = field_value.length === 24 ? new mongoose.Types.ObjectId( field_value ) : field_value;
    if( mongoose.isValidObjectId( field_value ) && object_id && object_id.toString() === field_value ){
        
        find_query._id = field_value;
    }
    else if( field_value.indexOf('-') < 0 &&h_validation.evalInt( field_value, 0 ) != 0 ){
        
        find_query[shopify_id_key] =h_validation.evalInt( field_value, 0 );
    }
    else{
        
        find_query[extra_field] = field_value;
    }
    return find_query;
};
/**
* 
* @param {*} details_query 
* @param {*} disjunctive_query 
* @param {*} product_discounts 
* @returns 
*/
function findQueryProducts(id_marketplace, details_query, disjunctive_query, product_discounts = null){
    
    let count_fields        = details_query.reduce( (previous_item, current_item, current_index) => {
        
        if( previous_item.details[current_item.field] ){
            
            previous_item.details[current_item.field] += 1;
            previous_item.repeat_fields = true;
        }
        else {
            
            previous_item.details[current_item.field] = 1;
        }
        return previous_item;
    }, { repeat_fields: false, details: {} });
    
    let search_index_field  = -1;
    let format_query        = details_query.map( (item_query, index_query) => {
        
        let new_query = {};
        if( item_query.field != 'search_field' && ['$regex', '$regex-^', '$regex-+$', '$not-regex'].includes(item_query.operator) ){
            
            let prepend = item_query.operator === '$regex-^' ? '^'     : item_query.operator === '$not-regex' ? '.*' : '';
            let append  = item_query.operator === '$regex-+$' ? '+$'   : item_query.operator === '$not-regex' ? '.*' : '';
            
            let regex_query = { $regex: `${ prepend }${ item_query.value[0] }${ append }`, $options: 'i' };
            
            if( item_query.value.length > 1 ){
                
                regex_query = { $regex: `${ prepend }(${ item_query.value.join('|') })${ append }`, $options: 'i' };
            }
            if( item_query.operator === '$not-regex' ){
                
                new_query[`${ item_query.field }`] = { $not: regex_query };
            }
            else{
                
                new_query[`${ item_query.field }`] = regex_query;
            }
        }
        else if( ['$gte', '$lte'].includes(item_query.operator) ){
            
            new_query[`${ item_query.field }`] = { [item_query.operator]: item_query.value };
        }
        else if( ['$eq', '$ne'].includes(item_query.operator) ){
            
            if( item_query.value.length > 1 ){
                
                new_query[`${ item_query.field }`] = { [item_query.operator === '$eq' ? '$in' : '$nin']: item_query.value };
            }
            else{
                
                new_query[`${ item_query.field }`] = item_query.operator === '$eq' ? item_query.value[0] : { $ne: item_query.value[0] };
            }
        }
        else if( item_query.field != 'options' && ['$in', '$nin'].includes(item_query.operator) ){
            
            new_query[`${ item_query.field }`] = { [item_query.operator]: item_query.value };
        }
        if( ['tags'].includes(item_query.field) && count_fields.details[item_query.field] && count_fields.details[item_query.field] === 1 ){
            
            new_query[`${ item_query.field }`] = { 
                $elemMatch: { 
                    handle: new_query[`${ item_query.field }`] 
                } 
            };
        }
        else if( ['tags'].includes(item_query.field) && count_fields.details[item_query.field] && count_fields.details[item_query.field] > 1 ){
            
            if( new_query[`${ item_query.field }`].$elemMatch ){
                
                new_query[`${ item_query.field }`].$elemMatch[ disjunctive_query ? '$or' : '$and' ].push( { 
                    handle: new_query[`${ item_query.field }`] 
                } );
            }
            else{
                
                new_query[`${ item_query.field }`] = { 
                    $elemMatch: { 
                        [ disjunctive_query ? '$or' : '$and' ] : [ 
                            { 
                                handle: new_query[`${ item_query.field }`] 
                            } 
                        ] 
                    } 
                };
            }
        }
        else if( item_query.field === 'options' ){
            
            new_query[`${ item_query.field }`] = { $elemMatch: { values: { $elemMatch: { handle: new_query[`${ item_query.field }`] } } } };
        }
        else if( item_query.field === 'search_field' && product_discounts != null ){
            search_index_field = index_query;
            new_query[`${ item_query.field }`] = { $regex: `^(?=.*${ item_query.value })${ product_discounts.length === 0 ? '(?!.*private-label)' : '' }.*` , $options: 'i' };
        }
        return new_query;
    });
    if( search_index_field < 0 && product_discounts != null ){
        
        format_query.push({ search_field: { $regex: `^(?!.*private-label).*` , $options: 'i' } });
    }
    format_query            = h_array.sortByProperty(format_query, 0);
    
    if( ( count_fields.repeat_fields === true && disjunctive_query === false ) || ( count_fields.repeat_fields === false && disjunctive_query === false ) ){
        
        format_query.push({ marketplace: id_marketplace });
        format_query.push({ status_created: 'active' });
        format_query.push({ status: 'active' });
        format_query.push({ warehouse_status: true });
    }
    if( count_fields.repeat_fields === true && disjunctive_query === false ){
        
        format_query = { $and: h_array.sortByProperty(format_query, 0) };
    }
    else if( ( count_fields.repeat_fields === true && disjunctive_query === true ) || ( count_fields.repeat_fields === false && disjunctive_query === true ) ){
        
        format_query = { $and: [{ marketplace: id_marketplace }, { status_created: 'active' }, { status: 'active' }, { warehouse_status: true }, { $or: h_array.sortByProperty(format_query, 0) }] };
    }
    else if( count_fields.repeat_fields === false && disjunctive_query === false ){
        
        format_query = h_array.sortByProperty(format_query, 0).reduce( (previous_item, current_item) => {
            
            previous_item[Object.keys(current_item)[0]] = current_item[Object.keys(current_item)[0]];
            return previous_item;
        }, {});
    }
    return format_query;
};
/**
*
* @param {String} text
* @returns
*/
function slug( text ){
    
    return h_validation.evalString( text ) ? slugify( removeDiacritics( h_validation.evalString( text ) ), { replacement: '-', lower: true, strict: true } ).split('-').filter( (item) => item != '' ).join('-') : null;
};
/**
* 
* @param {*} field 
* @param {*} body_data 
* @param {*} compare_type 
* @param {*} compare_operator 
* @param {*} compare_value 
* @returns 
*/
function objectValidField( field, body_data, compare_type, compare_operator, compare_value ){
    
    return {
        field   : field,
        value   : body_data,
        compare : {
            type    : compare_type,
            operator: compare_operator,
            value   : compare_value
        }
    };
};
/**
* 
* @param {Date} this_date 
* @returns 
*/
function shopifyDate( this_date ){
    
    if( config_application.status === 'developer' ){
        
        return moment( typeof this_date === 'string' ? new Date( new Date( `${ this_date.split('T')[0] }T${ this_date.split('T')[1].split('-')[0] }` ).toISOString() ) : this_date ).utc();
    }
    else{
        
        return typeof this_date === 'string' ? new Date( new Date( `${ this_date.split('T')[0] }T${ this_date.split('T')[1].split('-')[0] }z` ).toISOString() ) : this_date;
    }
};
/**
* 
* @param {Date} this_date 
* @param {Boolean} init_month 
* @returns 
*/
function dbDate( this_date, init_month = null ){
    
    if( init_month != null && init_month ){
        
        this_date = this_date.utc().startOf('month').startOf('day');
    }
    else if( init_month != null && !init_month ){
        
        this_date = this_date.utc().endOf('month').endOf('day');
    }
    else{
        
        this_date = this_date.utc();
    }
    
    return this_date;
};
/**
* 
* @param {*} phone_value 
* @param {*} default_value 
* @returns 
*/
function phoneNumber( phone_value, default_value = null ){
    
    phone_value = phone_value ? phone_value.trim() : phone_value;
    
    if( typeof phone_value != 'string' || ['', null, undefined].includes( phone_value ) ){
        
        return default_value;
    }
    else if( isValidPhoneNumber( phone_value ) ){
        
        let format_phone =  parsePhoneNumberWithError( phone_value, 'US' );
        return {
            code        : format_phone.countryCallingCode,
            number      : format_phone.number,
            format      : format_phone.formatInternational(),
            country_code: format_phone.country
        };
    }
    else {
        
        return default_value;
    }
};
/**
* 
* @param {*} number 
* @returns 
*/
function numberString( number ){
    
    return `${ Array.from({ length: ( 6 - number.toString().length ) }, () => '0').join('')}${ number }`;
};
/**
* 
* @param {*} application_type 
* @param {*} discounts 
* @param {*} brand_handle 
* @returns 
*/
function getDiscountBrand( application_type, discounts, brand_handle ){
    
    if( ['wholesale', 'app-wholesale'].includes( application_type ) ){
        
        return discounts.find( (item) => item.brand === brand_handle );
    }
    else{

        return discounts.find( (item) => item.brand === 'ALL-BRANDS' );
    }
};
/**
* 
* @param {*} application_type 
* @param {*} db_discounts 
* @returns 
*/
function DBDiscountBrands( application_type, db_discounts ){
    
    return db_discounts.reduce( (previous_item, current_item) => { 
        
        if( !current_item.deleted && current_item.brand ){
            
            previous_item.push( { brand: current_item.brand.handle, value: parseFloat( current_item.valueDiscount ) } )
        }
        return previous_item;
    }, ( ['wholesale', 'app-wholesale'].includes( application_type ) ) ? [] : [ { brand: 'ALL-BRANDS', value: 0 } ] );
};
/**
* 
* @param {*} application_type 
* @param {*} db_discounts 
* @returns 
*/
function discountOnlyBrands( db_discounts ){
    
    return db_discounts.reduce( (previous_item, current_item) => { 
        
        previous_item.push( current_item.brand );
        return previous_item;
    }, [] );
};
/**
* 
* @param {*} amount 
* @param {*} decimalPlaces 
* @returns 
*/
function bankerRounding(amount, decimalPlaces) {
    
    let decimal_places 			= decimalPlaces || 0;
    let potencia 				= Math.pow(10, decimal_places);
    let avoid_rounding_error 	= +(decimal_places ? amount * potencia : amount).toFixed(8); // Avoid rounding errors
    let int_rounding_error 		= Math.floor(avoid_rounding_error); 
    let decimal_rounding_error 	= avoid_rounding_error - int_rounding_error;
    let allow_rounding_error 	= parseFloat('1e-8'); // Allow for rounding errors in decimal_rounding_error
    
    let rounding_number 		= (decimal_rounding_error > 0.5 - allow_rounding_error && decimal_rounding_error < 0.5 + allow_rounding_error) ? ((int_rounding_error % 2 === 0) ? int_rounding_error : int_rounding_error + 1) : Math.round(avoid_rounding_error);
    
    return decimal_places ? rounding_number / potencia : rounding_number;
};
/**
* 
* @param {*} amount 
* @param {*} shopify_rounding 
* @param {*} locale 
* @param {*} currency 
* @returns 
*/
function currencyObject( amount, shopify_rounding = null, locale = 'en-US', currency = 'USD' ) {
    
    if( !amount || amount === null || isNaN( parseFloat( amount ) ) || typeof amount === 'string' ){
        
        return { format: '$0.00', number: 0 };
    }
    else{
        
        const formatterCurrency = new Intl.NumberFormat( locale, { style: 'currency', currency: currency, minimumFractionDigits: 2 } );
        const parts_format      = formatterCurrency.formatToParts( 1000 );
        
        let regexp_symbol               = new RegExp(`([${ parts_format[0].value }])`, 'g');
        let regexp_separador_millares   = new RegExp(`([${ parts_format[2].value }])`, 'g');
        let regexp_separador_decimal    = new RegExp(`([${ parts_format[parts_format.length - 2].value }])`, 'g');
        
        if( shopify_rounding != null ){
            
            amount = ( shopify_rounding ? bankerRounding(amount, 2) : amount / 100 );
        }
        let format = formatterCurrency.format( amount );
        
        let number = parseFloat( format.replace( regexp_symbol, '').replace( regexp_separador_millares, '' ).replace( regexp_separador_decimal, '.' ) );
        
        return { format, number };
    }
};
/**
* 
* @param {*} price 
* @param {*} discount 
* @param {*} quantity 
* @returns 
*/
function calcDiscountPrice( product_price, product_discount, quantity ) {
    
    let calc_discount = ( Math.round( product_price * 100 ) - Math.trunc( ( Math.round( product_price * 100 ) * ( product_discount || 0 ) * quantity ) / 100 ) / quantity );
    
    return calc_discount;
};
/**
* 
* @param {*} min 
* @param {*} max 
* @returns 
*/
function randomNumber(min, max){
    
    if (Number.isInteger(min) && Number.isInteger(max)) {
        
        return Math.round(Math.random() * (max - min + 1)) + min;
    }
};
/**
* 
* @param {String} sku 
* @param {String} unique_brand_salome 
* @param {String} country 
* @returns 
*/
function extractSKUParent( sku, unique_brand_salome = 'SAL', country = 'US' ){
    
    let brand = '';
    let ref = '';
    let variant_pack = ['12PACK', '7PACK', '6PACK', '5PACK', '5PACK1', '5PACK2', '4PACK', '3PACK', '2PACK', '12pack', 'PACK12', 'PACK', '12P', '9P', '6P', '5P', '5P1', '5P2', '4P', '4P1', '4P2', '3P', '2P', 'X2'];
    let exist_variant_pack = { index: -1, value: '' };
    let valid_cases = true;
    let valid_separator = true;
    let sku_parent = '';
    let original_sku_parent = '';
    let num_ref = '';
    let pack_sku_parent = [];
    sku = sku.replace(/\s/g, '');
    for (const item of variant_pack) {
        
        let aux_item = item;
        if( sku.indexOf( '-' ) != -1 && sku.split( '-' ).includes( item ) && ['5P1', '5P2', '4P1', '4P2'].includes( item ) ){
            
            aux_item = item.substring(0, 2);
        }
        if( sku.indexOf( '-' ) != -1 && sku.split( '-' ).includes( item ) && ['5PACK1', '5PACK2'].includes( item ) ){
            
            aux_item = item.substring(0, 5);
        }
        if( sku.indexOf( '-' ) != -1 && sku.split( '-' ).includes( item ) ){
            
            exist_variant_pack = { index: sku.split( '-' ).indexOf( item ), value: aux_item };
            
            sku = sku.replace( item, '' );
            if( sku.indexOf('-') === sku.length - 1 ){
                
                sku = sku.slice(0, -1);
            }
            exist_variant_pack.exist_separator = sku.indexOf('-') != -1;
            break;
        }
    }
    if( unique_brand_salome === 'FAJASSALOME'){
        
        sku = sku.substring( 0, 3 ) === 'SAL' ? `FAJASSALOME${ sku.substring( 3 ) }` : sku;
    }
    else{
        
        sku = sku.substring( 0, 11 ) === 'FAJASSALOME' ? `SAL${ sku.substring( 11 ) }` : sku;
    }
    if( ['CA-'].includes( sku.substring(0, 3) ) ){
        
        country = sku.substring(0, 2);
        sku = sku.replace( sku.substring(0, 3), '' );
    }
    if( sku.indexOf('-') != -1 ){
        
        sku = sku.split('-').filter( (item) => item != '' );
        brand = sku[0];
        ref = sku[1];
        if( sku.length === 1 ){
            
            if( brand.length > 3 && brand.substring(0, 3) === 'MYD' && isNaN( brand.substring(3, 8) ) ){
                
                ref = '';
                brand = `${ sku[0].substring(0, 3) }${ sku[0].substring(3, 7) }`;
                if( exist_variant_pack.index != -1 ){
                    
                    exist_variant_pack.index += 4;
                } 
            }
            else if( brand.length > 3 && brand.substring(0, 3) === 'MYD' && !isNaN( brand.substring(3, 8) ) ){
                
                ref = '';
                brand = `${ sku[0].substring(0, 3) }${ sku[0].substring(3, 8) }`;
                if( exist_variant_pack.index != -1 ){
                    
                    exist_variant_pack.index += 4;
                }
            }
            else{
                
                valid_cases = false;
            }
        }
        else if( sku.length === 2 ){
            
            if( brand === 'MYD' ){
                
                ref = sku[1].substring(0, 5);
            }
            else if( brand === 'OFC' && sku[1].indexOf( '3103415BL3106476' ) != -1 ){
                
                ref = '3103415BL3106476';
            }
            else if( brand === 'OFC' && sku[1].indexOf( '4223638GRC4226042' ) != -1 ){
                
                ref = '4223638GRC4226042';
            }
            else if( brand === 'PLN1' ){
                
                brand = 'PLN';
            }
            else if( brand.length > unique_brand_salome.length && brand.indexOf( unique_brand_salome ) != -1 ){
                
                ref = brand.substring(unique_brand_salome.length, unique_brand_salome.length + 1) === '0' ? brand.substring(unique_brand_salome.length + 1, unique_brand_salome.length + 4) : brand.substring(unique_brand_salome.length, unique_brand_salome.length + 4);
                brand = brand.substring(0, unique_brand_salome.length);
            }
            else if( ['BLN','BSH','CTL','LOW','MER','MUN','PAX','PLN','REC'].includes( brand ) ){
                
                ref = sku[1];
            }
            else{
                
                valid_cases = false;
            }
        }
        else if( sku.length === 3 ){
            
            if( ['POSO230','POSO272'].includes( brand ) ){
                
                brand = 'SON';
                ref = sku[0];
            }
            else if( brand === 'FDP' ){
                
                ref = `${ sku[1] }-${ sku[2].substring(0, 5) }`;
            }
            else if( brand === 'REC' && sku[1].substring( sku[1].length - 6, sku[1].length - 2 ) === 'PACK' ){
                
                ref = sku[1].substring(0, sku[1].length - 2);
            }
            else if( ['MYD',unique_brand_salome ].includes( brand ) ){
                
                ref = brand === unique_brand_salome ? `${ sku[1] }${ sku[2].substring(0, 4) }` : `${ sku[1] }-${ sku[2].substring(0, 4) }`;
            }
            else if( ['AGB','AMG','AMW','B25K','BSH','CAF','CRE','FUN','IFK','JVC','LPL','OFC','PAX','PNY','QCO','REC','WAI'].includes( brand ) ){
                
                ref = sku[1];
            }
            else{
                
                valid_cases = false;
            }
        }
        else if( sku.length === 4 ){
            
            if( brand === 'ALM' ){
                
                ref = `${ isNaN( sku[1] ) ? sku[1] : sku[1].length === 3 ? `0${ sku[1] }` : sku[1] }`;
            }
            else if( ( brand === 'AGB' && sku[2] != '1' ) || ( ['3PS','AMW','ANN1','BBL','BLN','BLI','BSH','BSK','CID','CON','CRK','CRE','CTL','CWT','DAG','DRX','DUG','DUP','FCS','FLF','FLP','FLX','FUN','GOR','HPY','JVC','LIB','LOV','LOW','LTR','LUX','MAP','MEK','MEN','MER','MRE','MUN','MYD','PAX','POP','ROM','SAK','SNA','SON','TAT','TOR','VDL'].includes( brand ) ) ){
                
                ref = sku[1];
            }
            else if( brand === 'OFC' ){
                
                ref = !isNaN( sku[2] ) ? `${ sku[1] }-${ sku[2] }` : sku[1];
            }
            else if( brand === 'VLZ' ){
                
                ref = isNaN( sku[2] ) ? sku[1] : `${ sku[1] }-${ sku[2] }`;
            }
            else if( brand === 'AMG' ){
                
                ref = `${ sku[1] }-${ sku[3] }`;
            }
            else if( ( ['CAC','IFK','PHX','POP',unique_brand_salome ].includes( brand ) ) || ( brand === 'JVC' && ['DRIP'].includes( sku[2] ) ) || ( brand === 'AGB' && sku[2] === '1' ) ){
                
                ref = `${ sku[1] }-${ sku[2] }`;
            }
            else{
                
                valid_cases = false;
            }
        }
        else if( sku.length === 5 ){
            
            if( brand === 'FLX' && ['902103944103'].includes( sku[1] ) ){
                
                ref = '902103-944103';
            }
            else if( ( brand === 'LTR' && ['1020', '1042'].includes( sku[2] ) ) || ( ['KUR'].includes( brand ) ) ){
                
                ref = sku[1];
            }
            else if( ( ['1Y','AGB','AMW','BSH','CFA','CON','FIO','FLX','JVC','LOW','LTR','LUX','LXS', 'MRE','MYD','OFC','POP','RAI',unique_brand_salome,'SON','STH','TAT','UPL','VDL','VLZ'].includes( brand ) ) || ( brand === 'MRE' && ['1','4'].includes( sku[2] ) ) ){
                
                ref = `${ sku[1] }-${ sku[2] }`;
            }
            else if( ( brand === 'OFC' && exist_variant_pack.index != -1 ) || ( ['ARJ','B25K'].includes( brand ) ) ){
                
                ref = `${ sku[1] }-${ sku[2] }-${ sku[3] }`;
            }
            else{
                
                valid_cases = false;
            }
        }
        else if( sku.length === 6 ){
            
            if( ['BSH'].includes( brand ) || ( brand === 'LTR' && ['21996'].includes( sku[1] ) ) ){
                
                ref = sku[1];
            }
            else if( ['FLX'].includes( brand ) ){
                
                ref = `${ sku[1] }-${ sku[2] }`;
            }
            else if( ['FXE','LTR','OFC', unique_brand_salome].includes( brand ) ){
                
                ref = `${ sku[1] }-${ sku[2] }-${ sku[3] }`;
            }
            else if( ( ['CAC','DAG'].includes( brand ) ) || ( brand === 'OFC' && ['5226697'].includes( sku[1] ) ) ){
                
                ref = `${ sku[1] }-${ sku[2] }-${ sku[3] }-${ sku[4] }`;
            }
            else{
                
                valid_cases = false;
            }
        }
        else if( sku.length === 9 ){
            
            if( brand === 'C' && sku[1] === sku[5] ){
                
                brand = sku[1];
                ref =  sku[2] === sku[6] ? `${ sku[2] }` : `${ sku[2] }-${ sku[6] }`;
            }
            else{
                
                brand ='BUNDLE';
                ref = `${ sku[1] }-${ sku[2] }`;
            }
        }
        else{
            
            valid_cases = false;
        }
    }
    else{
        
        valid_separator = false;
        brand = sku.substring(0, 4) === 'MEIK' ? 'MEK' : sku.substring( 0, 3 );
        
        if( unique_brand_salome === 'FAJASSALOME'){
            
            brand = sku.substring( 0, unique_brand_salome.length ) === 'FAJASSALOME' ? 'FAJASSALOME' : brand;
        }
        
        ref = sku.substring(3, 7);
        
        if( brand === 'MYD' && ( sku.substring(3, 5) === 'CA' || sku.substring(3, 6) === 'MLE' ) ){
            
            ref = sku.substring(3, 10);
        }
        else if( brand === 'MEK' && sku.indexOf('MEIK0396') >= 0 ){
            ref = '0396'
        }
        else if( brand === 'MEK' && sku.indexOf('MEIK996') >= 0 ){
            ref = '996'
        }
        else if( ( brand === 'MYD' && sku.substring(3, 5) === 'BL' ) || ( brand === 'ODM' && isNaN( sku.substring(3, 5) ) && !isNaN( sku.substring(5, 9) ) ) ){
            
            ref = sku.substring(3, 9);
        }
        else if( ( brand === 'MYD' && sku.substring(3, 5) === 'EX' ) || ( brand === 'ODM' && sku.substring(3, 5) === 'PT' ) ){
            
            ref = `${ sku.substring(3, 5) }0${ sku.substring(5, 8) }`;
        }
        else if( brand === 'MYD' && ['C4053','C4055', 'C4057'].findIndex( (item) => sku.replace('MYD', '').indexOf( item ) >= 0 ) >= 0 ){
            
            ref = ['C4053','C4055', 'C4057'][['C4053','C4055', 'C4057'].findIndex( (item) => sku.replace('MYD', '').substring(0, 5) === item )];
        }
        else if( brand === 'ODM' && isNaN( sku.substring(3, 6) ) && !isNaN( sku.substring(6, 9) ) ){
            
            ref = `${ sku.substring(3, 6) }0${ sku.substring(6, 9) }`;
        }
        else if( ( brand === 'FDP' ) || ( brand === 'MYD' && ['B','F'].includes( sku.substring(3, 4) ) ) || ( brand === 'ODM' && !isNaN( sku.substring(3, 8) ) ) ){
            
            ref = sku.substring(3, 8);
        }
        else if( brand === unique_brand_salome  && sku.substring(unique_brand_salome.length, unique_brand_salome.length + 1) === 'M' ){
            
            ref = `${ sku.substring(unique_brand_salome.length, unique_brand_salome.length + 1) }${ isNaN( sku.substring(unique_brand_salome.length + 1, unique_brand_salome.length + 5) ) ? `0${ sku.substring(unique_brand_salome.length + 1, unique_brand_salome.length + 4) }` : sku.substring(unique_brand_salome.length + 1, unique_brand_salome.length + 5) }`;
        }
        else if( ( ['121','FBA'].includes( brand) ) || ( ['MYD'].includes( brand) && !isNaN( sku.substring(3, 7) ) ) || ( brand === 'ODM' && isNaN( sku.substring(3, 8) ) ) ){
            
            ref = sku.substring(3, 7);
        }
        else if( brand === unique_brand_salome && !isNaN( sku.substring(unique_brand_salome.length, unique_brand_salome.length + 4) ) ){
            
            ref = sku.substring(unique_brand_salome.length, unique_brand_salome.length + 1) === '0' ? sku.substring(unique_brand_salome.length + 1, unique_brand_salome.length + 4) : sku.substring(unique_brand_salome.length, unique_brand_salome.length + 4);
            valid_separator = true;
        }
        else if( brand === 'MYD' && isNaN( sku.substring(6, 7) ) ){
            
            ref = `0${ sku.substring(3, 6) }`;
        }
        else if( brand === unique_brand_salome && !isNaN( sku.substring(unique_brand_salome.length, unique_brand_salome.length + 3) ) ){
            
            ref = `${ sku.substring(unique_brand_salome.length, unique_brand_salome.length + 3) }`;
            valid_separator = true;
        }
        else{
            
            valid_cases = false;
        }
    }
    sku_parent = `${ brand }-${ ref }`.split('-');
    num_ref = `${ ref }`;
    
    if( exist_variant_pack.index != -1 ){
        
        pack_sku_parent = [...sku_parent];
        if( exist_variant_pack.exist_separator && ( exist_variant_pack.index > pack_sku_parent.length || exist_variant_pack.index <= pack_sku_parent.length ) ){
            
            pack_sku_parent.push( exist_variant_pack.value );
        }
        else{
            
            pack_sku_parent.splice( exist_variant_pack.index, 0, exist_variant_pack.value );
        }
    }
    pack_sku_parent = pack_sku_parent.filter( (item) => item != '' ).join('-');
    sku_parent = sku_parent.filter( (item) => item != '' ).join('-');
    original_sku_parent = sku_parent;
    
    if( !valid_separator ){
        
        original_sku_parent = sku_parent.split('-').join('');
        pack_sku_parent = null;
        
        if( exist_variant_pack.value ){
            
            pack_sku_parent = `${ sku_parent.replace( exist_variant_pack.value, '' ) }-${ exist_variant_pack.value }`;
        }
    }
    
    return { 
        sku_type: valid_separator ? sku.length : 0,
        variant: {
            standard: sku_parent,
            original: original_sku_parent,
            width_pack: pack_sku_parent === '' ? null : pack_sku_parent
        },
        num_ref: num_ref,
        brand: brand, 
        country: country,
        valid: valid_cases 
    };		
};
/**
* 
* @param {*} current_discount 
* @param {*} new_discount 
* @returns 
*/
function successiveDiscount(current_discount, new_discount) {
    return current_discount + ( ( new_discount * ( 100 - current_discount ) ) / 100 );
};
function additionalDiscount(additional_discount, current_discount, new_discount) {
    return additional_discount + ( ( new_discount * ( 100 - current_discount ) ) / 100 )
};
/**
* 
* @param {*} item_product 
* @param {*} discounts 
* @returns 
*/
function productObject( item_product, discounts ){
    
    try {
        item_product.discounts  = {
            brand       : discounts.brand,
            stock       : item_product.discounts.stock,
            affiliate   : discounts.affiliate,
            product     : discounts.product,
            pre_sale    : 0
        };
        let format_data         = { 
            id                  : h_validation.evalExistField( item_product._id, null ),
            shopify_id          : h_validation.evalExistField( item_product.shopify_id, null ),
            title               : h_validation.evalExistField( item_product.title, null ),
            description         : h_validation.evalExistField( item_product.description, null ),
            handle              : h_validation.evalExistField( item_product.handle, null ),
            translate           : h_validation.evalExistField( item_product.translate, [] ).reduce( (previous_item, current_item) => {
                previous_item.push({
                    language    : current_item.language,
                    title       : current_item.title,
                    description : current_item.description
                });
                return previous_item;
            }, []),
            images              : h_validation.evalExistField( item_product.images, [] ),
            brand               : h_validation.evalExistField( item_product.brand, null ),
            product_type        : h_validation.evalExistField( item_product.product_type, null ),
            reference           : h_validation.evalExistField( item_product.reference, null ),
            sku_parent          : h_validation.evalExistField( item_product.sku_parent, null ),
            discounts           : h_validation.evalExistField( item_product.discounts, null ),
            total_discount      : 0,
            options             : h_validation.evalExistField( item_product.options, [] ),
            moq                 : h_validation.evalExistField( item_product.moq, 0 ),
            sales_limit         : h_validation.evalExistField( item_product.sales_limit, 0 ),
            custom_badges       : h_validation.evalExistField( item_product.custom_badges, null ),
            config_bundle       : null,
            config_pre_sale     : null,
            variants            : [],
            additional_contents : [],
            price               : null,
            discount_price      : null,
            compare_at_price    : null,
            min_price           : null,
            max_price           : null
        };
        if( item_product.config_bundle ){
            
            if( format_data.images.length === 0 ){
                
                format_data.images = item_product.config_bundle.selected_variants.reduce( (previous_item, current_item) => { 
                    
                    let image = current_item?.variant?.image;
                    if( previous_item.findIndex( (item) => item?.desktop?.src?.split('?v=')[0] != image?.desktop?.src?.split('?v=')[0] ) < 0 ){
                        
                        previous_item.push( item );
                    }
                    return previous_item;
                }, format_data.images);
            }
            format_data.config_bundle   = {
                name                : item_product.config_bundle.name,
                selected_variants   : item_product.config_bundle.selected_variants,
                option_customize    : item_product.config_bundle.option_customize
            };
            if( item_product.config_bundle.config_pre_sale ){
                
                format_data.config_pre_sale         = {
                    enable_after: item_product.config_bundle.config_pre_sale.enable_after,
                    started_at  : item_product.config_bundle.config_pre_sale.started_at,
                    ended_at    : item_product.config_bundle.config_pre_sale.ended_at
                };
                format_data.discounts.pre_sale      = item_product.config_bundle.config_pre_sale.discount || 0;
                format_data.config_pre_sale.valid   = format_data.config_pre_sale.enable_after || ( moment(item_product.config_bundle.config_pre_sale.started_at.split('T')[0]).startOf('day').diff(moment(), 'seconds') < 0 && moment(item_product.config_bundle.config_pre_sale.ended_at.split('T')[0]).endOf('day').diff(moment(), 'seconds') > 0 );
            }
            format_data.moq             = item_product.config_bundle.moq;
        }
        if( item_product.config_pre_sale ){
            
            format_data.config_pre_sale         = {
                enable_after: item_product.config_pre_sale.enable_after,
                started_at  : item_product.config_pre_sale.started_at,
                ended_at    : item_product.config_pre_sale.ended_at
            };
            format_data.moq                     = item_product.config_pre_sale.moq;
            format_data.discounts.pre_sale      = item_product.config_pre_sale.discount || 0;
            format_data.config_pre_sale.valid   = format_data.config_pre_sale.enable_after || ( moment(item_product.config_pre_sale.started_at.split('T')[0]).startOf('day').diff(moment(), 'seconds') < 0 && moment(item_product.config_pre_sale.ended_at.split('T')[0]).endOf('day').diff(moment(), 'seconds') > 0 );
            
        }
        let valid_discount = format_data.discounts.brand != null && ( format_data.discounts.stock || format_data.discounts.affiliate >= 0 || format_data.discounts.product >= 0 || format_data.discounts.pre_sale >= 0 );
        
        if ( valid_discount ){
            
            format_data.total_discount  = format_data.discounts.brand;
            format_data.total_discount  = successiveDiscount(format_data.total_discount, format_data.discounts.affiliate);
            format_data.total_discount  = successiveDiscount(format_data.total_discount, format_data.discounts.product);
            format_data.total_discount  = successiveDiscount(format_data.total_discount, format_data.discounts.pre_sale);
            
            format_data.variants        = h_validation.evalExistField( item_product.variants, [] ).reduce( (previous_item, current_item) => {
                
                previous_item.push({     
                    id                  : current_item._id,
                    shopify_id          : current_item.shopify_id,
                    sku                 : current_item.sku,
                    title               : current_item.title,
                    price               : current_item.price,
                    discounts           : current_item.discounts,    
                    discount_price      : currencyObject( calcDiscountPrice( current_item.price, format_data.total_discount, 1 ), false ).number,
                    compare_at_price    : current_item.compare_at_price,
                    options             : current_item.options,
                    discounts           : current_item.discounts,
                    image               : current_item.image ? current_item.image : null,
                    inventory_quantity  : h_validation.evalExistField( item_product.max_stock, 0 ) > 0 && current_item.inventory_quantity > 0 && h_validation.evalExistField( item_product.max_stock, 0 ) < current_item.inventory_quantity ? h_validation.evalExistField( item_product.max_stock, 0 ) : current_item.inventory_quantity
                });
                return previous_item;
            }, []);
            format_data.discount_price  = {
                min_price: format_data.total_discount > 0 ? currencyObject( calcDiscountPrice( h_validation.evalExistField( item_product.price?.min_price, 0 ), format_data.total_discount, 1 ), false ).number : h_validation.evalExistField( item_product.price?.min_price, 0 ),
                max_price: format_data.total_discount > 0 ? currencyObject( calcDiscountPrice( h_validation.evalExistField( item_product.price?.max_price, 0 ), format_data.total_discount, 1 ), false ).number : h_validation.evalExistField( item_product.price?.max_price, 0 )
            };
            format_data.price           = h_validation.evalExistField( item_product.price, { min_price: 0, max_price: 0 } );
            format_data.compare_at_price= h_validation.evalExistField( item_product.compare_at_price, { min_price: 0, max_price: 0 } );
            format_data.min_price       = format_data.total_discount > 0 ? currencyObject( calcDiscountPrice( h_validation.evalExistField( item_product.price?.min_price, 0 ), format_data.total_discount, 1 ), false ).number : h_validation.evalExistField( item_product.price?.min_price, 0 );
            format_data.max_price       = format_data.total_discount > 0 ? currencyObject( calcDiscountPrice( h_validation.evalExistField( item_product.price?.max_price, 0 ), format_data.total_discount, 1 ), false ).number : h_validation.evalExistField( item_product.price?.max_price, 0 );
        }
        if( item_product.config_bundle?.config_pre_sale || item_product.config_pre_sale ){
            
            format_data.custom_badges.pre_sale = true;
        }
        let additional_contents = h_validation.evalExistField( item_product.additional_content, [] ).reduce( (previous_item, current_item) => {
            
            if( current_item?.content_value && current_item?.content_value?.location != 'new_tab' ){
                
                previous_item[current_item.content_value?.location].push( current_item );
            }
            else if( current_item?.content_value ) {
                
                let index_tab = previous_item.new_tab.findIndex( (item) => item.title_tab === current_item.content_value?.location_tab );
                if( index_tab >= 0 ){
                    previous_item.new_tab[index_tab].content_tab.push( current_item );
                }
                else{
                    previous_item.new_tab.push( { title_tab: current_item.content_value?.location_tab, content_tab: [current_item] } );
                }
            }
            return previous_item;
        }, { gallery: [], bottom_description: [], top_description: [], new_tab: [] });
        
        if( additional_contents.gallery.length > 0 || additional_contents.bottom_description.length > 0 || additional_contents.top_description.length > 0 || additional_contents.new_tab.length > 0 ){
            
            format_data.additional_contents = additional_contents;
        }
        if( format_data.config_pre_sale === null || ( format_data.config_pre_sale && format_data.config_pre_sale?.valid === true ) ){
            
            return h_response.request( true, format_data, 200, 'Success: Format', 'Format Product Successfuly' );
        }
        else{
            
            return h_response.request( false, format_data, 400, 'Error: Format', 'Format Product, error in fields' );
        }
        
    } catch (format_error) {
        
        return h_response.request( false, format_error, 400, 'Error: Format', 'Format Product, error in fields' );
    }
};
/**
* 
* @param {*} item_product 
* @param {*} discounts 
* @param {*} include_variants 
* @returns 
*/
function productCollectionObject( item_product, discounts, include_variants = false, uncategorized_product_index = 11 ){
    
    try {
        
        item_product.discounts  = {
            brand       : discounts.brand,
            stock       : item_product.discounts.stock,
            affiliate   : discounts.affiliate,
            product     : discounts.product,
            pre_sale    : 0
        };
        let format_data         = { 
            id                  : h_validation.evalExistField( item_product._id, null ),
            shopify_id          : h_validation.evalExistField( item_product.shopify_id, null ),
            title               : h_validation.evalExistField( item_product.title, null ),
            description         : null,
            handle              : h_validation.evalExistField( item_product.handle, null ),
            translate           : h_validation.evalExistField( item_product.translate, [] ).reduce( (previous_item, current_item) => {
                previous_item.push({
                    language    : item.language,
                    title       : item.title,
                    search_field: current_item.search_field
                });
                return previous_item;
            }),
            sort_category       : h_validation.evalExistField( item_product.sort_category, uncategorized_product_index ),
            search_field        : h_validation.evalExistField( item_product.search_field, null ),
            images              : h_validation.evalExistField( item_product.images, [] ).slice(0, 2),
            brand               : h_validation.evalExistField( item_product.brand, null ),
            product_type        : h_validation.evalExistField( item_product.product_type, null ),
            reference           : h_validation.evalExistField( item_product.reference, null ),
            sku_parent          : h_validation.evalExistField( item_product.sku_parent, null ),
            discounts           : item_product.discounts,
            total_discount      : 0,
            options             : [],
            moq                 : h_validation.evalExistField( item_product.moq, 0 ),
            sales_limit         : h_validation.evalExistField( item_product.sales_limit, 0 ),
            custom_badges       : h_validation.evalExistField( item_product.custom_badges, null ),
            config_bundle       : null,
            config_pre_sale     : null,
            variants            : [],
            additional_contents : [],
            price               : null,
            discount_price      : null,
            compare_at_price    : null,
            min_price           : null,
            max_price           : null
        };
        if( item_product.config_bundle ){
            
            if( format_data.images.length === 0 ){
                
                format_data.images = item_product.config_bundle.selected_variants.reduce( (previous_item, current_item) => { 
                    
                    let image = current_item?.variant?.image;
                    if( previous_item.findIndex( (item) => item?.desktop?.src?.split('?v=')[0] != image?.desktop?.src?.split('?v=')[0] ) < 0 ){
                        
                        previous_item.push( item );
                    }
                    return previous_item;
                }, format_data.images);
            }
            format_data.config_bundle   = {
                name : item_product.config_bundle.name,
            };
            if( item_product.config_bundle.config_pre_sale ){
                
                format_data.config_pre_sale         = {
                    enable_after: item_product.config_bundle.config_pre_sale.enable_after,
                    started_at  : item_product.config_bundle.config_pre_sale.started_at,
                    ended_at    : item_product.config_bundle.config_pre_sale.ended_at
                };
                format_data.discounts.pre_sale      = item_product.config_bundle.config_pre_sale.discount || 0;
                format_data.config_pre_sale.valid   = format_data.config_pre_sale.enable_after || ( moment(item_product.config_bundle.config_pre_sale.started_at.split('T')[0]).startOf('day').diff(moment(), 'seconds') < 0 && moment(item_product.config_bundle.config_pre_sale.ended_at.split('T')[0]).endOf('day').diff(moment(), 'seconds') > 0 );
            }
            format_data.moq             = item_product.config_bundle.moq;
        }
        if( item_product.config_pre_sale ){
            
            format_data.config_pre_sale         = {
                enable_after: item_product.config_pre_sale.enable_after,
                started_at  : item_product.config_pre_sale.started_at,
                ended_at    : item_product.config_pre_sale.ended_at
            };
            format_data.moq                     = item_product.config_pre_sale.moq;
            format_data.discounts.pre_sale      = item_product.config_pre_sale.discount || 0;
            format_data.config_pre_sale.valid   = format_data.config_pre_sale.enable_after || ( moment(item_product.config_pre_sale.started_at.split('T')[0]).startOf('day').diff(moment(), 'seconds') < 0 && moment(item_product.config_pre_sale.ended_at.split('T')[0]).endOf('day').diff(moment(), 'seconds') > 0 );
            
        }
        let valid_discount = format_data.discounts.brand != null && ( format_data.discounts.stock || format_data.discounts.affiliate >= 0 || format_data.discounts.product >= 0 || format_data.discounts.pre_sale >= 0 );
        
        if ( valid_discount ){
            
            format_data.options         = h_validation.evalExistField( item_product.options, [] );
            
            let product_discount        = format_data.discounts.brand;
            product_discount            = successiveDiscount(product_discount, format_data.discounts.affiliate);
            product_discount            = successiveDiscount(product_discount, format_data.discounts.product);
            product_discount            = successiveDiscount(product_discount, format_data.discounts.pre_sale);
            format_data.total_discount  = product_discount;
            
            if( include_variants ){
                
                format_data.variants = h_validation.evalExistField( item_product.variants, [] ).reduce( (previous_item, current_item) => {
                    
                    previous_item.push({     
                        id                  : current_item._id,
                        shopify_id          : current_item.shopify_id,
                        sku                 : current_item.sku,
                        title               : current_item.title,
                        price               : current_item.price,
                        discount_price      : currencyObject( calcDiscountPrice( current_item.price, product_discount, 1 ), false ).number,
                        compare_at_price    : current_item.compare_at_price,
                        options             : current_item.options,
                        discounts           : current_item.discounts,
                        image               : current_item.image ? current_item.image : null,
                        inventory_quantity  : h_validation.evalExistField( item_product.max_stock, 0 ) > 0 && current_item.inventory_quantity > 0 && h_validation.evalExistField( item_product.max_stock, 0 ) < current_item.inventory_quantity ? h_validation.evalExistField( item_product.max_stock, 0 ) : current_item.inventory_quantity
                    });
                    return previous_item;
                }, []);
            }
            format_data.discount_price  = {
                min_price: product_discount > 0 ? currencyObject( calcDiscountPrice( h_validation.evalExistField( item_product.price?.min_price, 0 ), product_discount, 1 ), false ).number : h_validation.evalExistField( item_product.price?.min_price, 0 ),
                max_price: product_discount > 0 ? currencyObject( calcDiscountPrice( h_validation.evalExistField( item_product.price?.max_price, 0 ), product_discount, 1 ), false ).number : h_validation.evalExistField( item_product.price?.max_price, 0 )
            };
            format_data.price           = h_validation.evalExistField( item_product.price, { min_price: 0, max_price: 0 } );
            format_data.compare_at_price= h_validation.evalExistField( item_product.compare_at_price, { min_price: 0, max_price: 0 } );
            format_data.min_price       = product_discount > 0 ? currencyObject( calcDiscountPrice( h_validation.evalExistField( item_product.price?.min_price, 0 ), product_discount, 1 ), false ).number : h_validation.evalExistField( item_product.price?.min_price, 0 );
            format_data.max_price       = product_discount > 0 ? currencyObject( calcDiscountPrice( h_validation.evalExistField( item_product.price?.max_price, 0 ), product_discount, 1 ), false ).number : h_validation.evalExistField( item_product.price?.max_price, 0 );
        }
        if( item_product.config_bundle?.config_pre_sale || item_product.config_pre_sale ){
            
            format_data.custom_badges.pre_sale = true;
        }
        let additional_contents = item_product.additional_content?.reduce( (previous_item, current_item) => {
            
            if( current_item.content_value?.location === 'gallery' && ['image', 'video'].includes( current_item.content_type ) ){
                
                previous_item.push( current_item );
            }
            return previous_item;
        }, []);
        
        format_data.additional_contents = additional_contents;
        
        format_data.images = format_data.images.map( (item_image) => {
            return item_image.desktop;
        });
        
        if( format_data.config_pre_sale === null || ( format_data.config_pre_sale && format_data.config_pre_sale?.valid === true ) ){
            
            return h_response.request( true, format_data, 200, 'Success: Format', 'Format Product Successfuly' );
        }
        else{
            
            return h_response.request( false, format_data, 400, 'Error: Format', 'Format Product, error in fields' );
        }
    } catch (format_error) {
        
        return h_response.request( false, format_error, 400, 'Error: Format', 'Format Product, error in fields' );
    }
};
/**
* 
* @param {Object} item_customer 
* @param {String} agent 
* @param {String} language 
* @param {String} type_business 
* @param {String} customer_type 
* @param {String} product_category 
* @param {String} db_customer 
* @param {Boolean} new_document 
* @returns 
*/
function customerObject(item_customer, agent, form_data, next_nit, db_document = null, new_document = false){
    
    let format_document                 = {
        first_name                  : item_customer.first_name,
        last_name                   : item_customer.last_name,
        full_name                   : `${ item_customer.first_name.trim() } ${ item_customer.last_name.trim() }`,
        email                       : item_customer.email,
        phone                       : phoneNumber( form_data.phone ),
        note                        : h_validation.evalString(item_customer.note),
        agent_email                 : agent.email,
        agent                       : agent._id,   
        tags                        : item_customer.tags === null ? [] : form_data.tags,
        valid_moa                   : form_data.valid_moa,
        tax_exempt                  : form_data.tax_exempt,
        special_shippings           : [],
        
        birthday_date               : form_data.birthday_date ? form_data.birthday_date : null,
        initial_budget              : form_data.initial_budget,
        company_website             : form_data.company_website ? form_data.company_website : null,
        updated_at                  : shopifyDate( item_customer.updated_at )
    };
    format_document.shop                = !form_data.shop || form_data.shop === '' ? null : form_data.shop;
    format_document.language            = !form_data.language || form_data.language === '' ? null : form_data.language;
    format_document.type_business       = !form_data.type_business || form_data.type_business === '' ? null : form_data.type_business;
    format_document.customer_type       = !form_data.customer_type || form_data.customer_type === '' ? null : form_data.customer_type;
    format_document.product_category    = !form_data.product_category || form_data.product_category === '' ? null : form_data.product_category;
    format_document.country             = !form_data.country || form_data.country === '' ? null : form_data.country;
    format_document.state               = !form_data.state || form_data.state === '' ? null : form_data.state;
    
    if( new_document ){
        
        format_document.shopify_id                  = item_customer.id; 
        format_document.storefront                  = form_data.storefront;
        format_document.created_at                  = shopifyDate( item_customer.created_at );
        format_document.nit                         = ( next_nit + 1 ).toString();
        format_document.addresses                   = ( item_customer.addresses || [] ).reduce( (previous_item, current_item) => {
            let new_address = shopifyAddressObject( current_item );
            if( db_customer != null ){
                
                let db_address = db_customer.addresses.find( (item_db) => item_db.id === current_item.id );
                
                new_address.default_billing    = db_address ? db_address.default_billing    : false;
                new_address.shipping_address   = db_address ? db_address.shipping_address   : true;
                new_address.billing_address    = db_address ? db_address.billing_address    : true;
            }
            else{
                
                new_address.default_billing = true;
                new_address.shipping_address= true;
                new_address.billing_address = true;
            }
            previous_item.push( new_address );
            return previous_item;
        }, []),
        format_document.google_add_id               = form_data.idGoogleAdd ? form_data.idGoogleAdd : null;
        format_document.origin_add                  = form_data.origin ? form_data.origin : null;
        format_document.utms                        = {
            utmSource	: form_data.utmSource ? form_data.utmSource : null,
            utmMedium   : form_data.utmMedium ? form_data.utmMedium : null,
            utmCampaign	: form_data.utmCampaign ? form_data.utmCampaign : null,
            utmTerm		: form_data.utmTerm ? form_data.utmTerm : null,
        };
        
        format_document.check_terms_and_conditions  = form_data.check_terms_and_conditions;
        format_document.source                      = form_data.source;
    }
    else{
        
        format_document = { query: { shopify_id: item_customer.id }, document: format_document }
    }
    return format_document;
};
/**
* 
* @param {*} object_document 
* @param {*} phone_value 
*/
function phoneShopify( object_document, phone_value){
    
    if( object_document && !['', null, undefined].includes( phone_value ) ){
        
        phone_value = phone_value.replace(/[+\s\(\)\-]/g, '');
        if( phone_value.length > 10 ){
            
            phone_value = `+${ phone_value }`;
        }
        else{
            
            phone_value = `+1${ phone_value }`;
        }
    }
    return phone_value;
};
/**
* 
* @param {*} item_address 
* @returns 
*/
function shopifyAddressObject(item_address){
    
    item_address.phone = phoneShopify( item_address, item_address.phone );
    
    let format_address = {
        customer_id     : item_address.customer_id,
        first_name      : item_address.first_name,
        last_name       : item_address.last_name,
        phone           : phoneNumber( item_address.phone ),
        company         : item_address.company,
        city            : item_address.city,
        zip             : item_address.zip
    };
    format_address.country            = item_address.country;
    format_address.country_code       = item_address.country_code;
    format_address.state              = item_address.province;
    format_address.state_code         = item_address.province_code;
    format_address.address_1          = item_address.address1;
    format_address.address_2          = item_address.address2;
    
    format_address.default_shipping   = item_address.default;
    format_address.default_billing    = false;
    format_address.shipping_address   = true;
    format_address.billing_address    = true;
    format_address.id                 = item_address?.id || null;
    return format_address;
};
/**
* 
* @param {*} item_address 
* @returns 
*/
function customerAddressObject(item_address, new_document = false){
    
    let basic_data      = {
        customer_id     : item_address.customer_id,
        first_name      : item_address.first_name,
        last_name       : item_address.last_name,
        phone           : item_address.phone,
        company         : item_address.company,
        city            : item_address.city,
        zip             : item_address.zip
    };
    let format_address  = {
        data_base   : { ... basic_data },
        shopify     : { ... basic_data, default: item_address.default_shipping }
    }
    
    format_address.data_base.phone              = phoneNumber( item_address.phone );
    format_address.data_base.country            = item_address.country;
    format_address.data_base.country_code       = item_address.country_code;
    format_address.data_base.state              = item_address.state;
    format_address.data_base.state_code         = item_address.state_code;
    format_address.data_base.address_1          = item_address.address_1;
    format_address.data_base.address_2          = item_address.address_2;
    
    format_address.data_base.default_shipping   = format_address.shopify.default;
    format_address.data_base.default_billing    = item_address.default_billing;
    format_address.data_base.shipping_address   = true;
    format_address.data_base.billing_address    = true;
    
    format_address.shopify.country              = item_address.country;
    format_address.shopify.country_code         = item_address.country_code;
    format_address.shopify.province             = item_address.state;
    format_address.shopify.province_code        = item_address.state_code;
    format_address.shopify.address1             = item_address.address_1;
    format_address.shopify.address2             = item_address.address_2;
    
    if( !new_document ){
        
        format_address.shopify.id           = item_address.id;
        format_address.data_base.id         = item_address.id;
    }
    return format_address;
};
/**
* 
* @param {Object} item_customer 
* @param {String} password 
* @returns 
*/
function userObject(item_customer, user_data, db_user = null, new_document = false){
    
    let format_user = {
        first_name      : h_validation.evalString( item_customer.first_name ), 
        last_name       : h_validation.evalString( item_customer.last_name ), 
        email           : h_validation.evalString( item_customer.email ),
        change_password : h_validation.evalString( user_data?.change_password, false ),
    };
    if( new_document ){
        
        format_user.marketplace         = h_validation.evalObjectId( user_data.marketplace );
        format_user.storefront          = h_validation.evalObjectId( user_data.storefront );
        format_user.customer            = h_validation.evalObjectId( item_customer._id );
        format_user.role                = user_data.role;
        format_user.password            = h_validation.evalString( user_data.password, '123456789' );
        format_user.application_type    = h_validation.evalString( user_data.application_type, 'wholesale' );
    }
    else{
        
        format_user = { 
            query: { 
                _id: h_validation.evalObjectId( db_user._id ) 
            }, 
            document: format_user 
        };
    }
    return format_user;
};
/**
* 
* @param {*} general_settings 
* @param {*} format_product 
* @returns 
*/
function bestSellerVariantsObject( general_settings, format_product){
    
    let limit_variants = ( format_product.quantity_sale * ( general_settings.percentage_variant / 100 ) );
    format_product.limit_best_seller = limit_variants;
    
    format_product.variants = h_array.sort( format_product.variants, 'quantity_sale', false ).map( (item_variant) => {
        
        item_variant.best_seller = limit_variants >= item_variant.quantity_sale;
        
        limit_variants -= item_variant.quantity_sale;
        
        return item_variant;
    });
    
    return format_product;
};
/**
* 
* @param {*} item_product 
* @param {*} item_variant 
* @param {*} item_cart 
* @param {*} discount_product 
* @returns 
*/
function cartItemsObject(item_product, item_variant){
    
    try {
        let discount_price  = item_product.discounts.brand > 0 ? currencyObject( calcDiscountPrice( item_variant.price, item_product.discounts.brand, h_validation.evalInt( item_variant.quantity ) ), false ).number : item_variant.price;
        let format_data_base      = {
            variant_id          : item_variant.shopify_id,
            product_id          : item_variant.product_id,
            sku                 : item_variant.sku,
            quantity            : h_validation.evalInt( item_variant.quantity ),
            origin              : item_variant.origin
        };
        let format_front_end       = {
            ...format_data_base,
            price               : item_variant.price,
            discount_price      : discount_price,
            discounts           : {
                brand       : item_product.discounts.brand,
                stock       : item_variant.discounts.stock?.apply ? item_variant.discounts.stock : { apply: false, value: 0, min_stock: 0 },
                coupon      : {
                    percentage  : {
                        value   : 0,
                        amount  : 0,
                        price   : 0
                    },
                    fixed       : 0
                },
                affiliate   : item_product.discounts.affiliate,
                product     : item_product.discounts.product,
                pre_sale    : item_product.discounts.pre_sale,
                total_fixed : 0
            },
            discount_type       : 'percentage', 
            current_discount    : item_product.discounts.brand,
            additional_discount : 0,
            total_discount      : item_product.discounts.brand,
            price_total         : discount_price,
            weight              : item_variant.weight,
            grams               : item_variant.grams,
            sales_limit         : item_product.sales_limit,
            moq                 : item_product.moq,
            inventory_quantity  : item_variant.inventory_quantity,
            handle              : item_product.handle,
            title_product       : item_variant.title_product,
            title               : item_product.title,
            image               : item_variant.image,
            brand               : item_product.brand,
            product_type        : item_product.product_type,
            product_category    : item_product.product_category,
            options             : item_variant.options
        };
        if( item_variant.discounts.stock?.apply && item_variant.discounts.stock?.value > 0 && format_front_end.quantity >= item_variant.discounts.stock?.min_stock ){
            format_front_end.additional_discount  = additionalDiscount( format_front_end.additional_discount, format_front_end.total_discount, item_variant.discounts.stock?.value );
            format_front_end.total_discount       = successiveDiscount( format_front_end.total_discount, item_variant.discounts.stock?.value );
        }
        format_front_end.additional_discount  = additionalDiscount( format_front_end.additional_discount, format_front_end.total_discount, format_front_end.discounts.affiliate );
        format_front_end.total_discount       = successiveDiscount( format_front_end.total_discount, format_front_end.discounts.affiliate );
        
        format_front_end.additional_discount  = additionalDiscount( format_front_end.additional_discount, format_front_end.total_discount, format_front_end.discounts.product );
        format_front_end.total_discount       = successiveDiscount( format_front_end.total_discount, format_front_end.discounts.product );
        
        format_front_end.additional_discount  = additionalDiscount( format_front_end.additional_discount, format_front_end.total_discount, format_front_end.discounts.pre_sale );
        format_front_end.total_discount       = successiveDiscount( format_front_end.total_discount, format_front_end.discounts.pre_sale );
        
        format_front_end.discount_price       = currencyObject( calcDiscountPrice( item_variant.price, format_front_end.total_discount, format_front_end.quantity ), false ).number;
        
        return h_response.request( true, { data_base: format_data_base, front_end: format_front_end }, 200, 'Success: Format', 'Format Item Cart Successfuly' );
        
    } catch (format_error) {
        
        return h_response.request( false, format_error, 400, 'Error: Format', 'Format Item Cart, error in fields' );
    }
};
/**
* 
* @param {*} db_products 
* @param {*} valid_discounts 
* @param {*} db_cart_products 
* @param {*} db_save_later 
* @returns 
*/
function cartObject(application_type, add_products, data_cart){
    
    try {
        
        if( data_cart.coupon === null || ( data_cart.coupon != null && ( ( data_cart.coupon.limitTimes > 0 && data_cart.coupon.usedTimes === data_cart.coupon.limitTimes ) || ( data_cart.coupon.expireDate != null && data_cart.coupon.expireDate < new Date() ) ) ) ){
            
            data_cart.coupon = null;
        }
        console.log( data_cart.coupon );
        let fixed_amount        = data_cart.coupon != null && data_cart.coupon.fixedMount && data_cart.coupon.fixedMount != null ? data_cart.coupon.fixedMount : 0;
        let id_variants         = [...new Set( data_cart.db_cart.map( (item) => item.variant_id ).concat( data_cart.db_save_later.map( (item) => item.variant_id ) ) )];
        let format_cart_object  = data_cart.db_products.reduce( (previous_item_product, current_item_product, current_index_product) => {
            
            
            let discount_brand                          = getDiscountBrand( application_type, data_cart.brand_discounts, current_item_product.brand?.handle );
            current_item_product.discounts.brand        = discount_brand ? discount_brand.value : null;
            current_item_product.discounts.affiliate    = data_cart.affiliate.discount;
            current_item_product.discounts.product      = 0; // data_cart.storefront.discount;
            current_item_product.discounts.pre_sale     = current_item_product.config_pre_sale ? current_item_product.config_pre_sale.discount : 0;
            current_item_product.discounts.pre_sale     = current_item_product.config_bundle && current_item_product.config_bundle.config_pre_sale ? current_item_product.config_bundle.config_pre_sale.discount : current_item_product.discounts.pre_sale;
            
            if( current_item_product.discounts.brand != null ){
                
                let discount_stock  = {
                    cart        : {
                        apply           : false,
                        acum_quantity   : 0,
                        min_stock       : 0
                    },
                    save_later  : {
                        apply           : false,
                        acum_quantity   : 0,
                        min_stock       : 0
                    }
                };
                let valid_moq       = {
                    cart        : {
                        moq     : 0,
                        quantity: 0
                    },
                    save_later  : {
                        moq     : 0,
                        quantity: 0
                    }
                };
                let format_items    = current_item_product.variants.reduce( (previous_item_variant, current_item_variant) => {
                    
                    if( ( ( current_item_variant.inventory_policy === 'deny' && current_item_variant.inventory_quantity > 0 ) || ( current_item_variant.inventory_policy === 'continue' ) ) && id_variants.indexOf( current_item_variant.shopify_id ) >= 0 ){
                        
                        let cart_item       = data_cart.db_cart.find( (item) => item.variant_id === current_item_variant.shopify_id );
                        let save_later_item = data_cart.db_save_later.find( (item) => item.variant_id === current_item_variant.shopify_id );
                        
                        if( cart_item ){

                            let valid_cart_item = validCartItem( add_products, current_item_product, {...current_item_variant}, cart_item, discount_stock, valid_moq, previous_item_product.update_product_cart );
                            
                            previous_item_product.update_product_cart = valid_cart_item.update_product_cart;
                            valid_moq = valid_cart_item.valid_moq;
                            discount_stock = valid_cart_item.discount_stock;
                            previous_item_variant.cart.push( { product: current_item_product, variant: valid_cart_item.db_variant } );
                        }
                        if( save_later_item ){
                            
                            let valid_cart_item = validCartItem( add_products, current_item_product, {...current_item_variant}, save_later_item, discount_stock, valid_moq, previous_item_product.update_product_cart );
                            
                            previous_item_product.update_product_cart = valid_cart_item.update_product_cart;
                            valid_moq = valid_cart_item.valid_moq;
                            discount_stock = valid_cart_item.discount_stock;
                            previous_item_variant.save_later.push( { product: current_item_product, variant: valid_cart_item.db_variant } );
                        }
                    }
                    return previous_item_variant;
                }, { cart: [], save_later: [] } );
                
                let format_cart_products         = format_items.cart.reduce( (previous_item, current_item) => {
                    
                    if( valid_moq.cart.quantity >= valid_moq.cart.moq ){
                        
                        current_item.variant.discounts.stock.apply = discount_stock.cart.apply;
                        let format_cart_item = cartItemsObject( current_item.product, current_item.variant );
                        if( format_cart_item.success ) {
                            
                            if( data_cart.coupon != null ){
                                
                                let apply_coupon = applyCouponDiscount( data_cart.coupon, format_cart_item.body.front_end, previous_item_product.fixed_amount );
                                
                                format_cart_item.body.front_end = apply_coupon.format;
                                if( apply_coupon.fixed_amount > 0 ){
                                    
                                    previous_item_product.fixed_amount -= apply_coupon.fixed_amount;
                                }
                                else{
                                    
                                    previous_item_product.fixed_amount = 0;
                                }
                            }
                            let price_pre_coupon    = currencyObject( calcDiscountPrice(format_cart_item.body.front_end.price, format_cart_item.body.front_end.total_discount, format_cart_item.body.front_end.quantity) * parseInt(format_cart_item.body.front_end.quantity), false ).number;
                            previous_item_product.cart.details.subtotal  += price_pre_coupon;
                            
                            if( format_cart_item.body.front_end.discounts.coupon.fixed > 0 ){
                                
                                previous_item_product.cart.details.discount_coupon.fixed_amount += format_cart_item.body.front_end.discounts.coupon.fixed;
                                previous_item_product.cart.details.subtotal_coupon              += format_cart_item.body.front_end.discounts.coupon.fixed;
                            }
                            else if( format_cart_item.body.front_end.discounts.coupon.percentage.value > 0 ){
                                
                                previous_item_product.cart.details.discount_coupon.percentage_amount    += price_pre_coupon - currencyObject( calcDiscountPrice(format_cart_item.body.front_end.discounts.coupon.percentage.amount, 0, format_cart_item.body.front_end.quantity) * parseInt(format_cart_item.body.front_end.quantity), false ).number;
                                previous_item_product.cart.details.subtotal_coupon                      += price_pre_coupon - currencyObject( calcDiscountPrice(format_cart_item.body.front_end.discounts.coupon.percentage.amount, 0, format_cart_item.body.front_end.quantity) * parseInt(format_cart_item.body.front_end.quantity), false ).number;
                            }
                            previous_item_product.cart.details.total    += price_pre_coupon;
                            previous_item_product.cart.details.count    += format_cart_item.body.front_end.quantity;
                            
                            previous_item.front_end.push( format_cart_item.body.front_end );
                            previous_item.data_base.push( format_cart_item.body.data_base );
                        }
                    }
                    else if( valid_moq.cart.quantity < valid_moq.cart.moq ){
                        
                        previous_item_product.update_product_cart = previous_item_product.update_product_cart.filter( (item) => item.sku != current_item.variant.sku );
                        previous_item_product.update_product_cart.push({ 
                            origin      : 'cart',
                            num_ref     : current_item.product.sku_parent ? current_item.product.sku_parent.num_ref : null, 
                            brand       : current_item.product.brand,
                            sku         : current_item.variant.sku, 
                            image       : current_item.variant.image, 
                            quantity    : current_item.variant.quantity,
                            status      : 'cart-delete-moq' 
                        });
                    }
                    return previous_item;
                }, { data_base: [], front_end: [] } );
                let format_save_later_products   = format_items.save_later.reduce( (previous_item, current_item) => {
                    
                    if( valid_moq.save_later.quantity >= valid_moq.save_later.moq ){
                        
                        current_item.variant.discounts.stock.apply = discount_stock.save_later.apply;
                        let format_cart_item = cartItemsObject( current_item.product, current_item.variant );
                        if( format_cart_item.success ) {
                            
                            previous_item_product.save_later.details.count       += format_cart_item.body.front_end.quantity;
                            previous_item_product.save_later.details.subtotal    += currencyObject( format_cart_item.body.front_end.discount_price * parseInt( format_cart_item.body.front_end.quantity ), false ).number;
                            
                            previous_item.front_end.push( format_cart_item.body.front_end );
                            previous_item.data_base.push( format_cart_item.body.data_base );
                        }
                    }
                    else if( valid_moq.save_later.quantity < valid_moq.save_later.moq ){
                        
                        previous_item_product.update_product_cart = previous_item_product.update_product_cart.filter( (item) => item.sku != current_item.variant.sku );
                        previous_item_product.update_product_cart.push({ 
                            origin      : 'save-later',
                            num_ref     : current_item.product.sku_parent ? current_item.product.sku_parent.num_ref : null, 
                            brand       : current_item.product.brand,
                            sku         : current_item.variant.sku, 
                            image       : current_item.variant.image, 
                            quantity    : current_item.variant.quantity,
                            status      : 'cart-delete-moq' 
                        });
                    }
                    return previous_item;
                }, { data_base: [], front_end: [] } );
                
                previous_item_product.cart.products.data_base.push( format_cart_products.data_base );
                previous_item_product.cart.products.front_end.push( format_cart_products.front_end );
                
                previous_item_product.save_later.products.data_base.push( format_save_later_products.data_base );
                previous_item_product.save_later.products.front_end.push( format_save_later_products.front_end );
                
                if( current_index_product === data_cart.db_products.length - 1 ){
                    
                    previous_item_product.cart.products.data_base           = previous_item_product.cart.products.data_base.flat();
                    previous_item_product.cart.products.front_end           = previous_item_product.cart.products.front_end.flat();
                    
                    previous_item_product.save_later.products.data_base     = previous_item_product.save_later.products.data_base.flat();
                    previous_item_product.save_later.products.front_end     = previous_item_product.save_later.products.front_end.flat();
                }
            }
            return previous_item_product;
        }, { 
            cart                : {
                products: { 
                    data_base   : [], 
                    front_end   : [] 
                },
                details : { 
                    count           : 0, 
                    subtotal        : 0, 
                    subtotal_coupon : 0, 
                    total           : 0,
                    discount_coupon : { 
                        fixed_amount        : 0, 
                        percentage_amount   : 0 
                    } 
                }
            }, 
            save_later          : { 
                products: { 
                    data_base   : [], 
                    front_end   : [] 
                },
                details:{ 
                    count           : 0, 
                    subtotal        : 0, 
                    subtotal_coupon : 0, 
                    total           : 0,
                    discount_coupon : { 
                        fixed_amount        : 0, 
                        percentage_amount   : 0 
                    } 
                }
            }, 
            coupon              : data_cart.coupon, 
            fixed_amount        : fixed_amount,
            update_product_cart : []
        });
        
        return h_response.request( true, format_cart_object , 200, 'Success: Cart find', '' );
    } catch (format_error) {
        
        return h_response.request( false, format_error, 400, 'Error: Format', 'Format Cart Items, error in fields' );
    }
};
/**
* 
* @param {*} coupon 
* @param {*} format_data_base 
* @param {*} format_view 
* @param {*} fixed_amount 
* @returns 
*/
function applyCouponDiscount( coupon, format_item_cart, fixed_amount ){
    
    let valid_coupon_product    = ( coupon.applyEligibility.type === 'specific_product' && coupon.applyEligibility.product.some( (item) => item.sku === format_item_cart.sku ) );
    let valid_coupon_brand      = ( ['all_brand', 'specific_brand'].indexOf( coupon.applyEligibility.type ) >= 0 && coupon.applyEligibility.brand.some( (item) => item.name === format_item_cart.brand.name ) );
    let total_discount_price    = h_validation.evalFloat( format_item_cart.discount_price ) * h_validation.evalInt( format_item_cart.quantity );
    
    if( coupon.typeCoupon === 'percentage' && ( valid_coupon_brand || valid_coupon_product ) ){
        
        format_item_cart.discounts.coupon.percentage.value  = coupon.discount;
        format_item_cart.discounts.coupon.percentage.amount = ( format_item_cart.discount_price * ( format_item_cart.discounts.coupon.percentage.value / 100 ) );
        format_item_cart.discounts.coupon.percentage.price  = format_item_cart.discount_price - ( format_item_cart.discount_price * ( format_item_cart.discounts.coupon.percentage.value / 100 ) );
        format_item_cart.discount_type                      = 'percentage';
    }
    else if( coupon.typeCoupon === 'fixed amount' && valid_coupon_product && fixed_amount >= total_discount_price ){
        
        format_item_cart.discounts.fixed    = total_discount_price;
        format_item_cart.discount_type      = 'mixed_amount';
        
        fixed_amount                        = total_discount_price;
    }
    else if( coupon.typeCoupon === 'fixed amount' && valid_coupon_product && fixed_amount > 0 && fixed_amount < total_discount_price ){
        
        format_item_cart.discounts.fixed    = fixed_amount;
        format_item_cart.discount_type      = 'mixed_amount';

        fixed_amount                        = 0;
    }
    return { format: format_item_cart, fixed_amount: fixed_amount };
};
function validCartItem( add_products, db_product, db_variant, cart_item, discount_stock, valid_moq, update_product_cart ){
    
    let max_stock           = db_product.sales_limit > 0 ? db_product.sales_limit : db_product.max_stock;
    let inventory_variant   = max_stock > 0 && db_variant.inventory_quantity > 0 && max_stock < db_variant.inventory_quantity ? max_stock : db_variant.inventory_quantity;
    
    let cart_quantity       = inventory_variant >= cart_item.quantity ? cart_item.quantity : inventory_variant;
    let format_origin       = cart_item.origin.replace(/-/g, '_').toLowerCase();   
    
    if( db_product.moq > 0 ){
        
        valid_moq[format_origin].moq      = db_product.moq;
        valid_moq[format_origin].quantity += cart_quantity;
    }
    if( db_variant.discounts.stock.value > 0 ){
        
        discount_stock[format_origin].min_stock       = discount_stock[format_origin].min_stock < db_variant.discounts.stock.min_stock ? db_variant.discounts.stock.min_stock : discount_stock[format_origin].min_stock;
        discount_stock[format_origin].acum_quantity   += cart_quantity;
        discount_stock[format_origin].apply           = discount_stock[format_origin].acum_quantity >= discount_stock[format_origin].min_stock;
    }
    db_variant.inventory_quantity = inventory_variant;
    update_product_cart = notificationCart( update_product_cart, add_products, db_product, db_variant, cart_item );
    if( db_variant.inventory_variant <= cart_item.quantity ){
        
        db_variant.quantity = db_variant.inventory_variant;
    }
    else{
        
        db_variant.quantity = cart_item.quantity;
    }
    db_variant.origin   = cart_item.origin;
    return { db_variant: db_variant, discount_stock: discount_stock, valid_moq: valid_moq, update_product_cart: update_product_cart };
}
function notificationCart(update_product_cart, add_products, db_product, db_variant, cart_item){
    
    let new_item = add_products.find( (item) => item.variant_id === db_variant.shopify_id && item.origin === cart_item.origin );
    if( new_item ){
        
        let new_update_product = { 
            origin  : cart_item.origin,
            num_ref : db_product.sku_parent?.num_ref || null, 
            brand   : db_product.brand,
            sku     : db_variant.sku, 
            image   : db_variant.image, 
            quantity: 0, 
            status  : null 
        };
        if( db_variant.inventory_variant < cart_item.quantity ){
            
            if( cart_item.quantity - new_item.quantity === db_variant.inventory_variant ){
                
                new_update_product.quantity = db_variant.inventory_variant - cart_item.quantity;
                new_update_product.status   = 'max-stock';
            }
            else if( cart_item.quantity - new_item.quantity < db_variant.inventory_variant ){
                
                new_update_product.quantity = ( new_item.quantity - ( cart_item.quantity - db_variant.inventory_variant ) );
                new_update_product.status   = 'partial-add';
            }
        }
        else {
            
            new_update_product.quantity = new_item.quantity;
            new_update_product.status   = 'full-add';
        } 
        update_product_cart.push( new_update_product );
    }
    else if( db_variant.inventory_variant <= cart_item.quantity ){
        
        update_product_cart.push({ 
            origin      : cart_item.origin,
            num_ref     : db_product.sku_parent?.num_ref || null, 
            brand       : db_product.brand,
            sku         : db_variant.sku, 
            image       : db_variant.image, 
            quantity    : db_variant.inventory_variant,
            old_quantity: cart_item.quantity, 
            status      : 'cart-update' 
        });
        cart_item.quantity = db_variant.inventory_variant;
    }
    return update_product_cart;
}
/**
* 
* @param {*} db_products 
* @param {*} db_save_later 
* @param {*} action 
* @param {*} array_products 
* @returns 
*/
function actionsCart(db_cart, db_save_later, action, array_products){
    
    for (const item_product of array_products.filter( (item) => item.quantity > 0 )) {
        
        let index_product_cart  = db_cart.findIndex( (item) => item.variant_id === item_product.variant_id );
        
        let index_product_later = action.indexOf('save-later') > 0 ? db_save_later.findIndex( (item) => item.variant_id === item_product.variant_id ) : null;
        
        if( index_product_cart >= 0 ){
            
            let update_cart = actionExistCartProduct(index_product_cart, index_product_later, item_product, action, db_cart, db_save_later);
            
            db_cart = update_cart.db_cart;
            db_save_later = update_cart.db_save_later;
        }
        if( index_product_later >= 0 ){
            
            let update_cart = actionExistSaveLaterProduct(index_product_later, item_product, action, db_cart, db_save_later);
            
            db_cart = update_cart.db_cart;
            db_save_later = update_cart.db_save_later;
        }
        if( action === 'add-products-cart' ) {
            
            db_cart.push( item_product );
        }
    }
    return { db_cart: db_cart, db_save_later: db_save_later };
};
/**
* 
* @param {*} index_product_cart 
* @param {*} action 
* @param {*} db_products 
* @param {*} db_save_later 
* @returns 
*/
function actionExistCartProduct(index_product_cart, index_product_later, item_product, action, db_cart, db_save_later){
    
    if( ['add-products-cart', 'update-products-cart'].includes(action) ){
        
        db_cart[index_product_cart].quantity = action === 'add-products-cart' ? db_cart[index_product_cart].quantity + item_product.quantity : item_product.quantity;
    }
    else if( ['remove-products-cart', 'add-products-save-later'].includes(action) && ( index_product_later === null || index_product_later < 0 ) ){
        
        if( action.indexOf('save-later') >= 0 ){
            
            db_save_later.push( db_cart[index_product_cart] );
            db_save_later[db_save_later.length - 1].origin = 'save-later';
        }
        db_cart.splice( index_product_cart, 1 );
    }
    else if( action === 'add-products-save-later' && index_product_later >= 0 ){
        
        db_save_later[index_product_later].quantity += db_cart[index_product_cart].quantity;
        db_cart.splice( index_product_cart, 1 );
    }
    else if( action === 'remove-products-save-later' && index_product_later >= 0 ){
        
        db_cart[index_product_cart].quantity += db_save_later[index_product_later].quantity;
        db_save_later.splice( index_product_later, 1 );
    }
    return { db_cart: db_cart, db_save_later: db_save_later };
};
/**
* 
* @param {*} index_product_cart 
* @param {*} index_product_later 
* @param {*} item_product 
* @param {*} action 
* @param {*} db_products 
* @param {*} db_save_later 
*/
function actionExistSaveLaterProduct(index_product_later, item_product, action, db_cart, db_save_later){
    
    if( action === 'delete-products-save-later' ){
        
        db_save_later.splice( index_product_later, 1 );
    }
    else if( action === 'update-products-save-later' ){
        
        db_save_later[index_product_later].quantity = item_product.quantity;
    }
    else if( action === 'remove-products-save-later' ){
        
        db_cart.push( db_save_later[index_product_later] );
        db_cart[db_cart.length - 1].origin = 'cart';
        db_save_later.splice( index_product_later, 1 );
    }
    return { db_cart: db_cart, db_save_later: db_save_later };
};
/**
* 
* @param {*} line_item 
* @param {*} item_order 
* @param {*} new_document 
* @returns 
*/
function lineItemObject(line_item, item_order, new_document = false){
    
    let refunded_item       = item_order.refunds != null ? item_order.refunds.find( (item) => item.refund_line_items.find( (item_refund) => item_refund.line_item_id === line_item.id ) ) : undefined;
    let refund_line_item    = refunded_item ? refunded_item.refund_line_items.find( (item_refund) => item_refund.line_item_id === line_item.id ) : undefined;
    
    let format_document = {
        sku                             : line_item.sku,
        name                            : line_item.name, 
        title                           : line_item.title, 
        variant_title                   : line_item.variant_title,
        brand                           : line_item.vendor, 
        quantity                        : h_validation.evalInt( line_item.quantity ), 
        price                           : h_validation.evalFloat( line_item.price ), 
        total_discount                  : h_validation.evalFloat( line_item.total_discount ), 
        discounts                       : line_item.discount_allocations === null ? [] : line_item.discount_allocations.reduce( (previous_item, current_item) => {
            
            if( item_order.discount_codes.findIndex( (item) => item.code === item_order.discount_applications[current_item.discount_application_index].title ) < 0 ){
                
                previous_item.push({
                    line_item_id: line_item.id,
                    type: item_order.discount_applications[current_item.discount_application_index].type,
                    value_type: item_order.discount_applications[current_item.discount_application_index].value_type,
                    allocation_method: item_order.discount_applications[current_item.discount_application_index].allocation_method,
                    value: item_order.discount_applications[current_item.discount_application_index].value_type === 'fixed_amount' ?  currencyObject(h_validation.evalFloat( item_order.discount_applications[current_item.discount_application_index].value ) / h_validation.evalInt( line_item.quantity ), false).number : h_validation.evalFloat( item_order.discount_applications[current_item.discount_application_index].value ),
                    amount: h_validation.evalFloat( current_item.amount )
                });
            }
            return previous_item;
        }, []),
        tax_lines                       : line_item.tax_lines === null ? null : line_item.tax_lines.map( (item_tax) => {
            return {
                price   : h_validation.evalFloat( item_tax.price ),
                rate    : h_validation.evalFloat( item_tax.rate ),
                title   : item_tax.title
            }
        }), 
        total_taxes                     : line_item.tax_lines === null ? 0 : line_item.tax_lines.reduce( (previous_item, current_item) => {
            
            previous_item += current_item.price;
            return previous_item;
        }, 0),
        fulfillable_quantity            : h_validation.evalInt( line_item.fulfillable_quantity ), 
        fulfillment_service             : line_item.fulfillment_service, 
        fulfillment_status              : line_item.fulfillment_status, 
        financial_status                : item_order.financial_status,
        refunded                        : refunded_item && refund_line_item ? { 
            shopify_id: refunded_item.id, 
            line_item_id: refund_line_item.line_item_id, 
            quantity: refund_line_item.quantity 
        } : null,
        gift_card                       : line_item.gift_card, 
        grams                           : h_validation.evalInt( line_item.grams ), 
        origin_location                 : line_item.origin_location === null ? null : {
            shopify_id      : line_item.origin_location.id, 
            country_code    : line_item.origin_location.country_code, 
            state_code      : line_item.origin_location.province_code, 
            name            : h_validation.evalString(line_item.origin_location.name), 
            address_1       : h_validation.evalString(line_item.origin_location.address1), 
            address_2       : h_validation.evalString(line_item.origin_location.address2), 
            city            : h_validation.evalString(line_item.origin_location.city), 
            zip             : line_item.origin_location.zip
        }, 
        product_exists                  : line_item.product_exists, 
        requires_shipping               : line_item.requires_shipping,  
        taxable                         : line_item.taxable,  
        variant_inventory_management    : line_item.variant_inventory_management,  
        updated_at                      : shopifyDate( item_order.updated_at )
    }
    if( new_document ){
        
        format_document.order_id    = item_order.id;
        format_document.customer_id = item_order.customer === null ? null : item_order.customer.id;
        format_document.shopify_id  = line_item.id;
        format_document.product_id  = line_item.product_id;
        format_document.variant_id  = line_item.variant_id;
        format_document.created_at  = shopifyDate( item_order.created_at );
    }
    else{
        
        format_document = { query: { shopify_id: line_item.id, order_id: item_order.id }, document: format_document };
    }
    return format_document;
};
/**
* 
* @param {*} data_transaction 
* @param {*} order 
* @param {*} db_transaction 
* @param {*} new_document 
* @returns 
*/
function transactionObject( data_transaction, order, db_transaction = null, new_document = false ){
    
    let total_order         = item_order?.line_item ? currencyObject( ( item_order.line_item.price * item_order.line_item.quantity ), false ).number : 0;
    let total_commission    = 0;
    let total_store_fee     = 0;
    let general_details     = null;
    
    if( data_transaction.category === 'item-order-storefront' && data_transaction?.storefront && item_order?.line_item ){
        total_commission = currencyObject( calcDiscountPrice( ( total_order - item_order.line_item.total_discount ), 100 - data_transaction.storefront.commission, 1 ), false ).number;
        total_store_fee = currencyObject( calcDiscountPrice( total_order, 100 - data_transaction.storefront.store_fee, 1 ), false ).number;
    }
    else if( data_transaction.category === 'item-order-affiliate' && data_transaction?.affiliate && item_order?.line_item ){
        
        total_commission = currencyObject( calcDiscountPrice( ( total_order - item_order.line_item.total_discount ), 100 - data_transaction.affiliate.commission, 1 ), false ).number;
        total_store_fee = currencyObject( calcDiscountPrice( total_order, 100 - data_transaction.affiliate.store_fee, 1 ), false ).number;
    }
    if( !['item-order-storefront', 'item-order-affiliate'].includes( data_transaction.category ) ){
        
        if( ['closing-month-storefront', 'storefront-adjustment'].includes( data_transaction.category ) && data_transaction?.storefront ){
            
            general_details = data_transaction.storefront.general_details;
        }
        else if( ['closing-month-affiliate', 'affiliate-adjustment'].includes( data_transaction.category ) && data_transaction?.affiliate ){
            
            general_details = data_transaction.affiliate.general_details;
        }
    }
    let format_document = { 
        line_item_details   : item_order?.line_item ? {
            brand           : item_order?.brand ? item_order.brand._id : null,
            quantity        : item_order.line_item.quantity,
            total_order     : total_order,
            total_discount  : item_order.line_item.total_discount,
            total_taxes     : item_order.line_item.total_taxes,
            total_commission: total_commission,
            total_store_fee : total_store_fee,
            created_at      : item_order.line_item.created_at
        } : null,
        refund_details      : item_order.refunds.reduce( (previous_item_refund, current_item_refund) => {
            
            current_item_refund.refund_line_items.map( (refund_item) => {
                
                let refund_discount     = 0;
                let refund_taxes        = 0;
                let refund_order        = 0;
                let refund_commission   = 0;
                let refund_store_fee    = 0;
                if( refund_item.line_item_id === item_order.line_item.shopify_id ){
                    
                    refund_order = currencyObject( ( item_order.line_item.price * refund_item.quantity ), false ).number;
                    if( item_order.line_item.discounts.length > 0 ){
                        
                        let discount = item_order.line_item.discounts.find( (item) => item.value_type === 'percentage' );
                        if( discount ){
                            
                            refund_discount = currencyObject( calcDiscountPrice( item_order.line_item.price, discount.value, item_order.line_item.quantity ) * refund_item.quantity, false ).number;
                        }
                        else{
                            discount = item_order.line_item.discounts.find( (item) => item.value_type === 'fixed_amount' );
                            if( discount ){
                                
                                refund_discount = currencyObject( ( currencyObject( ( discount.amount / item_order.line_item.quantity ), false ).number * refund_item.quantity ), false ).number
                            }
                            else{
                                refund_discount = 0;
                            }
                        }
                    }
                    else{
                        
                        refund_discount = 0;
                    }
                    refund_taxes = currencyObject( ( item_order.line_item.total_taxes / item_order.line_item.quantity ) * refund_item.quantity, false ).number;
                    
                    if( data_transaction.category === 'item-order-storefront' && data_transaction?.storefront && item_order?.line_item ){
                        refund_commission = currencyObject( calcDiscountPrice( ( refund_order - refund_discount ), 100 - data_transaction.storefront.commission, 1 ), false ).number;
                        refund_store_fee = currencyObject( calcDiscountPrice( refund_order, 100 - data_transaction.storefront.store_fee, 1 ), false ).number;
                    }
                    else if( data_transaction.category === 'item-order-affiliate' && data_transaction?.affiliate && item_order?.line_item ){
                        
                        refund_commission = currencyObject( calcDiscountPrice( ( refund_order - refund_discount ), 100 - data_transaction.affiliate.commission, 1 ), false ).number;
                        refund_store_fee = currencyObject( calcDiscountPrice( refund_order, 100 - data_transaction.affiliate.store_fee, 1 ), false ).number;
                    }
                    previous_item_refund.push({
                        brand           : item_order?.brand ? item_order.brand._id : null,
                        quantity        : refund_item.quantity,
                        total_refund    : refund_order,
                        total_discount  : refund_discount,
                        total_taxes     : refund_taxes,
                        total_commission: refund_commission,
                        total_store_fee : refund_store_fee,
                        created_at      : current_item_refund.created_at
                    });
                }
                return refund_item;
            });
            current_item_refund.order_adjustments.map( (refund_item) => {
                
                previous_item_refund.push({
                    brand           : null,
                    quantity        : 0,
                    total_refund    : refund_item.amount,
                    total_discount  : 0,
                    total_taxes     : 0,
                    total_commission: 0,
                    total_store_fee : 0,
                    created_at      : current_item_refund.created_at
                });
                return refund_item;
            });
            return previous_item_refund;
        }, []),
        shipping_details    : order ? {
            total_shipping  : item_order.total_shipping_price,
            total_discount  : 0,
            total_taxes     : 0,
            total_commission: 0,
            total_store_fee : 0,
            created_at      : item_order.created_at
        } : null,
        general_details     : general_details ? {
            total_amount    : general_details.total_amount,
            total_order     : general_details.total_order,
            total_refund    : general_details.total_refund,
            total_shipping  : general_details.total_shipping,
            total_discount  : general_details.total_discount,
            total_taxes     : general_details.total_taxes,
            total_commission: general_details.total_commission,
            total_store_fee : general_details.total_store_fee,
            created_at      : general_details.created_at
        } : null,
        updated_at          : order ? shopifyDate(item_order.updated_at) : new Date(),
    }
    if( new_document ){
        
        format_document.marketplace     = data_transaction?.marketplace ? data_transaction.marketplace      : null;
        format_document.storefront      = data_transaction?.storefront  ? data_transaction.storefront       : null;
        format_document.affiliate       = data_transaction?.affiliate   ? data_transaction.affiliate        : null;
        format_document.customer_id     = customer                      ? customer.shopify_id               : null;
        format_document.order_id        = order                         ? item_order.shopify_id                  : null;
        format_document.line_item_id    = line_item                     ? line_item.shopify_id              : null;
        format_document.category        = data_transaction.category;
        format_document.created_at      = order                         ? shopifyDate( item_order.created_at )   : new Date();
    }
    else{
        
        format_document = { 
            query: { 
                marketplace : db_transaction.marketplace._id, 
                storefront  : db_transaction.storefront._id,
                category    : data_transaction.category,
                order_id    : db_transaction.order_id,
                created_at  : db_transaction.created_at
            }, 
            document: format_document 
        };
    }
    return format_document;
};
/**
* 
* @param {*} item_order 
* @param {*} db_line_items 
* @param {*} new_document 
* @returns 
*/
function orderObject(item_order, order_coupon, db_line_items = [], all_businesses = [], new_document = false){
    
    let format_document = {
        token                   : item_order.token,
        taxes_included          : item_order.taxes_included,
        tax_lines               : item_order.tax_lines === null ? null : item_order.tax_lines.map( (item_tax) => {
            return {
                price: h_validation.evalFloat( item_tax.price ),
                rate: h_validation.evalFloat( item_tax.rate ),
                title: h_validation.evalString(item_tax.title)
            }
        }),
        subtotal_price          : h_validation.evalFloat( item_order.subtotal_price ),
        total_discounts         : h_validation.evalFloat( item_order.total_discounts ),
        total_line_items_price  : h_validation.evalFloat( item_order.total_line_items_price ),
        total_outstanding       : h_validation.evalFloat( item_order.total_outstanding ),
        total_price             : h_validation.evalFloat( item_order.total_price ),
        total_tax               : h_validation.evalFloat( item_order.total_tax ),
        checkout_id             : item_order.checkout_id,
        checkout_token          : item_order.checkout_token,
        total_weight            : h_validation.evalFloat( item_order.total_weight ),
        shipping_lines          : item_order.shipping_lines === null ? null : item_order.shipping_lines.map( (item) => {
            return {
                code: h_validation.evalString(item.code),
                discounted_price: h_validation.evalFloat( item.discounted_price ),
                price: h_validation.evalFloat( item.price ),
                source: h_validation.evalString(item.source),
                title: h_validation.evalString(item.title),
                tax_lines: item.tax_lines === null ? null : item.tax_lines.map( (item_tax) => {
                    return {
                        price: h_validation.evalFloat( item_tax.price ),
                        rate: h_validation.evalFloat( item.rate ),
                        title: h_validation.evalString(item.title)
                    }
                }),
                carrier_identifier: item.carrier_identifier,
                requested_fulfillment_service_id: item.requested_fulfillment_service_id
            }
        }),
        subtotal_shipping_price : h_validation.evalFloat( item_order.total_shipping_price_set === null ? 0 : h_validation.evalFloat( item_order.total_shipping_price_set.shop_money.amount ) ),
        total_shipping_price    : 0,
        fulfillments            : item_order.fulfillments === null ? [] : item_order.fulfillments.map( (item) => {
            return {
                shopify_id              : item.id,
                location_id             : item.location_id,
                name                    : item.name,
                service                 : item.service, 
                shipment_status         : item.shipment_status, 
                history_shipment_status : [{ status: item.shipment_status, updated_at: item.updated_at === null ? null : shopifyDate( item.updated_at ) }],
                fulfillment_status      : item.status, 
                tracking_company        : h_validation.evalString(item.tracking_company), 
                tracking_number         : item.tracking_number, 
                tracking_numbers        : item.tracking_numbers, 
                tracking_url            : item.tracking_url, 
                tracking_urls           : item.tracking_urls, 
                line_items              : item.line_items === null ? null : item.line_items.map( (item_l) => item_l.id ),
                created_at              : item.created_at === null ? null : shopifyDate( item.created_at ), 
                updated_at              : item.updated_at === null ? null : shopifyDate( item.updated_at ), 
            }
        }),
        refunds                 : item_order.refunds === null ? null : item_order.refunds.map( (item) => {
            return {
                shopify_id          : item.id,
                note                : h_validation.evalString(item.note),
                restock             : item.restock,
                total_duties        : h_validation.evalFloat( item.total_duties_set && item.total_duties_set.shop_money ? item.total_duties_set.shop_money.amount : 0 ),
                order_adjustments   : item.order_adjustments.map( (item_ad) => {
                    return {
                        shopify_id: item_ad.id,
                        amount: h_validation.evalFloat( item_ad.amount ),
                        tax_amount: h_validation.evalFloat( item_ad.tax_amount ),
                        kind: item_ad.kind,
                        reason: item_ad.reason
                    }
                }),
                transactions        : item.transactions.map( (item_t) => {
                    return {
                        shopify_id          : item_t.id,
                        amount              : h_validation.evalFloat( item_t.amount ),
                        autorization        : item_t.autorization,
                        device_id           : item_t.device_id,
                        error_code          : item_t.error_code,
                        gateway             : item_t.gateway,
                        kind                : item_t.kind,
                        localtion_id        : item_t.location_id,
                        message             : item_t.message,
                        source_name         : item_t.source_name,
                        transaction_status  : item_t.status,
                        created_at          : item_t.created_at === null ? null : shopifyDate( item_t.created_at ),
                        processed_at        : item_t.processed_at === null ? null : shopifyDate( item_t.processed_at )
                    }
                }),
                refund_line_items   : item.refund_line_items.map( (item_r) => {
                    return {
                        shopify_id: item_r.id,
                        localtion_id: item_r.localtion_id,
                        line_item_id: item_r.line_item_id,
                        quantity: item_r.quantity,
                        restock_type: item_r.restock_type,
                        subtotal: h_validation.evalFloat( item_r.subtotal ),
                        total_taxes: h_validation.evalFloat( item_r.total_tax )
                    }
                })
            }
        }),
        discounts               : db_line_items ? [].concat.apply([], [...db_line_items.discounts] ) : [],
        cancel_reason           : item_order.cancel_reason,
        note                    : h_validation.evalString(item_order.note),
        note_attributes         : item_order.note_attributes,
        financial_status        : item_order.financial_status,
        fulfillment_status      : item_order.fulfillment_status,
        order_status_url        : item_order.order_status_url,
        currency                : item_order.currency,
        
        updated_at              : item_order.updated_at === null ? null : shopifyDate( item_order.updated_at ), 
        processed_at            : item_order.processed_at === null ? null : shopifyDate( item_order.processed_at ),
        closed_at               : item_order.closed_at === null ? null : shopifyDate( item_order.closed_at ),
        cancelled_at            : item_order.cancelled_at === null ? null : shopifyDate( item_order.cancelled_at )
    };
    format_document.discounts = item_order.discount_applications.reduce( (previous_item, current_item) => {
        
        if(  item_order.discount_codes.find( (item) => item.code === current_item.title ) && current_item.target_selection === 'all' ){
            
            previous_item.push({
                line_item_id: null,
                type: 'discount_code',
                value_type: current_item.value_type,
                allocation_method: current_item.allocation_method,
                value: h_validation.evalFloat( current_item.value ),
                amount: h_validation.evalFloat( current_item.value )
            });
        }
        return previous_item;
    }, format_document.discounts);
    
    format_document.total_shipping_price = format_document.shipping_lines != null ? format_document.shipping_lines.reduce( (previous_item, current_item) => {
        
        previous_item += current_item.discounted_price;
        return previous_item;
    }, 0) : 0;
    
    if( new_document ){
        
        format_document.shopify_id              = item_order.id;
        format_document.origin                  = item_order.tags.indexOf('ISDROPSHIPPING') >= 0 ? 'dropshipping' : 'wholesale-shop';
        format_document.tags                    = item_order.tags.split(', '),
        format_document.name                    = item_order.name;
        format_document.number                  = item_order.number;
        format_document.order_number            = item_order.order_number;
        format_document.coupon                  = order_coupon;
        format_document.billing_address         = item_order.billing_address === null ? null : {
            first_name  : h_validation.evalString(item_order.billing_address.first_name),
            last_name   : h_validation.evalString(item_order.billing_address.last_name),
            phone       : item_order.billing_address.phone,
            company     : h_validation.evalString(item_order.billing_address.company),
            address_1   : h_validation.evalString(item_order.billing_address.address1),
            address_2   : h_validation.evalString(item_order.billing_address.address2),
            country     : h_validation.evalString(item_order.billing_address.country),
            country_code: item_order.billing_address.country_code,
            state       : h_validation.evalString(item_order.billing_address.province),
            state_code  : item_order.billing_address.province_code,
            city        : h_validation.evalString(item_order.billing_address.city),
            zip         : item_order.billing_address.zip,
            latitude    : item_order.billing_address.latitude,
            longitude   : item_order.billing_address.longitude
        };
        format_document.shipping_address        = item_order.shipping_address === null ? null : {
            first_name  : h_validation.evalString(item_order.shipping_address.first_name),
            last_name   : h_validation.evalString(item_order.shipping_address.last_name),
            phone       : item_order.shipping_address.phone,
            company     : h_validation.evalString(item_order.shipping_address.company),
            address_1   : h_validation.evalString(item_order.shipping_address.address1),
            address_2   : h_validation.evalString(item_order.shipping_address.address2),
            country     : h_validation.evalString(item_order.shipping_address.country),
            country_code: item_order.shipping_address.country_code,
            state       : h_validation.evalString(item_order.shipping_address.province),
            state_code  : item_order.shipping_address.province_code,
            city        : h_validation.evalString(item_order.shipping_address.city),
            zip         : item_order.shipping_address.zip,
            latitude    : item_order.shipping_address.latitude,
            longitude   : item_order.shipping_address.longitude
        };
        format_document.line_items              = db_line_items ? db_line_items.ids : [];
        format_document.skus                    = db_line_items ? db_line_items.skus : [];
        format_document.brands                  = db_line_items ? [...new Set( db_line_items.brands )].map( (item) => { return { brand: item } }) : [];
        format_document.variants                = db_line_items ? db_line_items.variants : [];
        format_document.customer                = null;
        format_document.customer_id             = null;
        format_document.business                = all_businesses.find( (item) => item.name === ( db_line_items.skus.some( (item) => item.sku.slice(0, 4) != 'VDL-' ) ? 'PLN DISTRIBUTIONS LLC' : 'VIDA LEATHER LLC' ) )._id;
        format_document.created_at              = item_order.created_at === null ? null : shopifyDate( item_order.created_at );
        format_document.created_invoice         = false;
        format_document.invoice_items           = [];
    }
    else{
        
        format_document = { query: { shopify_id: item_order.id }, document: format_document };
    }
    return format_document;
};
/**
* 
* @param {*} select_filters 
* @param {*} general_filters 
* @param {*} db_products 
* @returns 
*/
function filtersObject(select_filters, general_filters, db_products){
    
    let filter_details  = [];
    let filter_options  = {
        brand           : 'brands',
        product_category: 'product_categories',
        tags            : 'tags',
        options         : 'product_option',
        discount_price  : 'discount_price'
    };
    for (const item_filter of select_filters ) {
        
        let select_filter = general_filters.find( (item) => item._id.toString() === item_filter.toString() );
        if( select_filter && ['brand', 'product_category'].includes( select_filter.field ) ){
            
            select_filter.values = select_filter[ filter_options[select_filter.field] ].reduce( (previous_item, current_item) => {
                
                if( db_products[select_filter.field].includes( current_item.handle ) ){
                    
                    previous_item.push({
                        ...current_item,
                        show    : true,
                        checked : false
                    });
                }
                return previous_item;
            }, []);
            filter_details.push({
                name        : select_filter.name,
                handle      : select_filter.handle,
                field       : select_filter.field,
                values      : select_filter.values,
                translate   : select_filter.translate,
                available   : select_filter.available
            });
        }
        else if( select_filter && select_filter.field === 'tags' ){
            
            select_filter.values = select_filter[ filter_options[select_filter.field] ].reduce( (previous_item, current_item) => {
                
                if( db_products[select_filter.field].includes( current_item.handle ) ){
                    
                    previous_item.push({
                        ...current_item,
                        show    : true,
                        checked : false
                    });
                }
                return previous_item;
            }, []);
            filter_details.push({
                name        : select_filter.name,
                handle      : select_filter.handle,
                field       : select_filter.field,
                values      : select_filter.values,
                translate   : select_filter.translate,
                available   : select_filter.available
            });
        }
        else if( select_filter && select_filter.field === 'options' ){
            
            let option_values       = db_products[select_filter.field].find( (item) => item.handle === select_filter.handle.replace('options-', '') );
            select_filter.values    = select_filter[ filter_options[select_filter.field] ].values.reduce( (previous_item, current_item) => {
                
                if( ( option_values ? option_values.values : [] ).includes( current_item.handle ) ){
                    
                    previous_item.push({
                        ...current_item,
                        show    : true,
                        checked : false
                    });
                }
                return previous_item;
            }, []);
            filter_details.push({
                name        : select_filter.name,
                handle      : select_filter.handle,
                field       : select_filter.field,
                values      : select_filter.values,
                translate   : select_filter.translate,
                available   : select_filter.available
            });
        }
        else if( select_filter && select_filter.field === 'discount_price' ){
            
            select_filter.values = {
                min_price: db_products.discount_price.min_price,
                max_price: db_products.discount_price.max_price
            };
            filter_details.push({
                name        : select_filter.name,
                handle      : select_filter.handle,
                field       : select_filter.field,
                values      : select_filter.values,
                translate   : select_filter.translate,
                available   : select_filter.available
            });
        }
    }
    return filter_details;
};
/**
* 
* @param {*} brands 
* @param {*} products 
* @param {*} date_report 
* @returns 
*/
function fileReportProductsLowStock( brands, products, date_report ){
    
    let object_brand = brands.reduce( (previous_item, current_item) => {
        
        previous_item[current_item.name] = current_item;
        return previous_item;
    }, {});
    
    let data_file = [{
        title: `Shopify Products Low Stock - ${ date_report.format('MM-YYYY') }`,
        max_num_columns: 5,
        sheet_name: `Shopify Products Low Stock - ${ date_report.format('MM-YYYY') }`,
        body_data: [],
        cols: [ { wch: 20 }, { wch: 60 }, { wch: 20 }, { wch: 40 }, { wch: 20 } ]
    }];
    
    products = products.map( (item) => item.variants ).flat();
    
    data_file = products.reduce( (previous_item, current_item) =>{
        
        if( current_item.inventory_quantity <= object_brand[current_item.brand?.name]?.min_stock ){
            
            previous_item[0].body_data.push({ 
                row: { 
                    columns: [
                        { name: 'product_id'      , value: current_item.product_id.toString(),          index_column: 0, num_columns: 1, num_rows: 1 },
                        { name: 'product'         , value: current_item.title_product,                  index_column: 1, num_columns: 1, num_rows: 1 },
                        { name: 'brand'           , value: current_item.brand?.name,                    index_column: 2, num_columns: 1, num_rows: 1 },
                        { name: 'sku'             , value: current_item.sku,                            index_column: 3, num_columns: 1, num_rows: 1 },
                        { name: 'inventory_stock' , value: current_item.inventory_quantity,             index_column: 4, num_columns: 1, num_rows: 1 }
                    ] 
                },
                stock: current_item.inventory_quantity
            });
        }
        return previous_item;
    }, data_file);
    
    data_file[0].body_data = h_array.sort( data_file[0].body_data, 'stock' ).map( (item) =>{ 
        delete item.stock; 
        return item; 
    });
    
    return data_file;
};
/**
 * 
 * @param {*} req_auth 
 * @param {*} code_affiliate 
 * @param {*} affiliateService 
 * @returns 
 */
async function affiliateDiscounts( req_auth, code_affiliate, affiliateService ){
    
    try {
        
        if( code_affiliate && req_auth.storefront != null ){
            
            let affiliate_result = await affiliateService.findOne({ storefront: req_auth.storefront, marketplace: req_auth.marketplace, code: code_affiliate }, { discount: 1 });
            if( affiliate_result.success ){
                
                return h_response.request( true, { discount: h_validation.evalExistField( affiliate_result.body?.discount, 0 ) }, 200, 'Success: Affiliate find', 'Affiliate found' );
            }
            else{
                
                return h_response.request( false, affiliate_result, 400, 'Error: Affiliate find', 'Affiliate not found' );
            }
        }
        else{
            
            return h_response.request( true, { discount: 0 }, 200, 'Success: Affiliate find', 'Affiliate found' );
        }
    } catch (process_error) {
        
        return h_response.request( false, process_error, 400, 'Error: Affiliate find', 'Error in process' );
    }
};
function navigationTreeObject( sub_navigation ){
    sub_navigation = sub_navigation.reduce( (previous_item_nav, current_item_nav) => {
        
        let new_navigation = {
            category            : current_item_nav.navigation_option ? current_item_nav.navigation_option.category              : current_item_nav.category,
            title               : current_item_nav.navigation_option ? current_item_nav.navigation_option.title                 : current_item_nav.title,
            handle              : current_item_nav.navigation_option ? current_item_nav.navigation_option.handle                : current_item_nav.handle,
            url                 : current_item_nav.navigation_option ? current_item_nav.navigation_option.url                   : current_item_nav.url,
            content_media       : current_item_nav.navigation_option ? current_item_nav.navigation_option.content_media         : current_item_nav.content_media,
            icon                : current_item_nav.navigation_option ? current_item_nav.navigation_option.icon                  : current_item_nav.icon,
            custom_style        : current_item_nav.navigation_option ? current_item_nav.navigation_option.custom_style          : current_item_nav.custom_style,
            show                : current_item_nav.navigation_option ? current_item_nav.navigation_option.show                  : current_item_nav.show,
            open_new_tab        : current_item_nav.navigation_option ? current_item_nav.navigation_option.open_new_tab          : current_item_nav.open_new_tab,
            sub_navigation_type : current_item_nav.navigation_option ? current_item_nav.navigation_option.sub_navigation_type   : current_item_nav.sub_navigation_type,
            need_login          : current_item_nav.navigation_option ? current_item_nav.navigation_option.need_login            : current_item_nav.need_login,
            translate           : current_item_nav.navigation_option ? current_item_nav.navigation_option.translate             : current_item_nav.translate
        };
        if( current_item_nav.navigation_option && current_item_nav.sub_navigation.length > 0 ){
            
            new_navigation.sub_navigation = current_item_nav.sub_navigation ? navigationTreeObject( current_item_nav.sub_navigation ) : [];
        }
        previous_item_nav.push(new_navigation);
        return previous_item_nav;
    }, []);
    return sub_navigation;
};
// =============================================================================
// EXPORTS
// =============================================================================
module.exports = {
    findQuery,
    findQueryProducts,
    slug,
    objectValidField,
    shopifyDate,
    dbDate,
    phoneNumber,
    phoneShopify,
    numberString,
    DBDiscountBrands,
    discountOnlyBrands,
    getDiscountBrand,
    currencyObject,
    calcDiscountPrice,
    randomNumber,
    extractSKUParent,
    productObject,
    productCollectionObject,
    customerObject,
    customerAddressObject,
    shopifyAddressObject,
    userObject,
    bestSellerVariantsObject,
    cartItemsObject,
    cartObject,
    applyCouponDiscount,
    actionsCart,
    actionExistCartProduct,
    actionExistSaveLaterProduct,
    lineItemObject,
    orderObject,
    filtersObject,
    fileReportProductsLowStock,
    affiliateDiscounts,
    navigationTreeObject,
    fields: {
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
                    not_equal	: 'not_equal',
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
    }
}