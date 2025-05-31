import { signIn, signOut, msalInstance  } from './authPopup.js';

// Track UI state to prevent multiple clicks
let isUIBusy = false;

// Function to update the UI based on authentication state
export async function updateAuthUI() {
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');
    const userInfo = document.getElementById('user-info');
    const usernameSpan = document.getElementById('username');
    const loginSection = document.getElementById('login-section');

    if (!loginButton || !logoutButton || !userInfo || !usernameSpan || !loginSection) {
        console.warn('Auth UI elements not found');
        return;
    }

    try {
        // Make sure msalInstance is initialized
        if (!msalInstance) {
            console.warn('MSAL instance not initialized yet');
            return;
        }
        
        const accounts = msalInstance.getAllAccounts();
        const account = accounts.length > 0 ? accounts[0] : null;
        const isLoggedIn = !!account;

        if (isLoggedIn) {
            // User is logged in
            loginButton.classList.add('d-none');
            userInfo.classList.remove('d-none');
            usernameSpan.textContent = account.name || account.username || 'User';
            loginSection.classList.remove('d-none');
        } else {
            // User is not logged in
            loginButton.classList.remove('d-none');
            userInfo.classList.add('d-none');
            loginSection.classList.remove('d-none');
        }
    } catch (error) {
        console.error('Error updating auth UI:', error);
    }
}

    // Handle login
   export async function handleLogin() {
        try {
            // This will redirect to Microsoft login
            await signIn();
            updateAuthUI();
        } catch (error) {
            console.error('Login failed:', error);
            // Show error to user
            const errorMessage = error.errorMessage || 'Failed to sign in. Please try again.';
            alert(`Error: ${errorMessage}`);
        } finally {
            isUIBusy = false;
        }
    }


export function setupAuthUI() {
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');

    if (!loginButton || !logoutButton) {
        console.warn('Login/Logout buttons not found');
        return { updateUI: () => {} };
    }

    // Show loading state
    function setLoading(isLoading) {
        if (isLoading) {
            loginButton.disabled = true;
            loginButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
        } else {
            loginButton.disabled = false;
            loginButton.textContent = 'Sign In';
        }
    }


    // Handle logout
    async function handleLogout() {
        if (isUIBusy) return;
        isUIBusy = true;

        try {
            await signOut();
            // Reload the page to reset the application state
            window.location.href = window.location.origin;
        } catch (error) {
            console.error('Logout failed:', error);
            alert('Failed to sign out. Please try again.');
        } finally {
            isUIBusy = false;
        }
    }

    // Add event listeners
    loginButton.addEventListener('click', handleLogin);
    logoutButton.addEventListener('click', handleLogout);

    // Initial UI update
    updateAuthUI();

    // Also update UI when the account changes
    const callbackId = msalInstance.addEventCallback((message) => {
        if (message.eventType === 'loginSuccess' || message.eventType === 'logoutSuccess') {
            updateAuthUI();
        }
    });

    // Clean up event listener when needed
    const cleanup = () => {
        if (callbackId) {
            msalInstance.removeEventCallback(callbackId);
        }
    };

    // Export the update function and cleanup
    return { 
        updateUI: updateAuthUI,
        cleanup
    };
}
