// ElectroLend Deployment Script - QUICK VERSION FOR TESTNET
// This script doesn't wait for confirmations to avoid getting stuck
// Usage: node scripts/deploy-electrolend-testnet-quick.js

const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Transaction config to avoid freezing
const MAX_FEE_PER_GAS = ethers.utils.parseUnits('500', 'gwei');
const MAX_PRIORITY_FEE_PER_GAS = ethers.utils.parseUnits('50', 'gwei');
const GAS_LIMIT_MULTIPLIER = 1.5;

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

// Helper for deployment - doesn't wait for confirmations
async function deploy(contractName, args = []) {
  console.log(`\nDeploying ${contractName}...`);
  
  const factory = await ethers.getContractFactory(contractName);
  
  const gasEstimate = await factory.signer.estimateGas(
    factory.getDeployTransaction(...args)
  );
  
  const adjustedGasLimit = Math.floor(Number(gasEstimate) * GAS_LIMIT_MULTIPLIER);
  
  const contract = await factory.deploy(...args, {
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
    gasLimit: adjustedGasLimit,
  });
  
  console.log(`Deployment transaction sent: ${contract.deployTransaction.hash}`);
  console.log(`IMPORTANT: Contract deployed but confirmation skipped for speed.`);
  console.log(`Expected address (not confirmed): ${contract.address}`);
  
  // We don't wait for confirmation to avoid getting stuck
  // contract.deployTransaction.wait(0);
  
  state.deploymentAddresses[contractName] = contract.address;
  state.txCount++;
  
  saveState();
  
  return contract;
}

// Helper for transactions - doesn't wait for confirmations
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
  console.log(`IMPORTANT: Transaction sent but confirmation skipped for speed.`);
  
  // We don't wait for confirmation to avoid getting stuck
  // await tx.wait(0);
  
  state.txCount++;
  saveState();
  
  return tx;
}

// Main deployment function
async function main() {
  console.log('Starting ElectroLend Quick Deployment on Electroneum Testnet');
  console.log('--------------------------------------------------------');
  console.log('NOTE: This script sends transactions but does not wait for confirmations');
  console.log('to avoid getting stuck. Check the Electroneum Explorer for status.');
  console.log('--------------------------------------------------------');
  
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
  
  try {
    // Step 1: Deploy LendingPoolAddressesProviderRegistry
    const addressesProviderRegistry = await deploy('LendingPoolAddressesProviderRegistry', [state.deployerAddress]);
    
    // Step 2: Deploy LendingPoolAddressesProvider
    const addressesProvider = await deploy('LendingPoolAddressesProvider', [MARKET_ID, state.deployerAddress]);
    
    // Step 3: Register the AddressesProvider in the Registry
    await sendTx(addressesProviderRegistry, 'registerAddressesProvider', [addressesProvider.address, PROVIDER_ID]);
    
    // Step 4: Deploy Libraries
    const reserveLogic = await deploy('ReserveLogic');
    const genericLogic = await deploy('GenericLogic');
    
    // LinkReferences for ValidationLogic - this is a bit trickier
    console.log("\nDeploying ValidationLogic...");
    const validationLogicFactory = await ethers.getContractFactory('ValidationLogic', {
      libraries: {
        ReserveLogic: reserveLogic.address,
        GenericLogic: genericLogic.address,
      },
    });
    
    const validationLogic = await validationLogicFactory.deploy({
      maxFeePerGas: MAX_FEE_PER_GAS,
      maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
    });
    
    console.log(`ValidationLogic deployment transaction: ${validationLogic.deployTransaction.hash}`);
    console.log(`Expected ValidationLogic address: ${validationLogic.address}`);
    
    state.deploymentAddresses["ValidationLogic"] = validationLogic.address;
    state.txCount++;
    saveState();
    
    // Step 5: Deploy LendingPool implementation with libraries
    console.log("\nDeploying LendingPool implementation...");
    const lendingPoolFactory = await ethers.getContractFactory('LendingPool', {
      libraries: {
        ReserveLogic: reserveLogic.address,
        ValidationLogic: validationLogic.address,
        GenericLogic: genericLogic.address,
      },
    });
    
    const lendingPoolImpl = await lendingPoolFactory.deploy({
      maxFeePerGas: MAX_FEE_PER_GAS,
      maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
    });
    
    console.log(`LendingPool implementation deployment transaction: ${lendingPoolImpl.deployTransaction.hash}`);
    console.log(`Expected LendingPool implementation address: ${lendingPoolImpl.address}`);
    
    state.deploymentAddresses["LendingPoolImpl"] = lendingPoolImpl.address;
    state.txCount++;
    saveState();
    
    // Step 6: Deploy LendingPoolConfigurator implementation
    const lendingPoolConfiguratorImpl = await deploy('LendingPoolConfigurator');
    
    // Step 7: Set LendingPool and LendingPoolConfigurator implementations in AddressesProvider
    await sendTx(addressesProvider, 'setLendingPoolImpl', [lendingPoolImpl.address]);
    await sendTx(addressesProvider, 'setLendingPoolConfiguratorImpl', [lendingPoolConfiguratorImpl.address]);
    
    // Step 8: Get the deployed proxy addresses (prediction since we're not waiting for tx confirmations)
    console.log("\nPredicting proxy addresses...");
    
    // These predictions may not be accurate since we're not waiting for confirmations
    const predictedLendingPoolAddress = ethers.utils.getCreate2Address(
      addressesProvider.address,
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LENDING_POOL_IMPL")),
      ethers.utils.keccak256(lendingPoolImpl.address)
    );
    
    const predictedConfiguratorAddress = ethers.utils.getCreate2Address(
      addressesProvider.address,
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LENDING_POOL_CONFIGURATOR_IMPL")),
      ethers.utils.keccak256(lendingPoolConfiguratorImpl.address)
    );
    
    console.log(`Predicted LendingPool proxy address: ${predictedLendingPoolAddress}`);
    console.log(`Predicted LendingPoolConfigurator proxy address: ${predictedConfiguratorAddress}`);
    
    state.deploymentAddresses["LendingPoolProxy"] = predictedLendingPoolAddress;
    state.deploymentAddresses["LendingPoolConfiguratorProxy"] = predictedConfiguratorAddress;
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
    
    // Since we're not waiting for confirmations, some of the next steps may fail
    // because we need the LendingPoolConfigurator proxy to be deployed
    console.log('\nAttempting to initialize reserves, but this may fail if proxy contracts are not yet ready...');
    console.log('If this fails, wait for all transactions to be mined and run the setup-reserves.js script separately');
    
    try {
      // Step 19: Create instances of the proxies - this might fail
      const lendingPoolProxy = await ethers.getContractAt('LendingPool', predictedLendingPoolAddress);
      const lendingPoolConfiguratorProxy = await ethers.getContractAt('LendingPoolConfigurator', predictedConfiguratorAddress);
      
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
        
        // Set lending rates in LendingRateOracle
        await sendTx(lendingRateOracle, 'setMarketBorrowRate', [
          token.address,
          ethers.utils.parseUnits('0.039', 27), // 3.9% APY (in ray, 1e27)
        ]);
      }
    } catch (error) {
      console.log(`\nFailed to initialize reserves: ${error.message}`);
      console.log('This is expected if proxy contracts are not yet deployed.');
      console.log('Wait for transactions to be mined and run the setup-reserves.js script separately.');
    }
    
    // Step 20: Deploy LendingPoolCollateralManager
    const lendingPoolCollateralManagerImpl = await deploy('LendingPoolCollateralManager');
    await sendTx(addressesProvider, 'setLendingPoolCollateralManager', [lendingPoolCollateralManagerImpl.address]);
    
    // Step 21: Deploy WETHGateway for native ETN support
    const wethGateway = await deploy('WETHGateway', [TOKENS.WETN.address, addressesProvider.address]);
    
    console.log('\nELECTROLEND DEPLOYMENT TRANSACTIONS SUBMITTED');
    console.log('-------------------------------------------');
    console.log('IMPORTANT: Transactions have been submitted but not awaited for confirmation');
    console.log('to avoid getting stuck. Please check the Electroneum Explorer for status.');
    console.log(`Total transactions sent: ${state.txCount}`);
    console.log('\nKey Contract Addresses (predicted, not confirmed):');
    console.log(`- LendingPoolAddressesProvider: ${addressesProvider.address}`);
    console.log(`- LendingPool: ${predictedLendingPoolAddress}`);
    console.log(`- LendingPoolConfigurator: ${predictedConfiguratorAddress}`);
    console.log(`- ElectroOracle: ${electroOracle.address}`);
    console.log(`- SimplePriceFeedAdapter: ${simplePriceFeedAdapter.address}`);
    console.log(`- WETHGateway: ${wethGateway.address}`);
    console.log(`\nDeployment state saved to: ./deployments/electrolend-testnet-deployment.json`);
    console.log('\nNext steps:');
    console.log('1. Check all transaction receipts on the Electroneum Explorer');
    console.log('2. Once all transactions are confirmed, run setup-reserves.js if step 19 failed');
    console.log('3. Run setup-electrolend-oracle.js to ensure price feeds are correctly configured');
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 