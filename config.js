// Load environment variables from the .env file
require('dotenv').config();

// Retrieve values from the environment variables and check that both key variables are present
let { APS_CLIENT_ID, APS_CLIENT_SECRET, APS_BUCKET, PORT } = process.env;
if (!APS_CLIENT_ID || !APS_CLIENT_SECRET) {
    console.warn('Missing some of the environment variables.');
    process.exit(1);
}
// Set default values for APS_BUCKET and PORT if they are not provided
APS_BUCKET = APS_BUCKET || `${APS_CLIENT_ID.toLowerCase()}-basic-app`;
PORT = PORT || 8080;

// Export the configuration
module.exports = {
    APS_CLIENT_ID,
    APS_CLIENT_SECRET,
    APS_BUCKET,
    PORT
};
// In the code snippet above, the dotenv package is used to load environment variables from the .env file. 
// The values are then retrieved and checked for existence. 
// If any of the key variables (APS_CLIENT_ID or APS_CLIENT_SECRET) are missing, a warning is logged and the process is exited with an error code. 
// Default values are set for APS_BUCKET and PORT if they are not provided in the .env file. 
// Finally, the configuration object is exported for use in other parts of the application.