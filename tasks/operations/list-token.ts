import { task } from 'hardhat/config';
import { ICommonConfiguration, eContractid, eNetwork } from '../../helpers/types';

import {
  ConfigNames,
  getLendingRateOracles,
  getTreasuryAddress,
  loadPoolConfig,
} from '../../helpers/configuration';
import {
  getContractAddressWithJsonFallback,
  getParamPerNetwork,
} from '../../helpers/contracts-helpers';
import { configureReservesByHelper } from '../../helpers/init-helpers';
import {
  getFirstSigner,
  getELTokensAndRatesHelper,
  getLendingPoolConfiguratorProxy,
  getElectroProtocolDataProvider,
} from '../../helpers/contracts-getters';
import { BigNumberish } from 'ethers';
import { setInitialMarketRatesInRatesOracleByHelper } from '../../helpers/oracles-helpers';

task('list-token', '').setAction(async ({}, DRE) => {
  await DRE.run('set-DRE');
  const network = DRE.network.name as eNetwork;
  const poolConfig = loadPoolConfig(ConfigNames.ElectroLend);
  const {
    ELTokenNamePrefix,
    StableDebtTokenNamePrefix,
    VariableDebtTokenNamePrefix,
    SymbolPrefix,
    ReserveAssets,
    ReservesConfig,
    IncentivesController,
  } = poolConfig as ICommonConfiguration;
  const reserveAssets = await getParamPerNetwork(ReserveAssets, network);
  if (!reserveAssets) {
    throw 'Reserve assets is undefined. Check ReserveAssets configuration at config directory';
  }
  const reservesConfigToBeDeployed = { MCHC: ReservesConfig.MCHC };
  const elTokensAndRatesHelper = await getELTokensAndRatesHelper();

  // initialize lTokens and strategies
  const initRateDeploymentParam: {
    asset: string;
    rates: [BigNumberish, BigNumberish, BigNumberish, BigNumberish, BigNumberish, BigNumberish];
  }[] = Object.entries(reservesConfigToBeDeployed).map(([symbol, config]) => {
    const address = reserveAssets[symbol];
    if (!address) {
      throw `Address of ${symbol} is undefined. Check ReserveAssets configuration at config directory`;
    }
    const {
      optimalUtilizationRate,
      baseVariableBorrowRate,
      variableRateSlope1,
      variableRateSlope2,
      stableRateSlope1,
      stableRateSlope2,
    } = config.strategy;
    return {
      asset: address,
      rates: [
        optimalUtilizationRate,
        baseVariableBorrowRate,
        variableRateSlope1,
        variableRateSlope2,
        stableRateSlope1,
        stableRateSlope2,
      ],
    };
  });
  const tx = await elTokensAndRatesHelper.initDeployment(initRateDeploymentParam);
  const receipt = await tx.wait();
  const lTokensAndStrategies: { symbol: string; lToken: string; strategy: string }[] =
    receipt.events!.map((event, i) => {
      const eventArgs = event.args!;
      const lToken = eventArgs[0];
      const strategy = eventArgs[1];
      const symbol = Object.keys(reservesConfigToBeDeployed)[i];
      return { symbol, lToken, strategy };
    });
  let initInputParams: {
    lTokenImpl: string;
    stableDebtTokenImpl: string;
    variableDebtTokenImpl: string;
    underlyingAssetDecimals: BigNumberish;
    interestRateStrategyAddress: string;
    underlyingAsset: string;
    treasury: string;
    incentivesController: string;
    underlyingAssetName: string;
    lTokenName: string;
    lTokenSymbol: string;
    variableDebtTokenName: string;
    variableDebtTokenSymbol: string;
    stableDebtTokenName: string;
    stableDebtTokenSymbol: string;
    params: string;
  }[] = [];
  const ltokenImplAddress = await getContractAddressWithJsonFallback(
    eContractid.LToken,
    ConfigNames.Palmy
  );
  const stableDebtTokenImplAddress = await getContractAddressWithJsonFallback(
    eContractid.StableDebtToken,
    ConfigNames.Palmy
  );
  const variableDebtTokenImplAddress = await getContractAddressWithJsonFallback(
    eContractid.VariableDebtToken,
    ConfigNames.Palmy
  );
  const treasuryAddress = await getTreasuryAddress(poolConfig);
  const incentivesController = await getParamPerNetwork(IncentivesController, network);
  const reservesConfig = Object.entries(reservesConfigToBeDeployed);
  for (const { symbol, strategy } of lTokensAndStrategies) {
    const [, params] = reservesConfig.find(([symbol]) => symbol === symbol)!;
    const underlyingAssetDecimals = params.reserveDecimals;
    const underlyingAsset = reserveAssets[symbol];
    const underlyingAssetName = symbol;
    initInputParams.push({
      lTokenImpl: ltokenImplAddress,
      stableDebtTokenImpl: stableDebtTokenImplAddress,
      variableDebtTokenImpl: variableDebtTokenImplAddress,
      underlyingAssetDecimals,
      interestRateStrategyAddress: strategy,
      underlyingAsset,
      treasury: treasuryAddress,
      incentivesController,
      underlyingAssetName,
      lTokenName: `${LTokenNamePrefix} ${symbol}`,
      lTokenSymbol: `l${SymbolPrefix}${symbol}`,
      variableDebtTokenName: `${VariableDebtTokenNamePrefix} ${symbol}`,
      variableDebtTokenSymbol: `vd${SymbolPrefix}${symbol}`,
      stableDebtTokenName: `${StableDebtTokenNamePrefix} ${symbol}`,
      stableDebtTokenSymbol: `$vd${SymbolPrefix}${symbol}`,
      params: '0x10',
    });
  }
  const configurator = await getLendingPoolConfiguratorProxy();
  await configurator.batchInitReserve(initInputParams);
  await configureReservesByHelper(
    reservesConfigToBeDeployed,
    reserveAssets,
    await getPalmyProtocolDataProvider(),
    await (await getFirstSigner()).getAddress()
  );
});
