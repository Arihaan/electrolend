import ElectroConfig from '../markets/electrolend';
import { CommonsConfig } from '../markets/electrolend/commons';
import { deployWETHMocked } from './contracts-deployments';
import {
  getEthersSignersAddresses,
  getParamPerNetwork,
  getParamPerPool,
} from './contracts-helpers';
import { DRE, filterMapBy } from './misc-utils';
import {
  eNetwork,
  IBaseConfiguration,
  iMultiPoolsAssets,
  IReserveParams,
  PoolConfiguration,
  ElectroPools,
  tEthereumAddress,
} from './types';

export enum ConfigNames {
  Commons = 'Commons',
  ElectroLend = 'ElectroLend',
}

export const loadPoolConfig = (configName: ConfigNames): PoolConfiguration => {
  switch (configName) {
    case ConfigNames.ElectroLend:
      return ElectroConfig;
    case ConfigNames.Commons:
      return CommonsConfig;
    default:
      throw new Error(
        `Unsupported pool configuration: ${configName} is not one of the supported configs ${Object.values(
          ConfigNames
        )}`
      );
  }
};

// ----------------
// PROTOCOL PARAMS PER POOL
// ----------------

export const getReservesConfigByPool = (pool: ElectroPools): iMultiPoolsAssets<IReserveParams> =>
  getParamPerPool<iMultiPoolsAssets<IReserveParams>>(
    {
      [ElectroPools.proto]: {
        ...ElectroConfig.ReservesConfig,
      },
    },
    pool
  );

export const getGenesisPoolAdmin = async (
  config: IBaseConfiguration
): Promise<tEthereumAddress> => {
  const currentNetwork = process.env.FORK ? process.env.FORK : DRE.network.name;
  const targetAddress = getParamPerNetwork(config.PoolAdmin, <eNetwork>currentNetwork);
  if (targetAddress) {
    return targetAddress;
  }
  const addressList = await getEthersSignersAddresses();
  const addressIndex = config.PoolAdminIndex;
  return addressList[addressIndex];
};

export const getEmergencyAdmin = async (config: IBaseConfiguration): Promise<tEthereumAddress> => {
  const currentNetwork = process.env.FORK ? process.env.FORK : DRE.network.name;
  const targetAddress = getParamPerNetwork(config.EmergencyAdmin, <eNetwork>currentNetwork);
  if (targetAddress) {
    return targetAddress;
  }
  const addressList = await getEthersSignersAddresses();
  const addressIndex = config.EmergencyAdminIndex;
  return addressList[addressIndex];
};

export const getTreasuryAddress = async (config: IBaseConfiguration): Promise<tEthereumAddress> => {
  const currentNetwork = process.env.FORK ? process.env.FORK : DRE.network.name;
  return getParamPerNetwork(config.ReserveFactorTreasuryAddress, <eNetwork>currentNetwork);
};

export const getELTokenDomainSeparatorPerNetwork = (
  network: eNetwork,
  config: IBaseConfiguration
): tEthereumAddress => getParamPerNetwork<tEthereumAddress>(config.ELTokenDomainSeparator, network);

export const getWethAddress = async (config: IBaseConfiguration) => {
  const currentNetwork = process.env.FORK ? process.env.FORK : DRE.network.name;
  const wethAddress = getParamPerNetwork(config.WETH, <eNetwork>currentNetwork);
  if (wethAddress) {
    return wethAddress;
  }
  const weth = await deployWETHMocked();
  return weth.address;
};

export const getWrappedNativeTokenAddress = async (config: IBaseConfiguration) => {
  const currentNetwork = process.env.MAINNET_FORK === 'true' ? 'main' : DRE.network.name;
  const wetnAddress = getParamPerNetwork(config.WrappedNativeToken, <eNetwork>currentNetwork);
  if (wetnAddress) {
    return wetnAddress;
  }
  if (currentNetwork.includes('electroneum')) {
    throw new Error('WETN not set at Electroneum configuration.');
  }
  const wetn = await deployWETHMocked();
  return wetn.address;
};

export const getLendingRateOracles = (poolConfig: IBaseConfiguration) => {
  const {
    ProtocolGlobalParams: { UsdAddress },
    LendingRateOracleRatesCommon,
    ReserveAssets,
  } = poolConfig;

  const network = process.env.FORK ? process.env.FORK : DRE.network.name;
  return filterMapBy(LendingRateOracleRatesCommon, (key) =>
    Object.keys(ReserveAssets[network]).includes(key)
  );
};

export const getQuoteCurrency = async (config: IBaseConfiguration) => {
  switch (config.OracleQuoteCurrency) {
    case 'ETH':
    case 'WETH':
    case 'WETN':
      return getWrappedNativeTokenAddress(config);
    case 'USD':
      return config.ProtocolGlobalParams.UsdAddress;
    default:
      throw `Quote ${config.OracleQuoteCurrency} currency not set. Add a new case to getQuoteCurrency switch`;
  }
};
