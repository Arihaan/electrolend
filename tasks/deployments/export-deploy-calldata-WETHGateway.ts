import { task } from 'hardhat/config';
import { exportDeploymentCallData } from '../../helpers/contracts-deployments';
import { saveDeploymentCallData } from '../../helpers/contracts-helpers';
import { eContractid, eNetwork } from '../../helpers/types';

const target = eContractid.WETHGateway;

task(`export-deploy-calldata-${target}`, '').setAction(async ({}, DRE) => {
  await DRE.run('set-DRE');
  const callData = await exportDeploymentCallData(target);
  await saveDeploymentCallData(target, callData);
});
