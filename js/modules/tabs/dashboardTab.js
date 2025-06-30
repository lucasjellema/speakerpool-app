// Dashboard Tab Module
import { getAllSpeakers } from '../../dataService.js';
import { initializePrivacyLink } from '../privacyLink.js';

// Chart instances
let companyChart = null;
let languagesChart = null;

// Function to load the dashboard tab HTML content
async function loadDashboardContent() {
    try {
        const response = await fetch('js/modules/tabs/dashboard.html');
        const html = await response.text();
        document.getElementById('dashboard-content').innerHTML = html;
        
        // Get all speaker data
        const speakers = getAllSpeakers();
        
        // Initialize dashboard components
        displaySpeakerStatistics(speakers);
        createCompanyChart(speakers);
        createLanguagesChart(speakers);
        createTopicsCloud(speakers);
        
        // Set up event listeners
        initializeEventListeners();
        
        // Initialize privacy statement link
        initializePrivacyLink();
        
    } catch (error) {
        console.error('Error loading dashboard content:', error);
    }
}

// Function to display speaker statistics
function displaySpeakerStatistics(speakers) {
    const totalSpeakersElement = document.getElementById('total-speakers-count');
    const speakersBreakdownElement = document.getElementById('speakers-breakdown');
    
    if (!totalSpeakersElement || !speakersBreakdownElement) return;
    
    // Count total speakers
    const totalSpeakers = speakers.length;
    
    // Count speakers available for internal and external events
    const internalSpeakers = speakers.filter(speaker => speaker.internal === true).length;
    const externalSpeakers = speakers.filter(speaker => speaker.external === true).length;
    
    // Update the DOM
    totalSpeakersElement.textContent = totalSpeakers;
    speakersBreakdownElement.textContent = `(${internalSpeakers} for internal events, ${externalSpeakers} for external events)`;
}

// Function to create the company distribution chart
function createCompanyChart(speakers) {
    const chartCanvas = document.getElementById('company-chart');
    if (!chartCanvas) return;
    
    // Count speakers by company
    const companyCounts = {};
    speakers.forEach(speaker => {
        const company = speaker.company || 'Unknown';
        companyCounts[company] = (companyCounts[company] || 0) + 1;
    });
    
    // Sort companies by count (descending)
    const sortedCompanies = Object.entries(companyCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10); // Top 10 companies
    
    // Prepare data for Chart.js
    const labels = sortedCompanies.map(item => item[0]);
    const data = sortedCompanies.map(item => item[1]);
    
    // Generate random colors
    const backgroundColors = generateRandomColors(labels.length);
    
    // Destroy previous chart instance if it exists
    if (companyChart) {
        companyChart.destroy();
    }
    
    // Create the chart
    companyChart = new Chart(chartCanvas, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.raw} speakers`;
                        }
                    }
                }
            },
            onClick: (event, elements) => {
                if (elements && elements.length > 0) {
                    const index = elements[0].index;
                    const companyName = labels[index];
                    navigateToFindWithCompany(companyName);
                }
            },
            elements: {
                arc: {
                    hoverCursor: 'pointer'
                }
            }
        }
    });
}

// Function to create the languages chart (bar chart)
function createLanguagesChart(speakers) {
    const chartCanvas = document.getElementById('languages-chart');
    if (!chartCanvas) return;
    
    // Count speakers by language
    const languageCounts = {};
    speakers.forEach(speaker => {
        if (speaker.languages) {
            Object.keys(speaker.languages).forEach(language => {
                if (speaker.languages[language] === true) {
                    languageCounts[language] = (languageCounts[language] || 0) + 1;
                }
            });
        }
    });
    
    // Sort languages by count (descending)
    const sortedLanguages = Object.entries(languageCounts)
        .sort((a, b) => b[1] - a[1]);
    
    // Prepare data for Chart.js
    const labels = sortedLanguages.map(item => item[0]);
    const data = sortedLanguages.map(item => item[1]);
    
    // Generate random colors
    const backgroundColors = generateRandomColors(labels.length);
    
    // Destroy previous chart instance if it exists
    if (languagesChart) {
        languagesChart.destroy();
    }
    
    // Create the chart - using bar chart instead of pie chart
    languagesChart = new Chart(chartCanvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Number of speakers',
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 1,
                borderColor: backgroundColors.map(color => color.replace('0.7', '1'))
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',  // Horizontal bar chart for better readability
            plugins: {
                legend: {
                    display: false  // No need for legend in bar chart
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.raw} speakers`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Number of speakers'
                    },
                    beginAtZero: true
                },
                y: {
                    title: {
                        display: true,
                        text: 'Language'
                    }
                }
            },
            onClick: (event, elements) => {
                if (elements && elements.length > 0) {
                    const index = elements[0].index;
                    const language = labels[index];
                    navigateToFindWithLanguage(language);
                }
            },
            elements: {
                bar: {
                    hoverCursor: 'pointer'
                }
            }
        }
    });
}

// Function to create the topics tag cloud
function createTopicsCloud(speakers) {
    const cloudContainer = document.getElementById('topics-cloud');
    if (!cloudContainer) return;
    
    // Extract all topics from speakers
    let allTopics = [];
    speakers.forEach(speaker => {
        if (speaker.topics) {
            // Split topics by commas and other separators
            const topicsList = speaker.topics.split(/[,;.]/)
                .map(topic => topic.trim())
                .filter(topic => topic.length > 0);
            
            allTopics = [...allTopics, ...topicsList];
        }
    });
    
    // Count frequency of each topic
    const topicCounts = {};
    allTopics.forEach(topic => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });
    
    // Convert to array of objects for d3-cloud
    const topicsData = Object.entries(topicCounts)
        .map(([text, size]) => ({ text, size: size * 10 + 12 })) // Scale size
        .sort((a, b) => b.size - a.size)
        .slice(0, 30); // Limit to top 30 topics
    
    // Clear previous content
    cloudContainer.innerHTML = '';
    
    // Simple visualization for topics (without full d3 cloud implementation)
    // This is a simplified version that doesn't require the full d3-cloud layout
    const cloudDiv = document.createElement('div');
    cloudDiv.className = 'tag-cloud';
    
    topicsData.forEach(topic => {
        const tag = document.createElement('span');
        tag.className = 'tag-item';
        tag.textContent = topic.text;
        tag.style.fontSize = `${Math.min(24, topic.size / 2)}px`;
        tag.style.padding = '5px 10px';
        tag.style.margin = '5px';
        tag.style.display = 'inline-block';
        tag.style.backgroundColor = getRandomColor(0.2);
        tag.style.color = '#333';
        tag.style.borderRadius = '4px';
        tag.style.cursor = 'pointer';
        
        // Add click event to navigate to Find tab with this topic
        tag.addEventListener('click', () => {
            navigateToFindWithTopic(topic.text);
        });
        
        cloudDiv.appendChild(tag);
    });
    
    cloudContainer.appendChild(cloudDiv);
}

// Note: Raw data display function has been removed

// Function to initialize event listeners
function initializeEventListeners() {
    // Note: Raw data toggle functionality has been removed
    
    // Add other event listeners for dashboard components here if needed
}

// Helper function to generate random colors
function generateRandomColors(count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
        colors.push(getRandomColor());
    }
    return colors;
}

// Helper function to get a random color
function getRandomColor(opacity = 0.7) {
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// Function to navigate to the Find tab with a company filter
function navigateToFindWithCompany(companyName) {
    console.log(`Navigating to Find tab with company: ${companyName}`);
    
    // Store the filter in sessionStorage for the Find tab to use
    sessionStorage.setItem('filterType', 'company');
    sessionStorage.setItem('filterValue', companyName);
    
    // Trigger a click on the Find tab to navigate there
    const findTab = document.getElementById('find-tab');
    if (findTab) {
        findTab.click();
    }
}

// Function to navigate to the Find tab with a language filter
function navigateToFindWithLanguage(language) {
    console.log(`Navigating to Find tab with language: ${language}`);
    
    // Store the filter in sessionStorage for the Find tab to use
    sessionStorage.setItem('filterType', 'language');
    sessionStorage.setItem('filterValue', language);
    
    // Trigger a click on the Find tab to navigate there
    const findTab = document.getElementById('find-tab');
    if (findTab) {
        findTab.click();
    }
}

// Function to navigate to the Find tab with a topic filter
function navigateToFindWithTopic(topic) {
    console.log(`Navigating to Find tab with topic: ${topic}`);
    
    // Store the filter in sessionStorage for the Find tab to use
    sessionStorage.setItem('filterType', 'topic');
    sessionStorage.setItem('filterValue', topic);
    
    // Trigger a click on the Find tab to navigate there
    const findTab = document.getElementById('find-tab');
    if (findTab) {
        findTab.click();
    }
}

export { loadDashboardContent };
