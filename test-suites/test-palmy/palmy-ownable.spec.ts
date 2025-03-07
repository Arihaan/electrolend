import { APPROVAL_AMOUNT_LENDING_POOL, RAY } from '../../helpers/constants';
import {
  deployLTokensAndRatesHelper,
  deployPalmyOracle,
} from '../../helpers/contracts-deployments';
import { getEthersSigners } from '../../helpers/contracts-helpers';
import { makeSuite, TestEnv } from './helpers/make-suite';

const { expect } = require('chai');

makeSuite('PalmyOwnable', (testEnv: TestEnv) => {
  it('Construct: initial owner should be the owner', async () => {
    const [, initialOwner] = await getEthersSigners();
    const testContract = await deployLTokensAndRatesHelper(await initialOwner.getAddress());
    expect(await testContract.owner()).to.be.equal(await initialOwner.getAddress());
  });
  it('Transfer Ownership: should transfer ownership to new owner', async () => {
    const [, initialOwner, newOwner] = await getEthersSigners();
    const testContract = await deployLTokensAndRatesHelper(await initialOwner.getAddress());
    await testContract.connect(initialOwner).transferOwnership(await newOwner.getAddress());
    expect(await testContract.owner()).to.be.equal(await newOwner.getAddress());
  });
});
