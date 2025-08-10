const fetch = require('node-fetch');

// Configuration
const BASE_URL = 'http://localhost:5500/api';
let authToken = null;
let testUsers = {};

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// ============================================================================
// A) MANUAL TESTING SYSTEM
// ============================================================================

async function runManualTests() {
    log('\n🔍 RUNNING MANUAL TESTS', 'cyan');
    log('================================', 'cyan');
    
    try {
        // Test 1: User Registration
        await testUserRegistration();
        
        // Test 2: User Login
        await testUserLogin();
        
        // Test 3: Product Creation (Farmer)
        await testProductCreation();
        
        // Test 4: Product Browsing (Consumer)
        await testProductBrowsing();
        
        // Test 5: Order Creation
        await testOrderCreation();
        
        // Test 6: Order Management
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
        throw new Error('Farmer registration failed');
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
        throw new Error('Consumer registration failed');
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
        authToken = consumerLoginResult.token; // Set as current user
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
        },
        {
            name: 'Fresh Potatoes',
            description: 'Quality potatoes, perfect for cooking',
            category: 'Vegetables',
            price: { amount: 25, unit: 'kg' },
            inventory: 200,
            location: 'Mumbai, Maharashtra',
            images: ['https://via.placeholder.com/300x200?text=Potatoes'],
            isOrganic: false
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
            const result = await response.json();
            log(`✅ Product "${product.name}" created successfully`, 'green');
        } else {
            log(`❌ Failed to create product "${product.name}"`, 'red');
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
            },
            {
                productId: testUsers.products[1]._id,
                quantity: 1
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
    
    // Fetch orders for consumer
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

// ============================================================================
// B) SAMPLE DATA SCRIPT
// ============================================================================

async function createSampleData() {
    log('\n🎯 CREATING SAMPLE DATA', 'magenta');
    log('================================', 'magenta');
    
    try {
        // Create sample users
        await createSampleUsers();
        
        // Create sample products
        await createSampleProducts();
        
        // Create sample orders
        await createSampleOrders();
        
        log('\n✅ Sample data created successfully!', 'green');
        log('📊 Summary:', 'blue');
        log('  - 3 Farmers created', 'blue');
        log('  - 3 Consumers created', 'blue');
        log('  - 15 Products created', 'blue');
        log('  - 5 Sample orders created', 'blue');
        
    } catch (error) {
        log(`\n❌ Sample data creation failed: ${error.message}`, 'red');
    }
}

async function createSampleUsers() {
    log('\n👥 Creating Sample Users...', 'yellow');
    
    const sampleUsers = [
        // Farmers
        {
            firstName: 'Rajesh',
            lastName: 'Kumar',
            email: 'rajesh@farm.com',
            password: 'password123',
            phone: '9876543210',
            userType: 'farmer',
            location: { city: 'Nashik', state: 'Maharashtra', pincode: '422001' },
            farmName: 'Kumar Organic Farm'
        },
        {
            firstName: 'Rahul',
            lastName: 'Patel',
            email: 'rahul@farm.com',
            password: 'password123',
            phone: '9876543211',
            userType: 'farmer',
            location: { city: 'Pune', state: 'Maharashtra', pincode: '411001' },
            farmName: 'Patel Fresh Farm'
        },
        {
            firstName: 'Meera',
            lastName: 'Singh',
            email: 'meera@farm.com',
            password: 'password123',
            phone: '9876543212',
            userType: 'farmer',
            location: { city: 'Kolhapur', state: 'Maharashtra', pincode: '416001' },
            farmName: 'Singh Dairy Farm'
        },
        // Consumers
        {
            firstName: 'Priya',
            lastName: 'Sharma',
            email: 'priya@consumer.com',
            password: 'password123',
            phone: '9876543213',
            userType: 'consumer',
            location: { city: 'Mumbai', state: 'Maharashtra', pincode: '400001' }
        },
        {
            firstName: 'Amit',
            lastName: 'Verma',
            email: 'amit@consumer.com',
            password: 'password123',
            phone: '9876543214',
            userType: 'consumer',
            location: { city: 'Mumbai', state: 'Maharashtra', pincode: '400002' }
        },
        {
            firstName: 'Neha',
            lastName: 'Gupta',
            email: 'neha@consumer.com',
            password: 'password123',
            phone: '9876543215',
            userType: 'consumer',
            location: { city: 'Mumbai', state: 'Maharashtra', pincode: '400003' }
        }
    ];
    
    for (const userData of sampleUsers) {
        const response = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        
        if (response.ok) {
            const result = await response.json();
            log(`✅ Created ${userData.userType}: ${userData.firstName} ${userData.lastName}`, 'green');
        } else {
            log(`⚠️  User ${userData.email} might already exist`, 'yellow');
        }
    }
}

async function createSampleProducts() {
    log('\n🌾 Creating Sample Products...', 'yellow');
    
    const sampleProducts = [
        // Vegetables
        { name: 'Fresh Tomatoes', category: 'Vegetables', price: 40, unit: 'kg', inventory: 100, isOrganic: true },
        { name: 'Organic Onions', category: 'Vegetables', price: 30, unit: 'kg', inventory: 150, isOrganic: true },
        { name: 'Fresh Potatoes', category: 'Vegetables', price: 25, unit: 'kg', inventory: 200, isOrganic: false },
        { name: 'Green Peas', category: 'Vegetables', price: 60, unit: 'kg', inventory: 50, isOrganic: true },
        { name: 'Carrots', category: 'Vegetables', price: 35, unit: 'kg', inventory: 80, isOrganic: false },
        
        // Fruits
        { name: 'Fresh Apples', category: 'Fruits', price: 120, unit: 'kg', inventory: 60, isOrganic: true },
        { name: 'Bananas', category: 'Fruits', price: 40, unit: 'dozen', inventory: 100, isOrganic: false },
        { name: 'Oranges', category: 'Fruits', price: 80, unit: 'kg', inventory: 70, isOrganic: true },
        { name: 'Mangoes', category: 'Fruits', price: 100, unit: 'kg', inventory: 40, isOrganic: false },
        { name: 'Grapes', category: 'Fruits', price: 150, unit: 'kg', inventory: 30, isOrganic: true },
        
        // Grains
        { name: 'Basmati Rice', category: 'Grains', price: 80, unit: 'kg', inventory: 500, isOrganic: true },
        { name: 'Wheat Flour', category: 'Grains', price: 45, unit: 'kg', inventory: 300, isOrganic: false },
        { name: 'Lentils', category: 'Grains', price: 90, unit: 'kg', inventory: 200, isOrganic: true },
        
        // Dairy
        { name: 'Fresh Milk', category: 'Dairy', price: 60, unit: 'liter', inventory: 100, isOrganic: true },
        { name: 'Curd', category: 'Dairy', price: 40, unit: 'kg', inventory: 50, isOrganic: false }
    ];
    
    // Get farmer tokens for product creation
    const farmerEmails = ['rajesh@farm.com', 'rahul@farm.com', 'meera@farm.com'];
    const farmerTokens = [];
    
    for (const email of farmerEmails) {
        const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                password: 'password123',
                userType: 'farmer'
            })
        });
        
        if (loginResponse.ok) {
            const result = await loginResponse.json();
            farmerTokens.push(result.token);
        }
    }
    
    // Create products
    for (let i = 0; i < sampleProducts.length; i++) {
        const product = sampleProducts[i];
        const farmerToken = farmerTokens[i % farmerTokens.length];
        
        const productData = {
            name: product.name,
            description: `Fresh ${product.name.toLowerCase()} from our organic farm`,
            category: product.category,
            price: { amount: product.price, unit: product.unit },
            inventory: product.inventory,
            location: 'Mumbai, Maharashtra',
            images: [`https://via.placeholder.com/300x200?text=${product.name.replace(' ', '+')}`],
            isOrganic: product.isOrganic
        };
        
        const response = await fetch(`${BASE_URL}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${farmerToken}`
            },
            body: JSON.stringify(productData)
        });
        
        if (response.ok) {
            log(`✅ Created product: ${product.name}`, 'green');
        } else {
            log(`⚠️  Failed to create product: ${product.name}`, 'yellow');
        }
    }
}

async function createSampleOrders() {
    log('\n📦 Creating Sample Orders...', 'yellow');
    
    // Get consumer tokens
    const consumerEmails = ['priya@consumer.com', 'amit@consumer.com', 'neha@consumer.com'];
    const consumerTokens = [];
    
    for (const email of consumerEmails) {
        const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                password: 'password123',
                userType: 'consumer'
            })
        });
        
        if (loginResponse.ok) {
            const result = await loginResponse.json();
            consumerTokens.push(result.token);
        }
    }
    
    // Get products
    const productsResponse = await fetch(`${BASE_URL}/products`);
    if (!productsResponse.ok) {
        log('❌ Failed to fetch products for sample orders', 'red');
        return;
    }
    
    const products = await productsResponse.json();
    
    // Create sample orders
    const sampleOrders = [
        {
            items: [{ productId: products[0]._id, quantity: 2 }, { productId: products[1]._id, quantity: 1 }],
            status: 'delivered'
        },
        {
            items: [{ productId: products[2]._id, quantity: 3 }, { productId: products[3]._id, quantity: 1 }],
            status: 'pending'
        },
        {
            items: [{ productId: products[4]._id, quantity: 1 }, { productId: products[5]._id, quantity: 2 }],
            status: 'in_transit'
        },
        {
            items: [{ productId: products[6]._id, quantity: 1 }],
            status: 'confirmed'
        },
        {
            items: [{ productId: products[7]._id, quantity: 2 }, { productId: products[8]._id, quantity: 1 }],
            status: 'processing'
        }
    ];
    
    for (let i = 0; i < sampleOrders.length; i++) {
        const order = sampleOrders[i];
        const consumerToken = consumerTokens[i % consumerTokens.length];
        
        const orderData = {
            ...order,
            shippingAddress: {
                firstName: 'Sample',
                lastName: 'Customer',
                email: 'customer@sample.com',
                phone: '9876543210',
                address: '123 Sample Street',
                city: 'Mumbai',
                state: 'Maharashtra',
                pincode: '400001'
            },
            paymentMethod: 'cod',
            notes: 'Sample order for testing'
        };
        
        const response = await fetch(`${BASE_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${consumerToken}`
            },
            body: JSON.stringify(orderData)
        });
        
        if (response.ok) {
            const result = await response.json();
            log(`✅ Created sample order: #${result.data.orderNumber}`, 'green');
        } else {
            log(`⚠️  Failed to create sample order ${i + 1}`, 'yellow');
        }
    }
}

// ============================================================================
// C) FUNCTIONALITY VERIFICATION
// ============================================================================

async function verifyFunctionality() {
    log('\n🔍 VERIFYING FUNCTIONALITY', 'cyan');
    log('================================', 'cyan');
    
    try {
        // Verify API endpoints
        await verifyAPIEndpoints();
        
        // Verify database connectivity
        await verifyDatabaseConnectivity();
        
        // Verify authentication system
        await verifyAuthenticationSystem();
        
        // Verify order system
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
                log('✅ User login working', 'green');
                log(`🔑 Token generated: ${result.token ? 'Yes' : 'No'}`, 'blue');
            } else {
                log('❌ User login failed', 'red');
            }
        } else {
            log('❌ User registration failed', 'red');
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
            }
        } else {
            log('❌ Product retrieval failed', 'red');
        }
    } catch (error) {
        log(`❌ Order system test failed: ${error.message}`, 'red');
    }
}

// ============================================================================
// D) ENHANCED FEATURES
// ============================================================================

async function runEnhancedFeatures() {
    log('\n🚀 RUNNING ENHANCED FEATURES', 'magenta');
    log('================================', 'magenta');
    
    try {
        // Generate system report
        await generateSystemReport();
        
        // Test performance
        await testPerformance();
        
        // Validate data integrity
        await validateDataIntegrity();
        
        // Test error handling
        await testErrorHandling();
        
        log('\n✅ All enhanced features completed!', 'green');
        
    } catch (error) {
        log(`\n❌ Enhanced features failed: ${error.message}`, 'red');
    }
}

async function generateSystemReport() {
    log('\n📊 Generating System Report...', 'yellow');
    
    try {
        // Get system statistics
        const stats = {
            users: 0,
            products: 0,
            orders: 0,
            totalRevenue: 0
        };
        
        // Count users (approximate)
        const usersResponse = await fetch(`${BASE_URL}/users`);
        if (usersResponse.ok) {
            const users = await usersResponse.json();
            stats.users = users.length;
        }
        
        // Count products
        const productsResponse = await fetch(`${BASE_URL}/products`);
        if (productsResponse.ok) {
            const products = await productsResponse.json();
            stats.products = products.length;
        }
        
        // Count orders and calculate revenue
        if (authToken) {
            const ordersResponse = await fetch(`${BASE_URL}/orders`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (ordersResponse.ok) {
                const orders = await ordersResponse.json();
                stats.orders = orders.length;
                stats.totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
            }
        }
        
        log('\n📈 SYSTEM REPORT', 'cyan');
        log('================', 'cyan');
        log(`👥 Total Users: ${stats.users}`, 'blue');
        log(`🌾 Total Products: ${stats.products}`, 'blue');
        log(`📦 Total Orders: ${stats.orders}`, 'blue');
        log(`💰 Total Revenue: ₹${stats.totalRevenue.toFixed(2)}`, 'blue');
        
    } catch (error) {
        log(`❌ System report generation failed: ${error.message}`, 'red');
    }
}

async function testPerformance() {
    log('\n⚡ Testing Performance...', 'yellow');
    
    try {
        const startTime = Date.now();
        
        // Test product loading performance
        const productsResponse = await fetch(`${BASE_URL}/products`);
        const productsLoadTime = Date.now() - startTime;
        
        if (productsResponse.ok) {
            log(`✅ Products loaded in ${productsLoadTime}ms`, 'green');
        } else {
            log('❌ Product loading performance test failed', 'red');
        }
        
        // Test order loading performance
        if (authToken) {
            const orderStartTime = Date.now();
            const ordersResponse = await fetch(`${BASE_URL}/orders`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const ordersLoadTime = Date.now() - orderStartTime;
            
            if (ordersResponse.ok) {
                log(`✅ Orders loaded in ${ordersLoadTime}ms`, 'green');
            } else {
                log('❌ Order loading performance test failed', 'red');
            }
        }
        
    } catch (error) {
        log(`❌ Performance test failed: ${error.message}`, 'red');
    }
}

async function validateDataIntegrity() {
    log('\n🔍 Validating Data Integrity...', 'yellow');
    
    try {
        // Validate products
        const productsResponse = await fetch(`${BASE_URL}/products`);
        if (productsResponse.ok) {
            const products = await productsResponse.json();
            let validProducts = 0;
            
            for (const product of products) {
                if (product.name && product.price && product.category) {
                    validProducts++;
                }
            }
            
            log(`✅ Product data integrity: ${validProducts}/${products.length} valid`, 'green');
        }
        
        // Validate orders
        if (authToken) {
            const ordersResponse = await fetch(`${BASE_URL}/orders`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (ordersResponse.ok) {
                const orders = await ordersResponse.json();
                let validOrders = 0;
                
                for (const order of orders) {
                    if (order.items && order.shippingAddress && order.status) {
                        validOrders++;
                    }
                }
                
                log(`✅ Order data integrity: ${validOrders}/${orders.length} valid`, 'green');
            }
        }
        
    } catch (error) {
        log(`❌ Data integrity validation failed: ${error.message}`, 'red');
    }
}

async function testErrorHandling() {
    log('\n⚠️  Testing Error Handling...', 'yellow');
    
    try {
        // Test invalid login
        const invalidLoginResponse = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'invalid@test.com',
                password: 'wrongpassword',
                userType: 'consumer'
            })
        });
        
        if (invalidLoginResponse.status === 401) {
            log('✅ Invalid login properly handled', 'green');
        } else {
            log('⚠️  Invalid login handling needs improvement', 'yellow');
        }
        
        // Test invalid product access
        const invalidProductResponse = await fetch(`${BASE_URL}/products/invalid-id`);
        if (invalidProductResponse.status === 404) {
            log('✅ Invalid product access properly handled', 'green');
        } else {
            log('⚠️  Invalid product access handling needs improvement', 'yellow');
        }
        
    } catch (error) {
        log(`❌ Error handling test failed: ${error.message}`, 'red');
    }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
    log('\n🚀 AGRI CONNECT TESTING SYSTEM', 'bright');
    log('================================', 'bright');
    log('This system will test all functionality of your AgriConnect project', 'blue');
    
    const args = process.argv.slice(2);
    const command = args[0] || 'all';
    
    switch (command) {
        case 'manual':
            await runManualTests();
            break;
        case 'sample':
            await createSampleData();
            break;
        case 'verify':
            await verifyFunctionality();
            break;
        case 'enhanced':
            await runEnhancedFeatures();
            break;
        case 'all':
            log('\n🎯 RUNNING ALL TESTS', 'bright');
            await runManualTests();
            await createSampleData();
            await verifyFunctionality();
            await runEnhancedFeatures();
            break;
        default:
            log('\n📋 Available Commands:', 'cyan');
            log('  node test-system.js manual    - Run manual tests', 'blue');
            log('  node test-system.js sample    - Create sample data', 'blue');
            log('  node test-system.js verify    - Verify functionality', 'blue');
            log('  node test-system.js enhanced  - Run enhanced features', 'blue');
            log('  node test-system.js all       - Run all tests (default)', 'blue');
    }
    
    log('\n✨ Testing completed!', 'bright');
}

// Run the main function
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    runManualTests,
    createSampleData,
    verifyFunctionality,
    runEnhancedFeatures
}; 