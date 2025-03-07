require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-waffle');
require('@tenderly/hardhat-tenderly');
const fs = require('fs');
require('hardhat-gas-reporter');
require('hardhat-typechain');
const { HardhatUserConfig } = require('hardhat/types');
const path = require('path');
require('solidity-coverage');
require('@nomiclabs/hardhat-etherscan');
const { buildForkConfig, NETWORKS_DEFAULT_GAS, NETWORKS_RPC_URL } = require('./helper-hardhat-config');
const { BUIDLEREVM_CHAINID, COVERAGE_CHAINID } = require('./helpers/buidler-constants');
const { eElectroneumNetwork, eNetwork } = require('./helpers/types');
// @ts-ignore
const { accounts } = require('./test-wallets.js');

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
  [
    'misc',
    'migrations',
    'dev',
    'full',
    'verifications',
    'deployments',
    'helpers',
    'operations',
    'initializations',
  ].forEach((folder) => {
    const tasksPath = path.join(__dirname, 'tasks', folder);
    fs.readdirSync(tasksPath)
      .filter((pth) => pth.includes('.ts'))
      .forEach((task) => {
        require(`${tasksPath}/${task}`);
      });
  });
}

require(`${path.join(__dirname, 'tasks/misc')}/set-bre.ts`);

const getCommonNetworkConfig = (networkName: eNetwork, networkId: number) => ({
  url: NETWORKS_RPC_URL[networkName],
  hardfork: HARDFORK,
  chainId: networkId,
  accounts: {
    mnemonic: MNEMONIC,
    path: MNEMONIC_PATH,
    initialIndex: 0,
    count: 20,
  },
  gas: NETWORKS_DEFAULT_GAS[networkName],
});

let forkMode;

const buidlerConfig: HardhatUserConfig = {
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
    coverage: {
      url: 'http://localhost:8555',
      chainId: COVERAGE_CHAINID,
    },
    testnet: {
      url: NETWORKS_RPC_URL[eElectroneumNetwork.testnet],
      hardfork: HARDFORK,
      chainId: 5201420,
      accounts: [process.env.PRIVATE_KEY || ''],
      gas: NETWORKS_DEFAULT_GAS[eElectroneumNetwork.testnet],
    },
    hardhat: {
      hardfork: 'berlin',
      blockGasLimit: DEFAULT_BLOCK_GAS_LIMIT,
      gas: DEFAULT_BLOCK_GAS_LIMIT,
      gasPrice: 8000000000,
      allowUnlimitedContractSize: UNLIMITED_BYTECODE_SIZE,
      chainId: BUIDLEREVM_CHAINID,
      throwOnTransactionFailures: true,
      throwOnCallFailures: true,
      accounts: accounts.map(({ secretKey, balance }: { secretKey: string; balance: string }) => ({
        privateKey: secretKey,
        balance,
      })),
      forking: buildForkConfig(),
    },
    buidlerevm_docker: {
      hardfork: 'berlin',
      blockGasLimit: 9500000,
      gas: 9500000,
      gasPrice: 8000000000,
      chainId: BUIDLEREVM_CHAINID,
      throwOnTransactionFailures: true,
      throwOnCallFailures: true,
      url: 'http://localhost:8545',
    },
    ganache: {
      url: 'http://ganache:8545',
      accounts: {
        mnemonic: 'fox sight canyon orphan hotel grow hedgehog build bless august weather swarm',
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
      },
    },
  },
};

module.exports = buidlerConfig;
