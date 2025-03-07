import { task } from 'hardhat/config';
import { deployMintableERC20 } from '../../helpers/contracts-deployments';
import { registerContractInJsonDb } from '../../helpers/contracts-helpers';
import { TokenContractId } from '../../helpers/types';

const deployMockTokenAndRecordJson = async ({
  key,
  name,
  symbol,
  decimals,
}: {
  key: (typeof TokenContractId)[number];
  name: string;
  symbol: string;
  decimals: string;
}) => {
  const instance = await deployMintableERC20([name, symbol, decimals], false);
  await registerContractInJsonDb(key.toUpperCase(), instance);
};
