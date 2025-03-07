import { task } from 'hardhat/config';
import { eContractid, eNetwork } from '../../helpers/types';
import { getParamPerNetwork, insertContractAddressInDb } from '../../helpers/contracts-helpers';
import { notFalsyOrZeroAddress, waitForTx } from '../../helpers/misc-utils';
import {
  getLTokensAndRatesHelper,
  getLendingPoolAddressesProvider,
  getLendingPoolConfiguratorImpl,
  getLendingPoolImpl,
  getStableAndVariableTokensHelper,
} from '../../helpers/contracts-getters';
import { ConfigNames, loadPoolConfig } from '../../helpers/configuration';

task('oasys-initialization:lending-pool', '').setAction(async ({}, DRE) => {
  await DRE.run('set-DRE');
  const network = DRE.network.name as eNetwork;
  const lendingPoolImpl = await getLendingPoolImpl();
  const addressProvider = await getLendingPoolAddressesProvider();
  await waitForTx(await addressProvider.setLendingPoolImpl(lendingPoolImpl.address));
  const lendingPoolAddress = await addressProvider.getLendingPool();
  await insertContractAddressInDb(eContractid.LendingPool, lendingPoolAddress);
  const configuratorImplAddress = (await getLendingPoolConfiguratorImpl()).address;
  await waitForTx(await addressProvider.setLendingPoolConfiguratorImpl(configuratorImplAddress));
  const lendPoolConfiguratorAddress = await addressProvider.getLendingPoolConfigurator();
  await insertContractAddressInDb(eContractid.LendingPoolConfigurator, lendPoolConfiguratorAddress);
  const stableAndVariableTokensHelper = await getStableAndVariableTokensHelper();
  if (!notFalsyOrZeroAddress(stableAndVariableTokensHelper.address)) {
    throw new Error('missing stableAndVariableTokensHelper');
  }
  await waitForTx(
    await stableAndVariableTokensHelper.initialize(lendingPoolAddress, addressProvider.address)
  );
  const ltokenAndRatesHelper = await getLTokensAndRatesHelper();
  if (!notFalsyOrZeroAddress(ltokenAndRatesHelper.address)) {
    throw new Error('missing ltokenAndRatesHelper');
  }
  await waitForTx(
    await ltokenAndRatesHelper.initialize(
      lendingPoolAddress,
      addressProvider.address,
      lendPoolConfiguratorAddress
    )
  );
});
