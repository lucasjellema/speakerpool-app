/**
 * Data module for the Speakerpool application
 * Handles loading and processing speaker data
 */

// Main data object to export
const SpeakerData = {
    // Raw speaker data
    speakers: [],
    
    /**
     * Get the base URL for the application
     * Works with both local development and GitHub Pages
     * @returns {string} Base URL for the application
     */
    getBaseUrl() {
        // Get the current URL
        const currentUrl = window.location.href;
        
        // For GitHub Pages, we need to handle repository paths
        // Extract the base path from the current URL
        const urlParts = currentUrl.split('/');
        
        // If we're in the pages directory, go up one level
        if (urlParts.includes('pages')) {
            // Find the index of 'pages' in the URL
            const pagesIndex = urlParts.indexOf('pages');
            // Return everything up to but not including 'pages'
            return urlParts.slice(0, pagesIndex).join('/') + '/';
        }
        
        // Default case - just return the root
        return window.location.origin + '/';
    },
    
    /**
     * Get the data source URL from query parameters or session storage or use default
     * @returns {string} URL to fetch data from
     */
    getDataSourceUrl() {
        // Check if URL has query parameters
        const urlParams = new URLSearchParams(window.location.search);
        const dataFileParam = urlParams.get('parDataFile');
        
        // If parDataFile parameter exists in the URL, use it and store in session
        if (dataFileParam) {
            console.log(`Loading data from URL parameter: ${dataFileParam}`);
            // Store in session storage for persistence across page navigation
            sessionStorage.setItem('speakerpool_dataFile', dataFileParam);
            return dataFileParam;
        }
        
        // Check if we have a stored data file URL in session storage
        const storedDataFile = sessionStorage.getItem('speakerpool_dataFile');
        if (storedDataFile) {
            console.log(`Loading data from session storage: ${storedDataFile}`);
            return storedDataFile;
        }
        
        // Otherwise use the default local file with the correct base URL
        const baseUrl = this.getBaseUrl();
        return `${baseUrl}data/Sprekerpool.json`;
    },
    
    /**
     * Load speaker data from JSON file or URL specified in query parameter
     * @returns {Array} Array of speaker objects
     */
    async loadSpeakers() {
        try {
            const dataUrl = this.getDataSourceUrl();
            const response = await fetch(dataUrl);
            
            if (!response.ok) {
                throw new Error(`Failed to load data: ${response.status} ${response.statusText}`);
            }
            
            this.speakers = await response.json();
            return this.speakers;
        } catch (error) {
            console.error('Error loading speaker data:', error);
            this.speakers = [];
            return [];
        }
    },
    
    // Get all speakers
    getAllSpeakers() {
        return this.speakers;
    },
    
    // Get speaker by ID
    getSpeakerById(id) {
        return this.speakers.find(speaker => speaker.id === id);
    },
    
    // Get count of all speakers
    getTotalCount() {
        return this.speakers.length;
    },
    
    // Get count of internal speakers
    getInternalCount() {
        return this.speakers.filter(speaker => speaker.internal).length;
    },
    
    // Get count of external speakers
    getExternalCount() {
        return this.speakers.filter(speaker => speaker.external).length;
    },
    
    // Get speakers grouped by company
    getSpeakersByCompany() {
        const companyCounts = {};
        
        this.speakers.forEach(speaker => {
            const company = speaker.company || 'Unknown';
            companyCounts[company] = (companyCounts[company] || 0) + 1;
        });
        
        return companyCounts;
    },
    
    // Get speakers grouped by language
    getSpeakersByLanguage() {
        const languageCounts = {};
        
        this.speakers.forEach(speaker => {
            const languages = speaker.languages || {};
            Object.keys(languages).forEach(language => {
                if (languages[language]) {
                    languageCounts[language] = (languageCounts[language] || 0) + 1;
                }
            });
        });
        
        return languageCounts;
    },
    
    // Get topic frequency data
    getTopicFrequency() {
        const topicCounts = {};
        
        this.speakers.forEach(speaker => {
            const topicsText = speaker.topics || '';
            // Split topics by commas, periods, and other separators
            const topics = topicsText.split(/[,.;]/)
                .map(topic => topic.trim())
                .filter(topic => topic.length > 0);
            
            topics.forEach(topic => {
                topicCounts[topic] = (topicCounts[topic] || 0) + 1;
            });
        });
        
        return topicCounts;
    }
};

// Export the data object
export default SpeakerData;
