// Import the data module
import SpeakerData from '../core/data.js';

/**
 * Topic Speakers module for the Speakerpool application
 * Handles displaying speakers for a specific topic
 */
const TopicSpeakers = {
    // Initialize the topic speakers page
    async init() {
        console.log('Initializing topic speakers page...');
        
        // Load the speaker data
        await SpeakerData.loadSpeakers();
        
        // Get the topic from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const topic = urlParams.get('topic');
        
        if (!topic) {
            console.error('No topic specified');
            document.getElementById('current-topic').textContent = 'No topic specified';
            document.getElementById('no-speakers').style.display = 'block';
            return;
        }
        
        // Display the topic
        document.getElementById('current-topic').textContent = topic;
        
        // Find speakers for this topic
        this.displaySpeakersForTopic(topic);
    },
    
    // Display speakers for the given topic
    displaySpeakersForTopic(topic) {
        const speakers = SpeakerData.getAllSpeakers();
        
        // Filter speakers who can speak on this topic
        const topicSpeakers = speakers.filter(speaker => {
            const speakerTopics = speaker.topics || '';
            return speakerTopics.toLowerCase().includes(topic.toLowerCase());
        });
        
        if (topicSpeakers.length === 0) {
            document.getElementById('no-speakers').style.display = 'block';
            return;
        }
        
        // Sort speakers alphabetically by name
        topicSpeakers.sort((a, b) => {
            const nameA = a.name || '';
            const nameB = b.name || '';
            return nameA.localeCompare(nameB);
        });
        
        // Display the speakers
        const speakersList = document.getElementById('speakers-list');
        speakersList.innerHTML = '';
        
        topicSpeakers.forEach(speaker => {
            const speakerCard = document.createElement('div');
            speakerCard.className = 'card mb-3 speaker-card';
            speakerCard.innerHTML = `
                <div class="card-body">
                    <h5 class="card-title">${speaker.name || 'Unknown'}</h5>
                    <h6 class="card-subtitle mb-2 text-muted">${speaker.company || ''}</h6>
                    <p class="card-text">${this.highlightTopic(speaker.topics || '', topic)}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <span class="badge ${speaker.internal ? 'badge-yes' : 'badge-no'} me-2">Internal</span>
                            <span class="badge ${speaker.external ? 'badge-yes' : 'badge-no'}">External</span>
                        </div>
                        <a href="speakers.html?id=${speaker.id}" class="btn btn-primary btn-sm">View Details</a>
                    </div>
                </div>
            `;
            
            // Add click event to the card
            speakerCard.addEventListener('click', (e) => {
                // Only navigate if the click wasn't on the button
                if (!e.target.closest('.btn')) {
                    window.location.href = `speakers.html?id=${speaker.id}`;
                }
            });
            
            speakersList.appendChild(speakerCard);
        });
    },
    
    // Highlight the topic in the text
    highlightTopic(text, topic) {
        const regex = new RegExp(`(${topic})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
};

// Initialize the page when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => TopicSpeakers.init());
