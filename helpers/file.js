// =============================================================================
// PACKAGES
// =============================================================================
const fs            = require('fs');
const ejs           = require('ejs');
const sizeOf        = require('image-size');
// =============================================================================
// HANDLERS
// =============================================================================
const h_response 	= require('./response');
// =============================================================================
// GENERAL FUNCTIONS
// =============================================================================
/**
* DESCRIPTION: Get the list of files contained in a given path and its internal folders
* @param {String} base_path Base path where files will be searched
*/
async function list(base_path) {
    const recursiveFindFiles = async (base_path) => {
        let result_files = [];
        try {
            const data_files = await fs.readdirSync(base_path, { withFileTypes: true });
            for (const file of data_files) {
                if (file.isDirectory()) {
                    const files_result = await recursiveFindFiles(`${base_path}/${file.name}`);
                    if (files_result.success) {
                        result_files.push(...files_result.body);
                    } 
                    else {
                        return files_result;
                    }
                } else if (file.name !== 'test.txt') {
                    
                    result_files.push(`${base_path}/${file.name}`);
                }
            }
            return h_response.request(true, result_files, 200, 'Success: File List', 'File List from the Directory');
        } catch (error) {
            console.log( error );
            return h_response.request(false, error, 400, 'Error: File List', `The directory not exist ${base_path}`);
        }
    };
    
    return await recursiveFindFiles(base_path);
};
/**
* 
* @param {*} old_path 
* @param {*} new_path 
* @returns 
*/
async function rename(old_path, new_path) {
    try {
        await fs.renameSync(old_path, new_path);
        return h_response.request(true, null, 200, 'Success: Rename File', `Change File name: ${old_path.split('/').pop()} to ${new_path.split('/').pop()}`);
    } catch (rename_error) {
        return h_response.request(false, rename_error, 400, 'Error: Rename File', `File not exist ${old_path}`);
    }
}
/**
* 
* @param {*} url 
* @returns 
*/
async function sizeImage(url) {
    try {
        const dimensions = await new Promise((resolve, reject) => {
            sizeOf(url, (error_size, dimensions) => {
                if (error_size) reject(error_size);
                else resolve(dimensions);
            });
        });
        let image_dimension = { format: `${dimensions.width}px x ${dimensions.height}px`, number: { width: dimensions.width, height: dimensions.height } };
        return h_response.request(true, image_dimension, 200, 'Success: get Image Dimensions', '');
    } catch (error_size) {
        
        return h_response.request(false, error_size, 400, 'Error: get Image Dimensions', 'File is not an image');
    }
}
/**
* 
* @param {*} file_object 
* @returns 
*/
async function details(file_object) {
    try {
        const result_stats = await fs.statSync(file_object.url);
        file_object.details.size = { format: result_stats.size >= 524288 ? `${(result_stats.size / 1048576).toFixed(2)} mb` : `${(result_stats.size / 1024).toFixed(2)} kb`, number: result_stats.size };
        
        if (global.image_file_types.includes(file_object.type)) {
            const dimension_image = await sizeImage(file_object.url);
            if (dimension_image.success) {
                file_object.details.dimensions = dimension_image.body;
            } else {
                return dimension_image;
            }
        }
        return h_response.request(true, file_object, 200, 'Success: Get details File', '');
    } catch (process_error) {

        return h_response.request(false, process_error, 400, 'Error: Get details File', 'File not exist');
    }
}
/**
* 
* @param {*} file 
* @param {*} base_path 
* @param {*} file_name 
* @param {*} file_type 
* @returns 
*/
async function create(file, base_path, file_name, file_type) {
    try {
        if (!fs.existsSync(base_path)) {
            fs.mkdirSync(base_path);
        }
        
        await new Promise((resolve, reject) => {
            fs.createReadStream(`./temp/${file.filename}`)
            .pipe(fs.createWriteStream(`${base_path}/${file_name}`))
            .on('finish', resolve)
            .on('error', reject);
        });
        
        await remove(`./temp/`, file.filename, 'temp');
        return h_response.request(true, { url: `${base_path}/${file_name}`.replace('./public', ''), type: file_type }, 200, 'Success: Create File', '');
    } catch (create_file_error) {
        return h_response.request(false, create_file_error, 400, 'Error: Create File', 'Corrupted file data or directory not exist');
    }
}
/**
* 
* @param {*} base_path 
* @param {*} file_name 
* @param {*} file_type 
* @returns 
*/
async function remove(base_path, file_name, file_type) {
    try {
        await fs.unlinkSync(`${base_path}/${file_name}`);
        return h_response.request(true, { url: `${base_path}/${file_name}`.replace('./public', ''), type: file_type }, 200, 'Success: Delete File', '');
    } catch (unlink_error) {
        return h_response.request(false, unlink_error, 400, 'Error: Delete File', 'File not exist');
    }
}
/**
* DESCRIPTION: Upload files allowing repeated files and replacement of existing files
* @param {Object} file File as Object uploaded with Muller
* @param {String} base_path Base path where the file is saved
* @param {Object} data_file Object containing the old path of the file, the default name of the file, the type of unique name, the maximum size allowed, if it is an image and the maximum dimensions allowed
* @returns 
*/
async function upload(file, base_path, data_file = { old_path: '', default_file_name: '', unique_name_type: false, max_size: 512000, is_image: false, max_dimension: { width: 200, height: 200 } }) {
    try {
        base_path = `./public${base_path}`;
        data_file.old_path = data_file.old_path !== '' ? `./public${data_file.old_path}` : data_file.old_path;
        
        const file_list = await list(base_path);
        if (!file_list.success) {
            return file_list;
        }
        
        let file_name = data_file.default_file_name || (data_file.unique_name_type ? file.originalname.split('.')[0] : `${file.originalname.split('.')[0]}-${file.filename}`);
        file_name = `${file_name}.${file.originalname.split('.')[1]}`.substring(0, 258);
        
        const upload_path = `./public/uploads`;
        const file_size = { format: file.size >= 512000 ? `${(file.size / 1024000).toFixed(2)} mb` : `${(file.size / 1024).toFixed(2)} kb`, number: file.size };
        const find_file = file_list.body.find(item => item.replace('./public', '').split('.')[0] === data_file.old_path.replace('/public', '').split('.')[0]);
        
        if (file.size > data_file.max_size) {
            return h_response.request(false, file_size, 400, 'Error: File Size', 'File exceeds the maximum size allowed');
        }
        
        const create_upload_file = await create(file, upload_path, file_name, file_name.split('.')[1]);
        if (!create_upload_file.success) {
            return create_upload_file;
        }
        
        if (data_file.old_path && find_file) {
            if (data_file.unique_name_type) {
                data_file.old_path = find_file;
            }
            await remove(data_file.old_path.replace(data_file.old_path.substring(data_file.old_path.lastIndexOf('/') + 1), ''), data_file.old_path.substring(data_file.old_path.lastIndexOf('/') + 1), data_file.old_path.substring(data_file.old_path.lastIndexOf('/') + 1).split('.')[1]);
        }
        
        if (data_file.is_image) {
            const size_result = await sizeImage(`${upload_path}/${file_name}`);
            if (!size_result.success) {
                return size_result;
            }
            
            const image_dimension = size_result.body;
            if (image_dimension.number.width > data_file.max_dimension.width || image_dimension.number.height > data_file.max_dimension.height) {
                return h_response.request(false, image_dimension, 400, 'Error: Image Dimensions', `Image exceeds the maximum dimensions allowed: ${data_file.max_dimension.width}px x ${data_file.max_dimension.height}px`);
            }
            
            const move_file_result = await rename(`./public${create_upload_file.body.url}`, `${base_path}/${file_name}`);
            if (!move_file_result.success) {
                move_file_result.title = 'Error: Uploaded File';
                move_file_result.message = 'Not process File';
                return move_file_result;
            }
            
            return h_response.request(true, { url: `./public${create_upload_file.body.url}`.replace(upload_path, base_path).replace('./public/', '/'), type: create_upload_file.body.type }, 200, 'Success: Uploaded File', '');
        } else {
            const move_file_result = await rename(`./public${create_upload_file.body.url}`, `${base_path}/${file_name}`);
            if (!move_file_result.success) {
                move_file_result.title = 'Error: Uploaded File';
                move_file_result.message = 'Not process File';
                return move_file_result;
            }
            
            return h_response.request(true, { url: `./public${create_upload_file.body.url}`.replace(upload_path, base_path).replace('./public/', '/'), type: create_upload_file.body.type }, 200, 'Success: Uploaded File', '');
        }
    } catch (process_error) {
        
        return h_response.request(false, process_error, 400, 'Error: Upload File', 'An error occurred during the upload process');
    }
}
/**
*
* @param {*} type_template
* @param {*} data
* @returns
*/
const templateEmail = function( type_template, data = {} ){
    
    let html = ejs.render( fs.readFileSync(`./public/documents/templates/ejs/emails/${ type_template }.ejs`, 'utf8'), data ).replace(/^\s+|\r\n|\n|\r|(>)\s+(<)|\s+$/gm, '$1$2');
    
    return html;
};
// =============================================================================
// EXPORTS
// =============================================================================
module.exports = {
    list,
    rename,
    sizeImage,
    details,
    create,
    remove,
    upload,
    templateEmail
};