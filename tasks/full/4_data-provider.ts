import { task } from 'hardhat/config';
import { exit } from 'process';
import { deployElectroProtocolDataProvider } from '../../helpers/contracts-deployments';
import { getLendingPoolAddressesProvider } from '../../helpers/contracts-getters';

task('full:data-provider', 'Initialize lending pool configuration.')
  .addFlag('verify', 'Verify contracts at Etherscan')
  .setAction(async ({ verify }, localBRE) => {
    try {
      await localBRE.run('set-DRE');

      const addressesProvider = await getLendingPoolAddressesProvider();

      await deployElectroProtocolDataProvider(addressesProvider.address, verify);
    } catch (err) {
      console.error(err);
      exit(1);
    }
  });
