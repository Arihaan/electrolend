import BigNumber from 'bignumber.js';

export const PERMISSIONED_CONTRACT_FACTORY_ADDRESS = '0x0000000000000000000000000000000000000000'; // To be updated after deploymentrespo

// ----------------
// MATH
// ----------------

export const PERCENTAGE_FACTOR = '10000';
export const HALF_PERCENTAGE = '5000';
export const WAD = Math.pow(10, 18).toString();
export const HALF_WAD = new BigNumber(WAD).multipliedBy(0.5).toString();
export const RAY = new BigNumber(10).exponentiatedBy(27).toFixed();
export const HALF_RAY = new BigNumber(RAY).multipliedBy(0.5).toFixed();
export const WAD_RAY_RATIO = Math.pow(10, 9).toString();
export const oneEther = new BigNumber(Math.pow(10, 18));
export const oneUsd = new BigNumber(Math.pow(10, 8));
export const oneRay = new BigNumber(Math.pow(10, 27));
export const MAX_UINT_AMOUNT =
  '115792089237316195423570985008687907853269984665640564039457584007913129639935';
export const ONE_YEAR = '31536000';
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
export const ONE_ADDRESS = '0x0000000000000000000000000000000000000001';
// ----------------
// PROTOCOL GLOBAL PARAMS
// ----------------
export const OPTIMAL_UTILIZATION_RATE = new BigNumber(0.8).times(RAY);
export const EXCESS_UTILIZATION_RATE = new BigNumber(0.2).times(RAY);
export const APPROVAL_AMOUNT_LENDING_POOL = '1000000000000000000000000000';
export const TOKEN_DISTRIBUTOR_PERCENTAGE_BASE = '10000';
export const MOCK_USD_PRICE_IN_WEI = '5848466240000000';
export const USD_ADDRESS = '0x10F7Fc1F91Ba351f9C629c5947AD69bD03C05b96';
export const ELECTROLEND_REFERRAL = '0';

// to set initial prices in fallback oracle
export const INITIAL_PRICES = {
  USD: oneUsd.toFixed(),
  WETN: oneUsd.toFixed(), // 1 WETN = $1
  TUSDC: oneUsd.toFixed(), // 1 TUSDC = $1
  TUSDT: oneUsd.toFixed(), // 1 TUSDT = $1
};

export const MOCK_PRICE_AGGREGATORS_PRICES = {
  // Fixed USD prices for tokens
  WETN: oneUsd.toFixed(), // $1.00
  TUSDC: oneUsd.toFixed(), // $1.00
  TUSDT: oneUsd.toFixed(), // $1.00
  USD: oneUsd.toFixed(), // $1.00
};

export const ALL_ASSETS_PRICES_FOR_TESTING = {
  ...MOCK_PRICE_AGGREGATORS_PRICES,
};

// Price feed addresses
export const aggregatorProxy = {
  tenderly: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
  mainnet: '0x0000000000000000000000000000000000000000', // To be updated after deployment
  testnet: '0xFba006047BCeCc6E7402D8ae7a3ddCB8DB1CFf53', // Simple Price Feed address on Electroneum testnet
};

export const baseTokenAddress = {
  mainnet: '0x0000000000000000000000000000000000000000', // To be updated after deployment
  testnet: '0x154c9fD7F006b92b6afa746098d8081A831DC1FC', // WETN on Electroneum testnet
};
