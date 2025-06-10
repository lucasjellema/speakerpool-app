// Speaker Edit Module
import { 
    getSpeakerById, 
    updateSpeaker, 
    updateMySpeakerProfile, // Added for self-profile updates
    getAllCompanies, 
    getAllLanguages,
    getAllSpeakers,
    isInAdminMode, addNewSpeakerProfile
} from '../dataService.js';
import { getUserName, getUserEmailFromToken } from '../authPopup.js'; // Added to identify current user and get email

// Variable to store the modal instance
let speakerEditModal = null;
let currentSpeakerId = null;
let currentSpeakerIsNew = false; // Flag to indicate if we are creating a new speaker

// Function to initialize the speaker edit module
async function initializeSpeakerEdit() {
    try {
        // Load the modal HTML
        const response = await fetch('js/modules/tabs/speakerEditForm.html');
        const html = await response.text();
        
        // Create a temporary container to hold the modal HTML
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = html;
        
        // Append the modal to the body
        document.body.appendChild(tempContainer.firstElementChild);
        
        // Initialize the Bootstrap modal
        const modalElement = document.getElementById('speakerEditModal');
        if (modalElement) {
            speakerEditModal = new bootstrap.Modal(modalElement);
            
            // Set up event listeners
            setupEventListeners();
        }
        
        return true;
    } catch (error) {
        console.error('Error initializing speaker edit:', error);
        return false;
    }
}

// Function to set up event listeners
function setupEventListeners() {
    // Add new company button
    const addNewCompanyBtn = document.getElementById('add-new-company-btn');
    if (addNewCompanyBtn) {
        addNewCompanyBtn.addEventListener('click', () => {
            document.getElementById('new-company-input').style.display = 'block';
            document.getElementById('edit-company-select').disabled = true;
        });
    }
    
    // Save new company button
    const saveNewCompanyBtn = document.getElementById('save-new-company-btn');
    if (saveNewCompanyBtn) {
        saveNewCompanyBtn.addEventListener('click', () => {
            const newCompanyInput = document.getElementById('edit-company-new');
            const companySelect = document.getElementById('edit-company-select');
            
            if (newCompanyInput.value.trim()) {
                // Add the new company to the dropdown
                const option = document.createElement('option');
                option.value = newCompanyInput.value.trim();
                option.textContent = newCompanyInput.value.trim();
                companySelect.appendChild(option);
                
                // Select the new company
                companySelect.value = newCompanyInput.value.trim();
                
                // Hide the new company input
                document.getElementById('new-company-input').style.display = 'none';
                companySelect.disabled = false;
                newCompanyInput.value = '';
            }
        });
    }
    
    // Cancel new company button
    const cancelNewCompanyBtn = document.getElementById('cancel-new-company-btn');
    if (cancelNewCompanyBtn) {
        cancelNewCompanyBtn.addEventListener('click', () => {
            document.getElementById('new-company-input').style.display = 'none';
            document.getElementById('edit-company-select').disabled = false;
            document.getElementById('edit-company-new').value = '';
        });
    }
    
    // Add new language button
    const addNewLanguageBtn = document.getElementById('add-new-language-btn');
    if (addNewLanguageBtn) {
        addNewLanguageBtn.addEventListener('click', () => {
            const newLanguageInput = document.getElementById('edit-language-new');
            const languagesContainer = document.getElementById('edit-languages-container');
            
            if (newLanguageInput.value.trim()) {
                const language = newLanguageInput.value.trim();
                const languageId = `edit-lang-${language.toLowerCase().replace(/\s+/g, '-')}`;
                
                // Check if this language already exists
                if (!document.getElementById(languageId)) {
                    // Create a new language checkbox
                    const checkboxDiv = document.createElement('div');
                    checkboxDiv.className = 'form-check';
                    
                    const checkbox = document.createElement('input');
                    checkbox.className = 'form-check-input';
                    checkbox.type = 'checkbox';
                    checkbox.value = language;
                    checkbox.id = languageId;
                    checkbox.checked = true; // Check it by default since it's new
                    
                    const label = document.createElement('label');
                    label.className = 'form-check-label';
                    label.htmlFor = languageId;
                    label.textContent = language;
                    
                    checkboxDiv.appendChild(checkbox);
                    checkboxDiv.appendChild(label);
                    
                    languagesContainer.appendChild(checkboxDiv);
                } else {
                    // If it exists, just check it
                    document.getElementById(languageId).checked = true;
                }
                
                // Clear the input
                newLanguageInput.value = '';
            }
        });
    }
    
    // Save speaker button
    const saveSpeakerBtn = document.getElementById('save-speaker-btn');
    if (saveSpeakerBtn) {
        saveSpeakerBtn.addEventListener('click', saveSpeakerChanges);
    }
}

// Function to open the edit modal for a speaker
function editSpeaker(speakerId) {
    currentSpeakerIsNew = false;
    // Store the current speaker ID
    currentSpeakerId = speakerId;
    
    // Get the speaker data
    const speaker = getSpeakerById(speakerId);
    if (!speaker) {
        console.error(`Speaker with ID ${speakerId} not found.`);
        return;
    }
    
    // Update modal title to indicate editing
    const modalTitle = document.getElementById('speakerEditModalLabel');
    if (modalTitle) {
        modalTitle.textContent = 'Edit Speaker';
    }
    
    // Populate the form with speaker data
    populateEditForm(speaker);
    
    // Show the modal
    if (speakerEditModal) {
        speakerEditModal.show();
    }
}

// Function to create a new speaker
function createNewSpeaker() {
    // Check if user is in admin mode
    if (!isInAdminMode()) {
        console.error('Cannot create new speaker: Admin mode required');
        return;
    }
    
    // Generate a new unique ID
    const newId = generateNewSpeakerId();
    const newUniqueId = generateUniqueId();
    
    // Create a new speaker object with default values
    const newSpeaker = {
        id: newId,
        uniqueId: newUniqueId,
        name: '',
        emailadress: '',
        company: '',
        imageUrl: '',
        internal: false,
        external: false,
        languages: {},
        topics: '',
        bio: '',
        recent_presentations: '',
        context: ''
    };
    
    // Store the current speaker ID
    currentSpeakerId = newId;
    currentSpeakerIsNew = true; // Admin is creating a new speaker
    
    // Update modal title to indicate creating a new speaker
    const modalTitle = document.getElementById('speakerEditModalLabel');
    if (modalTitle) {
        modalTitle.textContent = 'Add New Speaker';
    }
    
    // Populate the form with the new speaker data
    populateEditForm(newSpeaker);
    
    // Show the modal
    if (speakerEditModal) {
        speakerEditModal.show();
    }
}

// Function to generate a new unique speaker ID
function generateNewSpeakerId() {
    const speakers = getAllSpeakers();
    
    // Find the highest ID number
    let highestId = 0;
    speakers.forEach(speaker => {
        // Extract the numeric part of the ID
        const idMatch = speaker.id.match(/\d+/);
        if (idMatch) {
            const idNum = parseInt(idMatch[0], 10);
            if (idNum > highestId) {
                highestId = idNum;
            }
        }
    });
    
    // Generate a new ID with the next number
    return `speaker${highestId + 1}`;
}

// Function to generate a unique ID for a new speaker
function generateUniqueId() {
    // Generate a 15-character unique ID
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let uniqueId = '';
    
    // Generate 15 random characters
    for (let i = 0; i < 15; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        uniqueId += characters.charAt(randomIndex);
    }
    
    return uniqueId;
}

// Function to populate the edit form with speaker data
async function populateEditForm(speaker) {
    // Set basic information
    document.getElementById('edit-speaker-id').value = speaker.id;
    document.getElementById('edit-name').value = speaker.name || '';
    document.getElementById('edit-email').value = speaker.emailadress || '';
    document.getElementById('edit-image-url').value = speaker.imageUrl || '';
    document.getElementById('edit-linkedin-url').value = speaker.linkedInURL || '';
    
    // Set company
    await populateCompanies(speaker.company);
    
    // Set availability
    document.getElementById('edit-internal').checked = speaker.internal || false;
    document.getElementById('edit-external').checked = speaker.external || false;
    
    // Set languages
    await populateLanguages(speaker.languages);
    
    // Set topics
    document.getElementById('edit-topics').value = speaker.topics || '';
    
    // Set bio
    document.getElementById('edit-bio').value = speaker.bio || '';
    
    // Set presentations
    document.getElementById('edit-presentations').value = speaker.recent_presentations || '';
    
    // Set context
    document.getElementById('edit-context').value = speaker.context || '';
}

// Function to populate the companies dropdown
async function populateCompanies(selectedCompany) {
    const companySelect = document.getElementById('edit-company-select');
    if (!companySelect) return;
    
    // Clear existing options except the first one
    while (companySelect.options.length > 1) {
        companySelect.remove(1);
    }
    
    // Get all companies
    const companies = getAllCompanies();
    
    // Add companies to the dropdown
    companies.forEach(company => {
        const option = document.createElement('option');
        option.value = company;
        option.textContent = company;
        companySelect.appendChild(option);
    });
    
    // Select the current company if it exists
    if (selectedCompany) {
        const existingOption = Array.from(companySelect.options).find(option => option.value === selectedCompany);
        if (existingOption) {
            companySelect.value = selectedCompany;
        } else {
            // If the company doesn't exist in the dropdown, add it
            const option = document.createElement('option');
            option.value = selectedCompany;
            option.textContent = selectedCompany;
            companySelect.appendChild(option);
            companySelect.value = selectedCompany;
        }
    }
}

// Function to populate the languages checkboxes
async function populateLanguages(speakerLanguages) {
    const languagesContainer = document.getElementById('edit-languages-container');
    if (!languagesContainer) return;
    
    // Clear existing checkboxes
    languagesContainer.innerHTML = '';
    
    // Get all languages
    const allLanguages = getAllLanguages();
    
    // Create checkboxes for each language
    allLanguages.forEach(language => {
        const languageId = `edit-lang-${language.toLowerCase().replace(/\s+/g, '-')}`;
        
        const checkboxDiv = document.createElement('div');
        checkboxDiv.className = 'form-check';
        
        const checkbox = document.createElement('input');
        checkbox.className = 'form-check-input';
        checkbox.type = 'checkbox';
        checkbox.value = language;
        checkbox.id = languageId;
        
        // Check the checkbox if the speaker has this language
        if (speakerLanguages && speakerLanguages[language] === true) {
            checkbox.checked = true;
        }
        
        const label = document.createElement('label');
        label.className = 'form-check-label';
        label.htmlFor = languageId;
        label.textContent = language;
        
        checkboxDiv.appendChild(checkbox);
        checkboxDiv.appendChild(label);
        languagesContainer.appendChild(checkboxDiv);
    });
}

// Function to save speaker changes
async function saveSpeakerChanges() {
    const currentUserName = getUserName(); // Get current user's name for context
    const adminModeActive = isInAdminMode();

    // Collect data from the form
    const updatedSpeakerData = {
        id: currentSpeakerId, // This will be null if currentSpeakerIsNew (for self-add) or the generated ID for admin-new
        name: document.getElementById('edit-name').value,
        emailadress: document.getElementById('edit-email').value,
        company: document.getElementById('edit-company-select').value,
        imageUrl: document.getElementById('edit-image-url').value,
        internal: document.getElementById('edit-internal').checked,
        external: document.getElementById('edit-external').checked,
        languages: {},
        topics: document.getElementById('edit-topics').value,
        bio: document.getElementById('edit-bio').value,
        recent_presentations: document.getElementById('edit-presentations').value,
        context: document.getElementById('edit-context').value,
        // uniqueId will be handled by dataService for new self-speaker, or already set for existing/admin-new
    };

    // If it's an existing speaker, retain their uniqueId
    if (!currentSpeakerIsNew && currentSpeakerId) {
        const existingSpeaker = getSpeakerById(currentSpeakerId);
        if (existingSpeaker) {
            updatedSpeakerData.uniqueId = existingSpeaker.uniqueId;
        }
    }
    // If it's an admin creating a new speaker, uniqueId was generated by createNewSpeaker and set in populateEditForm
    // If it's a user adding themselves, uniqueId will be set by addNewSpeakerProfile in dataService


    // Collect selected languages
    const languageCheckboxes = document.querySelectorAll('#edit-languages-container .form-check-input');
    languageCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
            updatedSpeakerData.languages[checkbox.value] = true;
        }
    });

    let savePromise;

    if (currentSpeakerIsNew && !adminModeActive) {
        // Scenario: Logged-in user is adding themselves as a new speaker
        console.log('Saving new self-speaker profile:', updatedSpeakerData.name);
        // id and uniqueId will be generated by addNewSpeakerProfile
        // We pass the collected form data; name is already set from pre-fill.
        updatedSpeakerData.id = null; // Explicitly null for addNewSpeakerProfile to generate
        updatedSpeakerData.uniqueId = null;
        savePromise = addNewSpeakerProfile(updatedSpeakerData);
    } else if (adminModeActive) {
        // Scenario: Admin is active
        if (currentSpeakerIsNew) {
            // Admin created a new speaker profile from scratch using createNewSpeaker()
            // ID and uniqueId were generated by createNewSpeaker and are in currentSpeakerId
            updatedSpeakerData.id = currentSpeakerId; 
            const tempSpeakerForUniqueId = getSpeakerById(currentSpeakerId); // tempSpeakerForUniqueId might be null if not yet in global speakerData
            // This case needs careful handling: createNewSpeaker adds a shell to speakerData, or updateSpeaker needs to handle adding if not found.
            // For now, assume createNewSpeaker's generated ID is what we use.
            // It's better if createNewSpeaker adds a placeholder to speakerData, then updateSpeaker updates it.
            // Or, have an adminAddNewSpeaker function in dataService.
            // Let's simplify: updateSpeaker should be able to handle adding if ID is new for admin.
            // For now, we'll rely on the ID being set if currentSpeakerIsNew was true from createNewSpeaker()
            console.log('Admin saving newly created speaker profile:', updatedSpeakerData.name, 'ID:', updatedSpeakerData.id);
            savePromise = updateSpeaker(updatedSpeakerData); // dataService.updateSpeaker handles in-memory update and dispatches event
        } else {
            // Admin is editing an existing speaker profile
            console.log('Admin updating existing speaker profile:', updatedSpeakerData.name, 'ID:', updatedSpeakerData.id);
            savePromise = updateSpeaker(updatedSpeakerData); // dataService.updateSpeaker handles in-memory update and dispatches event
        }
    } else {
        // Scenario: Logged-in user is editing their own existing profile (not admin mode)
        console.log('User updating their own existing profile:', updatedSpeakerData.name, 'ID:', updatedSpeakerData.id);
        savePromise = updateMySpeakerProfile(updatedSpeakerData);
    }

    try {
        const result = await savePromise;
        if (result && result.success) {
            speakerEditModal.hide();
            if (currentSpeakerIsNew && !adminModeActive) {
                // Specific message for self-added new speaker
                alert('Your speaker profile has been successfully saved! It will be processed into the main speaker pool shortly.  Note: This process may take a few days. In the meantime you will not yet be able to see your own profile - nor will others be able to see it.');
                console.log('New self-speaker profile saved successfully:', result.message);
            } else {
                // Generic success for other cases (admin updates, self-updates of existing profile)
                console.log('Save operation successful:', result.message || 'Profile saved.');
                // Optionally, show a generic alert for other successful saves if desired:
                // alert('Speaker profile updated successfully!'); 
            }
            // UI updates (like refreshing lists or buttons) are handled by event listeners
        } else {
            console.error('Save operation failed:', result ? result.message : 'No result or success flag.');
            alert(`Failed to save speaker profile: ${result ? result.message : 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error saving speaker changes:', error);
        alert(`Error saving speaker profile: ${error.message || 'An unexpected error occurred.'}`);
    }
    currentSpeakerIsNew = false; // Reset flag after save attempt
}


function openForNewSelfSpeaker() {
    const currentUserName = getUserName();
    const currentUserEmail = getUserEmailFromToken();

    if (!currentUserName) {
        alert('Cannot add new speaker profile: User information not available. Please sign in again.');
        console.error('openForNewSelfSpeaker: currentUserName is null.');
        return;
    }
    currentSpeakerIsNew = true;
    currentSpeakerId = null; // No ID yet for a new speaker being added by self

    const newSelfSpeakerObject = {
        id: null, // Will be generated by dataService on save
        uniqueId: null, // Will be generated by dataService on save
        name: currentUserName, // Pre-fill with the name claim
        emailadress: currentUserEmail || '', // Pre-fill with preferred_username, fallback to empty
        company: '',
        imageUrl: '',
        internal: false,
        external: false,
        languages: {},
        topics: '',
        bio: '',
        recent_presentations: '',
        context: '',
        // createdDate and lastModified will be set by dataService
    };

    const modalTitle = document.getElementById('speakerEditModalLabel');
    if (modalTitle) {
        modalTitle.textContent = 'Add Your Speaker Profile';
    }

    populateEditForm(newSelfSpeakerObject);

    if (speakerEditModal) {
        speakerEditModal.show();
    }
}

export { initializeSpeakerEdit, editSpeaker, createNewSpeaker, openForNewSelfSpeaker };
