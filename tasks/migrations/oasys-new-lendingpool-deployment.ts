import { task } from 'hardhat/config';
import { eContractid, eNetwork, eOasysNetwork } from '../../helpers/types';
import { deployToOasysTestnet, insertContractAddressInDb } from '../../helpers/contracts-helpers';
import { printContracts } from '../../helpers/misc-utils';

task('oasys-deployment-new-lendingpool', 'Deploy Palmy oasys enviroment').setAction(
  async ({}, DRE) => {
    await DRE.run('set-DRE');

    console.log('Migration started\n');

    await DRE.run(`export-deploy-calldata-LendingPoolTmpAndV4`);
    const network = DRE.network.name as eNetwork;
    if (network === eOasysNetwork.oasys) {
      console.log('Exporting Finished');
      return;
    }

    for (const contract of [eContractid.LendingPoolTmpImpl, eContractid.LendingPoolV4Impl]) {
      const deployment = await deployToOasysTestnet(contract);
      await insertContractAddressInDb(contract, deployment.contractAddress);
    }
    printContracts();
  }
);
