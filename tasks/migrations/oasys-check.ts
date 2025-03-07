import { task } from 'hardhat/config';
import { eContractid } from '../../helpers/types';
import { getContractAddressWithJsonFallback } from '../../helpers/contracts-helpers';
import {
  LendingPoolFactory,
  PalmyOracleFactory,
  StableDebtTokenFactory,
  UiPoolDataProviderV2Factory,
  VariableDebtTokenFactory,
} from '../../types';
import { getFirstSigner, getLendingPoolAddressesProvider } from '../../helpers/contracts-getters';
import { ConfigNames } from '../../helpers/configuration';

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

task('oasys-check', 'Deploy Palmy oasys enviroment').setAction(async ({}, DRE) => {
  await DRE.run('set-DRE');
  const provider = UiPoolDataProviderV2Factory.connect(
    await getContractAddressWithJsonFallback(eContractid.UiPoolDataProviderV2, ConfigNames.Palmy),
    await getFirstSigner()
  );
  const addressProvider = await getLendingPoolAddressesProvider();
  const oracle = await addressProvider.getPriceOracle();
  const oracleInstance = PalmyOracleFactory.connect(oracle, await getFirstSigner());
  const lendPool = await addressProvider.getLendingPool();
  const lendPoolInstance = LendingPoolFactory.connect(lendPool, await getFirstSigner());
  const reserves = await LendingPoolFactory.connect(
    lendPool,
    await getFirstSigner()
  ).getReservesList();
  for (const reserve of reserves) {
    const reserveData = await lendPoolInstance.getReserveData(reserve);
    console.log(reserveData);
    const oraclePrice = await oracleInstance.getAssetPrice(reserve);
    console.log(reserve);
    console.log(oraclePrice.toString());
    const stableDebtTokenInstance = StableDebtTokenFactory.connect(
      reserveData.stableDebtTokenAddress,
      await getFirstSigner()
    );
    const stableSupplyData = await stableDebtTokenInstance.getSupplyData();
    console.log(stableSupplyData);
    const variableDebtTokenInstance = VariableDebtTokenFactory.connect(
      reserveData.variableDebtTokenAddress,
      await getFirstSigner()
    );
    const variableScaledTotalSupply = await variableDebtTokenInstance.scaledTotalSupply();
    console.log(variableScaledTotalSupply.toString());
  }
  const data = await provider.getReservesData(addressProvider.address);
  console.log(data);
});
