// Import the data module
import SpeakerData from '../core/data.js';

/**
 * Dashboard module for the Speakerpool application
 * Handles visualization and UI updates for the overview page
 */
const Dashboard = {
    // Store chart instances
    charts: {
        company: null,
        language: null
    },
    
    // Initialize the dashboard
    async init() {
        console.log('Initializing dashboard...');
        
        // Clean up any existing charts (in case of page refresh)
        this.cleanupCharts();
        
        // Load the speaker data
        await SpeakerData.loadSpeakers();
        
        // Update the dashboard
        this.updateDashboard();
        
        // Add window resize handler to redraw charts when window size changes
        window.addEventListener('resize', () => {
            this.cleanupCharts();
            this.updateDashboard();
        });
    },
    
    // Clean up all chart instances
    cleanupCharts() {
        console.log('Cleaning up charts...');
        // Destroy company chart if it exists
        if (this.charts.company) {
            this.charts.company.destroy();
            this.charts.company = null;
        }
        
        // Destroy language chart if it exists
        if (this.charts.language) {
            this.charts.language.destroy();
            this.charts.language = null;
        }
        
        // Clear tag cloud
        const cloudContainer = document.getElementById('topics-cloud');
        if (cloudContainer) {
            cloudContainer.innerHTML = '';
        }
    },
    
    // Update all dashboard elements
    updateDashboard() {
        console.log('Updating dashboard...');
        const speakers = SpeakerData.getAllSpeakers();
        
        if (speakers.length === 0) {
            console.error('No speaker data available');
            return;
        }

        // Update statistics
        this.updateStatistics();
        
        // Create visualizations
        this.createCompanyChart();
        this.createLanguageChart();
        this.createTopicsCloud();
    },
    
    // Update the statistics cards
    updateStatistics() {
        document.getElementById('total-speakers').textContent = SpeakerData.getTotalCount() + ' ( ' + SpeakerData.getInternalCount() + ' for internal events, ' + SpeakerData.getExternalCount() + ' for external events)';
    },
    
    // Create a chart showing the number of speakers per company
    createCompanyChart() {
        console.log('Creating company chart...');
        
        // Get the chart container - find the closest chart-container div
        let chartContainer;
        const oldCanvas = document.getElementById('company-chart');
        if (oldCanvas) {
            // Find the closest chart-container parent
            chartContainer = oldCanvas.closest('.chart-container');
            if (!chartContainer) {
                chartContainer = oldCanvas.parentNode;
            }
        } else {
            // If canvas doesn't exist, find the chart container by class
            chartContainer = document.querySelector('.chart-container');
            if (!chartContainer) {
                console.error('Could not find chart container');
                return;
            }
        }
        
        // Clear the container
        chartContainer.innerHTML = '';
        
        // Create a new canvas with fixed dimensions
        const newCanvas = document.createElement('canvas');
        newCanvas.id = 'company-chart';
        newCanvas.style.width = '100%';
        newCanvas.style.height = '100%';
        chartContainer.appendChild(newCanvas);
        
        // Get all speakers
        const allSpeakers = SpeakerData.getAllSpeakers();
        
        // Group speakers by company
        const companySpeakers = {};
        allSpeakers.forEach(speaker => {
            const company = speaker.company || 'Unknown';
            if (!companySpeakers[company]) {
                companySpeakers[company] = [];
            }
            companySpeakers[company].push(speaker.name || 'Unnamed Speaker');
        });
        
        // Get company data
        const companyCounts = SpeakerData.getSpeakersByCompany();
        
        // Sort companies by count (descending)
        const sortedCompanies = Object.keys(companyCounts).sort((a, b) => 
            companyCounts[b] - companyCounts[a]
        );
        
        // Take top 10 companies
        const topCompanies = sortedCompanies.slice(0, 10);
        const topCompanyCounts = topCompanies.map(company => companyCounts[company]);
        
        // Get new canvas context
        const ctx = newCanvas.getContext('2d');
        
        // Create new chart - using pie chart instead of bar chart
        this.charts.company = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: topCompanies,
                datasets: [{
                    data: topCompanyCounts,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)',
                        'rgba(255, 159, 64, 0.7)',
                        'rgba(199, 199, 199, 0.7)',
                        'rgba(128, 128, 128, 0.7)',
                        'rgba(255, 99, 71, 0.7)',
                        'rgba(0, 128, 128, 0.7)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        display: true
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const company = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${company}: ${value} speakers (${percentage}%)`;
                            },
                            afterLabel: function(context) {
                                const company = context.label || '';
                                const speakers = companySpeakers[company] || [];
                                
                                if (speakers.length === 0) {
                                    return 'No speaker information available';
                                }
                                
                                // Format speaker list (limit to 5 names if there are many)
                                if (speakers.length > 5) {
                                    return `Speakers: ${speakers.slice(0, 5).join(', ')}\nand ${speakers.length - 5} more...`;
                                } else {
                                    return `Speakers: ${speakers.join(', ')}`;
                                }
                            }
                        }
                    }
                }
            }
        });
        
        console.log('Company chart created.');
    },

    // Create a chart showing the number of speakers per language
    createLanguageChart() {
        console.log('Creating language chart...');
        
        // Get the chart container - find the closest chart-container div
        let chartContainer;
        const oldCanvas = document.getElementById('language-chart');
        if (oldCanvas) {
            // Find the closest chart-container parent
            chartContainer = oldCanvas.closest('.chart-container');
            if (!chartContainer) {
                chartContainer = oldCanvas.parentNode;
            }
        } else {
            // If canvas doesn't exist, find the chart container by class
            const containers = document.querySelectorAll('.chart-container');
            if (containers.length > 1) {
                chartContainer = containers[1]; // Second chart container
            } else {
                console.error('Could not find language chart container');
                return;
            }
        }
        
        // Clear the container
        chartContainer.innerHTML = '';
        
        // Create a new canvas with fixed dimensions
        const newCanvas = document.createElement('canvas');
        newCanvas.id = 'language-chart';
        newCanvas.style.width = '100%';
        newCanvas.style.height = '100%';
        chartContainer.appendChild(newCanvas);
        
        // Get language data
        const languageCounts = SpeakerData.getSpeakersByLanguage();
        
        // Sort languages by count (descending)
        const sortedLanguages = Object.keys(languageCounts).sort((a, b) => 
            languageCounts[b] - languageCounts[a]
        );
        
        const languageLabels = sortedLanguages;
        const languageData = sortedLanguages.map(language => languageCounts[language]);
        
        // Get new canvas context
        const ctx = newCanvas.getContext('2d');
        
        // Create new chart
        this.charts.language = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: languageLabels,
                datasets: [{
                    data: languageData,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)',
                        'rgba(255, 159, 64, 0.7)',
                        'rgba(199, 199, 199, 0.7)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
        
        console.log('Language chart created.');
    },
    
    // Create a tag cloud of topics
    createTopicsCloud() {
        // Get topic data
        const topicCounts = SpeakerData.getTopicFrequency();
        
        // Get speakers for each topic
        const topicSpeakers = {};
        const allSpeakers = SpeakerData.getAllSpeakers();
        
        Object.keys(topicCounts).forEach(topic => {
            // Find speakers who can present on this topic
            const speakers = allSpeakers.filter(speaker => {
                const speakerTopics = speaker.topics || '';
                return speakerTopics.toLowerCase().includes(topic.toLowerCase());
            });
            
            // Store speaker names for this topic
            topicSpeakers[topic] = speakers.map(speaker => speaker.name);
        });
        
        // Convert to format needed for d3-cloud
        const topicData = Object.keys(topicCounts)
            .filter(topic => topic.length > 0)
            .map(topic => ({
                text: topic,
                size: 10 + (topicCounts[topic] * 5), // Scale size based on frequency
                speakers: topicSpeakers[topic] || []
            }));
        
        // Clear previous tag cloud
        document.getElementById('topics-cloud').innerHTML = '';
        
        // Set up cloud layout
        const width = document.getElementById('topics-cloud').offsetWidth;
        const height = 400;
        
        const layout = d3.layout.cloud()
            .size([width, height])
            .words(topicData)
            .padding(5)
            .rotate(() => ~~(Math.random() * 2) * 90)
            .fontSize(d => d.size)
            .on("end", drawCloud);
        
        layout.start();
        
        // Draw the cloud
        function drawCloud(words) {
            d3.select("#topics-cloud").append("svg")
                .attr("width", layout.size()[0])
                .attr("height", layout.size()[1])
                .append("g")
                .attr("transform", `translate(${layout.size()[0] / 2},${layout.size()[1] / 2})`)
                .selectAll("text")
                .data(words)
                .enter().append("text")
                .style("font-size", d => `${d.size}px`)
                .style("font-family", "Arial")
                .style("fill", () => {
                    const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'];
                    return colors[Math.floor(Math.random() * colors.length)];
                })
                .style("cursor", "pointer") // Add pointer cursor to indicate clickability
                .attr("text-anchor", "middle")
                .attr("transform", d => `translate(${[d.x, d.y]})rotate(${d.rotate})`)
                .text(d => d.text)
                .on("click", (event, d) => {
                    // Navigate to topic-speakers page with this topic
                    window.location.href = `topic-speakers.html?topic=${encodeURIComponent(d.text)}`;
                })
                .append("title") // Add tooltip with speaker names
                .text(d => {
                    if (d.speakers && d.speakers.length > 0) {
                        // Format speaker list (limit to 5 names if there are many)
                        const speakerList = d.speakers.length > 5 
                            ? d.speakers.slice(0, 5).join(', ') + `, and ${d.speakers.length - 5} more...`
                            : d.speakers.join(', ');
                        return `Speakers on ${d.text} (${d.speakers.length}): ${speakerList}\nClick to see all speakers for this topic`;
                    } else {
                        return `No speakers found for: ${d.text}\nClick to see if any speakers are available`;
                    }
                });
        }
    }
};

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => Dashboard.init());
