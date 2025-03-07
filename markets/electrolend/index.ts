import { ZERO_ADDRESS } from '../../helpers/constants';
import {
  eElectroneumNetwork,
  eEthereumNetwork,
  IElectroConfiguration,
} from '../../helpers/types';
import { CommonsConfig } from './commons';
import {
  strategyWETN,
  strategyTUSDC,
  strategyTUSDT,
} from './reservesConfigs';

// ----------------
// POOL--SPECIFIC PARAMS
// ----------------

export const ElectroConfig: IElectroConfiguration = {
  ...CommonsConfig,
  MarketId: 'ElectroLend genesis market',
  ProviderId: 1,
  ReservesConfig: {
    WETN: strategyWETN,
    TUSDC: strategyTUSDC,
    TUSDT: strategyTUSDT,
  },
  ReserveAssets: {
    [eEthereumNetwork.buidlerevm]: {},
    [eEthereumNetwork.hardhat]: {},
    [eEthereumNetwork.coverage]: {},
    [eEthereumNetwork.tenderly]: {},
    [eElectroneumNetwork.testnet]: {
      WETN: '0x154c9fD7F006b92b6afa746098d8081A831DC1FC',
      TUSDC: '0x9a110A3Ecc8704e93Bd4FA1bA44D5CF93327202B',
      TUSDT: '0x02FeC8c559fB598762df8D033bD7A3Df9b374771',
    },
    [eElectroneumNetwork.mainnet]: {},
  },
};

export default ElectroConfig;
