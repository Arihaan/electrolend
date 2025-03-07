// ElectroLend Reserve Setup Script for Electroneum Testnet
// This script initializes reserves after deployment is confirmed
// Usage: node scripts/setup-reserves.js

const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Transaction config to avoid freezing
const TX_WAIT_CONFIRMATIONS = 1; 
const MAX_FEE_PER_GAS = ethers.utils.parseUnits('500', 'gwei');
const MAX_PRIORITY_FEE_PER_GAS = ethers.utils.parseUnits('50', 'gwei');
const GAS_LIMIT_MULTIPLIER = 1.5;

// Token configurations
const TOKENS = {
  WETN: {
    address: process.env.WETN_ADDRESS || '0x154c9fD7F006b92b6afa746098d8081A831DC1FC',
    symbol: 'WETN',
    name: 'Wrapped ETN',
    decimals: 18,
    baseLTV: 8000, // 80%
    liquidationThreshold: 8500, // 85%
    liquidationBonus: 10500, // 105%
    reserveFactor: 1000, // 10%
    borrowingEnabled: true,
    stableBorrowingEnabled: true,
  },
  TUSDC: {
    address: process.env.TUSDC_ADDRESS || '0x9a110A3Ecc8704e93Bd4FA1bA44D5CF93327202B',
    symbol: 'TUSDC',
    name: 'Test USDC',
    decimals: 6,
    baseLTV: 8000, // 80%
    liquidationThreshold: 8500, // 85%
    liquidationBonus: 10500, // 105%
    reserveFactor: 1000, // 10%
    borrowingEnabled: true,
    stableBorrowingEnabled: true,
  },
  TUSDT: {
    address: process.env.TUSDT_ADDRESS || '0x02FeC8c559fB598762df8D033bD7A3Df9b374771',
    symbol: 'TUSDT',
    name: 'Test USDT',
    decimals: 6,
    baseLTV: 8000, // 80%
    liquidationThreshold: 8500, // 85%
    liquidationBonus: 10500, // 105%
    reserveFactor: 1000, // 10%
    borrowingEnabled: true,
    stableBorrowingEnabled: true,
  },
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

// Load deployed addresses
function loadDeploymentAddresses() {
  const filePath = path.resolve(__dirname, '../deployments/electrolend-testnet-deployment.json');
  if (!fs.existsSync(filePath)) {
    throw new Error(`Deployment file not found at ${filePath}. Run deploy-electrolend-testnet-quick.js first.`);
  }
  
  const deploymentData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return deploymentData.addresses;
}

// Main function
async function main() {
  console.log('Starting ElectroLend Reserve Setup on Electroneum Testnet');
  console.log('-----------------------------------------------------');
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  
  console.log(`Using account: ${deployerAddress}`);
  const balance = await deployer.getBalance();
  console.log(`Account balance: ${ethers.utils.formatEther(balance)} ETN`);
  
  // Load deployed addresses
  const addresses = loadDeploymentAddresses();
  console.log('Loaded deployment addresses');
  
  // 1. Get the addresses provider
  const addressesProviderAddress = addresses.LendingPoolAddressesProvider;
  if (!addressesProviderAddress) {
    throw new Error('LendingPoolAddressesProvider address not found in deployment data');
  }
  
  const addressesProvider = await ethers.getContractAt(
    'LendingPoolAddressesProvider', 
    addressesProviderAddress
  );
  
  console.log(`Using LendingPoolAddressesProvider at: ${addressesProvider.address}`);
  
  // 2. Get the lending pool and configurator addresses
  const lendingPoolAddress = await addressesProvider.getLendingPool();
  const configuratorAddress = await addressesProvider.getLendingPoolConfigurator();
  
  console.log(`Found LendingPool at: ${lendingPoolAddress}`);
  console.log(`Found LendingPoolConfigurator at: ${configuratorAddress}`);
  
  if (lendingPoolAddress === ethers.constants.AddressZero || configuratorAddress === ethers.constants.AddressZero) {
    throw new Error('LendingPool or LendingPoolConfigurator not properly deployed. Check transactions on Explorer.');
  }
  
  // 3. Get contract instances
  const lendingPool = await ethers.getContractAt('LendingPool', lendingPoolAddress);
  const configurator = await ethers.getContractAt('LendingPoolConfigurator', configuratorAddress);
  
  // 4. Get the implementation addresses
  const elTokenImpl = addresses.ELToken;
  const stableDebtTokenImpl = addresses.StableDebtToken;
  const variableDebtTokenImpl = addresses.VariableDebtToken; 
  
  if (!elTokenImpl || !stableDebtTokenImpl || !variableDebtTokenImpl) {
    throw new Error('Token implementation addresses not found in deployment data');
  }
  
  console.log(`Using ELToken implementation: ${elTokenImpl}`);
  console.log(`Using StableDebtToken implementation: ${stableDebtTokenImpl}`);
  console.log(`Using VariableDebtToken implementation: ${variableDebtTokenImpl}`);
  
  // 5. Get the lending rate oracle
  const lendingRateOracleAddress = await addressesProvider.getLendingRateOracle();
  const lendingRateOracle = await ethers.getContractAt('LendingRateOracle', lendingRateOracleAddress);
  
  // 6. For each token, check if it's already initialized and initialize if not
  for (const tokenKey of Object.keys(TOKENS)) {
    const token = TOKENS[tokenKey];
    console.log(`\nProcessing ${tokenKey} (${token.address})...`);
    
    // Check if the reserve is already initialized
    let isInitialized = false;
    try {
      const reserveData = await lendingPool.getReserveData(token.address);
      isInitialized = reserveData.elTokenAddress !== ethers.constants.AddressZero;
      
      if (isInitialized) {
        console.log(`${tokenKey} reserve already initialized at ${reserveData.elTokenAddress}`);
        continue;
      }
    } catch (error) {
      console.log(`Error checking reserve: ${error.message}`);
      console.log('Assuming reserve is not initialized yet');
    }
    
    // Get the interest rate strategy for this token
    const strategyAddress = addresses[`DefaultReserveInterestRateStrategy_${tokenKey}`] || 
                          addresses[`DefaultReserveInterestRateStrategy`];
    
    if (!strategyAddress) {
      throw new Error(`Interest rate strategy not found for ${tokenKey}`);
    }
    
    console.log(`Using interest rate strategy: ${strategyAddress}`);
    
    // Initialize the reserve
    console.log(`Initializing ${tokenKey} reserve...`);
    
    await sendTx(configurator, 'initReserve', [
      elTokenImpl,
      stableDebtTokenImpl,
      variableDebtTokenImpl,
      token.decimals,
      strategyAddress,
      token.address,
    ]);
    
    // Set reserve factor
    await sendTx(configurator, 'setReserveFactor', [
      token.address,
      token.reserveFactor,
    ]);
    
    // Configure reserve as collateral
    await sendTx(configurator, 'configureReserveAsCollateral', [
      token.address,
      token.baseLTV,
      token.liquidationThreshold,
      token.liquidationBonus,
    ]);
    
    // Enable borrowing on reserve
    if (token.borrowingEnabled) {
      await sendTx(configurator, 'enableBorrowingOnReserve', [
        token.address, 
        token.stableBorrowingEnabled,
      ]);
    }
    
    // Set lending rates in LendingRateOracle
    await sendTx(lendingRateOracle, 'setMarketBorrowRate', [
      token.address,
      ethers.utils.parseUnits('0.039', 27), // 3.9% APY (in ray, 1e27)
    ]);
    
    console.log(`${tokenKey} reserve initialized and configured successfully`);
  }
  
  console.log('\nVerifying all reserves have been properly initialized...');
  
  // Verify reserves are initialized
  for (const tokenKey of Object.keys(TOKENS)) {
    const token = TOKENS[tokenKey];
    const reserveData = await lendingPool.getReserveData(token.address);
    
    console.log(`\n${tokenKey} Reserve Status:`);
    console.log(`- ELToken: ${reserveData.elTokenAddress}`);
    console.log(`- StableDebtToken: ${reserveData.stableDebtTokenAddress}`);
    console.log(`- VariableDebtToken: ${reserveData.variableDebtTokenAddress}`);
    console.log(`- Interest Rate Strategy: ${reserveData.interestRateStrategyAddress}`);
    
    if (reserveData.elTokenAddress === ethers.constants.AddressZero) {
      console.error(`WARNING: ${tokenKey} reserve not properly initialized!`);
    } else {
      console.log(`${tokenKey} reserve properly initialized.`);
    }
  }
  
  console.log('\nElectroLend Reserve Setup Complete!');
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Reserve setup failed:', error);
    process.exit(1);
  }); 