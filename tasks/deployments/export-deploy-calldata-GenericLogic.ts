import { task } from 'hardhat/config';
import { exportGenericLogicDeploymentCallData } from '../../helpers/contracts-deployments';
import {
  getContractAddressWithJsonFallback,
  saveDeploymentCallData,
} from '../../helpers/contracts-helpers';
import { eContractid, eNetwork } from '../../helpers/types';
import { ConfigNames } from '../../helpers/configuration';

const target = eContractid.GenericLogic;

task(`export-deploy-calldata-${target}`, '').setAction(async ({}, DRE) => {
  await DRE.run('set-DRE');
  const network = (<eNetwork>DRE.network.name) as eNetwork;
  const reserveLogicAddress = await getContractAddressWithJsonFallback(
    eContractid.ReserveLogic,
    ConfigNames.ElectroLend
  );
  const callData = await exportGenericLogicDeploymentCallData(reserveLogicAddress);
  await saveDeploymentCallData(target, callData);
});
