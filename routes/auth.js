// Importing dependiences
const express = require('express'); // importing express module
const { getViewerToken } = require('../services/aps.js'); // importing getViewerToken function from aps.js file

// Create a new router instance - routers allow you to group route handlers together
let router = express.Router();

// Define a GET route at the /api/auth/token endpoint. This route will return a viewer token to the client
router.get('/api/auth/token', async function (req, res, next) {
    try {
        res.json(await getViewerToken());
    } catch (err) {
        next(err);
    }
});

// Export the router object so that it can be used in other parts of the application
module.exports = router;


// function is async because it waits the response from the getViewerToken function
// The function calls getViewerToken(), which fetches a viewer token from the APS service. The result (the token) is sent back to the client in JSON format using res.json()
// If an error occurs during the process, the error is passed to the next middleware function using next(err)