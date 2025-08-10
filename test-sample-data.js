const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5500/api';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function createSampleData() {
    log('\n🎯 CREATING SAMPLE DATA', 'magenta');
    log('================================', 'magenta');
    
    try {
        await createSampleUsers();
        await createSampleProducts();
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

// Run if this file is executed directly
if (require.main === module) {
    createSampleData().catch(console.error);
}

module.exports = { createSampleData }; 