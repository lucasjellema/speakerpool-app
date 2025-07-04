# Sprekerpool - Speaker Management Application

A modern, modular single-page web application for managing and presenting a pool of speakers. This application provides a comprehensive dashboard with visualizations, advanced search capabilities, and speaker management features.

## Features

### Dashboard
- Total speakers statistics with breakdown by availability
- Interactive company distribution chart
- Languages distribution bar chart visualization
- Topics tag cloud with frequency-based sizing
- Raw data preview toggle

### Search Functionality
- Multi-criteria search capabilities
- Filter by general text, topics, languages, and availability
- Interactive results with speaker cards
- Click on dashboard elements to filter search results

### Speaker Management
- Complete speaker details view

### Self-Registration for New Speakers
- **Button Visibility**: Logged-in users who are not already listed as speakers will see an "Add Me as Speaker" button in the header.
- **Pre-filled Form**: Clicking this button opens the speaker profile edit form, pre-filled with the user's name and email address (obtained from their authentication token).
- **Profile Creation**: Users can complete the form and save their details. This action creates a user-specific delta file (e.g., `YourUserName.json`) containing their profile information.
- **Confirmation**: Upon successful submission, the user receives a confirmation message: "Your speaker profile has been successfully saved! It will be processed into the main speaker pool shortly. Note: This process may take a few days. In the meantime you will not yet be able to see your own profile - nor will others be able to see it."
- **Button Update**: After successful self-registration, the "Add Me as Speaker" button is hidden, and the "Show My Profile" button becomes visible.

### Admin Mode (New)
- **Activation**: Via URL parameter `admin=yes` (e.g., `index.html?admin=yes`).
- **Enhanced Data Loading**: On startup, loads all individual speaker delta files to provide the most comprehensive and up-to-date view of all profiles.
- **Universal Editing**: Allows viewing and editing of *any* speaker profile, not just the logged-in user's.
- **Centralized Saving**: Changes made to any profile are staged in memory. A "Save All Data" button appears, allowing an administrator to save all accumulated changes directly to the main `Sprekerpool.json` data source via a secure admin-specific API endpoint. This bypasses the creation of user-specific delta files.
- **Purpose**: Designed for data curation, correcting profiles across the entire dataset, and consolidating widespread changes.
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
- User-specific delta files for persistent speaker profile changes, managed via authenticated API calls.
- **Admin Mode**: Special mode for comprehensive data management, allowing edits to any profile and direct updates to the main data source (see Admin Mode feature section).

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
- **Admin Mode**: Activate by adding `admin=yes` to the URL (e.g., `index.html?admin=yes`) to enable administrative features.

## Interactive Features

### URL Parameters
- Use `sprekerId` query parameter to directly open a specific speaker's details using their unique ID (e.g., `index.html?sprekerId=4507a8c8ba58450`)

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
- User-specific delta files: Authenticated users' profile changes are saved to and loaded from personal delta files (e.g., `[UserNameFromJWT].json`) via secure API Gateway endpoints.
- Automatic merging of user-specific data: On login, a speaker's delta data is fetched and merged with the main dataset, providing a personalized view.
- Robust handling of missing or empty user-specific delta files.

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
- Changes to speaker profiles (other than the logged-in user's own profile) are not persisted across sessions, *unless using Admin Mode*.
- Limited data validation

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
