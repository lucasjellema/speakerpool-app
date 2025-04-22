// Import the data module
import SpeakerData from '../core/data.js';

/**
 * Search module for the Speakerpool application
 * Handles searching and filtering speakers
 */
const SpeakerSearch = {
    // Store all available languages
    availableLanguages: [],
    
    // Store the current search filters
    filters: {
        generalSearch: '',
        topicSearch: '',
        languages: {},
        internal: true,
        external: true
    },
    
    // Initialize the search page
    async init() {
        console.log('Initializing search page...');
        
        // Load the speaker data
        await SpeakerData.loadSpeakers();
        const speakers = SpeakerData.getAllSpeakers();
        
        if (speakers.length === 0) {
            console.error('No speaker data available');
            return;
        }

        // Set up event listeners
        this.setupEventListeners();
        
        // Extract all available languages from speakers
        this.extractAvailableLanguages(speakers);
        
        // Create language filter checkboxes
        this.createLanguageFilters();
        
        // Perform initial search
        this.performSearch();
    },
    
    // Set up event listeners
    setupEventListeners() {
        // Search form submission
        document.getElementById('search-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateFiltersFromForm();
            this.performSearch();
        });
        
        // Reset filters button
        document.getElementById('reset-filters').addEventListener('click', () => {
            this.resetFilters();
            this.performSearch();
        });
        
        // Input change events for real-time filtering
        document.getElementById('general-search').addEventListener('input', () => {
            this.debounceSearch();
        });
        
        document.getElementById('topic-search').addEventListener('input', () => {
            this.debounceSearch();
        });
        
        // Availability filter change events
        document.getElementById('internal-filter').addEventListener('change', () => {
            this.updateFiltersFromForm();
            this.performSearch();
        });
        
        document.getElementById('external-filter').addEventListener('change', () => {
            this.updateFiltersFromForm();
            this.performSearch();
        });
    },
    
    // Extract all available languages from speakers
    extractAvailableLanguages(speakers) {
        const languageSet = new Set();
        
        speakers.forEach(speaker => {
            if (speaker.languages) {
                Object.keys(speaker.languages).forEach(language => {
                    if (speaker.languages[language]) {
                        languageSet.add(language);
                    }
                });
            }
        });
        
        this.availableLanguages = Array.from(languageSet).sort();
        
        // Initialize all languages as selected in filters
        this.availableLanguages.forEach(language => {
            this.filters.languages[language] = true;
        });
    },
    
    // Create language filter checkboxes
    createLanguageFilters() {
        const container = document.getElementById('language-filters');
        container.innerHTML = ''; // Clear loading spinner
        
        this.availableLanguages.forEach(language => {
            const checkboxDiv = document.createElement('div');
            checkboxDiv.className = 'form-check me-3 mb-2';
            
            const checkbox = document.createElement('input');
            checkbox.className = 'form-check-input language-filter';
            checkbox.type = 'checkbox';
            checkbox.id = `language-${language.toLowerCase().replace(/\s+/g, '-')}`;
            checkbox.checked = true;
            checkbox.dataset.language = language;
            
            // Add event listener to checkbox
            checkbox.addEventListener('change', () => {
                this.updateFiltersFromForm();
                this.performSearch();
            });
            
            const label = document.createElement('label');
            label.className = 'form-check-label';
            label.htmlFor = checkbox.id;
            label.textContent = language;
            
            checkboxDiv.appendChild(checkbox);
            checkboxDiv.appendChild(label);
            container.appendChild(checkboxDiv);
        });
    },
    
    // Update filters from form inputs
    updateFiltersFromForm() {
        this.filters.generalSearch = document.getElementById('general-search').value.trim().toLowerCase();
        this.filters.topicSearch = document.getElementById('topic-search').value.trim().toLowerCase();
        this.filters.internal = document.getElementById('internal-filter').checked;
        this.filters.external = document.getElementById('external-filter').checked;
        
        // Update language filters
        const languageCheckboxes = document.querySelectorAll('.language-filter');
        languageCheckboxes.forEach(checkbox => {
            const language = checkbox.dataset.language;
            this.filters.languages[language] = checkbox.checked;
        });
    },
    
    // Reset all filters to default values
    resetFilters() {
        // Reset form inputs
        document.getElementById('general-search').value = '';
        document.getElementById('topic-search').value = '';
        document.getElementById('internal-filter').checked = true;
        document.getElementById('external-filter').checked = true;
        
        // Reset language checkboxes
        const languageCheckboxes = document.querySelectorAll('.language-filter');
        languageCheckboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
        
        // Reset filter values
        this.filters.generalSearch = '';
        this.filters.topicSearch = '';
        this.filters.internal = true;
        this.filters.external = true;
        
        // Reset language filters
        this.availableLanguages.forEach(language => {
            this.filters.languages[language] = true;
        });
    },
    
    // Debounce search to avoid too many searches while typing
    debounceTimeout: null,
    debounceSearch() {
        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = setTimeout(() => {
            this.updateFiltersFromForm();
            this.performSearch();
        }, 300);
    },
    
    // Perform search with current filters
    performSearch() {
        console.log('Performing search with filters:', this.filters);
        
        // Show loading state
        document.getElementById('loading-results').style.display = 'block';
        document.getElementById('no-results').style.display = 'none';
        document.getElementById('search-results').style.display = 'none';
        
        // Get all speakers
        const allSpeakers = SpeakerData.getAllSpeakers();
        
        // Filter speakers based on current filters
        const filteredSpeakers = allSpeakers.filter(speaker => {
            // Filter by availability
            if (this.filters.internal && !this.filters.external && !speaker.internal) return false;
            if (!this.filters.internal && this.filters.external && !speaker.external) return false;
            if (!this.filters.internal && !this.filters.external) return false;
            
            // Filter by languages
            let hasSelectedLanguage = false;
            if (speaker.languages) {
                for (const language in speaker.languages) {
                    if (speaker.languages[language] && this.filters.languages[language]) {
                        hasSelectedLanguage = true;
                        break;
                    }
                }
                if (!hasSelectedLanguage) return false;
            }
            
            // Filter by topic
            if (this.filters.topicSearch && speaker.topics) {
                if (!speaker.topics.toLowerCase().includes(this.filters.topicSearch)) {
                    return false;
                }
            }
            
            // Filter by general search
            if (this.filters.generalSearch) {
                const searchFields = [
                    speaker.bio || '',
                    speaker.topics || '',
                    speaker.recent_presentations || '',
                    speaker.context || '',
                    speaker.name || '',
                    speaker.company || ''
                ].map(field => field.toLowerCase());
                
                const generalSearchMatch = searchFields.some(field => 
                    field.includes(this.filters.generalSearch)
                );
                
                if (!generalSearchMatch) return false;
            }
            
            return true;
        });
        
        // Update results count
        document.getElementById('results-count').textContent = `${filteredSpeakers.length} speakers found`;
        
        // Display results
        this.displaySearchResults(filteredSpeakers);
    },
    
    // Display search results
    displaySearchResults(speakers) {
        const resultsContainer = document.getElementById('search-results');
        resultsContainer.innerHTML = '';
        
        // Hide loading state
        document.getElementById('loading-results').style.display = 'none';
        
        if (speakers.length === 0) {
            // Show no results message
            document.getElementById('no-results').style.display = 'block';
            resultsContainer.style.display = 'none';
            return;
        }
        
        // Show results container
        resultsContainer.style.display = 'flex';
        resultsContainer.classList.add('flex-wrap');
        document.getElementById('no-results').style.display = 'none';
        
        // Sort speakers alphabetically by name
        speakers.sort((a, b) => {
            const nameA = a.name || '';
            const nameB = b.name || '';
            return nameA.localeCompare(nameB);
        });
        
        // Create speaker cards
        speakers.forEach(speaker => {
            const speakerCol = document.createElement('div');
            speakerCol.className = 'col';
            
            // Get speaker languages as a comma-separated list
            const speakerLanguages = speaker.languages 
                ? Object.keys(speaker.languages)
                    .filter(lang => speaker.languages[lang])
                    .join(', ')
                : 'None';
            
            // Create speaker card
            speakerCol.innerHTML = `
                <div class="card h-100 speaker-card" data-speaker-id="${speaker.id}">
                    <div class="card-body">
                        <h5 class="card-title">${speaker.name || 'Unknown'}</h5>
                        <h6 class="card-subtitle mb-2 text-muted">${speaker.company || 'Unknown Company'}</h6>
                        
                        <div class="mb-2">
                            <small class="text-muted">Languages:</small>
                            <span>${speakerLanguages}</span>
                        </div>
                        
                        <div class="mb-2">
                            <small class="text-muted">Availability:</small>
                            <span>
                                ${speaker.internal ? '<span class="badge badge-yes me-1">Internal</span>' : ''}
                                ${speaker.external ? '<span class="badge badge-yes">External</span>' : ''}
                            </span>
                        </div>
                        
                        <div class="mb-3">
                            <small class="text-muted">Topics:</small>
                            <p class="card-text small">${this.highlightSearchTerms(speaker.topics || 'No topics specified')}</p>
                        </div>
                        
                        <a href="speakers.html?id=${speaker.id}" class="btn btn-primary btn-sm stretched-link">View Details</a>
                    </div>
                </div>
            `;
            
            resultsContainer.appendChild(speakerCol);
        });
    },
    
    // Highlight search terms in text
    highlightSearchTerms(text) {
        let highlightedText = text;
        
        // Highlight topic search term
        if (this.filters.topicSearch) {
            const regex = new RegExp(`(${this.escapeRegExp(this.filters.topicSearch)})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
        }
        
        // Highlight general search term if different from topic search
        if (this.filters.generalSearch && this.filters.generalSearch !== this.filters.topicSearch) {
            const regex = new RegExp(`(${this.escapeRegExp(this.filters.generalSearch)})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<mark class="bg-info">$1</mark>');
        }
        
        return highlightedText;
    },
    
    // Escape special characters in string for use in regex
    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
};

// Initialize the page when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => SpeakerSearch.init());
