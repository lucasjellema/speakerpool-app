/**
 * Delta Files Processor
 * 
 * This script processes delta files for the Sprekerpool application:
 * 1. Retrieves the main Sprekerpool.json file from a pre-authenticated URL
 * 2. Gets a list of delta files from the deltas folder
 * 3. Applies each delta file to the corresponding speaker in the main data
 * 4. Replaces each processed delta file with an empty JSON object
 * 5. Updates the main Sprekerpool.json file with the merged data
 * 
 * Usage: 
 * - Set the PRE_AUTHENTICATED_REQUEST_URL environment variable or modify the value in this script
 * - Run: node processDeltaFiles.js
 * 
 * Note: This script requires the axios package to be installed.
 * PRE_AUTHENTICATED_REQUEST_URL: The pre-authenticated URL for the bucket and folder that contains the file Sprekerpool.json and the deltas folder; it requires Read, Write and List privileges.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const PRE_AUTHENTICATED_REQUEST_URL = process.env.PRE_AUTHENTICATED_REQUEST_URL || 
    'https://hanz.objectstorage.us-ashburn-1.oci.customer-oci.com/p/9w8hgpZUJaQC4zc/n/idtwlqf2hanz/b/laptop-extension-drive/o/';

const MAIN_FILE_PATH = 'conclusion-assets/Sprekerpool.json';
const DELTAS_FOLDER = 'deltas/';

// Main function to process delta files
async function processDeltaFiles() {
    try {
        console.log('Starting delta files processing...');
        console.log(`Using pre-authenticated URL: ${PRE_AUTHENTICATED_REQUEST_URL}`);
        
        // Step 1: Retrieve the main Sprekerpool.json file
        console.log(`Retrieving main file: ${MAIN_FILE_PATH}`);
        const mainFileUrl = `${PRE_AUTHENTICATED_REQUEST_URL}${MAIN_FILE_PATH}`;
        console.log(`Retrieving main fileURL: ${mainFileUrl}`);
        
        let speakerData;
        try {
            const mainFileResponse = await axios.get(mainFileUrl);
            speakerData = mainFileResponse.data;
            console.log(`Successfully retrieved main file with ${speakerData.length} speakers`);
        } catch (error) {
            throw new Error(`Failed to retrieve main file: ${error.message}`);
        }
        
        // Create a map of speakers by uniqueId for faster lookup
        const speakerMap = new Map();
        speakerData.forEach(speaker => {
            if (speaker.uniqueId) {
                speakerMap.set(speaker.uniqueId, speaker);
            }
        });
        // log all uniqueIds to console
        speakerMap.forEach((speaker, uniqueId) => {
            console.log(`Speaker with uniqueId: ${uniqueId}`);
        });
        console.log(`SpeakerMap size: ${speakerMap.size}`);
        // Step 2: Get a list of delta files
        console.log(`Retrieving list files from: ${PRE_AUTHENTICATED_REQUEST_URL}`);
        const deltasFolderUrl = `${PRE_AUTHENTICATED_REQUEST_URL}`;
        
        // Note: This is a simplified approach. In a real scenario, you might need to use
        // a specific API endpoint to list files or implement pagination if there are many files.
        // For this example, we'll assume we can get the file list from a GET request.
        let deltaFilesList;
        try {
            const deltaFilesResponse = await axios.get(deltasFolderUrl);
            
            // Parse the response to get the list of delta files
// the response looks like: {"objects":[{"name":"/.deleted/1*LupTuRqyqGFc6qLBNkw9QA.png"},{"name":"/.deleted/1024x576a.jpg"},{"name":"/.deleted/120px-Farsi.svg.png"},{"name":"/.deleted/2310008"},{"name":"/1*LupTuRqyqGFc6qLBNkw9QA.png"},{"name":"/1024x576a.jpg"},{"name":"/120px-Farsi.svg.png"},{"name":"/2310008"},{"name":"/250px-Persian_Language_Location_Map.svg.png"},{"name":"/Mariah_Carey_Your_Girl.png"},{"name":"/blog-images/.folder"},{"name":"/blog-images/algorithms/"},{"name":"/blog-images/algorithms/250px-Edsger_Wybe_Dijkstra.jpg"},{"name":"/blog-images/chess-puzzle.png"},{"name":"/blog-images/oci-blogs/"},{"name":"/blog-images/oci-blogs/1*LupTuRqyqGFc6qLBNkw9QA.png"},{"name":"/blog-images/oci-blogs/BLOG-IMAGES_CHESS-PUZZLE.PNG"},{"name":"/blog-images/oci-blogs/blog-images_chess-puzzle.png"},{"name":"/blog-images/organogram-klad.png"},{"name":"/blog-images/unknown-music-sheet.png"},{"name":"/blog-images/windsurf-oci-browser-extension.png"},{"name":"/countries.json"},{"name":"/icon128.png"},{"name":"/icons-oracle-analytics.webp"},{"name":"/icons-oracle-apm.webp"},{"name":"/icons-oracle-dev-ops.webp"},{"name":"/icons-oracle-kubernetes.webp"},{"name":"/list-of-countries-in-the-world.pdf"},{"name":"/logically-deleted-files.json"},{"name":"/options.html"},{"name":"conclusion-assets/Baseline_Measurement_PilotAIAssistedSoftwareEngineering original.json"},{"name":"conclusion-assets/Sprekerpool.json"},{"name":"conclusion-assets/brightspots.csv"},{"name":"conclusion-assets/deltas/SprekerpoolFake.json"},{"name":"conclusion-assets/deltas/fc86f21cf02185a.json"},{"name":"conclusion-assets/observability_survey.json"}]}

            // Note: The actual format of this response depends on your storage service
            // This is a placeholder - you'll need to adjust based on your actual API response
            deltaFilesList = deltaFilesResponse.data.objects;
// the response is an array of objects with name ; the name consists of folder path and file name; we should only retain files with path "conclusion-assets/deltas/"
            deltaFilesList = deltaFilesList.filter(file => file.name.startsWith('conclusion-assets/deltas/'));


        } catch (error) {
            throw new Error(`Failed to retrieve delta files list: ${error.message}`);
        }
        console.log(`Found ${deltaFilesList.length} delta files`);
        
        // Step 3: Process each delta file
        console.log('Processing delta files...');
        let deltaFilesProcessed = 0; // Counter for processed delta files
        for (const deltaFile of deltaFilesList) {
            const deltaFileUrl = `${deltasFolderUrl}${deltaFile.name}`;
            console.log(`Processing delta file: ${deltaFile.name}`);
            
            // Get the delta file content
            let deltaData;
            try {
                const deltaResponse = await axios.get(deltaFileUrl);
                deltaData = deltaResponse.data;
            } catch (error) {
                console.warn(`Failed to retrieve delta file ${deltaFile.name}: ${error.message}`);
                continue;
            }
            
            // Skip empty delta files
            if (!deltaData || Object.keys(deltaData).length === 0) {
                console.log(`Delta file ${deltaFile.name} is empty, skipping`);
                continue;
            }
            
            // Extract the uniqueId from the filename (assuming filename is uniqueId.json)
            // Get just the filename without the path
            const filename = deltaFile.name.includes('/') ? 
                deltaFile.name.substring(deltaFile.name.lastIndexOf('/') + 1) : 
                deltaFile.name;
            const uniqueId = filename.replace('.json', '');
            
            // Find the corresponding speaker
            if (speakerMap.has(uniqueId)) {
                console.log(`Applying delta for speaker with uniqueId: ${uniqueId}`);
                
                // Update the speaker data with the delta
                const speaker = speakerMap.get(uniqueId);
                Object.assign(speaker, deltaData);
                
                // Increment the counter for processed files
                deltaFilesProcessed++;
                
                // Step 4: Replace the delta file with an empty JSON object
                console.log(`Replacing delta file ${deltaFile.name} with empty object`);
                const emptyJson = JSON.stringify({});
                try {
                    await axios.put(deltaFileUrl, emptyJson, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                } catch (error) {
                    console.warn(`Failed to update delta file ${deltaFile.name}: ${error.message}`);
                }
            } else {
                console.warn(`No matching speaker found for uniqueId: ${uniqueId}`);
            }
        }
        
        // Step 5: Update the main Sprekerpool.json file only if delta files were processed
        if (deltaFilesProcessed > 0) {
            console.log(`Updating main Sprekerpool.json file with ${deltaFilesProcessed} changes...`);
            const updatedJson = JSON.stringify(speakerData, null, 2);
            try {
                await axios.put(mainFileUrl, updatedJson, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                console.log('Successfully updated the main Sprekerpool.json file');
            } catch (error) {
                throw new Error(`Failed to update main file: ${error.message}`);
            }
        } else {
            console.log('No delta files were processed, skipping update of main file');
        }
        
        console.log('Delta files processing completed');
        
    } catch (error) {
        console.error('Error processing delta files:', error);
    }
}

// Run the script
processDeltaFiles();
