import BigNumber from 'bignumber.js';
import { evmSnapshot } from '../../helpers/misc-utils';
import { ChainsightOracleMockFactory, PriceAggregatorAdapterChainsightImpl } from '../../types';
import {
  deployChainsightOracle,
  deployPriceAggregatorChainsightImpl,
} from '../../helpers/contracts-deployments';
import { makeSuite, TestEnv } from './helpers/make-suite';
import { getChainsightOracle, getFirstSigner } from '../../helpers/contracts-getters';
import { AbiCoder } from 'ethers/lib/utils';

const { expect } = require('chai');
const oneEther = new BigNumber(Math.pow(10, 18));

const mockPrices = () => {
  return [
    {
      price: oneEther.multipliedBy('0.00367714136416').toFixed(),
      tokenAddress: '0xDAC17F958D2Ee523a2206206994597C13d831ec1',
      symbol: 'WETH',
    },
    {
      price: oneEther.toFixed(),
      tokenAddress: '0xDac17f958D2eE523a2206206994597c13d831EC2',
      symbol: 'OAS',
    },
  ];
};

// NOTE: fail "after all" in this test suite
//   "after all" hook in "Price Aggregator Implementation for Chainsight"
makeSuite('Price Aggregator Implementation for Chainsight', (testEnv: TestEnv) => {
  const prices = mockPrices();
  let evmSnapshotId;
  let aggregator: PriceAggregatorAdapterChainsightImpl;
  beforeEach(async () => {
    evmSnapshotId = await evmSnapshot();
  });

  before(async () => {
    aggregator = await deployPriceAggregatorChainsightImpl(
      await (await getFirstSigner()).getAddress()
    );
    for (const p of prices) {
      await deployChainsightOracle(p.symbol, false);
    }
  });

  describe('PriceAggregatorAdapterChainsightImpl', () => {
    describe('setAssetSources', () => {
      it('asset source update', async () => {
        for (const p of prices) {
          const oracle = await getChainsightOracle(p.symbol);
          await oracle.updateStateBulk(
            [new AbiCoder().encode(['uint256'], [p.price])],
            ['0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef']
          );

          await aggregator.setAssetSources(
            [p.tokenAddress],
            [oracle.address],
            [await (await getFirstSigner()).getAddress()],
            ['0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef']
          );
          console.log('set asset source');
          const price = await aggregator.currentPrice(p.tokenAddress);
          expect(price.toString()).to.be.equal(p.price);
        }
      });
      it('revert if the data is not fresh', async () => {
        const chainsightOracleMock = await new ChainsightOracleMockFactory(
          await getFirstSigner()
        ).deploy();
        await aggregator.setAssetSources(
          [prices[0].tokenAddress],
          [chainsightOracleMock.address],
          [await (await getFirstSigner()).getAddress()],
          ['0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef']
        );
        const threshold = 60 * 60;
        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        await chainsightOracleMock.updateStateMock(
          new AbiCoder().encode(['uint256'], [1]),
          currentTimestamp - threshold
        );
        await expect(aggregator.currentPrice(prices[0].tokenAddress)).to.be.revertedWith(
          'STALE_DATA'
        );
      });
    });
  });
});
