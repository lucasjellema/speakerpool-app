// Data Service for Speaker Pool Application
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


// Function to load speaker data from JSON file
export async function loadSpeakerData() {
    try {
        // Use dataFilePAR which was set in initializeParameters (now called from main.js)
        console.log(`Loading speaker data from: ${getDataUrl()}`);
        const response = await fetch(getDataUrl());
        const data = await response.json();
        speakerData = data;
        
        // Check if we have a deltas folder specified
        if (deltasFolderPAR) {
            console.log(`Deltas folder is set to: ${deltasFolderPAR}`);
            
            // Attempt to load the delta file for the speaker ID from the query parameter
            try {
                // Use the speaker ID from the URL parameter, or default to a fallback if not specified
                const deltaFileName = speakerIdParameter ? `${speakerIdParameter}.json` : 'speaker-delta.json';
                const deltaUrl = `${deltasFolderPAR}${deltaFileName}`;
                console.log(`Attempting to load delta file from: ${deltaUrl}`);
                
                const deltaResponse = await fetch(deltaUrl);
                
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
