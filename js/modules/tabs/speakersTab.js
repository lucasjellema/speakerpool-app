// Speakers Tab Module
import { getAllSpeakers } from '../../dataService.js';
import { initializeSpeakerDetails, showSpeakerDetails } from '../../modules/speakerDetailsModule.js';

// Store all speakers and current sort state
let allSpeakers = [];
let currentSortField = 'name';
let currentSortDirection = 'asc';

// Function to load the speakers tab HTML content
async function loadSpeakersContent() {
    try {
        const response = await fetch('js/modules/tabs/speakers.html');
        const html = await response.text();
        document.getElementById('speakers-content').innerHTML = html;
        
        // Get all speakers data
        allSpeakers = getAllSpeakers();
        
        // Display speakers in the table
        displaySpeakersTable(allSpeakers);
        
        // Initialize event listeners
        initializeEventListeners();
        
        // Initialize speaker details modal
        await initializeSpeakerDetails();
        
    } catch (error) {
        console.error('Error loading speakers content:', error);
    }
}

// Function to display speakers in the table
function displaySpeakersTable(speakers) {
    const speakersList = document.getElementById('speakers-list');
    const speakersCount = document.getElementById('speakers-count');
    
    if (!speakersList || !speakersCount) return;
    
    // Clear previous content
    speakersList.innerHTML = '';
    
    // Update count
    speakersCount.textContent = `${speakers.length} speakers`;
    
    // If no speakers found
    if (speakers.length === 0) {
        speakersList.innerHTML = '<tr><td colspan="6" class="text-center py-3">No speakers available.</td></tr>';
        return;
    }
    
    // Create and append speaker rows
    speakers.forEach(speaker => {
        const row = document.createElement('tr');
        
        // Name column
        const nameCell = document.createElement('td');
        nameCell.textContent = speaker.name || 'Unknown';
        row.appendChild(nameCell);
        
        // Company column
        const companyCell = document.createElement('td');
        companyCell.textContent = speaker.company || '-';
        row.appendChild(companyCell);
        
        // Topics column
        const topicsCell = document.createElement('td');
        topicsCell.className = 'text-truncate';
        topicsCell.style.maxWidth = '200px';
        topicsCell.title = speaker.topics || '-'; // Add tooltip with full text
        topicsCell.textContent = speaker.topics || '-';
        row.appendChild(topicsCell);
        
        // Languages column
        const languagesCell = document.createElement('td');
        if (speaker.languages) {
            const speakerLanguages = Object.keys(speaker.languages)
                .filter(lang => speaker.languages[lang] === true);
            
            if (speakerLanguages.length > 0) {
                languagesCell.textContent = speakerLanguages.join(', ');
            } else {
                languagesCell.textContent = '-';
            }
        } else {
            languagesCell.textContent = '-';
        }
        row.appendChild(languagesCell);
        
        // Availability column
        const availabilityCell = document.createElement('td');
        if (speaker.internal || speaker.external) {
            if (speaker.internal) {
                const internalBadge = document.createElement('span');
                internalBadge.className = 'badge bg-success me-1';
                internalBadge.textContent = 'Internal';
                availabilityCell.appendChild(internalBadge);
            }
            
            if (speaker.external) {
                const externalBadge = document.createElement('span');
                externalBadge.className = 'badge bg-info me-1';
                externalBadge.textContent = 'External';
                availabilityCell.appendChild(externalBadge);
            }
        } else {
            availabilityCell.textContent = '-';
        }
        row.appendChild(availabilityCell);
        
        // Actions column
        const actionsCell = document.createElement('td');
        const viewButton = document.createElement('button');
        viewButton.className = 'btn btn-sm btn-primary';
        viewButton.textContent = 'View Details';
        viewButton.setAttribute('data-speaker-id', speaker.id);
        viewButton.addEventListener('click', () => viewSpeakerDetails(speaker.id));
        actionsCell.appendChild(viewButton);
        row.appendChild(actionsCell);
        
        // Append the row to the table
        speakersList.appendChild(row);
    });
}

// Note: Raw data display function has been removed

// Function to initialize event listeners
function initializeEventListeners() {
    // Note: Raw data toggle functionality has been removed
    
    // Add event listeners for sortable columns
    const sortableHeaders = document.querySelectorAll('.sortable');
    sortableHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const sortField = header.getAttribute('data-sort');
            sortTable(sortField);
        });
    });
}

// Function to sort the table by the specified field
function sortTable(sortField) {
    // If clicking the same column, toggle direction
    if (sortField === currentSortField) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        // New column, default to ascending
        currentSortField = sortField;
        currentSortDirection = 'asc';
    }
    
    // Update sort icons in the UI
    updateSortIcons(sortField, currentSortDirection);
    
    // Sort the speakers array
    const sortedSpeakers = [...allSpeakers].sort((a, b) => {
        let valueA, valueB;
        
        // Extract the values to compare based on the sort field
        switch(sortField) {
            case 'name':
                valueA = a.name || '';
                valueB = b.name || '';
                break;
            case 'company':
                valueA = a.company || '';
                valueB = b.company || '';
                break;
            case 'topics':
                valueA = a.topics || '';
                valueB = b.topics || '';
                break;
            case 'languages':
                // For languages, count the number of languages
                valueA = a.languages ? Object.keys(a.languages).filter(lang => a.languages[lang] === true).length : 0;
                valueB = b.languages ? Object.keys(b.languages).filter(lang => b.languages[lang] === true).length : 0;
                break;
            default:
                valueA = a[sortField] || '';
                valueB = b[sortField] || '';
        }
        
        // For string values, use localeCompare
        if (typeof valueA === 'string' && typeof valueB === 'string') {
            return currentSortDirection === 'asc' 
                ? valueA.localeCompare(valueB) 
                : valueB.localeCompare(valueA);
        }
        
        // For numeric values, use simple comparison
        return currentSortDirection === 'asc' 
            ? valueA - valueB 
            : valueB - valueA;
    });
    
    // Display the sorted speakers
    displaySpeakersTable(sortedSpeakers);
}

// Function to update sort icons in the UI
function updateSortIcons(activeField, direction) {
    const headers = document.querySelectorAll('.sortable');
    
    headers.forEach(header => {
        const field = header.getAttribute('data-sort');
        const icon = header.querySelector('.sort-icon');
        
        if (field === activeField) {
            // Active column - show appropriate direction icon
            icon.textContent = direction === 'asc' ? '↑' : '↓';
            header.classList.add('active-sort');
        } else {
            // Inactive column - show neutral icon
            icon.textContent = '↕';
            header.classList.remove('active-sort');
        }
    });
}

// Function to view speaker details
function viewSpeakerDetails(speakerId) {
    console.log(`Viewing details for speaker ID: ${speakerId}`);
    showSpeakerDetails(speakerId);
}

export { loadSpeakersContent };
