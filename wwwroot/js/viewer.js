/// import * as Autodesk from "@types/forge-viewer";

export let viewer // the viewer object is exported so it can be used in other parts of the application

// This function obtains an access token from the server and calls the callback function with the token and its expiration time
// It uses fetch API to call the token endpoint
async function getAccessToken(callback) {
    try {
        const resp = await fetch('/api/auth/token');
        if (!resp.ok) {
            throw new Error(await resp.text()); // if the response is not ok, an error is thrown
        }
        const { access_token, expires_in } = await resp.json(); // once the json is received, it extracts the access token and expiration time
        callback(access_token, expires_in); // it then calls the provided callback function with these values so that the viewer can use them during initialization
    } catch (err) {
        alert('Could not obtain access token. See the console for more details.');
        console.error(err);
    }
}

// This function initializes the APS viewer in the specified HTML container (DOM container)
// It is a promise-based function that resolves with the viewer object once it is initialized
export function initViewer(container) {
    return new Promise(function (resolve, reject) {
        Autodesk.Viewing.Initializer({ env: 'AutodeskProduction', getAccessToken }, function () {
            const config = {
                extensions: []
            };
            const viewer = new Autodesk.Viewing.GuiViewer3D(container, config);
            viewer.start(); // the viewer is started here
            viewer.setTheme('dark-theme'); // the theme is set to light-theme
            viewer.setLightPreset(16);
            console.log("Viewer initialized", viewer);
            resolve(viewer); // the viewer instance is resolved so it can be used elsewhere in the application
        });
    });
}


// This function loads a model into the already initialized viewer using the provided URN
// It is a promise-based function that resolves with the loaded model once it is loaded
export function loadModel(viewer, urn) {
    return new Promise(function (resolve, reject) {
        // when the doc (model) loads successfully, it resolves the promise by calling viewer.loadDocumentNode with the document and the default geometry
        function onDocumentLoadSuccess(doc) {
            resolve(viewer.loadDocumentNode(doc, doc.getRoot().getDefaultGeometry())); 
        }
        // if the document fails to load, it rejects the promise with an error message
        function onDocumentLoadFailure(code, message, errors) {
            reject({ code, message, errors });
        }
        // The model is then loaded by calling autodesk.Viewing.Document.load with the URN and the success and failure callbacks
        Autodesk.Viewing.Document.load('urn:' + urn, onDocumentLoadSuccess, onDocumentLoadFailure); // "urn:" is prepended to the URN to indicate that it is a URN
    });
}
