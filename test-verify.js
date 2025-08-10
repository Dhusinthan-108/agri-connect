const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5500/api';
let authToken = null;

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

async function verifyFunctionality() {
    log('\n🔍 VERIFYING FUNCTIONALITY', 'cyan');
    log('================================', 'cyan');
    
    try {
        await verifyAPIEndpoints();
        await verifyDatabaseConnectivity();
        await verifyAuthenticationSystem();
        await verifyOrderSystem();
        
        log('\n✅ All functionality verification completed!', 'green');
        
    } catch (error) {
        log(`\n❌ Functionality verification failed: ${error.message}`, 'red');
    }
}

async function verifyAPIEndpoints() {
    log('\n🌐 Verifying API Endpoints...', 'yellow');
    
    const endpoints = [
        { path: '/health', method: 'GET', auth: false },
        { path: '/auth/register', method: 'POST', auth: false },
        { path: '/auth/login', method: 'POST', auth: false },
        { path: '/products', method: 'GET', auth: false },
        { path: '/products', method: 'POST', auth: true },
        { path: '/orders', method: 'GET', auth: true },
        { path: '/orders', method: 'POST', auth: true }
    ];
    
    for (const endpoint of endpoints) {
        try {
            const response = await fetch(`${BASE_URL}${endpoint.path}`, {
                method: endpoint.method,
                headers: {
                    'Content-Type': 'application/json',
                    ...(endpoint.auth && authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
                }
            });
            
            if (response.status !== 404) {
                log(`✅ ${endpoint.method} ${endpoint.path} - ${response.status}`, 'green');
            } else {
                log(`❌ ${endpoint.method} ${endpoint.path} - Not Found`, 'red');
            }
        } catch (error) {
            log(`⚠️  ${endpoint.method} ${endpoint.path} - Error: ${error.message}`, 'yellow');
        }
    }
}

async function verifyDatabaseConnectivity() {
    log('\n🗄️  Verifying Database Connectivity...', 'yellow');
    
    try {
        const response = await fetch(`${BASE_URL}/health`);
        
        if (response.ok) {
            const health = await response.json();
            log('✅ Database connection: Healthy', 'green');
            log(`📊 Server Status: ${health.status}`, 'blue');
        } else {
            log('❌ Database connection: Unhealthy', 'red');
        }
    } catch (error) {
        log(`❌ Database connectivity test failed: ${error.message}`, 'red');
    }
}

async function verifyAuthenticationSystem() {
    log('\n🔐 Verifying Authentication System...', 'yellow');
    
    try {
        // Test registration
        const registerResponse = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                firstName: 'Test',
                lastName: 'Auth',
                email: 'auth@test.com',
                password: 'password123',
                phone: '9876543219',
                userType: 'consumer',
                location: { city: 'Mumbai', state: 'Maharashtra', pincode: '400001' }
            })
        });
        
        if (registerResponse.ok) {
            log('✅ User registration working', 'green');
            
            // Test login
            const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'auth@test.com',
                    password: 'password123',
                    userType: 'consumer'
                })
            });
            
            if (loginResponse.ok) {
                const result = await loginResponse.json();
                authToken = result.token;
                log('✅ User login working', 'green');
                log(`🔑 Token generated: ${result.token ? 'Yes' : 'No'}`, 'blue');
            } else {
                log('❌ User login failed', 'red');
            }
        } else {
            log('⚠️  User might already exist, testing login...', 'yellow');
            
            // Test login with existing user
            const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'auth@test.com',
                    password: 'password123',
                    userType: 'consumer'
                })
            });
            
            if (loginResponse.ok) {
                const result = await loginResponse.json();
                authToken = result.token;
                log('✅ User login working', 'green');
                log(`🔑 Token generated: ${result.token ? 'Yes' : 'No'}`, 'blue');
            } else {
                log('❌ User login failed', 'red');
            }
        }
    } catch (error) {
        log(`❌ Authentication test failed: ${error.message}`, 'red');
    }
}

async function verifyOrderSystem() {
    log('\n📦 Verifying Order System...', 'yellow');
    
    try {
        // Get products
        const productsResponse = await fetch(`${BASE_URL}/products`);
        if (productsResponse.ok) {
            const products = await productsResponse.json();
            log(`✅ Products available: ${products.length}`, 'green');
            
            if (products.length > 0 && authToken) {
                // Test order creation
                const orderData = {
                    items: [{ productId: products[0]._id, quantity: 1 }],
                    shippingAddress: {
                        firstName: 'Test',
                        lastName: 'Order',
                        email: 'order@test.com',
                        phone: '9876543218',
                        address: '123 Test Street',
                        city: 'Mumbai',
                        state: 'Maharashtra',
                        pincode: '400001'
                    },
                    paymentMethod: 'cod',
                    notes: 'Test order verification'
                };
                
                const orderResponse = await fetch(`${BASE_URL}/orders`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify(orderData)
                });
                
                if (orderResponse.ok) {
                    log('✅ Order creation working', 'green');
                    
                    // Test order retrieval
                    const ordersResponse = await fetch(`${BASE_URL}/orders`, {
                        headers: { 'Authorization': `Bearer ${authToken}` }
                    });
                    
                    if (ordersResponse.ok) {
                        const orders = await ordersResponse.json();
                        log(`✅ Order retrieval working: ${orders.length} orders found`, 'green');
                    } else {
                        log('❌ Order retrieval failed', 'red');
                    }
                } else {
                    log('❌ Order creation failed', 'red');
                }
            } else {
                log('⚠️  No products available or no auth token for order testing', 'yellow');
            }
        } else {
            log('❌ Product retrieval failed', 'red');
        }
    } catch (error) {
        log(`❌ Order system test failed: ${error.message}`, 'red');
    }
}

// Run if this file is executed directly
if (require.main === module) {
    verifyFunctionality().catch(console.error);
}

module.exports = { verifyFunctionality }; 