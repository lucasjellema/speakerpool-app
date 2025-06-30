// Main Application Script
import { loadSpeakerData, initializeParameters, getSpeakerByUniqueId, getSpeakerIdParameter, getSpeakerByName, isInAdminMode, saveSpeakerDataAsAdmin } from './dataService.js';
import { getUserName } from './authPopup.js';
import { loadDashboardContent } from './modules/tabs/dashboardTab.js';
import { loadFindContent } from './modules/tabs/findTab.js';
import { loadSpeakersContent } from './modules/tabs/speakersTab.js';
import { initializeSpeakerDetails, showSpeakerDetails } from './modules/speakerDetailsModule.js';
import { openForNewSelfSpeaker as openNewSpeakerForm } from './modules/speakerEditModule.js'; // Alias for clarity
import { setupAuthUI , handleLogin, updateAuthUI} from './authUI.js';
import { initializePrivacyLink } from './modules/privacyLink.js';

let adminSaveButton = null; // To hold the admin save button element

// Function to refresh user-specific buttons based on current speaker data
async function refreshUserSpecificButtons() {
    console.log('Refreshing user-specific buttons (My Profile / Add Me).');
    await displayUserProfileButton();
    await displayAddMeAsSpeakerButton();
}

// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Listen for custom events indicating data changes that affect button visibility
    window.addEventListener('speakerDataUpdated', refreshUserSpecificButtons);
    window.addEventListener('newSpeakerAdded', refreshUserSpecificButtons);

    // Add MSAL login success listener
    window.addEventListener('msalLoginSuccess', async (event) => {
        console.log('MSAL Login Success Event:', event.detail);
        // Update UI or perform actions after successful login
        const { account } = event.detail.payload;
        if (account) {
            console.log(`User ${account.username} logged in successfully`);
            updateAuthUI();
            await loadSpeakerData();
            await refreshUIwithSpeakerData();
            await displayUserProfileButton(); // Check and display 'Show My Profile' button
            await displayAddMeAsSpeakerButton(); // Check and display 'Add Me as Speaker' button
        }

    });
    
    // Initialize the app
    initializeApp();

    // Call displayUserProfileButton on logout as well to clear it
    // Assuming 'msal:logoutSuccess' or similar event could be listened for, or updateAuthUI handles it.
    // For now, displayUserProfileButton will clear/hide if getUserName() is null after logout.

    // Listen for admin-related data events
    window.addEventListener('speakerDataModifiedByAdmin', () => {
        if (adminSaveButton && isInAdminMode()) {
            // Button already enabled in admin-mode, just update text and show container
            adminSaveButton.textContent = 'Save All Data';
            document.getElementById('admin-save-button-container').classList.remove('d-none');
            console.log('Admin mode: Changes detected, save button container shown.');
        }
    });

    window.addEventListener('adminDataSavedSuccess', () => {
        if (adminSaveButton) {
            adminSaveButton.disabled = true;
            adminSaveButton.textContent = 'Saved!';
            console.log('Admin mode: All data saved successfully.');
            // Optionally, revert text after a delay but keep disabled
            // setTimeout(() => { 
            //    if(adminSaveButton.disabled) adminSaveButton.textContent = 'Save All Data'; 
            // }, 3000);
        }
    });

    window.addEventListener('adminDataSavedError', (event) => {
        if (adminSaveButton) {
            adminSaveButton.disabled = false; // Allow retry
            adminSaveButton.textContent = 'Save Failed - Retry?';
            console.error('Admin mode: Error saving data:', event.detail);
            alert(`Admin mode: Error saving data. ${event.detail?.message || 'Check console.'}`);
        }
    });
});

function createAdminSaveButton() {
    const container = document.getElementById('admin-save-button-container');
    if (!container) {
        console.error('Admin save button container not found.');
        return;
    }

    container.innerHTML = ''; // Clear previous button if any

    const button = document.createElement('button');
    button.id = 'adminSaveAllDataBtn';
    button.className = 'btn btn-danger btn-sm'; // Using btn-danger for admin actions
    button.textContent = 'Save All Data';
    button.disabled = false; // Always enabled in admin-mode
    
    button.addEventListener('click', async () => {
        if (!isInAdminMode()) return;

        button.disabled = true;
        button.textContent = 'Saving...';
        try {
            const result = await saveSpeakerDataAsAdmin();
            if (result.success) {
                // Event 'adminDataSavedSuccess' will handle button text update to 'Saved!'
                // No need to directly set to 'Saved!' here if event listener does it.
                console.log('Admin save successful from button click.');
            } else {
                // Event 'adminDataSavedError' will handle button text update
                console.error('Admin save failed from button click:', result.message);
            }
        } catch (error) {
            // This catch is for unexpected errors in saveSpeakerDataAsAdmin itself if it throws
            // The 'adminDataSavedError' event should ideally be dispatched from within saveSpeakerDataAsAdmin for consistency
            console.error('Critical error during admin save:', error);
            button.disabled = false;
            button.textContent = 'Save Failed - Retry?';
            alert(`Critical error during admin save. ${error.message || 'Check console.'}`);
        }
    });

    container.appendChild(button);
    adminSaveButton = button; // Store button reference
    // Container starts with d-none. It will be made visible when changes are made.
    // If there are pending changes on load (e.g. from previously unsaved session), 
    // the 'speakerDataModifiedByAdmin' event should still fire after deltas are merged.
}

async function initializeApp() {
    try {
        // Initialize the privacy statement link
        initializePrivacyLink();
        
        // Set up the UI
        const { updateUI } = setupAuthUI();
        
        // Initialize parameters from URL first - once per session
        initializeParameters();
        updateUI();

        // Handle login
        await handleLogin();

        if (isInAdminMode()) {
            createAdminSaveButton();
            // The button container ('admin-save-button-container') is initially d-none.
            // It becomes visible when 'speakerDataModifiedByAdmin' is dispatched.
        }
        
        try {
            // Try to load speaker data (will trigger login if not authenticated)
       //     await loadSpeakerData();
            
            // Load initial tab content (dashboard is active by default)
         //   await refreshUIwithSpeakerData();
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

async function displayAddMeAsSpeakerButton() {
    const addButtonContainer = document.getElementById('add-me-as-speaker-button-container');
    if (!addButtonContainer) {
        console.error('"Add Me as Speaker" button container not found');
        return;
    }
    addButtonContainer.innerHTML = ''; // Clear previous button if any
    addButtonContainer.classList.add('d-none'); // Hide by default

    const currentUserName = getUserName();
    if (currentUserName && !isInAdminMode()) { // Only show if logged in and NOT in admin mode
        try {
            const speakerProfile = await getSpeakerByName(currentUserName);
            if (!speakerProfile) { // User is logged in but NOT found as a speaker
                const button = document.createElement('button');
                button.id = 'addMeAsSpeakerBtn';
                button.className = 'btn btn-success btn-sm'; // Using btn-success for add actions
                button.textContent = 'Add Me as Speaker';
                button.addEventListener('click', () => {
                    // Navigate to speaker edit form, indicating it's a new profile for the current user
                    // The speakerEditModule will need to handle this 'newProfileForUser' scenario
                    console.log(`User ${currentUserName} wants to add themselves as a speaker.`);
                    openNewSpeakerForm();
                });
                addButtonContainer.appendChild(button);
                addButtonContainer.classList.remove('d-none'); // Show the container
            }
        } catch (error) {
            console.error('Error checking if current user is a speaker:', error);
        }
    }
}

async function displayUserProfileButton() {
    const profileButtonContainer = document.getElementById('my-profile-button-container');
    if (!profileButtonContainer) {
        console.error('"My Profile" button container not found');
        return;
    }
    profileButtonContainer.innerHTML = ''; // Clear previous button if any
    profileButtonContainer.classList.add('d-none'); // Hide by default

    const currentUserName = getUserName(); // From authPopup.js
    if (currentUserName) {
        try {
            const speakerProfile = await getSpeakerByName(currentUserName); // From dataService.js
            if (speakerProfile) {
                const button = document.createElement('button');
                button.id = 'showMyProfileBtn';
                button.className = 'btn btn-info btn-sm';
                button.textContent = 'Show My Profile';
                button.addEventListener('click', () => {
                    // speakerProfile.id is the one to pass to showSpeakerDetails
                    // speakerProfile.uniqueId is used for URL params or direct lookup by uniqueId if needed
                    
                    // Ensure we have the speaker object, getSpeakerByUniqueId might be redundant if speakerProfile is complete
                    // but good for consistency if dataService might have fresher objects.
                    const speakerToDisplay = getSpeakerByUniqueId(speakerProfile.uniqueId); 
                    if (!speakerToDisplay) {
                        console.warn(`My profile: Speaker with unique ID ${speakerProfile.uniqueId} not found in current data.`);
                        // Fallback to the initially fetched speakerProfile if speakerToDisplay is null
                        // This can happen if speakerData hasn't been fully re-indexed by getSpeakerByUniqueId
                        // For safety, we use speakerProfile.id which should be valid from getSpeakerByName
                        if(speakerProfile && speakerProfile.id) {
                           console.log("Falling back to speakerProfile.id for showSpeakerDetails");
                        } else {
                           alert('Could not find your speaker profile to display.');
                           return;
                        }
                    }

                    const targetSpeakerId = speakerToDisplay ? speakerToDisplay.id : speakerProfile.id;

                    if (!document.getElementById('speakers-tab').classList.contains('active')) {
                        loadSpeakersContent().then(() => { // Ensure speakers content is loaded
                            const speakersTab = new bootstrap.Tab(document.getElementById('speakers-tab'));
                            speakersTab.show();
                            // Wait for tab content to be potentially rendered
                            setTimeout(() => {
                                showSpeakerDetails(targetSpeakerId); 
                            }, 500); // Delay might need adjustment
                        });
                    } else {
                        showSpeakerDetails(targetSpeakerId); 
                    }
                });
                profileButtonContainer.appendChild(button);
                profileButtonContainer.classList.remove('d-none'); // Show the container
            } else {
                 console.log("Current user is not listed as a speaker or name mismatch.");
            }
        } catch (error) {
            console.error('Error checking speaker profile for current user:', error);
        }
    }
}

async function refreshUIwithSpeakerData() {
    await loadDashboardContent();

    // Set up tab event listeners
    initializeTabEventListeners();

    // Initialize speaker details module
    await initializeSpeakerDetails();

    // Check if sprekerId query parameter exists
    checkForSpeakerIdParameter();

    // Update UI to show user status
    updateAuthUI();
    await displayAddMeAsSpeakerButton(); // Also check here after data refresh
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
