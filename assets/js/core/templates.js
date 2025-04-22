/**
 * Simple template system for the Speakerpool web application
 * Handles loading and inserting shared HTML components
 */
const Templates = {
    // Cache for loaded templates
    cache: {},
    
    // Initialize templates
    async init() {
        console.log('Initializing templates...');
        
        // Load navigation template
        await this.loadNavigation();
        
        // Set active navigation item based on current page
        this.setActiveNavItem();
    },
    
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
    
    // Load navigation template and insert it
    async loadNavigation() {
        try {
            // Load the navigation template if not cached
            if (!this.cache.navigation) {
                // Use the base URL to construct the path to the navigation template
                const baseUrl = this.getBaseUrl();
                const templateUrl = `${baseUrl}templates/navigation.html`;
                console.log(`Loading navigation template from: ${templateUrl}`);
                
                const response = await fetch(templateUrl);
                if (!response.ok) {
                    throw new Error(`Failed to load navigation template: ${response.status}`);
                }
                this.cache.navigation = await response.text();
            }
            
            // Find the navigation placeholder
            const navPlaceholder = document.getElementById('navigation-placeholder');
            if (navPlaceholder) {
                // Insert the navigation template
                navPlaceholder.innerHTML = this.cache.navigation;
            } else {
                console.error('Navigation placeholder not found');
            }
        } catch (error) {
            console.error('Error loading navigation:', error);
        }
    },
    
    // Set the active navigation item based on current page
    setActiveNavItem() {
        // Get current page filename
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        // Map pages to navigation IDs
        const pageToNavId = {
            'index.html': 'nav-overview',
            'speakers.html': 'nav-speakers',
            'search.html': 'nav-search',
            'topic-speakers.html': 'nav-search' // Topic speakers page is part of search functionality
        };
        
        // Get the ID of the navigation item to activate
        const activeNavId = pageToNavId[currentPage];
        
        if (activeNavId) {
            // Find the navigation item
            const activeNavItem = document.getElementById(activeNavId);
            if (activeNavItem) {
                // Add active class
                activeNavItem.classList.add('active');
            }
        }
    }
};

// Initialize templates when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => Templates.init());
