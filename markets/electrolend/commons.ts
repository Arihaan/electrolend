import {
  MOCK_PRICE_AGGREGATORS_PRICES,
  oneRay,
  oneUsd,
  ZERO_ADDRESS,
} from '../../helpers/constants';
import { eEthereumNetwork, ICommonConfiguration } from '../../helpers/types';
import { eElectroneumNetwork } from './../../helpers/types';

// ----------------
// PROTOCOL GLOBAL PARAMS
// ----------------

export const CommonsConfig: ICommonConfiguration = {
  MarketId: 'Commons',
  ELTokenNamePrefix: 'ElectroLend interest bearing',
  StableDebtTokenNamePrefix: 'ElectroLend stable debt bearing',
  VariableDebtTokenNamePrefix: 'ElectroLend variable debt bearing',
  SymbolPrefix: '',
  ProviderId: 0, // Overriden in index.ts
  OracleQuoteCurrency: 'USD',
  OracleQuoteUnit: oneUsd.toString(),
  ProtocolGlobalParams: {
    MockUsdPriceInWei: '5848466240000000',
    UsdAddress: '0x10F7Fc1F91Ba351f9C629c5947AD69bD03C05b96',
    NilAddress: '0x0000000000000000000000000000000000000000',
    OneAddress: '0x0000000000000000000000000000000000000001',
    ElectroReferral: '0',
  },

  // ----------------
  // COMMON PROTOCOL PARAMS ACROSS POOLS AND NETWORKS
  // ----------------

  Mocks: {
    AllAssetsInitialPrices: {
      ...MOCK_PRICE_AGGREGATORS_PRICES,
    },
  },
  LendingRateOracleRatesCommon: {
    WETN: {
      borrowRate: oneRay.multipliedBy(0.03).toFixed(),
    },
    TUSDC: {
      borrowRate: oneRay.multipliedBy(0.039).toFixed(),
    },
    TUSDT: {
      borrowRate: oneRay.multipliedBy(0.039).toFixed(),
    },
  },
  // ----------------
  // COMMON PROTOCOL ADDRESSES ACROSS POOLS
  // ----------------

  // If PoolAdmin/emergencyAdmin is set, will take priority over PoolAdminIndex/emergencyAdminIndex
  PoolAdmin: {
    [eEthereumNetwork.buidlerevm]: undefined,
    [eEthereumNetwork.coverage]: undefined,
    [eEthereumNetwork.hardhat]: undefined,
    [eEthereumNetwork.tenderly]: undefined,
    [eElectroneumNetwork.testnet]: '0x917999645773E99d03d44817B7318861F018Cb74',
    [eElectroneumNetwork.mainnet]: '0x917999645773E99d03d44817B7318861F018Cb74',
  },
  PoolAdminIndex: 0,
  EmergencyAdmin: {
    [eEthereumNetwork.buidlerevm]: undefined,
    [eEthereumNetwork.coverage]: undefined,
    [eEthereumNetwork.hardhat]: undefined,
    [eEthereumNetwork.tenderly]: undefined,
    [eElectroneumNetwork.testnet]: '0x917999645773E99d03d44817B7318861F018Cb74',
    [eElectroneumNetwork.mainnet]: '0x917999645773E99d03d44817B7318861F018Cb74',
  },
  EmergencyAdminIndex: 1,

  ProviderRegistryOwner: {
    [eEthereumNetwork.buidlerevm]: '',
    [eEthereumNetwork.coverage]: '',
    [eEthereumNetwork.hardhat]: '',
    [eEthereumNetwork.tenderly]: '0xB9062896ec3A615a4e4444DF183F0531a77218AE',
    [eElectroneumNetwork.testnet]: '0x917999645773E99d03d44817B7318861F018Cb74',
    [eElectroneumNetwork.mainnet]: '0x917999645773E99d03d44817B7318861F018Cb74',
  },

  // Adding ProviderRegistry property for the deployment tasks
  ProviderRegistry: {
    [eEthereumNetwork.buidlerevm]: '',
    [eEthereumNetwork.coverage]: '',
    [eEthereumNetwork.hardhat]: '',
    [eEthereumNetwork.tenderly]: '',
    [eElectroneumNetwork.testnet]: '',
    [eElectroneumNetwork.mainnet]: '',
  },

  DIAAggregator: {
    [eEthereumNetwork.buidlerevm]: {},
    [eEthereumNetwork.coverage]: {},
    [eEthereumNetwork.hardhat]: {},
    [eEthereumNetwork.tenderly]: {},
    [eElectroneumNetwork.testnet]: {
      WETN: '0x154c9fD7F006b92b6afa746098d8081A831DC1FC',
      TUSDC: '0x9a110A3Ecc8704e93Bd4FA1bA44D5CF93327202B',
      TUSDT: '0x02FeC8c559fB598762df8D033bD7A3Df9b374771',
    },
    [eElectroneumNetwork.mainnet]: {},
  },

  ReserveAssets: {
    [eEthereumNetwork.buidlerevm]: {},
    [eEthereumNetwork.coverage]: {},
    [eEthereumNetwork.hardhat]: {},
    [eEthereumNetwork.tenderly]: {},
    [eElectroneumNetwork.testnet]: {
      WETN: '0x154c9fD7F006b92b6afa746098d8081A831DC1FC',
      TUSDC: '0x9a110A3Ecc8704e93Bd4FA1bA44D5CF93327202B', 
      TUSDT: '0x02FeC8c559fB598762df8D033bD7A3Df9b374771',
    },
    [eElectroneumNetwork.mainnet]: {},
  },
  ReservesConfig: {},
  ELTokenDomainSeparator: {
    [eEthereumNetwork.buidlerevm]:
      '0xbae024d959c6a022dc5ed37294cd39c141034b2ae5f02a955cce75c930a81bf5',
    [eEthereumNetwork.coverage]:
      '0x95b73a72c6ecf4ccbbba5178800023260bad8e75cdccdb8e4827a2977a37c820',
    [eEthereumNetwork.hardhat]:
      '0xbae024d959c6a022dc5ed37294cd39c141034b2ae5f02a955cce75c930a81bf5',
    [eEthereumNetwork.tenderly]: '',
    [eElectroneumNetwork.testnet]: '',
    [eElectroneumNetwork.mainnet]: '',
  },
  WETH: {
    [eEthereumNetwork.buidlerevm]: '',
    [eEthereumNetwork.coverage]: '',
    [eEthereumNetwork.hardhat]: '',
    [eEthereumNetwork.tenderly]: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    [eElectroneumNetwork.testnet]: '',
    [eElectroneumNetwork.mainnet]: '',
  },
  WrappedNativeToken: {
    [eEthereumNetwork.buidlerevm]: '',
    [eEthereumNetwork.coverage]: '',
    [eEthereumNetwork.hardhat]: '',
    [eEthereumNetwork.tenderly]: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    [eElectroneumNetwork.testnet]: '0x154c9fD7F006b92b6afa746098d8081A831DC1FC', //WETN
    [eElectroneumNetwork.mainnet]: '',
  },
  ReserveFactorTreasuryAddress: {
    [eEthereumNetwork.buidlerevm]: '0x464c71f6c2f760dda6093dcb91c24c39e5d6e18c',
    [eEthereumNetwork.coverage]: '0x464c71f6c2f760dda6093dcb91c24c39e5d6e18c',
    [eEthereumNetwork.hardhat]: '0x464c71f6c2f760dda6093dcb91c24c39e5d6e18c',
    [eEthereumNetwork.tenderly]: '0x464c71f6c2f760dda6093dcb91c24c39e5d6e18c',
    [eElectroneumNetwork.testnet]: '0x917999645773E99d03d44817B7318861F018Cb74',
    [eElectroneumNetwork.mainnet]: '',
  },
  IncentivesController: {
    [eEthereumNetwork.buidlerevm]: ZERO_ADDRESS,
    [eEthereumNetwork.coverage]: ZERO_ADDRESS,
    [eEthereumNetwork.hardhat]: ZERO_ADDRESS,
    [eEthereumNetwork.tenderly]: ZERO_ADDRESS,
    [eElectroneumNetwork.testnet]: ZERO_ADDRESS,
    [eElectroneumNetwork.mainnet]: ZERO_ADDRESS,
  },
  StakedOas: {
    [eEthereumNetwork.buidlerevm]: ZERO_ADDRESS,
    [eEthereumNetwork.coverage]: ZERO_ADDRESS,
    [eEthereumNetwork.hardhat]: ZERO_ADDRESS,
    [eEthereumNetwork.tenderly]: ZERO_ADDRESS,
    [eElectroneumNetwork.testnet]: ZERO_ADDRESS,
    [eElectroneumNetwork.mainnet]: ZERO_ADDRESS,
  },
  OracleSenderAddress: {
    [eEthereumNetwork.buidlerevm]: ZERO_ADDRESS,
    [eEthereumNetwork.coverage]: ZERO_ADDRESS,
    [eEthereumNetwork.hardhat]: ZERO_ADDRESS,
    [eEthereumNetwork.tenderly]: ZERO_ADDRESS,
    [eElectroneumNetwork.testnet]: ZERO_ADDRESS,
    [eElectroneumNetwork.mainnet]: ZERO_ADDRESS,
  },
  OraclePriceKey: {
    [eEthereumNetwork.buidlerevm]: {},
    [eEthereumNetwork.coverage]: {},
    [eEthereumNetwork.hardhat]: {},
    [eEthereumNetwork.tenderly]: {},
    [eElectroneumNetwork.testnet]: {},
    [eElectroneumNetwork.mainnet]: {},
  },
  LendingPoolConfigurator: {
    [eEthereumNetwork.buidlerevm]: ZERO_ADDRESS,
    [eEthereumNetwork.coverage]: ZERO_ADDRESS,
    [eEthereumNetwork.hardhat]: ZERO_ADDRESS,
    [eEthereumNetwork.tenderly]: ZERO_ADDRESS,
    [eElectroneumNetwork.testnet]: ZERO_ADDRESS,
    [eElectroneumNetwork.mainnet]: ZERO_ADDRESS,
  },
  SimplePriceFeed: {
    [eEthereumNetwork.buidlerevm]: ZERO_ADDRESS,
    [eEthereumNetwork.coverage]: ZERO_ADDRESS,
    [eEthereumNetwork.hardhat]: ZERO_ADDRESS,
    [eEthereumNetwork.tenderly]: ZERO_ADDRESS,
    [eElectroneumNetwork.testnet]: '0xFba006047BCeCc6E7402D8ae7a3ddCB8DB1CFf53',
    [eElectroneumNetwork.mainnet]: ZERO_ADDRESS,
  },
};
