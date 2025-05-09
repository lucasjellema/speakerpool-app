// Data Service for Speaker Pool Application
let speakerData = [];
let deltasFolderPAR = '';
let dataFilePAR = '';

const localDataURL = 'data/sprekerpool.json';
const datafileQueryParameter = 'parDataFile';
const deltasFolderQueryParameter = 'parDeltasFolder';

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
    
    return { dataFilePAR, deltasFolderPAR };
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
            
            // Attempt to load the delta file for speaker ID 7215612
            try {
                const deltaUrl = `${deltasFolderPAR}7215612.json`;
                console.log(`Attempting to load delta file from: ${deltaUrl}`);
                
                const deltaResponse = await fetch(deltaUrl);
                
                if (deltaResponse.ok) {
                    const deltaData = await deltaResponse.json();
                    console.log('Delta file loaded successfully');
                    
                    // Apply the delta to the speaker data
                    if (deltaData && deltaData.id) {
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

// Function to update a speaker's details
export function updateSpeaker(updatedSpeaker) {
    // Find the index of the speaker in the array
    const index = speakerData.findIndex(speaker => speaker.id === updatedSpeaker.id);
    
    if (index !== -1) {
        // Update the speaker data
        speakerData[index] = updatedSpeaker;
        
        // If deltasFolderPAR is specified, save the updated speaker to the delta file
        if (deltasFolderPAR) {
            // For this example, we're using a fixed ID (7215612) for the delta file
            // In a real application, you might want to use the speaker's actual ID
            const deltaUrl = `${deltasFolderPAR}7215612.json`;
            console.log(`Saving updated speaker to delta file: ${deltaUrl}`);
            
            // Convert the speaker object to JSON
            const speakerJson = JSON.stringify(updatedSpeaker, null, 2);
            const blob = new Blob([speakerJson], { type: 'application/json' });
            
            // Save the file using the saveFile function
            saveFile(blob, '7215612.json', deltasFolderPAR)
                .then(() => console.log('Speaker delta saved successfully to remote endpoint'))
                .catch(error => console.error('Error saving speaker delta:', error));
        }
        
        console.log(`Speaker ${updatedSpeaker.id} updated successfully`);
        
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
