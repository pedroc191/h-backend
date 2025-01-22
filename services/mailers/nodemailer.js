
// =============================================================================
// CONFIGURATION
// =============================================================================
const config_application      = require('../../config/application');
const config_credentials      = require('../../config/credentials');
// =============================================================================
// PACKAGES
// =============================================================================
const nodemailer 	    = require('nodemailer');
// =============================================================================
// GENERAL FUNCTIONS
// =============================================================================
/**
 * 
 * @param {*} credentials_email 
 * @returns 
 */
const createTransporterEmail = function( credentials_email ){

    return nodemailer.createTransport({ service: 'gmail', auth: { user: credentials_email.user, pass: credentials_email.pass } });
};
/**
* 
* @param {String} from -  The email address of the sender.
* @param {String} to - Comma separated list or an array of recipients email addresses that will appear on the To: field
* @param {String} bcc - Comma separated list or an array of recipients email addresses that will appear on the Bcc: field
* @param {String} priority - priority email ‘high’, ‘normal’ (default) or ‘low’.
* @param {String} subject - The subject of the email
* @param {String} message - text or HTML message, this will be inserted into an html template inside email 
* @param {Array} attachment - An array of attachment objects. You can use an empty array in case no attachment
* @description Send emails from gmail
*/
const sendEmail = async (credentials, from, to, subject, message, bcc = '', priority = 'normal', attachment = []) => {

	return new Promise ( (resolve, reject) => {

		const transporter = createTransporterEmail( credentials );
		const mail_options = {
			from: from,
			to:  config_application.status === 'developer' ? config_credentials.mailer.developer.user : to,
			bcc: bcc,
			priority: priority,
			subject: config_application.status === 'developer' ? `${subject} - [Developer]` : subject,
			attachments: attachment,
			text: '',
			html: message
		};
		transporter.sendMail( mail_options, async ( email_error ) =>{
			
			if( !email_error ){
				
				resolve( { status: 200, message: 'Success: Email Send', data: mail_options } );
			}
			else{
				
				reject( { status: 400, message: 'Error: Email not Send', data: email_error } );
			}
		});
	});
};
module.exports = {
	createTransporterEmail,
	sendEmail
};
