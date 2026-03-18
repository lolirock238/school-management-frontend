// ===== AUTHENTICATION UTILITIES =====

// Check if user is logged in
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || 'null');

// Redirect if not logged in - but allow access to login page
const currentPath = window.location.pathname;
const isLoginPage = currentPath.includes('index.html') || currentPath === '/' || currentPath.endsWith('/');

if (!token || !user) {
    // Allow access to login page only
    if (!isLoginPage) {
        window.location.href = 'index.html';
    }
}

// ===== LOGIN FORM HANDLER =====
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    
    // Validate inputs
    if (!username || !password || !role) {
        document.getElementById('login-error').textContent = 'Please fill in all fields';
        return;
    }
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Logging in...';
    submitBtn.disabled = true;
    
    try {
        // Call login API from api.js
        const result = await login(username, password, role);
        
        // Store auth data
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        
        // Redirect based on role to the HTML files in their respective folders
        switch(role) {
            case 'admin':
                window.location.href = 'admin/admin.html';
                break;
            case 'teacher':
                window.location.href = 'teacher/teacher.html';
                break;
            case 'student':
                window.location.href = 'student/student.html';
                break;
            case 'parent':
                window.location.href = 'parent/parent.html';
                break;
            default:
                window.location.href = 'index.html';
        }
        
    } catch (error) {
        document.getElementById('login-error').textContent = 'Invalid credentials. Please try again.';
        console.error('Login error:', error);
    } finally {
        // Restore button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// ===== LOGOUT FUNCTION =====
function logout() {
    // Clear all auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect to login page
    window.location.href = '../index.html';
}

// ===== GET CURRENT USER =====
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// ===== GET AUTH TOKEN =====
function getToken() {
    return localStorage.getItem('token');
}

// ===== CHECK IF USER IS AUTHENTICATED =====
function isAuthenticated() {
    return !!getToken() && !!getCurrentUser();
}

// ===== CHECK IF USER HAS SPECIFIC ROLE =====
function hasRole(role) {
    const user = getCurrentUser();
    return user && user.role && user.role.toLowerCase() === role.toLowerCase();
}

// ===== UPDATE USER NAME IN NAVBAR =====
function updateUserName() {
    const user = getCurrentUser();
    const userNameElement = document.getElementById('user-name');
    if (userNameElement && user) {
        userNameElement.textContent = user.name || user.username || 'User';
    }
}

// ===== REDIRECT TO APPROPRIATE DASHBOARD =====
function redirectToDashboard() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = '../index.html';
        return;
    }
    
    const role = user.role.toLowerCase();
    
    switch(role) {
        case 'admin':
            window.location.href = 'admin.html';
            break;
        case 'teacher':
            window.location.href = 'teacher.html';
            break;
        case 'student':
            window.location.href = 'student.html';
            break;
        case 'parent':
            window.location.href = 'parent.html';
            break;
        default:
            window.location.href = '../index.html';
    }
}

// ===== PROTECT PAGE - REDIRECT TO LOGIN IF NOT AUTHENTICATED =====
function protectPage() {
    if (!isAuthenticated()) {
        window.location.href = '../index.html';
        return false;
    }
    
    // Check if user has access to this page based on role
    const path = window.location.pathname;
    const user = getCurrentUser();
    
    if (user) {
        const role = user.role.toLowerCase();
        
        // Allow access if the path contains the correct role folder
        if (path.includes(`/${role}/`)) {
            return true;
        }
        
        // If user is in wrong section, redirect to their correct dashboard
        redirectToDashboard();
        return false;
    }
    
    return true;
}

// ===== CHECK PAGE ACCESS ON LOAD =====
document.addEventListener('DOMContentLoaded', () => {
    // Update user name in navbar if element exists
    updateUserName();
    
    // Check if we're on a dashboard page (not login)
    const path = window.location.pathname;
    if (!path.includes('index.html') && path !== '/' && !path.endsWith('/')) {
        protectPage();
    }
    
    // Add logout event listener to any logout buttons
    document.querySelectorAll('.btn-logout').forEach(btn => {
        btn.addEventListener('click', logout);
    });
});

// ===== EXPORT FUNCTIONS FOR GLOBAL USE =====
window.getCurrentUser = getCurrentUser;
window.getToken = getToken;
window.isAuthenticated = isAuthenticated;
window.hasRole = hasRole;
window.logout = logout;
window.redirectToDashboard = redirectToDashboard;