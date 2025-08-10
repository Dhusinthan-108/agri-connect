// Marketplace functionality
let allProducts = [];
let filteredProducts = [];

// Initialize marketplace when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    setupEventListeners();
    checkUserAuth();
});

// Load products from API
async function loadProducts() {
    showLoading(true);
    
    try {
        const response = await fetch('http://localhost:5500/api/products');
        const products = await response.json();
        
        if (Array.isArray(products)) {
            allProducts = products;
            filteredProducts = [...products];
            displayProducts();
        } else {
            console.error('Invalid products data:', products);
            showNoProductsMessage();
        }
    } catch (error) {
        console.error('Error loading products:', error);
        showNoProductsMessage();
    } finally {
        showLoading(false);
    }
}

// Display products in the grid
function displayProducts() {
    const productsGrid = document.getElementById('productsGrid');
    
    if (filteredProducts.length === 0) {
        showNoProductsMessage();
        return;
    }
    
    hideNoProductsMessage();
    
    productsGrid.innerHTML = filteredProducts.map(product => `
        <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
            <div class="product-card h-100">
                <img src="${product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/300x200?text=No+Image'}" 
                     alt="${product.name}" class="product-image w-100">
                <div class="p-3">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="category-badge">${product.category}</span>
                        ${product.isOrganic ? '<span class="organic-badge">Organic</span>' : ''}
                    </div>
                    <h5 class="fw-bold mb-2">${product.name}</h5>
                    <p class="text-muted small mb-3">${product.description.substring(0, 100)}${product.description.length > 100 ? '...' : ''}</p>
                    
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <span class="fw-bold text-primary fs-5">₹${product.price.amount}</span>
                            <small class="text-muted">/${product.price.unit}</small>
                        </div>
                        <small class="text-muted">Available: ${product.inventory} ${product.price.unit}</small>
                    </div>
                    
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">
                            <i class="fas fa-user me-1"></i>
                            ${product.farmer?.firstName || 'Farmer'} ${product.farmer?.lastName || ''}
                        </small>
                        <button class="btn btn-primary btn-sm add-to-cart-btn" 
                                data-product-id="${product._id}"
                                data-product-name="${product.name}"
                                data-product-price="${product.price.amount}"
                                data-product-unit="${product.price.unit}"
                                data-product-image="${product.images && product.images.length > 0 ? product.images[0] : ''}"
                                data-farmer-id="${product.farmer?._id || ''}"
                                onclick="addToCart('${product._id}', '${product.name}', ${product.price.amount}, '${product.price.unit}', '${product.images && product.images.length > 0 ? product.images[0] : ''}', '${product.farmer?._id || ''}')">
                            <i class="fas fa-cart-plus me-1"></i>Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Setup event listeners for filters
function setupEventListeners() {
    // Category filter
    document.getElementById('categoryFilter').addEventListener('change', filterProducts);
    
    // Price filter
    document.getElementById('priceFilter').addEventListener('change', filterProducts);
    
    // Sort filter
    document.getElementById('sortFilter').addEventListener('change', filterProducts);
    
    // Search input
    document.getElementById('searchInput').addEventListener('input', debounce(filterProducts, 300));
}

// Filter and sort products
function filterProducts() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const priceFilter = document.getElementById('priceFilter').value;
    const sortFilter = document.getElementById('sortFilter').value;
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    
    filteredProducts = allProducts.filter(product => {
        // Category filter
        if (categoryFilter && product.category !== categoryFilter) {
            return false;
        }
        
        // Price filter
        if (priceFilter) {
            const price = product.price.amount;
            switch (priceFilter) {
                case '0-50':
                    if (price > 50) return false;
                    break;
                case '50-100':
                    if (price < 50 || price > 100) return false;
                    break;
                case '100-200':
                    if (price < 100 || price > 200) return false;
                    break;
                case '200+':
                    if (price < 200) return false;
                    break;
            }
        }
        
        // Search filter
        if (searchInput) {
            const searchText = product.name.toLowerCase() + ' ' + product.description.toLowerCase();
            if (!searchText.includes(searchInput)) {
                return false;
            }
        }
        
        return true;
    });
    
    // Sort products
    switch (sortFilter) {
        case 'price-low':
            filteredProducts.sort((a, b) => a.price.amount - b.price.amount);
            break;
        case 'price-high':
            filteredProducts.sort((a, b) => b.price.amount - a.price.amount);
            break;
        case 'name':
            filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'newest':
        default:
            filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
    }
    
    displayProducts();
}

// Search products
function searchProducts() {
    filterProducts();
}

// Show loading spinner
function showLoading(show) {
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (show) {
        loadingSpinner.classList.add('show');
    } else {
        loadingSpinner.classList.remove('show');
    }
}

// Show no products message
function showNoProductsMessage() {
    document.getElementById('noProductsMessage').style.display = 'block';
    document.getElementById('productsGrid').innerHTML = '';
}

// Hide no products message
function hideNoProductsMessage() {
    document.getElementById('noProductsMessage').style.display = 'none';
}

// Check user authentication
function checkUserAuth() {
    const authToken = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    const loginLink = document.getElementById('loginLink');
    const dashboardLink = document.getElementById('dashboardLink');
    const logoutLink = document.getElementById('logoutLink');
    
    if (authToken && userData) {
        try {
            const user = JSON.parse(userData);
            
            // Hide login link, show dashboard and logout
            loginLink.style.display = 'none';
            dashboardLink.style.display = 'block';
            logoutLink.style.display = 'block';
            
            // Set dashboard link based on user type
            if (user.userType === 'farmer') {
                dashboardLink.href = 'farmer-dashboard.html';
                dashboardLink.innerHTML = '<i class="fas fa-tachometer-alt me-2"></i>Farmer Dashboard';
            } else {
                dashboardLink.href = 'consumer-dashboard.html';
                dashboardLink.innerHTML = '<i class="fas fa-user me-2"></i>My Account';
            }
            
            // Setup logout
            logoutLink.addEventListener('click', function(e) {
                e.preventDefault();
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
                window.location.reload();
            });
            
        } catch (error) {
            console.error('Error parsing user data:', error);
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
        }
    } else {
        // Show login link, hide dashboard and logout
        loginLink.style.display = 'block';
        dashboardLink.style.display = 'none';
        logoutLink.style.display = 'none';
        
        loginLink.href = 'login.html';
    }
}

// Proceed to checkout
function proceedToCheckout() {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        showNotification('Please login to proceed to checkout', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }
    
    if (getCartCount() === 0) {
        showNotification('Your cart is empty', 'warning');
        return;
    }
    
    // Redirect to checkout page (we'll create this next)
    window.location.href = 'checkout.html';
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Show notification
function showNotification(message, type = 'info') {
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
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
} 