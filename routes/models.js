// importing dependencies
const express = require('express');
const formidable = require('express-formidable'); // middleware for parsing incoming form data, including file uploads - lets you easily handle file uploads in the POST endpoint
const { listObjects, uploadObject, translateObject, getManifest, urnify } = require('../services/aps.js');

// Create a new router instance - routers allow you to group route handlers together
let router = express.Router();

// Define a GET route at the /api/models endpoint. This route will return a list of models available in the bucket
router.get('/api/models', async function (req, res, next) {
    try {
        const objects = await listObjects();
        res.json(objects.map(o => ({ // each object is transformed into a simpler JSON object with a name and URN
            name: o.objectKey,
            urn: urnify(o.objectId)
        })));
    } catch (err) {
        next(err);
    }
});


// Retrieves a translation status of a model given its URN
// If the manifest exists, it collects messages from the top-level derivatives and any child derivatives
router.get('/api/models/:urn/status', async function (req, res, next) {
    try {
        const manifest = await getManifest(req.params.urn);
        if (manifest) {
            let messages = [];
            if (manifest.derivatives) {
                for (const derivative of manifest.derivatives) {
                    messages = messages.concat(derivative.messages || []);
                    if (derivative.children) {
                        for (const child of derivative.children) {
                            messages.concat(child.messages || []);
                        }
                    }
                }
            }
            res.json({ status: manifest.status, progress: manifest.progress, messages }); // A JSON object is returned with the status, progress, and messages
        } else {
            res.json({ status: 'n/a' });
        }
    } catch (err) {
        next(err);
    }
});

// Define a POST route at the /api/models endpoint. This route will upload a model file to the bucket and start the translation process
// Formidable middleware used to parse the incoming request and handle file uploads - configuration here allows for files of any size
router.post('/api/models', formidable({ maxFileSize: Infinity }), async function (req, res, next) {
    const file = req.files['model-file']; // code expects a file with the field name "model-file"
    if (!file) {
        res.status(400).send('The required field ("model-file") is missing.');
        return;
    }
    try {
        const obj = await uploadObject(file.name, file.path); // uploadObject function called to upload the file to the bucket
        await translateObject(urnify(obj.objectId), req.fields['model-zip-entrypoint']); // after successful upload the file is translated. It takes 2 parameters - URN and rootFilename
        res.json({ // once both upload and translation are initiated, a JSON object is returned with the name and URN of the uploaded file
            name: obj.objectKey,
            urn: urnify(obj.objectId)
        });
    } catch (err) {
        next(err);
    }
});

// Export the router object so that it can be used in other parts of the application
module.exports = router;