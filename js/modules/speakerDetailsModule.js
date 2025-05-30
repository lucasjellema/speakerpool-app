// Speaker Details Module
import { getAllSpeakers, getSpeakerById, getSpeakerByUniqueId, isSpeakerInUrl, isInAdminMode } from '../dataService.js';
import { initializeSpeakerEdit, editSpeaker } from './speakerEditModule.js';

// Variable to store the modal instance
let speakerDetailsModal = null;
let currentSpeakerId = null;

// Function to initialize the speaker details module
async function initializeSpeakerDetails() {
    try {
        // Load the modal HTML
        const response = await fetch('js/modules/tabs/speakerDetails.html');
        const html = await response.text();
        
        // Create a temporary container to hold the modal HTML
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = html;
        
        // Append the modal to the body
        document.body.appendChild(tempContainer.firstElementChild);
        
        // Initialize the Bootstrap modal
        const modalElement = document.getElementById('speakerDetailsModal');
        if (modalElement) {
            speakerDetailsModal = new bootstrap.Modal(modalElement);
            
            // Add event listener for edit button
            const editButton = modalElement.querySelector('#edit-speaker-btn');
            if (editButton) {
                editButton.addEventListener('click', () => {
                    // Hide the details modal
                    speakerDetailsModal.hide();
                    
                    // Open the edit modal
                    editSpeaker(currentSpeakerId);
                });
            }
        }
        
        // Initialize the speaker edit module
        await initializeSpeakerEdit();
        
        // Set up event listener for data updates
        document.addEventListener('speakerDataUpdated', (event) => {
            // If the current speaker was updated, refresh the details
            if (event.detail.speakerId === currentSpeakerId) {
                showSpeakerDetails(currentSpeakerId);
            }
        });
        
        return true;
    } catch (error) {
        console.error('Error initializing speaker details:', error);
        return false;
    }
}

// Function to show speaker details
function showSpeakerDetails(speakerId) {
    // Store the current speaker ID
    currentSpeakerId = speakerId;
    
    // Get the speaker with the matching ID
    const speaker = getSpeakerById(speakerId);
    
    if (!speaker) {
        console.error(`Speaker with ID ${speakerId} not found.`);
        return;
    }
    
    // Populate the modal with speaker details
    populateSpeakerDetails(speaker);
    
    // Control visibility of edit button based on URL parameter
    controlEditButtonVisibility(speaker);
    
    // Show the modal
    if (speakerDetailsModal) {
        speakerDetailsModal.show();
    }
}

// Function to control the visibility of the edit button
function controlEditButtonVisibility(speaker) {
    const editButton = document.getElementById('edit-speaker-btn');
    if (!editButton) return;
    
    // Show edit button if in admin mode or if this speaker is the one referenced in the URL
    if (isInAdminMode() || isSpeakerInUrl(speaker.uniqueId)) {
        console.log(`Showing edit button for speaker: ${speaker.name} (admin mode or matches URL parameter)`);
        editButton.style.display = 'inline-block';
    } else {
        console.log(`Hiding edit button for speaker: ${speaker.name} (not in admin mode and doesn't match URL parameter)`);
        editButton.style.display = 'none';
    }
}

// Function to populate the modal with speaker details
function populateSpeakerDetails(speaker) {
    // Set speaker name
    const nameElement = document.getElementById('speaker-name');
    if (nameElement) {
        nameElement.textContent = speaker.name || 'Unknown';
    }
    
    // Set speaker image
    const imageElement = document.getElementById('speaker-image');
    const imagePlaceholder = document.getElementById('speaker-image-placeholder');
    const viewFullImageContainer = document.getElementById('view-full-image-container');
    const viewFullImageLink = document.getElementById('view-full-image-link');
    
    if (imageElement && imagePlaceholder) {
        if (speaker.imageUrl && speaker.imageUrl.trim()) {
            // Show the image and hide the placeholder
            imageElement.src = speaker.imageUrl;
            imageElement.style.display = 'block';
            imagePlaceholder.style.display = 'none !important';
            
            // Set up "View full image" link
            if (viewFullImageContainer && viewFullImageLink) {
                viewFullImageLink.href = speaker.imageUrl;
                viewFullImageContainer.style.display = 'block';
            }
            
            // Add error handling for the image
            imageElement.onerror = function() {
                // If image fails to load, show the placeholder
                imageElement.style.display = 'none';
                imagePlaceholder.style.display = 'flex';
                
               
            };
        } else {
            // Hide the image and show the placeholder
            imageElement.style.display = 'none';
            imagePlaceholder.style.display = 'flex';
            
            // Hide the "View full image" link when no image URL is provided
            if (viewFullImageContainer) {
                viewFullImageContainer.style.display = 'none';
            }
        }
    }
    
    // Set company
    const companyElement = document.getElementById('speaker-company');
    if (companyElement) {
        companyElement.textContent = speaker.company || 'No company specified';
    }
    
    // Set email
    const emailElement = document.getElementById('speaker-email');
    if (emailElement) {
        emailElement.textContent = speaker.emailadress || 'Not provided';
    }
    
    // Set LinkedIn URL if available
    const linkedinContainer = document.getElementById('linkedin-container');
    const linkedinLink = document.getElementById('speaker-linkedin');
    if (linkedinContainer && linkedinLink) {
        if (speaker.linkedInURL && speaker.linkedInURL.trim()) {
            // Set the href attribute and show the container
            linkedinLink.href = speaker.linkedInURL;
            linkedinContainer.style.display = 'block';
        } else {
            // Hide the LinkedIn container if no URL is provided
            linkedinContainer.style.display = 'none';
        }
    }
    
    // Set languages
    const languagesElement = document.getElementById('speaker-languages');
    if (languagesElement) {
        if (speaker.languages) {
            const speakerLanguages = Object.keys(speaker.languages)
                .filter(lang => speaker.languages[lang] === true);
            
            if (speakerLanguages.length > 0) {
                languagesElement.textContent = speakerLanguages.join(', ');
            } else {
                languagesElement.textContent = 'None specified';
            }
        } else {
            languagesElement.textContent = 'None specified';
        }
    }
    
    // Set availability badges
    const availabilityElement = document.getElementById('speaker-availability-badges');
    if (availabilityElement) {
        availabilityElement.innerHTML = '';
        
        if (speaker.internal) {
            const internalBadge = document.createElement('span');
            internalBadge.className = 'badge bg-success me-1';
            internalBadge.textContent = 'Internal Events';
            availabilityElement.appendChild(internalBadge);
        }
        
        if (speaker.external) {
            const externalBadge = document.createElement('span');
            externalBadge.className = 'badge bg-info me-1';
            externalBadge.textContent = 'External Events';
            availabilityElement.appendChild(externalBadge);
        }
    }
    
    // Set bio
    const bioElement = document.getElementById('speaker-bio');
    if (bioElement) {
        bioElement.textContent = speaker.bio || 'No bio provided.';
    }
    
    // Set topics
    const topicsElement = document.getElementById('speaker-topics');
    if (topicsElement) {
        topicsElement.textContent = speaker.topics || 'No topics specified.';
    }
    
    // Set recent presentations
    const presentationsElement = document.getElementById('speaker-presentations');
    if (presentationsElement) {
        if (speaker.recent_presentations && speaker.recent_presentations.trim()) {
            // Split presentations by newlines
            const presentations = speaker.recent_presentations.split('\n')
                .map(p => p.trim())
                .filter(p => p.length > 0);
            
            if (presentations.length > 0) {
                const presentationsList = document.createElement('ul');
                presentations.forEach(presentation => {
                    const listItem = document.createElement('li');
                    listItem.textContent = presentation;
                    presentationsList.appendChild(listItem);
                });
                
                presentationsElement.innerHTML = '';
                presentationsElement.appendChild(presentationsList);
            } else {
                presentationsElement.innerHTML = '<p class="text-muted">No recent presentations listed.</p>';
            }
        } else {
            presentationsElement.innerHTML = '<p class="text-muted">No recent presentations listed.</p>';
        }
    }
    
    // Set context
    const contextElement = document.getElementById('speaker-context');
    if (contextElement) {
        contextElement.textContent = speaker.context || 'No preferred context specified.';
    }
}

export { initializeSpeakerDetails, showSpeakerDetails };
