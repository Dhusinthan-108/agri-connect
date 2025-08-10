const { runManualTests } = require('./test-manual.js');
const { createSampleData } = require('./test-sample-data.js');
const { verifyFunctionality } = require('./test-verify.js');
const { runEnhancedFeatures } = require('./test-enhanced.js');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function runAllTests() {
    log('\n🚀 AGRI CONNECT COMPREHENSIVE TESTING SYSTEM', 'bright');
    log('==============================================', 'bright');
    log('This system will test all functionality of your AgriConnect project', 'blue');
    
    const startTime = Date.now();
    
    try {
        // A) Manual Testing
        log('\n🎯 PHASE A: MANUAL TESTING', 'cyan');
        log('==========================', 'cyan');
        await runManualTests();
        
        // B) Sample Data Creation
        log('\n🎯 PHASE B: SAMPLE DATA CREATION', 'magenta');
        log('================================', 'magenta');
        await createSampleData();
        
        // C) Functionality Verification
        log('\n🎯 PHASE C: FUNCTIONALITY VERIFICATION', 'yellow');
        log('=====================================', 'yellow');
        await verifyFunctionality();
        
        // D) Enhanced Features
        log('\n🎯 PHASE D: ENHANCED FEATURES', 'green');
        log('============================', 'green');
        await runEnhancedFeatures();
        
        const totalTime = Date.now() - startTime;
        
        log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!', 'bright');
        log('====================================', 'bright');
        log(`⏱️  Total execution time: ${totalTime}ms`, 'blue');
        log('\n📋 SUMMARY:', 'cyan');
        log('✅ Manual testing completed', 'green');
        log('✅ Sample data created', 'green');
        log('✅ Functionality verified', 'green');
        log('✅ Enhanced features tested', 'green');
        log('\n🎯 Your AgriConnect system is ready for production!', 'bright');
        
    } catch (error) {
        log(`\n❌ Test execution failed: ${error.message}`, 'red');
        process.exit(1);
    }
}

async function runSpecificTest(testType) {
    log(`\n🎯 RUNNING ${testType.toUpperCase()} TESTS`, 'cyan');
    log('================================', 'cyan');
    
    const startTime = Date.now();
    
    try {
        switch (testType.toLowerCase()) {
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
            default:
                log(`❌ Unknown test type: ${testType}`, 'red');
                log('Available test types: manual, sample, verify, enhanced, all', 'yellow');
                return;
        }
        
        const totalTime = Date.now() - startTime;
        log(`\n✅ ${testType} tests completed in ${totalTime}ms`, 'green');
        
    } catch (error) {
        log(`\n❌ ${testType} tests failed: ${error.message}`, 'red');
        process.exit(1);
    }
}

function showHelp() {
    log('\n📋 AGRI CONNECT TESTING SYSTEM - HELP', 'cyan');
    log('=====================================', 'cyan');
    log('\nAvailable Commands:', 'blue');
    log('  node test-runner.js all           - Run all tests (default)', 'green');
    log('  node test-runner.js manual        - Run manual testing only', 'green');
    log('  node test-runner.js sample        - Create sample data only', 'green');
    log('  node test-runner.js verify        - Verify functionality only', 'green');
    log('  node test-runner.js enhanced      - Run enhanced features only', 'green');
    log('  node test-runner.js help          - Show this help message', 'green');
    
    log('\nTest Descriptions:', 'blue');
    log('  manual    - Tests user registration, login, product creation, and order flow', 'yellow');
    log('  sample    - Creates sample users, products, and orders for testing', 'yellow');
    log('  verify    - Verifies API endpoints, database connectivity, and system health', 'yellow');
    log('  enhanced  - Generates system reports, tests performance, and validates data', 'yellow');
    log('  all       - Runs all tests in sequence (A → B → C → D)', 'yellow');
    
    log('\nPrerequisites:', 'blue');
    log('  - Backend server must be running on port 5500', 'yellow');
    log('  - MongoDB must be connected', 'yellow');
    log('  - node-fetch package must be installed', 'yellow');
    
    log('\nExample Usage:', 'blue');
    log('  npm install node-fetch', 'green');
    log('  node test-runner.js all', 'green');
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'all';
    
    if (command === 'help' || command === '--help' || command === '-h') {
        showHelp();
        return;
    }
    
    if (command === 'all') {
        await runAllTests();
    } else {
        await runSpecificTest(command);
    }
}

// Run if this file is executed directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    runAllTests,
    runSpecificTest,
    showHelp
}; 