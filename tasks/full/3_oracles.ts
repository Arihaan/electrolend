import { task } from 'hardhat/config';
import {
  ConfigNames,
  getGenesisPoolAdmin,
  getLendingRateOracles,
  getQuoteCurrency,
  loadPoolConfig,
} from '../../helpers/configuration';
import {
  deployLendingRateOracle,
  deployPriceAggregatorAdapterSimpleImpl,
  deployElectroFallbackOracle,
  deployElectroOracle,
  deploySimplePriceFeed,
  deploySimplePriceFeedAdapter
} from '../../helpers/contracts-deployments';
import {
  getFirstSigner,
  getLendingPoolAddressesProvider,
  getLendingRateOracle,
  getPriceAggregator,
  getElectroFallbackOracle,
  getElectroOracle,
  getSimplePriceFeed,
  getSimplePriceFeedAdapter
} from '../../helpers/contracts-getters';
import { getParamPerNetwork } from '../../helpers/contracts-helpers';
import { notFalsyOrZeroAddress, waitForTx } from '../../helpers/misc-utils';
import { setInitialMarketRatesInRatesOracleByHelper } from '../../helpers/oracles-helpers';
import { eNetwork, ICommonConfiguration, SymbolMap } from '../../helpers/types';
import { LendingRateOracle, ElectroFallbackOracle, ElectroOracle } from '../../types';

task('full:deploy-oracles', 'Deploy oracles for dev enviroment')
  .addFlag('verify', 'Verify contracts at Etherscan')
  .addParam('pool', `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .setAction(async ({ verify, pool }, DRE) => {
    try {
      await DRE.run('set-DRE');
      const network = <eNetwork>DRE.network.name;
      const poolConfig = loadPoolConfig(pool);
      const {
        ProtocolGlobalParams: { UsdAddress },
        ReserveAssets,
        FallbackOracle,
        DIAAggregator,
        OracleQuoteCurrency,
        SimplePriceFeed
      } = poolConfig as ICommonConfiguration;
      const lendingRateOracles = getLendingRateOracles(poolConfig);
      const addressesProvider = await getLendingPoolAddressesProvider();
      const admin = await getGenesisPoolAdmin(poolConfig);
      const electroOracleAddress = getParamPerNetwork(poolConfig.ElectroOracle, network);
      const priceAggregatorAddress = getParamPerNetwork(poolConfig.PriceAggregator, network);
      const lendingRateOracleAddress = getParamPerNetwork(poolConfig.LendingRateOracle, network);
      const fallbackOracleAddress = getParamPerNetwork(FallbackOracle, network);
      const reserveAssets = getParamPerNetwork(ReserveAssets, network);
      const feedTokens = getParamPerNetwork(DIAAggregator, network);
      const simplePriceFeedAddress = getParamPerNetwork(SimplePriceFeed, network);
      const tokensToWatch: SymbolMap<string> = {
        ...reserveAssets,
        USD: UsdAddress,
      };

      let priceAggregatorAdapter: any;
      let simplePriceFeed: any;
      let simplePriceFeedAdapter: any;
      let electroOracle: ElectroOracle;
      let lendingRateOracle: LendingRateOracle;
      let fallbackOracle: ElectroFallbackOracle;

      if (notFalsyOrZeroAddress(simplePriceFeedAddress)) {
        simplePriceFeed = await getSimplePriceFeed(simplePriceFeedAddress);
      } else {
        simplePriceFeed = await deploySimplePriceFeed(admin, verify);
      }

      simplePriceFeedAdapter = await deploySimplePriceFeedAdapter(admin, verify);
      await waitForTx(await simplePriceFeedAdapter.setPriceFeed(simplePriceFeed.address));

      // Deploy and set token symbols for the price feed adapter
      for (const [symbol, address] of Object.entries(feedTokens)) {
        console.log(`Setting price feed for ${symbol} at ${address}`);
        await waitForTx(await simplePriceFeedAdapter.setAssetSymbol(address, symbol));
      }

      // deploy fallbackOracle
      if (notFalsyOrZeroAddress(fallbackOracleAddress)) {
        fallbackOracle = await getElectroFallbackOracle(fallbackOracleAddress);
      } else {
        fallbackOracle = await deployElectroFallbackOracle(admin, verify);
      }

      if (notFalsyOrZeroAddress(electroOracleAddress)) {
        electroOracle = await getElectroOracle(electroOracleAddress);
        await waitForTx(await electroOracle.setAdapter(simplePriceFeedAdapter.address));
      } else {
        electroOracle = await deployElectroOracle(
          [simplePriceFeedAdapter.address, await getQuoteCurrency(poolConfig), poolConfig.OracleQuoteUnit],
          verify
        );
      }

      if (notFalsyOrZeroAddress(lendingRateOracleAddress)) {
        lendingRateOracle = await getLendingRateOracle(lendingRateOracleAddress);
      } else {
        lendingRateOracle = await deployLendingRateOracle(admin, verify);
        const { USD, ...tokensAddressesWithoutUsd } = tokensToWatch;
        await setInitialMarketRatesInRatesOracleByHelper(
          lendingRateOracles,
          tokensAddressesWithoutUsd,
          lendingRateOracle,
          admin
        );
      }

      console.log('Electro Oracle: %s', electroOracle.address);
      console.log('SimplePriceFeed: %s', simplePriceFeed.address);
      console.log('SimplePriceFeedAdapter: %s', simplePriceFeedAdapter.address);
      console.log('Lending Rate Oracle: %s', lendingRateOracle.address);

      // Register the proxy price provider on the addressesProvider
      await waitForTx(await addressesProvider.setPriceOracle(electroOracle.address));
      await waitForTx(await addressesProvider.setLendingRateOracle(lendingRateOracle.address));
      
      // Set initial prices for tokens
      for (const [symbol, tokenAddress] of Object.entries(reserveAssets)) {
        console.log(`Setting initial price for ${symbol} at ${tokenAddress}`);
        // Price is in USD with 8 decimals precision (10^8)
        // 1 WETN = $1, 1 TUSDC = $1, 1 TUSDT = $1
        await waitForTx(await simplePriceFeed.setPrice(symbol, "100000000")); // $1.00
      }
      
    } catch (error) {
      if (DRE.network.name.includes('tenderly')) {
        const transactionLink = `https://dashboard.tenderly.co/${DRE.config.tenderly.username}/${
          DRE.config.tenderly.project
        }/fork/${DRE.tenderly.network().getFork()}/simulation/${DRE.tenderly.network().getHead()}`;
        console.error('Check tx error:', transactionLink);
      }
      throw error;
    }
  });
