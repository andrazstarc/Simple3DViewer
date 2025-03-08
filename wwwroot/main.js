// Usage: This file is the main entry point for the web application. It sets up the viewer, loads the models, and handles model selection.

// Importing the initViewer and loadModel functions from the viewer.js file
import { initViewer, loadModel } from './viewer.js';

// The viewer is initialized inside the specified DOM element (called "preview") 
// Once the viewer is ready (resolved Promise) the code checks if the URL contains a hash (assumed to be a model URN)
initViewer(document.getElementById('preview')).then(viewer => { //
    const urn = window.location.hash?.substring(1);
    setupModelSelection(viewer, urn); // prepares the model selection breakdown
    setupModelUpload(viewer); // sets up the file upload functionality
});




// Populate a dropdown list with the available models retrieved from the backend
async function setupModelSelection(viewer, selectedUrn) {
    const dropdown = document.getElementById('models'); // get the dropdown element
    dropdown.innerHTML = ''; // clear the dropdown
    try {
        const resp = await fetch('/api/models'); // fetch the models from the backend
        if (!resp.ok) {
            throw new Error(await resp.text());
        }
        const models = await resp.json(); // parse the response as JSON
        // populate the dropdown with the models
        dropdown.innerHTML = models.map(model => `<option value=${model.urn} ${model.urn === selectedUrn ? 'selected' : ''}>${model.name}</option>`).join('\n');
        // when a model is selected, the onModelSelected function is called with the selected URN
        dropdown.onchange = () => onModelSelected(viewer, dropdown.value);
        // if a model is already selected, call onModelSelected with the selected URN
        if (dropdown.value) {
            onModelSelected(viewer, dropdown.value);
        }
    } catch (err) {
        alert('Could not list models. See the console for more details.');
        console.error(err);
    }
}

/// This function is called when a model is selected from the dropdown
// It checks the translation status of the selected model and loads it into the viewer if it is ready
// First it clears any existing timeout 
async function onModelSelected(viewer, urn) {
    if (window.onModelSelectedTimeout) {
        clearTimeout(window.onModelSelectedTimeout);
        delete window.onModelSelectedTimeout;
    }
    window.location.hash = urn; // update the url hash with the selected URN
    try {
        const resp = await fetch(`/api/models/${urn}/status`); // fetches the translation status of the selected model
        if (!resp.ok) {
            throw new Error(await resp.text());
        }
        const status = await resp.json(); // parses the response as JSON
        // Based on the status, different actions are taken
        switch (status.status) {
            case 'n/a': // if the status is not available, the model has not been translated
                showNotification(`Model has not been translated.`);
                break;
            case 'inprogress': // if the status is in progress, a notification is shown and the function is called again after 5 seconds
                showNotification(`Model is being translated (${status.progress})...`);
                window.onModelSelectedTimeout = setTimeout(onModelSelected, 5000, viewer, urn);
                break;
            case 'failed': // if the status is failed, a notification is shown with the failure messages
                showNotification(`Translation failed. <ul>${status.messages.map(msg => `<li>${JSON.stringify(msg)}</li>`).join('')}</ul>`);
                break;
            default: // if the status is success, the notification is cleared and the model is loaded into the viewer using the loadModel function
                clearNotification();
                loadModel(viewer, urn);
                break; 
        }
    } catch (err) {
        alert('Could not load model. See the console for more details.');
        console.error(err);
    }
}

// This function displays a notification to the user
function showNotification(message) {
    const overlay = document.getElementById('overlay'); // get the overlay element
    overlay.innerHTML = `<div class="notification">${message}</div>`; // set the inner HTML of the overlay to the notification message
    overlay.style.display = 'flex';
}

// This function clears the notification
function clearNotification() {
    const overlay = document.getElementById('overlay'); // get the overlay element
    overlay.innerHTML = ''; // clear the inner HTML of the overlay
    overlay.style.display = 'none'; // hide the overlay
}