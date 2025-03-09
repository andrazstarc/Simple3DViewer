// Set up a basic server
// Import the Express library for easier HTTP server setup
// Import the PORT variable from the configuration file
const express = require('express');
const { PORT } = require('./config.js');

// Initialize the Express application, which will serve as the main object for configuration and server startup
// All files located in the "wwwroot" directory will be accessible via the server as static files
let app = express();
app.use(express.static('wwwroot'));

// Import the routes in auth.js file
app.use(require('./routes/auth.js'));

// Import the routes in models.js file
app.use(require('./routes/models.js'));

// Preusmeri vse /bucket/:name poti na frontend (index.html)
app.get('/bucket/:name', (req, res) => {
    res.sendFile(__dirname + '/wwwroot/index.html');
});

// Start the server on the specified port
app.listen(PORT, function () { console.log(`Server listening on port ${PORT}...`); });

// The code snippet above sets up a basic HTTP server using the Express library. 
// The PORT variable is imported from the configuration file, and the server is started on that port.
// The server will serve static files located in the "wwwroot" directory, which can be used to host a basic website or web application.