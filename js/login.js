let selectedUserType = 'farmer';

function selectUserType(type) {
    selectedUserType = type;
    
    // Remove active class from all selectors
    const farmerSelector = document.getElementById('farmerSelector');
    const consumerSelector = document.getElementById('consumerSelector');
    
    if (farmerSelector) farmerSelector.classList.remove('active');
    if (consumerSelector) consumerSelector.classList.remove('active');
    
    // Add active class to selected selector
    const selectedSelector = document.getElementById(type + 'Selector');
    if (selectedSelector) {
        selectedSelector.classList.add('active');
    }
    
    console.log('Selected user type:', selectedUserType);
}

function togglePassword() {
    const passwordInput = document.getElementById('password');
    const passwordToggle = document.getElementById('passwordToggle');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        passwordToggle.classList.remove('fa-eye');
        passwordToggle.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        passwordToggle.classList.remove('fa-eye-slash');
        passwordToggle.classList.add('fa-eye');
    }
}

async function handleLogin(event) {
    event.preventDefault();
    console.log('Login form submitted');
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    console.log('Form data:', { email, password, userType: selectedUserType });
    
    // Validate inputs
    if (!email.trim()) {
        showNotification('Please enter your email address', 'error');
        return;
    }
    
    if (!password.trim()) {
        showNotification('Please enter your password', 'error');
        return;
    }
    
    // Show loading state
    const loginBtn = document.querySelector('button[type="submit"]');
    const originalText = loginBtn.textContent;
    loginBtn.textContent = 'Signing In...';
    loginBtn.disabled = true;
    
    try {
        // Make API call to login
        const response = await fetch('http://localhost:5500/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email.trim(),
                password: password,
                userType: selectedUserType
            })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            // Store token and user data
            localStorage.setItem('authToken', result.data.token);
            localStorage.setItem('userData', JSON.stringify(result.data.user));
            
            if (rememberMe) {
                localStorage.setItem('rememberMe', 'true');
            }
            
            showNotification(`Welcome back, ${result.data.user.firstName}!`, 'success');
            
            // Redirect based on user type after a short delay
            setTimeout(() => {
                if (selectedUserType === 'farmer') {
                    window.location.href = 'farmer-dashboard.html';
                } else {
                    window.location.href = 'consumer-dashboard.html';
                }
            }, 1500);
            
        } else {
            // Handle login errors
            const errorMessage = result.message || 'Login failed. Please check your credentials.';
            showNotification(errorMessage, 'error');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Network error. Please check your connection and try again.', 'error');
    } finally {
        // Reset button state
        loginBtn.textContent = originalText;
        loginBtn.disabled = false;
    }
}

async function forgotPassword() {
    const email = document.getElementById('email').value;
    
    if (!email.trim()) {
        showNotification('Please enter your email address first', 'error');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:5500/api/auth/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email.trim() })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            showNotification('Password reset link sent to your email', 'success');
        } else {
            showNotification(result.message || 'Failed to send reset link', 'error');
        }
        
    } catch (error) {
        console.error('Forgot password error:', error);
        showNotification('Network error. Please try again later.', 'error');
    }
}

function socialLogin(provider) {
    showNotification(`Signing in with ${provider}... (This feature is coming soon)`, 'info');
}

// Notification function
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    // Set background color based on type
    switch(type) {
        case 'success':
            notification.style.backgroundColor = '#4CAF50';
            break;
        case 'error':
            notification.style.backgroundColor = '#f44336';
            break;
        case 'warning':
            notification.style.backgroundColor = '#ff9800';
            break;
        default:
            notification.style.backgroundColor = '#2196F3';
    }
    
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize farmer as default selection
    selectUserType('farmer');
    
    // Add event listeners for user type selection
    const farmerSelector = document.getElementById('farmerSelector');
    const consumerSelector = document.getElementById('consumerSelector');
    
    if (farmerSelector) {
        farmerSelector.addEventListener('click', () => selectUserType('farmer'));
    }
    
    if (consumerSelector) {
        consumerSelector.addEventListener('click', () => selectUserType('consumer'));
    }
    
    // Add event listener for password toggle
    const togglePasswordBtn = document.getElementById('togglePasswordBtn');
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', togglePassword);
    }
    
    // Add event listener for form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Check if user is already logged in
    const authToken = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (authToken && userData) {
        try {
            const user = JSON.parse(userData);
            showNotification(`Welcome back, ${user.firstName}!`, 'success');
            
            // Redirect to appropriate dashboard
            setTimeout(() => {
                if (user.userType === 'farmer') {
                    window.location.href = 'farmer-dashboard.html';
                } else {
                    window.location.href = 'consumer-dashboard.html';
                }
            }, 1000);
        } catch (error) {
            console.error('Error parsing user data:', error);
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
        }
    }
}); 