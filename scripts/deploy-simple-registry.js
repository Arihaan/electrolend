// Simple deployment script for the LendingPoolAddressesProviderRegistry contract
// Usage: node scripts/deploy-simple-registry.js

require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Load contract artifact
const artifactPath = path.join(__dirname, '../artifacts/contracts/protocol/configuration/LendingPoolAddressesProviderRegistry.sol/LendingPoolAddressesProviderRegistry.json');
const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

// Configuration
const RPC_URL = process.env.ELECTRONEUM_TESTNET_URL || 'https://rpc.ankr.com/electroneum_testnet';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Gas settings that are high but within block gas limit
const GAS_PRICE = ethers.utils.parseUnits('1000', 'gwei');  // 1000 gwei (high but reasonable)
const GAS_LIMIT = 3000000;  // 3 million (below block gas limit)

async function main() {
  // Validate private key
  if (!PRIVATE_KEY) {
    throw new Error('Missing PRIVATE_KEY in .env file');
  }

  console.log('Starting simple deployment of LendingPoolAddressesProviderRegistry');
  console.log('--------------------------------------------------');

  // Connect to provider
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const deployerAddress = wallet.address;

  console.log(`Deployer address: ${deployerAddress}`);
  const balance = await wallet.getBalance();
  console.log(`Deployer balance: ${ethers.utils.formatEther(balance)} ETN`);

  if (balance.lt(ethers.utils.parseEther('2'))) {
    console.warn('Warning: Deployer balance is low. Consider adding more ETN.');
  }

  // Create contract factory
  const factory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    wallet
  );

  // Deploy contract with extremely high gas settings
  console.log('\nDeploying LendingPoolAddressesProviderRegistry...');
  console.log('Using gas price:', ethers.utils.formatUnits(GAS_PRICE, 'gwei'), 'gwei');
  console.log('Using gas limit:', GAS_LIMIT);
  
  const contract = await factory.deploy(deployerAddress, {
    gasPrice: GAS_PRICE,
    gasLimit: GAS_LIMIT
  });

  console.log(`Deployment transaction sent: ${contract.deployTransaction.hash}`);
  console.log('Waiting for confirmation (this may take a while)...');

  await contract.deployed();

  console.log(`\nSuccess! Contract deployed at: ${contract.address}`);
  
  // Save deployment info
  const deploymentPath = path.resolve(__dirname, '../deployments');
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true });
  }
  
  const deploymentInfo = {
    timestamp: new Date().toISOString(),
    network: 'electroneum_testnet',
    contract: 'LendingPoolAddressesProviderRegistry',
    address: contract.address,
    deployer: deployerAddress,
    transactionHash: contract.deployTransaction.hash
  };
  
  const filePath = path.resolve(deploymentPath, 'registry-deployment.json');
  fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`Deployment info saved to ${filePath}`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Deployment failed with error:');
    console.error(error);
    process.exit(1);
  }); 