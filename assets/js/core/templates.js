/**
 * Simple template system for the Speakerpool web application
 * Handles loading and inserting shared HTML components
 */
const Templates = {
    // Cache for loaded templates
    cache: {},
    
    // Initialize templates
    async init() {
        console.log('Initializing templates...', new Date().toISOString());
        console.log('Current URL:', window.location.href);
        console.log('Current path:', window.location.pathname);
        
        try {
            // Load navigation template
            await this.loadNavigation();
            
            // Set active navigation item based on current page
            this.setActiveNavItem();
            
            console.log('Templates initialized successfully');
        } catch (error) {
            console.error('Failed to initialize templates:', error);
        }
    },
    
    /**
     * Get the template URL based on the current environment
     * @returns {string} URL to the templates directory
     */
    getTemplateUrl() {
        console.log('Getting template URL...');
        
        // Check if we're on GitHub Pages
        const isGitHubPages = window.location.hostname.includes('github.io');
        console.log('Is GitHub Pages:', isGitHubPages);
        
        // Get the current path
        const path = window.location.pathname;
        console.log('Current path:', path);
        
        // Check if we're in the pages directory
        const inPagesDir = path.includes('/pages/');
        console.log('In pages directory:', inPagesDir);
        
        let templateUrl;
        
        if (isGitHubPages) {
            // For GitHub Pages
            const pathParts = path.split('/');
            // The repo name should be the first part after the domain
            if (pathParts.length > 1) {
                const repoName = pathParts[1];
                templateUrl = `/${repoName}/templates/navigation.html`;
            } else {
                templateUrl = '/templates/navigation.html';
            }
        } else if (inPagesDir) {
            // For local development when in pages directory
            templateUrl = '../templates/navigation.html';
        } else {
            // For local development when not in pages directory
            templateUrl = 'templates/navigation.html';
        }
        
        console.log('Template URL:', templateUrl);
        return templateUrl;
    },
    
    // Load navigation template and insert it
    async loadNavigation() {
        console.log('Loading navigation...');
        
        try {
            // Load the navigation template if not cached
            if (!this.cache.navigation) {
                const templateUrl = this.getTemplateUrl();
                console.log(`Fetching navigation template from: ${templateUrl}`);
                
                const response = await fetch(templateUrl);
                console.log('Fetch response:', response.status, response.statusText);
                
                if (!response.ok) {
                    throw new Error(`Failed to load navigation template: ${response.status}`);
                }
                
                const text = await response.text();
                console.log('Template loaded, length:', text.length);
                this.cache.navigation = text;
            }
            
            // Find the navigation placeholder
            const navPlaceholder = document.getElementById('navigation-placeholder');
            console.log('Navigation placeholder found:', !!navPlaceholder);
            
            if (navPlaceholder) {
                // Insert the navigation template
                navPlaceholder.innerHTML = this.cache.navigation;
                console.log('Navigation template inserted');
                
                // Fix navigation links to ensure they work
                setTimeout(() => {
                    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
                    console.log('Found navigation links:', navLinks.length);
                    
                    // Force all links to have proper hrefs
                    navLinks.forEach((link, index) => {
                        const linkId = link.id;
                        console.log(`Processing link ${index}:`, linkId, link.href);
                        
                        // Determine the correct href based on the link ID
                        let targetPage = '';
                        if (linkId === 'nav-overview') {
                            targetPage = 'index.html';
                        } else if (linkId === 'nav-speakers') {
                            targetPage = 'speakers.html';
                        } else if (linkId === 'nav-search') {
                            targetPage = 'search.html';
                        }
                        
                        // Set the correct href
                        if (targetPage) {
                            // Check if we're in the pages directory
                            if (window.location.pathname.includes('/pages/')) {
                                // If we're already in the pages directory, just use the filename
                                link.href = targetPage;
                            } else {
                                // Otherwise, include the pages directory
                                link.href = `pages/${targetPage}`;
                            }
                            console.log(`Set link ${linkId} href to:`, link.href);
                        }
                        
                        // Add click event listener that ensures navigation happens
                        link.addEventListener('click', function(e) {
                            console.log(`Link clicked: ${linkId} -> ${this.href}`);
                            // Don't prevent default - let the browser handle navigation
                            // Explicitly navigate if needed
                            if (this.href) {
                                window.location.href = this.href;
                            }
                        });
                    });
                }, 100);
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
