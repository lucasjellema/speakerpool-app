// Main Application Script
import { loadSpeakerData, initializeParameters } from './dataService.js';
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
    const urlParams = new URLSearchParams(window.location.search);
    const sprekerId = urlParams.get('sprekerId');
    
    if (sprekerId) {
        console.log(`Speaker ID found in URL: ${sprekerId}`);
        
        // If speakers tab isn't active, activate it
        if (!document.getElementById('speakers-tab').classList.contains('active')) {
            // Load speakers content first to ensure the speaker list is populated
            loadSpeakersContent().then(() => {
                // Show the speakers tab
                const speakersTab = new bootstrap.Tab(document.getElementById('speakers-tab'));
                speakersTab.show();
                
                // Show speaker details after a short delay to ensure content is loaded
                setTimeout(() => {
                    showSpeakerDetails(sprekerId);
                }, 500);
            });
        } else {
            // If speakers tab is already active, just show the speaker details
            showSpeakerDetails(sprekerId);
        }
    }
}
