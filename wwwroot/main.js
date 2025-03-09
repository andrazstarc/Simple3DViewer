// Import dependencies
import { initViewer, loadModel } from './js/viewer.js';
import { initializeSearch } from "./js/search.js"; 

let viewer;

// Initialize viewer on page load
async function initializeViewer() {
    viewer = await initViewer(document.getElementById('preview'));
    console.log("Viewer instance received in main.js");

    initializeSearch(viewer); // Omogočimo iskanje

    const { urn, bucket } = getUrlParams(); // Preberemo urn ali bucket iz URL-ja

    if (urn) {
        console.log("Loading specific model:", urn);
        loadModel(viewer, urn); // Naloži točno določen model
    } else if (bucket) {
        console.log("Loading all models from bucket:", bucket);
        loadAllModels(viewer, bucket); // Naloži vse modele iz bucket-a
    } else {
        console.log("Loading first model from default bucket...");
        const firstModel = await getFirstModelURN();
        if (firstModel) {
            loadModel(viewer, firstModel);
        } else {
            console.error("No models found in the default bucket.");
        }
    }

    document.addEventListener("fullscreenchange", handleFullScreen);
    document.addEventListener("webkitfullscreenchange", handleFullScreen);
    document.addEventListener("mozfullscreenchange", handleFullScreen);
    document.addEventListener("MSFullscreenChange", handleFullScreen);
}

// Function to extract URL parameters
function getUrlParams() {
    const hash = window.location.hash.substring(1); // Odstranimo #
    const path = window.location.pathname.split("/"); // Razbijemo pot na dele

    let urn = null;
    let bucket = null;

    // Če je hash podan in je dovolj dolg (URN je običajno Base64)
    if (hash && hash.length > 40) {
        urn = hash; // To je URN
    }

    // Če je URL v obliki /bucket/ime-bucket-a, ga shranimo
    if (path.length > 1 && path[1] === "bucket") {
        bucket = path[2]; // Drugi element v poti je ime bucket-a
    }

    return { urn, bucket };
}

// Function to load all models from a specific bucket
async function loadAllModels(viewer, bucket) {
    try {
        const resp = await fetch(`/api/models?bucket=${bucket}`); // Pridobimo seznam modelov iz bucket-a
        if (!resp.ok) throw new Error(await resp.text());

        const models = await resp.json();
        if (models.length === 0) {
            console.warn("No models found in bucket:", bucket);
            return;
        }

        console.log(`Loading ${models.length} models from bucket:`, bucket);
        for (const model of models) {
            console.log("Loading model:", model.urn);
            loadModel(viewer, model.urn); // Naložimo vsak model posebej
        }
    } catch (err) {
        console.error("Error loading models:", err);
    }
}

// Function to get the first model's URN from the backend
async function getFirstModelURN() {
    try {
        const resp = await fetch('/api/models'); // Pridobimo seznam modelov iz privzetega bucket-a
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
