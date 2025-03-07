// EIP-1559 compatible deployment script for Electroneum testnet
// To run: node scripts/deploy-eip1559.js
require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Simple settings - using single RPC
const PROVIDER_URL = 'https://rpc.ankr.com/electroneum_testnet';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// EIP-1559 gas settings
const MAX_FEE_PER_GAS = ethers.utils.parseUnits('50', 'gwei');        // 50 gwei max fee
const MAX_PRIORITY_FEE_PER_GAS = ethers.utils.parseUnits('2', 'gwei'); // 2 gwei priority fee
const GAS_LIMIT = 3000000;

// Directly load the registry contract
function loadRegistryContract() {
  try {
    const artifactPath = path.join(__dirname, '../artifacts/contracts/protocol/configuration/LendingPoolAddressesProviderRegistry.sol/LendingPoolAddressesProviderRegistry.json');
    if (!fs.existsSync(artifactPath)) {
      throw new Error(`Artifact not found at: ${artifactPath}`);
    }
    return JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  } catch (error) {
    console.error('Error loading registry contract:', error.message);
    throw error;
  }
}

// Save deployment information
function saveDeployment(txHash, expectedAddress, nonce, deployerAddress) {
  try {
    const deploymentInfo = {
      contract: 'LendingPoolAddressesProviderRegistry',
      transactionHash: txHash,
      expectedAddress: expectedAddress,
      nonce: nonce,
      timestamp: new Date().toISOString(),
      deployer: deployerAddress
    };
    
    const deploymentPath = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentPath)) {
      fs.mkdirSync(deploymentPath, { recursive: true });
    }
    
    const filePath = path.join(deploymentPath, 'eip1559-deployment.json');
    fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`Deployment information saved to ${filePath}`);
  } catch (error) {
    console.error('Error saving deployment info:', error.message);
  }
}

async function main() {
  console.log('Deploying with EIP-1559 transaction format');
  console.log('------------------------------------------');
  
  if (!PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY is required in .env file');
  }
  
  // Set up provider
  console.log(`Using RPC: ${PROVIDER_URL}`);
  const provider = new ethers.providers.JsonRpcProvider(PROVIDER_URL);
  
  // Check if EIP-1559 is supported
  let feeData;
  try {
    feeData = await provider.getFeeData();
    console.log('Fee data from network:', {
      maxFeePerGas: feeData.maxFeePerGas ? ethers.utils.formatUnits(feeData.maxFeePerGas, 'gwei') + ' gwei' : 'not available',
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? ethers.utils.formatUnits(feeData.maxPriorityFeePerGas, 'gwei') + ' gwei' : 'not available',
      gasPrice: feeData.gasPrice ? ethers.utils.formatUnits(feeData.gasPrice, 'gwei') + ' gwei' : 'not available'
    });
    
    if (!feeData.maxFeePerGas) {
      console.log('NOTE: EIP-1559 doesn\'t seem to be supported by the network.');
      console.log('Continuing with type-2 transaction format anyway...');
    }
  } catch (error) {
    console.warn('Warning: Could not get fee data from network:', error.message);
    console.log('Continuing with custom fee values...');
  }
  
  // Set up wallet
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const deployerAddress = wallet.address;
  
  console.log(`Deployer address: ${deployerAddress}`);
  
  // Get deployment info
  const nonce = await provider.getTransactionCount(deployerAddress);
  console.log(`Current nonce: ${nonce}`);
  
  const balance = await provider.getBalance(deployerAddress);
  console.log(`Balance: ${ethers.utils.formatEther(balance)} ETN`);
  
  // Load registry contract
  console.log('Loading registry contract...');
  const registryArtifact = loadRegistryContract();
  
  // Create contract factory
  const factory = new ethers.ContractFactory(
    registryArtifact.abi,
    registryArtifact.bytecode,
    wallet
  );
  
  // Prepare deployment transaction
  const deployTx = factory.getDeployTransaction(deployerAddress);
  
  // Setup gas parameters using EIP-1559 fields
  deployTx.maxFeePerGas = MAX_FEE_PER_GAS;
  deployTx.maxPriorityFeePerGas = MAX_PRIORITY_FEE_PER_GAS;
  deployTx.gasLimit = GAS_LIMIT;
  
  // Remove gasPrice if present (not compatible with EIP-1559)
  if ('gasPrice' in deployTx) {
    delete deployTx.gasPrice;
  }
  
  console.log(`Using maxFeePerGas: ${ethers.utils.formatUnits(MAX_FEE_PER_GAS, 'gwei')} gwei`);
  console.log(`Using maxPriorityFeePerGas: ${ethers.utils.formatUnits(MAX_PRIORITY_FEE_PER_GAS, 'gwei')} gwei`);
  console.log(`Gas limit: ${GAS_LIMIT}`);
  
  try {
    // Send transaction
    console.log('Sending EIP-1559 transaction...');
    const tx = await wallet.sendTransaction(deployTx);
    
    // Calculate expected contract address
    const expectedAddress = ethers.utils.getContractAddress({
      from: deployerAddress,
      nonce: nonce
    });
    
    console.log('\nTransaction sent:');
    console.log(`Hash: ${tx.hash}`);
    console.log(`Expected contract address: ${expectedAddress}`);
    
    // Save deployment info
    saveDeployment(tx.hash, expectedAddress, nonce, deployerAddress);
    
    // Don't wait for confirmation
    console.log('\nNOTE: Not waiting for confirmation to avoid script hanging.');
    console.log('Check the explorer manually for confirmation.');
    
  } catch (error) {
    console.error('\nTransaction failed:', error.message);
    
    // Try again with legacy transaction type
    if (error.message.includes('EIP-1559') || error.message.includes('type')) {
      console.log('\nEIP-1559 transaction failed. Trying legacy transaction type...');
      
      try {
        const legacyDeployTx = factory.getDeployTransaction(deployerAddress);
        
        // Set regular gasPrice for legacy transaction
        legacyDeployTx.gasPrice = ethers.utils.parseUnits('20', 'gwei');
        legacyDeployTx.gasLimit = GAS_LIMIT;
        
        // Set type explicitly to legacy (0)
        legacyDeployTx.type = 0;
        
        console.log(`Using legacy transaction with gasPrice: ${ethers.utils.formatUnits(legacyDeployTx.gasPrice, 'gwei')} gwei`);
        
        const legacyTx = await wallet.sendTransaction(legacyDeployTx);
        
        console.log('\nLegacy transaction sent:');
        console.log(`Hash: ${legacyTx.hash}`);
        console.log(`Expected contract address: ${ethers.utils.getContractAddress({
          from: deployerAddress,
          nonce: nonce
        })}`);
        
      } catch (legacyError) {
        console.error('\nLegacy transaction also failed:', legacyError.message);
      }
    }
    
    console.log('\nTry modifying gas parameters in the script:');
    console.log('1. Change MAX_FEE_PER_GAS and MAX_PRIORITY_FEE_PER_GAS');
    console.log('2. Try the deploy-simple.js script with regular gas params');
  }
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 