// Order confirmation functionality
let orderData = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadOrderData();
});

// Load order data from URL parameters or localStorage
function loadOrderData() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    
    if (orderId) {
        // Load order data from localStorage (temporary solution)
        const savedOrderData = localStorage.getItem('lastOrderData');
        if (savedOrderData) {
            try {
                orderData = JSON.parse(savedOrderData);
                displayOrderData(orderData);
            } catch (error) {
                console.error('Error parsing order data:', error);
                showError('Failed to load order data');
            }
        } else {
            // If no saved data, try to fetch from API
            fetchOrderData(orderId);
        }
    } else {
        showError('No order ID provided');
    }
}

// Fetch order data from API
async function fetchOrderData(orderId) {
    try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            showError('Please login to view order details');
            return;
        }

        const response = await fetch(`http://localhost:5500/api/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            orderData = result;
            displayOrderData(orderData);
        } else {
            showError('Failed to load order data');
        }
    } catch (error) {
        console.error('Error fetching order data:', error);
        showError('Network error while loading order data');
    }
}

// Display order data
function displayOrderData(data) {
    if (!data) {
        showError('No order data available');
        return;
    }

    // Display order information
    document.getElementById('orderNumber').textContent = data.orderNumber || 'N/A';
    document.getElementById('orderDate').textContent = new Date(data.createdAt || Date.now()).toLocaleDateString();
    document.getElementById('paymentMethod').textContent = data.paymentMethod || 'Cash on Delivery';

    // Display shipping address
    if (data.shippingAddress) {
        const address = data.shippingAddress;
        document.getElementById('shippingAddress').innerHTML = `
            <p class="mb-1">${address.firstName} ${address.lastName}</p>
            <p class="mb-1">${address.address}</p>
            <p class="mb-1">${address.city}, ${address.state} ${address.pincode}</p>
            <p class="mb-1">Phone: ${address.phone}</p>
            <p class="mb-0">Email: ${address.email}</p>
        `;
    }

    // Display order items
    if (data.items && data.items.length > 0) {
        const itemsHtml = data.items.map(item => `
            <div class="order-item">
                <div class="d-flex align-items-center">
                    <img src="${item.productImage || 'https://via.placeholder.com/50x50?text=Product'}" 
                         alt="${item.productName}" class="me-3" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${item.productName}</h6>
                        <small class="text-muted">Quantity: ${item.quantity}</small>
                    </div>
                    <div class="text-end">
                        <div class="fw-bold">₹${item.total.toFixed(2)}</div>
                        <small class="text-muted">₹${item.price}/${item.unit || 'unit'}</small>
                    </div>
                </div>
            </div>
        `).join('');
        
        document.getElementById('orderItems').innerHTML = itemsHtml;
    } else {
        document.getElementById('orderItems').innerHTML = '<p class="text-muted">No items found</p>';
    }

    // Display order summary
    document.getElementById('subtotal').textContent = `₹${(data.subtotal || 0).toFixed(2)}`;
    document.getElementById('deliveryFee').textContent = `₹${(data.deliveryFee || 50).toFixed(2)}`;
    document.getElementById('tax').textContent = `₹${(data.tax || 0).toFixed(2)}`;
    document.getElementById('total').textContent = `₹${(data.total || 0).toFixed(2)}`;

    // Update status badge
    updateStatusBadge(data.status || 'pending');
}

// Update status badge
function updateStatusBadge(status) {
    const statusElement = document.getElementById('orderStatus');
    const statusBadge = statusElement.querySelector('.status-badge');
    
    // Remove all status classes
    statusBadge.classList.remove('status-pending', 'status-confirmed', 'status-delivered');
    
    // Add appropriate status class
    switch (status.toLowerCase()) {
        case 'confirmed':
            statusBadge.classList.add('status-confirmed');
            statusElement.textContent = 'Confirmed';
            break;
        case 'delivered':
            statusBadge.classList.add('status-delivered');
            statusElement.textContent = 'Delivered';
            break;
        default:
            statusBadge.classList.add('status-pending');
            statusElement.textContent = 'Pending';
    }
}

// Download invoice
function downloadInvoice() {
    if (!orderData) {
        showNotification('No order data available for invoice', 'error');
        return;
    }

    // Create invoice content
    const invoiceContent = `
        AgriConnect - Invoice
        
        Order Number: ${orderData.orderNumber}
        Order Date: ${new Date(orderData.createdAt || Date.now()).toLocaleDateString()}
        Status: ${orderData.status || 'Pending'}
        
        Shipping Address:
        ${orderData.shippingAddress ? 
            `${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName}
             ${orderData.shippingAddress.address}
             ${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} ${orderData.shippingAddress.pincode}
             Phone: ${orderData.shippingAddress.phone}
             Email: ${orderData.shippingAddress.email}` : 'N/A'}
        
        Items:
        ${orderData.items ? orderData.items.map(item => 
            `${item.productName} - Qty: ${item.quantity} - ₹${item.total.toFixed(2)}`
        ).join('\n') : 'No items'}
        
        Summary:
        Subtotal: ₹${(orderData.subtotal || 0).toFixed(2)}
        Delivery Fee: ₹${(orderData.deliveryFee || 50).toFixed(2)}
        Tax: ₹${(orderData.tax || 0).toFixed(2)}
        Total: ₹${(orderData.total || 0).toFixed(2)}
        
        Payment Method: ${orderData.paymentMethod || 'Cash on Delivery'}
        
        Thank you for your order!
    `;

    // Create and download file
    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${orderData.orderNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showNotification('Invoice downloaded successfully!', 'success');
}

// Show error message
function showError(message) {
    const container = document.querySelector('.confirmation-section');
    container.innerHTML = `
        <div class="text-center py-5">
            <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
            <h4>Error</h4>
            <p class="text-muted">${message}</p>
            <a href="marketplace.html" class="btn btn-primary">
                <i class="fas fa-store me-2"></i>Continue Shopping
            </a>
        </div>
    `;
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