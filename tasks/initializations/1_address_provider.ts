import { task } from 'hardhat/config';
import { eNetwork } from '../../helpers/types';
import { getParamPerNetwork } from '../../helpers/contracts-helpers';
import { notFalsyOrZeroAddress, waitForTx } from '../../helpers/misc-utils';
import {
  getLendingPoolAddressesProvider,
  getLendingPoolAddressesProviderRegistry,
} from '../../helpers/contracts-getters';
import {
  ConfigNames,
  getEmergencyAdmin,
  getGenesisPoolAdmin,
  loadPoolConfig,
} from '../../helpers/configuration';

task('oasys-initialization:address-provider', '').setAction(async ({}, DRE) => {
  await DRE.run('set-DRE');
  const poolConfig = loadPoolConfig(ConfigNames.ElectroLend);
  const { ProviderId } = poolConfig;
  console.log('Initialization started\n');
  const network = DRE.network.name as eNetwork;
  console.log(`Initialize Address providers`);

  // see: 1_address_provider.ts

  const registryAddress = (await getLendingPoolAddressesProviderRegistry()).address;
  if (!notFalsyOrZeroAddress(registryAddress)) {
    throw new Error('Provider Registry not deployed');
  }
  const addressesProvider = await getLendingPoolAddressesProvider();
  const registry = await getLendingPoolAddressesProviderRegistry(registryAddress);

  await waitForTx(await registry.registerAddressesProvider(addressesProvider.address, ProviderId));

  await waitForTx(await addressesProvider.setPoolAdmin(await getGenesisPoolAdmin(poolConfig)));

  await waitForTx(await addressesProvider.setEmergencyAdmin(await getEmergencyAdmin(poolConfig)));

  console.log('Pool Admin', await addressesProvider.getPoolAdmin());
  console.log('Emergency Admin', await addressesProvider.getEmergencyAdmin());
});
