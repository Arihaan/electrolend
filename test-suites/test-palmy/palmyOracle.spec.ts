import { evmSnapshot } from '../../helpers/misc-utils';
import { MockAggregator, PalmyFallbackOracle, PalmyOracle } from '../../types';
import {
  deployMockAggregator,
  deployPalmyFallbackOracle,
  deployPalmyOracle,
} from '../../helpers/contracts-deployments';
import { makeSuite, TestEnv } from './helpers/make-suite';
import { getFirstSigner } from '../../helpers/contracts-getters';
import { ZERO_ADDRESS } from '../../helpers/constants';
const { expect } = require('chai');

// NOTE: fail "after all" in this test suite
//   "after all" hook in "PalmyOracle"
makeSuite('PalmyOracle', (testEnv: TestEnv) => {
  let evmSnapshotId;
  let oracle: PalmyOracle;
  let fallbackOracle: PalmyFallbackOracle;
  let aggregator: MockAggregator;
  let currencyAddress: string;
  const BASE_CURRENCY = ZERO_ADDRESS;

  beforeEach(async () => {
    evmSnapshotId = await evmSnapshot();
  });

  before(async () => {
    const ownerAddress = await (await getFirstSigner()).getAddress();
    currencyAddress = ownerAddress;
    oracle = await deployPalmyOracle([BASE_CURRENCY, '1', ownerAddress]);
    fallbackOracle = await deployPalmyFallbackOracle(ownerAddress);
    await fallbackOracle.authorizeSybil(ownerAddress);
    aggregator = await deployMockAggregator([[currencyAddress], ['1']]);
    await oracle.initialize(aggregator.address, fallbackOracle.address);
  });

  describe('getAssetPrrice', () => {
    it('can get Base price', async () => {
      const price = await oracle.getAssetPrice(BASE_CURRENCY);
      expect(price).to.be.equal(1);
    });
    it('can get price from aggregator', async () => {
      const price = await oracle.getAssetPrice(currencyAddress);
      expect(price).to.be.equal(1);
    });
    it('can get price from fallback', async () => {
      await oracle.setPriceAggregator((await deployMockAggregator([[], []])).address);
      await fallbackOracle.submitPrices([currencyAddress], [1]);
      const price = await oracle.getAssetPrice(currencyAddress);
      expect(price).to.be.equal(1);
    });
    it('reverts if price not available', async () => {
      await oracle.setPriceAggregator((await deployMockAggregator([[], []])).address);
      await fallbackOracle.submitPrices([currencyAddress], [0]);
      await expect(oracle.getAssetPrice(currencyAddress)).to.be.revertedWith(
        'PalmyOracle: price not available'
      );
    });
  });
});
