// Importing the required modules from APS SDK client 
const { AuthenticationClient, Scopes } = require('@aps_sdk/authentication'); // used to request tokens for authentication
const { OssClient, Region, PolicyKey } = require('@aps_sdk/oss'); //OSS client used for operations related to storing and managing files (or buckets) in APS
const { ModelDerivativeClient, View, OutputType } = require('@aps_sdk/model-derivative'); // used to translate models into different formats (e.g. prepare them for viewing)
// Importing the configuration values from config.js file
const { APS_CLIENT_ID, APS_CLIENT_SECRET, APS_BUCKET } = require('../config.js');

// Initializing the APS SDK clients
const authenticationClient = new AuthenticationClient(); // used to request tokens for authentication
const ossClient = new OssClient(); // OSS client used for operations related to storing and managing files (or buckets) in APS  
const modelDerivativeClient = new ModelDerivativeClient(); // used to translate models into different formats (e.g. prepare them for viewing)

// Exporting the service object, so that other parts of the application can use the functions defined in this module
const service = module.exports = {};

// Helper function to get the internal token for generating access tokens for the internal use (e.g. for uploading files to the bucket - more scopes)
async function getInternalToken() {
    const credentials = await authenticationClient.getTwoLeggedToken(APS_CLIENT_ID, APS_CLIENT_SECRET, [
        Scopes.DataRead,
        Scopes.DataCreate,
        Scopes.DataWrite,
        Scopes.BucketCreate,
        Scopes.BucketRead
    ]);
    return credentials.access_token;
}

// Helper function to generate tokens for public use (only giving read access to the translation outputs from the Model Derivative service)
service.getViewerToken = async () => {
    return await authenticationClient.getTwoLeggedToken(APS_CLIENT_ID, APS_CLIENT_SECRET, [Scopes.ViewablesRead]);
}; // Scope = ViewablesRead - this scope is typically used for viewing the translated models

// Its good practice to have internal token with more capabilities that will only be used by the server and a "public" 
// token with fewer capabilities that can be safely shared with the client side logic

// Helper function that ensures the bucket exists and creates it if it doesn't
service.ensureBucketExists = async (bucketKey) => {
    const accessToken = await getInternalToken(); // we call the internal token with more capabilities  
    try {
        await ossClient.getBucketDetails(bucketKey, { accessToken }); // we try to get bucket details in case we already provided bucket key
    } catch (err) {
        if (err.axiosError.response.status === 404) { // if the bucket does not exist, it is indicated by the 404 status code
            await ossClient.createBucket(Region.Emea, { bucketKey: bucketKey, policyKey: PolicyKey.Persistent }, { accessToken}); // we then create bucket with the provided bucket key
        } else {
            throw err;
        }
    }
};

// Helper function to list all objects in the bucket
// getObjects uses pagination - in the code we iterate through pages and return all files from applications bucket in a single list
service.listObjects = async () => {
    await service.ensureBucketExists(APS_BUCKET); // calls the ensureBucketExists function to make sure the bucket exists
    const accessToken = await getInternalToken(); // retrieves internal token with more capabilities
    let resp = await ossClient.getObjects(APS_BUCKET, { limit: 64, accessToken }); // retrieves objects from the bucket (up to 64)
    let objects = resp.items; // stores the items in the objects array
    while (resp.next) { // 
        const startAt = new URL(resp.next).searchParams.get('startAt');
        resp = await ossClient.getObjects(APS_BUCKET, { limit: 64, startAt, accessToken });
        objects = objects.concat(resp.items);
    }
    return objects;
};

// uploadObject function uploads a file to the bucket using the provided object name and file path
service.uploadObject = async (objectName, filePath) => {
    await service.ensureBucketExists(APS_BUCKET);
    const accessToken = await getInternalToken();
    const obj = await ossClient.uploadObject(APS_BUCKET, objectName, filePath, { accessToken });
    return obj;
};

// Function that requests a translation job from Model Derivative API. The goal is to convert the input model (identified by its URN) into a viewable format (SVF2)
service.translateObject = async (urn, rootFilename) => {
    const accessToken = await getInternalToken();
    const job = await modelDerivativeClient.startJob({ // calling modelDerivativeClient.startJob function with 2 main parts - input and output
        input: {
            urn, // URN of the model to be translated - it is an input parameter
            compressedUrn: !!rootFilename, // if the rootFilename is provided, the compressedUrn is set to true
            rootFilename // the rootFilename is used to specify the main file in the archive (if the model is a ZIP archive)
        },
        output: {
            formats: [{
                views: [View._2d, View._3d], // specifies the views to be generated - 2D and 3D views
                type: OutputType.Svf2 // specifies the output type - SVF2 format
            }]
        }
    }, { accessToken });
    return job.result; // function waits for the job to be completed and then returns the result, which contains the outcome of translation request
};


// Function that retrieves the manifest of the translated model using its URN
// Manifest is a JSON document that describes the translation jobs status, available derivatives and other metadata
service.getManifest = async (urn) => {
    const accessToken = await getInternalToken();
    try {
        const manifest = await modelDerivativeClient.getManifest(urn, { accessToken }); // fetch the manifest given the urn and access token
        return manifest; // return the manifest
    } catch (err) {
        if (err.axiosError.response.status === 404) {
            return null;
        } else {
            throw err;
        }
    }
};


// Utility function that converts and identifier (usually a file ID) to a URN (Uniques Resource Name) required by Autodesks APIs
service.urnify = (id) => Buffer.from(id).toString('base64').replace(/=/g, '');