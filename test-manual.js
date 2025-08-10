const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5500/api';
let testUsers = {};

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function runManualTests() {
    log('\n🔍 RUNNING MANUAL TESTS', 'cyan');
    log('================================', 'cyan');
    
    try {
        await testUserRegistration();
        await testUserLogin();
        await testProductCreation();
        await testProductBrowsing();
        await testOrderCreation();
        await testOrderManagement();
        
        log('\n✅ All manual tests completed successfully!', 'green');
        
    } catch (error) {
        log(`\n❌ Manual test failed: ${error.message}`, 'red');
    }
}

async function testUserRegistration() {
    log('\n📝 Testing User Registration...', 'yellow');
    
    // Register a farmer
    const farmerData = {
        firstName: 'Test',
        lastName: 'Farmer',
        email: 'farmer@test.com',
        password: 'password123',
        phone: '9876543210',
        userType: 'farmer',
        location: {
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001'
        },
        farmName: 'Test Organic Farm'
    };
    
    const farmerResponse = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(farmerData)
    });
    
    if (farmerResponse.ok) {
        const farmerResult = await farmerResponse.json();
        testUsers.farmer = farmerResult.data;
        log('✅ Farmer registration successful', 'green');
    } else {
        log('⚠️  Farmer might already exist', 'yellow');
    }
    
    // Register a consumer
    const consumerData = {
        firstName: 'Test',
        lastName: 'Consumer',
        email: 'consumer@test.com',
        password: 'password123',
        phone: '9876543211',
        userType: 'consumer',
        location: {
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400002'
        }
    };
    
    const consumerResponse = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(consumerData)
    });
    
    if (consumerResponse.ok) {
        const consumerResult = await consumerResponse.json();
        testUsers.consumer = consumerResult.data;
        log('✅ Consumer registration successful', 'green');
    } else {
        log('⚠️  Consumer might already exist', 'yellow');
    }
}

async function testUserLogin() {
    log('\n🔐 Testing User Login...', 'yellow');
    
    // Login as farmer
    const farmerLoginData = {
        email: 'farmer@test.com',
        password: 'password123',
        userType: 'farmer'
    };
    
    const farmerLoginResponse = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(farmerLoginData)
    });
    
    if (farmerLoginResponse.ok) {
        const farmerLoginResult = await farmerLoginResponse.json();
        testUsers.farmerToken = farmerLoginResult.token;
        log('✅ Farmer login successful', 'green');
    } else {
        throw new Error('Farmer login failed');
    }
    
    // Login as consumer
    const consumerLoginData = {
        email: 'consumer@test.com',
        password: 'password123',
        userType: 'consumer'
    };
    
    const consumerLoginResponse = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(consumerLoginData)
    });
    
    if (consumerLoginResponse.ok) {
        const consumerLoginResult = await consumerLoginResponse.json();
        testUsers.consumerToken = consumerLoginResult.token;
        log('✅ Consumer login successful', 'green');
    } else {
        throw new Error('Consumer login failed');
    }
}

async function testProductCreation() {
    log('\n🌾 Testing Product Creation...', 'yellow');
    
    const products = [
        {
            name: 'Fresh Tomatoes',
            description: 'Organic red tomatoes, freshly harvested',
            category: 'Vegetables',
            price: { amount: 40, unit: 'kg' },
            inventory: 100,
            location: 'Mumbai, Maharashtra',
            images: ['https://via.placeholder.com/300x200?text=Tomatoes'],
            isOrganic: true
        },
        {
            name: 'Organic Onions',
            description: 'Fresh organic onions from our farm',
            category: 'Vegetables',
            price: { amount: 30, unit: 'kg' },
            inventory: 150,
            location: 'Mumbai, Maharashtra',
            images: ['https://via.placeholder.com/300x200?text=Onions'],
            isOrganic: true
        }
    ];
    
    for (const product of products) {
        const response = await fetch(`${BASE_URL}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${testUsers.farmerToken}`
            },
            body: JSON.stringify(product)
        });
        
        if (response.ok) {
            log(`✅ Product "${product.name}" created successfully`, 'green');
        } else {
            log(`⚠️  Product "${product.name}" might already exist`, 'yellow');
        }
    }
}

async function testProductBrowsing() {
    log('\n🛒 Testing Product Browsing...', 'yellow');
    
    const response = await fetch(`${BASE_URL}/products`);
    
    if (response.ok) {
        const products = await response.json();
        log(`✅ Found ${products.length} products in marketplace`, 'green');
        
        if (products.length > 0) {
            testUsers.products = products;
            log('📋 Available products:', 'blue');
            products.forEach((product, index) => {
                log(`  ${index + 1}. ${product.name} - ₹${product.price.amount}/${product.price.unit}`, 'blue');
            });
        }
    } else {
        throw new Error('Failed to fetch products');
    }
}

async function testOrderCreation() {
    log('\n📦 Testing Order Creation...', 'yellow');
    
    if (!testUsers.products || testUsers.products.length === 0) {
        log('⚠️  No products available for order creation', 'yellow');
        return;
    }
    
    const orderData = {
        items: [
            {
                productId: testUsers.products[0]._id,
                quantity: 2
            }
        ],
        shippingAddress: {
            firstName: 'Test',
            lastName: 'Consumer',
            email: 'consumer@test.com',
            phone: '9876543211',
            address: '123 Test Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400002'
        },
        paymentMethod: 'cod',
        notes: 'Test order for functionality verification'
    };
    
    const response = await fetch(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${testUsers.consumerToken}`
        },
        body: JSON.stringify(orderData)
    });
    
    if (response.ok) {
        const result = await response.json();
        testUsers.order = result.data;
        log('✅ Order created successfully', 'green');
        log(`📋 Order ID: ${result.data.orderNumber}`, 'blue');
    } else {
        const error = await response.json();
        log(`❌ Order creation failed: ${error.message}`, 'red');
    }
}

async function testOrderManagement() {
    log('\n📋 Testing Order Management...', 'yellow');
    
    const response = await fetch(`${BASE_URL}/orders`, {
        headers: {
            'Authorization': `Bearer ${testUsers.consumerToken}`
        }
    });
    
    if (response.ok) {
        const orders = await response.json();
        log(`✅ Found ${orders.length} orders for consumer`, 'green');
        
        if (orders.length > 0) {
            log('📋 Consumer orders:', 'blue');
            orders.forEach((order, index) => {
                log(`  ${index + 1}. Order #${order.orderNumber} - ₹${order.totalAmount} - ${order.status}`, 'blue');
            });
        }
    } else {
        log('❌ Failed to fetch orders', 'red');
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runManualTests().catch(console.error);
}

module.exports = { runManualTests }; 