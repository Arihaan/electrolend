// Ultra simple web3.js deployment
require('dotenv').config();
const Web3 = require('web3');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('SIMPLIFIED WEB3 DEPLOYMENT');
  console.log('-------------------------');

  // Load contract data
  const contractPath = path.join(__dirname, '../artifacts/contracts/protocol/configuration/LendingPoolAddressesProviderRegistry.sol/LendingPoolAddressesProviderRegistry.json');
  const contractData = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  const abi = contractData.abi;
  const bytecode = contractData.bytecode;

  // Connect to Electroneum testnet
  // Try different RPC endpoint than what we've been using
  const web3 = new Web3('https://testnet-rpc.electroneum.com');
  
  // Add account
  const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
  web3.eth.accounts.wallet.add(account);
  const deployer = account.address;
  
  console.log(`Deployer address: ${deployer}`);
  
  // Check balance
  const balance = await web3.eth.getBalance(deployer);
  console.log(`Balance: ${web3.utils.fromWei(balance, 'ether')} ETN`);
  
  try {
    console.log('Creating contract instance...');
    const contract = new web3.eth.Contract(abi);
    
    console.log('Preparing deploy transaction...');
    const deployTx = contract.deploy({
      data: bytecode,
      arguments: [deployer]
    });
    
    const gasPrice = web3.utils.toWei('150', 'gwei');
    console.log(`Using gas price: ${web3.utils.fromWei(gasPrice, 'gwei')} gwei`);
    
    console.log('Estimating gas...');
    const gas = Math.round((await deployTx.estimateGas({ from: deployer })) * 1.5);
    console.log(`Gas limit (with 50% buffer): ${gas}`);
    
    console.log('Sending transaction - will wait for receipt...');
    const deployedContract = await deployTx.send({
      from: deployer,
      gas,
      gasPrice,
    });
    
    console.log(`Contract deployed at: ${deployedContract.options.address}`);
    console.log(`Transaction hash: ${deployedContract.transactionHash}`);
    
    // Save the result
    const deploymentInfo = {
      contract: 'LendingPoolAddressesProviderRegistry',
      address: deployedContract.options.address,
      transactionHash: deployedContract.transactionHash,
      deployer,
      timestamp: new Date().toISOString()
    };
    
    const deploymentPath = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentPath)) {
      fs.mkdirSync(deploymentPath, { recursive: true });
    }
    
    const filePath = path.join(deploymentPath, 'web3-deployment.json');
    fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`Deployment info saved to ${filePath}`);
    
    return deployedContract.options.address;
  } catch (error) {
    console.error('Deployment failed with error:');
    console.error(error);
    return null;
  }
}

main()
  .then(result => {
    if (result) {
      console.log(`✅ Deployment successful! Contract address: ${result}`);
      process.exit(0);
    } else {
      console.log('❌ Deployment failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 