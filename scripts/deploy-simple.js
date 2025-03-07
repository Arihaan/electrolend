// Simple direct deployment script for Electroneum testnet
// To run: node scripts/deploy-simple.js
require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// IMPORTANT - SINGLE RPC and SIMPLE GAS SETTINGS
const PROVIDER_URL = 'https://rpc.ankr.com/electroneum_testnet';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Very simple gas settings
const GAS_PRICE = '20000000000'; // 20 gwei in wei
const GAS_LIMIT = 3000000;

// Directly load the registry contract (without recursive searching)
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

async function main() {
  console.log('Simple direct deployment of registry to Electroneum testnet');
  console.log('-------------------------------------------------------');
  
  if (!PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY is required in .env file');
  }
  
  // Set up provider
  console.log(`Using RPC: ${PROVIDER_URL}`);
  const provider = new ethers.providers.JsonRpcProvider(PROVIDER_URL);
  
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
  
  // Prepare the transaction
  const deployTx = factory.getDeployTransaction(deployerAddress);
  
  // Set the gas parameters
  deployTx.gasPrice = GAS_PRICE;
  deployTx.gasLimit = GAS_LIMIT;
  
  console.log(`Using gas price: ${ethers.utils.formatUnits(GAS_PRICE, 'gwei')} gwei, limit: ${GAS_LIMIT}`);
  
  try {
    // Send the transaction
    console.log('Sending transaction...');
    const tx = await wallet.sendTransaction(deployTx);
    
    // Calculate expected contract address
    const expectedAddress = ethers.utils.getContractAddress({
      from: deployerAddress,
      nonce: nonce
    });
    
    console.log('\nTransaction sent:');
    console.log(`Hash: ${tx.hash}`);
    console.log(`Expected address: ${expectedAddress}`);
    
    // Don't wait for confirmation
    console.log('\nNOTE: Not waiting for confirmation to avoid script hanging.');
    console.log('Check the explorer manually for confirmation.');
    
  } catch (error) {
    console.error('\nTransaction failed:', error.message);
    
    // Additional error diagnosis
    console.log('\nError diagnosis:');
    if (error.message.includes('insufficient funds')) {
      console.log('- You may not have enough ETN to cover gas fees');
    }
    else if (error.message.includes('nonce')) {
      console.log('- Nonce issue - you may have pending transactions');
    }
    else if (error.message.includes('gas')) {
      console.log('- Gas issue - try increasing the gas price or limit');
    }
    else if (error.message.includes('network')) {
      console.log('- Network connection issue - check your internet connection');
    }
    
    console.log('\nTry these options:');
    console.log('1. Edit the GAS_PRICE and GAS_LIMIT in the script');
    console.log('2. Make sure you have enough ETN for deployment');
    console.log('3. Check for pending transactions with the same nonce');
  }
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 