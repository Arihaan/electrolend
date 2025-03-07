import { task } from 'hardhat/config';
import { ICommonConfiguration, eNetwork } from '../../helpers/types';

import { ConfigNames, loadPoolConfig } from '../../helpers/configuration';
import { getParamPerNetwork } from '../../helpers/contracts-helpers';
import {
  getLendingPoolAddressesProvider,
  getPalmyFallbackOracle,
  getWETHGateway,
} from '../../helpers/contracts-getters';
import { waitForTx } from '../../helpers/misc-utils';
import { INITIAL_PRICES } from '../../helpers/constants';
import { authorizeWETHGateway } from '../../helpers/contracts-deployments';

task('set-mock-price', '').setAction(async ({}, DRE) => {
  await DRE.run('set-DRE');
  const network = DRE.network.name as eNetwork;
  const poolConfig = loadPoolConfig(ConfigNames.Palmy);
  const {
    ReserveAssets,
    ProtocolGlobalParams: { UsdAddress },
  } = poolConfig as ICommonConfiguration;
  const addressProvider = await getLendingPoolAddressesProvider();
  const lendPool = await addressProvider.getLendingPool();
  console.log(
    `Lending pool address: ${lendPool}, address provider: ${
      addressProvider.address
    }, WETH gateway: ${(await getWETHGateway()).address}`
  );
  await authorizeWETHGateway(
    (
      await getWETHGateway()
    ).address,
    await addressProvider.getLendingPool()
  );
  const reserveAssets = await getParamPerNetwork(ReserveAssets, network);
  const fallBackOracle = await getPalmyFallbackOracle();
  const initPrices = INITIAL_PRICES;
  for (const [symbol, price] of Object.entries(initPrices)) {
    if (symbol === 'USD') {
      console.log(`Setting ${symbol} price to ${price} with address: ${UsdAddress}}`);
      await waitForTx(await fallBackOracle.submitPrices([UsdAddress], [price]));
      continue;
    }
    console.log(`Setting ${symbol} price to ${price} with address: ${reserveAssets[symbol]}}`);
    await waitForTx(await fallBackOracle.submitPrices([reserveAssets[symbol]], [price]));
  }
});
