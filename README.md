# Sprekerpool - Speaker Management Application

A modern, modular single-page web application for managing and presenting a pool of speakers. This application provides a comprehensive dashboard with visualizations, advanced search capabilities, and speaker management features.

## Features

### Dashboard
- Total speakers statistics with breakdown by availability
- Interactive company distribution chart
- Languages distribution visualization
- Topics tag cloud with frequency-based sizing
- Raw data preview toggle

### Search Functionality
- Multi-criteria search capabilities
- Filter by general text, topics, languages, and availability
- Interactive results with speaker cards
- Click on dashboard elements to filter search results

### Speaker Management
- Complete speaker details view
- Edit speaker information
- Add new companies and languages
- Update speaker availability, topics, and bio

### Technical Features
- Modular Single Page Application (SPA) architecture
- Dynamic content loading with ES6 modules
- Responsive design using Bootstrap 5
- Interactive data visualizations with Chart.js
- Event-driven architecture for real-time updates
- URL query parameter support for direct speaker access
- Delta file support for persistent speaker data changes

## Project Structure

```
sprekerpool-app-new/
├── css/
│   └── styles.css               # Custom styles
├── data/
│   └── sprekerpool.json         # Speaker data source
├── js/
│   ├── dataService.js           # Centralized data management
│   ├── main.js                  # Application initialization
│   ├── modules/
│   │   ├── speakerDetailsModule.js  # Speaker details functionality
│   │   ├── speakerEditModule.js     # Speaker editing functionality
│   │   └── tabs/
│   │       ├── dashboard.html       # Dashboard tab template
│   │       ├── dashboardTab.js      # Dashboard tab logic
│   │       ├── find.html            # Find tab template
│   │       ├── findTab.js           # Find tab logic
│   │       ├── speakers.html        # Speakers tab template
│   │       ├── speakersTab.js       # Speakers tab logic
│   │       ├── speakerDetails.html  # Speaker details modal
│   │       └── speakerEditForm.html # Speaker edit form
├── index.html                   # Main application entry point
└── README.md                    # This file
```

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Edge, Safari)
- A local web server (optional for development)

### Running the Application
1. Clone or download this repository
2. Open the project folder
3. Start a local web server in the project directory:
   ```
   python -m http.server 8000
   ```
   Or use any other local web server of your choice
4. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

### Using the Application
- **Dashboard**: View statistics and visualizations of speaker data
- **Find**: Search and filter speakers based on various criteria
- **Speakers**: View all speakers in a sortable table format
- **Speaker Details**: Click "View Details" on any speaker to see complete information
- **Edit Speaker**: Click "Edit" in the speaker details modal to modify information
- **Direct Speaker Access**: Access a specific speaker's details directly by using the URL query parameter `sprekerId` (e.g., `index.html?sprekerId=123`)

## Interactive Features

### URL Parameters
- Use `sprekerId` query parameter to directly open a specific speaker's details using their unique ID (e.g., `index.html?sprekerId=4507a8c8ba58450`)
- Use `parDataFile` query parameter to specify an alternative data source
- Use `parDeltasFolder` query parameter to specify a folder for delta files that override or extend the main data
- When both `sprekerId` and `parDeltasFolder` are specified, the application will try to load a delta file named `[sprekerId].json`

### Dashboard Interactions
- Click on company segments in the pie chart to see speakers from that company
- Click on language segments to filter speakers by language
- Click on topic tags to find speakers covering specific topics

### Search Filters
- Use general search to find speakers by name, company, or bio
- Filter by specific topics
- Select languages from the dynamically generated list
- Filter by internal/external availability

### Speaker Management
- View detailed information about each speaker
- Edit speaker details including adding new companies and languages
- All changes are immediately reflected throughout the application

## Technical Implementation

### Data Management
- Centralized data service for consistent data access
- In-memory data storage with event-based updates
- Custom events for real-time UI updates
- Delta file support for persisting changes to external storage
- Ability to override specific speaker data via delta files
- Dynamic delta file naming based on speaker's unique ID
- Smart handling of empty or invalid delta files

### Modular Architecture
- ES6 modules for code organization
- Separation of HTML templates and JavaScript logic
- Event-driven communication between components

### Visualization
- Interactive charts using Chart.js
- Dynamic tag cloud for topic visualization
- Responsive design for all screen sizes

## Limitations and Future Enhancements

### Current Limitations
- Primarily client-side application with in-memory data storage
- Changes to most speakers are lost on page refresh unless using delta files
- Limited data validation
- Delta file functionality requires proper URL parameters to be set

### Potential Enhancements
- Backend integration for persistent data storage
- User authentication and role-based access
- Advanced filtering and sorting options
- Export functionality for speaker data
- Batch operations for managing multiple speakers
- Enhanced URL parameter support for sharing filtered views

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments
- Bootstrap for the responsive UI framework
- Chart.js for data visualizations
- All contributors to this project
