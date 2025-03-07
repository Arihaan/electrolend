require('dotenv').config();

const GWEI = 1000 * 1000 * 1000;

const NETWORKS_RPC_URL = {
  testnet: 'https://rpc.ankr.com/electroneum_testnet',
  mainnet: 'https://rpc.ankr.com/electroneum',
};

const NETWORKS_DEFAULT_GAS = {
  testnet: 65 * GWEI,
  mainnet: 100 * GWEI,
};

module.exports = {
  NETWORKS_RPC_URL,
  NETWORKS_DEFAULT_GAS,
}; 