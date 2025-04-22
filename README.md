# Speakerpool Web Application

A comprehensive dashboard for managing and exploring a pool of speakers for events and presentations.

## Overview

The Speakerpool Web Application is a static web dashboard that provides an intuitive interface for exploring speaker data. It allows users to view statistics about the speaker pool, search for speakers based on various criteria, and access detailed information about individual speakers.

## Features

### Dashboard Overview
- Total speaker count with internal/external availability breakdown
- Company distribution visualization (pie chart)
- Language distribution visualization (pie chart)
- Interactive topic tag cloud with speaker information on hover

### External Data Source Support
- Load data from external sources using the `parDataFile` URL parameter
- Session persistence for the data source across page navigation
- Example: `index.html?parDataFile=https://example.com/data/speakers.json`

### Speaker Details
- Comprehensive speaker profiles
- Contact information and biography
- Topics and presentation history
- Language capabilities and availability status

### Advanced Search
- Filter by languages (multiple selection)
- Filter by internal/external availability
- Search by topics
- General search across all fields
- Results displayed in a responsive grid layout

### Topic-Based Navigation
- Click on topics in the tag cloud to find relevant speakers
- View all speakers for a specific topic
- Navigate directly to speaker details

## Technical Details

### Architecture
The application is built as a static web application using vanilla JavaScript with ES modules. It follows a modular design with a well-organized directory structure:

```
speakerpool-webapp/
├── assets/                    # Static assets
│   ├── css/                   # CSS files
│   ├── js/                    # JavaScript files
│   │   ├── components/        # UI components
│   │   ├── core/              # Core functionality
│   │   ├── pages/             # Page-specific scripts
│   │   └── utils/             # Utility functions
│   └── images/                # Image assets
├── data/                      # Data files
├── docs/                      # Documentation
├── pages/                     # HTML pages
├── templates/                 # HTML templates
└── scripts/                   # Utility scripts
```

Key components include:

- Data management (`assets/js/core/data.js`)
- Dashboard visualization (`assets/js/pages/dashboard.js`)
- Speaker details (`assets/js/pages/speakers.js`)
- Search functionality (`assets/js/pages/search.js`)
- Template management (`assets/js/core/templates.js`)

For a detailed explanation of the application architecture, see the [Architecture Document](docs/ARCHITECTURE.md).

### Data Processing
The application uses a JSON data source (`data/Sprekerpool.json`) that is generated from a CSV file using a Python conversion script (`convert_csv_to_json.py`). The conversion process includes:

- Field name cleaning and mapping
- Processing languages as boolean dictionaries
- Handling internal/external speaking preferences

### Template System
To avoid code duplication, the application implements a simple template system that:
- Centralizes shared components like navigation
- Automatically sets active states based on current page
- Provides a consistent user experience across all pages

### Libraries Used
- Bootstrap 5 - For responsive layout and UI components
- Chart.js - For data visualizations (pie charts)
- D3.js - For the interactive tag cloud

## Getting Started

### Prerequisites
- A modern web browser
- A local web server (Python's built-in server works well)

### Running the Application
1. Clone or download this repository
2. Navigate to the project directory
3. Start a local web server:
   ```
   python -m http.server 8000
   ```
4. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

## Data Structure

The speaker data is stored in JSON format with the following structure:

```json
{
  "id": "1",
  "name": "John Doe",
  "company": "Example Corp",
  "emailadress": "john.doe@example.com",
  "topics": "AI, Machine Learning, Data Science",
  "bio": "Short biography...",
  "recent_presentations": "List of recent presentations...",
  "context": "Preferred presentation context...",
  "languages": {
    "English": true,
    "Dutch": true
  },
  "internal": true,
  "external": false
}
```

## Customization

### Adding New Pages
1. Create a new HTML file based on the existing templates
2. Add a navigation entry in `templates/navigation.html`
3. Create a corresponding JavaScript file if needed

### Modifying the Data Source

#### Local Data
1. Update the CSV file with new data
2. Run the conversion script to generate a new JSON file using the field_mapping.json file:
   ```
   python convert_csv_to_json.py --convert
   ```

Note: `python convert_csv_to_json.py` will create the field_mapping.json file if it doesn't exist.

#### External Data
1. Host your JSON data file on an accessible server
2. Access the application with the `parDataFile` parameter:
   ```
   https://your-app-url.com/pages/index.html?parDataFile=https://example.com/data/speakers.json
   ```
3. The external data source will be remembered throughout your browser session


## Future Enhancements
- User authentication for managing speaker data
- Speaker submission form
- Advanced filtering capabilities
- Export functionality for speaker lists
- Calendar integration for scheduling

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments
- Bootstrap team for the responsive UI framework
- Chart.js and D3.js teams for the visualization libraries
