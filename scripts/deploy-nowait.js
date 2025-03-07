// No-wait deployment script - just sends the transaction without waiting
require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('NO-WAIT DEPLOYMENT - Will not wait for confirmation');
  console.log('---------------------------------------------------');

  // Connect to network
  const provider = new ethers.providers.JsonRpcProvider('https://rpc.ankr.com/electroneum_testnet');
  
  // Create wallet
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const address = await wallet.getAddress();
  console.log(`Deployer: ${address}`);
  
  // Check balance and nonce
  const balance = await provider.getBalance(address);
  console.log(`Balance: ${ethers.utils.formatEther(balance)} ETN`);
  const nonce = await provider.getTransactionCount(address);
  console.log(`Current nonce: ${nonce}`);
  
  // Load registry artifact
  const registryPath = path.join(__dirname, '../artifacts/contracts/protocol/configuration/LendingPoolAddressesProviderRegistry.sol/LendingPoolAddressesProviderRegistry.json');
  const Registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  
  // Deploy Registry - use extremely high gas price (100 gwei)
  const gasPrice = ethers.utils.parseUnits('100', 'gwei');
  console.log(`Using gas price: ${ethers.utils.formatUnits(gasPrice, 'gwei')} gwei`);
  
  try {
    // Create factory
    const factory = new ethers.ContractFactory(Registry.abi, Registry.bytecode, wallet);
    
    // Create deployment transaction
    const deploymentTx = factory.getDeployTransaction(address);
    
    // Set gas options
    deploymentTx.gasPrice = gasPrice;
    deploymentTx.gasLimit = 3000000;
    
    // Just send transaction - don't wait for receipt
    console.log('\nSending transaction...');
    const tx = await wallet.sendTransaction(deploymentTx);
    console.log(`Transaction hash: ${tx.hash}`);
    
    // Calculate expected address
    const expectedAddress = ethers.utils.getContractAddress({
      from: address,
      nonce: nonce
    });
    
    console.log(`Expected contract address: ${expectedAddress}`);
    console.log('\nTransaction submitted - NOT waiting for confirmation');
    console.log('Check the explorer for confirmation status');
    console.log(`Explorer: https://explorer.electroneum.com/tx/${tx.hash}`);
    
    // Save deployment info
    const deploymentInfo = {
      contract: 'LendingPoolAddressesProviderRegistry',
      expectedAddress: expectedAddress,
      transactionHash: tx.hash,
      deployer: address,
      nonce: nonce,
      gasPrice: ethers.utils.formatUnits(gasPrice, 'gwei'),
      timestamp: new Date().toISOString()
    };
    
    const deploymentPath = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentPath)) {
      fs.mkdirSync(deploymentPath, { recursive: true });
    }
    
    const filePath = path.join(deploymentPath, 'nowait-deployment.json');
    fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`Deployment info saved to ${filePath}`);
  } catch (error) {
    console.error('Deployment error:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 