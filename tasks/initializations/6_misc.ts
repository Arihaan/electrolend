import { task } from 'hardhat/config';
import { ICommonConfiguration, eContractid, eNetwork } from '../../helpers/types';

import {
  ConfigNames,
  getTreasuryAddress,
  getWrappedNativeTokenAddress,
  loadPoolConfig,
} from '../../helpers/configuration';
import {
  getContractAddressWithJsonFallback,
  getParamPerNetwork,
} from '../../helpers/contracts-helpers';
import { configureReservesByHelper } from '../../helpers/init-helpers';
import {
  getFirstSigner,
  getLTokensAndRatesHelper,
  getLendingPoolAddressesProvider,
  getLendingPoolCollateralManager,
  getLendingPoolConfiguratorProxy,
  getPalmyOracle,
  getPalmyProtocolDataProvider,
  getPriceAggregator,
  getStakeUIHelper,
  getWETHGateway,
} from '../../helpers/contracts-getters';
import { BigNumberish } from 'ethers';
import { omit, waitForTx } from '../../helpers/misc-utils';
import { authorizeWETHGateway } from '../../helpers/contracts-deployments';
import { UiPoolDataProviderV2Factory } from '../../types';

task('oasys-initialization:misc', '').setAction(async ({}, DRE) => {
  await DRE.run('set-DRE');
  const network = DRE.network.name as eNetwork;
  const poolConfig = loadPoolConfig(ConfigNames.Palmy);
  const {
    LTokenNamePrefix,
    StableDebtTokenNamePrefix,
    VariableDebtTokenNamePrefix,
    SymbolPrefix,
    ReserveAssets,
    ReservesConfig,
    IncentivesController,
    StakedOas,
    ProtocolGlobalParams: { UsdAddress },
  } = poolConfig as ICommonConfiguration;
  const reserveAssets = await getParamPerNetwork(ReserveAssets, network);
  if (!reserveAssets) {
    throw 'Reserve assets is undefined. Check ReserveAssets configuration at config directory';
  }
  const reservesConfigAtLaunch = omit(ReservesConfig, ['USDC', 'USDT']);
  const lTokensAndRatesHelper = await getLTokensAndRatesHelper();

  // initialize lTokens and strategies
  const initRateDeploymentParam: {
    asset: string;
    rates: [BigNumberish, BigNumberish, BigNumberish, BigNumberish, BigNumberish, BigNumberish];
  }[] = Object.entries(reservesConfigAtLaunch).map(([symbol, config]) => {
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
  const tx = await lTokensAndRatesHelper.initDeployment(initRateDeploymentParam);
  const receipt = await tx.wait();
  const lTokensAndStrategies: { symbol: string; lToken: string; strategy: string }[] =
    receipt.events!.map((event, i) => {
      const eventArgs = event.args!;
      const lToken = eventArgs[0];
      const strategy = eventArgs[1];
      const symbol = Object.keys(reservesConfigAtLaunch)[i];
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
  const reservesConfig = Object.entries(reservesConfigAtLaunch);
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
    reservesConfigAtLaunch,
    reserveAssets,
    await getPalmyProtocolDataProvider(),
    await (await getFirstSigner()).getAddress()
  );
  const collateralManager = await getLendingPoolCollateralManager();
  const addressProvider = await getLendingPoolAddressesProvider();
  await waitForTx(await addressProvider.setLendingPoolCollateralManager(collateralManager.address));
  const dataProvider = await getPalmyProtocolDataProvider();
  await waitForTx(
    await addressProvider.setAddress(
      '0x0100000000000000000000000000000000000000000000000000000000000000',
      dataProvider.address
    )
  );
  await authorizeWETHGateway(
    (
      await getWETHGateway()
    ).address,
    await addressProvider.getLendingPool()
  );
  const stakeUIHelper = await getStakeUIHelper();

  const palmyOracle = await getPalmyOracle();
  const wOAS = await getWrappedNativeTokenAddress(poolConfig);
  await waitForTx(
    await stakeUIHelper.initialize(
      palmyOracle.address,
      wOAS,
      await getParamPerNetwork(StakedOas, network),
      UsdAddress
    )
  );
  const uiPoolDataProvider = UiPoolDataProviderV2Factory.connect(
    await getContractAddressWithJsonFallback(eContractid.UiPoolDataProviderV2, ConfigNames.Palmy),
    await getFirstSigner()
  );
  const aggregatorAddress = (await getPriceAggregator()).address;
  await waitForTx(await uiPoolDataProvider.initialize(aggregatorAddress, UsdAddress));
});
