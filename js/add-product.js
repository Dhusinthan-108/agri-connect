// Check if user is logged in
document.addEventListener('DOMContentLoaded', function() {
    const authToken = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (!authToken || !userData) {
        showNotification('Please login to add products', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }
    
    try {
        const user = JSON.parse(userData);
        if (user.userType !== 'farmer') {
            showNotification('Only farmers can add products', 'error');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return;
        }
    } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.href = 'login.html';
        return;
    }
    
    initializeForm();
});

let selectedImages = [];

function initializeForm() {
    // Image upload functionality
    const uploadArea = document.getElementById('uploadArea');
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');
    
    // Click to upload
    uploadArea.addEventListener('click', () => {
        imageInput.click();
    });
    
    // Drag and drop functionality
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        handleImageFiles(files);
    });
    
    // File input change
    imageInput.addEventListener('change', (e) => {
        handleImageFiles(e.target.files);
    });
    
    // Form submission
    const form = document.getElementById('addProductForm');
    form.addEventListener('submit', handleFormSubmission);
}

function handleImageFiles(files) {
    const imagePreview = document.getElementById('imagePreview');
    
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageData = e.target.result;
                selectedImages.push(imageData);
                displayImagePreview(imageData);
            };
            reader.readAsDataURL(file);
        }
    });
}

function displayImagePreview(imageData) {
    const imagePreview = document.getElementById('imagePreview');
    
    const previewContainer = document.createElement('div');
    previewContainer.className = 'd-inline-block me-3 mb-3 position-relative';
    
    const img = document.createElement('img');
    img.src = imageData;
    img.className = 'image-preview';
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn btn-sm btn-danger position-absolute top-0 end-0';
    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
    removeBtn.onclick = function() {
        const index = selectedImages.indexOf(imageData);
        if (index > -1) {
            selectedImages.splice(index, 1);
        }
        previewContainer.remove();
    };
    
    previewContainer.appendChild(img);
    previewContainer.appendChild(removeBtn);
    imagePreview.appendChild(previewContainer);
}

async function handleFormSubmission(event) {
    event.preventDefault();
    
    // Get form data
    const formData = {
        name: document.getElementById('productName').value.trim(),
        description: document.getElementById('description').value.trim(),
        category: document.getElementById('category').value,
        price: parseFloat(document.getElementById('price').value),
        unit: document.getElementById('unit').value,
        inventory: parseInt(document.getElementById('inventory').value),
        isOrganic: document.getElementById('isOrganic').checked,
        isAvailable: document.getElementById('isAvailable').checked,
        images: selectedImages,
        tags: document.getElementById('tags').value.split(',').map(tag => tag.trim()).filter(tag => tag)
    };
    
    // Add optional dates
    const harvestDate = document.getElementById('harvestDate').value;
    const expiryDate = document.getElementById('expiryDate').value;
    
    if (harvestDate) {
        formData.harvestDate = harvestDate;
    }
    if (expiryDate) {
        formData.expiryDate = expiryDate;
    }
    
    // Validate required fields
    if (!formData.name || !formData.description || !formData.category || 
        !formData.price || !formData.unit || !formData.inventory) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Adding Product...';
    submitBtn.disabled = true;
    
    try {
        const authToken = localStorage.getItem('authToken');
        
        const response = await fetch('http://localhost:5500/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('Product added successfully!', 'success');
            
            // Reset form
            document.getElementById('addProductForm').reset();
            selectedImages = [];
            document.getElementById('imagePreview').innerHTML = '';
            
            // Redirect to dashboard after a short delay
            setTimeout(() => {
                window.location.href = 'farmer-dashboard.html';
            }, 2000);
            
        } else {
            const errorMessage = result.message || 'Failed to add product. Please try again.';
            showNotification(errorMessage, 'error');
            
            if (result.errors && Array.isArray(result.errors)) {
                result.errors.forEach(error => {
                    console.error(`Field: ${error.path}, Message: ${error.msg}`);
                });
            }
        }
        
    } catch (error) {
        console.error('Add product error:', error);
        showNotification('Network error. Please check your connection and try again.', 'error');
    } finally {
        // Reset button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    showNotification('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
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