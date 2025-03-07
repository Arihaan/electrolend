// Deployment using raw JSON-RPC calls
// This avoids any potential issues with ethers.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
const axios = require('axios');

// CONTRACT TO DEPLOY: LendingPoolAddressesProviderRegistry
const artifactPath = path.join(__dirname, '../artifacts/contracts/protocol/configuration/LendingPoolAddressesProviderRegistry.sol/LendingPoolAddressesProviderRegistry.json');
const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

// CONFIGURATION
const RPC_URL = 'https://rpc.ankr.com/electroneum_testnet';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// GAS SETTINGS
const GAS_PRICE = ethers.utils.parseUnits('20', 'gwei'); // 20 gwei
const GAS_LIMIT = 4000000;

async function main() {
  console.log('Starting simplified deployment...');
  
  // Setup provider
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  console.log(`Connected to: ${RPC_URL}`);
  
  // Create wallet
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const deployerAddress = wallet.address;
  console.log(`Deployer address: ${deployerAddress}`);
  
  // Get balance and nonce
  const balance = await provider.getBalance(deployerAddress);
  console.log(`Balance: ${ethers.utils.formatEther(balance)} ETN`);
  const nonce = await provider.getTransactionCount(deployerAddress);
  console.log(`Current nonce: ${nonce}`);
  
  try {
    // Create contract factory directly with ethers.js
    console.log('Creating contract factory...');
    const factory = new ethers.ContractFactory(
      artifact.abi,
      artifact.bytecode,
      wallet
    );
    
    // Prepare overrides
    const overrides = {
      gasPrice: GAS_PRICE,
      gasLimit: GAS_LIMIT
    };
    
    console.log(`Using gas price: ${ethers.utils.formatUnits(GAS_PRICE, 'gwei')} gwei`);
    console.log(`Gas limit: ${GAS_LIMIT}`);
    
    // Deploy - note we're passing the deployer address as constructor argument
    console.log('\nDeploying contract...');
    const contract = await factory.deploy(deployerAddress, overrides);
    console.log(`Transaction hash: ${contract.deployTransaction.hash}`);
    
    // Calculate expected address
    const expectedAddress = ethers.utils.getContractAddress({
      from: deployerAddress,
      nonce: nonce
    });
    console.log(`Expected contract address: ${expectedAddress}`);
    
    // Wait for deployment to be confirmed
    console.log('\nWaiting for confirmation...');
    await contract.deployed();
    
    console.log('\nCONTRACT DEPLOYED SUCCESSFULLY!');
    console.log(`Address: ${contract.address}`);
    console.log(`Owner: ${await contract.owner()}`);
    
    // Save deployment info
    const deploymentInfo = {
      contract: 'LendingPoolAddressesProviderRegistry',
      address: contract.address,
      transactionHash: contract.deployTransaction.hash,
      owner: await contract.owner(),
      timestamp: new Date().toISOString()
    };
    
    const deploymentPath = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentPath)) {
      fs.mkdirSync(deploymentPath, { recursive: true });
    }
    
    const filePath = path.join(deploymentPath, 'successful-deployment.json');
    fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\nDeployment information saved to ${filePath}`);
    
  } catch (error) {
    console.error('\nDeployment failed:', error.message);
    
    console.log('\nPlease try:');
    console.log('1. Run this script again with a lower gas price (edit GAS_PRICE)');
    console.log('2. Use the Hardhat console method as described in deploy-console.txt');
  }
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 