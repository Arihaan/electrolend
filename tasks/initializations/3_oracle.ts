import { task } from 'hardhat/config';
import { ICommonConfiguration, SymbolMap, eNetwork } from '../../helpers/types';

import { ConfigNames, getLendingRateOracles, loadPoolConfig } from '../../helpers/configuration';
import {
  getChainsightOracle,
  getFirstSigner,
  getLendingPoolAddressesProvider,
  getLendingRateOracle,
  getPalmyFallbackOracle,
  getPalmyOracle,
  getPriceAggregator,
} from '../../helpers/contracts-getters';
import { waitForTx } from '../../helpers/misc-utils';
import { getParamPerNetwork } from '../../helpers/contracts-helpers';
import { ZERO_ADDRESS } from '../../helpers/constants';
import { setInitialMarketRatesInRatesOracleByHelper } from '../../helpers/oracles-helpers';
import { BytesLike } from 'ethers';

task('oasys-initialization:oracle', '').setAction(async ({}, DRE) => {
  await DRE.run('set-DRE');
  const network = DRE.network.name as eNetwork;
  const poolConfig = loadPoolConfig(ConfigNames.Palmy);
  const {
    ProtocolGlobalParams: { UsdAddress },
    ReserveAssets,
    DIAAggregator,
    OraclePriceKey,
    OracleSenderAddress,
  } = poolConfig as ICommonConfiguration;
  const feedTokens = getParamPerNetwork(DIAAggregator, network);
  const chainsightOracle = await getChainsightOracle('');
  const oracleSenderAddress = await getParamPerNetwork(OracleSenderAddress, network);
  const oraclePriceKey = (await getParamPerNetwork(
    OraclePriceKey,
    network
  )) as SymbolMap<BytesLike>;
  const aggregator = await getPriceAggregator();
  await waitForTx(
    await aggregator.setAssetSources(
      Object.values(feedTokens),
      Object.values(feedTokens).map((_) => chainsightOracle.address),
      Object.values(feedTokens).map((_) => oracleSenderAddress),
      Object.keys(feedTokens).map((key) => oraclePriceKey[key])
    )
  );

  const fallbackOracle = await getPalmyFallbackOracle();
  await waitForTx(await fallbackOracle.authorizeSybil(await (await getFirstSigner()).getAddress()));
  const reserveAssets = getParamPerNetwork(ReserveAssets, network);
  const tokensToWatch: SymbolMap<string> = {
    ...reserveAssets,
    USD: UsdAddress,
  };
  const { USD, ...tokensAddressesWithoutUsd } = tokensToWatch;

  const palmyOracle = await getPalmyOracle();
  await waitForTx(await palmyOracle.initialize(aggregator.address, fallbackOracle.address));
  const lendingRateOrace = await getLendingRateOracle();
  await waitForTx(await palmyOracle.setPriceAggregator(aggregator.address));
  const lendingRateOracles = getLendingRateOracles(poolConfig);
  await setInitialMarketRatesInRatesOracleByHelper(
    lendingRateOracles,
    tokensAddressesWithoutUsd,
    lendingRateOrace,
    await (await getFirstSigner()).getAddress()
  );
  const addressProvider = await getLendingPoolAddressesProvider();
  await waitForTx(await addressProvider.setPriceOracle(palmyOracle.address));
  await waitForTx(await addressProvider.setLendingRateOracle(lendingRateOrace.address));
});
