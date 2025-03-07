import { task } from 'hardhat/config';

import {
  getLendingPoolAddressesProvider,
  getLendingPoolV4Impl,
} from '../../helpers/contracts-getters';
require('dotenv').config();

task('upgrade-pool-v3-to-v4', '').setAction(async ({}, localBRE) => {
  await localBRE.run('set-DRE');
  if (!localBRE.network.config.chainId) {
    throw new Error('INVALID_CHAIN_ID');
  }
  const addressProvider = await getLendingPoolAddressesProvider();
  const impl = await getLendingPoolV4Impl();
  // to v4
  await addressProvider.setLendingPoolImpl(impl.address);
});
