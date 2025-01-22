// =============================================================================
// DATA LAYER - INTERFACE
// =============================================================================
const mongoose = require( "../interface/mongoose" ); // Data Access Layer

class CrudLayer{
	/**
	* @description Create an instance of userService
	*/
	constructor ( model, queryPopulate = null) {
		// Create instance of Data Access layer using our desired model
		this.interface = new mongoose( model );
		this.model_name = model.modelName;
		this.queryPopulate = queryPopulate;
	};
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
	* @description Create a new document on the Model
	* @param {object} [body] Body object to create the new document with
	* @returns {{success: boolean, body: *} | {success: boolean, error: *}} { success: boolean, body: any } | { success: boolean, error: any }
	*/
	async create ( body ) {
		try {
			const db_result = await this.interface.create( body );
			return ( { success: true, body: db_result, model_name: this.model_name } );
		}
		catch (db_error) {
			return ( { success: false, error: db_error, model_name: this.model_name } );
		}
	}
	/**
	* @description Update a document matching the provided ID, with the body
	* @param {object} [query] Required: Query to be performed on the Model
	* @param {object} [body] Required: Body to update the document with
	* @param {object} [options] Optional: Options to provide query
	* @returns {{success: boolean, body: *} | {success: boolean, error: *}} { success: boolean, body: any } | { success: boolean, error: any }
	*/
	async update ( query = {}, body, options = { lean: true, new: true } ) {
		try {
			const db_result = await this.interface.update( query, body, options );
			return ( { success: true, body: db_result, model_name: this.model_name } );
		}
		catch (db_error) {
			return ( { success: false, error: db_error, model_name: this.model_name } );
		}
	}
	/**
	* @description Delete an existing document on the Model
	* @param {string} [id] ID for the object to delete
	* @returns {{success: boolean, body: *} | {success: boolean, error: *}} { success: boolean, body: any } | { success: boolean, error: any }
	*/
	async delete ( query ) {
		try {
			const db_result = await this.interface.delete( query );
			return ( { success: true, body: db_result, model_name: this.model_name } );
		}
		catch (db_error) {
			return ( { success: false, error: db_error, model_name: this.model_name } );
		}
	}
	/**
	* @description Remove a document matching the provided ID, with the body
	* @param {string} [id] ID for the object to remove
	* @returns {{success: boolean, body: *} | {success: boolean, error: *}} { success: boolean, body: any } | { success: boolean, error: any }
	*/
	async remove ( query ) {
		try {
			const db_result = await this.interface.remove( query );
			return ( { success: true, body: db_result, model_name: this.model_name } );
		}
		catch (db_error) {
			return ( { success: false, error: db_error, model_name: this.model_name } );
		}
	}
	/**
	* @description Update a document matching the provided ID, with the body
	* @param {object} [query] Required: Query to be performed on the Model
	* @param {object} [val_status] Required: Value of the new status
	* @param {object} [options] Optional: Options to provide query
	* @returns {{success: boolean, body: *} | {success: boolean, error: *}} { success: boolean, body: any } | { success: boolean, error: any }
	*/
	async updateStatus ( query = {}, val_status, options = { lean: true, new: true } ) {
		try {
			const db_result = await this.interface.update( query, { status: val_status }, options );
			return ( { success: true, body: db_result, model_name: this.model_name } );
		}
		catch (db_error) {
			return ( { success: false, error: db_error, model_name: this.model_name } );
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
			return ( { success: true, body: db_result, model_name: this.model_name } );
		}
		catch (db_error) {
			return ( { success: false, error: db_error, model_name: this.model_name } );
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
			return ( { success: true, body: db_result, model_name: this.model_name } );
		}
		catch (db_error) {
			return ( { success: false, error: db_error, model_name: this.model_name } );
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
			options.populate 	= options.populate != this.queryPopulate ? options.populate : this.queryPopulate;
			options.lean 		= options.lean ? options.lean : true;

			const db_result 	= await this.interface.findOne( query, projection, options );
			return ( { success: true, body: db_result, model_name: this.model_name } );
		}
		catch (db_error) {
			console.log( db_error );
			return ( { success: false, error: db_error, model_name: this.model_name } );
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
			return ( { success:  db_result ? true : false, body: db_result, model_name: this.model_name } );
		}
		catch (db_error) {
			return ( { success: false, error: db_error, model_name: this.model_name } );
		}
	}
};
module.exports = CrudLayer;