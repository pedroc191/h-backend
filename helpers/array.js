// =============================================================================
// GENERAL FUNCTIONS
// =============================================================================
/**
 * 
 * @param {*} item_object 
 * @param {*} index_key 
 * @returns 
 */
function getProperty(item_object, index_key = 0) {
    const keys = Object.keys(item_object);
    return keys.length > 0 ? item_object[keys[index_key]] : null;
}
/**
 * 
 * @param {*} item_array 
 * @param {*} internal_object 
 * @returns 
 */
function internalItem( item_array, internal_object ){
        
    let internal_item = item_array;
    let internal_object_array = internal_object.split( '.' );
    
    for (const item_data of internal_object_array) {
        if (internal_item === null) {
            internal_item = ''; // Valor predeterminado para null o undefined
            break;
        }
        else{
            internal_item = internal_item[item_data];
        }
    }
    return internal_item
};
/**
* DESCRIPTION: Sort an array of objects
* @param {Array} array Array of objects to be ordered
* @param {String} data_sort Data to order the Array
* @param {Boolean} is_asc Data to order the Array
* @returns
*/
function sort( array, data_sort, is_asc = true ){
    
    if( array.length > 0 && internalItem( array[0], data_sort ) != undefined ){
        
        return array.sort( (item_a, item_b) =>{
            const sort_a = internalItem( item_a, data_sort );
            const sort_b = internalItem( item_b, data_sort );
            if (sort_a === sort_b) {
                return 0;
            }
            if (is_asc) {
    
                return sort_a > sort_b ? 1 : -1;
            } else {
                
                return sort_a < sort_b ? 1 : -1;
            }
        });
    }
    else{
        
        return array;
    }
};
function sortByProperty(array, index_property, is_asc = true) {
    return array.sort((item_a, item_b) => {
        const sort_a = getProperty(item_a, index_property);
        const sort_b = getProperty(item_b, index_property);

        if (sort_a === sort_b) {
            return 0;
        }
        if (is_asc) {

            return sort_a > sort_b ? 1 : -1;
        } else {

            return sort_a < sort_b ? 1 : -1;
        }
    });
}
/**
* 
* @param {*} array_compare 
* @param {*} array_result 
* @param {*} compare_field 
* @returns 
*/
function sortCompare( array_compare, array_result, compare_field ){
    
    let new_result = [];
    if( array_compare.length > 0 ){
        
        for (const item of array_compare) {
            
            let item_result = array_result.find( (item_r) => item_r[compare_field].toString() === item.toString() );
            
            if( item_result ){
                
                new_result.push( item_result );
            }
            if( new_result.length === array_result.length ){
                
                break;
            }
        }
    }
    else{
        
        new_result = array_result;
    }
    return new_result;
};
/**
* 
* @param {*} array_repeat 
* @param {*} compare_field 
* @returns 
*/
function removeRepeat( array_repeat, compare_field ){
    
    return array_repeat.filter( (item, index, self) => index === self.findIndex( (item_compare) => ( internalItem( item_compare, compare_field ) === internalItem( item, compare_field ) ) ) );
};
/**
* 
* @param {*} array_repeat 
* @param {*} compare_field 
* @param {*} group_field 
* @returns 
*/
function groupField( array_group, compare_field, group_fields ){
    
    return array_group.reduce( (previous_item, current_item, current_index, self_array) => {
        
        if( previous_item.length === 0 || ( previous_item.length > 0 && previous_item[previous_item.length - 1][compare_field] != current_item[compare_field] ) ){
            
            if( previous_item.length > 0 && previous_item[previous_item.length - 1][compare_field] != current_item[compare_field] ){
                
                for (const item_field of group_fields) {
                    
                    previous_item[previous_item.length - 1][item_field] = previous_item[previous_item.length - 1][item_field].flat();
                }
            }
            previous_item.push( current_item );
        }
        else if( previous_item.length > 0 && previous_item[previous_item.length - 1][compare_field] === current_item[compare_field] ){
            
            for (const item_field of group_fields) {
                
                previous_item[previous_item.length - 1][item_field].push( current_item[item_field] );
            }
        }
        if( current_index === self_array.length - 1 ){
            
            for (const item_field of group_fields) {
                
                previous_item[previous_item.length - 1][item_field] = previous_item[previous_item.length - 1][item_field].flat();
            }
        }
        return previous_item;
    }, []);
    
};
/**
*
* @param {Array} array_original
* @param {Number} chunk_size
* @returns
*/
function chunk( array_original, chunk_size ){
    
    let results = [];
    while ( array_original.length ) {
        
        results.push( array_original.splice( 0, chunk_size ) );
    }
    return results;
};
// =============================================================================
// EXPORTS
// =============================================================================
module.exports = {
    sort,
    sortByProperty,
    sortCompare,
    chunk,
    removeRepeat,
    groupField
};