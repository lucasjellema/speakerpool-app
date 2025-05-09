// Data Service for Speaker Pool Application
let speakerData = [];


const localDataURL = 'data/sprekerpool.json';
const datafileQueryParameter = 'parDataFile';

// Function to load speaker data from JSON file
export async function loadSpeakerData() {
    try {
        const response = await fetch(getDataUrl());
        const data = await response.json();
        speakerData = data;
        return data;
    } catch (error) {
        console.error('Error loading speaker data:', error);
        return [];
    }
}

const getDataUrl = () => {
     // Check if URL has query parameters
     const urlParams = new URLSearchParams(window.location.search);
     const dataFileParam = urlParams.get(datafileQueryParameter);
     
     // If parDataFile parameter exists in the URL, use it and store in session
     if (dataFileParam) {
         console.log(`Loading data from URL parameter: ${dataFileParam}`);
         return dataFileParam;
     }
    return localDataURL;
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
        
        // In a real application, this would also save to the server
        // For this demo, we'll just update the in-memory data
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
