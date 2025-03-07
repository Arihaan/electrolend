// Direct deployment script that doesn't wait for confirmations
// To run: node scripts/deploy-no-wait.js
require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Load contract artifacts
function loadArtifact(contractName) {
  const artifactPath = path.join(__dirname, '../artifacts/contracts', `${contractName}.sol/${contractName}.json`);
  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Artifact not found: ${artifactPath}`);
  }
  return JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
}

// CONSTANTS - ADJUST THESE BASED ON ELECTRONEUM TESTNET
const PROVIDER_URL = process.env.ELECTRONEUM_TESTNET_URL || 'https://rpc.ankr.com/electroneum_testnet';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CHAIN_ID = parseInt(process.env.ELECTRONEUM_TESTNET_CHAIN_ID || '5201420');
const MARKET_ID = 'ElectroLend genesis market';
const PROVIDER_ID = 1;

// Gas settings
const GAS_PRICE = ethers.utils.parseUnits('10', 'gwei'); // Use a sensible gas price for the network
const GAS_LIMIT = 5000000; // High gas limit to ensure transactions go through

// Deployment tracking
const deployments = {
  timestamp: new Date().toISOString(),
  transactions: [],
  addresses: {}
};

// Save deployment state
function saveDeploymentState() {
  const deploymentPath = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true });
  }
  
  const filePath = path.join(deploymentPath, 'direct-deployment.json');
  fs.writeFileSync(filePath, JSON.stringify(deployments, null, 2));
  console.log(`Deployment state saved to ${filePath}`);
}

// Deploy a contract without waiting for confirmation
async function deployWithoutWaiting(wallet, contractName, args = []) {
  console.log(`\nDeploying ${contractName}...`);
  
  try {
    const artifact = loadArtifact(contractName);
    const factory = new ethers.ContractFactory(
      artifact.abi,
      artifact.bytecode,
      wallet
    );
    
    // Create deployment transaction
    const deployTx = factory.getDeployTransaction(...args);
    
    // Add gas settings
    deployTx.gasPrice = GAS_PRICE;
    deployTx.gasLimit = GAS_LIMIT;
    
    // Send transaction without waiting
    const txResponse = await wallet.sendTransaction(deployTx);
    console.log(`Transaction sent: ${txResponse.hash}`);
    console.log(`Expected contract address: ${ethers.utils.getContractAddress({
      from: wallet.address,
      nonce: txResponse.nonce
    })}`);
    
    // Track the deployment
    const expectedAddress = ethers.utils.getContractAddress({
      from: wallet.address,
      nonce: txResponse.nonce
    });
    
    deployments.transactions.push({
      contract: contractName,
      transactionHash: txResponse.hash,
      expectedAddress: expectedAddress,
      nonce: txResponse.nonce,
      timestamp: new Date().toISOString()
    });
    
    deployments.addresses[contractName] = expectedAddress;
    saveDeploymentState();
    
    return {
      transactionHash: txResponse.hash,
      expectedAddress: expectedAddress,
      nonce: txResponse.nonce
    };
  } catch (error) {
    console.error(`Error deploying ${contractName}:`, error.message);
    throw error;
  }
}

// Main function
async function main() {
  if (!PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY is required in .env file');
  }
  
  console.log('Starting DIRECT deployment on Electroneum Testnet');
  console.log('------------------------------------------------');
  console.log('This script will send transactions without waiting for confirmations');
  console.log('Check transaction receipts on the block explorer');
  console.log('------------------------------------------------');
  
  // Set up provider and wallet
  const provider = new ethers.providers.JsonRpcProvider(PROVIDER_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const deployerAddress = wallet.address;
  
  console.log(`Deployer address: ${deployerAddress}`);
  
  try {
    // Get account balance
    const balance = await provider.getBalance(deployerAddress);
    console.log(`Balance: ${ethers.utils.formatEther(balance)} ETN`);
    
    // Step 1: Deploy LendingPoolAddressesProviderRegistry
    const registryDeployment = await deployWithoutWaiting(
      wallet, 
      'LendingPoolAddressesProviderRegistry',
      [deployerAddress]
    );
    
    // Step 2: Deploy LendingPoolAddressesProvider
    const providerDeployment = await deployWithoutWaiting(
      wallet, 
      'LendingPoolAddressesProvider',
      [MARKET_ID, deployerAddress]
    );
    
    // The rest of the deployment steps would go here, but for now let's stop after these two
    // critical steps to see if they go through correctly
    
    console.log('\nInitial deployment transactions sent!');
    console.log('-----------------------------------------');
    console.log('IMPORTANT: Verify these transactions on the block explorer:');
    console.log(`Registry: ${registryDeployment.transactionHash}`);
    console.log(`Provider: ${providerDeployment.transactionHash}`);
    console.log('-----------------------------------------');
    console.log('After confirming these deployed successfully, run the next script to continue deployment');
    
  } catch (error) {
    console.error('Deployment failed:', error);
  }
}

// Run the main function
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  }); 