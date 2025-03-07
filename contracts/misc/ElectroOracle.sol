// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import {ElectroOwnable} from '../dependencies/ElectroOwnable.sol';
import {IPriceOracleGetter} from '../interfaces/IPriceOracleGetter.sol';
import {IElectroOracle} from './interfaces/IElectroOracle.sol';
import {Initializable} from '../dependencies/openzeppelin/upgradeability/Initializable.sol';
import {SimplePriceFeedAdapter} from './SimplePriceFeedAdapter.sol';

/**
 * @title ElectroOracle
 * @dev Oracle contract for ElectroLend to get asset prices 
 * using the SimplePriceFeedAdapter which connects to SimplePriceFeed
 */
contract ElectroOracle is IPriceOracleGetter, IElectroOracle, ElectroOwnable, Initializable {
    // The base currency of the oracle
    address public immutable override BASE_CURRENCY;
    
    // The unit of the base currency (e.g. USD = 10^8)
    uint256 public immutable override BASE_CURRENCY_UNIT;
    
    // The adapter that connects to SimplePriceFeed
    SimplePriceFeedAdapter private _adapter;
    
    // Events
    event AdapterUpdated(address indexed adapter);
    event BaseCurrencySet(address indexed baseCurrency, uint256 baseCurrencyUnit);
    
    /**
     * @dev Constructor
     * @param baseCurrency The base currency address (0 address for USD)
     * @param baseCurrencyUnit The unit of the base currency
     * @param initialOwner The initial owner of the contract
     */
    constructor(
        address baseCurrency,
        uint256 baseCurrencyUnit,
        address initialOwner
    ) public ElectroOwnable(initialOwner) {
        BASE_CURRENCY = baseCurrency;
        BASE_CURRENCY_UNIT = baseCurrencyUnit;
        emit BaseCurrencySet(baseCurrency, baseCurrencyUnit);
    }
    
    /**
     * @dev Initialize the contract with the adapter
     * @param adapter The address of the SimplePriceFeedAdapter
     */
    function initialize(address adapter) external initializer {
        _setAdapter(adapter);
    }
    
    /**
     * @dev Set the price adapter
     * @param adapter The address of the SimplePriceFeedAdapter
     */
    function setAdapter(address adapter) external override onlyOwner {
        _setAdapter(adapter);
    }
    
    /**
     * @dev Internal function to set the adapter
     * @param adapter The address of the SimplePriceFeedAdapter
     */
    function _setAdapter(address adapter) internal {
        _adapter = SimplePriceFeedAdapter(adapter);
        emit AdapterUpdated(adapter);
    }
    
    /**
     * @dev Get the price of an asset
     * @param asset The address of the asset
     * @return The price of the asset
     */
    function getAssetPrice(address asset) public view override(IPriceOracleGetter, IElectroOracle) returns (uint256) {
        if (asset == BASE_CURRENCY) {
            return BASE_CURRENCY_UNIT;
        }
        
        return _adapter.getAssetPrice(asset);
    }
    
    /**
     * @dev Get the prices of multiple assets
     * @param assets The addresses of the assets
     * @return The prices of the assets
     */
    function getAssetsPrices(address[] calldata assets) external view override returns (uint256[] memory) {
        uint256[] memory prices = new uint256[](assets.length);
        
        for (uint256 i = 0; i < assets.length; i++) {
            prices[i] = getAssetPrice(assets[i]);
        }
        
        return prices;
    }
    
    /**
     * @dev Get the address of the adapter
     * @return The address of the adapter
     */
    function getAdapter() external view override returns (address) {
        return address(_adapter);
    }
} 