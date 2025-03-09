console.log("Search.js loaded");

// Function to initialize the search UI
export function initializeSearch(viewer) {
    console.log("Initializing search UI...");
    
    // Check if the viewer is defined
    if (!viewer) {
        console.error("Viewer is undefined! Something went wrong.");
        return;
    } else {
        console.log("Viewer successfully passed to search.js!");
    }

    // Get the search input and toggle button elements
    const searchInput = document.getElementById("filter");
    const toggleLiveSearchButton = document.getElementById("toggle-live-search");

    // Set live search to false
    let isLiveSearchActive = false;

    // Function to toggle the live search functionality with a button
    toggleLiveSearchButton.addEventListener("click", function () {
        isLiveSearchActive = !isLiveSearchActive;
        console.log("Live search toggled:", isLiveSearchActive);
        toggleLiveSearchButton.textContent = isLiveSearchActive ? "Live Search: ON" : "Live Search: OFF";
        toggleLiveSearchButton.classList.toggle("active", isLiveSearchActive);
    });

    console.log("Search UI initialized.");

    // Add event listener for search input
    searchInput.addEventListener("input", function () {
        if (isLiveSearchActive) {
            searchModel(viewer, searchInput.value);
        }
    });

    searchInput.addEventListener("keypress", function (event) {
        if (!isLiveSearchActive && event.key === "Enter") {
            searchModel(viewer, searchInput.value);
        }
    });

};

// Function to search the model based on input
async function searchModel(viewer, searchTerm) {
    const matchingDbIds = await getMatchingElements(viewer, searchTerm);
    applySearchResults(viewer, matchingDbIds, searchTerm);
}

// Function to find matching elements in the model
async function getMatchingElements(viewer, searchTerm) {
    searchTerm = searchTerm.trim().toLowerCase();
    let searchAttribute = null;
    let searchValue = searchTerm;

    if (searchTerm.includes(":")) {
        const parts = searchTerm.split(":");
        searchAttribute = parts[0].trim();
        searchValue = parts[1].trim().toLowerCase();
    }

    console.log("Searching for:", searchTerm);
    console.log("Search Attribute:", searchAttribute);
    console.log("Search Value:", searchValue);

    const instanceTree = viewer.model?.getData()?.instanceTree;
    if (!instanceTree) {
        console.error("Instance tree not available.");
        return [];
    }

    let allDbIds = [];
    instanceTree.enumNodeChildren(instanceTree.getRootId(), (dbId) => {
        allDbIds.push(dbId);
    }, true);

    let matchingDbIds = [];

    for (let dbId of allDbIds) {
        await new Promise((resolve) => {
            viewer.getProperties(dbId, function (data) {
                if (data.properties) {
                    for (let prop of data.properties) {
                        const propName = prop.displayName.trim();
                        const propValue = prop.displayValue.toString().toLowerCase();

                        // ✅ Popravili preverjanje atributov
                        if (searchAttribute) {
                            if (propName.toLowerCase() === searchAttribute.toLowerCase() && propValue.includes(searchValue)) {
                                matchingDbIds.push(dbId);
                                break;
                            }
                        } else {
                            if (propValue.includes(searchValue)) {
                                matchingDbIds.push(dbId);
                                break;
                            }
                        }
                    }
                }
                resolve();
            });
        });
    }

    return matchingDbIds;
}


// Function to apply search results to the viewer
function applySearchResults(viewer, matchingDbIds, searchTerm) {
    const instanceTree = viewer.model?.getData()?.instanceTree;
    if (!instanceTree) {
        console.error("Instance tree not available for hiding elements.");
        return;
    }

    let allDbIds = [];
    instanceTree.enumNodeChildren(instanceTree.getRootId(), (dbId) => {
        allDbIds.push(dbId);
    }, true);

    viewer.hide(allDbIds);

    if (matchingDbIds.length > 0) {
        viewer.show(matchingDbIds);
        viewer.fitToView(matchingDbIds);
    } else {
        console.warn("No matching elements found for:", searchTerm);
    }
}

