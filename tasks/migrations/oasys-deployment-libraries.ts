import { task } from 'hardhat/config';
import { eContractid, eNetwork, eOasysNetwork } from '../../helpers/types';
import { deployToOasysTestnet } from '../../helpers/contracts-helpers';
import { CommonsConfig } from '../../markets/palmy/commons';
import { getFirstSigner } from '../../helpers/contracts-getters';
import { ZERO_ADDRESS } from '../../helpers/constants';

task('oasys-deployment-libraries', 'Deploy Palmy oasys enviroment').setAction(async ({}, DRE) => {
  await DRE.run('set-DRE');

  console.log('Migration started\n');
  const network = (<eNetwork>DRE.network.name) as eNetwork;

  await DRE.run(`export-deploy-calldata-${eContractid.ReserveLogic}`);

  if (network !== eOasysNetwork.oasys) {
    await deployToOasysTestnet(eContractid.ReserveLogic);
  }

  await DRE.run(`export-deploy-calldata-${eContractid.GenericLogic}`);

  if (network !== eOasysNetwork.oasys) {
    await deployToOasysTestnet(eContractid.GenericLogic);
  }

  await DRE.run(`export-deploy-calldata-${eContractid.ValidationLogic}`);

  if (network !== eOasysNetwork.oasys) {
    await deployToOasysTestnet(eContractid.ValidationLogic);
  }
});
