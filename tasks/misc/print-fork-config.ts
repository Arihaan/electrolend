import { task } from 'hardhat/config';
import { getPalmyProtocolDataProvider } from '../../helpers/contracts-getters';

task('print-config:fork', 'Deploy development enviroment')
  .addFlag('verify', 'Verify contracts at Etherscan')
  .setAction(async ({ verify }, DRE) => {
    await DRE.run('set-DRE');
    await DRE.run('palmy:oasys');

    const dataProvider = await getPalmyProtocolDataProvider();
    await DRE.run('print-config', { dataProvider: dataProvider.address, pool: 'Palmy' });
  });
