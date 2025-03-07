import { readArtifact as buidlerReadArtifact } from '@nomiclabs/buidler/plugins';
import { BytesLike, Contract, Signer } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import {
  DelegationAwareELTokenFactory,
  DefaultReserveInterestRateStrategyFactory,
  InitializableAdminUpgradeabilityProxyFactory,
  LendingPoolAddressesProviderFactory,
  LendingPoolAddressesProviderRegistryFactory,
  LendingPoolCollateralManagerFactory,
  LendingPoolConfiguratorFactory,
  LendingPoolFactory,
  LendingRateOracleFactory,
  ELTokenFactory,
  ELTokensAndRatesHelperFactory,
  MintableDelegationERC20Factory,
  MintableERC20Factory,
  MockAggregatorFactory,
  MockFlashLoanReceiverFactory,
  MockLTokenFactory,
  MockStableDebtTokenFactory,
  MockVariableDebtTokenFactory,
  PriceOracleFactory,
  ElectroFallbackOracleFactory,
  ElectroOracleFactory,
  ElectroProtocolDataProviderFactory,
  ReserveLogicFactory,
  SelfdestructTransferFactory,
  StableDebtTokenFactory,
  UiIncentiveDataProviderV2Factory,
  UiPoolDataProviderV2Factory,
  VariableDebtTokenFactory,
  WalletBalanceProviderFactory,
  WETH9MockedFactory,
  WETHGatewayFactory,
  LendingPoolTmpFactory,
  LendingPoolV4Factory,
} from '../types';
import { LendingPoolLibraryAddresses } from '../types/LendingPoolFactory';
import { MintableDelegationERC20 } from '../types/MintableDelegationERC20';
import { MintableERC20 } from '../types/MintableERC20';
import { StableAndVariableTokensHelperFactory } from '../types/StableAndVariableTokensHelperFactory';
import { WETH9Mocked } from '../types/WETH9Mocked';
import { PriceAggregatorAdapterChainsightImplFactory } from './../types/PriceAggregatorAdapterChainsightImplFactory';
import {
  ConfigNames,
  getGenesisPoolAdmin,
  getQuoteCurrency,
  getReservesConfigByPool,
  getWrappedNativeTokenAddress,
  loadPoolConfig,
} from './configuration';
import { getFirstSigner } from './contracts-getters';
import {
  getContractAddressWithJsonFallback,
  getEthersSigners,
  getOptionalParamAddressPerNetwork,
  insertContractAddressInDb,
  linkBytecode,
  registerContractInJsonDb,
  withSaveAndVerify,
} from './contracts-helpers';
import { DRE, notFalsyOrZeroAddress } from './misc-utils';
import {
  eContractid,
  eEthereumNetwork,
  eNetwork,
  IReserveParams,
  ElectroPools,
  tEthereumAddress,
  TokenContractId,
} from './types';
import ElectroConfig from '../markets/electrolend';

export const deployUiIncentiveDataProviderV2 = async (verify?: boolean) =>
  withSaveAndVerify(
    await new UiIncentiveDataProviderV2Factory(await getFirstSigner()).deploy(),
    eContractid.UiIncentiveDataProviderV2,
    [],
    verify
  );

export const deployUiPoolDataProviderV2 = async (verify?: boolean) =>
  withSaveAndVerify(
    await new UiPoolDataProviderV2Factory(await getFirstSigner()).deploy(),
    eContractid.UiPoolDataProviderV2,
    [],
    verify
  );

const readArtifact = async (id: string) => {
  if (DRE.network.name === eEthereumNetwork.buidlerevm) {
    return buidlerReadArtifact(DRE.config.paths.artifacts, id);
  }
  return (DRE as HardhatRuntimeEnvironment).artifacts.readArtifact(id);
};

export const deployLendingPoolAddressesProvider = async (
  marketId: string,
  initialOwner: string,
  verify?: boolean
) =>
  withSaveAndVerify(
    await new LendingPoolAddressesProviderFactory(await getFirstSigner()).deploy(
      marketId,
      initialOwner
    ),
    eContractid.LendingPoolAddressesProvider,
    [marketId, initialOwner],
    verify
  );

export const exportDeploymentCallData = async (id: eContractid) => {
  return await getDeploymentCallData(id);
};
export const deployLendingPoolAddressesProviderRegistry = async (
  initialOwner: string,
  verify?: boolean
) =>
  withSaveAndVerify(
    await new LendingPoolAddressesProviderRegistryFactory(await getFirstSigner()).deploy(
      initialOwner
    ),
    eContractid.LendingPoolAddressesProviderRegistry,
    [initialOwner],
    verify
  );

const _getDeploymentCallData = async (contractName: string, args: any[]): Promise<BytesLike> => {
  const contract = (await DRE.ethers.getContractFactory(contractName)).getDeployTransaction(
    ...args
  );
  return contract.data!;
};

const getDeploymentCallData = async (contractName: eContractid): Promise<BytesLike> => {
  return await _getDeploymentCallData(
    contractName,
    await getDeployArgs(DRE.network.name as eNetwork, contractName)
  );
};

export const deployLendingPoolConfigurator = async (verify?: boolean) => {
  const lendingPoolConfiguratorImpl = await new LendingPoolConfiguratorFactory(
    await getFirstSigner()
  ).deploy();
  await insertContractAddressInDb(
    eContractid.LendingPoolConfiguratorImpl,
    lendingPoolConfiguratorImpl.address
  );
  return withSaveAndVerify(
    lendingPoolConfiguratorImpl,
    eContractid.LendingPoolConfigurator,
    [],
    verify
  );
};

export const getDeployArgs = async (network: eNetwork, id: eContractid) => {
  const config = loadPoolConfig(ConfigNames.ElectroLend);
  const genesisAdmin = await getGenesisPoolAdmin(config);
  switch (id) {
    case eContractid.LendingPoolAddressesProvider:
      return [ElectroConfig.MarketId, genesisAdmin];
    case eContractid.LendingPoolAddressesProviderRegistry:
      return [genesisAdmin];
    case eContractid.StableAndVariableTokensHelper:
      return [genesisAdmin];
    case eContractid.ELTokensAndRatesHelper:
      return [genesisAdmin];
    case eContractid.PriceAggregatorAdapterSimpleImpl:
      return [genesisAdmin];
    case eContractid.LendingRateOracle:
      return [genesisAdmin];
    case eContractid.ElectroFallbackOracle:
      return [genesisAdmin];
    case eContractid.ElectroOracle:
      return [
        await getQuoteCurrency(loadPoolConfig(ConfigNames.ElectroLend)),
        await loadPoolConfig(ConfigNames.ElectroLend).OracleQuoteUnit,
        genesisAdmin,
      ];
    case eContractid.WETHGateway:
      return [await getWrappedNativeTokenAddress(loadPoolConfig(ConfigNames.ElectroLend)), genesisAdmin];
    default:
      return [];
  }
};

export const deployReserveLogicLibrary = async (verify?: boolean) =>
  withSaveAndVerify(
    await new ReserveLogicFactory(await getFirstSigner()).deploy(),
    eContractid.ReserveLogic,
    [],
    verify
  );
export const exportGenericLogicDeploymentCallData = async (reserveLogicAddress: string) => {
  const genericLogicFactory = await getGenericLogicContractFactory(reserveLogicAddress);
  return await genericLogicFactory.connect(await getFirstSigner()).getDeployTransaction().data!;
};
const getGenericLogicContractFactory = async (reserveLogicAddress: string) => {
  const genericLogicArtifact = await readArtifact(eContractid.GenericLogic);

  const linkedGenericLogicByteCode = linkBytecode(genericLogicArtifact, {
    [eContractid.ReserveLogic]: reserveLogicAddress,
  });

  return await DRE.ethers.getContractFactory(genericLogicArtifact.abi, linkedGenericLogicByteCode);
};

export const deployGenericLogic = async (reserveLogic: Contract, verify?: boolean) => {
  const genericLogicFactory = await getGenericLogicContractFactory(reserveLogic.address);

  const genericLogic = await (
    await genericLogicFactory.connect(await getFirstSigner()).deploy()
  ).deployed();
  return withSaveAndVerify(genericLogic, eContractid.GenericLogic, [], verify);
};

export const exportValidationLogicDeploymentCallData = async (
  reserveLogicAddress: string,
  genericLogicAddress: string
) => {
  const validationLogicFactory = await getValidationLogicContractFactory(
    reserveLogicAddress,
    genericLogicAddress
  );
  return await validationLogicFactory.connect(await getFirstSigner()).getDeployTransaction().data!;
};

const getValidationLogicContractFactory = async (
  reserveLogicAddress: string,
  genericLogicAddress: string
) => {
  const validationLogicArtifact = await readArtifact(eContractid.ValidationLogic);

  const linkedValidationLogicByteCode = linkBytecode(validationLogicArtifact, {
    [eContractid.ReserveLogic]: reserveLogicAddress,
    [eContractid.GenericLogic]: genericLogicAddress,
  });

  return await DRE.ethers.getContractFactory(
    validationLogicArtifact.abi,
    linkedValidationLogicByteCode
  );
};

export const deployValidationLogic = async (
  reserveLogic: Contract,
  genericLogic: Contract,
  verify?: boolean
) => {
  const validationLogicFactory = await getValidationLogicContractFactory(
    reserveLogic.address,
    genericLogic.address
  );

  const validationLogic = await (
    await validationLogicFactory.connect(await getFirstSigner()).deploy()
  ).deployed();

  return withSaveAndVerify(validationLogic, eContractid.ValidationLogic, [], verify);
};

export const deployElectroLibraries = async (
  verify?: boolean
): Promise<LendingPoolLibraryAddresses> => {
  const reserveLogic = await deployReserveLogicLibrary(verify);
  const genericLogic = await deployGenericLogic(reserveLogic, verify);
  const validationLogic = await deployValidationLogic(reserveLogic, genericLogic, verify);

  return toElectroLibs(validationLogic.address, reserveLogic.address);
};

export const toElectroLibs = async (
  validationLogicAddress: string,
  reserveLogicAddress: string
): Promise<LendingPoolLibraryAddresses> => {
  // Hardcoded solidity placeholders, if any library changes path this will fail.
  // The '__$PLACEHOLDER$__ can be calculated via solidity keccak, but the LendingPoolLibraryAddresses Type seems to
  // require a hardcoded string.
  //
  //  how-to:
  //  1. PLACEHOLDER = solidityKeccak256(['string'], `${libPath}:${libName}`).slice(2, 36)
  //  2. LIB_PLACEHOLDER = `__$${PLACEHOLDER}$__`
  // or grab placeholdes from LendingPoolLibraryAddresses at Typechain generation.
  //
  // libPath example: contracts/libraries/logic/GenericLogic.sol
  // libName example: GenericLogic
  return {
    ['__$22cd43a9dda9ce44e9b92ba393b88fb9ac$__']: reserveLogicAddress,
    ['__$de8c0cf1a7d7c36c802af9a64fb9d86036$__']: validationLogicAddress,
  };
};

export const exportLendingPoolCallData = async () => {
  const reserveLogicAddress = await getContractAddressWithJsonFallback(
    eContractid.ReserveLogic,
    ConfigNames.ElectroLend
  );
  const validationLogicAddress = await getContractAddressWithJsonFallback(
    eContractid.ValidationLogic,
    ConfigNames.ElectroLend
  );
  const libs = await toElectroLibs(validationLogicAddress, reserveLogicAddress);
  const lendingPoolFactory = await new LendingPoolFactory(libs, await getFirstSigner());
  return await lendingPoolFactory.getDeployTransaction().data!;
};

export const exportLendingPoolTmpAndV4CallData = async () => {
  const reserveLogicAddress = await getContractAddressWithJsonFallback(
    eContractid.ReserveLogic,
    ConfigNames.ElectroLend
  );
  const validationLogicAddress = await getContractAddressWithJsonFallback(
    eContractid.ValidationLogic,
    ConfigNames.ElectroLend
  );
  const libs = await toElectroLibs(validationLogicAddress, reserveLogicAddress);
  const lendingPoolTmpFactory = await new LendingPoolTmpFactory(libs, await getFirstSigner());
  const lendingPoolV4Factory = await new LendingPoolV4Factory(libs, await getFirstSigner());
  return {
    lendingPoolTmpData: await lendingPoolTmpFactory.getDeployTransaction().data!,
    lendingPoolV4Data: await lendingPoolV4Factory.getDeployTransaction().data!,
  };
};

export const deployLendingPool = async (verify?: boolean) => {
  const libraries = await deployElectroLibraries(verify);
  const lendingPoolImpl = await new LendingPoolFactory(libraries, await getFirstSigner()).deploy();
  await insertContractAddressInDb(eContractid.LendingPoolImpl, lendingPoolImpl.address);
  return withSaveAndVerify(lendingPoolImpl, eContractid.LendingPool, [], verify);
};

export const deployLendingPoolTmp = async (verify?: boolean) => {
  const lendingPoolImpl = await new LendingPoolTmpFactory(
    await deployElectroLibraries(verify),
    await getFirstSigner()
  ).deploy();
  await insertContractAddressInDb(eContractid.LendingPoolTmpImpl, lendingPoolImpl.address);
  return withSaveAndVerify(lendingPoolImpl, eContractid.LendingPoolTmpImpl, [], verify);
};
export const deployLendingPoolV4 = async (verify?: boolean) => {
  const lendingPoolImpl = await new LendingPoolV4Factory(
    await deployElectroLibraries(verify),
    await getFirstSigner()
  ).deploy();
  await insertContractAddressInDb(eContractid.LendingPoolV4Impl, lendingPoolImpl.address);
  return withSaveAndVerify(lendingPoolImpl, eContractid.LendingPoolV4Impl, [], verify);
};

export const deployPriceOracle = async (verify?: boolean) =>
  withSaveAndVerify(
    await new PriceOracleFactory(await getFirstSigner()).deploy(),
    eContractid.PriceOracle,
    [],
    verify
  );

export const deployElectroFallbackOracle = async (initialOwner: string, verify?: boolean) =>
  withSaveAndVerify(
    await new ElectroFallbackOracleFactory(await getFirstSigner()).deploy(initialOwner),
    eContractid.ElectroFallbackOracle,
    [],
    verify
  );

export const deployLendingRateOracle = async (initialOwner: string, verify?: boolean) =>
  withSaveAndVerify(
    await new LendingRateOracleFactory(await getFirstSigner()).deploy(initialOwner),
    eContractid.LendingRateOracle,
    [],
    verify
  );

export const deployMockAggregator = async (
  args: [tEthereumAddress[], string[]],
  verify?: boolean
) =>
  withSaveAndVerify(
    await new MockAggregatorFactory(await getFirstSigner()).deploy(args[0], args[1]),
    eContractid.MockAggregator,
    args,
    verify
  );

export const deployElectroOracle = async (args: [string, string, string], verify?: boolean) =>
  withSaveAndVerify(
    await new ElectroOracleFactory(await getFirstSigner()).deploy(args[0], args[1], args[2]),
    eContractid.ElectroOracle,
    args,
    verify
  );

export const deployLendingPoolCollateralManager = async (verify?: boolean) => {
  const collateralManagerImpl = await new LendingPoolCollateralManagerFactory(
    await getFirstSigner()
  ).deploy();
  await insertContractAddressInDb(
    eContractid.LendingPoolCollateralManagerImpl,
    collateralManagerImpl.address
  );
  return withSaveAndVerify(
    collateralManagerImpl,
    eContractid.LendingPoolCollateralManager,
    [],
    verify
  );
};

export const deployInitializableAdminUpgradeabilityProxy = async (verify?: boolean) =>
  withSaveAndVerify(
    await new InitializableAdminUpgradeabilityProxyFactory(await getFirstSigner()).deploy(),
    eContractid.InitializableAdminUpgradeabilityProxy,
    [],
    verify
  );

export const deployMockFlashLoanReceiver = async (
  addressesProvider: tEthereumAddress,
  verify?: boolean
) =>
  withSaveAndVerify(
    await new MockFlashLoanReceiverFactory(await getFirstSigner()).deploy(addressesProvider),
    eContractid.MockFlashLoanReceiver,
    [addressesProvider],
    verify
  );

export const deployWalletBalancerProvider = async (verify?: boolean) =>
  withSaveAndVerify(
    await new WalletBalanceProviderFactory(await getFirstSigner()).deploy(),
    eContractid.WalletBalanceProvider,
    [],
    verify
  );

export const deployElectroProtocolDataProvider = async (verify?: boolean) =>
  withSaveAndVerify(
    await new ElectroProtocolDataProviderFactory(await getFirstSigner()).deploy(),
    eContractid.ElectroProtocolDataProvider,
    [],
    verify
  );

export const deployMintableERC20 = async (
  args: [string, string, string],
  verify?: boolean
): Promise<MintableERC20> =>
  withSaveAndVerify(
    await new MintableERC20Factory(await getFirstSigner()).deploy(...args),
    eContractid.MintableERC20,
    args,
    verify
  );

export const deployMintableDelegationERC20 = async (
  args: [string, string, string],
  verify?: boolean
): Promise<MintableDelegationERC20> =>
  withSaveAndVerify(
    await new MintableDelegationERC20Factory(await getFirstSigner()).deploy(...args),
    eContractid.MintableDelegationERC20,
    args,
    verify
  );
export const deployDefaultReserveInterestRateStrategy = async (
  args: [tEthereumAddress, string, string, string, string, string, string],
  verify: boolean
) =>
  withSaveAndVerify(
    await new DefaultReserveInterestRateStrategyFactory(await getFirstSigner()).deploy(...args),
    eContractid.DefaultReserveInterestRateStrategy,
    args,
    verify
  );

export const deployStableDebtToken = async (
  args: [tEthereumAddress, tEthereumAddress, tEthereumAddress, string, string],
  verify: boolean
) => {
  const instance = await withSaveAndVerify(
    await new StableDebtTokenFactory(await getFirstSigner()).deploy(),
    eContractid.StableDebtToken,
    [],
    verify
  );

  await instance.initialize(args[0], args[1], args[2], '18', args[3], args[4], '0x10');

  return instance;
};

export const deployVariableDebtToken = async (
  args: [tEthereumAddress, tEthereumAddress, tEthereumAddress, string, string],
  verify: boolean
) => {
  const instance = await withSaveAndVerify(
    await new VariableDebtTokenFactory(await getFirstSigner()).deploy(),
    eContractid.VariableDebtToken,
    [],
    verify
  );

  await instance.initialize(args[0], args[1], args[2], '18', args[3], args[4], '0x10');

  return instance;
};


export const deployGenericStableDebtToken = async (verify = false) =>
  withSaveAndVerify(
    await new StableDebtTokenFactory(await getFirstSigner()).deploy(),
    eContractid.StableDebtToken,
    [],
    verify
  );

export const deployGenericVariableDebtToken = async (verify = false) =>
  withSaveAndVerify(
    await new VariableDebtTokenFactory(await getFirstSigner()).deploy(),
    eContractid.VariableDebtToken,
    [],
    verify
  );

export const deployGenericELToken = async (
  [poolAddress, underlyingAssetAddress, treasuryAddress, incentivesController, name, symbol]: [
    tEthereumAddress,
    tEthereumAddress,
    tEthereumAddress,
    tEthereumAddress,
    string,
    string
  ],
  verify: boolean
) => {
  const elTokenName = `${name}`;
  const elTokenSymbol = `${symbol}`;
  const elTokenExtraParam = '0x10';

  const instance = await withSaveAndVerify(
    await new ELTokenFactory(await getFirstSigner()).deploy(),
    eContractid.ELToken,
    [],
    verify
  );

  await instance.initialize(
    poolAddress,
    treasuryAddress,
    underlyingAssetAddress,
    incentivesController,
    18,
    elTokenName,
    elTokenSymbol,
    elTokenExtraParam
  );

  return instance;
};

export const deployGenericELTokenImpl = async (verify: boolean) =>
  withSaveAndVerify(
    await new ELTokenFactory(await getFirstSigner()).deploy(),
    eContractid.ELToken,
    [],
    verify
  );

export const deployDelegationAwareELToken = async (
  [pool, underlyingAssetAddress, treasuryAddress, incentivesController, name, symbol]: [
    tEthereumAddress,
    tEthereumAddress,
    tEthereumAddress,
    tEthereumAddress,
    string,
    string
  ],
  verify: boolean
) => {
  const instance = await withSaveAndVerify(
    await new DelegationAwareELTokenFactory(await getFirstSigner()).deploy(),
    eContractid.DelegationAwareELToken,
    [],
    verify
  );

  await instance.initialize(
    pool,
    treasuryAddress,
    underlyingAssetAddress,
    incentivesController,
    '18',
    name,
    symbol,
    '0x10'
  );

  return instance;
};

export const deployDelegationAwareELTokenImpl = async (verify: boolean) =>
  withSaveAndVerify(
    await new DelegationAwareELTokenFactory(await getFirstSigner()).deploy(),
    eContractid.DelegationAwareELToken,
    [],
    verify
  );

export const deployAllMockTokens = async (verify?: boolean) => {
  const tokens: { [symbol: string]: MintableERC20 | WETH9Mocked } = {};

  const protoConfigData = getReservesConfigByPool(ElectroPools.proto);

  for (const tokenSymbol of Object.values(TokenContractId)) {
    if (tokenSymbol === 'WETN') {
      tokens[tokenSymbol] = await deployWETHMocked();
      await registerContractInJsonDb(tokenSymbol.toUpperCase(), tokens[tokenSymbol]);
      continue;
    }
    let decimals = '18';

    let configData = (<any>protoConfigData)[tokenSymbol];

    tokens[tokenSymbol] = await deployMintableERC20(
      [tokenSymbol, tokenSymbol, configData ? configData.reserveDecimals : decimals],
      verify
    );
    await registerContractInJsonDb(tokenSymbol.toUpperCase(), tokens[tokenSymbol]);
  }
  return tokens;
};

export const deployStableAndVariableTokensHelper = async (initialOwner: string, verify?: boolean) =>
  withSaveAndVerify(
    await new StableAndVariableTokensHelperFactory(await getFirstSigner()).deploy(initialOwner),
    eContractid.StableAndVariableTokensHelper,
    [],
    verify
  );

export const deployELTokensAndRatesHelper = async (initialOwner: string, verify?: boolean) =>
  withSaveAndVerify(
    await new ELTokensAndRatesHelperFactory(await getFirstSigner()).deploy(initialOwner),
    eContractid.ELTokensAndRatesHelper,
    [],
    verify
  );

export const deployWETHGateway = async (args: [tEthereumAddress, string], verify?: boolean) =>
  withSaveAndVerify(
    await new WETHGatewayFactory(await getFirstSigner()).deploy(...args),
    eContractid.WETHGateway,
    args,
    verify
  );

export const authorizeWETHGateway = async (
  wethGateWay: tEthereumAddress,
  lendingPool: tEthereumAddress
) =>
  await new WETHGatewayFactory(await getFirstSigner())
    .attach(wethGateWay)
    .authorizeLendingPool(lendingPool);

export const deployMockStableDebtToken = async (
  args: [tEthereumAddress, tEthereumAddress, tEthereumAddress, string, string, string],
  verify?: boolean
) => {
  const instance = await withSaveAndVerify(
    await new MockStableDebtTokenFactory(await getFirstSigner()).deploy(),
    eContractid.MockStableDebtToken,
    [],
    verify
  );

  await instance.initialize(args[0], args[1], args[2], '18', args[3], args[4], args[5]);

  return instance;
};

export const deployWETHMocked = async (verify?: boolean) =>
  withSaveAndVerify(
    await new WETH9MockedFactory(await getFirstSigner()).deploy(),
    eContractid.WETNMocked,
    [],
    verify
  );

export const deployMockVariableDebtToken = async (
  args: [tEthereumAddress, tEthereumAddress, tEthereumAddress, string, string, string],
  verify?: boolean
) => {
  const instance = await withSaveAndVerify(
    await new MockVariableDebtTokenFactory(await getFirstSigner()).deploy(),
    eContractid.MockVariableDebtToken,
    [],
    verify
  );

  await instance.initialize(args[0], args[1], args[2], '18', args[3], args[4], args[5]);

  return instance;
};

export const deployMockELToken = async (
  args: [
    tEthereumAddress,
    tEthereumAddress,
    tEthereumAddress,
    tEthereumAddress,
    string,
    string,
    string,
    string
  ],
  verify?: boolean
) =>
  withSaveAndVerify(
    await new MockLTokenFactory(await getFirstSigner()).deploy(),
    eContractid.MockELToken,
    args,
    verify
  );

export const deploySelfdestructTransferMock = async (verify?: boolean) =>
  withSaveAndVerify(
    await new SelfdestructTransferFactory(await getFirstSigner()).deploy(),
    eContractid.SelfdestructTransferMock,
    [],
    verify
  );

export const chooseELTokenDeployment = (id: eContractid) => {
  switch (id) {
    case eContractid.ELToken:
      return deployGenericELTokenImpl; // use Rev1
    case eContractid.DelegationAwareELToken:
      return deployDelegationAwareELTokenImpl;
    default:
      throw Error(`Missing elToken implementation deployment script for: ${id}`);
  }
};

export const deployELTokenImplementations = async (
  pool: ConfigNames,
  reservesConfig: { [key: string]: IReserveParams },
  verify = false
) => {
  const poolConfig = loadPoolConfig(pool);
  // Obtain the different ELToken implementations of all reserves inside the Market config
  const elTokenImplementations = [
    ...Object.entries(reservesConfig).reduce<Set<eContractid>>((acc, [, entry]) => {
      acc.add(entry.elTokenImpl);
      return acc;
    }, new Set()),
  ];

  for (let x = 0; x < elTokenImplementations.length; x++) {
    const elTokenAddress = getOptionalParamAddressPerNetwork(
      poolConfig[elTokenImplementations[x].toString()],
      DRE.network.name as eNetwork
    );
    if (!notFalsyOrZeroAddress(elTokenAddress)) {
      const deployImplementationMethod = chooseELTokenDeployment(elTokenImplementations[x]);
      console.log(`Deploying implementation`, elTokenImplementations[x]);
      await deployImplementationMethod(verify);
    }
  }
  await deployGenericStableDebtToken(verify);

  await deployGenericVariableDebtToken(verify);
};

export const deployRateStrategy = async (
  strategyName: string,
  args: [tEthereumAddress, string, string, string, string, string, string],
  verify: boolean
): Promise<tEthereumAddress> => {
  switch (strategyName) {
    default:
      return await (
        await deployDefaultReserveInterestRateStrategy(args, verify)
      ).address;
  }
};

export const withSaveAndVerify = async <ContractType extends Contract>(
  instance: ContractType,
  id: string,
  args: (string | string[])[],
  verify?: boolean,
  noWaitForConfirmation?: boolean
): Promise<ContractType> => {
  await registerContractInJsonDb(id, instance);
  if (!noWaitForConfirmation) {
    await instance.deployTransaction.wait();
  }

  if (verify) {
    await verifyContract(id, instance.address, args);
  }
  return instance;
};
