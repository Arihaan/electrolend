import { task } from 'hardhat/config';
import { exportDeploymentCallData } from '../../helpers/contracts-deployments';
import { saveDeploymentCallData } from '../../helpers/contracts-helpers';
import { eContractid, eNetwork } from '../../helpers/types';

task(`export-deploy-calldata-UIHelpers`, '').setAction(async ({}, DRE) => {
  await DRE.run('set-DRE');
  const collateralManager = await exportDeploymentCallData(
    eContractid.LendingPoolCollateralManager
  );
  await saveDeploymentCallData(eContractid.LendingPoolCollateralManager, collateralManager);
  const uiPoolDataProviderV2 = await exportDeploymentCallData(eContractid.UiPoolDataProviderV2);
  await saveDeploymentCallData(eContractid.UiPoolDataProviderV2, uiPoolDataProviderV2);
  const walletBalanceProvider = await exportDeploymentCallData(eContractid.WalletBalanceProvider);
  await saveDeploymentCallData(eContractid.WalletBalanceProvider, walletBalanceProvider);
  const incentiveDataProvider = await exportDeploymentCallData(
    eContractid.UiIncentiveDataProviderV2
  );
  await saveDeploymentCallData(eContractid.UiIncentiveDataProviderV2, incentiveDataProvider);
});
