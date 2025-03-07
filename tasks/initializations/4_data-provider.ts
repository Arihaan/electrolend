import { task } from 'hardhat/config';
import { eNetwork } from '../../helpers/types';

import { ConfigNames, loadPoolConfig } from '../../helpers/configuration';
import {
  getLendingPoolAddressesProvider,
  getPalmyProtocolDataProvider,
} from '../../helpers/contracts-getters';
import { waitForTx } from '../../helpers/misc-utils';

task('oasys-initialization:data-provider', '').setAction(async ({}, DRE) => {
  await DRE.run('set-DRE');
  const dataProvider = await getPalmyProtocolDataProvider();
  await waitForTx(await dataProvider.initialize((await getLendingPoolAddressesProvider()).address));
});
