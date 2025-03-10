import { getTreasuryAddress } from './../../helpers/configuration';
import { getParamPerNetwork } from './../../helpers/contracts-helpers';
import { BigNumberish, BytesLike } from 'ethers';
import { task } from 'hardhat/config';
import { config } from 'process';
import { ConfigNames, loadPoolConfig } from '../../helpers/configuration';
import { configureReservesByHelper, initReservesByHelper } from '../../helpers/init-helpers';
import { setDRE } from '../../helpers/misc-utils';
import { eEthereumNetwork, eNetwork, ICommonConfiguration } from '../../helpers/types';
import * as marketConfigs from '../../markets/electrolend';
import * as reserveConfigs from '../../markets/electrolend/reservesConfigs';
import { MOCK_PRICE_AGGREGATORS_PRICES, ZERO_ADDRESS } from './../../helpers/constants';
import {
  chooseELTokenDeployment,
  deployDefaultReserveInterestRateStrategy,
  deployStableDebtToken,
  deployVariableDebtToken,
} from './../../helpers/contracts-deployments';
import {
  getFirstSigner,
  getLendingPool,
  getLendingPoolAddressesProvider,
  getElectroFallbackOracle,
  getElectroProtocolDataProvider,
} from './../../helpers/contracts-getters';
import { setAssetPricesInFallbackOracle } from '../../helpers/oracles-helpers';
import { MintableDelegationERC20Factory } from '../../types';
import { parseEther } from 'ethers/lib/utils';

const LENDING_POOL_ADDRESS_PROVIDER = {
  main: '0xb53c1a33016b2dc2ff3653530bff1848a515c8c5',
  shiden: '0xa70fFbaFE4B048798bBCBDdfB995fcCec2D1f2CA',
};

const isSymbolValid = (symbol: string, network: eEthereumNetwork) =>
  Object.keys(reserveConfigs).includes('strategy' + symbol) &&
  marketConfigs.ElectroConfig.ReserveAssets[network][symbol] &&
  marketConfigs.ElectroConfig.ReservesConfig[symbol] === reserveConfigs['strategy' + symbol];

task('external:deploy-new-asset', 'Deploy A token, Debt Tokens, Risk Parameters')
  .addParam('symbol', `Asset symbol, needs to have configuration ready`)
  .addFlag('verify', 'Verify contracts at Etherscan')
  .addParam('pool', `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .setAction(async ({ verify, symbol, pool }, localBRE) => {
    const network = <eNetwork>localBRE.network.name;
    if (!isSymbolValid(symbol, network as eEthereumNetwork)) {
      throw new Error(
        `
WRONG RESERVE ASSET SETUP:
        The symbol ${symbol} has no reserve Config and/or reserve Asset setup.
        update /markets/electrolend/index.ts and add the asset address for ${network} network
        update /markets/electrolend/reservesConfigs.ts and add parameters for ${symbol}
        `
      );
    }
    setDRE(localBRE);
    const poolConfig = loadPoolConfig(pool);
    const { IncentivesController } = poolConfig as ICommonConfiguration;
    const strategyParams = reserveConfigs['strategy' + symbol];
    const reserveAssetAddress =
      marketConfigs.ElectroConfig.ReserveAssets[localBRE.network.name][symbol];
    const deployCustomELToken = chooseELTokenDeployment(strategyParams.lTokenImpl);
    const addressProvider = await getLendingPoolAddressesProvider(
      LENDING_POOL_ADDRESS_PROVIDER[network]
    );

    const poolAddress = await addressProvider.getLendingPool();
    const elToken = await deployCustomELToken(verify);
    const incentivesController = getParamPerNetwork(IncentivesController, network);

    const stableDebt = await deployStableDebtToken(
      [
        poolAddress,
        reserveAssetAddress,
        incentivesController, // Incentives Controller
        `ElectroLend stable debt bearing ${symbol}`,
        `sd${symbol}`,
      ],
      verify
    );
    const variableDebt = await deployVariableDebtToken(
      [
        poolAddress,
        reserveAssetAddress,
        incentivesController, // Incentives Controller
        `ElectroLend variable debt bearing ${symbol}`,
        `vd${symbol}`,
      ],
      verify
    );
    const rates = await deployDefaultReserveInterestRateStrategy(
      [
        addressProvider.address,
        strategyParams.strategy.optimalUtilizationRate,
        strategyParams.strategy.baseVariableBorrowRate,
        strategyParams.strategy.variableRateSlope1,
        strategyParams.strategy.variableRateSlope2,
        strategyParams.strategy.stableRateSlope1,
        strategyParams.strategy.stableRateSlope2,
      ],
      verify
    );

    console.log(`
    New interest bearing asset deployed on ${network}:
    Interest bearing el${symbol} address: ${elToken.address}
    Variable Debt vd${symbol} address: ${variableDebt.address}
    Stable Debt sd${symbol} address: ${stableDebt.address}
    Strategy Implementation for ${symbol} address: ${rates.address}
    `);
    return {
      lTokenAddress: elToken.address,
      vdTokenAddress: variableDebt.address,
      stableDebtTokenAddress: stableDebt.address,
    };
  });
