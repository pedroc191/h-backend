// =============================================================================
// PACKAGES
// =============================================================================
const xlsx      = require('xlsx-style-formula');
// =============================================================================
// HELPERS
// =============================================================================
const h_array   = require('./array');
const h_file    = require('./file');
const h_format  = require('./format');
const h_response= require('./response');
// =============================================================================
// FUNCTIONS
// =============================================================================
/**
* DESCRIPTION: Gets the header of each column required to create the Excel file
* @param {Number} max_num_columns Maximum Number of Columns in an Excel File Page
* @returns String array with the headers of each column of the excel file
*/
function generateColumns( max_num_columns ){
    
    const letters       = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"];
    let arr_columns     = [letters];
    let num_repeat      = ( max_num_columns - letters.length ) / letters.length;
    let letter_repeat   = Math.floor( ( num_repeat - parseInt( num_repeat.toString().split(".")[0] ) ) * letters.length );
    let letters_ciclo   = [];
    let aux_letter      = new Array( parseInt( Math.ceil( num_repeat ) ) );
    
    for (let index = 0; index < aux_letter.length; index++) {
        
        letters_ciclo.push( index + 1 );
    }
    letters_ciclo = h_array.chunk( letters_ciclo, letters.length );
    
    if( num_repeat > 0 ){
        
        let control_letter  = 1;
        let control_ciclo   = 0;
        
        for (const [index_c, item_ciclo] of letters_ciclo.entries()) {
            
            for (const [index_r,item_repeat] of item_ciclo.entries()) {
                
                if( index_c === 0 ){
                    
                    if(index_c + 1 === letters_ciclo.length && index_r + 1 === item_ciclo.length){
                        
                        if( letter_repeat === 0 ){
                            
                            arr_columns.push( letters.map( (item_l) => `${ letters[ ( index_r + 1 ) - 1 ] }${ item_l }` ) );
                        }
                        else{
                            
                            arr_columns.push( letters.slice(0, letter_repeat).map( (item_l) => `${ letters[ ( index_r + 1 ) - 1 ] }${ item_l }` ) );
                        }
                    }
                    else{
                        
                        arr_columns.push( letters.map( (item_l) => `${ letters[ ( index_r + 1 ) - 1 ] }${ item_l }` ) );
                    }
                }
                else if( index_c + 1 === letters_ciclo.length && index_r + 1 === item_ciclo.length ){
                    
                    if( letter_repeat === 0 ){
                        
                        arr_columns.push( arr_columns[ ( item_repeat + control_ciclo ) - ( letters.length * index_c ) ].map( (item_l) => `${ letters[ control_letter - 1 ] }${ item_l }` ) );
                    }
                    else{
                        
                        arr_columns.push( arr_columns[ ( item_repeat + control_ciclo ) - ( letters.length * index_c ) ].slice(0, letter_repeat).map( (item_l) => `${ letters[ control_letter - 1 ] }${ item_l }` ) );
                    }
                }
                else{
                    
                    arr_columns.push( arr_columns[ ( item_repeat + control_ciclo ) - ( letters.length * index_c ) ].map( (item_l) => `${ letters[ control_letter - 1 ] }${ item_l }` ) );
                }
            }
            if( index_c > 0 ){
                
                control_letter += 1;
                if( control_letter > 26 ){
                    
                    control_ciclo += letters.length;
                    control_letter = 1;
                }
            }
        }
        return [].concat.apply( [], arr_columns );
    }
    else{
        
        return letters.slice(0, max_num_columns);
    }
};
/**
* 
* @param {*} item_column 
* @param {*} value 
* @param {*} format_currency 
* @returns 
*/
function formatCellValue( item_column, value, format_currency ){
    
    if( item_column.type === "string" ){
        
        value = value.toString();
        
        if( item_column.format && item_column.format === "uppercase" ){
            
            value = value.toUpperCase();
        }
        else if( item_column.format && item_column.format === "lowercase" ){
            
            value = value.toLowerCase();
        }
    }
    else if( item_column.type === "number" ){
        
        value = parseFloat( value );
        
        if( item_column.format && item_column.format === "money-num" ){
            
            value = h_format.currencyObject( value, null, format_currency.locale, format_currency.code ).number
        }
        else if( item_column.format && item_column.format === "money-ft" ){
            
            value = h_format.currencyObject( value, null, format_currency.locale, format_currency.code ).format
        }
        else if( item_column.format && item_column.format === "money" ){
            
            value = h_format.currencyObject( value, null, format_currency.locale, format_currency.code )
        }
        else if( item_column.format && item_column.format === "percentage" ){
            
            value = h_format.currencyObject( Math.round( value * 100 ), null, format_currency.locale, format_currency.code ).number
        }
    }
    else if( item_column.type === "date" ){
        
        value = new Date( value );
    }
    else if( item_column.type === "boolean" ){
        
        value = JSON.parse( value );
    }
    return value;
}
/**
* DESCRIPTION: Join cells of the template, indicating the start and end cells and with the possibility of copying the styles of the starting cell
* @param {Object} data_template JSON object with template data
* @param {String} sheet Sheet from excel that is being modified
* @param {Object} arr_columns Excel columns array
* @param {Object} coordinates Array width coordinates from cell merge: 
* -0: Index of the starting column in array of Columns.
* -1: Index of the ending column in array of Columns
* -2: Index of the row of the starting cell to merge
* -3: Index of the row of the ending cell to merge
* @param {Boolean} copy_styles Copy the styles of the starting cell to be merged (true or false)
* @returns 
*/
function mergeCells( data_template, item_sheet, arr_columns, coordinates, cell_template, copy_styles = false ){
    
    let coordinates_cell_merge = {
        s: {
            c: coordinates[0],
            r: coordinates[1]
        },
        e: {
            c: coordinates[2],
            r: coordinates[3]
        }
    };
    if( copy_styles ){
        
        let cell_merge = "";
        for ( let col = coordinates_cell_merge.s.c; col <= coordinates_cell_merge.e.c; col++ ) {
            
            for ( let row = coordinates_cell_merge.s.r; row <= coordinates_cell_merge.e.r; row++ ) {
                
                cell_merge = `${ arr_columns[ col ] }${ row + 1 }`;
                if( item_sheet[cell_merge] === undefined ){
                    
                    item_sheet[cell_merge] = addDefaultCell( data_template, 0, true );
                }
                item_sheet[cell_merge].s = item_sheet[cell_template].s;
            }
        }
    }
    item_sheet["!merges"].push( coordinates_cell_merge );
};
/**
* DESCRIPTION: Change the original text of the template in the test data to the final texts
* @param {Object} data_template JSON object with template data
* @param {String} sheet Sheet from excel that is being modified
* @param {String} cell_file Template file cell
* @param {String} content_string Original text of the template 
* @returns 
*/
function replaceStringCell( data_template, sheet, cell_file, content_string ){
    
    data_template.Strings.splice( data_template.Strings.findIndex( (item) => item.h === data_template.Sheets[sheet][cell_file].h ), 1 );
    
    data_template.Sheets[sheet][cell_file].r = `<t>${ content_string }</t>`;
    data_template.Sheets[sheet][cell_file].h = content_string.toString();
    data_template.Sheets[sheet][cell_file].v = content_string;
    
    data_template.Strings.push( { t: content_string, r: `<t>${ content_string }</t>`, h: content_string } );
};
/**
* DESCRIPTION: Add a cell to the template file, using the styles of an existing cell and with the possibility of using Formulas
* @param {*} data_template JSON object with template data
* @param {*} sheet Sheet from excel that is being modified
* @param {*} cell_template Template file cell
* @param {*} value Content that the new cell will have
* @param {*} is_cell_money Indicates if cell contains number in currency format (true or false)
* @param {*} func_cell Add Function to cell (String)
* @returns 
*/
function addCell( file_template, cell_template, value, format_currency = { locale: "en-US", code: "USD" }, func_cell = null ){
    
    let new_cell = {
        t: 's',
        v: value,
        s: cell_template.s,
        z: cell_template.s.numFmt,
        w: value
    };
    if( typeof value === "string" ){
        
        new_cell.w = value.toString();
        new_cell.t = "s";
        new_cell.h = new_cell.w;
        
        new_cell.r = `<t>${ new_cell.w }</t>`;
        file_template.Strings.push( { t: new_cell.w, r: `<t>${ new_cell.w }</t>`, h: new_cell.w } );
    }
    else if( typeof value === "number" ){
        
        new_cell.t = "n";
        new_cell.w = value.toString();
        new_cell.z = cell_template.s.numFmt;
        
        if( cell_template.s.numFmt.indexOf('#,##0.00') >= 0 ){
            
            new_cell.w = h_format.currencyObject( value, format_currency.locale, format_currency.code ).number.toString();
        }
        else if( cell_template.s.numFmt.indexOf('0.00%') >= 0 ){
            
            new_cell.v = parseFloat(value) / 100;
            new_cell.w = h_format.currencyObject( value, format_currency.locale, format_currency.code ).number.toString();
            new_cell.w = new_cell.w.indexOf('.') >= 0 ? new_cell.w : `${ new_cell.w }.00`;
            new_cell.w = `${ new_cell.w.slice(-2).indexOf('.') >= 0 ? `${ new_cell.w }0` : new_cell.w }%`;
        }
    }
    else if( typeof value === 'object' && cell_template.s.numFmt.indexOf('d/mm/yyyy') >= 0 ){
        
        new_cell.t = "n";
        new_cell.w = value.format('DD/MM/yyyy')
        new_cell.v = value.diff( moment('01/01/1900 00:00:00'), 'days' ) + 3;
    }
    if( func_cell != null ){
        
        new_cell.f = func_cell;
    }
    return new_cell;
};
/**
* DESCRIPTION: Add a default cell without styles
* @param {*} data_template JSON object with template data
* @param {*} value Content that the new cell will have
* @param {*} is_cell_money Indicates if cell contains number in currency format (true or false)
* @param {*} is_merge Indicates if the cell will be mixed with another (true or false)
* @param {*} func_cell Add Function to cell (true or false)
* @returns 
*/
function addDefaultCell( data_template, value, is_merge ){
    
    let new_cell = {
        t: 's',
        v: value,
        w: value
    };
    if( typeof value === "string" ){
        
        value = value.toString();
        new_cell.t = "s";
        new_cell.r = `<t>${ is_merge ? "" : value }</t>`;
        new_cell.h = is_merge ? "" : value;
        if( !is_merge ){
            
            data_template.Strings.push( { t: value, r: `<t>${ value }</t>`, h: value } );
        }
    }
    else if( typeof value === "number" ){
        
        new_cell.t = "n";
        new_cell.w = value.toString();
    }
    new_cell.v = is_merge ? "" : value;
    new_cell.s = {};
    new_cell.w = is_merge ? "" : value.toString();
    
    return new_cell;
};
/**
* 
* @param {*} index_row 
* @param {*} num_rows 
* @returns 
*/
function addHeightRow( index_data, index_row, num_rows){
    
    let num = 1;
    while ( num <= num_rows ){
        
        index_row += index_data;
        num += 1;
    }
    return index_row;
}
/**
* DESCRIPTION: Create an Excel File, modifying the code of the selected template to add the data in the format that the template contains
* @param {String} name_file File name to download
* @param {Object} file_template Template file extracted with the xlsx-style-formula library
* @param {Object} data_file Data to be added to the file, in the following format: [row: [data1, data2, ...], ...]
* @param {Object} cell_title Cell in which the file title goes
* @param {Number} first_reg Row Number in the Template where the data to be added begins
* @param {Function} insertBodyData Function that establishes the way in which the data will be added to the body of the file to be created
* @param {Function} insertHeadData ( Optional Param ) Function that establishes the way in which the data will be added to the header of the file to be created
* @param {Function} insertFooterData ( Optional Param ) Function that establishes the way in which the data will be added to the footer of the file to create
* @param {Function} insertSheets ( Optional Param ) Function to add more sheets to the excel file, based on a sheet from the template
* @returns New Excel File with the required data and Formatted by the selected Template
*/
async function createFile( file, insertBodyData, format_currency = { locale: "en-US", code: "USD" }, insertHeadData = undefined, insertFooterData = undefined, insertSheets = undefined ) {
    
    return new Promise( async (resolve, reject) => {

        try {
        
            // file: {
            //     name, name_file
            //     template, file_template
            //     data, data_file
            //     cell_title, cell_title
            //     row_first_reg first_reg
            // }
            let data_template = await xlsx.readFile(`./public${ file.template }`, { cellFormula: true, cellHTML: true, cellNF: true, cellStyles: true, cellDates: true, sheetStubs: true });
            
            let arr_columns = [];
            let new_sheets  = {};
            
            if( insertSheets ){
                
                data_template.Props.SheetNames  = [];
                data_template.SheetNames        = [];
                data_template.Directory.sheets  = [];
                data_template                   = await insertSheets( data_template, file.data );
            }
            for ( const [index_sheet, item_sheet] of data_template.SheetNames.entries() ) {
                
                arr_columns = generateColumns( file.data[index_sheet].max_num_columns );
                /* REPLACE SHEET TITLE */
                if( file.cell_title != null ){
                    
                    data_template.Sheets[item_sheet][file.cell_title] = addCell( data_template, data_template.Sheets[item_sheet][file.cell_title], file.data[index_sheet].title.toString() );
                }
                
                /* INSERT FILE HEADERS */  
                if( insertHeadData ){
                    
                    data_template = await insertHeadData( data_template, item_sheet, parseInt( file.row_first_reg ), arr_columns, file.data[index_sheet].header_titles, file.data[index_sheet].max_num_columns );
                }
                /* INSERT FILE BODY */
                
                for ( const [index_data, item_data] of file.data[index_sheet].body_data.entries() ) {
                    
                    for ( const [index_col, item_column] of arr_columns.entries() ) {
                        
                        let template_file   = { 
                            item_sheet  : item_sheet, 
                            first_reg   : parseInt( file.row_first_reg ), 
                            arr_columns : arr_columns, 
                            index_col   : index_col, 
                            column      : item_column 
                        };
                        let data_db         = { 
                            file        : file.data, 
                            data_sheet  : file.data[index_sheet], 
                            index_data  : index_data, 
                            item_data   : item_data 
                        };
                        data_template = await insertBodyData( data_template, template_file, data_db, format_currency );
                    }
                }
                data_template.Sheets[item_sheet]["!ref"]    = `A1:${ arr_columns[ arr_columns.length - 1 ] }${ ( file.data[index_sheet].body_data.reduce( (previous_item, current_item) => { previous_item += ( current_item.row.columns.reduce( (a, b) => { if( a < b.num_rows ){ a = b.num_rows } return a; }, 0) ); return previous_item; }, 0) ) + parseInt( file.row_first_reg ) - 1 }`;
                
                data_template.Sheets[item_sheet]["!cols"]   = file.data[index_sheet].cols;
                
                //data_template.Strings = data_template.Strings.filter( (item, index) => data_template.Strings.findIndex( (item_s) => item_s.t === item.t ) === index );
                /* INSERT FILE FOOTER */
                if( insertFooterData ){
                    
                    data_template                               = await insertFooterData( data_template, item_sheet, parseInt( file.row_first_reg ), arr_columns, file.data[index_sheet].footer_titles, file.data[index_sheet].body_data.length );
                    data_template.Sheets[item_sheet]["!ref"]    = `A1:${ arr_columns[ arr_columns.length - 1 ] }${ file.data[index_sheet].body_data.length + parseInt( file.row_first_reg ) + file.data[index_sheet].rows_footer - 1 }`;
                }
                /* SAVE NEW SHEETS */
                data_template.Props.SheetNames[index_sheet]     = file.data[index_sheet].sheet_name;
                new_sheets[file.data[index_sheet].sheet_name]   = data_template.Sheets[item_sheet];
            }
            /* UPDATE SHEETS */
            data_template.Sheets = new_sheets;
            
            await xlsx.writeFile(data_template, `./public/downloads/${ file.name }.xlsx` );
            
            resolve( h_response.request( true, { url: `/downloads/${ file.name }.xlsx?v=${ h_format.randomNumber( 1000000000, 9999999999 ) }` }, 200, "Success: Created File", "" ) );
    
        } catch (error) {
            
            resolve( h_response.request( false, error, 400, "Error: Created File", "" ) );
        }
    });
};
/**
* 
* @param {*} req 
* @param {*} file_name 
* @param {*} multi_page 
* @returns 
*/
async function readFile(req, file_name, multi_page = false, format_currency = { locale: "en-US", code: "USD" }){
    
    return new Promise( async (resolve, reject) => {
        
        await h_file.upload( req.file, '/uploads', req.body.old_file_path, file_name, true, parseInt( req.body.max_size ), false, req.body.max_dimension ).then( async (file_result) => {
            
            let file        = xlsx.readFile(`./public/${ file_result.data.url }`);
            let data_sheets = [];
            let sheets      = JSON.parse( req.body.sheets );
            
            let config_sheet = {...sheets};
            
            for (const item_sheet of file.SheetNames) {
                
                if( multi_page ){
                    
                    config_sheet = sheets.find( (item) => item.name === item_sheet );
                    config_sheet = !config_sheet ? null : config_sheet;
                }
                let columns     = generateColumns( config_sheet.read_options.max_columns );
                let max_rows    = parseInt( file.Sheets[item_sheet]["!ref"].split(":")[1].replace(/\w/i, "") );
                let data_sheet  = [];
                
                for (const [index_row, item_row] of new Array( max_rows - ( config_sheet.read_options.first_reg - 1 ) ).entries()) {
                    
                    if( file.Sheets[item_sheet][`${ columns[0] }${ index_row + config_sheet.read_options.first_reg }`].v != '' ){
                        
                        let row = {};
                        for (const [index_column, item_column] of config_sheet.read_options.fields.entries()) {
                            
                            row[item_column.name] = null;
                            if( file.Sheets[item_sheet][`${ columns[index_column] }${ index_row + config_sheet.read_options.first_reg }`] ){
                                
                                row[item_column.name] = formatCellValue(item_column, file.Sheets[item_sheet][`${ columns[index_column] }${ index_row + config_sheet.read_options.first_reg }`].v, format_currency );
                            }
                        }
                        data_sheet.push({ row: row });
                    }
                }
                if( multi_page ){
                    
                    data_sheets.push({ sheet: item_sheet, data: data_sheet });
                }
                else{
                    data_sheets = { sheet: item_sheet, data: data_sheet };
                }
            }
            await h_file.remove(`./public/uploads`, `${ file_name }.${ file_result.data.type }`, file_result.data.type );
            
            resolve( data_sheets );
            
        }).catch( (file_error) => {
            
            resolve( file_error );
        });
    });
};
module.exports = {
    generateColumns,
    addCell,
    addDefaultCell,
    replaceStringCell,
    mergeCells,
    addHeightRow,
    createFile,
    readFile
}