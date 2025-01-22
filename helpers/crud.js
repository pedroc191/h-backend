// =============================================================================
// HELPERS
// =============================================================================
const h_response    = require("./response");
/**
 * 
 * @param {*} model_name 
 * @param {*} model_service 
 * @param {*} query 
 * @param {*} fields 
 * @param {*} options 
 * @param {*} formatDocument 
 * @param {*} additional_data_format 
 * @returns 
 */
async function listDocuments(model_name, model_service, query = {}, fields = null, options = null, formatDocument = undefined, additional_data_format = null) {

    if( options?.paginated ){

        return await paginateDocuments(model_name, model_service, query, fields, options, formatDocument, additional_data_format);
    }
    else{

        return await findDocuments(model_name, model_service, query, fields, options, formatDocument, additional_data_format);
    }
};
/**
 * 
 * @param {*} model_name 
 * @param {*} model_service 
 * @param {*} query 
 * @param {*} fields 
 * @param {*} options 
 * @param {*} formatDocument 
 * @param {*} additional_data_format 
 * @returns 
 */
async function paginateDocuments(model_name, model_service, query = {}, fields = null, options = null, formatDocument = undefined, additional_data_format = null) {
    /*
    {
        query: Object,
        fields: Object,
        options: {
            paginated: {
                page: Number,
                per_page: Number,
            },
            sort: Object,
            populate: Object,
            lean: Boolean
        }
    }
    */
    try {
        let basic_options = {...options};
        delete basic_options.paginated;
        delete basic_options.sort;
        
        basic_options = Object.keys(basic_options).length > 0 ? basic_options : undefined;
        let documents_result = await model_service.findPaginate( query, options.paginated.page, options.paginated.per_page, fields, options.sort, basic_options );
        
        if( documents_result.success ){
            
            if( formatDocument != undefined){
                
                let all_documents = [];
                for (const item_document of documents_result.body.documents) {
                    
                    let new_document = await formatDocument(item_document, additional_data_format);
                    if( new_document.success ){
                        
                        all_documents.push(new_document.body);
                    }
                }
                documents_result.body.documents = all_documents;
            }
            return( h_response.request(true, documents_result.body, 200, `Success: ${ model_name } Request`, `${ model_name } found successfully`) );
        }
        else{
            
            return( h_response.request(false, documents_result, 400, `Error: ${ model_name } Request`, `${ model_name } not found`) );
        }
    } catch (process_error) {
        
        return( h_response.request(false, process_error, 400, `Error: ${ model_name } Request`, `${ model_name } not found`) );
    }
};
/**
 * 
 * @param {*} model_name 
 * @param {*} model_service 
 * @param {*} query 
 * @param {*} fields 
 * @param {*} options 
 * @param {*} formatDocument 
 * @param {*} additional_data_format 
 * @returns 
 */
async function findDocuments(model_name, model_service, query = {}, fields = null, options = null, formatDocument = undefined, additional_data_format = null) {
    
    try {
        let documents_result = await model_service.find(query, fields, options);
        
        if( documents_result.success ){
            
            if( formatDocument != undefined){
                
                let all_documents = [];
                for (const item_document of documents_result.body) {
                    
                    let new_document = await formatDocument(item_document, additional_data_format);
                    if( new_document.success ){
                        
                        all_documents.push(new_document.body);
                    }
                }
                documents_result.body = all_documents;
            }
            return( h_response.request(true, documents_result.body, 200, `Success: ${ model_name } Request`, `${ model_name } found successfully`) );
        }
        else{
            
            return( h_response.request(false, documents_result, 400, `Error: ${ model_name } Request`, `${ model_name } not found`) );
        }
    } catch (process_error) {
        
        return( h_response.request(false, process_error, 400, `Error: ${ model_name } Request`, `${ model_name } not found`) );
    }
};
/**
* 
* @param {*} model_name 
* @param {*} model_service 
* @param {*} query 
* @param {*} formatDocument 
* @returns 
*/
async function findDocument(model_name, model_service, query = {}, fields = null, options = undefined, formatDocument = undefined, additional_data_format = null) {
    
    try {

        fields = fields || null;
        let document_result = await model_service.findOne(query, fields, options);
        
        if( document_result.body != null ){
            
            if( formatDocument != undefined){
                
                let new_document = await formatDocument(document_result.body, additional_data_format);
                if( new_document.success ){
                    
                    document_result.body = new_document.body;
                }
            }
            return( h_response.request(true, document_result.body, 200, `Success: ${ model_name } Request`, `${ model_name } found successfully`) );
        }
        else{
            
            return( h_response.request(false, document_result, 400, `Error: ${ model_name } Request`, `${ model_name } not found`) );
        }
    } catch (process_error) {
        
        return( h_response.request(false, process_error, 400, `Error: ${ model_name } Request`, `${ model_name } not found`) );
    }
};
/**
* 
* @param {String} [model_name] 
* @param {Object} [model_service] 
* @param {Object} [query] 
* @param {Object} [create_data] 
* @param {Boolean} [exist_document_error] 
* @returns 
*/
async function createDocument(model_name, model_service, query, create_data, exist_document_error = true) {
    
    try {
        let document_result = await model_service.findOne(query, null, { populate: null });
        
        if( document_result.success && document_result.body != null && exist_document_error ){
            
            return( h_response.request(false, document_result, 400, `Error: ${ model_name } Request`, `${ model_name } exist`) );
        }
        else if( document_result.success && document_result.body != null && !exist_document_error ){
            
            return( h_response.request(true, document_result.body, 200, `Success: ${ model_name } Request`, `${ model_name } exist`) );
        }
        else if( document_result.body === null ){
            
            let document_created = await model_service.create(create_data);
            
            if( document_created.success && document_created.body ){
                
                return( h_response.request(true, document_created.body, 200, `Success: ${ model_name } Request`, `${ model_name } created successfully`) );
            }
            else{
                
                return( h_response.request(false, document_created, 400, `Error: ${ model_name } Request`, `${ model_name } not created`) );
            }
        }
        else{
            
            return( h_response.request(false, document_result, 400, `Error: ${ model_name } Request`, `${ model_name } not found`) );
        }
    } catch (process_error) {
        
        return( h_response.request(false, process_error, 400, `Error: ${ model_name } Request`, `${ model_name } not created`) );
    }
};
/**
* 
* @param {*} model_name 
* @param {*} model_service 
* @param {*} query 
* @param {*} update_data 
* @returns 
*/
async function updateDocument(model_name, model_service, query, update_data) {
    
    try {
        let document_updated = await model_service.update(query, update_data);
        
        if( document_updated.body != null ){
            
            let document_result = await model_service.findOne(query, null, { populate: null });
            
            if( document_result.body != null ){
                
                return( h_response.request(true, document_result.body, 200, `Success: ${ model_name } Request`, `${ model_name } updated successfully`) );
            }
            else{
                
                return( h_response.request(false, document_updated, 400, `Error: ${ model_name } Request`, `${ model_name } not found`) );
            }
        }
        else{
            
            return( h_response.request(false, document_updated, 400, `Error: ${ model_name } Request`, `${ model_name } not updated`) );
        }
    } catch (process_error) {
        
        return( h_response.request(false, process_error, 400, `Error: ${ model_name } Request`, `${ model_name } not updated`) );
    }
};
/**
* 
* @param {*} model_name 
* @param {*} model_service 
* @param {*} query 
* @returns 
*/
async function deleteDocument(model_name, model_service, query) {
    
    try {
        let document_deleted = await model_service.delete(query);
        
        if( document_deleted.success ){
            
            return( h_response.request(true, document_deleted.body, 200, `Success: ${ model_name } Request`, `${ model_name } deleted successfully`) );
        }
        else{
            
            return( h_response.request(false, document_deleted, 400, `Error: ${ model_name } Request`, `${ model_name } not deleted`) );
        }
    } catch (process_error) {
        
        return( h_response.request(false, process_error, 400, `Error: ${ model_name } Request`, `${ model_name } not deleted`) );
    }
};
/**
* 
* @param {*} model_name 
* @param {*} model_service 
* @param {*} query 
* @returns 
*/
async function removeDocument(model_name, model_service, query) {

    try {
        let document_removed = await model_service.remove(query);
        
        if( document_removed.success ){
            
            return( h_response.request(true, document_removed.body, 200, `Success: ${ model_name } Request`, `${ model_name } deleted successfully`) );
        }
        else{
            
            return( h_response.request(false, document_removed, 400, `Error: ${ model_name } Request`, `${ model_name } not deleted`) );
        }
    } catch (process_error) {
        
        return( h_response.request(false, process_error, 400, `Error: ${ model_name } Request`, `${ model_name } not deleted`) );
    }
};
module.exports = {
    listDocuments,
    findDocument,
    createDocument,
    updateDocument,
    deleteDocument,
    removeDocument
};