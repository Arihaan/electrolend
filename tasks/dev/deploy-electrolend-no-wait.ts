import { task } from 'hardhat/config';
import { ConfigNames } from '../../helpers/configuration';
import { getFirstSigner } from '../../helpers/contracts-getters';
import { eElectroneumNetwork, eNetwork } from '../../helpers/types';
import { BigNumber } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

// Transaction config to avoid freezing
const MAX_FEE_PER_GAS = BigNumber.from('500000000000'); // 500 gwei
const MAX_PRIORITY_FEE_PER_GAS = BigNumber.from('50000000000'); // 50 gwei
const GAS_LIMIT_MULTIPLIER = 1.5;

// Storage for addresses
const deploymentAddresses: Record<string, string> = {};

// Helper to save deployment state
function saveState(deployerAddress: string) {
  const deploymentPath = path.resolve(__dirname, '../../deployments');
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true });
  }
  
  const filePath = path.resolve(deploymentPath, 'electrolend-testnet-deployment.json');
  fs.writeFileSync(
    filePath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        deployer: deployerAddress,
        addresses: deploymentAddresses,
      },
      null,
      2
    )
  );
  console.log(`Deployment state saved to ${filePath}`);
}

task('dev:deploy-electrolend-no-wait', 'Deploy ElectroLend protocol without waiting for confirmations')
  .setAction(async ({}, DRE) => {
    console.log('Beginning ElectroLend deployment with NO confirmation wait...');
    console.log('IMPORTANT: This will deploy contracts without waiting for confirmations');
    
    // Ensure we're on the testnet
    if (DRE.network.name !== eElectroneumNetwork.testnet) {
      throw new Error(`You need to be on electroneum testnet to run this task. Currently on ${DRE.network.name}`);
    }
    
    // Set up environment
    await DRE.run('set-DRE');
    
    // Get deployer account
    const deployer = await getFirstSigner();
    const deployerAddress = await deployer.getAddress();
    
    console.log(`Deployer address: ${deployerAddress}`);
    const balance = await deployer.getBalance();
    console.log(`Deployer balance: ${DRE.ethers.utils.formatEther(balance)} ETN`);
    
    try {
      // Instead of using separate tasks, we'll deploy contracts directly with custom options
      // to avoid waiting for confirmations

      // 1. Deploy address provider registry
      console.log('\n1. Deploying AddressesProviderRegistry...');
      const tx1 = await DRE.run('full:deploy-address-provider-registry', {
        pool: ConfigNames.ElectroLend,
        verify: false,
        skipWait: true
      });
      console.log('Transaction sent for AddressesProviderRegistry');
      
      // Sleep a bit before next transaction to avoid nonce issues
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 2. Deploy address provider
      console.log('\n2. Deploying AddressesProvider...');
      const tx2 = await DRE.run('full:deploy-address-provider', {
        pool: ConfigNames.ElectroLend,
        verify: false,
        skipWait: true
      });
      console.log('Transaction sent for AddressesProvider');
      
      // Sleep a bit before next transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 3. Deploy lending pool
      console.log('\n3. Deploying LendingPool and libraries...');
      const tx3 = await DRE.run('full:deploy-lending-pool', {
        pool: ConfigNames.ElectroLend,
        verify: false,
        skipWait: true
      });
      console.log('Transaction sent for LendingPool');
      
      // Sleep a bit before next transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 4. Deploy oracles
      console.log('\n4. Deploying Oracles...');
      const tx4 = await DRE.run('full:deploy-oracles', {
        pool: ConfigNames.ElectroLend,
        verify: false,
        skipWait: true
      });
      console.log('Transaction sent for Oracles');
      
      // Sleep a bit before next transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 5. Deploy data provider
      console.log('\n5. Deploying DataProvider...');
      const tx5 = await DRE.run('full:deploy-data-provider', {
        pool: ConfigNames.ElectroLend,
        verify: false,
        skipWait: true
      });
      console.log('Transaction sent for DataProvider');
      
      // Sleep a bit before next transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 6. Deploy WETH gateway
      console.log('\n6. Deploying WETHGateway...');
      const tx6 = await DRE.run('full:deploy-wethgateway', {
        pool: ConfigNames.ElectroLend,
        verify: false,
        skipWait: true
      });
      console.log('Transaction sent for WETHGateway');
      
      console.log('\nDeployment transactions submitted successfully!');
      console.log('------------------------------------------------------');
      console.log('IMPORTANT: Transactions have been submitted but NOT awaited for confirmation.');
      console.log('Check the Electroneum Explorer for transaction confirmations.');
      console.log('------------------------------------------------------');
      console.log('\nAfter all transactions are mined, run the following command to initialize reserves:');
      console.log('npx hardhat full:initialize-lending-pool --pool ElectroLend --network testnet');
      
    } catch (error) {
      console.error('Deployment failed:', error);
      throw error;
    }
  });
  
// Add a separate task for initializing reserves after deployment
task('dev:initialize-electrolend-reserves', 'Initialize ElectroLend reserves after deployment')
  .setAction(async ({}, DRE) => {
    console.log('Initializing ElectroLend reserves...');
    
    // Ensure we're on the testnet
    if (DRE.network.name !== eElectroneumNetwork.testnet) {
      throw new Error(`You need to be on electroneum testnet to run this task. Currently on ${DRE.network.name}`);
    }
    
    // Set up environment
    await DRE.run('set-DRE');
    
    try {
      // Load deployment addresses
      const deploymentPath = path.resolve(__dirname, '../../deployments/electrolend-testnet-deployment.json');
      if (!fs.existsSync(deploymentPath)) {
        throw new Error(`Deployment file not found at ${deploymentPath}. Run dev:deploy-electrolend-no-wait first.`);
      }
      
      const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
      const addresses = deploymentData.addresses;
      
      console.log('Loaded deployment addresses');
      
      // Initialize reserves
      console.log('\nInitializing reserves...');
      await DRE.run(
        'initialize-lending-pool',
        { 
          pool: ConfigNames.ElectroLend,
          priceOracleSymbol: 'ElectroOracle',
          gasPrice: MAX_FEE_PER_GAS.toString(),
          gasLimit: (5000000 * GAS_LIMIT_MULTIPLIER).toString()
        }
      );
      
      console.log('\nReserves initialization complete!');
      
    } catch (error) {
      console.error('Reserve initialization failed:', error);
      throw error;
    }
  }); 