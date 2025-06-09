import { getDataWithToken, getUserName, getIdToken } from './authPopup.js';
// Data Service for Speaker Pool Application

const endpoint      = "https://odzno3g32mjesdrjipad23mbxq.apigateway.eu-amsterdam-1.oci.customer-oci.com/conclusion-proxy/speakerpool-data";
const deltaEndpoint = "https://odzno3g32mjesdrjipad23mbxq.apigateway.eu-amsterdam-1.oci.customer-oci.com/conclusion-proxy/speakerpool-delta"; //conclusion-assets/deltas";

let speakerData = [];
let deltasFolderPAR = '';
let dataFilePAR = '';
let speakerIdParameter = '';
let isAdminMode = false;

const localDataURL = 'data/Sprekerpool.json';
const datafileQueryParameter = 'parDataFile';
const deltasFolderQueryParameter = 'parDeltasFolder';
const speakerIdQueryParameter = 'sprekerId';
const adminModeQueryParameter = 'admin';

// Functions to get URL parameters
export function getDataFilePAR() {
    return dataFilePAR;
}

export function getDeltasFolderPAR() {
    return deltasFolderPAR;
}

export function getSpeakerIdParameter() {
    return speakerIdParameter;
}

export function isInAdminMode() {
    return isAdminMode;
}

// Function to check if a speaker is the one referenced in the URL
export function isSpeakerInUrl(speakerId) {
    return speakerIdParameter && speakerIdParameter === speakerId;
}

// Function to initialize parameters from URL
export function initializeParameters() {
    const urlParams = new URLSearchParams(window.location.search);

    // Get dataFile parameter
    const dataFileParam = urlParams.get(datafileQueryParameter);
    if (dataFileParam) {
        dataFilePAR = dataFileParam;
        console.log(`Initialized dataFilePAR: ${dataFilePAR}`);
    }

    // Get deltasFolder parameter
    const deltasFolderParam = urlParams.get(deltasFolderQueryParameter);
    if (deltasFolderParam) {
        deltasFolderPAR = deltasFolderParam;
        console.log(`Initialized deltasFolderPAR: ${deltasFolderPAR}`);
    } else {
        console.log('No deltasFolderPAR specified');
    }

    // Get speaker ID parameter
    const speakerIdParam = urlParams.get(speakerIdQueryParameter);
    if (speakerIdParam) {
        speakerIdParameter = speakerIdParam;
        console.log(`Initialized speakerIdParameter: ${speakerIdParameter}`);
    }

    // Check for admin mode
    const adminParam = urlParams.get(adminModeQueryParameter);
    if (adminParam && adminParam.toLowerCase() === 'yes') {
        isAdminMode = true;
        console.log('Admin mode enabled');
    } else {
        isAdminMode = false;
        console.log('Admin mode disabled');
    }

    return { dataFilePAR, deltasFolderPAR, speakerIdParameter, isAdminMode };
}




// Function to find a speaker by name (case-insensitive)
export async function getSpeakerByName(name) {
    if (!name) return null;
    // Assuming speakerData is populated after initial load via loadSpeakerData().
    if (speakerData && speakerData.length > 0) {
        const lowerCaseName = name.toLowerCase();
        return speakerData.find(speaker => speaker.name && speaker.name.toLowerCase() === lowerCaseName);
    }
    // Optionally, if speakerData might not be loaded yet, you could try loading it:
    // else if (typeof loadSpeakerData === 'function') {
    //     await loadSpeakerData(); // Assuming loadSpeakerData is async and populates speakerData
    //     if (speakerData && speakerData.length > 0) {
    //         const lowerCaseName = name.toLowerCase();
    //         return speakerData.find(speaker => speaker.name && speaker.name.toLowerCase() === lowerCaseName);
    //     }
    // }
    return null;
}


// this function retrieves the modified speaker data for a specific user (typically the logged-in user)
export async function loadUserSpeakerData(username) {
    if (!username) {
        console.warn('loadUserSpeakerData: username not provided.');
        return null;
    }

    const token = getIdToken();
    if (!token) {
        console.warn('loadUserSpeakerData: Authentication token not found.');
        return null;
    }

    // deltaEndpoint should be the base path for the API Gateway route that handles GET for user-specific deltas
    // e.g., https://<api-gw-host>/conclusion-proxy/speakerpool-delta
    // The API Gateway is configured to use request.auth[name] (which should match `username` here if called for self)
    // to determine the actual backend S3 object path.
    const userDeltaEndpoint = deltaEndpoint; 

    console.log(`Attempting to GET user-specific speaker data from: ${userDeltaEndpoint} for user: ${username}`);

    try {
        const response = await fetch(userDeltaEndpoint, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const userSpecificData = await response.json();
            // Check if the delta file contains an empty JSON object or is otherwise invalid
            if (Object.keys(userSpecificData).length === 0) {
                console.log(`User-specific delta file for ${username} is empty.`);
                return null; 
            }
            if (!userSpecificData.id) {
                console.warn(`User-specific data for ${username} is missing an 'id'.`, userSpecificData);
                return null;
            }
            console.log(`Successfully loaded user-specific data for ${username}:`, userSpecificData);
            return userSpecificData;
        } else if (response.status === 404) {
            console.log(`No user-specific delta file found for ${username} (404).`);
            return null;
        } else {
            const errorBody = await response.text();
            console.error(`Error fetching user-specific speaker data for ${username}:`, response.status, errorBody);
            return null;
        }
    } catch (error) {
        console.error(`Exception in loadUserSpeakerData for ${username}:`, error);
        return null;
    }
}


// Function to load speaker data from JSON file
export async function loadSpeakerData() {
    try {
        let response;
        response = await getDataWithToken(endpoint)

                
        // Use dataFilePAR which was set in initializeParameters
        // console.log(`Loading speaker data from: ${getDataUrl()}`);
        //  response = await fetch(getDataUrl(), {
        //     headers: {
        //         'Authorization': `Bearer {token}`,
        //         'Content-Type': 'application/json'
        //     },
        //     credentials: 'include' // Include cookies if needed
        // });


        if (!response.ok) {
            throw new Error(`Failed to load data: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        speakerData = data;

        // After loading main data, try to load and merge user-specific data if a user is logged in and is a speaker
        const currentUserName = getUserName();
        if (currentUserName) {
            console.log(`Current user: ${currentUserName}. Checking if they are a speaker.`);
            // Use the main speakerData to check if the current user is listed
            const speakerProfileInMainData = speakerData.find(s => s.name && s.name.toLowerCase() === currentUserName.toLowerCase());

            if (speakerProfileInMainData) {
                console.log(`User ${currentUserName} is a speaker. Attempting to load their specific delta data.`);
                const userSpecificData = await loadUserSpeakerData(currentUserName);

                if (userSpecificData && userSpecificData.id) {
                    const speakerIndex = speakerData.findIndex(s => s.id === userSpecificData.id);
                    if (speakerIndex !== -1) {
                        console.log(`Merging user-specific data for ${currentUserName} (ID: ${userSpecificData.id}) into main speaker data.`);
                        speakerData[speakerIndex] = { ...speakerData[speakerIndex], ...userSpecificData }; // Merge, userSpecificData takes precedence
                    } else {
                        console.warn(`Could not find speaker with ID ${userSpecificData.id} (from user-specific data for ${currentUserName}) in the main speakerData list to merge.`);
                    }
                } else {
                    console.log(`No valid user-specific delta data found for ${currentUserName} to merge.`);
                }
            } else {
                console.log(`User ${currentUserName} is logged in but not found in the main speaker list.`);
            }
        } else {
            console.log('No user currently logged in, skipping user-specific data load.');
        }

        // Check if we have a deltas folder specified (for admin/URL param based delta loading - this might be redundant or for a different purpose now)
        if (deltasFolderPAR) {
            console.log(`Deltas folder is set to: ${deltasFolderPAR}`);

            // Attempt to load the delta file for the speaker ID from the query parameter
            try {
                // Use the speaker ID from the URL parameter, or default to a fallback if not specified
                const deltaFileName = speakerIdParameter ? `${speakerIdParameter}.json` : 'speaker-delta.json';
                const deltaUrl = `${deltasFolderPAR}${deltaFileName}`;
                console.log(`Attempting to load delta file from: ${deltaUrl}`);

                //  const token = await getAccessToken();
                const deltaResponse = await fetch(deltaUrl, {
                    headers: {
                        'Authorization': `Bearer {token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (deltaResponse.ok) {
                    const deltaData = await deltaResponse.json();
                    console.log('Delta file loaded successfully');

                    // Check if the delta file contains an empty JSON object
                    const isEmptyObject = Object.keys(deltaData).length === 0;

                    if (isEmptyObject) {
                        console.log('Delta file contains an empty JSON object, skipping processing');
                    }
                    // Apply the delta to the speaker data if it's not empty and has an ID
                    else if (deltaData && deltaData.id) {
                        // Find the index of the speaker with matching ID
                        const speakerIndex = speakerData.findIndex(speaker => speaker.id === deltaData.id);

                        if (speakerIndex !== -1) {
                            // Replace the speaker data with the delta data
                            console.log(`Applying delta for speaker ID: ${deltaData.id}`);
                            speakerData[speakerIndex] = deltaData;
                        } else {
                            // If speaker not found, add it to the array
                            console.log(`Speaker ID ${deltaData.id} not found in main data, adding as new speaker`);
                            speakerData.push(deltaData);
                        }
                    } else {
                        console.warn('Delta file does not contain valid speaker data with ID');
                    }
                } else {
                    console.log(`Delta file not found or not accessible (status: ${deltaResponse.status})`);
                }
            } catch (deltaError) {
                // Don't let delta loading failure affect the main data loading
                console.warn('Error loading delta file:', deltaError);
            }
        }

        return speakerData;
    } catch (error) {
        console.error('Error loading speaker data:', error);
        return [];
    }
}

// This function is now replaced by initializeParameters
// Keeping it for backward compatibility but it's not used in loadSpeakerData anymore
const getDataUrl = () => {

    if (dataFilePAR) {
        return dataFilePAR;
    }
    return localDataURL;
}

export async function updateMySpeakerProfile(updatedProfileData) {
    const currentUserName = getUserName();
    if (!currentUserName) {
        throw new Error('User not authenticated or name claim is missing.');
    }

    const token = getIdToken();
    if (!token) {
        throw new Error('Authentication token not found. Please sign in.');
    }

    // The API Gateway route for /deltas (e.g., /conclusion-proxy/speakerpool-delta or /conclusion-proxy2/deltas)
    // is expected to handle PUT requests and use request.auth[name] to determine the specific file in object storage.
    // The deltaEndpoint variable should point to this base path for the API Gateway route.
    // Based on previous user changes (Step 31), deltaEndpoint was set to:
    // "https://odzno3g32mjesdrjipad23mbxq.apigateway.eu-amsterdam-1.oci.customer-oci.com/conclusion-proxy/speakerpool-delta"
    // (after removing /conclusion-assets/deltas/ from its original value)
    // This is the endpoint the PUT request should target.
    const actualPutEndpoint = deltaEndpoint; 

    console.log(`Attempting to PUT updated profile to: ${actualPutEndpoint} for user: ${currentUserName}`);

    try {
        const response = await fetch(actualPutEndpoint, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedProfileData)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Error updating profile:', response.status, errorBody);
            throw new Error(`Failed to update profile: ${response.status} ${response.statusText}. Detail: ${errorBody}`);
        }

        // Update local speakerData cache
        const speakerIndex = speakerData.findIndex(s => s.id === updatedProfileData.id);
        if (speakerIndex !== -1) {
            speakerData[speakerIndex] = { ...speakerData[speakerIndex], ...updatedProfileData };
            console.log('Local speaker data cache updated for speaker ID:', updatedProfileData.id);
        } else {
            console.warn('Speaker ID not found in local cache for update:', updatedProfileData.id);
            // Optionally, add the new profile if it's somehow missing but was successfully PUT.
            // speakerData.push(updatedProfileData); 
        }

        // Dispatch an event to notify other modules (e.g., speakerDetailsModule to refresh)
        document.dispatchEvent(new CustomEvent('speakerDataUpdated', { 
            detail: { 
                speakerId: updatedProfileData.id, 
                updatedData: speakerData.find(s => s.id === updatedProfileData.id) || updatedProfileData 
            }
        }));
        
        // Try to parse JSON from response, but handle cases where response might be empty (e.g., 204 No Content)
        const responseContentType = response.headers.get('content-type');
        let responseData = { success: true }; // Default success response
        if (responseContentType && responseContentType.includes('application/json')) {
            responseData = await response.json();
        } else if (response.status === 204) {
             console.log('Profile updated successfully (204 No Content).');
        } else {
            // If not JSON and not 204, just use default success and log the text if any
            const textResponse = await response.text();
            if(textResponse) console.log('Update response text:', textResponse);
        }

        return { success: true, data: responseData };
    } catch (error) {
        console.error('Error in updateMySpeakerProfile:', error);
        throw error; // Re-throw to allow calling code to handle it
    }
}


// Function to export all speaker data as JSON
export function exportSpeakerData() {
    // Convert the speaker data to a JSON string with pretty formatting
    const speakerJson = JSON.stringify(speakerData, null, 2);

    // Create a Blob with the JSON data
    const blob = new Blob([speakerJson], { type: 'application/json' });

    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);

    // Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Sprekerpool.json';

    // Append the link to the body
    document.body.appendChild(link);

    // Trigger a click on the link to start the download
    link.click();

    // Remove the link from the document
    document.body.removeChild(link);

    // Release the URL object
    URL.revokeObjectURL(url);
}

const saveFile = async (blob, filename, preAuthenticatedRequestURL) => {
    const fetchOptions = {
        method: 'PUT',
        body: blob,
    };

    const targetURL = preAuthenticatedRequestURL + filename;
    try {
        const response = await fetch(targetURL, fetchOptions);
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        console.log(`File saved successfully to ${targetURL}`);
        return 0;
    } catch (error) {
        console.error(`Error saving file to ${targetURL}:`, error);
        return 1;
    }
}

// Function to get all speaker data
export function getAllSpeakers() {
    return speakerData;
}

// Function to get a specific number of speakers
export function getSpeakers(count = 3) {
    return speakerData.slice(0, count);
}

// Function to get a speaker by ID
export function getSpeakerById(id) {
    return speakerData.find(speaker => speaker.id === id);
}

// Function to get a speaker by unique ID
export function getSpeakerByUniqueId(uniqueId) {
    return speakerData.find(speaker => speaker.uniqueId === uniqueId);
}

// Function to update a speaker's details
export function updateSpeaker(updatedSpeaker) {
    // Find the index of the speaker in the array
    const index = speakerData.findIndex(speaker => speaker.id === updatedSpeaker.id);

    if (index !== -1) {
        // Add last modified timestamp to the speaker data
        updatedSpeaker.lastModifiedTimestamp = new Date().toISOString();

        // Update the speaker data
        speakerData[index] = updatedSpeaker;

        // If deltasFolderPAR is specified, save the updated speaker to the delta file
        if (deltasFolderPAR) {
            // Use the speaker's uniqueId for the delta file name, or fall back to the regular ID
            const deltaFileName = updatedSpeaker.uniqueId ? `${updatedSpeaker.uniqueId}.json` : `${updatedSpeaker.id}.json`;
            const deltaUrl = `${deltasFolderPAR}${deltaFileName}`;
            console.log(`Saving updated speaker to delta file: ${deltaUrl}`);

            // Convert the speaker object to JSON
            const speakerJson = JSON.stringify(updatedSpeaker, null, 2);
            const blob = new Blob([speakerJson], { type: 'application/json' });

            // Save the file using the saveFile function
            saveFile(blob, deltaFileName, deltasFolderPAR)
                .then(() => console.log('Speaker delta saved successfully to remote endpoint'))
                .catch(error => console.error('Error saving speaker delta:', error));
        }

        console.log(`Speaker ${updatedSpeaker.id} updated successfully`);

        // Dispatch a custom event to notify components that data has changed
        const event = new CustomEvent('speakerDataUpdated', { detail: { speakerId: updatedSpeaker.id } });
        document.dispatchEvent(event);

        return true;
    } else {
        // Add last modified timestamp to the speaker data
        updatedSpeaker.lastModifiedTimestamp = new Date().toISOString();

        // This is a new speaker - add it to the array
        speakerData.push(updatedSpeaker);

        // If deltasFolderPAR is specified, save the updated speaker to the delta file
        if (deltasFolderPAR) {
            // Use the speaker's uniqueId for the delta file name, or fall back to the regular ID
            const deltaFileName = updatedSpeaker.uniqueId ? `${updatedSpeaker.uniqueId}.json` : `${updatedSpeaker.id}.json`;
            const deltaUrl = `${deltasFolderPAR}${deltaFileName}`;
            console.log(`Saving new speaker to delta file: ${deltaUrl}`);

            // Convert the speaker object to JSON
            const speakerJson = JSON.stringify(updatedSpeaker, null, 2);
            const blob = new Blob([speakerJson], { type: 'application/json' });

            // Save the file using the saveFile function
            saveFile(blob, deltaFileName, deltasFolderPAR)
                .then(() => console.log('New speaker delta saved successfully to remote endpoint'))
                .catch(error => console.error('Error saving new speaker delta:', error));
        }

        console.log(`New speaker ${updatedSpeaker.id} added successfully`);

        // Dispatch a custom event to notify components that data has changed
        const event = new CustomEvent('speakerDataUpdated', { detail: { speakerId: updatedSpeaker.id } });
        document.dispatchEvent(event);

        return true;
    }

    return false;
}

// Function to get all unique companies from speaker data
export function getAllCompanies() {
    const companies = new Set();

    speakerData.forEach(speaker => {
        if (speaker.company) {
            companies.add(speaker.company);
        }
    });

    return Array.from(companies).sort();
}

// Function to get all unique languages from speaker data
export function getAllLanguages() {
    const languages = new Set();

    speakerData.forEach(speaker => {
        if (speaker.languages) {
            Object.keys(speaker.languages).forEach(language => {
                if (speaker.languages[language] === true) {
                    languages.add(language);
                }
            });
        }
    });

    return Array.from(languages).sort();
}

// Function to search speakers by various criteria
export function searchSpeakers(criteria) {
    // This is a placeholder for future search functionality
    return speakerData.filter(speaker => {
        // Basic search implementation - can be expanded later
        if (criteria.name && speaker.name.toLowerCase().includes(criteria.name.toLowerCase())) {
            return true;
        }
        if (criteria.topics && speaker.topics.toLowerCase().includes(criteria.topics.toLowerCase())) {
            return true;
        }
        return false;
    });
}
