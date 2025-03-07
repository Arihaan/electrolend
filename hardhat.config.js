require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-waffle');
require('@tenderly/hardhat-tenderly');
const fs = require('fs');
require('hardhat-gas-reporter');
require('hardhat-typechain');
const path = require('path');
require('solidity-coverage');
require('@nomiclabs/hardhat-etherscan');
require('dotenv').config();

// Set to true to skip loading tasks during compilation
const SKIP_LOAD = process.env.SKIP_LOAD === 'true' || process.argv.includes('compile');
const DEFAULT_BLOCK_GAS_LIMIT = 8000000;
const DEFAULT_GAS_MUL = 5;
const HARDFORK = 'istanbul';
const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY || '';
const MNEMONIC_PATH = "m/44'/60'/0'/0";
const MNEMONIC = process.env.MNEMONIC || '';
const UNLIMITED_BYTECODE_SIZE = process.env.UNLIMITED_BYTECODE_SIZE === 'true';

// Prevent to load scripts before compilation and typechain
if (!SKIP_LOAD) {
  ['misc', 'migrations', 'dev', 'full'].forEach((folder) => {
    const tasksPath = path.join(__dirname, 'tasks', folder);
    if (fs.existsSync(tasksPath)) {
      fs.readdirSync(tasksPath)
        .filter((pth) => pth.includes('.js'))
        .forEach((task) => {
          require(`${tasksPath}/${task}`);
        });
    }
  });
}

const buidlerConfig = {
  solidity: {
    version: '0.6.12',
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: 'istanbul',
    },
  },
  typechain: {
    outDir: 'types',
    target: 'ethers-v5',
  },
  etherscan: {
    apiKey: {
      testnet: ETHERSCAN_KEY,
    },
    customChains: [
      {
        chainId: 5201420,
        network: 'testnet',
        urls: {
          apiURL: 'https://api-testnet.explorer.electroneum.com/api',
          browserURL: 'https://testnet.explorer.electroneum.com',
        },
      },
    ],
  },
  mocha: {
    timeout: 0,
  },
  tenderly: {
    project: process.env.TENDERLY_PROJECT || '',
    username: process.env.TENDERLY_USERNAME || '',
    forkNetwork: '1', //Network id of the network we want to fork
  },
  networks: {
    testnet: {
      url: 'https://rpc.ankr.com/electroneum_testnet',
      hardfork: HARDFORK,
      chainId: 5201420,
      accounts: [process.env.PRIVATE_KEY || ''],
      gas: 4000000,
      gasPrice: 50000000000, // 50 gwei
      maxFeePerGas: 2000000000000, // 2000 gwei
      maxPriorityFeePerGas: 200000000000 // 200 gwei
    },
    hardhat: {
      hardfork: 'berlin',
      blockGasLimit: DEFAULT_BLOCK_GAS_LIMIT,
      gas: DEFAULT_BLOCK_GAS_LIMIT,
      gasPrice: 8000000000,
      allowUnlimitedContractSize: UNLIMITED_BYTECODE_SIZE,
      chainId: 31337,
      throwOnTransactionFailures: true,
      throwOnCallFailures: true
    }
  },
};

module.exports = buidlerConfig; 