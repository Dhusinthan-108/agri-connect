// Checkout functionality
let selectedPaymentMethod = 'cod';
const deliveryFee = 50;
const taxRate = 0.05; // 5% tax

// Initialize checkout when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadOrderSummary();
    populateUserData();
    setupEventListeners();
});

// Load order summary from cart
function loadOrderSummary() {
    const cartItems = JSON.parse(localStorage.getItem('shoppingCart') || '[]');
    
    if (cartItems.length === 0) {
        showNotification('Your cart is empty', 'warning');
        setTimeout(() => {
            window.location.href = 'marketplace.html';
        }, 2000);
        return;
    }
    
    displayOrderItems(cartItems);
    calculateTotals(cartItems);
}

// Display order items
function displayOrderItems(cartItems) {
    const orderItemsContainer = document.getElementById('orderItems');
    
    orderItemsContainer.innerHTML = cartItems.map(item => `
        <div class="cart-item">
            <div class="d-flex align-items-center">
                <img src="${item.image || 'https://via.placeholder.com/50x50?text=Product'}" 
                     alt="${item.name}" class="me-3" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">
                <div class="flex-grow-1">
                    <h6 class="mb-1">${item.name}</h6>
                    <small class="text-muted">₹${item.price}/${item.unit}</small>
                </div>
                <div class="text-end">
                    <div class="fw-bold">₹${(item.price * item.quantity).toFixed(2)}</div>
                    <small class="text-muted">Qty: ${item.quantity}</small>
                </div>
            </div>
        </div>
    `).join('');
}

// Calculate totals
function calculateTotals(cartItems) {
    const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    const tax = subtotal * taxRate;
    const total = subtotal + deliveryFee + tax;
    
    document.getElementById('subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('deliveryFee').textContent = `₹${deliveryFee.toFixed(2)}`;
    document.getElementById('tax').textContent = `₹${tax.toFixed(2)}`;
    document.getElementById('total').textContent = `₹${total.toFixed(2)}`;
}

// Populate user data if logged in
function populateUserData() {
    const userData = localStorage.getItem('userData');
    
    if (userData) {
        try {
            const user = JSON.parse(userData);
            
            // Pre-fill form with user data
            document.getElementById('firstName').value = user.firstName || '';
            document.getElementById('lastName').value = user.lastName || '';
            document.getElementById('email').value = user.email || '';
            document.getElementById('phone').value = user.phone || '';
            
            // Pre-fill address if available
            if (user.location) {
                document.getElementById('city').value = user.location.city || '';
                document.getElementById('state').value = user.location.state || '';
                document.getElementById('pincode').value = user.location.pincode || '';
            }
            
        } catch (error) {
            console.error('Error parsing user data:', error);
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    // Payment method selection
    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
        radio.addEventListener('change', function() {
            selectedPaymentMethod = this.value;
            updatePaymentMethodUI();
        });
    });
    
    // Form validation
    document.getElementById('firstName').addEventListener('blur', validateField);
    document.getElementById('lastName').addEventListener('blur', validateField);
    document.getElementById('email').addEventListener('blur', validateField);
    document.getElementById('phone').addEventListener('blur', validateField);
    document.getElementById('address').addEventListener('blur', validateField);
    document.getElementById('city').addEventListener('blur', validateField);
    document.getElementById('state').addEventListener('blur', validateField);
    document.getElementById('pincode').addEventListener('blur', validateField);
}

// Select payment method
function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    document.getElementById(method).checked = true;
    updatePaymentMethodUI();
}

// Update payment method UI
function updatePaymentMethodUI() {
    // Remove selected class from all payment methods
    document.querySelectorAll('.payment-method').forEach(method => {
        method.classList.remove('selected');
    });
    
    // Add selected class to chosen method
    const selectedMethod = document.querySelector(`input[name="paymentMethod"]:checked`);
    if (selectedMethod) {
        selectedMethod.closest('.payment-method').classList.add('selected');
    }
}

// Validate form field
function validateField(event) {
    const field = event.target;
    const value = field.value.trim();
    
    if (field.hasAttribute('required') && !value) {
        field.classList.add('is-invalid');
        return false;
    } else {
        field.classList.remove('is-invalid');
        return true;
    }
}

// Validate entire form
function validateForm() {
    const requiredFields = [
        'firstName', 'lastName', 'email', 'phone', 
        'address', 'city', 'state', 'pincode'
    ];
    
    let isValid = true;
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!validateField({ target: field })) {
            isValid = false;
        }
    });
    
    // Check if payment method is selected
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
    if (!paymentMethod) {
        showNotification('Please select a payment method', 'warning');
        isValid = false;
    }
    
    return isValid;
}

// Place order
async function placeOrder() {
    if (!validateForm()) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        showNotification('Please login to place an order', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }
    
    // Show loading state
    const placeOrderBtn = document.querySelector('button[onclick="placeOrder()"]');
    const originalText = placeOrderBtn.innerHTML;
    placeOrderBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
    placeOrderBtn.disabled = true;
    
    try {
        const cartItems = JSON.parse(localStorage.getItem('shoppingCart') || '[]');
        
        if (cartItems.length === 0) {
            showNotification('Your cart is empty', 'warning');
            return;
        }
        
        // Prepare order data
        const orderData = {
            items: cartItems.map(item => ({
                productId: item.productId,
                quantity: item.quantity
            })),
            shippingAddress: {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                address: document.getElementById('address').value,
                city: document.getElementById('city').value,
                state: document.getElementById('state').value,
                pincode: document.getElementById('pincode').value
            },
            paymentMethod: selectedPaymentMethod,
            notes: document.getElementById('orderNotes').value
        };
        
        // Make API call to create order
        const response = await fetch('http://localhost:5500/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('Order placed successfully!', 'success');
            
            // Save order data for confirmation page
            localStorage.setItem('lastOrderData', JSON.stringify(result.data));
            
            // Clear cart
            localStorage.removeItem('shoppingCart');
            
            // Redirect to order confirmation
            setTimeout(() => {
                window.location.href = `order-confirmation.html?orderId=${result.data.orderNumber}`;
            }, 2000);
            
        } else {
            const errorMessage = result.message || 'Failed to place order. Please try again.';
            showNotification(errorMessage, 'error');
        }
        
    } catch (error) {
        console.error('Place order error:', error);
        showNotification('Network error. Please check your connection and try again.', 'error');
    } finally {
        // Reset button state
        placeOrderBtn.innerHTML = originalText;
        placeOrderBtn.disabled = false;
    }
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
    }, 5000);
} 