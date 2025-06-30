/**
 * Privacy link handler module
 * Sets up the privacy statement link to point to the correct URL from dataService.js
 */

import { privacyStatementEndpoint } from '../dataService.js';

/**
 * Initialize the privacy statement link with the correct URL
 */
export function initializePrivacyLink() {
    // Get the privacy link element
    const privacyLink = document.getElementById('privacy-link');
    
    // If the link exists, set its href attribute to the privacy statement endpoint
    if (privacyLink) {
        privacyLink.href = privacyStatementEndpoint;
        console.log('Privacy statement link initialized with URL:', privacyStatementEndpoint);
    } else {
        console.warn('Privacy statement link element not found');
    }
}
