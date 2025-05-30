// Speaker Edit Module
import { 
    getSpeakerById, 
    updateSpeaker, 
    getAllCompanies, 
    getAllLanguages,
    getAllSpeakers,
    isInAdminMode
} from '../dataService.js';

// Variable to store the modal instance
let speakerEditModal = null;
let currentSpeakerId = null;

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
function saveSpeakerChanges() {
    // Check if we're editing an existing speaker or creating a new one
    const speaker = getSpeakerById(currentSpeakerId);
    let updatedSpeaker;
    
    if (speaker) {
        // Editing an existing speaker - create a copy of the speaker object to update
        updatedSpeaker = { ...speaker };
    } else {
        // Creating a new speaker
        updatedSpeaker = {
            id: currentSpeakerId,
            uniqueId: generateUniqueId()
        };
    }
    
    
    // Update basic information
    updatedSpeaker.name = document.getElementById('edit-name').value;
    updatedSpeaker.emailadress = document.getElementById('edit-email').value;
    updatedSpeaker.imageUrl = document.getElementById('edit-image-url').value;
    updatedSpeaker.linkedInURL = document.getElementById('edit-linkedin-url').value; // Get LinkedIn URL
    
    // Update company
    const companySelect = document.getElementById('edit-company-select');
    if (companySelect.disabled) {
        // If the select is disabled, we're adding a new company
        updatedSpeaker.company = document.getElementById('edit-company-new').value.trim();
    } else {
        updatedSpeaker.company = companySelect.value;
    }
    
    // Update availability
    updatedSpeaker.internal = document.getElementById('edit-internal').checked;
    updatedSpeaker.external = document.getElementById('edit-external').checked;
    
    // Update languages
    const languageCheckboxes = document.querySelectorAll('#edit-languages-container input[type="checkbox"]');
    updatedSpeaker.languages = {};
    
    languageCheckboxes.forEach(checkbox => {
        updatedSpeaker.languages[checkbox.value] = checkbox.checked;
    });
    
    // Update topics
    updatedSpeaker.topics = document.getElementById('edit-topics').value;
    
    // Update bio
    updatedSpeaker.bio = document.getElementById('edit-bio').value;
    
    // Update presentations
    updatedSpeaker.recent_presentations = document.getElementById('edit-presentations').value;
    
    // Update context
    updatedSpeaker.context = document.getElementById('edit-context').value;
    
    // Save the updated speaker
    const success = updateSpeaker(updatedSpeaker);
    
    if (success) {
        // Hide the modal
        speakerEditModal.hide();
        
        // Show success message
        alert('Speaker updated successfully!');
    } else {
        alert('Failed to update speaker. Please try again.');
    }
}

export { initializeSpeakerEdit, editSpeaker, createNewSpeaker };
