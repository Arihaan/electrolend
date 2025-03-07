import { task } from 'hardhat/config';
import {
  exportDeploymentCallData,
  exportLendingPoolCallData,
} from '../../helpers/contracts-deployments';
import { saveDeploymentCallData } from '../../helpers/contracts-helpers';
import { eContractid } from '../../helpers/types';

task(`export-deploy-calldata-RateStrategies`, '').setAction(async ({}, DRE) => {
  await DRE.run('set-DRE');
  await DRE.run('set-DRE');
  const callData = await exportLendingPoolCallData();
  await saveDeploymentCallData(eContractid.LendingPoolImpl, callData);
  const configurator = await exportDeploymentCallData(eContractid.LendingPoolConfigurator);
  await saveDeploymentCallData(eContractid.LendingPoolConfiguratorImpl, configurator);
  const tokenHelper = await exportDeploymentCallData(eContractid.StableAndVariableTokensHelper);
  await saveDeploymentCallData(eContractid.StableAndVariableTokensHelper, tokenHelper);
  const ratesHelper = await exportDeploymentCallData(eContractid.ELTokensAndRatesHelper);
  await saveDeploymentCallData(eContractid.ELTokensAndRatesHelper, ratesHelper);
  const elTokenImpl = await exportDeploymentCallData(eContractid.ELToken);
  await saveDeploymentCallData(eContractid.ELToken, elTokenImpl);
  const stableDebtTokenImpl = await exportDeploymentCallData(eContractid.StableDebtToken);
  await saveDeploymentCallData(eContractid.StableDebtToken, stableDebtTokenImpl);
  const variableDebtTokenImpl = await exportDeploymentCallData(eContractid.VariableDebtToken);
  await saveDeploymentCallData(eContractid.VariableDebtToken, variableDebtTokenImpl);
});
