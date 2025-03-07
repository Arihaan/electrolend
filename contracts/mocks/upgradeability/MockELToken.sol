// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.6.12;

import {ELToken} from '../../protocol/tokenization/ELToken.sol';
import {ILendingPool} from '../../interfaces/ILendingPool.sol';
import {IElectroIncentivesController} from '../../interfaces/IElectroIncentivesController.sol';

contract MockELToken is ELToken {
  function getRevision() internal pure override returns (uint256) {
    return 0x2;
  }
} 