// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

/**
 * @title ISimplePriceFeedAdapter interface
 * @notice Interface for the SimplePriceFeedAdapter contract.
 **/
interface ISimplePriceFeedAdapter {
  /**
   * @dev Set the price feed contract address
   * @param _priceFeed Address of the SimplePriceFeed contract
   **/
  function setPriceFeed(address _priceFeed) external;
  
  /**
   * @dev Set the symbol for an asset
   * @param _asset Address of the asset
   * @param _symbol Symbol of the asset in the price feed
   **/
  function setAssetSymbol(address _asset, string calldata _symbol) external;
  
  /**
   * @dev Set symbols for multiple assets
   * @param _assets Array of asset addresses
   * @param _symbols Array of asset symbols
   **/
  function setAssetSymbols(address[] calldata _assets, string[] calldata _symbols) external;
  
  /**
   * @dev Set a direct price for an asset (fallback when no symbol is available)
   * @param _asset Address of the asset
   * @param _price Price of the asset (same scale as SimplePriceFeed: 10^8)
   **/
  function setDirectPrice(address _asset, uint256 _price) external;
  
  /**
   * @dev Set direct prices for multiple assets
   * @param _assets Array of asset addresses
   * @param _prices Array of asset prices
   **/
  function setDirectPrices(address[] calldata _assets, uint256[] calldata _prices) external;
  
  /**
   * @dev Get the current price of an asset
   * @param _asset Address of the asset
   * @return Price of the asset as int256 (scaled by 10^8)
   **/
  function currentPrice(address _asset) external view returns (int256);
  
  /**
   * @dev Get the current price of an asset
   * @param _asset Address of the asset
   * @return Price of the asset (scaled by 10^8)
   **/
  function getAssetPrice(address _asset) external view returns (uint256);
} 