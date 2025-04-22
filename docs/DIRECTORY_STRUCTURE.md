# Proposed Directory Structure

The current flat file structure can be reorganized into a more maintainable and scalable directory structure. Here's a proposed organization:

```
speakerpool-webapp/
├── assets/                    # Static assets
│   ├── css/                   # CSS files
│   │   ├── styles.css         # Main styles
│   │   └── components/        # Component-specific styles
│   ├── js/                    # JavaScript files
│   │   ├── components/        # UI components
│   │   │   ├── charts.js      # Chart-related functionality
│   │   │   ├── tagcloud.js    # Tag cloud functionality
│   │   │   └── cards.js       # Card UI components
│   │   ├── core/              # Core functionality
│   │   │   ├── data.js        # Data management
│   │   │   └── templates.js   # Template system
│   │   ├── pages/             # Page-specific scripts
│   │   │   ├── dashboard.js   # Dashboard page (formerly app.js)
│   │   │   ├── speakers.js    # Speaker details page
│   │   │   ├── search.js      # Search page
│   │   │   └── topics.js      # Topic speakers page
│   │   └── utils/             # Utility functions
│   │       ├── formatting.js  # Text formatting utilities
│   │       └── filtering.js   # Data filtering utilities
│   └── images/                # Image assets
├── data/                      # Data files
│   ├── Sprekerpool.json       # Speaker data
│   ├── field_mapping.json     # Field mapping configuration
│   └── Sprekerpool.csv        # Original CSV data
├── docs/                      # Documentation
│   ├── ARCHITECTURE.md        # Architecture documentation
│   ├── API.md                 # API documentation
│   └── architecture-diagram.png # Architecture diagram
├── pages/                     # HTML pages
│   ├── index.html             # Dashboard/overview page
│   ├── speakers.html          # Speaker details page
│   ├── search.html            # Search page
│   └── topic-speakers.html    # Topic speakers page
├── templates/                 # HTML templates
│   ├── navigation.html        # Navigation template
│   ├── footer.html            # Footer template
│   └── components/            # UI component templates
│       ├── speaker-card.html  # Speaker card template
│       └── filter-panel.html  # Filter panel template
├── scripts/                   # Utility scripts
│   └── convert_csv_to_json.py # Data conversion script
├── .gitignore                 # Git ignore file
├── README.md                  # Project README
└── index.html                 # Entry point (redirects to pages/index.html)
```

## Benefits of This Structure

1. **Separation of Concerns**
   - Clear separation between HTML, CSS, and JavaScript
   - Logical grouping of related files

2. **Scalability**
   - Easy to add new pages, components, or features
   - Prevents the root directory from becoming cluttered

3. **Maintainability**
   - Easier to find and update specific files
   - Reduces merge conflicts in version control

4. **Organization by Function**
   - Files are organized by their function in the application
   - Related files are kept together

5. **Improved Developer Experience**
   - Clear structure makes onboarding easier
   - Follows common web development conventions

## Implementation Approach

To migrate to this structure:

1. Create the directory structure
2. Move files to their appropriate locations
3. Update import paths in JavaScript files
4. Update resource paths in HTML files
5. Create a root index.html that redirects to the main page

This restructuring can be done incrementally to minimize disruption to the development process.

## Future Considerations

As the application grows, consider:

1. **Build System**
   - Adding a build process (webpack, Rollup, etc.)
   - Implementing CSS preprocessing

2. **Testing**
   - Adding a `/tests` directory for unit and integration tests

3. **Configuration**
   - Moving configuration to a dedicated `/config` directory
