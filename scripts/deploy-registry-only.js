// First step of direct deployment - just deploy the registry
// To run: node scripts/deploy-registry-only.js
require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// CONFIGURATION - ADJUST THESE FOR ELECTRONEUM
const PROVIDER_URLS = [
  'https://rpc.ankr.com/electroneum_testnet'
];
const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY || PRIVATE_KEY === 'YOUR_PRIVATE_KEY_HERE') {
  throw new Error('Please set your PRIVATE_KEY in the .env file');
}

// Try different gas settings
const GAS_OPTIONS = [
  { price: '1', limit: 2000000 },  // 1 gwei, standard limit
  { price: '0.1', limit: 2000000 }, // 0.1 gwei, standard limit
  { price: '0.01', limit: 2000000 }, // Extremely low gas price
  { price: '5', limit: 5000000 },   // Higher gas price, higher limit
];

// Load a contract artifact
function loadArtifact(contractName) {
  try {
    const contractsPath = path.join(__dirname, '../artifacts/contracts');
    
    // Try to find the contract recursively
    function findContractRecursively(dir, contractName) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          const result = findContractRecursively(filePath, contractName);
          if (result) return result;
        } else if (file === `${contractName}.json`) {
          return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
      }
      return null;
    }
    
    const artifact = findContractRecursively(contractsPath, contractName);
    if (!artifact) {
      throw new Error(`Artifact not found for ${contractName}`);
    }
    
    return artifact;
  } catch (error) {
    console.error(`Error loading artifact for ${contractName}:`, error.message);
    throw error;
  }
}

async function trySendTransaction(provider, wallet, deployTx, gasOption) {
  try {
    deployTx.gasPrice = ethers.utils.parseUnits(gasOption.price, 'gwei');
    deployTx.gasLimit = gasOption.limit;
    
    console.log(`Trying with gas price: ${gasOption.price} gwei, limit: ${gasOption.limit}`);
    
    // Send the transaction
    const tx = await wallet.sendTransaction(deployTx);
    console.log('Transaction sent:', tx.hash);
    return tx;
  } catch (error) {
    console.log(`Failed with gas price: ${gasOption.price} gwei:`, error.message);
    return null;
  }
}

async function main() {
  console.log('Deploying ONLY the LendingPoolAddressesProviderRegistry contract');
  console.log('-----------------------------------------------------------');
  console.log('This script will try multiple RPC URLs and gas configurations');
  console.log('-----------------------------------------------------------');
  
  let provider;
  
  // Try each provider URL until one works
  for (const url of PROVIDER_URLS) {
    try {
      console.log(`Trying provider URL: ${url}`);
      provider = new ethers.providers.JsonRpcProvider(url);
      
      // Simple test to see if provider is responsive
      const blockNumber = await provider.getBlockNumber();
      console.log(`Success! Connected to ${url}, block number: ${blockNumber}`);
      break;
    } catch (error) {
      console.log(`Failed to connect to ${url}:`, error.message);
      provider = null;
    }
  }
  
  if (!provider) {
    throw new Error('Failed to connect to any provider URL');
  }
  
  // Setup wallet with the working provider
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const deployerAddress = wallet.address;
  
  console.log(`\nDeployer address: ${deployerAddress}`);
  
  try {
    // Get nonce
    const nonce = await provider.getTransactionCount(deployerAddress);
    console.log(`Current nonce: ${nonce}`);
    
    // Get balance
    const balance = await provider.getBalance(deployerAddress);
    console.log(`Balance: ${ethers.utils.formatEther(balance)} ETN`);
    
    // Load the registry contract
    const artifact = loadArtifact('LendingPoolAddressesProviderRegistry');
    console.log('Contract artifact loaded successfully');
    
    // Create contract factory
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
    
    // Prepare deployment transaction
    const deployTx = factory.getDeployTransaction(deployerAddress);
    
    // Try each gas option until one works
    let tx = null;
    for (const gasOption of GAS_OPTIONS) {
      tx = await trySendTransaction(provider, wallet, deployTx, gasOption);
      if (tx) break;
    }
    
    if (!tx) {
      throw new Error('Failed to send transaction with any gas configuration');
    }
    
    // Calculate expected contract address
    const expectedAddress = ethers.utils.getContractAddress({
      from: deployerAddress,
      nonce: nonce
    });
    
    console.log('\nTransaction sent successfully!');
    console.log('-----------------------------------------------------------');
    console.log(`Transaction hash: ${tx.hash}`);
    console.log(`Expected contract address: ${expectedAddress}`);
    console.log('-----------------------------------------------------------');
    
    // Save the deployment information
    const deploymentInfo = {
      contract: 'LendingPoolAddressesProviderRegistry',
      transactionHash: tx.hash,
      expectedAddress: expectedAddress,
      nonce: nonce,
      timestamp: new Date().toISOString(),
      deployer: deployerAddress
    };
    
    const deploymentPath = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentPath)) {
      fs.mkdirSync(deploymentPath, { recursive: true });
    }
    
    const filePath = path.join(deploymentPath, 'registry-deployment.json');
    fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`Deployment information saved to ${filePath}`);
    
    console.log('\nIMPORTANT NEXT STEPS:');
    console.log('1. Check the transaction on the Electroneum Explorer');
    console.log('2. After it confirms, run the next deployment step');
    
  } catch (error) {
    console.error('Deployment failed:', error);
  }
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  }); 