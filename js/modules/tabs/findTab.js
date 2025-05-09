// Find Tab Module
import { getAllSpeakers } from '../../dataService.js';
import { initializeSpeakerDetails, showSpeakerDetails } from '../../modules/speakerDetailsModule.js';

// Store all speakers data
let allSpeakers = [];

// Function to load the find tab HTML content
async function loadFindContent() {
    try {
        const response = await fetch('js/modules/tabs/find.html');
        const html = await response.text();
        document.getElementById('find-content').innerHTML = html;
        
        // Get all speakers data
        allSpeakers = getAllSpeakers();
        
        // Generate language checkboxes based on actual data
        generateLanguageCheckboxes(allSpeakers);
        
        // Initialize search functionality
        initializeSearch();
        
        // Initialize speaker details modal
        await initializeSpeakerDetails();
        
        // Check if we have a filter from the dashboard
        const filterType = sessionStorage.getItem('filterType');
        const filterValue = sessionStorage.getItem('filterValue');
        
        if (filterType && filterValue) {
            // Apply the appropriate filter based on type
            applyFilter(filterType, filterValue);
            
            // Clear the filter from session storage to avoid applying it again on next tab switch
            sessionStorage.removeItem('filterType');
            sessionStorage.removeItem('filterValue');
        } else {
            // Perform initial search to show all speakers
            performSearch();
        }
    } catch (error) {
        console.error('Error loading find content:', error);
    }
}

// Function to apply filter from dashboard based on type
function applyFilter(filterType, filterValue) {
    console.log(`Applying ${filterType} filter: ${filterValue}`);
    
    switch (filterType) {
        case 'company':
            // Set the general search input to the company name
            const generalSearchInput = document.getElementById('general-search');
            if (generalSearchInput) {
                generalSearchInput.value = filterValue;
            }
            
            // Update results header
            updateResultsHeader(`Results for Company: ${filterValue}`);
            break;
            
        case 'language':
            // Check the appropriate language checkbox
            const languageId = `lang-${filterValue.toLowerCase().replace(/\s+/g, '-')}`;
            const languageCheckbox = document.getElementById(languageId);
            if (languageCheckbox) {
                languageCheckbox.checked = true;
            }
            
            // Update results header
            updateResultsHeader(`Results for Language: ${filterValue}`);
            break;
            
        case 'topic':
            // Set the topic search input to the topic
            const topicSearchInput = document.getElementById('topic-search');
            if (topicSearchInput) {
                topicSearchInput.value = filterValue;
            }
            
            // Update results header
            updateResultsHeader(`Results for Topic: ${filterValue}`);
            break;
    }
    
    // Perform search with the applied filter
    performSearch();
}

// Helper function to update the results header
function updateResultsHeader(headerText) {
    const searchResultsHeader = document.querySelector('.card-header .card-title');
    if (searchResultsHeader) {
        searchResultsHeader.textContent = headerText;
    }
}

// Function to generate language checkboxes based on actual speaker data
function generateLanguageCheckboxes(speakers) {
    const languageCheckboxesContainer = document.getElementById('language-checkboxes');
    if (!languageCheckboxesContainer) return;
    
    // Extract all unique languages from speaker data
    const allLanguages = new Set();
    
    speakers.forEach(speaker => {
        if (speaker.languages) {
            Object.keys(speaker.languages).forEach(language => {
                if (speaker.languages[language] === true) {
                    allLanguages.add(language);
                }
            });
        }
    });
    
    // Sort languages alphabetically
    const sortedLanguages = Array.from(allLanguages).sort();
    
    // Clear loading indicator
    languageCheckboxesContainer.innerHTML = '';
    
    // If no languages found
    if (sortedLanguages.length === 0) {
        languageCheckboxesContainer.innerHTML = '<p class="text-muted">No languages found in speaker data.</p>';
        return;
    }
    
    // Create checkbox for each language
    sortedLanguages.forEach(language => {
        const languageId = `lang-${language.toLowerCase().replace(/\s+/g, '-')}`;
        
        const checkboxDiv = document.createElement('div');
        checkboxDiv.className = 'form-check';
        
        const checkbox = document.createElement('input');
        checkbox.className = 'form-check-input';
        checkbox.type = 'checkbox';
        checkbox.value = language;
        checkbox.id = languageId;
        
        const label = document.createElement('label');
        label.className = 'form-check-label';
        label.htmlFor = languageId;
        label.textContent = language;
        
        checkboxDiv.appendChild(checkbox);
        checkboxDiv.appendChild(label);
        
        languageCheckboxesContainer.appendChild(checkboxDiv);
    });
}

// Function to initialize search functionality
function initializeSearch() {
    // Add event listeners for search button
    const searchButton = document.getElementById('search-button');
    if (searchButton) {
        searchButton.addEventListener('click', performSearch);
    }
    
    // Add event listeners for reset button
    const resetButton = document.getElementById('reset-filters');
    if (resetButton) {
        resetButton.addEventListener('click', resetFilters);
    }
    
    // Add event listener for Enter key in search inputs
    const searchInputs = document.querySelectorAll('#general-search, #topic-search');
    searchInputs.forEach(input => {
        input.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                performSearch();
            }
        });
    });
}

// Function to perform search based on filters
function performSearch() {
    // Get filter values
    const generalSearch = document.getElementById('general-search').value.toLowerCase();
    const topicSearch = document.getElementById('topic-search').value.toLowerCase();
    
    // Get selected languages
    const selectedLanguages = [];
    document.querySelectorAll('.language-checkboxes input:checked').forEach(checkbox => {
        selectedLanguages.push(checkbox.value);
    });
    
    // Get availability filters
    const internalChecked = document.getElementById('availability-internal').checked;
    const externalChecked = document.getElementById('availability-external').checked;
    
    // Filter speakers based on criteria
    const filteredSpeakers = allSpeakers.filter(speaker => {
        // General search filter (searches in name, bio, company)
        if (generalSearch && !(
            (speaker.name && speaker.name.toLowerCase().includes(generalSearch)) ||
            (speaker.bio && speaker.bio.toLowerCase().includes(generalSearch)) ||
            (speaker.company && speaker.company.toLowerCase().includes(generalSearch)) ||
            (speaker.topics && speaker.topics.toLowerCase().includes(generalSearch))
        )) {
            return false;
        }
        
        // Topic search filter
        if (topicSearch && !(
            speaker.topics && speaker.topics.toLowerCase().includes(topicSearch)
        )) {
            return false;
        }
        
        // Language filter
        if (selectedLanguages.length > 0) {
            if (!speaker.languages) return false;
            
            const speakerHasSelectedLanguage = selectedLanguages.some(language => 
                speaker.languages[language] === true
            );
            
            if (!speakerHasSelectedLanguage) return false;
        }
        
        // Availability filter
        if (internalChecked && !speaker.internal) return false;
        if (externalChecked && !speaker.external) return false;
        
        // If all filters pass, include the speaker
        return true;
    });
    
    // Display filtered results
    displaySearchResults(filteredSpeakers);
}

// Function to display search results
function displaySearchResults(speakers) {
    const resultsContainer = document.getElementById('search-results');
    const searchCount = document.getElementById('search-count');
    
    if (!resultsContainer || !searchCount) return;
    
    // Clear previous results
    resultsContainer.innerHTML = '';
    
    // Update count
    searchCount.textContent = `${speakers.length} speakers found`;
    
    // If no results found
    if (speakers.length === 0) {
        resultsContainer.innerHTML = '<div class="col-12"><p class="text-center my-5">No speakers found matching your criteria.</p></div>';
        return;
    }
    
    // Get the template
    const template = document.getElementById('speaker-card-template');
    if (!template) return;
    
    // Create and append speaker cards
    speakers.forEach(speaker => {
        // Clone the template
        const speakerCard = document.importNode(template.content, true);
        
        // Fill in speaker data
        speakerCard.querySelector('.speaker-name').textContent = speaker.name || 'Unknown';
        speakerCard.querySelector('.speaker-company').textContent = speaker.company || '';
        
        // Set languages
        let languagesText = 'None specified';
        if (speaker.languages) {
            const speakerLanguages = Object.keys(speaker.languages)
                .filter(lang => speaker.languages[lang] === true);
            
            if (speakerLanguages.length > 0) {
                languagesText = speakerLanguages.join(', ');
            }
        }
        speakerCard.querySelector('.speaker-languages').textContent = languagesText;
        
        // Set availability badges
        const availabilitySpan = speakerCard.querySelector('.speaker-availability');
        availabilitySpan.innerHTML = '';
        
        if (speaker.internal) {
            const internalBadge = document.createElement('span');
            internalBadge.className = 'badge bg-success me-1';
            internalBadge.textContent = 'Internal';
            availabilitySpan.appendChild(internalBadge);
        }
        
        if (speaker.external) {
            const externalBadge = document.createElement('span');
            externalBadge.className = 'badge bg-info me-1';
            externalBadge.textContent = 'External';
            availabilitySpan.appendChild(externalBadge);
        }
        
        // Set topics
        speakerCard.querySelector('.speaker-topics').textContent = speaker.topics || 'None specified';
        
        // Set up view details button
        const viewDetailsButton = speakerCard.querySelector('.view-details');
        viewDetailsButton.setAttribute('data-speaker-id', speaker.id);
        viewDetailsButton.addEventListener('click', () => viewSpeakerDetails(speaker.id));
        
        // Append to results container
        resultsContainer.appendChild(speakerCard);
    });
}

// Function to reset all filters
function resetFilters() {
    // Clear text inputs
    document.getElementById('general-search').value = '';
    document.getElementById('topic-search').value = '';
    
    // Uncheck all language checkboxes
    document.querySelectorAll('.language-checkboxes input').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Uncheck availability checkboxes
    document.getElementById('availability-internal').checked = false;
    document.getElementById('availability-external').checked = false;
    
    // Perform search with cleared filters (shows all speakers)
    performSearch();
}

// Function to view speaker details
function viewSpeakerDetails(speakerId) {
    console.log(`Viewing details for speaker ID: ${speakerId}`);
    showSpeakerDetails(speakerId);
}

export { loadFindContent };
