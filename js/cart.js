class ShoppingCart {
    constructor() {
        this.items = this.loadCart();
        this.updateCartDisplay();
    }

    // Load cart from localStorage
    loadCart() {
        const savedCart = localStorage.getItem('shoppingCart');
        return savedCart ? JSON.parse(savedCart) : [];
    }

    // Save cart to localStorage
    saveCart() {
        localStorage.setItem('shoppingCart', JSON.stringify(this.items));
    }

    // Add item to cart
    addItem(product, quantity = 1) {
        const existingItem = this.items.find(item => item.productId === product._id);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.items.push({
                productId: product._id,
                name: product.name,
                price: product.price.amount,
                unit: product.price.unit,
                image: product.images && product.images.length > 0 ? product.images[0] : null,
                farmer: product.farmer,
                quantity: quantity
            });
        }
        
        this.saveCart();
        this.updateCartDisplay();
        this.showNotification('Product added to cart!', 'success');
    }

    // Remove item from cart
    removeItem(productId) {
        this.items = this.items.filter(item => item.productId !== productId);
        this.saveCart();
        this.updateCartDisplay();
        this.showNotification('Product removed from cart!', 'info');
    }

    // Update item quantity
    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.productId === productId);
        if (item) {
            if (quantity <= 0) {
                this.removeItem(productId);
            } else {
                item.quantity = quantity;
                this.saveCart();
                this.updateCartDisplay();
            }
        }
    }

    // Get cart total
    getTotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    // Get cart count
    getCount() {
        return this.items.reduce((count, item) => count + item.quantity, 0);
    }

    // Clear cart
    clearCart() {
        this.items = [];
        this.saveCart();
        this.updateCartDisplay();
        this.showNotification('Cart cleared!', 'info');
    }

    // Update cart display
    updateCartDisplay() {
        const cartCount = this.getCount();
        const cartTotal = this.getTotal();
        
        // Update cart badge
        const cartBadge = document.getElementById('cartBadge');
        if (cartBadge) {
            cartBadge.textContent = cartCount;
            cartBadge.style.display = cartCount > 0 ? 'inline' : 'none';
        }
        
        // Update cart total
        const cartTotalElement = document.getElementById('cartTotal');
        if (cartTotalElement) {
            cartTotalElement.textContent = `₹${cartTotal.toFixed(2)}`;
        }
        
        // Update cart items list
        this.updateCartItemsList();
    }

    // Update cart items list
    updateCartItemsList() {
        const cartItemsContainer = document.getElementById('cartItems');
        if (!cartItemsContainer) return;
        
        if (this.items.length === 0) {
            cartItemsContainer.innerHTML = '<p class="text-muted text-center py-3">Your cart is empty</p>';
            return;
        }
        
        cartItemsContainer.innerHTML = this.items.map(item => `
            <div class="cart-item d-flex align-items-center p-3 border-bottom">
                <img src="${item.image || 'https://via.placeholder.com/50x50?text=Product'}" 
                     alt="${item.name}" class="me-3" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">
                <div class="flex-grow-1">
                    <h6 class="mb-1">${item.name}</h6>
                    <small class="text-muted">₹${item.price}/${item.unit}</small>
                </div>
                <div class="d-flex align-items-center">
                    <button class="btn btn-sm btn-outline-secondary me-2" onclick="cart.updateQuantity('${item.productId}', ${item.quantity - 1})">-</button>
                    <span class="mx-2">${item.quantity}</span>
                    <button class="btn btn-sm btn-outline-secondary ms-2" onclick="cart.updateQuantity('${item.productId}', ${item.quantity + 1})">+</button>
                    <button class="btn btn-sm btn-outline-danger ms-3" onclick="cart.removeItem('${item.productId}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Show notification
    showNotification(message, type = 'info') {
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
}

// Initialize cart when DOM is loaded
let cart;
document.addEventListener('DOMContentLoaded', function() {
    cart = new ShoppingCart();
    
    // Add cart functionality to product cards
    addCartButtonsToProducts();
});

// Add cart buttons to product cards
function addCartButtonsToProducts() {
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const productId = this.getAttribute('data-product-id');
            const productName = this.getAttribute('data-product-name');
            const productPrice = parseFloat(this.getAttribute('data-product-price'));
            const productUnit = this.getAttribute('data-product-unit');
            const productImage = this.getAttribute('data-product-image');
            const farmerId = this.getAttribute('data-farmer-id');
            
            const product = {
                _id: productId,
                name: productName,
                price: {
                    amount: productPrice,
                    unit: productUnit
                },
                images: productImage ? [productImage] : [],
                farmer: farmerId
            };
            
            cart.addItem(product);
        });
    });
}

// Global functions for cart operations
function addToCart(productId, productName, productPrice, productUnit, productImage, farmerId) {
    const product = {
        _id: productId,
        name: productName,
        price: {
            amount: parseFloat(productPrice),
            unit: productUnit
        },
        images: productImage ? [productImage] : [],
        farmer: farmerId
    };
    
    cart.addItem(product);
}

function removeFromCart(productId) {
    cart.removeItem(productId);
}

function updateCartQuantity(productId, quantity) {
    cart.updateQuantity(productId, quantity);
}

function clearCart() {
    cart.clearCart();
}

function getCartTotal() {
    return cart.getTotal();
}

function getCartCount() {
    return cart.getCount();
} 