// =============================================================================
// PACKAGES
// =============================================================================
// =============================================================================
// HELPERS
// =============================================================================
const h_format      = require('../../../helpers/format');
const h_validation  = require('../../../helpers/validation');
const h_response    = require('../../../helpers/response');
const h_file        = require('../../../helpers/file');
const h_crud          = require('../../../helpers/crud');
const excel         = require('../../../helpers/excel');
// =============================================================================
// SERVICES
// =============================================================================
const {
    brandService,
    discountService,
    customerService
} = require('../../../services/manager');
// =============================================================================
// REST FUNCTIONS
// =============================================================================
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function downloadDiscountFile(req, res){
    
    let brand_result = await brandService.find({ status: 'active' }, { _id: 1, name: 1 }, { name: 1 });
    let customer_result = await customerService.find({ status: 'active' }, { _id: 1, first_name: 1, last_name: 1, email: 1, state: 0, language: 0, type_business: 0, customer_type: 0, product_category: 0, shop: 0 }, { _id: 1 });
    if( brand_result.success && brand_result.body.length > 0 && customer_result.success && customer_result.body.length > 0 ){
        
        let discount_result = await discountService.find({ customer: { $in: customer_result.body.map( (item) => item._id ) } }, { customer: 1, discounts: 1 }, { customer: 1 }, { populate: { path: 'customer' } });
        if( discount_result.success && discount_result.body ){
            
            let data_discounts = discount_result.body.reduce( (previous_item, current_item) => {
                
                let columns = [
                    { name: "email", value: current_item.customer.email, index_column: 0, num_columns: 1, num_rows: 1 }, 
                    { name: "name", value: `${ current_item.customer.first_name } ${ current_item.customer.last_name }`, index_column: 1, num_columns: 1, num_rows: 1 }
                ].concat( brand_result.body.map( (item, index) => { 
                    
                    let index_discount = current_item.discounts.findIndex( (item_d) => item_d.brand === item._id );
                    return { name: "brand", value: index_discount >= 0 ? current_item.discounts[index_discount].value : "", index_column: index + 2, num_columns: 1, num_rows: 1 };
                }) );
                previous_item.body.push({ row: { columns: columns } });
                previous_item.customers.push(current_item.customer._id.toString());
                
                return previous_item;
            }, { customers: [], body: [] });
            let data_file = [
                {
                    title           : "Discount Customer List",
                    max_num_columns : brand_result.body.length + 2,
                    sheet_name      : "Discount Customer List",
                    header_titles   : ["Email", "Name"].concat( brand_result.body.map( (item) => item.name ) ),
                    body_data       : data_discounts.body,
                    cols            : [ { wch: 40 }, { wch: 30 } ].concat( brand_result.body.map( (item) => { return { wch: 20 } } ) )
                }
            ];
            for (const item_customer of customer_result.body.filter( (item) => data_discounts.customers.indexOf( item._id.toString() ) < 0 )) {
                
                let columns = [ 
                    { name: "email",        value: item_customer.email,                                             index_column: 0, num_columns: 1, num_rows: 1 }, 
                    { name: "name",         value: `${ item_customer.first_name } ${ item_customer.last_name }`,    index_column: 1, num_columns: 1, num_rows: 1 }
                ].concat( brand_result.body.map( (item, index) => { 
                    return { name: "brand", value: "", index_column: index + 2, num_columns: 1, num_rows: 1 } 
                }) );
                data_file[0].body_data.push({ row: { columns: columns } });
            }
            let create_file = await excel.createFile( `Discount Customer List`, `/documents/templates/excel/format-discount-list.xlsx`, data_file, null, 2, formatBodyDiscountFile, null, null, formatHeaderDiscountFile );
            if( create_file.success ){
                
                res.status(200).json( h_response.request( true, create_file, 200, "Success: Download File", "Discount File List" ) );
            }
            else {
                
                res.status(400).send( h_response.request( false, create_file, 400, "Error: Format", "Discount List File format not validated" ) );
            }
        }
        else {
            
            res.status(400).send( h_response.request( false, discount_result, 400, "Error: Customer Discount find", "Customer Discount not found" ) );
        }
    }
    else if( !brand_result.success ){
        
        res.status(400).send( h_response.request( false, brand_result, 400, "Error: Brand find", "Brand not found" ) );
    }
    else if( !customer_result.success ){
        
        res.status(400).send( h_response.request( false, customer_result, 400, "Error: Customer find", "Customer not found" ) );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function deleteDiscountFile(req, res){
    
    let remove_file = await h_file.remove( `./public/downloads/`, `Discount Customer List.xlsx`, 'xlsx');
    if( remove_file.success ){
        
        res.status(200).json( remove_file );
    }
    else {
        
        res.status(200).json( remove_file );
    }
};
// =============================================================================
// GENERAL FUNCTIONS
// =============================================================================
/**
* 
* @param {*} data_template 
* @param {*} template_file { item_sheet, first_reg, arr_columns, index_col, column } 
* @param {*} data_file { file, data_sheet, index_data, item_data }
* @returns 
*/
async function formatBodyDiscountFile( data_template, template_file, data_file ){
    
    let cell_file = `${ template_file.column }${ parseInt( template_file.first_reg ) + data_file.index_data }`;
    let item_file = data_file.item_data.row.columns.find( (item) => item.index_column === template_file.index_col );
    let cell_template = item_file.name === "brand" ? 'C2' : `${ template_file.column }${ template_file.first_reg }`;
    
    if( item_file ){
        
        data_template.Sheets[template_file.item_sheet][cell_file] = excel.addCell( data_template, data_template.Sheets[template_file.item_sheet][cell_template], item_file.value );
    }
    
    return data_template;
};
/**
 * 
 * @param {*} data_template 
 * @param {*} item_sheet 
 * @param {*} first_reg 
 * @param {*} arr_columns 
 * @param {*} header_titles 
 * @returns 
 */
async function formatHeaderDiscountFile( data_template, item_sheet, first_reg, arr_columns, header_titles ){
    
    for (const [index_column, item_column] of arr_columns.entries()) {
        
        let cell_file = `${ item_column }${ parseInt( first_reg ) - 1 }`;
        data_template.Sheets[item_sheet][cell_file] = excel.addCell( data_template, data_template.Sheets[item_sheet][index_column > 1 ? "C1" : cell_file], header_titles[index_column] );
    }
    return data_template;
};
// =============================================================================
// EXPORTS
// =============================================================================
module.exports = {
    get:{
        downloadDiscountFile,
        deleteDiscountFile
    },
    post:{
    },
    put:{
    },
    delete:{
    }
};