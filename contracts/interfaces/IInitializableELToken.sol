// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.6.12;

import {ILendingPool} from './ILendingPool.sol';
import {IElectroIncentivesController} from './IElectroIncentivesController.sol';

/**
 * @title IInitializableELToken
 * @notice Interface for the initialize function on ELToken
 * @author ElectroLend
 **/
interface IInitializableELToken {
  /**
   * @dev Emitted when an elToken is initialized
   * @param underlyingAsset The address of the underlying asset
   * @param pool The address of the associated lending pool
   * @param treasury The address of the treasury
   * @param incentivesController The address of the incentives controller for this elToken
   * @param elTokenDecimals the decimals of the underlying
   * @param elTokenName the name of the elToken
   * @param elTokenSymbol the symbol of the elToken
   * @param params A set of encoded parameters for additional initialization
   **/
  event Initialized(
    address indexed underlyingAsset,
    address indexed pool,
    address treasury,
    address incentivesController,
    uint8 elTokenDecimals,
    string elTokenName,
    string elTokenSymbol,
    bytes params
  );

  /**
   * @dev Initializes the elToken
   * @param pool The address of the lending pool where this elToken will be used
   * @param treasury The address of the ElectroLend treasury, receiving the fees on this elToken
   * @param underlyingAsset The address of the underlying asset of this elToken (E.g. WETH for elWETH)
   * @param incentivesController The smart contract managing potential incentives distribution
   * @param elTokenDecimals The decimals of the elToken, same as the underlying asset's
   * @param elTokenName The name of the elToken
   * @param elTokenSymbol The symbol of the elToken
   */
  function initialize(
    ILendingPool pool,
    address treasury,
    address underlyingAsset,
    IElectroIncentivesController incentivesController,
    uint8 elTokenDecimals,
    string calldata elTokenName,
    string calldata elTokenSymbol,
    bytes calldata params
  ) external;
} 