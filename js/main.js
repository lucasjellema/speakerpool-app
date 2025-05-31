// Main Application Script
import { loadSpeakerData, initializeParameters, getSpeakerByUniqueId, getSpeakerIdParameter } from './dataService.js';
import { loadDashboardContent } from './modules/tabs/dashboardTab.js';
import { loadFindContent } from './modules/tabs/findTab.js';
import { loadSpeakersContent } from './modules/tabs/speakersTab.js';
import { initializeSpeakerDetails, showSpeakerDetails } from './modules/speakerDetailsModule.js';
import { setupAuthUI , handleLogin, updateAuthUI} from './authUI.js';

// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add MSAL login success listener
    window.addEventListener('msalLoginSuccess', (event) => {
        console.log('MSAL Login Success Event:', event.detail);
        // Update UI or perform actions after successful login
        const { account } = event.detail.payload;
        if (account) {
            console.log(`User ${account.username} logged in successfully`);
            updateAuthUI();
        }

    });
    
    // Initialize the app
    initializeApp();
});

async function initializeApp() {
    try {
     
        
        // Set up the UI
        const { updateUI } = setupAuthUI();
        
        // Initialize parameters from URL first - once per session
        initializeParameters();
        updateUI();

        // Handle login
            await handleLogin();
        
        try {
            // Try to load speaker data (will trigger login if not authenticated)
            await loadSpeakerData();
            
            // Load initial tab content (dashboard is active by default)
            await loadDashboardContent();
            
            // Set up tab event listeners
            initializeTabEventListeners();
            
            // Initialize speaker details module
            await initializeSpeakerDetails();
            
            // Check if sprekerId query parameter exists
            checkForSpeakerIdParameter();
            
            // Update UI to show user status
            updateAuthUI();
        } catch (error) {
            console.error('Error initializing application:', error);
            if (error.message.includes('login') || error.message.includes('authentication')) {
                console.log('Authentication required or in progress');
            } else {
                alert('Error initializing application. Please check the console for details.');
            }
        }
    } catch (error) {
        console.error('Error initializing authentication:', error);
        alert('Error initializing authentication. Please check the console for details.');
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
