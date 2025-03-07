import { task } from 'hardhat/config';

import { eNetwork } from '../../helpers/types';
import {
  getLendingPoolAddressesProvider,
  getLendingPoolTmpImpl,
} from '../../helpers/contracts-getters';
require('dotenv').config();

task('upgrade-pool-v2-to-v3', '').setAction(async ({}, localBRE) => {
  await localBRE.run('set-DRE');
  if (!localBRE.network.config.chainId) {
    throw new Error('INVALID_CHAIN_ID');
  }
  const network = localBRE.network.name as eNetwork;
  const addressProvider = await getLendingPoolAddressesProvider();
  const impl = await getLendingPoolTmpImpl();
  // to v3
  await addressProvider.setLendingPoolImpl(impl.address);
});
