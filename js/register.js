let selectedUserType = 'farmer';
let currentStep = 1;

function selectUserType(type) {
    console.log('User type selected:', type);
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

function nextStep() {
    console.log('nextStep called, currentStep:', currentStep);
    
    if (currentStep === 1) {
        // Validate step 1
        if (!selectedUserType) {
            alert('Please select whether you are a farmer or consumer');
            return;
        }
        console.log('Step 1 validation passed');
    } else if (currentStep === 2) {
        // Validate step 2
        const form = document.getElementById('basicInfoForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        console.log('Step 2 validation passed');
    }

    // Hide current step
    const currentStepElement = document.getElementById(`step${currentStep}Content`);
    if (currentStepElement) {
        currentStepElement.style.display = 'none';
    }
    
    // Show next step
    currentStep++;
    const nextStepElement = document.getElementById(`step${currentStep}Content`);
    if (nextStepElement) {
        nextStepElement.style.display = 'block';
    }
    
    // Update step indicators
    updateStepIndicators();
    
    // Show/hide farmer fields
    if (currentStep === 3) {
        const farmerFields = document.getElementById('farmerFields');
        if (farmerFields) {
            if (selectedUserType === 'farmer') {
                farmerFields.style.display = 'block';
            } else {
                farmerFields.style.display = 'none';
            }
        }
    }
    
    console.log('Moved to step:', currentStep);
}

function prevStep() {
    // Hide current step
    document.getElementById(`step${currentStep}Content`).style.display = 'none';
    
    // Show previous step
    currentStep--;
    document.getElementById(`step${currentStep}Content`).style.display = 'block';
    
    // Update step indicators
    updateStepIndicators();
}

function updateStepIndicators() {
    for (let i = 1; i <= 3; i++) {
        const step = document.getElementById(`step${i}`);
        step.classList.remove('active', 'completed');
        
        if (i < currentStep) {
            step.classList.add('completed');
        } else if (i === currentStep) {
            step.classList.add('active');
        }
    }
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

function toggleConfirmPassword() {
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const confirmPasswordToggle = document.getElementById('confirmPasswordToggle');
    
    if (confirmPasswordInput.type === 'password') {
        confirmPasswordInput.type = 'text';
        confirmPasswordToggle.classList.remove('fa-eye');
        confirmPasswordToggle.classList.add('fa-eye-slash');
    } else {
        confirmPasswordInput.type = 'password';
        confirmPasswordToggle.classList.remove('fa-eye-slash');
        confirmPasswordToggle.classList.add('fa-eye');
    }
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
    
    // Add event listeners for navigation buttons
    const continueBtn = document.getElementById('continueBtn');
    const nextBtn = document.getElementById('nextBtn');
    const backBtn = document.getElementById('backBtn');
    const backBtnFinal = document.getElementById('backBtnFinal');
    
    if (continueBtn) {
        continueBtn.addEventListener('click', nextStep);
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', nextStep);
    }
    
    if (backBtn) {
        backBtn.addEventListener('click', prevStep);
    }
    
    if (backBtnFinal) {
        backBtnFinal.addEventListener('click', prevStep);
    }
    
    // Add event listeners for password toggle buttons
    const togglePasswordBtn = document.getElementById('togglePasswordBtn');
    const toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPasswordBtn');
    
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', togglePassword);
    }
    
    if (toggleConfirmPasswordBtn) {
        toggleConfirmPasswordBtn.addEventListener('click', toggleConfirmPassword);
    }
    
    // Handle form submission
    const accountSetupForm = document.getElementById('accountSetupForm');
    if (accountSetupForm) {
        accountSetupForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (password !== confirmPassword) {
                showNotification('Passwords do not match!', 'error');
                return;
            }
            
            // Show loading state
            const submitBtn = accountSetupForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Creating Account...';
            submitBtn.disabled = true;
            
            try {
                // Collect all form data
                const formData = {
                    userType: selectedUserType,
                    firstName: document.getElementById('firstName').value,
                    lastName: document.getElementById('lastName').value,
                    email: document.getElementById('email').value,
                    phone: document.getElementById('phone').value,
                    location: {
                        city: document.getElementById('location').value.split(',')[0]?.trim() || document.getElementById('location').value,
                        state: document.getElementById('location').value.split(',')[1]?.trim() || 'Maharashtra',
                        pincode: '400001' // Default pincode, you might want to add a field for this
                    },
                    password: password
                };
                
                if (selectedUserType === 'farmer') {
                    formData.farmName = document.getElementById('farmName').value;
                    formData.farmSize = parseFloat(document.getElementById('farmSize').value);
                    formData.crops = document.getElementById('crops').value.split(',').map(crop => crop.trim()).filter(crop => crop);
                }
                
                // Make API call to register user
                const response = await fetch('http://localhost:5500/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();
                
                if (response.ok && result.success) {
                    // Store token in localStorage
                    localStorage.setItem('authToken', result.data.token);
                    localStorage.setItem('userData', JSON.stringify(result.data.user));
                    
                    showNotification(`Account created successfully! Welcome to AgriConnect as a ${selectedUserType}.`, 'success');
                    
                    // Redirect based on user type after a short delay
                    setTimeout(() => {
                        if (selectedUserType === 'farmer') {
                            window.location.href = 'farmer-dashboard.html';
                        } else {
                            window.location.href = 'consumer-dashboard.html';
                        }
                    }, 2000);
                    
                } else {
                    // Handle API errors
                    const errorMessage = result.message || 'Registration failed. Please try again.';
                    showNotification(errorMessage, 'error');
                    
                    // If it's a validation error, show specific field errors
                    if (result.errors && Array.isArray(result.errors)) {
                        result.errors.forEach(error => {
                            console.error(`Field: ${error.path}, Message: ${error.msg}`);
                        });
                    }
                }
                
            } catch (error) {
                console.error('Registration error:', error);
                showNotification('Network error. Please check your connection and try again.', 'error');
            } finally {
                // Reset button state
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
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
}); 