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
    
    // Load navigation template and insert it
    async loadNavigation() {
        try {
            // Load the navigation template if not cached
            if (!this.cache.navigation) {
                const response = await fetch('../../../templates/navigation.html');
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
