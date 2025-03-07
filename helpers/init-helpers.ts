import { BigNumberish } from 'ethers';
import { ElectroProtocolDataProvider } from '../types/ElectroProtocolDataProvider';
import { ConfigNames } from './configuration';
import { deployRateStrategy } from './contracts-deployments';
import {
  getELToken,
  getELTokensAndRatesHelper,
  getLendingPoolAddressesProvider,
  getLendingPoolConfiguratorProxy,
} from './contracts-getters';
import {
  getContractAddressWithJsonFallback,
  rawInsertContractAddressInDb,
} from './contracts-helpers';
import { chunk, getDb, notFalsyOrZeroAddress, waitForTx } from './misc-utils';
import {
  eContractid,
  eNetwork,
  iMultiPoolsAssets,
  IReserveParams,
  tEthereumAddress,
} from './types';

export const getELTokenExtraParams = async (elTokenName: string, tokenAddress: tEthereumAddress) => {
  console.log(elTokenName);
  switch (elTokenName) {
    default:
      return '0x10';
  }
};

export const initReservesByHelperWithELtokenAndRates = async (
  reservesParams: iMultiPoolsAssets<IReserveParams>,
  tokenAddresses: { [symbol: string]: tEthereumAddress },
  elTokenNamePrefix: string,
  stableDebtTokenNamePrefix: string,
  variableDebtTokenNamePrefix: string,
  symbolPrefix: string,
  admin: tEthereumAddress,
  treasuryAddress: tEthereumAddress,
  incentivesController: tEthereumAddress,
  poolName: ConfigNames,
  verify: boolean,
  lendingPoolAddressProviderAddress?: tEthereumAddress,
  lendingPoolConfiguratorProxyAddress?: tEthereumAddress,
  strategyAddresses?: Record<string, tEthereumAddress>
) => {
  let initInputParams: {
    elTokenImpl: string;
    stableDebtTokenImpl: string;
    variableDebtTokenImpl: string;
    underlyingAssetDecimals: BigNumberish;
    interestRateStrategyAddress: string;
    underlyingAsset: string;
    treasury: string;
    incentivesController: string;
    underlyingAssetName: string;
    elTokenName: string;
    elTokenSymbol: string;
    variableDebtTokenName: string;
    variableDebtTokenSymbol: string;
    stableDebtTokenName: string;
    stableDebtTokenSymbol: string;
    params: string;
  }[] = [];
};

export const initReservesByHelper = async (
  reservesParams: iMultiPoolsAssets<IReserveParams>,
  tokenAddresses: { [symbol: string]: tEthereumAddress },
  elTokenNamePrefix: string,
  stableDebtTokenNamePrefix: string,
  variableDebtTokenNamePrefix: string,
  symbolPrefix: string,
  admin: tEthereumAddress,
  treasuryAddress: tEthereumAddress,
  incentivesController: tEthereumAddress,
  poolName: ConfigNames,
  verify: boolean,
  lendingPoolAddressProviderAddress?: tEthereumAddress,
  lendingPoolConfiguratorProxyAddress?: tEthereumAddress,
  strategyAddresses?: Record<string, tEthereumAddress>
) => {
  const addressProvider = await getLendingPoolAddressesProvider(lendingPoolAddressProviderAddress);

  // CHUNK CONFIGURATION
  const initChunks = 1;

  // Initialize variables for future reserves initialization
  let reserveSymbols: string[] = [];

  let initInputParams: {
    elTokenImpl: string;
    stableDebtTokenImpl: string;
    variableDebtTokenImpl: string;
    underlyingAssetDecimals: BigNumberish;
    interestRateStrategyAddress: string;
    underlyingAsset: string;
    treasury: string;
    incentivesController: string;
    underlyingAssetName: string;
    elTokenName: string;
    elTokenSymbol: string;
    variableDebtTokenName: string;
    variableDebtTokenSymbol: string;
    stableDebtTokenName: string;
    stableDebtTokenSymbol: string;
    params: string;
  }[] = [];

  let strategyRates: [
    string, // addresses provider
    string,
    string,
    string,
    string,
    string,
    string
  ];
  let rateStrategies: Record<string, typeof strategyRates> = {};
  let strategies: Record<string, tEthereumAddress> = strategyAddresses || {};
  const reserves = Object.entries(reservesParams);

  for (let [symbol, params] of reserves) {
    if (!tokenAddresses[symbol]) {
      console.log(`- Skipping init of ${symbol} due token address is not set at markets config`);
      continue;
    }
    const { strategy, elTokenImpl, reserveDecimals } = params;
    const {
      optimalUtilizationRate,
      baseVariableBorrowRate,
      variableRateSlope1,
      variableRateSlope2,
      stableRateSlope1,
      stableRateSlope2,
    } = strategy;
    if (!strategies[strategy.name]) {
      // Strategy does not exist, create a new one
      rateStrategies[strategy.name] = [
        addressProvider.address,
        optimalUtilizationRate,
        baseVariableBorrowRate,
        variableRateSlope1,
        variableRateSlope2,
        stableRateSlope1,
        stableRateSlope2,
      ];
      strategies[strategy.name] = await deployRateStrategy(
        strategy.name,
        rateStrategies[strategy.name],
        verify
      );

      // This causes the last strategy to be printed twice, once under "DefaultReserveInterestRateStrategy"
      // and once under the actual `strategyASSET` key.
      rawInsertContractAddressInDb(strategy.name, strategies[strategy.name]);
    }
    if (!notFalsyOrZeroAddress(tokenAddresses[symbol])) {
      throw new Error(`token address of ${symbol} is not defined`);
    }
    if (!notFalsyOrZeroAddress(strategies[strategy.name])) {
      throw new Error(`strategy address of ${strategies[strategy.name]} is not defined`);
    }
    const elTokenImplAddress = await getContractAddressWithJsonFallback(elTokenImpl, poolName);
    if (!notFalsyOrZeroAddress(elTokenImplAddress)) {
      throw new Error(`address of elTokenImpl is not defined`);
    }
    const sdTokenImplAddress = await getContractAddressWithJsonFallback(
      eContractid.StableDebtToken,
      poolName
    );
    if (!notFalsyOrZeroAddress(sdTokenImplAddress)) {
      throw new Error(`address of sdTokenImpl is not defined`);
    }
    const vdTokenImplAddress = await getContractAddressWithJsonFallback(
      eContractid.VariableDebtToken,
      poolName
    );
    if (!notFalsyOrZeroAddress(vdTokenImplAddress)) {
      throw new Error(`address of elTokenImpl is not defined`);
    }
    if (!notFalsyOrZeroAddress(tokenAddresses[symbol])) {
      throw new Error(`underlying asset address of ${tokenAddresses[symbol]} is not defined`);
    }
    if (!notFalsyOrZeroAddress(treasuryAddress)) {
      throw new Error(`treasury address is not defined`);
    }
    // Prepare input parameters
    reserveSymbols.push(symbol);
    initInputParams.push({
      elTokenImpl: elTokenImplAddress,
      stableDebtTokenImpl: sdTokenImplAddress,
      variableDebtTokenImpl: vdTokenImplAddress,
      underlyingAssetDecimals: reserveDecimals,
      interestRateStrategyAddress: strategies[strategy.name],
      underlyingAsset: tokenAddresses[symbol],
      treasury: treasuryAddress,
      incentivesController: incentivesController,
      underlyingAssetName: symbol,
      elTokenName: `${elTokenNamePrefix} ${symbol}`,
      elTokenSymbol: `l${symbolPrefix}${symbol}`,
      variableDebtTokenName: `${variableDebtTokenNamePrefix} ${symbolPrefix}${symbol}`,
      variableDebtTokenSymbol: `vd${symbolPrefix}${symbol}`,
      stableDebtTokenName: `${stableDebtTokenNamePrefix} ${symbol}`,
      stableDebtTokenSymbol: `sd${symbolPrefix}${symbol}`,
      params: await getELTokenExtraParams(elTokenImpl, tokenAddresses[symbol]),
    });
  }

  // Deploy init reserves per chunks
  const chunkedSymbols = chunk(reserveSymbols, initChunks);
  const chunkedInitInputParams = chunk(initInputParams, initChunks);

  const configurator = await getLendingPoolConfiguratorProxy(lendingPoolConfiguratorProxyAddress);

  console.log(`- Reserves initialization in ${chunkedInitInputParams.length} txs`);
  for (let chunkIndex = 0; chunkIndex < chunkedInitInputParams.length; chunkIndex++) {
    const tx3 = await waitForTx(
      await configurator.batchInitReserve(chunkedInitInputParams[chunkIndex])
    );

    console.log(`  - Reserve ready for: ${chunkedSymbols[chunkIndex].join(', ')}`);
    console.log('    * gasUsed', tx3.gasUsed.toString());
  }
};

export const getPairsTokenAggregator = (
  allAssetsAddresses: {
    [tokenSymbol: string]: tEthereumAddress;
  },
  aggregatorsAddresses: { [tokenSymbol: string]: tEthereumAddress }
): [string[], string[]] => {
  const { ETH, USD, WETH, ...assetsAddressesWithoutEth } = allAssetsAddresses;

  const pairs = Object.entries(assetsAddressesWithoutEth).map(([tokenSymbol, tokenAddress]) => {
    if (tokenSymbol !== 'WETH' && tokenSymbol !== 'ETH') {
      const aggregatorAddressIndex = Object.keys(aggregatorsAddresses).findIndex(
        (value) => value === tokenSymbol
      );
      const [, aggregatorAddress] = (
        Object.entries(aggregatorsAddresses) as [string, tEthereumAddress][]
      )[aggregatorAddressIndex];
      return [tokenAddress, aggregatorAddress];
    }
  }) as [string, string][];

  const mappedPairs = pairs.map(([asset]) => asset);
  const mappedAggregators = pairs.map(([, source]) => source);

  return [mappedPairs, mappedAggregators];
};

export const configureReservesByHelper = async (
  reservesParams: iMultiPoolsAssets<IReserveParams>,
  tokenAddresses: { [symbol: string]: tEthereumAddress },
  helpers: ElectroProtocolDataProvider,
  admin: tEthereumAddress,
  lendingPoolAddressesProviderAddress?: tEthereumAddress,
  lTokensAndRatesHelperAddress?: tEthereumAddress
) => {
  const addressProvider = await getLendingPoolAddressesProvider(
    lendingPoolAddressesProviderAddress
  );
  const eltokenAndRatesDeployer = await getELTokensAndRatesHelper(lTokensAndRatesHelperAddress);
  const tokens: string[] = [];
  const symbols: string[] = [];

  const inputParams: {
    asset: string;
    baseLTV: BigNumberish;
    liquidationThreshold: BigNumberish;
    liquidationBonus: BigNumberish;
    reserveFactor: BigNumberish;
    stableBorrowingEnabled: boolean;
    borrowingEnabled: boolean;
  }[] = [];

  for (const [
    assetSymbol,
    {
      baseLTVAsCollateral,
      liquidationBonus,
      liquidationThreshold,
      reserveFactor,
      stableBorrowRateEnabled,
      borrowingEnabled,
    },
  ] of Object.entries(reservesParams) as [string, IReserveParams][]) {
    if (!tokenAddresses[assetSymbol]) {
      console.log(
        `- Skipping init of ${assetSymbol} due token address is not set at markets config`
      );
      continue;
    }
    if (baseLTVAsCollateral === '-1') continue;

    const assetAddressIndex = Object.keys(tokenAddresses).findIndex(
      (value) => value === assetSymbol
    );
    const [, tokenAddress] = (Object.entries(tokenAddresses) as [string, string][])[
      assetAddressIndex
    ];
    const { usageAsCollateralEnabled: alreadyEnabled } = await helpers.getReserveConfigurationData(
      tokenAddress
    );

    if (alreadyEnabled) {
      console.log(`- Reserve ${assetSymbol} is already enabled as collateral, skipping`);
      continue;
    }

    if (!notFalsyOrZeroAddress(tokenAddress)) {
      throw new Error(`token address of ${assetSymbol} is not defined`);
    }
    // Push data

    inputParams.push({
      asset: tokenAddress,
      baseLTV: baseLTVAsCollateral,
      liquidationThreshold: liquidationThreshold,
      liquidationBonus: liquidationBonus,
      reserveFactor: reserveFactor,
      stableBorrowingEnabled: stableBorrowRateEnabled,
      borrowingEnabled: borrowingEnabled,
    });

    tokens.push(tokenAddress);
    symbols.push(assetSymbol);
  }
  if (tokens.length) {
    // Set lTokenAndRatesDeployer as temporal admin
    await waitForTx(await addressProvider.setPoolAdmin(eltokenAndRatesDeployer.address));

    // Deploy init per chunks
    const enableChunks = 20;
    const chunkedSymbols = chunk(symbols, enableChunks);
    const chunkedInputParams = chunk(inputParams, enableChunks);

    console.log(`- Configure reserves in ${chunkedInputParams.length} txs`);
    for (let chunkIndex = 0; chunkIndex < chunkedInputParams.length; chunkIndex++) {
      await waitForTx(
        await eltokenAndRatesDeployer.configureReserves(chunkedInputParams[chunkIndex])
      );
      console.log(`  - Init for: ${chunkedSymbols[chunkIndex].join(', ')}`);
    }
    // Set deployer back as admin
    await waitForTx(await addressProvider.setPoolAdmin(admin));
  }
};

const getAddressById = async (
  id: string,
  network: eNetwork
): Promise<tEthereumAddress | undefined> =>
  (await getDb().get(`${id}.${network}`).value())?.address || undefined;

// Function deprecated
const isErc20SymbolCorrect = async (token: tEthereumAddress, symbol: string) => {
  const erc20 = await getELToken(token); // using elToken for ERC20 interface
  const erc20Symbol = await erc20.symbol();
  return symbol === erc20Symbol;
};
