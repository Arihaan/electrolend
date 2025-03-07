import { task } from 'hardhat/config';

import { eContractid, eNetwork } from '../../helpers/types';
import {
  getContractAddressWithJsonFallback,
  verifyContract,
} from '../../helpers/contracts-helpers';
import { DEPLOYMENT_CONTRACTS } from './oasys-deployment';
import { getDeployArgs } from '../../helpers/contracts-deployments';
import { ConfigNames } from '../../helpers/configuration';
require('dotenv').config();

task('verification', 'Verify contracts').setAction(async ({}, localBRE) => {
  await localBRE.run('set-DRE');
  if (!localBRE.network.config.chainId) {
    throw new Error('INVALID_CHAIN_ID');
  }
  const network = localBRE.network.name as eNetwork;
  for (const contract of [
    eContractid.ReserveLogic,
    eContractid.GenericLogic,
    eContractid.ValidationLogic,
    ...DEPLOYMENT_CONTRACTS,
  ]) {
    await verifyContract(
      contract,
      await getContractAddressWithJsonFallback(contract, ConfigNames.Palmy),
      await getDeployArgs(network, contract)
    );
  }
  console.log('\n✔️ Finished verification. ✔️');
});
