import { getDataWithToken, getUserName, getIdToken, getUserEmailFromToken } from './authPopup.js';
// Data Service for Speaker Pool Application

const endpoint = "https://odzno3g32mjesdrjipad23mbxq.apigateway.eu-amsterdam-1.oci.customer-oci.com/conclusion-proxy/speakerpool-data";
export const privacyStatementEndpoint = "https://axfaxcymae5t.objectstorage.eu-amsterdam-1.oci.customer-oci.com/p/w9Sk0kiQboRo5oFGk1x-kOiWiR1P8X8ULXpGjupWbq3TtJJhK45HXGSxS5sLXlVd/n/axfaxcymae5t/b/conclusion-assets/o/public/Privacy statement Conclusion Sprekerpool.pdf";
const adminEndpoint = "https://odzno3g32mjesdrjipad23mbxq.apigateway.eu-amsterdam-1.oci.customer-oci.com/conclusion-admin-proxy/speakerpool-admin";
const deltaEndpoint = "https://odzno3g32mjesdrjipad23mbxq.apigateway.eu-amsterdam-1.oci.customer-oci.com/conclusion-proxy/speakerpool-delta"; //sprekerpool/deltas";

let speakerData = [];

let speakerIdParameter = '';
let isAdminMode = false;

const localDataURL = 'data/Sprekerpool.json';
const speakerIdQueryParameter = 'sprekerId';
const adminModeQueryParameter = 'admin';

// Functions to get URL parameters
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
    speakerIdParameter = urlParams.get(speakerIdQueryParameter);
    // Check for 'admin=yes' (case-insensitive)
    const adminParam = urlParams.get(adminModeQueryParameter);
    isAdminMode = adminParam?.toLowerCase() === 'yes';
    console.log(`Admin mode: ${isAdminMode}`);
    console.log(`SpeakerId from URL: ${speakerIdParameter}`);

}

// Function to find a speaker by name (case-insensitive)
export async function getSpeakerByName(name) {
    if (!name) return null;
    // Assuming speakerData is populated after initial load via loadSpeakerData().
    if (speakerData && speakerData.length > 0) {
        const lowerCaseInput = name.toLowerCase();

        // First, try to match by speaker's name
        let foundSpeaker = speakerData.find(speaker => speaker.name && speaker.name.toLowerCase() === lowerCaseInput);

        if (foundSpeaker) {
            return foundSpeaker;
        }

        // If no match by name, try to match by comparing speaker's email address with the token's preferred_username claim
        console.log(`No speaker found by name for input "${name}". Trying to match by token's preferred_username against speaker email.`);
        const tokenEmail = getUserEmailFromToken();
        if (tokenEmail) {
            const lowerCaseTokenEmail = tokenEmail.toLowerCase();
            foundSpeaker = speakerData.find(speaker =>
                speaker.emailadress &&
                typeof speaker.emailadress === 'string' &&
                speaker.emailadress.toLowerCase() === lowerCaseTokenEmail
            );
            if (foundSpeaker) {
                console.log(`Speaker found by matching token email (${tokenEmail}) with speaker email.`);
                return foundSpeaker;
            }
        } else {
            console.log('No email found in token to perform email-based matching.');
        }

        // If still no match, as a final fallback, try the original input 'name' against email (covers cases where 'name' param IS an email)
        console.log(`No speaker found by token email. Final attempt: matching input "${name}" against speaker email.`);
        foundSpeaker = speakerData.find(speaker =>
            speaker.emailadress &&
            typeof speaker.emailadress === 'string' &&
            speaker.emailadress.toLowerCase() === lowerCaseInput // lowerCaseInput is name.toLowerCase()
        );

        return foundSpeaker; // This will be the speaker if found, or null/undefined if not
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

    // Debug call to fetch admin endpoint and log response
    (async () => {
        try {
            const token = getIdToken();
            if (!token) {
                console.error('Admin mode: Authentication token not found.');
                return;
            }

            const response = await fetch(adminEndpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();
            console.log('Admin endpoint response:', data);
        } catch (error) {
            console.error('Error fetching admin endpoint:', error);
        }
    })();




    // deltaEndpoint should be the base path for the API Gateway route that handles GET for user-specific deltas
    // e.g., https://<api-gw-host>/conclusion-proxy/speakerpool-delta
    // The API Gateway is configured to use request.auth[name] (which should match `username` here if called for self)
    // to determine the actual backend S3 object path.
    const userDeltaEndpoint = deltaEndpoint;

    console.log(`Attempting to GET user-specific speaker data from: ${userDeltaEndpoint} for user: ${username}`);

    try {
        const response = await fetch(userDeltaEndpoint + `?ts=${Date.now()}`, {
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

            if (isInAdminMode()) {
                console.log('In admin mode, attempting to fetch and merge all speaker deltas.');
                const allSpeakerDeltas = await retrieveAllSpeakerDeltas();
                if (allSpeakerDeltas && allSpeakerDeltas.length > 0) {
                    allSpeakerDeltas.forEach(delta => {
                        if (delta && delta.id) { // Assuming delta objects have an 'id' for matching
                            const speakerIndex = speakerData.findIndex(s => s.id === delta.id);
                            if (speakerIndex !== -1) {
                                console.log(`Admin mode: Merging delta for speaker ID ${delta.id} (${speakerData[speakerIndex].name}).`);
                                speakerData[speakerIndex] = { ...speakerData[speakerIndex], ...delta };

                            } else {
                                console.warn(`Admin mode: Delta received for unknown speaker ID ${delta.id}.`);
                                console.log(`Admin mode: Adding delta as a new speaker with ID ${delta.id} (${delta.name}).`);
                                speakerData.push(delta);

                            }
                        } else if (delta && delta.name) {
                            // Fallback: if no ID, try to match by normalized name (requires normalizeName function)
                            // const normalizedDeltaName = normalizeName(delta.name); // You'd need to add normalizeName function
                            // const speakerIndex = speakerData.findIndex(s => normalizeName(s.name) === normalizedDeltaName);
                            // if (speakerIndex !== -1) { ... similar merge logic ... }
                            console.warn('Admin mode: Delta received without ID, name-based merging not yet fully implemented here.', delta);
                        } else {
                            console.warn('Admin mode: Received invalid delta object.', delta);
                        }
                    });
                    console.log('Admin mode: Finished merging all speaker deltas.');
                } else {
                    console.log('Admin mode: No speaker deltas found or returned to merge.');
                }
            }
        } else {
            console.log('No user currently logged in, skipping user-specific data load.');
        }


        return speakerData;
    } catch (error) {
        console.error('Error loading speaker data:', error);
        return [];
    }
}

// Function to add a new speaker profile for the currently logged-in user
export async function addNewSpeakerProfile(newSpeakerProfileData) {
    const currentUserName = getUserName();
    if (!currentUserName) {
        console.error('Cannot add new speaker profile: User not logged in.');
        return { success: false, message: 'User not logged in.' };
    }

    // Ensure the profile name matches the logged-in user, or set it if not present
    newSpeakerProfileData.name = currentUserName;

    // Generate ID and uniqueId if they don't exist (they shouldn't for a new profile from UI)
    if (!newSpeakerProfileData.id) {
        newSpeakerProfileData.id = self.crypto.randomUUID().toString();
    }
    if (!newSpeakerProfileData.uniqueId) {
        // For simplicity, uniqueId can be the same as id for new profiles, 
        // or a separate UUID if strict distinction is needed later.
        newSpeakerProfileData.uniqueId = newSpeakerProfileData.id;
    }

    // Add timestamps
    const now = new Date().toISOString();
    newSpeakerProfileData.createdDate = now;
    newSpeakerProfileData.lastModified = now;

    // The delta file name is based on the user's name (from JWT)
    // IMPORTANT: Ensure deltaEndpoint is correctly defined and accessible for PUT requests for new files.
    // The API Gateway should be configured to allow PUT to create a new delta if one doesn't exist.

    console.log(`Attempting to save new speaker profile for ${currentUserName} to delta file via endpoint: ${deltaEndpoint}`);
    const token = getIdToken();
    if (!token) {
        throw new Error('Authentication token not found. Please sign in.');
    }

    try {
        const response = await fetch(deltaEndpoint, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newSpeakerProfileData)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Error creating new profile:', response.status, errorBody);
            throw new Error(`Failed to create profile: ${response.status} ${response.statusText}. Detail: ${errorBody}`);
        }
        console.log(`New speaker profile for ${currentUserName} saved successfully to remote delta.`);

        // Add the new speaker to the local speakerData array
        speakerData.push(newSpeakerProfileData);
        console.log('New speaker added to local speakerData array:', newSpeakerProfileData);

        // Dispatch an event so UI can update (e.g., hide 'Add Me' button, show 'My Profile', refresh lists)
        window.dispatchEvent(new CustomEvent('speakerDataUpdated', {
            detail: { speakerId: newSpeakerProfileData.id, isNew: true, newData: newSpeakerProfileData }
        }));
        window.dispatchEvent(new CustomEvent('newSpeakerAdded', { // More specific event
            detail: { newSpeaker: newSpeakerProfileData }
        }));

        return { success: true, message: 'New speaker profile saved.', newSpeaker: newSpeakerProfileData };
    } catch (error) {
        console.error('Error saving new speaker profile delta:', error);
        return { success: false, message: `Error saving new speaker profile: ${error.message || 'Unknown error'}` };
    }
}

export async function updateMySpeakerProfile(updatedProfileData) {
    console.log('updateMySpeakerProfile called with:', updatedProfileData);
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

    // Add/update the lastModified timestamp
    updatedProfileData.lastModified = new Date().toISOString();

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
            if (textResponse) console.log('Update response text:', textResponse);
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
        // Existing speaker found, update it
        updatedSpeaker.lastModified = new Date().toISOString();
        speakerData[index] = updatedSpeaker;
        console.log(`Admin mode: Updated speaker ${updatedSpeaker.name} in memory. lastModified: ${updatedSpeaker.lastModified}`);
    } else if (isInAdminMode()) {
        // Speaker not found, BUT we are in admin mode.
        // This handles the case where an admin used 'createNewSpeaker' which generated an ID,
        // and this is the first 'save' for that new speaker.
        console.log(`Admin mode: Speaker with ID ${updatedSpeaker.id} not found. Adding as new speaker.`);
        if (!updatedSpeaker.createdDate) { // Set createdDate if not already set (e.g., by createNewSpeaker)
            updatedSpeaker.createdDate = new Date().toISOString();
        }
        updatedSpeaker.lastModified = new Date().toISOString();
        speakerData.push(updatedSpeaker);
        console.log(`Admin mode: Added new speaker ${updatedSpeaker.name} to local speakerData.`);
    } else {
        // Not found and not admin mode adding a new one - this is an error.
        console.warn(`Speaker with ID ${updatedSpeaker.id} not found, and not in admin mode to add.`);
        return { success: false, message: `Speaker with ID ${updatedSpeaker.id} not found.` };
    }

    // Dispatch events for both update and admin-add-new scenarios
    window.dispatchEvent(new CustomEvent('speakerDataModifiedByAdmin', {
        detail: {
            speakerId: updatedSpeaker.id,
            updatedData: updatedSpeaker // Send the full updated/new speaker data
        }
    }));
    window.dispatchEvent(new CustomEvent('speakerDataUpdated', {
        detail: {
            speakerId: updatedSpeaker.id,
            updatedData: updatedSpeaker,
            isNew: index === -1 && isInAdminMode() // Flag if it was an admin adding new
        }
    }));

    return { success: true, message: index === -1 ? 'New speaker added by admin.' : 'Speaker updated by admin.' };
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

// Function for admin to save all speaker data (potentially modified)
export async function saveSpeakerDataAsAdmin() {
    if (!isInAdminMode()) {
        console.error('Attempted to call saveSpeakerDataAsAdmin when not in admin mode.');
        return { success: false, message: 'Not in admin mode.' };
    }

    const token = getIdToken();
    if (!token) {
        console.error('Admin save: Authentication token not found.');
        return { success: false, message: 'Authentication token not found. Please sign in.' };
    }

    console.log(`Admin mode: Saving all speaker data (${speakerData.length} speakers) to ${adminEndpoint}`);

    try {
        const response = await fetch(adminEndpoint, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Asset-Path': 'sprekerpool/SprekerpoolADMIN.json'
            },
            body: JSON.stringify(speakerData) // Send the entire current speakerData array
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Admin save failed: ${response.status} ${response.statusText}. ${errorBody}`);
            throw new Error(`Failed to save speaker data as admin: ${response.status} ${response.statusText}. ${errorBody}`);
        }

        console.log('Admin mode: Speaker data saved successfully via adminEndpoint.');
        // Optionally, dispatch an event indicating admin save success
        window.dispatchEvent(new CustomEvent('adminDataSavedSuccess'));
        return { success: true, message: 'Speaker data saved successfully.' };

    } catch (error) {
        console.error('Error in saveSpeakerDataAsAdmin:', error);
        // Optionally, dispatch an event indicating admin save failure
        window.dispatchEvent(new CustomEvent('adminDataSavedError', { detail: error }));
        return { success: false, message: error.message || 'An unexpected error occurred.' };
    }
}



async function retrieveAllSpeakerDeltas() {
    if (!isInAdminMode()) {
        console.warn("retrieveAllSpeakerDeltas called when not in admin mode.");
        return [];
    }
    const token = getIdToken();
    if (!token) {
        console.warn("retrieveAllSpeakerDeltas: Authentication token not found.");
        return [];
    }

    const allFetchedDeltas = [];

    // Step 1: Get the list of delta file names
    console.log(`Admin mode: Fetching list of delta file names from ${adminEndpoint} with empty Asset-Path.`);
    try {
        // add timestamp to prevent caching
        const listResponse = await fetch(adminEndpoint + `?ts=${Date.now()}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Asset-Path': '' // Empty string for listing
            }
        });

        if (!listResponse.ok) {
            const errorBody = await listResponse.text();
            console.error(`Error fetching delta file list: ${listResponse.status} ${listResponse.statusText}. Body: ${errorBody}`);
            return []; // Stop if we can't get the list
        }

        const listData = await listResponse.json();

        if (!listData || typeof listData.objects !== 'object' || listData.objects === null) {
            console.error('Error: Delta file list response does not contain a valid \'objects\' property.', listData);
            return [];
        }

        // Convert the object of objects into an array of {name: 'path'} objects, then extract the names
        const allObjectPaths = Object.values(listData.objects);
        let deltaFileNames = allObjectPaths
            .map(obj => obj && obj.name) // Extract the name property
            .filter(name => typeof name === 'string'); // Ensure it's a string

        // Further filter to include only actual delta files, e.g., those in a specific path
        // This path should match how your delta files are stored and identified.
        const deltasBasePath = 'sprekerpool/deltas/'; // Adjust if your delta path is different
        deltaFileNames = deltaFileNames.filter(name => name.startsWith(deltasBasePath));

        if (deltaFileNames.length === 0) {
            console.log('No delta files found after filtering paths.');
            return [];
        }
        console.log(`Found ${deltaFileNames.length} delta file names to process after filtering:`, deltaFileNames);

        // Step 2: Fetch each delta file individually
        for (const assetPath of deltaFileNames) {
            if (!assetPath || typeof assetPath !== 'string') {
                console.warn('Skipping invalid asset path:', assetPath);
                continue;
            }
            console.log(`Admin mode: Fetching delta file with Asset-Path: ${assetPath}`);
            try {
                const deltaResponse = await fetch(adminEndpoint + `?ts=${Date.now()}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Asset-Path': assetPath
                    }
                });

                if (deltaResponse.ok) {
                    const deltaData = await deltaResponse.json();
                    if (deltaData && (deltaData.id || deltaData.name)) { // Basic validation
                        allFetchedDeltas.push(deltaData);
                        console.log(`Successfully fetched and added delta for Asset-Path: ${assetPath}`);
                    } else {
                        console.warn(`Skipping delta from ${assetPath} due to missing id/name or empty data.`, deltaData);
                    }
                } else {
                    const errorBody = await deltaResponse.text();
                    console.warn(`Error fetching delta file for Asset-Path ${assetPath}: ${deltaResponse.status} ${deltaResponse.statusText}. Body: ${errorBody}`);
                }
            } catch (fileError) {
                console.error(`Exception fetching individual delta file ${assetPath}:`, fileError);
            }
        }

        console.log(`Admin mode: Successfully fetched ${allFetchedDeltas.length} delta files.`);
        return allFetchedDeltas;

    } catch (error) {
        console.error(`Exception in retrieveAllSpeakerDeltas (outer try-catch):`, error);
        return [];
    }
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
