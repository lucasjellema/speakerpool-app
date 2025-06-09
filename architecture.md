# Sprekerpool Application Architecture

This document provides a detailed overview of the technical architecture and implementation of the Sprekerpool Speaker Management Application.

## Architecture Overview

The Sprekerpool application is built as a client-side Single Page Application (SPA) using modern JavaScript (ES6+) with a modular architecture. The application follows these key architectural principles:

1. **Modular Design**: Functionality is separated into distinct modules with clear responsibilities
2. **Data Centralization**: A central data service manages all data access and manipulation
3. **Event-Driven Communication**: Components communicate via custom events
4. **Dynamic Content Loading**: HTML templates are loaded dynamically as needed
5. **Responsive UI**: Bootstrap 5 provides responsive design capabilities
6. **User-Specific Delta Persistence**: Authenticated users' profile changes are persisted to personal delta files via API Gateway.

## Authentication Flow and User-Specific Data

The application uses Microsoft Entra ID (formerly Azure AD) for authentication. This flow is integrated with how user-specific data (profile overrides/deltas) is handled.

1.  **MSAL Initialization**:
    -   MSAL.js (Microsoft Authentication Library) is initialized with the application's Entra ID configuration.
    -   The application checks for an existing authentication state (e.g., cached tokens in session/local storage).

2.  **Login Process**:
    -   User initiates login (e.g., clicks a login button).
    -   MSAL redirects or opens a popup for Microsoft Entra ID authentication.
    -   User authenticates with their credentials.
    -   Upon successful authentication, MSAL receives an ID token and an access token.
    -   The application stores these tokens (typically `idToken` is used for backend API calls, `accessToken` for Microsoft Graph API calls if any).
    -   A `msal:loginSuccess` event (or similar custom event) is dispatched.

3.  **Token Usage for API Calls**:
    -   The ID token (`idToken`) is primarily used to authenticate requests to the application's backend (OCI API Gateway).
    -   For each request to a protected API Gateway endpoint, the `Authorization: Bearer <idToken>` header is included.

4.  **User-Specific Data Loading on Login**:
    -   Following a successful login, `dataService.js` (triggered by `main.js` listening to the login event) calls `getUserName()` from `authPopup.js` to get the `name` claim from the ID token.
    -   It then checks if this user exists in the main `speakerData` (loaded from `Sprekerpool.json` via an authenticated API Gateway call).
    -   If the user is a recognized speaker, `dataService.js` calls `loadUserSpeakerData(currentUserName)`. This function makes an authenticated `GET` request to the user-specific delta endpoint on the API Gateway (e.g., `/speakerpool-delta`).
    -   The API Gateway uses the `request.auth[name]` claim from the JWT to identify and fetch the correct user's delta JSON file (e.g., `.../deltas/UserName.json`) from OCI Object Storage.
    -   If the delta file is found and valid, its contents are merged into the in-memory `speakerData` for that user, overriding any values from the main `Sprekerpool.json`.

5.  **Saving Profile Changes (Self-Edit)**:
    -   When an authenticated user edits their own profile (identified by matching `speaker.name` with `getUserName()`), `speakerEditModule.js` collects the form data.
    -   It calls `dataService.updateMySpeakerProfile(updatedSpeakerData)`.
    -   This function makes an authenticated `PUT` request to the same user-specific delta endpoint on the API Gateway (e.g., `/speakerpool-delta`).
    -   The API Gateway again uses the `request.auth[name]` claim to identify and update (or create) the corresponding user's delta file in OCI Object Storage with the `updatedSpeakerData`.

6.  **Session Management & Logout**:
    -   MSAL handles token lifetime and renewal in the background.
    -   Logout clears MSAL's cache and the application's stored user state.

## Application Architecture Diagram

The following diagram illustrates the structure and component relationships of the Sprekerpool application:

```mermaid
graph TD
    %% Main Components
    A[index.html] --> B[main.js]
    B --> C[dataService.js]
    
    %% Tab Modules
    B --> D[dashboardTab.js]
    B --> E[findTab.js]
    B --> F[speakersTab.js]
    
    %% Speaker Modules
    B --> G[speakerDetailsModule.js]
    G --> H[speakerEditModule.js]
    
    %% Data Flow
    C --> D
    C --> E
    C --> F
    C --> G
    C --> H
    
    %% HTML Templates
    D --> D1[dashboard.html]
    E --> E1[find.html]
    F --> F1[speakers.html]
    G --> G1[speakerDetails.html]
    H --> H1[speakerEditForm.html]
    
    %% External Services & Data Storage
    C --> I_API[OCI API Gateway]
    I_API --> |"Main Data / User Deltas"| I_Storage[OCI Object Storage]
    
    %% Authentication
    A --> |"Authenticates via"| M_Auth[MS Entra ID]
    M_Auth --> |ID Token| C %% ID token used by dataService for API calls

    %% User-Specific Delta Flow (via API Gateway)
    C --> |"GET User Delta (Auth)"| I_API
    H --> |"PUT User Delta (Auth)"| C %% speakerEditModule calls dataService
    
    %% External Libraries
    J[Bootstrap 5] --> A
    K[Chart.js] --> D
    L[D3.js] --> D
    
    %% External Services Styling
    classDef externalSvc fill:#f9f,stroke:#333,stroke-width:2px;
    class M_Auth,I_API,I_Storage externalSvc;
    
    %% Event Flow
    C -- "Events" --> G
    H -- "Events" --> C
    F -- "Events" --> G
    
    %% URL Parameters
    M_URL[URL Parameters] --> B
    M_URL -- "sprekerId" --> G
    %% M_URL -- "admin" --> C (admin mode is initialized in dataService)
    
    %% Styling
    N[styles.css] --> A
    
    %% Subgraph for Modules
    subgraph "Core Application"
        B
        C
    end
    
    subgraph "Tab Modules"
        D
        E
        F
    end
    
    subgraph "Speaker Management"
        G
        H
    end
    
    subgraph "Templates"
        D1
        E1
        F1
        G1
        H1
    end
    
    subgraph "External Resources"
        I_API
        I_Storage
        J
        K
        L
        N
    end
    
    %% Styling
    classDef core fill:#cde,stroke:#333,stroke-width:2px;
    classDef module fill:#bbf,stroke:#333,stroke-width:1px;
    classDef template fill:#dfd,stroke:#333,stroke-width:1px;
    classDef data fill:#fdd,stroke:#333,stroke-width:1px;
    classDef external fill:#ddd,stroke:#333,stroke-width:1px;
    
    class B,C core;
    class D,E,F,G,H module;
    class D1,E1,F1,G1,H1 template;
    class J,K,L,N external;
```

This diagram shows:
- The core application components (`main.js` and `dataService.js`).
- The tab modules and their HTML templates.
- The speaker management modules (`speakerDetailsModule.js`, `speakerEditModule.js`).
- Data flow, including how `dataService.js` interacts with OCI API Gateway for both main data and user-specific delta files.
- Authentication flow with MS Entra ID and token usage for API calls.
- Event communication between components.
- URL parameter handling for `sprekerId` (direct speaker access) and `admin` mode.
- External resources and libraries used.
- User-specific delta file persistence mechanism via OCI API Gateway, identified by JWT claims.


## Application Structure

```
sprekerpool-webapp/
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
└── README.md                    # Project documentation
```

## Core Components

### 1. Main Application (main.js)

The entry point of the application that handles:
- Application initialization
- DOM content loading
- Tab navigation and event listeners
- URL parameter processing

```javascript
// Initialization flow
document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
    // Load speaker data first
    await loadSpeakerData();
    
    // Load initial tab content (dashboard is active by default)
    await loadDashboardContent();
    
    // Set up tab event listeners
    initializeTabEventListeners();
    
    // Initialize speaker details module
    await initializeSpeakerDetails();
    
    // Check if sprekerId query parameter exists
    checkForSpeakerIdParameter();
}
```

### 2. Data Service (dataService.js)

A centralized service that manages all data operations:
- Loading speaker data from JSON file
- Loading and applying delta files for specific speakers using their unique IDs
- Providing methods to access and filter speaker data by ID or unique ID
- Updating speaker information
- Saving changes to delta files named after speaker's unique ID
- Handling empty or invalid delta files gracefully
- Dispatching events when data changes

```javascript
// Data is stored in memory
let speakerData = [];
let deltasFolderPAR = '';
let dataFilePAR = '';

// Data loading with delta file support
export async function loadSpeakerData() {
    try {
        // Load main speaker data
        const response = await fetch(getDataUrl());
        const data = await response.json();
        speakerData = data;
        
        // Check if we have a deltas folder specified
        if (deltasFolderPAR) {
            // Attempt to load the delta file for the speaker ID from the URL parameter
            try {
                // Use the speaker ID from the URL parameter, or default to a fallback
                const deltaFileName = speakerIdPAR ? `${speakerIdPAR}.json` : 'speaker-delta.json';
                const deltaUrl = `${deltasFolderPAR}${deltaFileName}`;
                const deltaResponse = await fetch(deltaUrl);
                
                if (deltaResponse.ok) {
                    const deltaData = await deltaResponse.json();
                    
                    // Check if the delta file contains an empty JSON object
                    const isEmptyObject = Object.keys(deltaData).length === 0;
                    
                    if (isEmptyObject) {
                        console.log('Delta file contains an empty JSON object, skipping processing');
                    }
                    // Apply the delta to the speaker data if it's not empty and has an ID
                    else if (deltaData && deltaData.id) {
                        const speakerIndex = speakerData.findIndex(speaker => speaker.id === deltaData.id);
                        if (speakerIndex !== -1) {
                            speakerData[speakerIndex] = deltaData;
                        } else {
                            speakerData.push(deltaData);
                        }
                    }
                }
            } catch (deltaError) {
                console.warn('Error loading delta file:', deltaError);
            }
        }
        
        return speakerData;
    } catch (error) {
        console.error('Error loading speaker data:', error);
        return [];
    }
}

// Function to get a speaker by ID
export function getSpeakerById(id) {
    return speakerData.find(speaker => speaker.id === id);
}

// Function to get a speaker by unique ID
export function getSpeakerByUniqueId(uniqueId) {
    return speakerData.find(speaker => speaker.uniqueId === uniqueId);
}

// Example of data update with delta file saving
export function updateSpeaker(updatedSpeaker) {
    // Update data in memory
    const index = speakerData.findIndex(speaker => speaker.id === updatedSpeaker.id);
    if (index !== -1) {
        speakerData[index] = updatedSpeaker;
        
        // If deltasFolderPAR is specified, save to delta file
        if (deltasFolderPAR) {
            // Use the speaker's uniqueId for the delta file name
            const deltaFileName = updatedSpeaker.uniqueId ? `${updatedSpeaker.uniqueId}.json` : `${updatedSpeaker.id}.json`;
            const speakerJson = JSON.stringify(updatedSpeaker, null, 2);
            const blob = new Blob([speakerJson], { type: 'application/json' });
            saveFile(blob, deltaFileName, deltasFolderPAR);
        }
        
        // Notify components via custom event
        const event = new CustomEvent('speakerDataUpdated', { 
            detail: { speakerId: updatedSpeaker.id } 
        });
        document.dispatchEvent(event);
        
        return true;
    }
    return false;
}
```

### 3. Tab Modules

Each tab is implemented as a separate module with its own HTML template and JavaScript logic:

#### Dashboard Tab (dashboardTab.js)
- Displays statistics and visualizations
- Creates charts using Chart.js
- Implements interactive data visualizations

```javascript
async function loadDashboardContent() {
    // Load HTML template
    const response = await fetch('js/modules/tabs/dashboard.html');
    const html = await response.text();
    document.getElementById('dashboard-content').innerHTML = html;
    
    // Initialize components
    displaySpeakerStatistics(speakers);
    createCompanyChart(speakers);
    createLanguagesChart(speakers);
    createTopicsCloud(speakers);
}
```

#### Find Tab (findTab.js)
- Implements search functionality
- Filters speakers based on criteria
- Displays search results

#### Speakers Tab (speakersTab.js)
- Displays all speakers in a table format
- Implements sorting functionality
- Provides access to speaker details

### 4. Speaker Details Module (speakerDetailsModule.js)

Handles displaying detailed information about a speaker:
- Loads modal HTML template
- Populates speaker information
- Manages modal display
- Handles navigation to edit mode

```javascript
// Function to show speaker details
function showSpeakerDetails(speakerId) {
    // Store the current speaker ID
    currentSpeakerId = speakerId;
    
    // Get the speaker data
    const speaker = getSpeakerById(speakerId);
    
    // Populate the modal with speaker details
    populateSpeakerDetails(speaker);
    
    // Show the modal
    speakerDetailsModal.show();
}
```

### 5. Speaker Edit Module (speakerEditModule.js)

Manages editing speaker information:
- Loads edit form template
- Populates form with current speaker data
- Validates input
- Saves changes via the data service

## Key Technical Implementations

### Dynamic Content Loading

The application loads HTML templates dynamically using the Fetch API:

```javascript
async function loadTemplate(containerId, templatePath) {
    try {
        const response = await fetch(templatePath);
        const html = await response.text();
        document.getElementById(containerId).innerHTML = html;
    } catch (error) {
        console.error(`Error loading template ${templatePath}:`, error);
    }
}
```

### Event-Driven Communication

Components communicate through custom events:

```javascript
// Dispatching an event
const event = new CustomEvent('speakerDataUpdated', { 
    detail: { speakerId: updatedSpeaker.id } 
});
document.dispatchEvent(event);

// Listening for an event
document.addEventListener('speakerDataUpdated', (event) => {
    // Handle the event
    if (event.detail.speakerId === currentSpeakerId) {
        showSpeakerDetails(currentSpeakerId);
    }
});
```

### URL Parameter Handling

The application supports URL parameters for direct access to specific content and data sources:

```javascript
// Initialize parameters from URL
export function initializeParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Get dataFile parameter
    const dataFileParam = urlParams.get(datafileQueryParameter);
    if (dataFileParam) {
        dataFilePAR = dataFileParam;
        console.log(`Initialized dataFilePAR: ${dataFilePAR}`);
    } 
    
    // Get deltasFolder parameter
    const deltasFolderParam = urlParams.get(deltasFolderQueryParameter);
    if (deltasFolderParam) {
        deltasFolderPAR = deltasFolderParam;
        console.log(`Initialized deltasFolderPAR: ${deltasFolderPAR}`);
    } else {
        console.log('No deltasFolderPAR specified');
    }
    
    // Get speaker ID parameter
    const speakerIdParam = urlParams.get(speakerIdQueryParameter);
    if (speakerIdParam) {
        speakerIdPAR = speakerIdParam;
        console.log(`Initialized speakerIdPAR: ${speakerIdPAR}`);
    }
    
    return { dataFilePAR, deltasFolderPAR, speakerIdPAR };
}

// Check for sprekerId parameter
function checkForSpeakerIdParameter() {
    const urlParams = new URLSearchParams(window.location.search);
    const sprekerId = urlParams.get('sprekerId');
    
    if (sprekerId) {
        // Navigate to speakers tab and show details
        loadSpeakersContent().then(() => {
            const speakersTab = new bootstrap.Tab(document.getElementById('speakers-tab'));
            speakersTab.show();
            
            setTimeout(() => {
                showSpeakerDetails(sprekerId);
            }, 500);
        });
    }
}
```

### Data Visualization

The application uses Chart.js for interactive data visualizations:

```javascript
function createCompanyChart(speakers) {
    // Process data
    const companyData = processCompanyData(speakers);
    
    // Create chart
    const ctx = document.getElementById('company-chart').getContext('2d');
    companyChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: companyData.labels,
            datasets: [{
                data: companyData.values,
                backgroundColor: generateColors(companyData.labels.length)
            }]
        },
        options: {
            // Chart configuration
            onClick: (event, elements) => {
                // Handle click events for interactivity
            }
        }
    });
}
```

## Design Patterns

### Module Pattern

The application uses ES6 modules to encapsulate functionality:

```javascript
// Export specific functions
export { loadDashboardContent };

// Import from other modules
import { getAllSpeakers } from '../../dataService.js';
```

### Observer Pattern

The application implements the Observer pattern through custom events:

1. Components subscribe to events they're interested in
2. The data service publishes events when data changes
3. Subscribed components react to these changes

### Factory Pattern

Some components use factory-like functions to create UI elements:

```javascript
function createSpeakerCard(speaker) {
    const card = document.createElement('div');
    card.className = 'card speaker-card';
    
    // Build card content
    
    return card;
}
```

## Performance Considerations

### Lazy Loading

Templates and content are loaded only when needed:

```javascript
// Content is loaded only when the tab is activated
tab.addEventListener('shown.bs.tab', function (event) {
    const targetTabId = event.target.getAttribute('id');
    
    switch (targetTabId) {
        case 'dashboard-tab':
            loadDashboardContent();
            break;
        // Other tabs...
    }
});
```

### Memory Management

The application manages memory by:
- Storing references to charts to prevent memory leaks
- Cleaning up event listeners when components are destroyed
- Reusing existing DOM elements when possible

## Security Considerations

### Data Validation

The application performs basic validation on user inputs:
- Checking for required fields
- Validating email formats
- Sanitizing inputs to prevent XSS attacks

### URL Parameter Validation

Parameters from URLs are validated before use:
- Checking if IDs exist in the data
- Handling invalid parameters gracefully

## Limitations and Future Improvements

### Current Limitations

1. **Primarily Client-Side**: Most data is stored in memory, with limited persistence through delta files
2. **Limited Validation**: Basic validation without comprehensive error handling
3. **No Authentication**: No user authentication or authorization
4. **Partial Data Persistence**: Changes to speakers can be persisted through delta files when URL parameters are properly configured

### Future Architectural Improvements

1. **Backend Integration**:
   - Add a RESTful API for data persistence
   - Implement proper error handling and validation
   - Extend delta file functionality to handle all speakers

2. **State Management**:
   - Introduce a more robust state management solution
   - Consider using a library like Redux for complex state

3. **Build Process**:
   - Add a build process with Webpack or Rollup
   - Implement code splitting for better performance

4. **Testing**:
   - Add unit tests for core functionality
   - Implement end-to-end testing

5. **Enhanced URL Parameter Support**:
   - Support for more complex URL parameters
   - Deep linking to specific views and filters
   - Improved delta file handling with dynamic speaker IDs
   - Better integration between URL parameters for comprehensive functionality


## Conclusion

The Sprekerpool application demonstrates a well-structured, modular architecture using modern JavaScript practices. Its event-driven approach and separation of concerns make it maintainable and extensible. While it has some limitations as a client-side only application, the architecture provides a solid foundation for future enhancements.
