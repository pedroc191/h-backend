// =============================================================================
// PACKAGES
// =============================================================================

// =============================================================================
// HELPERS
// =============================================================================
const utils     = require('../../../helpers/utils');
const h_crud      = require('../../../helpers/crud');
const excel     = require('../../../helpers/excel');
// =============================================================================
// SERVICES
// =============================================================================
const {
    userService,
    shippingGroupService,
    countryService,
    productService,
    shippingTypeService,
    shippingRateService
} = require('../../../services/manager');
// =============================================================================
// REST FUNCTIONS
// =============================================================================
/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
async function list(req, res){

    await shippingGroupService.find({ status: 'active' }).then( async (shipping_group_result) => {

        await countryService.find({ status: 'active' }).then( async (country_result) => {

            shipping_group_result.body = utils.array.sortArray( shipping_group_result.body, "general_group" );

            let group_index = shipping_group_result.body.findIndex( (item) => item.general_group );
    
            if( group_index >= 0 ){
    
                let general_group = {...shipping_group_result.body[group_index]};
                shipping_group_result.body = [ general_group ].concat( shipping_group_result.body.filter( (item) => !item.general_group ) );
            }
            for (const item_group of shipping_group_result.body) {
                
                let query_products = { $and: [ { status: 'active' } ] };
    
                if( !item_group.general_group ){
    
                    if( item_group.brands.length > 0 ){
    
                        query_products.$and.push({ brand: { $in: item_group.brands } });
                    }
    
                    if( item_group.product_types.length > 0 ){
    
                        query_products.$and.push({ product_type: { $in: item_group.product_types } });
                    }
                    
                    if( item_group.product_variants.length > 0 ){
    
                        query_products.$and.push({ skus: { $in: item_group.product_variants } });
                    }
                }
                await productService.count( query_products ).then( async (product_count) => {
    
                    item_group.product_count = product_count.body;

                    item_group.shipping_rates = {
                        standards: [],
                        variants: []
                    };
                }).catch( (product_error) => {
    
                    res.status(400).send( utils.format.formatResponseRequest( false, product_error, 400, "Error: Shipping Groups find", "Shipping Groups not found, Products not found" ) );
                });
            }
            country_result.body = utils.array.sortArray( country_result.body, "iso_code_2").map( (item_country) => {
    
                return formatItemFrontAdminShippingCountry({
                    zone_data       : {
                        _id     : "",
                        group_id: "",
                        name    : "",
                        handle  : ""
                    },
                    country_data    : item_country
                });
            });
            shipping_group_result.body = {
                shipping_groups: shipping_group_result.body,
                countries: country_result.body
            };

            res.status(200).json( utils.format.formatResponseRequest( true, shipping_group_result.body, 200, "Success: Shipping Groups find", "Shipping Groups found" ) );
    
        }).catch( (country_error) => {
    
            res.status(400).send( utils.format.formatResponseRequest( false, country_error, 400, "Error: Shipping Groups find", "Shipping Groups not found, Countries not found" ) );
        });
    }).catch( (shipping_group_error) => {

        res.status(400).send( utils.format.formatResponseRequest( false, shipping_group_error, 400, "Error: Shipping Groups find", "Shipping Groups not found" ) );
    });
};
/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
async function listShippingRates( req, res ){

    await shippingRateService.find({ status: 'active', group_id: parseInt( req.params.group_id ), country_code: req.query.country_code }, null, { state_code: 1 }).then( (shipping_rate_result) =>{

        shipping_rate_result.body = shipping_rate_result.body.reduce( (previous_item, current_item) => {

            if( current_item.rate_type === 'standard' ){

                previous_item.standards.push( current_item );
            }
            else{

                previous_item.variants.push( current_item );
            }
            return previous_item;

        },{ standards: [], variants: [] });
        res.status(200).json( utils.format.formatResponseRequest( true, shipping_rate_result.body, 200, "Success: Shipping Rates find", "Shipping Rates found" ) );

    }).catch( (shipping_rate_error) => {
        
        res.status(400).send( utils.format.formatResponseRequest( false, shipping_rate_error, 400, "Error: Shipping Rates find", "Shipping Rates not found" ) );
    })
};
/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
async function saveCountryShippingRates(req, res){

    await shippingRateService.find({ status: 'active', group_id: parseInt( req.params.group_id ), country_code: req.params.country_code }, null, { state_code: 1 }).then( async (shipping_rate_result) => {

        let data_country = {
            iso_code: req.params.country_code,
            count_rates: {
                standards: 0,
                variants: 0
            },
            states: [],
            zip_codes: []
        };
        let new_shipping_rates = JSON.parse(req.body.shipping_rates).reduce( (previous_item, current_item) => {

            if( current_item.state_code != null ){

                data_country.states.push(current_item.state_code);
            }
            if( current_item.zip_code != null ){

                data_country.states.push(current_item.zip_code);
            }

            if( current_item._id === null ){

                previous_item.create.push( formatShippingRate(current_item, 'create') );
            }
            else{

                let index_rate = previous_item.delete.findIndex( (item) => item._id === current_item._id );

                if( index_rate >= 0 ){

                    previous_item.update.push( formatShippingRate(current_item, 'update') );
                    previous_item.delete.splice( index_rate, 1 );
                }
            }
            return previous_item;

        },{ create: [], update: [], delete: [...shipping_rate_result.body] });

        if( new_shipping_rates.create.length > 0 ){

            await shippingRateService.createMany( new_shipping_rates.create ).catch( (shipping_rate_error) => {

                res.status(400).send( utils.format.formatResponseRequest( false, shipping_rate_error, 400, "Error: Save Country Shipping Rate", "Country Shipping Rate not saved, Shipping Rate not created" ) );
            });
        }
        for (const item_rate of new_shipping_rates.update) {
            
            await shippingRateService.update( item_rate.query, item_rate.data ).catch( (shipping_rate_error) => {

                res.status(400).send( utils.format.formatResponseRequest( false, shipping_rate_error, 400, "Error: Save Country Shipping Rate", "Country Shipping Rate not saved, Shipping Rate not updated" ) );
            });
        }
        if( new_shipping_rates.delete.length > 0 ){
            
            await shippingRateService.removeMany({ _id: { $in: new_shipping_rates.delete.map( (item) => item._id ) } }).catch( (shipping_rate_error) => {

                res.status(400).send( utils.format.formatResponseRequest( false, shipping_rate_error, 400, "Error: Save Country Shipping Rate", "Country Shipping Rate not saved, Shipping Rate not deleted" ) );
            });
        }

        await shippingRateService.find({ status: 'active', group_id: parseInt( req.params.group_id ), country_code: req.params.country_code }, null, { state_code: 1 }).then( async (shipping_rate_result) => {

            shipping_rate_result.body = shipping_rate_result.body.reduce( (previous_item, current_item) => {

                if( current_item.rate_type === 'standard' ){
    
                    previous_item.standards.push( current_item );
                }
                else{
    
                    previous_item.variants.push( current_item );
                }
                return previous_item;
    
            },{ standards: [], variants: [] });

            data_country.count_rates.standards =  shipping_rate_result.body.standards.length;
            data_country.count_rates.variants =  shipping_rate_result.body.variants.length;

            await shippingGroupService.findOne({ shopify_id: parseInt( req.params.group_id ) }).then( async (shipping_group_result) => {

                let index_country = shipping_group_result.body.select_countries.findIndex( (item) => item.iso_code === req.params.country_code );

                if( index_country >= 0 ){

                    shipping_group_result.body.select_countries[index_country] = data_country;
                }
                else{

                    shipping_group_result.body.select_countries.push( data_country );
                    shipping_group_result.body.select_countries = utils.array.sortArray(shipping_group_result.body.select_countries, 'iso_code');
                }
                await shippingGroupService.update({ _id: shipping_group_result.body._id }, { select_countries: shipping_group_result.body.select_countries }).then( (shipping_group_updated) => {

                    res.status(200).json( utils.format.formatResponseRequest( true, { select_countries: shipping_group_result.body.select_countries }, 200, "Success: Save Country Shipping Rate", "Shipping Rates saved" ) );

                }).catch( (shipping_group_error) => {

                    res.status(400).send( utils.format.formatResponseRequest( false, shipping_group_error, 400, "Error:r Get Country Shipping Rate", "Shipping Rates not found, Shipping Group not updated" ) );
                });

            }).catch( (shipping_group_error) => {

                res.status(400).send( utils.format.formatResponseRequest( false, shipping_group_error, 400, "Error:r Get Country Shipping Rate", "Shipping Rates not found, Shipping Group not found" ) );
            });

        }).catch( (shipping_rate_error) => {
            
            res.status(400).send( utils.format.formatResponseRequest( false, shipping_rate_error, 400, "Error: Get Country Shipping Rate", "Shipping Rates not found" ) );
        });
    }).catch( (shipping_rate_error) => {
        
        res.status(400).send( utils.format.formatResponseRequest( false, shipping_rate_error, 400, "Error: Save Country Shipping Rate", "Country Shipping Rate not saved, Shipping Rates not found" ) );
    });
};
/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
async function listTypes(req, res){
    
    await shippingTypeService.find({ status: 'active' }).then( (shipping_type_result) => {
        
        res.status(200).json( utils.format.formatResponseRequest( true, shipping_type_result.body, 200, "Success: Shipping Types find", "Shipping Types found" ) );

    }).catch( (shipping_type_error) => {

        res.status(400).send( utils.format.formatResponseRequest( false, shipping_type_error, 400, "Error: Shipping Types find", "Shipping Types not found" ) );
    });
};
/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
async function listCountries(req, res){

    await countryService.find({ status: 'active' }).then( (country_result) => {

        country_result.body = utils.array.sortArray( country_result.body, "iso_code_2" ).map( (item_country) => {

            return formatItemFrontAdminShippingCountry({
                zone_data       : {
                    _id     : "",
                    group_id: "",
                    name    : "",
                    handle  : ""
                },
                country_data    : item_country
            });
        });
        res.status(200).json( utils.format.formatResponseRequest( true, country_result.body, 200, "Success: Countries find", "Countries found" ) );

    }).catch( (country_error) => {

        res.status(400).send( utils.format.formatResponseRequest( false, country_error, 400, "Error: Countries find", "Countries not found" ) );
    });
};
/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
async function chargeShippingRates(req, res){

    await excel.readExcelFile( req, `Shipping Rates List`, JSON.parse( req.body.multi_sheets ) ).then( (file_data) => {

        res.status(200).json( utils.format.formatResponseRequest( true, { file_data: file_data }, 200, "Success: Upload File", "Shipping Rates File Uploaded" ) );

    }).catch( (file_error) => {

        res.status(400).send( utils.format.formatResponseRequest( false, file_error, 400, "Error: Upload File", "Shipping Rates File not Uploaded" ) );
    });
};
/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
async function downloadShippingRateFile(req, res){
    
    await shippingGroupService.findOne({ shopify_id: req.params.group_id }, { _id: 1, name: 1 }).then( async (shipping_group_result) => {

        let query_rates = { $and: [{ group_id: req.params.group_id }, { status: 'active' }] };
        if( req.query.country_codes ){

            query_rates.$and.push({ country_code: { $in: req.query.country_codes.split(",") } });
        }
        await shippingRateService.find(query_rates, { name: 1, rate_type: 1, country_code: 1, state_code: 1, zip_code: 1, price: 1, min_weight: 1, min_total_order: 1, effect_on_price: 1, need_payment: 1 }, { country_code: 1 }).then( async (shipping_rate_result) => {

            await shippingTypeService.find({ status: 'active' }, { name: 1 }, { name: 1 }).then( async (shipping_type_result) => {

                await countryService.find({ status: 'active' }, { _id: 1, name: 1, iso_code_2: 1, iso_code_3: 1, states: 1 }, { name: 1 }).then( async (country_result) =>{

                    let data_file = [
                        {
                            max_num_columns: 11,
                            sheet_name: "Standard Rates",
                            body_data: [],
                            cols: [
                                { wch: 30 },
                                { wch: 30 },
                                { wch: 20 },
                                { wch: 30 },
                                { wch: 20 },
                                { wch: 20 },
                                { wch: 20 },
                                { wch: 20 },
                                { wch: 20 },
                                { wch: 20 },
                                { wch: 20 },
                                { wch: 20 },
                            ]
                        },
                        {
                            max_num_columns: 12,
                            sheet_name: "Variant Rates",
                            body_data: [],
                            cols: [
                                { wch: 30 },
                                { wch: 30 },
                                { wch: 20 },
                                { wch: 30 },
                                { wch: 20 },
                                { wch: 20 },
                                { wch: 20 },
                                { wch: 20 },
                                { wch: 20 },
                                { wch: 20 },
                                { wch: 20 },
                                { wch: 20 },
                                { wch: 20 },
                            ]
                        },
                        {
                            max_num_columns: 4,
                            sheet_name: "Country Data",
                            body_data: [],
                            cols: [
                                { wch: 30 },
                                { wch: 20 },
                                { wch: 30 },
                                { wch: 20 },
                            ]
                        },
                        {
                            max_num_columns: 4,
                            sheet_name: "Shipping Types",
                            body_data: [],
                            shipping_group: {
                                _id:    shipping_group_result.body._id.toString(),
                                name:   shipping_group_result.body.name
                            },
                            cols: [
                                { wch: 30 },
                                { wch: 20 },
                            ]
                        }
                    ];
                    let item_country = null;
                    let index_state = -1;
                    for (const [index_rate, item_rate] of shipping_rate_result.body.entries()) {
                        
                        if( index_rate === 0 || ( index_rate > 0 && ( shipping_rate_result.body[index_rate - 1].country_code != item_country.iso_code_2 || shipping_rate_result.body[index_rate - 1].country_code != item_country.iso_code_3 ) ) ){

                            item_country = country_result.body.find( (item) => item.iso_code_2 === item_rate.country_code || item.iso_code_3 === item_rate.country_code );
                        }
                        index_state = item_country.states.findIndex( (item) => item.iso_code === item_rate.state_code );
                        let shipping_type_index = shipping_type_result.body.findIndex( (item) => item.name === item_rate.name );

                        data_file[item_rate.rate_type === 'standard' ? 0 : 1].body_data.push( formatShippingRateFile(item_rate, item_country, index_state, shipping_type_index) );
                    };
                    data_file[2].body_data = [].concat.apply( [], country_result.body.map( (item_country) => {

                        if( item_country.states.length > 0 ) {

                            return item_country.states.map( (item_state) => {

                                return {
                                    row: {
                                        columns:[
                                            { name: "country_name", value: item_country.name,       index_column: 0, num_columns: 1, num_rows: 1 },
                                            { name: "country_code", value: item_country.iso_code_2, index_column: 1, num_columns: 1, num_rows: 1 },
                                            { name: "state_name",   value: item_state.name,         index_column: 2, num_columns: 1, num_rows: 1 },
                                            { name: "state_code",   value: item_state.iso_code,     index_column: 3, num_columns: 1, num_rows: 1 }
                                        ]
                                    }
                                }
                            });
                        }
                        else{

                            return {
                                row: {
                                    columns:[
                                        { name: "country_name", value: item_country.name,       index_column: 0, num_columns: 1, num_rows: 1 },
                                        { name: "country_code", value: item_country.iso_code_2, index_column: 1, num_columns: 1, num_rows: 1 },
                                        { name: "state_name",   value: "",                      index_column: 2, num_columns: 1, num_rows: 1 },
                                        { name: "state_code",   value: "",                      index_column: 3, num_columns: 1, num_rows: 1 }
                                    ]
                                }
                            };
                        }
                    }) );
                    data_file[3].body_data = shipping_type_result.body.map( (item_type, index_type) => {
                        return {
                            row: {
                                columns:[
                                    { name: "index_type",   value: index_type,      index_column: 0, num_columns: 1, num_rows: 1 },
                                    { name: "type_name",    value: item_type.name,  index_column: 1, num_columns: 1, num_rows: 1 }
                                ]
                            }
                        }
                    } );
                    await excel.createExcelFile( `Group - ${ shipping_group_result.body.name } - Shipping Rates List`, '/documents/templates/excel/format-shipping-rates-list.xlsx', data_file, null, 2, formatBodyRateFile, 'en-US', 'USD' ).then( (format_file) => {
                        
                        res.status(200).json( utils.format.formatResponseRequest( true, format_file, 200, "Success: Shipping Rates File", "Shipping Rates File Downloaded" ) );
                    }).catch( (format_file_error) => {
                        
                        res.status(400).send( utils.format.formatResponseRequest( false, format_file_error, 400, "Error: Shipping Rates File", "Shipping Rates File not Downloaded, Excel File not created" ) );
                    });
                }).catch( (country_error) => {

                    res.status(400).send( utils.format.formatResponseRequest( false, country_error, 400, "Error: Shipping Rates File", "Shipping Rates File not Downloaded, Countries not found" ) );
                })
            }).catch( (shipping_type_error) => {

                res.status(400).send( utils.format.formatResponseRequest( false, shipping_type_error, 400, "Error: Shipping Rates File", "Shipping Rates File not Downloaded, Shipping Types not found" ) );
            });
        }).catch( (shipping_rate_error) => {

            res.status(400).send( utils.format.formatResponseRequest( false, shipping_rate_error, 400, "Error: Shipping Rates File", "Shipping Rates File not Downloaded, Shipping Rates not found" ) );
        });
    }).catch( (shipping_group_error) => {

        res.status(400).send( utils.format.formatResponseRequest( false, shipping_group_error, 400, "Error: Shipping Rates File", "Shipping Rates File not Downloaded, Shipping Groups not found" ) );
    });
};
/**
* 
* @param {*} req 
* @param {*} res 
*/
async function deleteShippingRateFile(req, res){

    await shippingGroupService.findOne({ shopify_id: req.params.group_id }, { _id: 1, name: 1 }).then( async (shipping_group_result) => {

        await utils.files.deleteFile( `./public/downloads/`, `Group - ${ shipping_group_result.body.name } - Shipping Rates List.xlsx`, 'xlsx').then( (delete_file) => {
        
            res.status(200).json( delete_file );
        }).catch( (delete_file_error) => {

            delete_file_error.title     = "Error: Delete File";
            delete_file_error.message   = "Shipping Rates File not Deleted";
            res.status(400).send( delete_file_error );
        });
    }).catch( (shipping_group_error) => {

        res.status(400).send( utils.format.formatResponseRequest( false, shipping_group_error, 400, "Error: Delete File", "Shipping Rates File not Deleted, Shipping Group not found" ) );
    });
};
// =============================================================================
// GENERAL FUNCTIONS
// =============================================================================
/**
 * 
 * @param {*} item_zone 
 * @returns 
 */
function formatItemFrontAdminShippingCountry( item_zone ){

    item_zone.name = item_zone.name != '' ? item_zone.name : "Shipping Zone"
    let new_item_zone = {
        zone_data   : item_zone.zone_data,
        type        : "country",
        country_data: item_zone.country_data,
        selected    : false,
        show        : true,
        all_states  : false,
        expanded    : false,
        states: item_zone.country_data.states.length > 0 ? item_zone.country_data.states.map( (item_zone_child) => {

            return formatItemFrontAdminShippingState( item_zone_child, item_zone.country_data );
        }) : []
    };
    return new_item_zone;
};
/**
 * @param {*} item_state
 * @param {*} parent_country
 * @returns 
 */
function formatItemFrontAdminShippingState( item_state, parent_country ){

    let new_item_state = {
        type        : "state",
        country_data: parent_country,
        state_data  : item_state,
        selected    : false,
        show        : true
    };
    return new_item_state;
};
/**
 * 
 * @param {*} item_rate 
 * @param {*} item_country 
 * @param {*} index_state 
 * @param {*} shipping_type_index 
 * @returns 
 */
function formatShippingRateFile(item_rate, item_country, index_state, shipping_type_index){

    if( item_rate.rate_type === "standard" ){

        item_rate = {
            row: { 
                columns: [ 
                    { name: "_id",                  value: item_rate._id.toString(),                                            index_column: 0,    num_columns: 1, num_rows: 1 }, 
                    { name: "country_name",         value: item_country.name,                                                   index_column: 1,    num_columns: 1, num_rows: 1 }, 
                    { name: "country_code",         value: item_rate.country_code,                                              index_column: 2,    num_columns: 1, num_rows: 1 }, 
                    { name: "state_name",           value: index_state < 0 ? "" : item_country.states[index_state].name,        index_column: 3,    num_columns: 1, num_rows: 1 }, 
                    { name: "state_code",           value: index_state < 0 ? "" : item_country.states[index_state].iso_code,    index_column: 4,    num_columns: 1, num_rows: 1 }, 
                    { name: "zip_code",             value: item_rate.zip_code === null ? "" : item_rate.zip_code,                index_column: 5,    num_columns: 1, num_rows: 1 }, 
                    { name: "shipping_type_index",  value: shipping_type_index,                                                 index_column: 6,    num_columns: 1, num_rows: 1 }, 
                    { name: "shipping_name",        value: item_rate.name,                                                      index_column: 7,    num_columns: 1, num_rows: 1 }, 
                    { name: "price",                value: item_rate.price,                                                     index_column: 8,    num_columns: 1, num_rows: 1 }, 
                    { name: "min_weight",           value: item_rate.min_weight,                                                index_column: 9,    num_columns: 1, num_rows: 1 }, 
                    { name: "need_payment",         value: item_rate.need_payment.toString(),                                   index_column: 10,   num_columns: 1, num_rows: 1 }
                ] 
            }
        };
    }
    else{

        item_rate = {
            row: { 
                columns: [ 
                    { name: "_id",                  value: item_rate._id.toString(),                                            index_column: 0,    num_columns: 1, num_rows: 1 }, 
                    { name: "country_name",         value: item_country.name,                                                   index_column: 1,    num_columns: 1, num_rows: 1 }, 
                    { name: "country_code",         value: item_rate.country_code,                                              index_column: 2,    num_columns: 1, num_rows: 1 }, 
                    { name: "state_name",           value: index_state < 0 ? "" : item_country.states[index_state].name,        index_column: 3,    num_columns: 1, num_rows: 1 }, 
                    { name: "state_code",           value: index_state < 0 ? "" : item_country.states[index_state].iso_code,    index_column: 4,    num_columns: 1, num_rows: 1 }, 
                    { name: "zip_code",             value: item_rate.zip_code === null ? "" : item_rate.zip_code,                index_column: 5,    num_columns: 1, num_rows: 1 },
                    { name: "shipping_type_index",  value: shipping_type_index,                                                 index_column: 6,    num_columns: 1, num_rows: 1 }, 
                    { name: "shipping_name",        value: item_rate.name,                                                      index_column: 7,    num_columns: 1, num_rows: 1 }, 
                    { name: "price",                value: item_rate.price,                                                     index_column: 8,    num_columns: 1, num_rows: 1 }, 
                    { name: "min_total_order",      value: item_rate.min_total_order,                                           index_column: 9,    num_columns: 1, num_rows: 1 }, 
                    { name: "effect_on_price",      value: item_rate.effect_on_price,                                           index_column: 10,   num_columns: 1, num_rows: 1 }, 
                    { name: "need_payment",         value: item_rate.need_payment.toString(),                                   index_column: 11,   num_columns: 1, num_rows: 1 }
                ] 
            }
        };
    }
    return item_rate;
};
/**
 * 
 * @param {*} item_rate 
 * @param {*} type 
 * @returns 
 */
function formatShippingRate( item_rate, type ){

    if( type === "create" ){

        item_rate = {
            group_id        : item_rate.group_id,
            name            : item_rate.name,
            rate_type       : item_rate.rate_type,
            country_code    : item_rate.country_code,
            state_code      : item_rate.state_code,
            zip_code        : item_rate.zip_code,
            price           : item_rate.price,
            min_weight      : item_rate.min_weight,
            min_total_order : item_rate.min_total_order,
            effect_on_price : item_rate.effect_on_price,
            need_payment    : item_rate.need_payment,
        };
    }
    else{

        item_rate = {
            query: { _id: item_rate._id },
            data: {
                price           : item_rate.price,
                min_weight      : item_rate.min_weight,
                min_total_order : item_rate.min_total_order,
                need_payment    : item_rate.need_payment,
            }
        };
    }
    return item_rate;
};
/**
* 
* @param {*} data_template 
* @param {*} template_file { item_sheet, data_sheet, first_reg, arr_columns, index_col, column } 
* @param {*} data_file { file, data_sheet, index_data, item_data }
* @param {*} format_currency { locale, code }
* @returns 
*/
async function formatBodyRateFile( data_template, template_file, data_file, format_currency ){
    
    let formula_excel = null;
    let index_row = parseInt( template_file.first_reg );
    let cell_file = `${ template_file.column }${ index_row + data_file.index_data }`;
    let cell_template = `${ template_file.column }${ template_file.first_reg }`;
    let item_file = data_file.item_data.row.columns.find( (item) => item.index_column === template_file.index_col );
    
    if( item_file ){
        
        if( template_file.item_sheet === 'Standard Rates' || template_file.item_sheet === 'Variant Rates' ){

            if( item_file.name === 'country_code' ){
                
                formula_excel = `VLOOKUP("*"&B${ index_row + data_file.index_data }&"*",'Country Data'!A1:B${ data_file.file[2].body_data.length + 1 },2,FALSE)`;
            }
            else if( item_file.name === 'state_code' ){
                
                formula_excel = `VLOOKUP("*"&D${ index_row + data_file.index_data }&"*",'Country Data'!C1:D${ data_file.file[2].body_data.length + 1 },2,FALSE)`;
            }
            else if( item_file.name === 'shipping_name'){
                
                formula_excel = `VLOOKUP(G${ index_row + data_file.index_data },'Shipping Types'!A1:B${ data_file.file[3].body_data.length + 1 },2,FALSE)`;
            }
        }
        data_template.Sheets[template_file.item_sheet][cell_file] = excel.addCellExcel( data_template, data_template.Sheets[template_file.item_sheet][cell_template], item_file.value, format_currency, formula_excel );
    }
    else if( template_file.item_sheet === 'Shipping Types' && data_file.index_data === 0 && template_file.index_col >= 2 ){

        data_template.Sheets[template_file.item_sheet][cell_file] = excel.addCellExcel( data_template, data_template.Sheets[template_file.item_sheet][cell_template], template_file.index_col === 3 ? data_file.data_sheet.shipping_group._id : data_file.data_sheet.shipping_group.name, format_currency, formula_excel );
    }
    return data_template;
};
// =============================================================================
// EXPORTS
// =============================================================================
module.exports = {
    get:{
        list,
        listTypes,
        listCountries,
        listShippingRates,
        downloadShippingRateFile,
        deleteShippingRateFile
    },
    post:{
        saveCountryShippingRates,
        chargeShippingRates
    },
    put:{
    },
    delete:{
    }
};