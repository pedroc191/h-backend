// =============================================================================
// DATA LAYER - SYNC DATA
// =============================================================================
const mongoose = require( "../interface/mongoose" ); // Data Access Layer

class SyncLayer {
	
	constructor( model, queryPopulate = null ){
		
		this.interface = new mongoose( model );
		this.model_name = model.modelName;
		this.queryPopulate = queryPopulate;
	}
	/**
	* @description Create a new document on the Model
	* @param {array} [pipeline] Aggregate pipeline to execute
	* @returns {{success: boolean, body: *} | {success: boolean, error: *}} { success: boolean, body: any } | { success: boolean, error: any }
	*/
	async aggregate ( pipeline ) {
		try {
			const db_result = await this.interface.aggregate( pipeline );
			return ( { success: true, body: db_result, model_name: this.model_name } );
		}
		catch (db_error) {
			return ( { success: false, error: db_error, model_name: this.model_name } );
		}
	}
	/**
	* @description Count the number of documents matching the query criteria
	* @param {object} [query] Query to be performed on the Model
	* @returns {{success: boolean, body: *} | {success: boolean, error: *}} { success: boolean, body: any } | { success: boolean, error: any }
	*/
	async count ( query = {} ) {
		try {
			const db_result = await this.interface.count( query );
			return( { success: true, body: db_result, model_name: this.model_name } );
		}
		catch (db_error) {
			return( { success: false, error: db_error, model_name: this.model_name } );
		}
	}
	/**
	* @description Create a new document on the Model
	* @param {object} [body] Body object to create the new document with
	* @returns {{success: boolean, body: *} | {success: boolean, error: *}} { success: boolean, body: any } | { success: boolean, error: any }
	*/
	async create ( body ) {
		try {
			const db_result = await this.interface.create( body );
			return( { success: true, body: db_result, model_name: this.model_name } );
		}
		catch (db_error) {
			return( { success: false, error: db_error, model_name: this.model_name } );
		}
	}
	/**
	* @description Remove a document matching the provided ID, with the body
	* @param {string} [id] ID for the object to remove
	* @returns {{success: boolean, body: *} | {success: boolean, error: *}} { success: boolean, body: any } | { success: boolean, error: any }
	*/
	async remove ( id ) {
		try {
			const db_result = await this.interface.remove( id );
			return( { success: true, body: db_result, model_name: this.model_name } );
		}
		catch (db_error) {
			return( { success: false, error: db_error, model_name: this.model_name } );
		}
	}
	/**
	* @description Update a document matching the provided ID, with the body
	* @param {object} [query] Required: Query to be performed on the Model
	* @param {object} [body] Required: Body to update the document with
	* @param {object} [options] Optional: Options to provide query
	* @returns {{success: boolean, body: *} | {success: boolean, error: *}} { success: boolean, body: any } | { success: boolean, error: any }
	*/
	async update ( query, body, options = { lean: true, new: true } ) {
		try {
			const db_result = await this.interface.update( query, body, options );
			return( { success: true, body: db_result, model_name: this.model_name } );
		}
		catch (db_error) {
			return( { success: false, error: db_error, model_name: this.model_name } );
		}
	}
	/**
	* @description Delete an existing document on the Model
	* @param {string} [id] ID for the object to delete
	* @returns {{success: boolean, body: *} | {success: boolean, error: *}} { success: boolean, body: any } | { success: boolean, error: any }
	*/
	async delete ( id ) {
		try {
			const db_result = await this.interface.delete( id );
			return( { success: true, body: db_result, model_name: this.model_name } );
		}
		catch (db_error) {
			return( { success: false, error: db_error, model_name: this.model_name } );
		}
	}
	/**
	* @description Update a document matching the provided ID, with the body
	* @param {object} [query] Required: Query to be performed on the Model
	* @param {object} [val_status] Required: Value of the new status
	* @param {object} [options] Optional: Options to provide query
	* @returns {{success: boolean, body: *} | {success: boolean, error: *}} { success: boolean, body: any } | { success: boolean, error: any }
	*/
	async updateStatus ( query, val_status, options = { lean: true, new: true } ) {
		try {
			const db_result = await this.interface.update( query, { status: val_status }, options );
			return( { success: true, body: db_result, model_name: this.model_name } );
		}
		catch (db_error) {
			return( { success: false, error: db_error, model_name: this.model_name } );
		}
	}
	/**
	* @description Retrieve multiple documents from the Model with the provided query
	* @param {object} [query] - Query to be performed on the Model
	* @param {object} [projection] Optional: Fields to return or not return from query
	* @param {object} [sort] - Optional argument to sort data
	* @param {object} [options] Optional options to provide query
	* @returns {{success: boolean, body: *} | {success: boolean, error: *}} { success: boolean, body: any } | { success: boolean, error: any }
	*/
	async find ( query = {}, projection = { __v: 0 }, sort = { _id: 1 }, options = { lean: true, populate: this.queryPopulate } ) {
		try {
			options.populate = options.populate != this.queryPopulate ? options.populate : this.queryPopulate;
			options.lean = options.lean ? options.lean : true;
			
			const db_result = await this.interface.find( query, projection, sort, options );
			
			return( { success: true, body: db_result, model_name: this.model_name } );
		}
		catch (db_error) {
			return( { success: false, error: db_error, model_name: this.model_name } );
		}
	}
	/**
	* @description Retrieve multiple documents from the Model with the provided query include the deleted
	* @param {object} [query] - Query to be performed on the Model
	* @param {object} [projection] Optional: Fields to return or not return from query
	* @param {object} [sort] - Optional argument to sort data
	* @param {object} [options] Optional options to provide query
	* @returns {{success: boolean, body: *} | {success: boolean, error: *}} { success: boolean, body: any } | { success: boolean, error: any }
	*/
	async findDelete ( query = {}, projection = { __v: 0 }, sort = { _id: 1 }, options = { lean: true, populate: this.queryPopulate } ) {
		try {
			options.populate = options.populate != this.queryPopulate ? options.populate : this.queryPopulate;
			options.lean = options.lean ? options.lean : true;
			
			const db_result = await this.interface.findDelete( query, projection, sort, options );
			
			return( { success: true, body: db_result, model_name: this.model_name } );
		}
		catch (db_error) {
			return( { success: false, error: db_error, model_name: this.model_name } );
		}
	}
	/**
	* @description Retrieve a single document from the Model with the provided query
	* @param {object} [query] Query to be performed on the Model
	* @param {object} [projection] Optional: Fields to return or not return from query
	* @param {object} [options] Optional options to provide query
	* @returns {{success: boolean, body: *} | {success: boolean, error: *}} { success: boolean, body: any } | { success: boolean, error: any }
	*/
	async findOne ( query = {}, projection = { __v: 0 }, options = { lean: true, populate: this.queryPopulate } ) {
		try {
			options.populate = options.populate != this.queryPopulate ? options.populate : this.queryPopulate;
			options.lean = options.lean ? options.lean : true;
			
			const db_result = await this.interface.findOne( query, projection, options );
			
			return( { success: true, body: db_result, model_name: this.model_name } );
		}
		catch (db_error) {
			console.log( db_error );
			return( { success: false, error: db_error, model_name: this.model_name } );
		}
	}
	/**
	* @description Retrieve a single document from the Model with the provided query, even if its deleted
	* @param {object} [query] Query to be performed on the Model
	* @param {object} [projection] Optional: Fields to return or not return from query
	* @param {object} [options] Optional options to provide query
	* @returns {{success: boolean, body: *} | {success: boolean, error: *}} { success: boolean, body: any } | { success: boolean, error: any }
	*/
	async findOneDelete ( query = {}, projection = { __v: 0 }, options = { lean: true, populate: this.queryPopulate } ) {
		try {
			options.populate = options.populate != this.queryPopulate ? options.populate : this.queryPopulate;
			options.lean = options.lean ? options.lean : true;
			
			const db_result = await this.interface.findOneDelete( query, projection, options );
			
			return( { success: db_result ? true : false, body: db_result, model_name: this.model_name } );
		}
		catch (db_error) {
			return( { success: false, error: db_error, model_name: this.model_name } );
		}
	}
	/**
	* @description Retrieve multiple documents from the Model with the provided query
	* @param {object} [query] - Query to be performed on the Model
	* @param {object} [page] - Optional argument to page number
	* @param {object} [per_page] - Optional argument to documents per page
	* @param {object} [fields] Optional: Fields to return or not return from query
	* @param {object} [sort] - Optional argument to sort data
	* @param {object} [options] Optional options to provide query
	* @returns {{success: boolean, body: *} | {success: boolean, error: *}} { success: boolean, body: any } | { success: boolean, error: any }
	*/					 
	async findPaginate ( query = {}, page = 1, per_page = 0, fields = { __v: 0 }, sort = { _id: 1 }, options = { lean: true, populate: this.queryPopulate } ) {
		try {
			options.populate 	= options.populate != this.queryPopulate ? options.populate : this.queryPopulate;
			options.lean 		= options.lean ? options.lean : true;
			
			let skip_page   	= ( page - 1 ) * per_page;
			const result_page 	= await this.interface.findPaginate( query, fields, sort, options, skip_page, per_page );
			try {
				const result_count 	= await this.count( query );
				
				if( result_count.success ){
					console.log( result_count.body );
					per_page = per_page === 0 ? result_count.body : per_page;
					let total_pages	= Math.ceil( result_count.body / per_page ) * per_page < result_count.body ? Math.ceil( result_count.body / per_page ) + 1 : Math.ceil( result_count.body / per_page );
					
					console.log( total_pages, per_page, result_count.body );
					let result_paginated = {
						documents		: result_page,
						total_documents	: result_count.body,
						total_pages		: total_pages,
						next_page		: [null, 1, 0, page].includes( total_pages ) ? null : page + 1,
						previous_page	: page === 1 ? null : page - 1,
						current_page	: page,
						per_page		: per_page,
						from_document	: page === 1 ? 0 : skip_page,
						to_document		: [null, 1, 0, page].includes( total_pages ) ? result_count.body : ( page * per_page ) - 1
					};
					return( { success: true, body: result_paginated, model_name: this.model_name } );
				}
				else{
					return( { success: false, error: result_count.error, model_name: this.model_name } );
				}
			}
			catch (db_error) {
				return( { success: false, error: db_error, model_name: this.model_name } );
			}
		}
		catch (db_error) {
			return( { success: false, error: db_error, model_name: this.model_name } );
		}
	}
	/**
	* @description Create multiple documents in the model
	* @param {*} [array_docs] Required: Documents to insert in the model
	* @param {*} [options] Optional: options to provide query
	* @returns {{success: boolean, body: *} | {success: boolean, error: *}} { success: boolean, body: any } | { success: boolean, error: any }
	*/
	async createMany ( array_docs, options = null ){
		try {
			const db_result = await this.interface.createMany( array_docs, options );
			
			return { success: true, body: db_result, model_name: this.model_name };
		} catch (db_error) {
			
			return { success: false, error: db_error, model_name: this.model_name };
		}
	}
	/**
	* @description Update multiple documents in the model
	* @param {object} [query] Required: Query to be performed on the Model
	* @param {*} [body] Required: Documents to insert in the model
	* @param {*} [options] Optional: options to provide query
	* @returns {{success: boolean, body: *} | {success: boolean, error: *}} { success: boolean, body: any } | { success: boolean, error: any }
	*/
	async updateMany ( query, body, options = null ){
		try {
			const db_result = await this.interface.updateMany( query, body, options );
			
			return { success: true, body: db_result, model_name: this.model_name };
		} catch (db_error) {
			
			return { success: false, error: db_error, model_name: this.model_name };
		}
	}
	/**
	* @description Delete multiple documents in the model
	* @param {object} [query] Query for selecting the documents to delete
	* @param {object} [options] Optional: options to provide query
	* @returns {{success: boolean, body: *} | {success: boolean, error: *}} { success: boolean, body: any } | { success: boolean, error: any }
	*/
	async deleteMany ( query, options = null ){
		try {
			const db_result = await this.interface.deleteMany( query, options );
			
			return { success: true, body: db_result, model_name: this.model_name };
		} catch (db_error) {
			
			return { success: false, error: db_error, model_name: this.model_name };
		}
	}
	/**
	* @description Remove multiple documents in the model
	* @param {object} [query] Query for selecting the documents to remove
	* @param {object} [options] Optional: options to provide query
	* @returns {{success: boolean, body: *} | {success: boolean, error: *}} { success: boolean, body: any } | { success: boolean, error: any }
	*/
	async removeMany ( query, options = null ){
		try {
			const db_result = await this.interface.removeMany( query, options );
			
			return { success: true, body: db_result, model_name: this.model_name };
		} catch (db_error) {
			
			return { success: false, error: db_error, model_name: this.model_name };
		}
	}
}
module.exports = SyncLayer;