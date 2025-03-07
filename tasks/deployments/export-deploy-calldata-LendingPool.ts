import { task } from 'hardhat/config';
import {
  exportDeploymentCallData,
  exportLendingPoolCallData,
} from '../../helpers/contracts-deployments';
import { saveDeploymentCallData } from '../../helpers/contracts-helpers';
import { eContractid } from '../../helpers/types';

const target = eContractid.LendingPool;

task(`export-deploy-calldata-${target}`, '').setAction(async ({}, DRE) => {
  await DRE.run('set-DRE');
  const callData = await exportLendingPoolCallData();
  await saveDeploymentCallData(eContractid.LendingPoolImpl, callData);
  const configurator = await exportDeploymentCallData(eContractid.LendingPoolConfigurator);
  await saveDeploymentCallData(eContractid.LendingPoolConfiguratorImpl, configurator);
  const tokenHelper = await exportDeploymentCallData(eContractid.StableAndVariableTokensHelper);
  await saveDeploymentCallData(eContractid.StableAndVariableTokensHelper, tokenHelper);
  const ratesHelper = await exportDeploymentCallData(eContractid.ELTokensAndRatesHelper);
  await saveDeploymentCallData(eContractid.ELTokensAndRatesHelper, ratesHelper);
  const lTokenImpl = await exportDeploymentCallData(eContractid.ELToken);
  await saveDeploymentCallData(eContractid.ELToken, lTokenImpl);
  const stableDebtTokenImpl = await exportDeploymentCallData(eContractid.StableDebtToken);
  await saveDeploymentCallData(eContractid.StableDebtToken, stableDebtTokenImpl);
  const variableDebtTokenImpl = await exportDeploymentCallData(eContractid.VariableDebtToken);
  await saveDeploymentCallData(eContractid.VariableDebtToken, variableDebtTokenImpl);
});
