// Simple deployment script that actually waits for confirmations
// This will NOT exit until the contract is confirmed on testnet
require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Settings - using single RPC with high gas price to ensure it works
const PROVIDER_URL = 'https://rpc.ankr.com/electroneum_testnet';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const GAS_PRICE = ethers.utils.parseUnits('50', 'gwei'); // 50 gwei - high to ensure it goes through
const GAS_LIMIT = 4000000; // 4M gas limit

// Load the registry contract
function loadRegistry() {
  const artifactPath = path.join(__dirname, '../artifacts/contracts/protocol/configuration/LendingPoolAddressesProviderRegistry.sol/LendingPoolAddressesProviderRegistry.json');
  return JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
}

async function main() {
  console.log('ELECTRONEUM TESTNET DEPLOYMENT - Will wait for confirmation');
  console.log('-----------------------------------------------------');
  
  // Setup provider and wallet
  const provider = new ethers.providers.JsonRpcProvider(PROVIDER_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const deployerAddress = wallet.address;
  
  console.log(`Deployer: ${deployerAddress}`);
  const balance = await provider.getBalance(deployerAddress);
  console.log(`Balance: ${ethers.utils.formatEther(balance)} ETN`);
  
  // Load contract artifact
  const registryArtifact = loadRegistry();
  
  // Deploy contract
  console.log('\nDeploying LendingPoolAddressesProviderRegistry...');
  const factory = new ethers.ContractFactory(
    registryArtifact.abi, 
    registryArtifact.bytecode, 
    wallet
  );
  
  // Create deployment transaction with high gas price
  const deployTx = await factory.getDeployTransaction(deployerAddress);
  deployTx.gasPrice = GAS_PRICE;
  deployTx.gasLimit = GAS_LIMIT;
  
  console.log(`Using gas price: ${ethers.utils.formatUnits(GAS_PRICE, 'gwei')} gwei`);
  console.log(`Gas limit: ${GAS_LIMIT}`);
  
  // Send and wait for transaction
  console.log('\nSending transaction...');
  const tx = await wallet.sendTransaction(deployTx);
  console.log(`Transaction hash: ${tx.hash}`);
  
  console.log('\nWaiting for confirmation (this may take a while)...');
  const receipt = await tx.wait(1); // Wait for 1 confirmation
  
  console.log('\nTRANSACTION CONFIRMED!');
  console.log('-----------------------------------------------------');
  console.log(`Block: ${receipt.blockNumber}`);
  console.log(`Contract address: ${receipt.contractAddress}`);
  console.log(`Gas used: ${receipt.gasUsed.toString()}`);
  console.log(`Status: ${receipt.status === 1 ? 'Success' : 'Failed'}`);
  
  // Save deployment information
  const deploymentInfo = {
    contract: 'LendingPoolAddressesProviderRegistry',
    address: receipt.contractAddress,
    transactionHash: receipt.transactionHash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString(),
    status: receipt.status,
    timestamp: new Date().toISOString()
  };
  
  const deploymentPath = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true });
  }
  
  const filePath = path.join(deploymentPath, 'confirmed-deployment.json');
  fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\nDeployment information saved to ${filePath}`);
  
  // Quick verification - try to get the contract
  try {
    console.log('\nVerifying contract deployment...');
    const deployedRegistry = new ethers.Contract(
      receipt.contractAddress,
      registryArtifact.abi,
      provider
    );
    
    // Try to call a read method to verify it's deployed properly
    const owner = await deployedRegistry.owner();
    console.log(`Contract owner: ${owner}`);
    console.log('Contract verified and working!');
  } catch (error) {
    console.error('Error verifying contract:', error.message);
  }
  
  console.log('\nDeployment completed successfully!');
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Deployment failed:', error);
    process.exit(1);
  }); 