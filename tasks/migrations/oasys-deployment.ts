import { task } from 'hardhat/config';
import { eContractid, eNetwork, eOasysNetwork } from '../../helpers/types';
import { deployToOasysTestnet, insertContractAddressInDb } from '../../helpers/contracts-helpers';
import { printContracts } from '../../helpers/misc-utils';

export const DEPLOYMENT_CONTRACTS = [
  eContractid.LendingPoolAddressesProviderRegistry,
  eContractid.LendingPoolAddressesProvider,
  eContractid.LendingPoolImpl,
  eContractid.LendingPoolConfiguratorImpl,
  eContractid.LendingRateOracle,
  eContractid.LToken,
  eContractid.PalmyFallbackOracle,
  eContractid.PalmyOracle,
  eContractid.PalmyProtocolDataProvider,
  eContractid.PriceAggregatorAdapterChainsightImpl,
  eContractid.ChainsightOracle,
  eContractid.StableAndVariableTokensHelper,
  eContractid.StakeUIHelper,
  eContractid.LTokensAndRatesHelper,
  eContractid.StableDebtToken,
  eContractid.VariableDebtToken,
  eContractid.WETHGateway,
  eContractid.LendingPoolCollateralManager,
  eContractid.UiPoolDataProviderV2,
  eContractid.UiIncentiveDataProviderV2,
  eContractid.WalletBalanceProvider,
];

task('oasys-deployment', 'Deploy Palmy oasys enviroment').setAction(async ({}, DRE) => {
  await DRE.run('set-DRE');

  console.log('Migration started\n');

  await DRE.run(`export-deploy-calldata-${eContractid.LendingPoolAddressesProviderRegistry}`);
  await DRE.run(`export-deploy-calldata-${eContractid.LendingPoolAddressesProvider}`);
  await DRE.run(`export-deploy-calldata-${eContractid.LendingPool}`);
  await DRE.run(`export-deploy-calldata-Oracles`);
  await DRE.run(`export-deploy-calldata-${eContractid.PalmyProtocolDataProvider}`);
  await DRE.run(`export-deploy-calldata-${eContractid.WETHGateway}`);
  await DRE.run(`export-deploy-calldata-UIHelpers`);
  const network = DRE.network.name as eNetwork;
  if (network === eOasysNetwork.oasys) {
    console.log('Exporting Finished');
    return;
  }

  for (const contract of DEPLOYMENT_CONTRACTS) {
    const deployment = await deployToOasysTestnet(contract);
    await insertContractAddressInDb(contract, deployment.contractAddress);
  }
  printContracts();
});
