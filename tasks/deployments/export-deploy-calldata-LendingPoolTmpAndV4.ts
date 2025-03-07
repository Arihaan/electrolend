import { task } from 'hardhat/config';
import {
  exportDeploymentCallData,
  exportLendingPoolTmpAndV4CallData,
} from '../../helpers/contracts-deployments';
import { saveDeploymentCallData } from '../../helpers/contracts-helpers';
import { eContractid, eNetwork } from '../../helpers/types';

const target = eContractid.LendingPoolAddressesProviderRegistry;

task(`export-deploy-calldata-LendingPoolTmpAndV4`, '').setAction(async ({}, DRE) => {
  await DRE.run('set-DRE');
  const callData = await exportLendingPoolTmpAndV4CallData();
  await saveDeploymentCallData(eContractid.LendingPoolTmpImpl, callData.lendingPoolTmpData);
  await saveDeploymentCallData(eContractid.LendingPoolV4Impl, callData.lendingPoolV4Data);
});
