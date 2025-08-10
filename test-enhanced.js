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
    magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function runEnhancedFeatures() {
    log('\n🚀 RUNNING ENHANCED FEATURES', 'magenta');
    log('================================', 'magenta');
    
    try {
        await generateSystemReport();
        await testPerformance();
        await validateDataIntegrity();
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
        
        // Count products
        const productsResponse = await fetch(`${BASE_URL}/products`);
        if (productsResponse.ok) {
            const products = await productsResponse.json();
            stats.products = products.length;
        }
        
        // Count orders and calculate revenue (if authenticated)
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
        
        log('\n📈 SYSTEM REPORT', 'blue');
        log('================', 'blue');
        log(`🌾 Total Products: ${stats.products}`, 'blue');
        log(`📦 Total Orders: ${stats.orders}`, 'blue');
        log(`💰 Total Revenue: ₹${stats.totalRevenue.toFixed(2)}`, 'blue');
        
        // Get health status
        const healthResponse = await fetch(`${BASE_URL}/health`);
        if (healthResponse.ok) {
            const health = await healthResponse.json();
            log(`🏥 Server Status: ${health.status}`, 'blue');
        }
        
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
        
        // Test health check performance
        const healthStartTime = Date.now();
        const healthResponse = await fetch(`${BASE_URL}/health`);
        const healthLoadTime = Date.now() - healthStartTime;
        
        if (healthResponse.ok) {
            log(`✅ Health check completed in ${healthLoadTime}ms`, 'green');
        } else {
            log('❌ Health check performance test failed', 'red');
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
            let invalidProducts = [];
            
            for (const product of products) {
                if (product.name && product.price && product.category) {
                    validProducts++;
                } else {
                    invalidProducts.push(product._id);
                }
            }
            
            log(`✅ Product data integrity: ${validProducts}/${products.length} valid`, 'green');
            if (invalidProducts.length > 0) {
                log(`⚠️  Invalid products found: ${invalidProducts.length}`, 'yellow');
            }
        }
        
        // Validate orders
        if (authToken) {
            const ordersResponse = await fetch(`${BASE_URL}/orders`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (ordersResponse.ok) {
                const orders = await ordersResponse.json();
                let validOrders = 0;
                let invalidOrders = [];
                
                for (const order of orders) {
                    if (order.items && order.shippingAddress && order.status) {
                        validOrders++;
                    } else {
                        invalidOrders.push(order._id);
                    }
                }
                
                log(`✅ Order data integrity: ${validOrders}/${orders.length} valid`, 'green');
                if (invalidOrders.length > 0) {
                    log(`⚠️  Invalid orders found: ${invalidOrders.length}`, 'yellow');
                }
            }
        }
        
        // Validate API responses
        log('\n🔍 Validating API Response Structure...', 'yellow');
        
        // Test product structure
        const productResponse = await fetch(`${BASE_URL}/products`);
        if (productResponse.ok) {
            const products = await productResponse.json();
            if (products.length > 0) {
                const sampleProduct = products[0];
                const requiredFields = ['_id', 'name', 'price', 'category', 'farmer'];
                const missingFields = requiredFields.filter(field => !sampleProduct.hasOwnProperty(field));
                
                if (missingFields.length === 0) {
                    log('✅ Product API response structure is valid', 'green');
                } else {
                    log(`⚠️  Product API missing fields: ${missingFields.join(', ')}`, 'yellow');
                }
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
            log('✅ Invalid login properly handled (401)', 'green');
        } else {
            log(`⚠️  Invalid login returned status: ${invalidLoginResponse.status}`, 'yellow');
        }
        
        // Test invalid product access
        const invalidProductResponse = await fetch(`${BASE_URL}/products/invalid-id`);
        if (invalidProductResponse.status === 404) {
            log('✅ Invalid product access properly handled (404)', 'green');
        } else {
            log(`⚠️  Invalid product access returned status: ${invalidProductResponse.status}`, 'yellow');
        }
        
        // Test unauthorized access
        const unauthorizedResponse = await fetch(`${BASE_URL}/orders`, {
            headers: { 'Authorization': 'Bearer invalid-token' }
        });
        
        if (unauthorizedResponse.status === 401) {
            log('✅ Unauthorized access properly handled (401)', 'green');
        } else {
            log(`⚠️  Unauthorized access returned status: ${unauthorizedResponse.status}`, 'yellow');
        }
        
        // Test malformed JSON
        const malformedResponse = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: 'invalid json'
        });
        
        if (malformedResponse.status === 400) {
            log('✅ Malformed JSON properly handled (400)', 'green');
        } else {
            log(`⚠️  Malformed JSON returned status: ${malformedResponse.status}`, 'yellow');
        }
        
        // Test missing required fields
        const missingFieldsResponse = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test@test.com',
                password: 'password123'
                // Missing required fields
            })
        });
        
        if (missingFieldsResponse.status === 400) {
            log('✅ Missing required fields properly handled (400)', 'green');
        } else {
            log(`⚠️  Missing required fields returned status: ${missingFieldsResponse.status}`, 'yellow');
        }
        
    } catch (error) {
        log(`❌ Error handling test failed: ${error.message}`, 'red');
    }
}

// Initialize auth token for testing
async function initializeAuth() {
    try {
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
            log('🔑 Auth token initialized for enhanced testing', 'green');
        } else {
            log('⚠️  Could not initialize auth token, some tests may be limited', 'yellow');
        }
    } catch (error) {
        log('⚠️  Auth initialization failed, some tests may be limited', 'yellow');
    }
}

// Run if this file is executed directly
if (require.main === module) {
    initializeAuth().then(() => {
        runEnhancedFeatures().catch(console.error);
    });
}

module.exports = { runEnhancedFeatures }; 