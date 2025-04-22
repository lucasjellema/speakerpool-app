/**
 * Data module for the Speakerpool application
 * Handles loading and processing speaker data
 */

// Main data object to export
const SpeakerData = {
    // Raw speaker data
    speakers: [],
    
    // Load speaker data from JSON file
    async loadSpeakers() {
        try {
            const response = await fetch('../../data/Sprekerpool.json');
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
