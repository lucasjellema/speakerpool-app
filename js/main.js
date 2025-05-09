// Main Application Script
import { loadSpeakerData, initializeParameters, getSpeakerByUniqueId, getSpeakerIdParameter } from './dataService.js';
import { loadDashboardContent } from './modules/tabs/dashboardTab.js';
import { loadFindContent } from './modules/tabs/findTab.js';
import { loadSpeakersContent } from './modules/tabs/speakersTab.js';
import { initializeSpeakerDetails, showSpeakerDetails } from './modules/speakerDetailsModule.js';

// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
    try {
        // Initialize parameters from URL first - once per session
        initializeParameters();
        
        // Load speaker data
        await loadSpeakerData();
        
        // Load initial tab content (dashboard is active by default)
        await loadDashboardContent();
        
        // Set up tab event listeners
        initializeTabEventListeners();
        
        // Initialize speaker details module
        await initializeSpeakerDetails();
        
        // Check if sprekerId query parameter exists
        checkForSpeakerIdParameter();
    } catch (error) {
        console.error('Error initializing application:', error);
    }
}

function initializeTabEventListeners() {
    // Add event listeners for tab switching
    const tabs = document.querySelectorAll('[data-bs-toggle="tab"]');
    tabs.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function (event) {
            const targetTabId = event.target.getAttribute('id');
            
            // Load content based on which tab was clicked
            switch (targetTabId) {
                case 'dashboard-tab':
                    loadDashboardContent();
                    break;
                case 'find-tab':
                    loadFindContent();
                    break;
                case 'speakers-tab':
                    loadSpeakersContent();
                    break;
            }
        });
    });
}

// Function to check for sprekerId query parameter and show speaker details if present
function checkForSpeakerIdParameter() {
    // Get speaker ID from the centralized data service
    const sprekerId = getSpeakerIdParameter();
    
    if (sprekerId) {
        console.log(`Speaker ID found in URL: ${sprekerId}`);
        
        // Get the speaker by unique ID
        const speaker = getSpeakerByUniqueId(sprekerId);
        
        // If speaker not found by unique ID, log a message
        if (!speaker) {
            console.warn(`No speaker found with unique ID: ${sprekerId}`);
            return;
        }
        
        console.log(`Found speaker: ${speaker.name} with unique ID: ${sprekerId}`);
        
        // If speakers tab isn't active, activate it
        if (!document.getElementById('speakers-tab').classList.contains('active')) {
            // Load speakers content first to ensure the speaker list is populated
            loadSpeakersContent().then(() => {
                // Show the speakers tab
                const speakersTab = new bootstrap.Tab(document.getElementById('speakers-tab'));
                speakersTab.show();
                
                // Show speaker details after a short delay to ensure content is loaded
                setTimeout(() => {
                    showSpeakerDetails(speaker.id);
                }, 500);
            });
        } else {
            // If speakers tab is already active, just show the speaker details
            showSpeakerDetails(speaker.id);
        }
    }
}
