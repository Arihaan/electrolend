// ElectroLend Oracle Setup for Electroneum Testnet
// This script properly connects the ElectroOracle with the SimplePriceFeed and sets prices
// Usage: node scripts/setup-electrolend-oracle.js

const { ethers } = require('hardhat');
require('dotenv').config();

// Transaction config to avoid freezing
const TX_WAIT_CONFIRMATIONS = 1;
const MAX_FEE_PER_GAS = ethers.utils.parseUnits('500', 'gwei');
const MAX_PRIORITY_FEE_PER_GAS = ethers.utils.parseUnits('50', 'gwei');
const GAS_LIMIT_MULTIPLIER = 1.2;

// Oracle configurations
const ORACLE_CONFIG = {
  BASE_CURRENCY: ethers.constants.AddressZero, // USD
  BASE_CURRENCY_UNIT: '100000000', // 10^8
  PRICE_FEED_ADDRESS: process.env.SIMPLE_PRICE_FEED_ADDRESS || '0xFba006047BCeCc6E7402D8ae7a3ddCB8DB1CFf53',
  PRICES: {
    'ETN': '500000',      // $0.005 * 10^8
    'USDC': '100000000',  // $1.00 * 10^8
    'USDT': '100000000',  // $1.00 * 10^8
  },
  TOKEN_ADDRESSES: {
    'WETN': process.env.WETN_ADDRESS || '0x154c9fD7F006b92b6afa746098d8081A831DC1FC',
    'TUSDC': process.env.TUSDC_ADDRESS || '0x9a110A3Ecc8704e93Bd4FA1bA44D5CF93327202B',
    'TUSDT': process.env.TUSDT_ADDRESS || '0x02FeC8c559fB598762df8D033bD7A3Df9b374771',
  },
  TOKEN_SYMBOLS: {
    'WETN': 'ETN',
    'TUSDC': 'USDC',
    'TUSDT': 'USDT',
  }
};

// Helper for transactions
async function sendTx(contract, methodName, args = [], value = 0) {
  console.log(`\nExecuting ${methodName} on ${contract.address}...`);
  
  const gasEstimate = await contract.estimateGas[methodName](...args, { value });
  const adjustedGasLimit = Math.floor(Number(gasEstimate) * GAS_LIMIT_MULTIPLIER);
  
  const tx = await contract[methodName](...args, {
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
    gasLimit: adjustedGasLimit,
    value,
  });
  
  console.log(`Transaction sent: ${tx.hash}`);
  
  const receipt = await tx.wait(TX_WAIT_CONFIRMATIONS);
  
  console.log(`Transaction confirmed: ${tx.hash}`);
  
  return tx;
}

async function setupOracle() {
  console.log('Starting ElectroLend Oracle Setup on Electroneum Testnet');
  console.log('-----------------------------------------------------');
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  
  console.log(`Using account: ${deployerAddress}`);
  
  console.log('\nFetching contracts...');
  
  // Step 1: Get the LendingPoolAddressesProvider
  const lpAddressProviderAddress = process.env.ADDRESS_PROVIDER || await promptForAddress('What is the LendingPoolAddressesProvider address?');
  const addressesProvider = await ethers.getContractAt('LendingPoolAddressesProvider', lpAddressProviderAddress);
  
  console.log(`Using LendingPoolAddressesProvider at: ${addressesProvider.address}`);
  
  // Step 2: Check if ElectroOracle is already deployed
  let electroOracleAddress = await addressesProvider.getPriceOracle();
  let electroOracle;
  
  if (electroOracleAddress === ethers.constants.AddressZero) {
    console.log('\nNo ElectroOracle found. Deploying new ElectroOracle...');
    
    // Deploy ElectroOracle
    const ElectroOracleFactory = await ethers.getContractFactory('ElectroOracle');
    electroOracle = await ElectroOracleFactory.deploy(
      ORACLE_CONFIG.BASE_CURRENCY,
      ORACLE_CONFIG.BASE_CURRENCY_UNIT,
      deployerAddress,
      {
        maxFeePerGas: MAX_FEE_PER_GAS,
        maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
      }
    );
    
    await electroOracle.deployTransaction.wait(TX_WAIT_CONFIRMATIONS);
    console.log(`ElectroOracle deployed to: ${electroOracle.address}`);
    
    // Set ElectroOracle in the addresses provider
    await sendTx(addressesProvider, 'setPriceOracle', [electroOracle.address]);
  } else {
    console.log(`Found existing ElectroOracle at: ${electroOracleAddress}`);
    electroOracle = await ethers.getContractAt('ElectroOracle', electroOracleAddress);
  }
  
  // Step 3: Check if SimplePriceFeed exists
  const simplePriceFeed = await ethers.getContractAt('SimplePriceFeed', ORACLE_CONFIG.PRICE_FEED_ADDRESS);
  
  try {
    // Check if we have access to the SimplePriceFeed
    const owner = await simplePriceFeed.owner();
    console.log(`SimplePriceFeed owner: ${owner}`);
    
    const isDeployerOwner = owner.toLowerCase() === deployerAddress.toLowerCase();
    const isDeployerUpdater = await simplePriceFeed.updaters(deployerAddress);
    
    if (!isDeployerOwner && !isDeployerUpdater) {
      console.log('Warning: Deployer is not owner or updater of SimplePriceFeed. Prices may not be updated.');
    }
  } catch (error) {
    console.error(`Error connecting to SimplePriceFeed at ${ORACLE_CONFIG.PRICE_FEED_ADDRESS}:`, error.message);
    console.error('Please make sure the SimplePriceFeed contract is deployed at this address.');
    process.exit(1);
  }
  
  // Step 4: Deploy or get SimplePriceFeedAdapter
  let simplePriceFeedAdapter;
  let needToInitOracle = false;
  
  try {
    const adapterAddress = await electroOracle.getAdapter();
    console.log(`Found existing SimplePriceFeedAdapter at: ${adapterAddress}`);
    simplePriceFeedAdapter = await ethers.getContractAt('SimplePriceFeedAdapter', adapterAddress);
  } catch (error) {
    console.log('No adapter found. Deploying new SimplePriceFeedAdapter...');
    
    const SimplePriceFeedAdapterFactory = await ethers.getContractFactory('SimplePriceFeedAdapter');
    simplePriceFeedAdapter = await SimplePriceFeedAdapterFactory.deploy(
      ORACLE_CONFIG.PRICE_FEED_ADDRESS,
      deployerAddress,
      {
        maxFeePerGas: MAX_FEE_PER_GAS,
        maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
      }
    );
    
    await simplePriceFeedAdapter.deployTransaction.wait(TX_WAIT_CONFIRMATIONS);
    console.log(`SimplePriceFeedAdapter deployed to: ${simplePriceFeedAdapter.address}`);
    
    needToInitOracle = true;
  }
  
  // Step 5: Initialize ElectroOracle with adapter if needed
  if (needToInitOracle) {
    await sendTx(electroOracle, 'initialize', [simplePriceFeedAdapter.address]);
  }
  
  // Step 6: Set up asset symbols in the adapter
  console.log('\nSetting up token symbols in adapter...');
  const tokenKeys = Object.keys(ORACLE_CONFIG.TOKEN_ADDRESSES);
  const tokenAddresses = tokenKeys.map(key => ORACLE_CONFIG.TOKEN_ADDRESSES[key]);
  const tokenSymbols = tokenKeys.map(key => ORACLE_CONFIG.TOKEN_SYMBOLS[key]);
  
  await sendTx(simplePriceFeedAdapter, 'setAssetSymbols', [tokenAddresses, tokenSymbols]);
  
  // Step 7: Update prices in SimplePriceFeed
  console.log('\nUpdating prices in SimplePriceFeed...');
  const priceKeys = Object.keys(ORACLE_CONFIG.PRICES);
  const priceValues = Object.values(ORACLE_CONFIG.PRICES);
  
  try {
    // First check if we can update prices
    await sendTx(simplePriceFeed, 'updatePrices', [priceKeys, priceValues]);
    
    // Verify prices were correctly set
    for (const symbol of priceKeys) {
      const price = await simplePriceFeed.getLatestPrice(symbol);
      console.log(`Price for ${symbol}: ${price.toString()}`);
    }
  } catch (error) {
    console.warn(`Couldn't update prices: ${error.message}`);
    console.warn('The deployer may not have permission to update the SimplePriceFeed.');
    console.warn('Please contact the SimplePriceFeed owner to update prices.');
  }
  
  // Step 8: Test the oracle
  console.log('\nTesting ElectroOracle price fetching...');
  
  for (const tokenKey of tokenKeys) {
    try {
      const tokenAddress = ORACLE_CONFIG.TOKEN_ADDRESSES[tokenKey];
      const price = await electroOracle.getAssetPrice(tokenAddress);
      console.log(`Price for ${tokenKey} (${tokenAddress}): ${price.toString()}`);
    } catch (error) {
      console.error(`Error getting price for ${tokenKey}:`, error.message);
    }
  }
  
  console.log('\nElectroLend Oracle setup complete!');
}

async function promptForAddress(message) {
  // In a real environment, we'd use readline or another method to get user input
  throw new Error(`Please set the ADDRESS_PROVIDER environment variable. ${message}`);
}

// Execute setup
setupOracle()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 