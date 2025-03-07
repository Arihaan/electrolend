import { task } from 'hardhat/config';
import { exportDeploymentCallData } from '../../helpers/contracts-deployments';
import { saveDeploymentCallData } from '../../helpers/contracts-helpers';
import { eContractid, eNetwork } from '../../helpers/types';
task(`export-deploy-calldata-Oracles`, '').setAction(async ({}, DRE) => {
  await DRE.run('set-DRE');
  const network = (<eNetwork>DRE.network.name) as eNetwork;
  const lendingRateOracle = await exportDeploymentCallData(eContractid.LendingRateOracle);
  await saveDeploymentCallData(eContractid.LendingRateOracle, lendingRateOracle);
  const priceAggregator = await exportDeploymentCallData(
    eContractid.PriceAggregatorAdapterSimpleImpl
  );
  await saveDeploymentCallData(eContractid.PriceAggregatorAdapterSimpleImpl, priceAggregator);
  const fallbackOracle = await exportDeploymentCallData(eContractid.ElectroFallbackOracle);
  await saveDeploymentCallData(eContractid.ElectroFallbackOracle, fallbackOracle);
  const electroOracle = await exportDeploymentCallData(eContractid.ElectroOracle);
  await saveDeploymentCallData(eContractid.ElectroOracle, electroOracle);
  const electrolendOracle = await exportDeploymentCallData(eContractid.ElectroOracle);
  await saveDeploymentCallData(eContractid.ElectroOracle, electrolendOracle);
});
