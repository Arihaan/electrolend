// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import {StableDebtToken} from '../protocol/tokenization/StableDebtToken.sol';
import {VariableDebtToken} from '../protocol/tokenization/VariableDebtToken.sol';
import {LendingRateOracle} from '../mocks/oracle/LendingRateOracle.sol';
import {ElectroOwnable} from '../dependencies/ElectroOwnable.sol';
import {StringLib} from './StringLib.sol';
import {Initializable} from '../dependencies/openzeppelin/upgradeability/Initializable.sol';

contract StableAndVariableTokensHelper is ElectroOwnable, Initializable {
  address payable private pool;
  address private addressesProvider;
  event deployedContracts(address stableToken, address variableToken);

  constructor(address initialOwer) public ElectroOwnable(initialOwer) {}

  function initialize(
    address payable _pool,
    address _addressesProvider
  ) external onlyOwner initializer {
    pool = _pool;
    addressesProvider = _addressesProvider;
  }

  function initDeployment(address[] calldata tokens, string[] calldata symbols) external onlyOwner {
    require(tokens.length == symbols.length, 'Arrays not same length');
    require(pool != address(0), 'Pool can not be zero address');
    for (uint256 i = 0; i < tokens.length; i++) {
      emit deployedContracts(address(new StableDebtToken()), address(new VariableDebtToken()));
    }
  }

  function setOracleBorrowRates(
    address[] calldata assets,
    uint256[] calldata rates,
    address oracle
  ) external onlyOwner {
    require(assets.length == rates.length, 'Arrays not same length');

    for (uint256 i = 0; i < assets.length; i++) {
      // LendingRateOracle owner must be this contract
      LendingRateOracle(oracle).setMarketBorrowRate(assets[i], rates[i]);
    }
  }

  function setOracleOwnership(address oracle, address admin) external onlyOwner {
    require(admin != address(0), 'owner can not be zero');
    require(LendingRateOracle(oracle).owner() == address(this), 'helper is not owner');
    LendingRateOracle(oracle).transferOwnership(admin);
  }
}
