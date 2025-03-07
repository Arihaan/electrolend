import { ZERO_ADDRESS } from '../../helpers/constants';
import { makeSuite } from './helpers/make-suite';
import {
  deployLendingPoolTmp,
  deployLendingPoolV4,
  deployLTokenImplementations,
} from '../../helpers/contracts-deployments';
import { ERC20Factory } from '../../types';
import { ethers } from 'ethers';
import { configureReservesByHelper, initReservesByHelper } from '../../helpers/init-helpers';
import { ConfigNames } from '../../helpers/configuration';
import { strategyDAIForTest } from '../../markets/palmy/reservesConfigs';
const chai = require('chai');
const { expect } = chai;

makeSuite('LendingPool upgrade - upgrade lending pool', (testEnv) => {
  it('Deposits WETH, borrows DAI/Check liquidation fails because health factor is above 1', async () => {
    const { dai, pool, deployer, addressesProvider, helpersContract } = testEnv;
    const [, user] = testEnv.users;
    await dai.connect(user.signer).mint(ethers.utils.parseEther('100'));
    await dai.connect(user.signer).approve(pool.address, ethers.utils.parseEther('100'));
    await pool
      .connect(user.signer)
      .deposit(dai.address, ethers.utils.parseEther('1'), user.address, '0');
    const oldLtokenAddrss = (await pool.getReserveData(dai.address)).lTokenAddress;
    const lendingPoolTmp = await deployLendingPoolTmp();
    // upgrade to v3
    await addressesProvider.setLendingPoolImpl(lendingPoolTmp.address);
    expect(await pool.LENDINGPOOL_REVISION()).to.be.eq('3');
    expect(await pool.FLASHLOAN_PREMIUM_TOTAL()).to.be.eq('9');
    expect(await pool.getAddressesProvider()).to.be.eq(await addressesProvider.address);
    await pool
      .connect(user.signer)
      .withdraw(dai.address, ethers.utils.parseEther('1'), user.address);
    await pool
      .connect(user.signer)
      .deposit(dai.address, ethers.utils.parseEther('1'), user.address, '0');
    // upgrade dai reserve
    const reservesParams = {
      DAI: {
        ...strategyDAIForTest,
        reserveDecimals: '9',
      },
    };
    await deployLTokenImplementations(ConfigNames.Palmy, reservesParams, false);
    await initReservesByHelper(
      reservesParams,
      { DAI: dai.address },
      'NewLToken',
      'NewStableDebtToken',
      'NewVariableDebtToken',
      'NewSymbol',
      deployer.address,
      deployer.address,
      ZERO_ADDRESS,
      ConfigNames.Palmy,
      false
    );
    await configureReservesByHelper(
      reservesParams,
      { DAI: dai.address },
      helpersContract,
      deployer.address
    );
    const newLtoken = (await pool.getReserveData(dai.address)).lTokenAddress;
    expect(newLtoken).to.not.eq(oldLtokenAddrss);
    const newLTokenDecimals = await ERC20Factory.connect(newLtoken, deployer.signer).decimals();
    expect(newLTokenDecimals).to.be.eq(9);
    await pool
      .connect(user.signer)
      .deposit(dai.address, ethers.utils.parseEther('10'), user.address, '0');
    // upgrade to v4
    const lendingPoolV4 = await deployLendingPoolV4();
    await addressesProvider.setLendingPoolImpl(lendingPoolV4.address);
    expect(await pool.LENDINGPOOL_REVISION()).to.be.eq('4');
  });
});
