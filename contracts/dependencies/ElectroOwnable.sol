// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
import {Ownable} from './openzeppelin/contracts/Ownable.sol';

/**
 * @title ElectroOwnable
 * @dev Extension of OpenZeppelin's Ownable contract that allows setting
 * the initial owner in the constructor
 */
contract ElectroOwnable is Ownable {
  constructor(address initialOwner) public Ownable() {
    transferOwnership(initialOwner);
  }
} 