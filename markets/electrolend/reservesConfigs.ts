import { eContractid, IReserveParams } from '../../helpers/types';
import {
  rateStrategyStable,
  rateStrategyWETN,
} from './rateStrategies';

export const strategyTUSDC: IReserveParams = {
  strategy: rateStrategyStable,
  baseLTVAsCollateral: '8000',
  liquidationThreshold: '8500',
  liquidationBonus: '10500',
  borrowingEnabled: true,
  stableBorrowRateEnabled: false,
  reserveDecimals: '6',
  elTokenImpl: eContractid.ELToken,
  reserveFactor: '1000',
};

export const strategyTUSDT: IReserveParams = {
  strategy: rateStrategyStable,
  baseLTVAsCollateral: '8000',
  liquidationThreshold: '8500',
  liquidationBonus: '10500',
  borrowingEnabled: true,
  stableBorrowRateEnabled: false,
  reserveDecimals: '18',
  elTokenImpl: eContractid.ELToken,
  reserveFactor: '1000',
};

export const strategyWETN: IReserveParams = {
  strategy: rateStrategyWETN,
  baseLTVAsCollateral: '8000',
  liquidationThreshold: '8500',
  liquidationBonus: '10500',
  borrowingEnabled: true,
  stableBorrowRateEnabled: false,
  reserveDecimals: '18',
  elTokenImpl: eContractid.ELToken,
  reserveFactor: '1000',
};

