// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

/**
 * @title IElectroOracle interface
 * @notice Interface for the ElectroOracle contract.
 **/
interface IElectroOracle {
  /**
   * @dev Returns the base currency address
   * @return The base currency address
   **/
  function BASE_CURRENCY() external view returns (address);

  /**
   * @dev Returns the base currency unit
   * @return The base currency unit
   **/
  function BASE_CURRENCY_UNIT() external view returns (uint256);

  /**
   * @dev Sets the price adapter address
   * @param adapter The address of the SimplePriceFeedAdapter
   **/
  function setAdapter(address adapter) external;

  /**
   * @dev Gets an asset price
   * @param asset The asset address
   * @return the asset price
   **/
  function getAssetPrice(address asset) external view returns (uint256);

  /**
   * @dev Gets a list of prices from a list of assets addresses
   * @param assets The list of assets addresses
   * @return the prices of the assets
   **/
  function getAssetsPrices(address[] calldata assets) external view returns (uint256[] memory);

  /**
   * @dev Gets the address of the adapter
   * @return The address of the adapter
   **/
  function getAdapter() external view returns (address);
} 