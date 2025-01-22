class Mongoose {
	/**
	* @description Create an instance of the MongooseLayer class
	* @param Model {Mongoose.model} Mongoose Model to use for the instance
	*/
	constructor ( Model ) {

		this.model = Model;
	}
	/**
	* @description Create a new document on the Model
	* @param {array} [pipeline] Aggregate pipeline to execute
	* @returns {Promise} Returns the results of the query
	*/
	aggregate ( pipeline ) {

		return this.model.aggregate( pipeline ).exec();
	}
	/**
	* @description Count the number of documents matching the query criteria
	* @param {object} [query] Query to be performed on the Model
	* @returns {Promise} Returns the results of the query
	*/
	count ( query ) {

		return this.model.countDocuments( query ).exec();
	}
	/**
	* @description Create a new document on the Model
	* @param {object} [body] Body object to create the new document with
	* @returns {Promise} Returns the results of the query
	*/
	create ( body ) {

		body.created_at = !body.created_at ? new Date() : body.created_at;
		body.updated_at = !body.updated_at ? new Date() : body.updated_at;
		return this.model.create( body );
	}
	/**
	* @description Update a document matching the provided ID, with the body
	* @param {object} [query] Query to be performed on the Model
	* @param {object} [body] Body to update the document with
	* @param {object} [options] Optional options to provide query
	* @returns {Promise} Returns the results of the query
	*/
	update ( query, body, options = null ) {

		body.updated_at = !body.updated_at ? new Date() : body.updated_at;
		return this.model.updateOne( query, { $set: body }, options ).exec();
	}
	/**
	* @description Delete an existing document on the Model
	* @param {string} [id] ID for the object to delete
	* @returns {Promise} Returns the results of the query
	*/
	delete ( id ) {

		return this.model.updateOne( { _id: id }, { $set: { deleted: true, deleted_at: new Date() } }, null ).exec();
	}
	/**
	* @description Remove an existing document on the Model
	* @param {string} [id] ID for the object to remove
	* @returns {Promise} Returns the results of the query
	*/
	remove ( id ) {

		return this.model.deleteOne( { _id: id } ).exec();
	}
	/**
	* @description Retrieve multiple documents from the Model with the provided query
	* @param {object} [query] - Query to be performed on the Model
	* @param {object} [fields] Optional: Fields to return or not return from query
	* @param {object} [sort] - Optional argument to sort data
	* @param {object} [options] Optional options to provide query
	* @param {function} [func_map] Optional func_map  
	* @returns {Promise} Returns the results of the query
	*/
	find ( query, fields = { __v: 0 }, sort = { _id: 1 }, options = { lean: true } ) {

		query.deleted = false;
		return this.model.find( query, fields, options ).sort( sort ).exec();
	}
	/**
	* @description Retrieve a single document from the Model with the provided query
	* @param {object} [query] Query to be performed on the Model
	* @param {object} [fields] Optional: Fields to return or not return from query
	* @param {object} [options] Optional options to provide query
	* @returns {Promise} Returns the results of the query
	*/
	findOne ( query, fields = { __v: 0 }, options = { lean: true } ) {

		query.deleted = false;
		return this.model.findOne( query, fields, options ).select( { __v: 0 } ).exec();
	}
	/**
	* @description Retrieve a single document matching the provided ID, from the Model
	* @param {string} [id] Required: ID for the object to retrieve
	* @param {object} [fields] Optional: Fields to return or not return from query
	* @param {object} [options] Optional: options to provide query
	* @returns {Promise} Returns the results of the query
	*/
	findById ( id, fields = { __v: 0 }, options = { lean: true } ) {

		return this.model.findById( id, fields, options ).exec();
	}
	/**
	* @description Retrieve distinct "fields" which are in the provided status
	* @param {string} [field] The distinct field to retrieve
	* @param {object} [query] Object that maps to the status to retrieve docs for
	* @returns {Promise} Returns the results of the query
	*/
	findDistinct ( field, query ) {

		return this.model.distinct( field, query ).exec();
	}
	/**
	* @description Retrieve multiple documents from the Model with the provided query
	* @param {object} [query] - Query to be performed on the Model
	* @param {object} [fields] Optional: Fields to return or not return from query
	* @param {object} [sort] - Optional argument to sort data
	* @param {function} [func_map] Optional func_map 
	* @param {object} [options] Optional options to provide query
	* @returns {Promise} Returns the results of the query
	*/
	findDelete ( query, fields = { __v: 0 }, sort = { _id: 1 }, options = { lean: true } ) {

		return this.model.find( query, fields, options ).sort( sort ).select( { __v: 0 } ).exec();
	}
	/**
	* @description Retrieve a single document from the Model with the provided query
	* @param {object} [query] Query to be performed on the Model
	* @param {object} [fields] Optional: Fields to return or not return from query
	* @param {object} [options] Optional options to provide query
	* @returns {Promise} Returns the results of the query
	*/
	findOneDelete ( query, fields = { __v: 0 }, options = { lean: true } ) {

		return this.model.findOne( query, fields, options ).select( { __v: 0 } ).exec();
	}
	/**
	* @description Retrieve multiple documents from the Model with the provided query
	* @param {object} [query] - Query to be performed on the Model
	* @param {object} [fields] Optional: Fields to return or not return from query
	* @param {object} [sort] - Optional argument to sort data
	* @param {object} [options] Optional options to provide query
	* @param {object} [skip] - Optional argument to skip data
	* @param {object} [per_page] - Optional argument to documents per page
	* @returns {Promise} Returns the results of the query
	*/
	findPaginate ( query, fields = { __v: 0 }, sort = { _id: 1 }, options = { lean: true }, skip = 0, per_page = 150 ) {
		
		query.deleted = false;
		return this.model.find( query, fields, options ).sort( sort ).skip( skip ).limit( per_page ).select( { __v: 0 } ).exec();
	}
	/**
	* @description
	* @param {array} [array_docs] Documents to insert in the model
	* @param {object} [options] Optional: options to provide query
	* @returns  {Promise} Returns the results of the query
	*/
	createMany ( array_docs, options = null ){
		
		return this.model.insertMany( array_docs, options );
	}
	/**
	* @description
	* @param {object} [query] query for selecting the documents to delete
	* @param {object} [options] Optional: options to provide query
	* @returns  {Promise} Returns the results of the query
	*/
	removeMany ( query, options = null ){
		
		return this.model.deleteMany( query, options ).exec();
	}
	/**
	* @description
	* @param {object} [query] Query to be performed on the Model
	* @param {array} [body] Body to update the document with
	* @param {object} [options] Optional: options to provide query
	* @returns  {Promise} Returns the results of the query
	*/
	updateMany ( query, body, options = null ){

		body.updated_at = !body.updated_at ? new Date() : body.updated_at;
		return this.model.updateMany( query, { $set: body }, options );
	}
	/**
	* @description
	* @param {object} [query] query for selecting the documents to delete
	* @param {object} [options] Optional: options to provide query
	* @returns  {Promise} Returns the results of the query
	*/
	deleteMany ( query, options = null ){
		
		return this.model.updateMany( query, { $set: { deleted: true, deleted_at: new Date() } }, options );
	}
}
module.exports = Mongoose;