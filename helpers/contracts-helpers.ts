import { Artifact as BuidlerArtifact } from '@nomiclabs/buidler/types';
import BigNumber from 'bignumber.js';
import { signTypedData_v4 } from 'eth-sig-util';
import { ECDSASignature, fromRpcSig } from 'ethereumjs-util';
import { BigNumberish, BytesLike, Contract, ethers, Signer, utils } from 'ethers';
import { Artifact } from 'hardhat/types';
import { MintableERC20 } from '../types/MintableERC20';
import { ConfigNames, loadPoolConfig } from './configuration';
import { PERMISSIONED_CONTRACT_FACTORY_ADDRESS, ZERO_ADDRESS } from './constants';
import { getFirstSigner, getIErc20Detailed } from './contracts-getters';
import { verifyEtherscanContract } from './etherscan-verification';
import { DRE, getDb, notFalsyOrZeroAddress, waitForTx } from './misc-utils';
import {
  eElectroneumNetwork,
  eContractid,
  eEthereumNetwork,
  eNetwork,
  iElectroneumParamsPerNetwork,
  iEthereumParamsPerNetwork,
  iParamsPerNetwork,
  iParamsPerPool,
  ElectroPools,
  tEthereumAddress,
  tStringTokenSmallUnits,
  eOasysNetwork,
  iOasysParamsPerNetwork,
} from './types';
import { IPermissionedContractFactoryFactory } from '../types/IPermissionedContractFactoryFactory';

export const getElectroneumDeploymentAddress = async (contractId: string, callData: BytesLike) => {
  // Try to extract first 20 bytes as destination address
  try {
    const deployerDestinationAddress = '0x' + callData.substring(34, 34 + 40);
    if (
      deployerDestinationAddress &&
      isAddress(deployerDestinationAddress) &&
      !isZeroAddress(deployerDestinationAddress)
    ) {
      console.log('Extracted deployerDestinationAddress', deployerDestinationAddress);
      return deployerDestinationAddress;
    }
  } catch (e) {}
  // Return address calculated from code hash
  return utils.hexlify(utils.sha256(utils.toUtf8Bytes(contractId + 'electrolend')));
};

const toSalt = (contractId: string) => {
  return utils.hexlify(utils.sha256(utils.toUtf8Bytes(contractId + 'electrolend-fi')));
};

export const deployToElectroneumTestnet = async (id: eContractid, verify?: boolean) => {
  const {
    FACTORY_ADDRESS,
    JSON_BYTECODE_PATH,
    USER_PRIVATE_KEY,
    DETERMINISTIC_DEPLOYMENT,
    ETHERSCAN_API_KEY,
  } = process.env;

  if (!USER_PRIVATE_KEY || USER_PRIVATE_KEY === '') {
    throw new Error('USER_PRIVATE_KEY is empty, set env');
  }

  const wallet = new DRE.ethers.Wallet(USER_PRIVATE_KEY, DRE.ethers.provider);
  console.log('Wallet used', await wallet.getAddress());

  const factoryInstance = await DRE.ethers.getContractAt('IExtendedFactory', FACTORY_ADDRESS || '');
  // The buildBytecode util from @nomiclabs/buidler checks if the contract path or name exists
  const bytecodeFile = JSON.parse(
    <string>(<unknown>await DRE.deployments.readArtifact(id.toString()))
  );
  const constructorArgs = bytecodeFile.constructorArgs;
  console.debug('bytecodeFile', bytecodeFile);
  const salt = DRE.ethers.utils.keccak256(DRE.ethers.utils.toUtf8Bytes(id.toString()));
  // Get contract factory
  const contract = await DRE.ethers.getContractFactory(bytecodeFile.contractName);
  // Get contract bytecode
  const bytecode = contract.bytecode;
  // Get contract address
  const contractAddress = await contract.signer.provider?.call({
    to: FACTORY_ADDRESS,
    data: factoryInstance.interface.encodeFunctionData('deployContract', [
      bytecode,
      constructorArgs,
      salt,
    ]),
  });
  // Convert response to address
  const contractAddressHex = '0x' + contractAddress?.slice(contractAddress.length - 40);
  console.log('contractAddressHex by provider call', contractAddressHex);
  // Check if contract already exists
  const contractExists = await DRE.ethers.provider.getCode(contractAddressHex);
  if (contractExists !== '0x') {
    console.log('Contract already exists at', contractAddressHex);
    const contractFactory = await DRE.ethers.getContractFactory(bytecodeFile.contractName);
    return {
      contract: contractFactory.attach(contractAddressHex),
      address: contractAddressHex,
      contractAddress: contractAddressHex,
    };
  }
  console.log('Contract not found, trying to deploy');
  // Send deployment transaction, wait for it to be mined
  const currentNetwork = DRE.network.name;
  if ((currentNetwork as eNetwork) == eElectroneumNetwork.mainnet) {
    const tx = await factoryInstance.deployContract(bytecode, constructorArgs, salt, {
      gasLimit: 6000000,
    });
    await tx.wait();
  } else {
    const callData = factoryInstance.interface.encodeFunctionData('deployContract', [
      bytecode,
      constructorArgs,
      salt,
    ]);
    
    return {
      contract: null,
      address: await getElectroneumDeploymentAddress(id, callData),
      contractAddress: await getElectroneumDeploymentAddress(id, callData),
    };
  }
  return {
    contract: await DRE.ethers.getContractAt(bytecodeFile.contractName, contractAddressHex),
    address: contractAddressHex,
    contractAddress: contractAddressHex,
  };
};
export const registerContractAddressInJsonDb = async (
  contractId: string,
  address: string,
  deployer: string
) => {
  const currentNetwork = DRE.network.name;
  await getDb()
    .set(`${contractId}.${currentNetwork}`, {
      address: address,
      deployer: deployer,
    })
    .write();
};
export type MockTokenMap = { [symbol: string]: MintableERC20 };
export const saveDeploymentCallData = async (contractId: string, callData: BytesLike) => {
  const currentNetwork = DRE.network.name;
  // save calldata into .deployments/calldata/<network>/<contractId>.calldata
  // directory of this file
  const path = require('path');
  const fs = require('fs');
  const dir = path.join(__dirname, '..', '.deployments', 'calldata', currentNetwork);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const fileName = path.join(dir, `${contractId}.calldata`);
  fs.writeFileSync(fileName, callData);
  if ((currentNetwork as eNetwork) == eElectroneumNetwork.testnet || (currentNetwork as eNetwork) == eOasysNetwork.oasys) {
    await registerContractAddressAndSaltInJsonDb(
      contractId,
      await getElectroneumDeploymentAddress(contractId, callData),
      '',
      toSalt(contractId)
    );
  }
};

const registerContractAddressAndSaltInJsonDb = async (
  contractId: string,
  address: string,
  deployer: string,
  salt: string
) => {
  const currentNetwork = DRE.network.name;
  await getDb()
    .set(`${contractId}.${currentNetwork}`, {
      address: address,
      deployer: deployer,
      salt: salt,
    })
    .write();
};
export const registerContractInJsonDb = async (contractId: string, contractInstance: Contract) => {
  const currentNetwork = DRE.network.name;
  const FORK = process.env.FORK;
  if (FORK || (currentNetwork !== 'hardhat' && !currentNetwork.includes('coverage'))) {
    console.log(`*** ${contractId} ***\n`);
    console.log(`Network: ${currentNetwork}`);
    console.log(`tx: ${contractInstance.deployTransaction.hash}`);
    console.log(`contract address: ${contractInstance.address}`);
    console.log(`deployer address: ${contractInstance.deployTransaction.from}`);
    console.log(`gas price: ${contractInstance.deployTransaction.gasPrice}`);
    console.log(`gas used: ${contractInstance.deployTransaction.gasLimit}`);
    console.log(`\n******`);
    console.log();
  }

  await getDb()
    .set(`${contractId}.${currentNetwork}`, {
      address: contractInstance.address,
      deployer: contractInstance.deployTransaction.from,
    })
    .write();
};

export const insertContractAddressInDb = async (id: eContractid, address: tEthereumAddress) =>
  await getDb()
    .set(`${id}.${DRE.network.name}`, {
      address,
    })
    .write();

export const rawInsertContractAddressInDb = async (id: string, address: tEthereumAddress) =>
  await getDb()
    .set(`${id}.${DRE.network.name}`, {
      address,
    })
    .write();

export const getEthersSigners = async (): Promise<Signer[]> => {
  const ethersSigners = await Promise.all(await DRE.ethers.getSigners());
  // if (usingDefender()) {
  //   const [, ...users] = ethersSigners;
  //   return [await getDefenderRelaySigner(), ...users];
  // }
  return ethersSigners;
};

export const getEthersSignersAddresses = async (): Promise<tEthereumAddress[]> =>
  await Promise.all((await getEthersSigners()).map((signer) => signer.getAddress()));

export const getCurrentBlock = async () => {
  return DRE.ethers.provider.getBlockNumber();
};

export const decodeAbiNumber = (data: string): number =>
  parseInt(utils.defaultAbiCoder.decode(['uint256'], data).toString());

export const deployContract = async <ContractType extends Contract>(
  contractName: string,
  args: any[]
): Promise<ContractType> => {
  const contract = (await (await DRE.ethers.getContractFactory(contractName))
    .connect(await getFirstSigner())
    .deploy(...args)) as ContractType;
  await waitForTx(contract.deployTransaction);
  await registerContractInJsonDb(<eContractid>contractName, contract);
  return contract;
};

export const withSaveAndVerify = async <ContractType extends Contract>(
  instance: ContractType,
  id: string,
  args: (string | string[])[],
  verify?: boolean
): Promise<ContractType> => {
  await waitForTx(instance.deployTransaction);
  await registerContractInJsonDb(id, instance);
  if (verify) {
    await verifyContract(id, instance.address, args);
  }
  return instance;
};

export const getContract = async <ContractType extends Contract>(
  contractName: string,
  address: string
): Promise<ContractType> => (await DRE.ethers.getContractAt(contractName, address)) as ContractType;

export const linkBytecode = (artifact: BuidlerArtifact | Artifact, libraries: any) => {
  let bytecode = artifact.bytecode;

  for (const [fileName, fileReferences] of Object.entries(artifact.linkReferences)) {
    for (const [libName, fixups] of Object.entries(fileReferences)) {
      const addr = libraries[libName];

      if (addr === undefined) {
        continue;
      }

      for (const fixup of fixups) {
        bytecode =
          bytecode.substr(0, 2 + fixup.start * 2) +
          addr.substr(2) +
          bytecode.substr(2 + (fixup.start + fixup.length) * 2);
      }
    }
  }

  return bytecode;
};

export const getParamPerNetwork = <T>(param: iParamsPerNetwork<T>, network: eNetwork) => {
  if (!param) {
    console.error(`Param is undefined for network: ${network}`);
    return undefined;
  }

  // Check if this is an Electroneum network
  if (Object.values(eElectroneumNetwork).includes(network as eElectroneumNetwork)) {
    const electroneumParams = param as iElectroneumParamsPerNetwork<T>;
    return electroneumParams[network as eElectroneumNetwork];
  }

  // Check if this is an Oasys network
  if (Object.values(eOasysNetwork).includes(network as eOasysNetwork)) {
    const oasysParams = param as iOasysParamsPerNetwork<T>;
    return oasysParams[network as eOasysNetwork];
  }

  // Handle Ethereum networks
  const ethereumParams = param as iEthereumParamsPerNetwork<T>;
  const { coverage, buidlerevm, tenderly } = ethereumParams;

  if (process.env.FORK) {
    return param[process.env.FORK as eNetwork] as T;
  }

  switch (network) {
    case eEthereumNetwork.coverage:
      return coverage;
    case eEthereumNetwork.buidlerevm:
      return buidlerevm;
    case eEthereumNetwork.hardhat:
      return buidlerevm;
    case eEthereumNetwork.tenderly:
      return tenderly;
  }
};

export const getOptionalParamAddressPerNetwork = (
  param: iParamsPerNetwork<tEthereumAddress> | undefined | null,
  network: eNetwork
) => {
  if (!param) {
    return ZERO_ADDRESS;
  }
  return getParamPerNetwork(param, network);
};

export const getParamPerPool = <T>({ proto }: iParamsPerPool<T>, pool: ElectroPools) => {
  switch (pool) {
    case ElectroPools.proto:
      return proto;
    default:
      return proto;
  }
};

export const convertToCurrencyDecimals = async (tokenAddress: tEthereumAddress, amount: string) => {
  const token = await getIErc20Detailed(tokenAddress);
  let decimals = (await token.decimals()).toString();

  return ethers.utils.parseUnits(amount, decimals);
};

export const convertToCurrencyUnits = async (tokenAddress: string, amount: string) => {
  const token = await getIErc20Detailed(tokenAddress);
  let decimals = new BigNumber(await token.decimals());
  const currencyUnit = new BigNumber(10).pow(decimals);
  const amountInCurrencyUnits = new BigNumber(amount).div(currencyUnit);
  return amountInCurrencyUnits.toFixed();
};

export const buildPermitParams = (
  chainId: number,
  token: tEthereumAddress,
  revision: string,
  tokenName: string,
  owner: tEthereumAddress,
  spender: tEthereumAddress,
  nonce: number,
  deadline: string,
  value: tStringTokenSmallUnits
) => ({
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
    Permit: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
  },
  primaryType: 'Permit' as const,
  domain: {
    name: tokenName,
    version: revision,
    chainId: chainId,
    verifyingContract: token,
  },
  message: {
    owner,
    spender,
    value,
    nonce,
    deadline,
  },
});

export const getSignatureFromTypedData = (
  privateKey: string,
  typedData: any // TODO: should be TypedData, from eth-sig-utils, but TS doesn't accept it
): ECDSASignature => {
  const signature = signTypedData_v4(Buffer.from(privateKey.substring(2, 66), 'hex'), {
    data: typedData,
  });
  return fromRpcSig(signature);
};

export const buildLiquiditySwapParams = (
  assetToSwapToList: tEthereumAddress[],
  minAmountsToReceive: BigNumberish[],
  swapAllBalances: BigNumberish[],
  permitAmounts: BigNumberish[],
  deadlines: BigNumberish[],
  v: BigNumberish[],
  r: (string | Buffer)[],
  s: (string | Buffer)[],
  useEthPath: boolean[]
) => {
  return ethers.utils.defaultAbiCoder.encode(
    [
      'address[]',
      'uint256[]',
      'bool[]',
      'uint256[]',
      'uint256[]',
      'uint8[]',
      'bytes32[]',
      'bytes32[]',
      'bool[]',
    ],
    [
      assetToSwapToList,
      minAmountsToReceive,
      swapAllBalances,
      permitAmounts,
      deadlines,
      v,
      r,
      s,
      useEthPath,
    ]
  );
};

export const buildRepayAdapterParams = (
  collateralAsset: tEthereumAddress,
  collateralAmount: BigNumberish,
  rateMode: BigNumberish,
  permitAmount: BigNumberish,
  deadline: BigNumberish,
  v: BigNumberish,
  r: string | Buffer,
  s: string | Buffer,
  useEthPath: boolean
) => {
  return ethers.utils.defaultAbiCoder.encode(
    ['address', 'uint256', 'uint256', 'uint256', 'uint256', 'uint8', 'bytes32', 'bytes32', 'bool'],
    [collateralAsset, collateralAmount, rateMode, permitAmount, deadline, v, r, s, useEthPath]
  );
};

export const verifyContract = async (
  id: string,
  contractAddress: string,
  args: (string | string[])[],
  libraries?: string
) => {
  await verifyEtherscanContract(contractAddress, args, libraries);
};

export const getContractAddressWithJsonFallback = async (
  id: string,
  pool: ConfigNames
): Promise<tEthereumAddress> => {
  const poolConfig = loadPoolConfig(pool);
  const network = <eNetwork>DRE.network.name;
  const db = getDb();

  const contractAtMarketConfig = getOptionalParamAddressPerNetwork(poolConfig[id], network);
  if (notFalsyOrZeroAddress(contractAtMarketConfig)) {
    return contractAtMarketConfig;
  }

  const contractAtDb = await getDb().get(`${id}.${DRE.network.name}`).value();
  if (contractAtDb?.address) {
    return contractAtDb.address as tEthereumAddress;
  }
  throw Error(`Missing contract address ${id} at Market config and JSON local db`);
};
