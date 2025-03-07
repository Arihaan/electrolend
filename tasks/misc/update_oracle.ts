import { task } from 'hardhat/config';
import { ICommonConfiguration, SymbolMap, eNetwork } from '../../helpers/types';

import { ConfigNames, getLendingRateOracles, loadPoolConfig } from '../../helpers/configuration';
import { getChainsightOracle, getPriceAggregator } from '../../helpers/contracts-getters';
import { waitForTx } from '../../helpers/misc-utils';
import { getParamPerNetwork } from '../../helpers/contracts-helpers';
import { BytesLike } from 'ethers';

task('update-oracle', '').setAction(async ({}, DRE) => {
  await DRE.run('set-DRE');
  const network = DRE.network.name as eNetwork;
  const poolConfig = loadPoolConfig(ConfigNames.Palmy);
  const {
    ProtocolGlobalParams: { UsdAddress },
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
});
