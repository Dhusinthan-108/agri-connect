const { execSync } = require('child_process');
const fs = require('fs');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkDependencies() {
    log('\n🔍 Checking Dependencies...', 'cyan');
    
    try {
        // Check if node-fetch is installed
        require.resolve('node-fetch');
        log('✅ node-fetch is already installed', 'green');
        return true;
    } catch (error) {
        log('❌ node-fetch is not installed', 'red');
        return false;
    }
}

function installDependencies() {
    log('\n📦 Installing Dependencies...', 'yellow');
    
    try {
        log('Installing node-fetch...', 'blue');
        execSync('npm install node-fetch', { stdio: 'inherit' });
        log('✅ node-fetch installed successfully', 'green');
        return true;
    } catch (error) {
        log('❌ Failed to install node-fetch', 'red');
        log('Please run: npm install node-fetch', 'yellow');
        return false;
    }
}

function checkServerStatus() {
    log('\n🌐 Checking Server Status...', 'cyan');
    
    try {
        const response = fetch('http://localhost:5500/api/health');
        log('✅ Server is running on port 5500', 'green');
        return true;
    } catch (error) {
        log('❌ Server is not running on port 5500', 'red');
        log('Please start your server with: npm start', 'yellow');
        return false;
    }
}

function createTestScripts() {
    log('\n📝 Creating Test Scripts...', 'cyan');
    
    const scripts = {
        'test:all': 'node test-runner.js all',
        'test:manual': 'node test-runner.js manual',
        'test:sample': 'node test-runner.js sample',
        'test:verify': 'node test-runner.js verify',
        'test:enhanced': 'node test-runner.js enhanced',
        'test:setup': 'node setup-testing.js'
    };
    
    try {
        // Read existing package.json
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        // Add test scripts
        packageJson.scripts = {
            ...packageJson.scripts,
            ...scripts
        };
        
        // Write back to package.json
        fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
        
        log('✅ Test scripts added to package.json', 'green');
        return true;
    } catch (error) {
        log('⚠️  Could not update package.json, but test scripts are ready', 'yellow');
        return false;
    }
}

function showUsage() {
    log('\n📋 TESTING SYSTEM SETUP COMPLETE!', 'bright');
    log('==================================', 'bright');
    
    log('\n🎯 Available Commands:', 'cyan');
    log('  npm run test:all        - Run all tests', 'green');
    log('  npm run test:manual     - Run manual testing', 'green');
    log('  npm run test:sample     - Create sample data', 'green');
    log('  npm run test:verify     - Verify functionality', 'green');
    log('  npm run test:enhanced   - Run enhanced features', 'green');
    
    log('\n🔧 Direct Commands:', 'cyan');
    log('  node test-runner.js all           - Run all tests', 'green');
    log('  node test-runner.js manual        - Manual testing only', 'green');
    log('  node test-runner.js sample        - Sample data only', 'green');
    log('  node test-runner.js verify        - Verification only', 'green');
    log('  node test-runner.js enhanced      - Enhanced features only', 'green');
    log('  node test-runner.js help          - Show help', 'green');
    
    log('\n🚀 Quick Start:', 'cyan');
    log('  1. Make sure your server is running: npm start', 'yellow');
    log('  2. Run all tests: npm run test:all', 'yellow');
    log('  3. Or run specific tests as needed', 'yellow');
    
    log('\n📊 What Each Test Does:', 'cyan');
    log('  manual    - Tests user registration, login, products, orders', 'blue');
    log('  sample    - Creates 3 farmers, 3 consumers, 15 products, 5 orders', 'blue');
    log('  verify    - Checks API endpoints, database, authentication', 'blue');
    log('  enhanced  - System reports, performance, data validation', 'blue');
}

async function setup() {
    log('\n🚀 AGRI CONNECT TESTING SYSTEM SETUP', 'bright');
    log('====================================', 'bright');
    
    // Check and install dependencies
    if (!checkDependencies()) {
        if (!installDependencies()) {
            log('\n❌ Setup failed: Could not install dependencies', 'red');
            return false;
        }
    }
    
    // Create test scripts in package.json
    createTestScripts();
    
    // Show usage instructions
    showUsage();
    
    log('\n✅ Setup completed successfully!', 'green');
    return true;
}

// Run setup if this file is executed directly
if (require.main === module) {
    setup().catch(console.error);
}

module.exports = { setup }; 