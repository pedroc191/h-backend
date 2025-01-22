// =============================================================================
// PACKAGES
// =============================================================================
const debug     = require('debug')('hefesto:server');
const http      = require('http');
// =============================================================================
// GENERAL FUNCTIONS
// =============================================================================
/**
* Normalize a port into a number, string, or false.
* @param val 
* @returns 
*/
function normalizePort(val) {
    
    const port = parseInt(val, 10);
    
    if (isNaN(port)) {
        return val;
    }
    if (port >= 0) {
        return port;
    }
    return false;
};
/**
* Event listener for HTTP server "error" event.
* @param error 
* @param port 
*/
function onError(error, port) {
    
    if (error.syscall !== 'listen') {
        throw error;
    }
    
    const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
    
    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
        case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        process.exit(1);
        break;
        default:
        throw error;
    }
};
/**
* Event listener for HTTP server "listening" event.
* @param server 
*/
function onListening(server) {
    
    const addr = server.address();
    const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    
    console.log('Listening on ' + bind)
    debug('Listening on ' + bind);
};
/**
* 
* @param path_file 
* @param port 
* @param is_jobs 
*/
function executeServer(path_file, port, is_jobs = false ){
    
    if( !is_jobs || ( is_jobs && process.env.NODE_ENV !== 'developer' ) ){
        
        const app   = require(path_file);
        
        /**
        * Get port from environment and store in Express.
        */
        const port_app  = normalizePort(port);
        app.set('port', port_app);
        /**
        * Create HTTP server.
        */
        const server  = http.createServer(app);
        
        /**
        * Listen on provided port, on all network interfaces.
        */
        server.listen(port_app);
        server.on('error', (error) => {
            onError(error, port_app);
        });
        server.on('listening', () => {
            onListening(server);
        });
    }
};
module.exports = {
    executeServer
}