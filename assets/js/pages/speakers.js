// Import the data module
import SpeakerData from '../core/data.js';

/**
 * Speakers module for the Speakerpool application
 * Handles the speaker details page functionality
 */
const SpeakersPage = {
    // Initialize the speakers page
    async init() {
        console.log('Initializing speakers page...');
        
        // Load the speaker data
        await SpeakerData.loadSpeakers();
        const speakers = SpeakerData.getAllSpeakers();
        
        if (speakers.length === 0) {
            console.error('No speaker data available');
            return;
        }

        // Populate speaker dropdown
        this.populateSpeakerDropdown();
        
        // Add event listener to speaker dropdown
        document.getElementById('speaker-select').addEventListener('change', () => {
            const selectedSpeakerId = document.getElementById('speaker-select').value;
            if (selectedSpeakerId) {
                const selectedSpeaker = SpeakerData.getSpeakerById(selectedSpeakerId);
                this.displaySpeakerDetails(selectedSpeaker);
                
                // Update URL without reloading the page
                const url = new URL(window.location);
                url.searchParams.set('id', selectedSpeakerId);
                window.history.pushState({}, '', url);
            } else {
                // Hide speaker details if no speaker is selected
                document.getElementById('speaker-details-container').style.display = 'none';
                
                // Remove id from URL
                const url = new URL(window.location);
                url.searchParams.delete('id');
                window.history.pushState({}, '', url);
            }
        });
        
        // Check if a specific speaker is requested via URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const speakerId = urlParams.get('id');
        
        if (speakerId) {
            console.log(`Loading speaker with ID: ${speakerId}`);
            // Select the speaker in the dropdown
            const dropdown = document.getElementById('speaker-select');
            dropdown.value = speakerId;
            
            // Display the speaker details
            const speaker = SpeakerData.getSpeakerById(speakerId);
            if (speaker) {
                this.displaySpeakerDetails(speaker);
            } else {
                console.error(`Speaker with ID ${speakerId} not found`);
            }
        }
    },

    // Populate the speaker dropdown with options
    populateSpeakerDropdown() {
        const dropdown = document.getElementById('speaker-select');
        const speakers = SpeakerData.getAllSpeakers();
        
        // Sort speakers alphabetically by name
        const sortedSpeakers = [...speakers].sort((a, b) => {
            const nameA = a.name || '';
            const nameB = b.name || '';
            return nameA.localeCompare(nameB);
        });
        
        // Add options to dropdown
        sortedSpeakers.forEach(speaker => {
            const option = document.createElement('option');
            option.value = speaker.id;
            option.textContent = speaker.name || 'Unknown';
            if (speaker.company) {
                option.textContent += ` (${speaker.company})`;
            }
            dropdown.appendChild(option);
        });
    },

    // Display the details of the selected speaker
    displaySpeakerDetails(speaker) {
        if (!speaker) return;
        
        // Show the details container
        document.getElementById('speaker-details-container').style.display = 'block';
        
        // Set basic information
        document.getElementById('speaker-name').textContent = speaker.name || 'Unknown';
        document.getElementById('speaker-company').textContent = speaker.company || '';
        document.getElementById('speaker-email').textContent = speaker.emailadress || '';
        document.getElementById('speaker-topics').textContent = speaker.topics || 'No topics specified';
        document.getElementById('speaker-bio').textContent = speaker.bio || 'No biography available';
        document.getElementById('speaker-presentations').textContent = speaker.recent_presentations || 'No presentations listed';
        document.getElementById('speaker-context').textContent = speaker.context || 'No context preferences specified';
        
        // Set languages
        const languagesList = document.getElementById('speaker-languages');
        languagesList.innerHTML = '';
        
        if (speaker.languages && Object.keys(speaker.languages).length > 0) {
            Object.keys(speaker.languages).forEach(language => {
                if (speaker.languages[language]) {
                    const li = document.createElement('li');
                    li.className = 'list-group-item';
                    li.textContent = language;
                    languagesList.appendChild(li);
                }
            });
        } else {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.textContent = 'No languages specified';
            languagesList.appendChild(li);
        }
        
        // Set availability
        const internalBadge = document.querySelector('#internal-availability .badge');
        internalBadge.textContent = speaker.internal ? 'Yes' : 'No';
        internalBadge.className = `badge ${speaker.internal ? 'badge-yes' : 'badge-no'}`;
        
        const externalBadge = document.querySelector('#external-availability .badge');
        externalBadge.textContent = speaker.external ? 'Yes' : 'No';
        externalBadge.className = `badge ${speaker.external ? 'badge-yes' : 'badge-no'}`;
    }
};

// Initialize the page when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => SpeakersPage.init());
