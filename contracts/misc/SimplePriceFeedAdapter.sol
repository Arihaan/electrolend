// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import {IPriceAggregatorAdapter} from '../interfaces/IPriceAggregatorAdapter.sol';
import {IPriceOracleGetter} from '../interfaces/IPriceOracleGetter.sol';
import {ISimplePriceFeedAdapter} from '../interfaces/ISimplePriceFeedAdapter.sol';
import {ElectroOwnable} from '../dependencies/ElectroOwnable.sol';
import '../misc/SimplePriceFeed.sol';

/**
 * @title SimplePriceFeedAdapter
 * @dev Adapter for SimplePriceFeed to be used with ElectroLend Protocol
 * Connects to an existing SimplePriceFeed contract and converts string-based asset queries
 * to address-based queries for the protocol
 */
contract SimplePriceFeedAdapter is IPriceAggregatorAdapter, IPriceOracleGetter, ISimplePriceFeedAdapter, ElectroOwnable {
    // The SimplePriceFeed contract instance
    SimplePriceFeed public priceFeed;
    
    // Mapping from asset address to symbol
    mapping(address => string) public assetToSymbol;
    
    // Direct prices for assets that don't have a symbol in the price feed
    mapping(address => uint256) public directPrices;
    
    // Events
    event AssetSymbolUpdated(address indexed asset, string symbol);
    event DirectPriceSet(address indexed asset, uint256 price);
    event PriceFeedUpdated(address indexed newPriceFeed);
    
    /**
     * @dev Constructor
     * @param _priceFeed Address of the SimplePriceFeed contract
     * @param _owner Address of the owner
     */
    constructor(address _priceFeed, address _owner) public ElectroOwnable(_owner) {
        priceFeed = SimplePriceFeed(_priceFeed);
    }
    
    /**
     * @dev Set the price feed contract address
     * @param _priceFeed Address of the SimplePriceFeed contract
     */
    function setPriceFeed(address _priceFeed) external override onlyOwner {
        priceFeed = SimplePriceFeed(_priceFeed);
        emit PriceFeedUpdated(_priceFeed);
    }
    
    /**
     * @dev Set the symbol for an asset
     * @param _asset Address of the asset
     * @param _symbol Symbol of the asset in the price feed
     */
    function setAssetSymbol(address _asset, string calldata _symbol) external override onlyOwner {
        assetToSymbol[_asset] = _symbol;
        emit AssetSymbolUpdated(_asset, _symbol);
    }
    
    /**
     * @dev Set symbols for multiple assets
     * @param _assets Array of asset addresses
     * @param _symbols Array of asset symbols
     */
    function setAssetSymbols(address[] calldata _assets, string[] calldata _symbols) external override onlyOwner {
        require(_assets.length == _symbols.length, "Array length mismatch");
        
        for (uint i = 0; i < _assets.length; i++) {
            assetToSymbol[_assets[i]] = _symbols[i];
            emit AssetSymbolUpdated(_assets[i], _symbols[i]);
        }
    }
    
    /**
     * @dev Set a direct price for an asset (fallback when no symbol is available)
     * @param _asset Address of the asset
     * @param _price Price of the asset (same scale as SimplePriceFeed: 10^8)
     */
    function setDirectPrice(address _asset, uint256 _price) external override onlyOwner {
        directPrices[_asset] = _price;
        emit DirectPriceSet(_asset, _price);
    }
    
    /**
     * @dev Set direct prices for multiple assets
     * @param _assets Array of asset addresses
     * @param _prices Array of asset prices
     */
    function setDirectPrices(address[] calldata _assets, uint256[] calldata _prices) external override onlyOwner {
        require(_assets.length == _prices.length, "Array length mismatch");
        
        for (uint i = 0; i < _assets.length; i++) {
            directPrices[_assets[i]] = _prices[i];
            emit DirectPriceSet(_assets[i], _prices[i]);
        }
    }
    
    /**
     * @dev Get the current price of an asset
     * @param _asset Address of the asset
     * @return Price of the asset as int256 (scaled by 10^8)
     */
    function currentPrice(address _asset) external view override(IPriceAggregatorAdapter, ISimplePriceFeedAdapter) returns (int256) {
        string memory symbol = assetToSymbol[_asset];
        
        // If the symbol is set, get price from the price feed
        if (bytes(symbol).length > 0) {
            uint256 price;
            bool isFresh;
            (price, isFresh) = priceFeed.getVerifiedPrice(symbol);
            
            if (isFresh && price > 0) {
                return int256(price);
            }
        }
        
        // If no symbol or price not fresh, try direct price
        uint256 directPrice = directPrices[_asset];
        if (directPrice > 0) {
            return int256(directPrice);
        }
        
        // No price available
        return 0;
    }
    
    /**
     * @dev Get the current price of an asset
     * Implementation of IPriceOracleGetter.getAssetPrice
     * @param _asset Address of the asset
     * @return Price of the asset (scaled by 10^8)
     */
    function getAssetPrice(address _asset) external view override(IPriceOracleGetter, ISimplePriceFeedAdapter) returns (uint256) {
        string memory symbol = assetToSymbol[_asset];
        
        // If the symbol is set, get price from the price feed
        if (bytes(symbol).length > 0) {
            uint256 price;
            bool isFresh;
            (price, isFresh) = priceFeed.getVerifiedPrice(symbol);
            
            if (isFresh && price > 0) {
                return price;
            }
        }
        
        // If no symbol or price not fresh, try direct price
        uint256 directPrice = directPrices[_asset];
        if (directPrice > 0) {
            return directPrice;
        }
        
        // No price available
        revert("Price not available");
    }
} 