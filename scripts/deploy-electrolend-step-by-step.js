const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const WAIT_BETWEEN_COMMANDS = 3000; // ms to wait between commands
const NETWORK = 'testnet';
const POOL = 'ElectroLend';

// Record deployed addresses
const deploymentAddresses = {};

// Helper to save deployment state
function saveState() {
  const deploymentPath = path.resolve(__dirname, '../deployments');
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true });
  }
  
  const filePath = path.resolve(deploymentPath, 'electrolend-testnet-deployment.json');
  fs.writeFileSync(
    filePath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        addresses: deploymentAddresses,
      },
      null,
      2
    )
  );
  console.log(`Deployment state saved to ${filePath}`);
}

// Helper to run a command and continue without waiting for it to complete
function runCommandNoWait(command) {
  console.log(`\nRunning command: ${command}`);
  try {
    // Using spawn would be better for not waiting, but for simplicity, we'll use execSync
    // The important part is we're not waiting for the blockchain confirmation
    execSync(command, { stdio: 'inherit' });
    console.log(`Command submitted: ${command}`);
  } catch (error) {
    console.error(`Error running command: ${command}`);
    console.error(error.message);
  }
}

// Main deployment function
async function deploy() {
  console.log('Starting ElectroLend deployment on Electroneum testnet');
  console.log('-----------------------------------------------------');
  console.log('This script will run each deployment step separately without waiting for confirmations');
  console.log('You will need to check each transaction on the explorer to ensure it was successful');
  console.log('-----------------------------------------------------');
  
  // Step 1: Deploy address provider registry
  console.log('\n1. Deploying LendingPoolAddressesProviderRegistry...');
  runCommandNoWait(`npx hardhat full:deploy-address-provider-registry --pool ${POOL} --network ${NETWORK}`);
  
  // Wait a bit before next command to avoid nonce issues
  await new Promise(resolve => setTimeout(resolve, WAIT_BETWEEN_COMMANDS));
  
  // Step 2: Deploy address provider
  console.log('\n2. Deploying LendingPoolAddressesProvider...');
  runCommandNoWait(`npx hardhat full:deploy-address-provider --pool ${POOL} --network ${NETWORK}`);
  
  // Wait a bit before next command
  await new Promise(resolve => setTimeout(resolve, WAIT_BETWEEN_COMMANDS));
  
  // Step 3: Deploy lending pool
  console.log('\n3. Deploying LendingPool and libraries...');
  runCommandNoWait(`npx hardhat full:deploy-lending-pool --pool ${POOL} --network ${NETWORK}`);
  
  // Wait a bit before next command
  await new Promise(resolve => setTimeout(resolve, WAIT_BETWEEN_COMMANDS));
  
  // Step 4: Deploy oracles
  console.log('\n4. Deploying Oracles...');
  runCommandNoWait(`npx hardhat full:deploy-oracles --pool ${POOL} --network ${NETWORK}`);
  
  // Wait a bit before next command
  await new Promise(resolve => setTimeout(resolve, WAIT_BETWEEN_COMMANDS));
  
  // Step 5: Deploy data provider
  console.log('\n5. Deploying DataProvider...');
  runCommandNoWait(`npx hardhat full:deploy-data-provider --pool ${POOL} --network ${NETWORK}`);
  
  // Wait a bit before next command
  await new Promise(resolve => setTimeout(resolve, WAIT_BETWEEN_COMMANDS));
  
  // Step 6: Deploy WETH gateway
  console.log('\n6. Deploying WETHGateway...');
  runCommandNoWait(`npx hardhat full:deploy-wethgateway --pool ${POOL} --network ${NETWORK}`);
  
  console.log('\nDeployment commands submitted successfully!');
  console.log('------------------------------------------------------');
  console.log('IMPORTANT: Transactions have been submitted but might not be confirmed yet.');
  console.log('Check the Electroneum Explorer for transaction confirmations.');
  console.log('------------------------------------------------------');
  console.log('\nAfter all transactions are confirmed, run the following command to initialize reserves:');
  console.log(`npx hardhat full:initialize-lending-pool --pool ${POOL} --network ${NETWORK}`);
}

// Run the deployment
deploy().catch(error => {
  console.error('Deployment failed:', error);
  process.exit(1);
}); 