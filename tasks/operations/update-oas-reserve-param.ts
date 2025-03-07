import { task } from 'hardhat/config';
import { ConfigNames, loadPoolConfig } from '../../helpers/configuration';
import { getLendingPoolConfiguratorProxy } from '../../helpers/contracts-getters';
import { getParamPerNetwork } from '../../helpers/contracts-helpers';
import { eNetwork } from '../../helpers/types';
import { waitForTx } from '../../helpers/misc-utils';
const WOAS_ADDRESS = '0x5200000000000000000000000000000000000001';
const LTV = 3000;
const LIQUIDATION_THRESHOLD = LTV + 500;
const LIQUIDATION_BONUS = 11500;
task('update-oas-reserve-param', 'Pause lending pool')
  .addParam('pool', `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .setAction(async ({ pool }, DRE) => {
    await DRE.run('set-DRE');
    const { LendingPoolConfigurator } = loadPoolConfig(pool);
    const network = <eNetwork>DRE.network.name;
    const configurator = getParamPerNetwork(LendingPoolConfigurator, network);
    const configuratorInstance = await getLendingPoolConfiguratorProxy(configurator);
    const tx = await configuratorInstance.configureReserveAsCollateral(
      WOAS_ADDRESS,
      LTV,
      LIQUIDATION_THRESHOLD,
      LIQUIDATION_BONUS
    );
    await waitForTx(tx);
  });
