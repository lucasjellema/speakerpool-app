import { msalConfig, loginRequest, tokenRequest } from './authConfig.js';

// Create the main msalInstance instance
// configuration parameters are located at authConfig.js
export const msalInstance = new msal.PublicClientApplication(msalConfig);

// Add event listener for successful login
msalInstance.addEventCallback((message) => {
    console.log('MSAL Event:', message.eventType);
    
    if (message.eventType === 'msal:loginSuccess' || message.eventType === 'msal:acquireTokenSuccess'   ) {
        console.log('Login successful:', message);
        // You can dispatch a custom event or call a function here
        const event = new CustomEvent('msalLoginSuccess', { detail: message });
        window.dispatchEvent(event);
        
        // Update UI if needed
        if (message.account) {
            showWelcomeMessage(message.account.username);
        }
    }
});

let username = "";

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

function selectAccount() {

    /**
     * See here for more info on account retrieval: 
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-common/docs/Accounts.md
     */

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

    /**
     * To see the full list of response object properties, visit:
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/request-response-object.md#response
     */

    if (response !== null) {
        username = response.account.username;
        showWelcomeMessage(username);
        getToken();
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

export function getTokenPopup(request) {

    /**
     * See here for more info on account retrieval: 
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-common/docs/Accounts.md
     */
    request.account = msalInstance.getAccountByUsername(username);
    
    return msalInstance.acquireTokenSilent(request)
        .catch(error => {
            console.warn("silent token acquisition fails. acquiring token using popup");
            if (error instanceof msal.InteractionRequiredAuthError) {
                // fallback to interaction when silent call fails
                return msalInstance.acquireTokenPopup(request)
                    .then(tokenResponse => {
                        console.log(tokenResponse);
                        return tokenResponse;
                    }).catch(error => {
                        console.error(error);
                    });
            } else {
                console.warn(error);   
            }
    });
}


const endpoint = "https://odzno3g32mjesdrjipad23mbxq.apigateway.eu-amsterdam-1.oci.customer-oci.com/conclusion-api/speakerpool-data";
export function getToken() {
    getTokenPopup(loginRequest)
        .then(response => {
            getDataWithToken(endpoint, response.accessToken,handleData);
        }).catch(error => {
            console.error(error);
        });
}

const handleData = (data, endpoint) => {
    console.log('Handle Data at: ' + new Date().toString());
    console.log('data',data)
    console.log('endpoint',endpoint)
}

function getDataWithToken(endpoint, token, callback) {
    const headers = new Headers();
    const bearer = `Bearer ${token}`;

    headers.append("Authorization", bearer);

    const options = {
        method: "GET",
        headers: headers
    };

    console.log('request made to API at: ' + new Date().toString());
    console.log('token',token)

    fetch(endpoint, options)
        .then(response => response.json())
        .then(response => callback(response, endpoint))
        .catch(error => console.log(error));
}

selectAccount();
