// =============================================================================
// PACKAGES
// =============================================================================
const moment    = require('moment');
// =============================================================================
// HELPERS
// =============================================================================
const h_response    = require('../../helpers/response');
const h_excel       = require('../../helpers/excel');
const h_file        = require('../../helpers/file');
const h_crud        = require('../../helpers/crud');
const h_format      = require('../../helpers/format');
const h_validation  = require('../../helpers/validation');
// =============================================================================
// SERVICES
// =============================================================================
const {
    agentUserService
} = require('../../services/manager');
// =============================================================================
// REST FUNCTIONS
// =============================================================================

/**
* 
* @param {*} req 
* @param {*} res 
*/
async function chargeTargets(req, res) {
    try {
        let file_read = await h_excel.readFile( req, "Agent Target List", JSON.parse( req.body.multi_sheets ) );
        let agent_result = await agentUserService.find({ status: 'active' });
        if( file_read.success && agent_result.success ){
            
            let error_targets = [];
            for (const item_file of file_read.body) {
                
                let item_agent = agent_result.body.find( (item) => item.email === item_file.row.email );
                if( item_agent && item_agent != null ){
                    
                    if( req.query.action === "create" ){
                        
                        item_agent.targets[2] = item_agent.targets[1];
                        item_agent.targets[1] = item_agent.targets[0];
                    }
                    item_agent.targets[0] = item_file.row.target;
                    
                    let agent_updated = await agentUserService.update({ email: item_file.row.email }, { targets: item_agent.targets });
                    if( !agent_updated.success ){
                        
                        return res.status(400).send( h_response.request( false, agent_updated, 400, "Error: Charge Targets", "Agent not Updated" ) );
                    }
                }
                else{
                    
                    error_targets.push( item_file.row.email );
                }
            }
            res.status(200).json( h_response.request( true, error_targets, 200, "Success: Charge Targets", "Targets charged" ) );
        }
        else{
            
            let error_data = [ file_read, agent_result ].filter( (item) => !item.success );
            res.status(400).send( h_response.request( false, error_data, 400, "Error: Charge Targets", "Agent not Updated" ) );
        }
    } catch (process_error) {
        
        res.status(400).send( h_response.request(false, process_error, 400, "Error: Process Charge Targets", "Targets not charged") );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function downloadTargetFile(req, res){
    try {
        let data_file       = [{
            title: "Agent Target List",
            max_num_columns: req.query.type === 'current-month' ? 3 : 5,
            sheet_name: "Agent Target List",
            header_titles: req.query.type === 'current-month' ? ["Email", "Name", moment().startOf("month").format('MMMM')] : ["Email", "Name", moment().startOf("month").format('MMMM'), moment().subtract(1, "month").startOf("month").format('MMMM'), moment().subtract(2, "month").startOf("month").format('MMMM')],
            body_data: [],
            cols: req.query.type === 'current-month' ? [ { wch: 40 }, { wch: 30 }, { wch: 20 } ] : [ { wch: 40 }, { wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 20 } ]
        }];
        let agent_result    = await agentUserService.find({ status: 'active' });
        
        if( agent_result.success ){
            
            for (const item_agent of agent_result.body) {
                
                data_file[0].body_data.push({ 
                    row: { 
                        columns: req.query.type === 'current-month' ? [ 
                            { name: "email",        value: item_agent.email,        index_column: 0, num_columns: 1, num_rows: 1 }, 
                            { name: "name",         value: item_agent.name,         index_column: 1, num_columns: 1, num_rows: 1 }, 
                            { name: "target",       value: item_agent.targets[0],   index_column: 2, num_columns: 1, num_rows: 1 } 
                        ] : [ 
                            { name: "email",        value: item_agent.email,        index_column: 0, num_columns: 1, num_rows: 1 }, 
                            { name: "name",         value: item_agent.name,         index_column: 1, num_columns: 1, num_rows: 1 }, 
                            { name: "target_1",     value: item_agent.targets[0],   index_column: 2, num_columns: 1, num_rows: 1 }, 
                            { name: "target_2",     value: item_agent.targets[1],   index_column: 3, num_columns: 1, num_rows: 1 }, 
                            { name: "target_3",     value: item_agent.targets[2],   index_column: 4, num_columns: 1, num_rows: 1 } 
                        ]
                    } 
                });
            }
            let format_file = await h_excel.createFile( `Agent Target List`, `/documents/templates/excel/format-target-agents-list-${ req.query.type }.xlsx`, data_file, 'A1', 3, formatBodyTargetFile, null, null, formatHeaderTargetFile );
            if( format_file.success ){
                
                res.status(200).json( format_file );
            }
            else{
                
                res.status(400).send( format_file );
            }
        }
        else{
            
            res.status(400).send( h_response.request(false, agent_result, 400, "Error: Agent Target List", "Agents not found") );
        }
    } catch (process_error) {
        
        res.status(400).send( h_response.request(false, process_error, 400, "Error: Download Target File", "File not downloaded") );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function deleteTargetFile(req, res){
    
    let delete_file = await h_file.remove( `./public/downloads/`, `Agent Target List.xlsx`, 'xlsx');
    
    if( delete_file.success ){
        
        res.status(200).json( delete_file );
    }
    else {
        
        res.status(400).send( delete_file );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function findDocument(req, res){
    
    let format_data = [
        h_format.objectValidField( 'id_handle', h_validation.evalString( req.body.id_handle ), h_format.fields.types.string.name, h_format.fields.types.string.operators.not_equal, null ),
    ];
    format_data = h_validation.evalFields( req.body, format_data );
    
    if( format_data.is_valid ){
        
        let find_query = h_format.findQuery( format_data.body_object.id_handle );

        await h_crud.findDocument('Agent', agentUserService, find_query, req.body.fields, req.body.options).then( async (result_document) => {
            
            res.status(200).json( result_document );
            
        }).catch( (error_document) => {
            
            res.status(400).send( error_document );
        });
    }
    else{
        
        res.status(400).send( h_response.request( false, format_data.error_fields, 400, 'Error: Validate Data', 'Agent fields required not validated' ) );
    }
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function listDocuments(req, res){
    
    await h_crud.listDocuments('Agent', agentUserService, req.body.query, req.body.fields, req.body.options).then( async (result_document) => {
        
        result_document.body = result_document.body.reduce( (previous_item, current_item) => {
            
            previous_item.push({
                id: current_item._id,
                email: current_item.email,
                store: current_item.store,
                label: `${ current_item.name } - ( ${ current_item.store } )`,
                value: current_item
            });
            
            return previous_item;
        }, []);
        res.status(200).json( result_document );
        
    }).catch( (error_document) => {
        
        res.status(400).send( error_document );
    });
};
// =============================================================================
// GENERAL FUNCTIONS
// =============================================================================
/**
* 
* @param {*} data_template 
* @param {*} template_file { item_sheet, first_reg, arr_columns, index_col, column } 
* @param {*} data_file { file, data_sheet, index_data, item_data }
* @param {*} format_currency { locale, code }
* @returns 
*/
async function formatBodyTargetFile( data_template, template_file, data_file, format_currency ){
    
    
    let formula_excel = null;
    let cell_file = `${ template_file.column }${ parseInt( template_file.first_reg ) + data_file.index_data }`;
    let cell_template = `${ template_file.column }${ template_file.first_reg }`;
    let item_file = data_file.item_data.row.columns.find( (item) => item.index_column === template_file.index_col );
    
    if( item_file ){
        
        data_template.Sheets[template_file.item_sheet][cell_file] = excel.addCellExcel( data_template, data_template.Sheets[template_file.item_sheet][cell_template], item_file.value, format_currency, formula_excel );
    }
    
    return data_template;
};
async function formatHeaderTargetFile( data_template, item_sheet, first_reg, arr_columns, header_titles, max_num_columns ){
    
    for (const [index_column, item_column] of arr_columns.entries()) {
        
        let cell_file = `${ item_column }${ parseInt( first_reg ) - 1 }`;
        data_template.Sheets[item_sheet][cell_file] = excel.addCellExcel( data_template, data_template.Sheets[item_sheet][cell_file], header_titles[index_column] );
    }
    return data_template;
}
// =============================================================================
// EXPORTS
// =============================================================================
module.exports = {
    get:{
        downloadTargetFile,
        deleteTargetFile
    },
    post:{
        chargeTargets,
        listDocuments,
        findDocument
    },
    put:{
    },
    delete:{
    }
};