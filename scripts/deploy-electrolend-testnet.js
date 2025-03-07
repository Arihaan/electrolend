// ElectroLend Deployment Script for Electroneum Testnet
// Usage: node scripts/deploy-electrolend-testnet.js

const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Transaction config to avoid freezing
const TX_WAIT_CONFIRMATIONS = 1;
const MAX_FEE_PER_GAS = ethers.utils.parseUnits('2000', 'gwei');
const MAX_PRIORITY_FEE_PER_GAS = ethers.utils.parseUnits('200', 'gwei');
const GAS_LIMIT = 4000000;

// Market configurations
const MARKET_ID = 'ElectroLend genesis market';
const PROVIDER_ID = 1;

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

// Interest rate strategies
const INTEREST_RATE_STRATEGIES = {
  WETN: {
    optimalUtilizationRate: '450000000000000000', // 45%
    baseVariableBorrowRate: '0',
    variableRateSlope1: '70000000000000000', // 7%
    variableRateSlope2: '3000000000000000000', // 300%
    stableRateSlope1: '90000000000000000', // 9%
    stableRateSlope2: '3000000000000000000', // 300%
  },
  TUSDC: {
    optimalUtilizationRate: '900000000000000000', // 90%
    baseVariableBorrowRate: '0',
    variableRateSlope1: '40000000000000000', // 4%
    variableRateSlope2: '600000000000000000', // 60%
    stableRateSlope1: '50000000000000000', // 5%
    stableRateSlope2: '600000000000000000', // 60%
  },
  TUSDT: {
    optimalUtilizationRate: '900000000000000000', // 90%
    baseVariableBorrowRate: '0',
    variableRateSlope1: '40000000000000000', // 4%
    variableRateSlope2: '600000000000000000', // 60%
    stableRateSlope1: '50000000000000000', // 5%
    stableRateSlope2: '600000000000000000', // 60%
  },
};

// Oracle configurations
const ORACLE_CONFIG = {
  BASE_CURRENCY: ethers.constants.AddressZero, // USD
  BASE_CURRENCY_UNIT: '100000000', // 10^8
  PRICE_FEED_ADDRESS: process.env.SIMPLE_PRICE_FEED_ADDRESS || '0xFba006047BCeCc6E7402D8ae7a3ddCB8DB1CFf53',
  TOKEN_SYMBOLS: {
    WETN: 'ETN',
    TUSDC: 'USDC',
    TUSDT: 'USDT',
  },
  INITIAL_PRICES: {
    ETN: '500000', // $0.005 * 10^8
    USDC: '100000000', // $1.00 * 10^8
    USDT: '100000000', // $1.00 * 10^8
  },
};

// Deployment state
const state = {
  deployer: null,
  deployerAddress: null,
  deploymentAddresses: {},
  txCount: 0,
};

// Helper to save deployment state
function saveState() {
  const deploymentPath = path.resolve(__dirname, '../deployments');
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true });
  }
  
  const filePath = path.resolve(deploymentPath, 'electrolend-testnet-deployment.json');
  fs.writeFileSync(
    filePath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        deployer: state.deployerAddress,
        addresses: state.deploymentAddresses,
        txCount: state.txCount,
      },
      null,
      2
    )
  );
  console.log(`Deployment state saved to ${filePath}`);
}

// Helper for deployment
async function deploy(contractName, args = []) {
  console.log(`\nDeploying ${contractName}...`);
  
  const factory = await ethers.getContractFactory(contractName);
  
  const contract = await factory.deploy(...args, {
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
    gasLimit: GAS_LIMIT,
  });
  
  console.log(`Deployment transaction sent: ${contract.deployTransaction.hash}`);
  
  await contract.deployTransaction.wait(TX_WAIT_CONFIRMATIONS);
  
  console.log(`${contractName} deployed to:`, contract.address);
  
  state.deploymentAddresses[contractName] = contract.address;
  state.txCount++;
  
  saveState();
  
  return contract;
}

// Helper for transactions
async function sendTx(contract, methodName, args = [], value = 0) {
  console.log(`\nExecuting ${methodName} on ${contract.address}...`);
  
  const tx = await contract[methodName](...args, {
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
    gasLimit: GAS_LIMIT,
    value,
  });
  
  console.log(`Transaction sent: ${tx.hash}`);
  
  await tx.wait(TX_WAIT_CONFIRMATIONS);
  
  console.log(`Transaction confirmed: ${tx.hash}`);
  state.txCount++;
  
  saveState();
  
  return tx;
}

// Main deployment function
async function main() {
  console.log('Starting ElectroLend deployment on Electroneum Testnet');
  console.log('--------------------------------------------------');
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  state.deployer = deployer;
  state.deployerAddress = await deployer.getAddress();
  
  console.log(`Deployer address: ${state.deployerAddress}`);
  const balance = await deployer.getBalance();
  console.log(`Deployer balance: ${ethers.utils.formatEther(balance)} ETN`);
  
  if (balance.lt(ethers.utils.parseEther('5'))) {
    console.warn('Warning: Deployer balance is low. Consider adding more ETN to avoid failed transactions.');
  }
  
  // Step 1: Deploy LendingPoolAddressesProviderRegistry
  const addressesProviderRegistry = await deploy('LendingPoolAddressesProviderRegistry', [state.deployerAddress]);
  
  // Step 2: Deploy LendingPoolAddressesProvider
  const addressesProvider = await deploy('LendingPoolAddressesProvider', [MARKET_ID, state.deployerAddress]);
  
  // Step 3: Register the AddressesProvider in the Registry
  await sendTx(addressesProviderRegistry, 'registerAddressesProvider', [addressesProvider.address, PROVIDER_ID]);
  
  // Step 4: Deploy Libraries
  const reserveLogic = await deploy('ReserveLogic');
  const genericLogic = await deploy('GenericLogic');
  
  // LinkReferences for ValidationLogic
  const validationLogicFactory = await ethers.getContractFactory('ValidationLogic', {
    libraries: {
      ReserveLogic: reserveLogic.address,
      GenericLogic: genericLogic.address,
    },
  });
  
  console.log("\nDeploying ValidationLogic...");
  const validationLogic = await validationLogicFactory.deploy({
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
  });
  await validationLogic.deployTransaction.wait(TX_WAIT_CONFIRMATIONS);
  console.log("ValidationLogic deployed to:", validationLogic.address);
  state.deploymentAddresses["ValidationLogic"] = validationLogic.address;
  state.txCount++;
  saveState();
  
  // Step 5: Deploy LendingPool implementation with libraries
  const lendingPoolFactory = await ethers.getContractFactory('LendingPool', {
    libraries: {
      ReserveLogic: reserveLogic.address,
      ValidationLogic: validationLogic.address,
      GenericLogic: genericLogic.address,
    },
  });
  
  console.log("\nDeploying LendingPool implementation...");
  const lendingPoolImpl = await lendingPoolFactory.deploy({
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
  });
  await lendingPoolImpl.deployTransaction.wait(TX_WAIT_CONFIRMATIONS);
  console.log("LendingPool implementation deployed to:", lendingPoolImpl.address);
  state.deploymentAddresses["LendingPoolImpl"] = lendingPoolImpl.address;
  state.txCount++;
  saveState();
  
  // Step 6: Deploy LendingPoolConfigurator implementation
  const lendingPoolConfiguratorImpl = await deploy('LendingPoolConfigurator');
  
  // Step 7: Set LendingPool and LendingPoolConfigurator implementations in AddressesProvider
  await sendTx(addressesProvider, 'setLendingPoolImpl', [lendingPoolImpl.address]);
  await sendTx(addressesProvider, 'setLendingPoolConfiguratorImpl', [lendingPoolConfiguratorImpl.address]);
  
  // Step 8: Get the deployed proxies
  const lendingPoolProxy = await ethers.getContractAt('LendingPool', await addressesProvider.getLendingPool());
  const lendingPoolConfiguratorProxy = await ethers.getContractAt(
    'LendingPoolConfigurator',
    await addressesProvider.getLendingPoolConfigurator()
  );
  
  state.deploymentAddresses["LendingPoolProxy"] = lendingPoolProxy.address;
  state.deploymentAddresses["LendingPoolConfiguratorProxy"] = lendingPoolConfiguratorProxy.address;
  saveState();
  
  // Step 9: Deploy ElectroOracle
  const electroOracle = await deploy('ElectroOracle', [
    ORACLE_CONFIG.BASE_CURRENCY,
    ORACLE_CONFIG.BASE_CURRENCY_UNIT,
    state.deployerAddress,
  ]);
  
  // Step 10: Set price oracle in AddressesProvider
  await sendTx(addressesProvider, 'setPriceOracle', [electroOracle.address]);
  
  // Step 11: Deploy SimplePriceFeedAdapter
  const simplePriceFeedAdapter = await deploy('SimplePriceFeedAdapter', [
    ORACLE_CONFIG.PRICE_FEED_ADDRESS,
    state.deployerAddress,
  ]);
  
  // Step 12: Initialize ElectroOracle with the SimplePriceFeedAdapter
  await sendTx(electroOracle, 'initialize', [simplePriceFeedAdapter.address]);
  
  // Step 13: Set asset symbols in adapter
  const tokenAddresses = Object.keys(TOKENS).map(key => TOKENS[key].address);
  const tokenSymbols = Object.keys(TOKENS).map(key => ORACLE_CONFIG.TOKEN_SYMBOLS[key]);
  
  await sendTx(simplePriceFeedAdapter, 'setAssetSymbols', [tokenAddresses, tokenSymbols]);
  
  // Step 14: Deploy and register the lending rate oracle
  const lendingRateOracle = await deploy('LendingRateOracle', [state.deployerAddress]);
  await sendTx(addressesProvider, 'setLendingRateOracle', [lendingRateOracle.address]);
  
  // Step 15: Deploy ElectroProtocolDataProvider
  const dataProvider = await deploy('ElectroProtocolDataProvider', [addressesProvider.address]);
  await sendTx(addressesProvider, 'setElectroProtocolDataProvider', [dataProvider.address]);
  
  // Step 16: Deploy ELToken, StableDebtToken, and VariableDebtToken implementations
  const elTokenImpl = await deploy('ELToken');
  const stableDebtTokenImpl = await deploy('StableDebtToken');
  const variableDebtTokenImpl = await deploy('VariableDebtToken');
  
  // Step 17: Deploy Treasury
  const treasuryAddress = state.deployerAddress; // Using deployer as treasury for simplicity
  
  // Step 18: Deploy Interest Rate Strategies for each token
  const interestRateStrategies = {};
  
  for (const tokenKey of Object.keys(TOKENS)) {
    const strategy = INTEREST_RATE_STRATEGIES[tokenKey];
    const strategyContract = await deploy('DefaultReserveInterestRateStrategy', [
      addressesProvider.address,
      strategy.optimalUtilizationRate,
      strategy.baseVariableBorrowRate,
      strategy.variableRateSlope1,
      strategy.variableRateSlope2,
      strategy.stableRateSlope1,
      strategy.stableRateSlope2,
    ]);
    
    interestRateStrategies[tokenKey] = strategyContract.address;
  }
  
  // Step 19: Initialize each token in the lending pool
  for (const tokenKey of Object.keys(TOKENS)) {
    const token = TOKENS[tokenKey];
    
    console.log(`\nInitializing ${tokenKey} reserve...`);
    
    // Step 19.1: Initialize reserve in the lending pool
    await sendTx(lendingPoolConfiguratorProxy, 'initReserve', [
      elTokenImpl.address,
      stableDebtTokenImpl.address,
      variableDebtTokenImpl.address,
      token.decimals,
      interestRateStrategies[tokenKey],
      token.address,
    ]);
    
    // Step 19.2: Set reserve factor
    await sendTx(lendingPoolConfiguratorProxy, 'setReserveFactor', [
      token.address,
      token.reserveFactor,
    ]);
    
    // Step 19.3: Configure reserve as collateral
    await sendTx(lendingPoolConfiguratorProxy, 'configureReserveAsCollateral', [
      token.address,
      token.baseLTV,
      token.liquidationThreshold,
      token.liquidationBonus,
    ]);
    
    // Step 19.4: Enable borrowing on reserve
    if (token.borrowingEnabled) {
      await sendTx(lendingPoolConfiguratorProxy, 'enableBorrowingOnReserve', [
        token.address, 
        token.stableBorrowingEnabled,
      ]);
    }
    
    // Step 19.5: Set ELToken, StableDebtToken, and VariableDebtToken names in the lending pool data provider
    const reserveData = await lendingPoolProxy.getReserveData(token.address);
    
    // Get token contracts
    const elToken = await ethers.getContractAt('ELToken', reserveData.elTokenAddress);
    const stableDebtToken = await ethers.getContractAt('StableDebtToken', reserveData.stableDebtTokenAddress);
    const variableDebtToken = await ethers.getContractAt('VariableDebtToken', reserveData.variableDebtTokenAddress);
    
    // Store the token addresses
    state.deploymentAddresses[`ELToken_${tokenKey}`] = elToken.address;
    state.deploymentAddresses[`StableDebtToken_${tokenKey}`] = stableDebtToken.address;
    state.deploymentAddresses[`VariableDebtToken_${tokenKey}`] = variableDebtToken.address;
    saveState();
    
    // Set lending rates in LendingRateOracle
    await sendTx(lendingRateOracle, 'setMarketBorrowRate', [
      token.address,
      ethers.utils.parseUnits('0.039', 27), // 3.9% APY (in ray, 1e27)
    ]);
  }
  
  // Step 20: Deploy LendingPoolCollateralManager
  const lendingPoolCollateralManagerImpl = await deploy('LendingPoolCollateralManager');
  await sendTx(addressesProvider, 'setLendingPoolCollateralManager', [lendingPoolCollateralManagerImpl.address]);
  
  // Step 21: Deploy WETHGateway for native ETN support
  const wethGateway = await deploy('WETHGateway', [TOKENS.WETN.address, addressesProvider.address]);
  
  // Step 22: Initialize price feed with initial prices
  console.log('\nVerifying that SimplePriceFeed exists and initializing with prices...');
  
  try {
    // Get SimplePriceFeed contract instance
    const simplePriceFeed = await ethers.getContractAt('SimplePriceFeed', ORACLE_CONFIG.PRICE_FEED_ADDRESS);
    
    // Set initial prices if needed
    const symbolsArray = Object.values(ORACLE_CONFIG.TOKEN_SYMBOLS);
    const pricesArray = symbolsArray.map(symbol => ORACLE_CONFIG.INITIAL_PRICES[symbol]);
    
    await sendTx(simplePriceFeed, 'updatePrices', [symbolsArray, pricesArray]);
    
    // Verify prices were set
    for (const symbol of symbolsArray) {
      const price = await simplePriceFeed.getLatestPrice(symbol);
      console.log(`Price for ${symbol}: ${price.toString()}`);
    }
  } catch (error) {
    console.error('Error setting up SimplePriceFeed:', error);
    console.log('Note: You may need to manually initialize the SimplePriceFeed with prices.');
  }
  
  console.log('\nElectroLend deployment completed successfully!');
  console.log('--------------------------------------------------');
  console.log(`Total transactions: ${state.txCount}`);
  console.log('\nKey Contract Addresses:');
  console.log(`- LendingPoolAddressesProvider: ${addressesProvider.address}`);
  console.log(`- LendingPool: ${lendingPoolProxy.address}`);
  console.log(`- LendingPoolConfigurator: ${lendingPoolConfiguratorProxy.address}`);
  console.log(`- ElectroOracle: ${electroOracle.address}`);
  console.log(`- SimplePriceFeedAdapter: ${simplePriceFeedAdapter.address}`);
  console.log(`- WETHGateway: ${wethGateway.address}`);
  console.log(`\nDeployment state saved to: ./deployments/electrolend-testnet-deployment.json`);
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 