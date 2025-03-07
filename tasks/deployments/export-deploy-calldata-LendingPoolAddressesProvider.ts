import { task } from 'hardhat/config';
import { saveDeploymentCallData } from '../../helpers/contracts-helpers';
import { eContractid } from '../../helpers/types';
import { exportDeploymentCallData } from '../../helpers/contracts-deployments';

const target = eContractid.LendingPoolAddressesProvider;

task(`export-deploy-calldata-${target}`, '').setAction(async ({}, DRE) => {
  await DRE.run('set-DRE');
  const callData = await exportDeploymentCallData(target);
  await saveDeploymentCallData(eContractid.LendingPoolAddressesProvider, callData);
});
