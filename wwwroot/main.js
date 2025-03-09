// Import dependencies
import { initViewer, loadModel } from './js/viewer.js';
import { initializeSearch } from "./js/search.js"; 

let viewer;

// Initialize viewer on page load
async function initializeViewer() {
    viewer = await initViewer(document.getElementById('preview'));
    console.log("Viewer instance received in main.js");

    initializeSearch(viewer); // Enable search functionality

    const urnFromUrl = window.location.hash?.substring(1); // Preveri, ali je URN v URL-ju
    const urn = urnFromUrl || await getFirstModelURN(); // Uporabi URN iz URL-ja ali prvega iz bucket-a

    if (urn) {
        console.log("Loading model:", urn);
        loadModel(viewer, urn); // Naloži model v APS Viewer
    } else {
        console.error("No models found in the bucket.");
    }

    document.addEventListener("fullscreenchange", handleFullScreen);
    document.addEventListener("webkitfullscreenchange", handleFullScreen);
    document.addEventListener("mozfullscreenchange", handleFullScreen);
    document.addEventListener("MSFullscreenChange", handleFullScreen);
}

// Function to get the first model's URN from the backend
async function getFirstModelURN() {
    try {
        const resp = await fetch('/api/models'); // Fetch list of models
        if (!resp.ok) {
            throw new Error(await resp.text());
        }
        const models = await resp.json();
        return models.length > 0 ? models[0].urn : null; // Vrne URN prvega modela ali null
    } catch (err) {
        console.error('Could not retrieve models:', err);
        return null;
    }
}

// Handle Full Screen UI changes
function handleFullScreen() {
    if (!viewer) {
        console.error("Viewer is not defined in Full Screen function!");
        return;
    }

    const viewerContainer = viewer.container;
    const header = document.getElementById("header");

    if (!header) {
        console.error("Header element not found!");
        return;
    }

    if (document.fullscreenElement) {
        console.log("Full Screen ON - Moving UI into #viewer");
        viewerContainer.appendChild(header);
        header.classList.add("fullscreen-overlay");
    } else {
        console.log("Full Screen OFF - Returning UI to original place");
        document.body.appendChild(header);
        header.classList.remove("fullscreen-overlay");
    }
}

// Run the app
initializeViewer().catch(err => console.error("Error initializing app:", err));
