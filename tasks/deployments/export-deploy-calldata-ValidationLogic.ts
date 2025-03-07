import { task } from 'hardhat/config';
import { exportValidationLogicDeploymentCallData } from '../../helpers/contracts-deployments';
import {
  getContractAddressWithJsonFallback,
  getParamPerNetwork,
  saveDeploymentCallData,
} from '../../helpers/contracts-helpers';
import { eContractid, eNetwork } from '../../helpers/types';
import { CommonsConfig } from '../../markets/electrolend/commons';
import { notFalsyOrZeroAddress } from '../../helpers/misc-utils';
import { ConfigNames } from '../../helpers/configuration';

const target = eContractid.ValidationLogic;

task(`export-deploy-calldata-${target}`, '').setAction(async ({}, DRE) => {
  await DRE.run('set-DRE');
  const network = (<eNetwork>DRE.network.name) as eNetwork;
  const reserveLogicAddress = await getContractAddressWithJsonFallback(
    eContractid.ReserveLogic,
    ConfigNames.ElectroLend
  );
  const genericLogicAddress = await getContractAddressWithJsonFallback(
    eContractid.GenericLogic,
    ConfigNames.ElectroLend
  );
  const callData = await exportValidationLogicDeploymentCallData(
    reserveLogicAddress,
    genericLogicAddress
  );
  await saveDeploymentCallData(target, callData);
});
