import { msalConfig, loginRequest } from './authConfig.js';

// Create the main msalInstance instance
// configuration parameters are located at authConfig.js
export const msalInstance = new msal.PublicClientApplication(msalConfig);
let idToken
let idTokenClaims
let username = "";

// Add event listener for successful login
msalInstance.addEventCallback((message) => {
    console.log('MSAL Event:', message.eventType);
    
    if (message.eventType === 'msal:loginSuccess' || message.eventType === 'msal:acquireTokenSuccess'   ) {
        console.log('Login successful:', message);
        idToken = message.payload.idToken;
        idTokenClaims = message.payload.idTokenClaims;
        // This custom event that signals successful login is consumed in main.js and is used for updating the UI with user details
        // and loading the protected JSON document with data
        const event = new CustomEvent('msalLoginSuccess', { detail: message });
        window.dispatchEvent(event);
        // Update UI if needed
        if (message.account) {
            showWelcomeMessage(message.account.username);
        }
    }
});

function selectAccount() {
    const currentAccounts = msalInstance.getAllAccounts();
    if (currentAccounts.length === 0) {
        return;
    } else if (currentAccounts.length > 1) {
        // Add choose account code here
        console.warn("Multiple accounts detected.");
    } else if (currentAccounts.length === 1) {
        username = currentAccounts[0].username;
        showWelcomeMessage(username);
    }
}

function handleResponse(response) {
    if (response !== null) {
        username = response.account.username;
        showWelcomeMessage(username);
    } else {
        selectAccount();
    }
}

export function signIn() {

    /**
     * You can pass a custom request object below. This will override the initial configuration. For more information, visit:
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/request-response-object.md#request
     */

    msalInstance.loginPopup(loginRequest)
        .then(handleResponse)
        .catch(error => {
            console.error(error);
        });
}

export function signOut() {

    /**
     * You can pass a custom request object below. This will override the initial configuration. For more information, visit:
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/request-response-object.md#request
     */

    const logoutRequest = {
        account: msalInstance.getAccountByUsername(username),
        postLogoutRedirectUri: msalConfig.auth.redirectUri,
        mainWindowRedirectUri: msalConfig.auth.redirectUri
    };

    msalInstance.logoutPopup(logoutRequest);
}

/**
 * Displays account details in the console
 * @param {string} username - The username of the logged-in account
 */
function showWelcomeMessage(username) {
    const accounts = msalInstance.getAllAccounts();
    const account = accounts.find(acc => acc.username === username);
    
    if (account) {
        console.group('Account Details');
        console.log('👤 Username:', account.username);
        console.log('🏠 Home Account ID:', account.homeAccountId);
        console.log('🏢 Tenant ID:', account.tenantId);
        console.log('🔐 Local Account ID:', account.localAccountId);
        
        // Log additional claims if available
        if (account.idTokenClaims) {
            console.group('ID Token Claims');
            Object.entries(account.idTokenClaims).forEach(([key, value]) => {
                // Skip standard claims that are already logged
                if (!['iss', 'sub', 'aud', 'exp', 'iat', 'nbf', 'aio'].includes(key)) {
                    console.log(`🔹 ${key}:`, value);
                }
            });
            console.groupEnd();
        }
        
        console.log('🔑 Scopes:', loginRequest.scopes);
        console.groupEnd();
    } else {
        console.warn('No account found for username:', username);
    }
}




const endpoint = "https://odzno3g32mjesdrjipad23mbxq.apigateway.eu-amsterdam-1.oci.customer-oci.com/conclusion-proxy/speakerpool-data";


export async function getDataWithToken(endpoint) {
    try {
        if (!idToken) {
            console.error('No ID token available. User might not be authenticated.');
            throw new Error('Authentication required. Please sign in.');
        }

        const options = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${idToken}`
            }
        };

        console.log('Request options:', JSON.stringify(options, null, 2));
        
        // Log the actual request being made
        console.log('Making request to:', endpoint);
        
        const response = await fetch(endpoint, options);
        
        // Log response details for debugging
        console.log('Response status:', response.status, response.statusText);
        
        // Check for 401 Unauthorized
        if (response.status === 401) {
            console.error('Authentication failed. Token might be invalid or expired.');
            // You might want to trigger a token refresh or re-authentication here
        }
        
        return response;
    } catch (error) {
        console.error('Error in getDataWithToken:', error);
        throw error; // Re-throw to allow calling code to handle the error
    }
}

selectAccount();
