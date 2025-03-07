// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SimplePriceFeed
 * @dev A simple oracle contract for storing and retrieving asset prices
 */
contract SimplePriceFeed is Ownable {
    // Price data structure
    struct PriceData {
        uint256 price;     // Price scaled by 10^8 (e.g. $1.00 = 100000000)
        uint256 timestamp; // Last update timestamp
    }
    
    // Mapping of asset symbol to price data
    mapping(string => PriceData) public prices;
    
    // Addresses authorized to update prices
    mapping(address => bool) public updaters;
    
    // Maximum age of price data before it's considered stale (default 1 hour)
    uint256 public stalePriceAge = 1 hours;
    
    // Events
    event PriceUpdated(string indexed symbol, uint256 price, uint256 timestamp);
    event UpdaterAdded(address indexed updater);
    event UpdaterRemoved(address indexed updater);
    event StalePriceAgeUpdated(uint256 newAge);
    
    /**
     * @dev Constructor sets the message sender as an updater
     */
    constructor() public {
        updaters[msg.sender] = true;
        emit UpdaterAdded(msg.sender);
    }
    
    /**
     * @dev Add an address authorized to update prices
     */
    function addUpdater(address _updater) external onlyOwner {
        updaters[_updater] = true;
        emit UpdaterAdded(_updater);
    }
    
    /**
     * @dev Remove an address from authorized updaters
     */
    function removeUpdater(address _updater) external onlyOwner {
        updaters[_updater] = false;
        emit UpdaterRemoved(_updater);
    }
    
    /**
     * @dev Update price for a single asset
     */
    function updatePrice(string calldata _symbol, uint256 _price) external {
        require(updaters[msg.sender], "Not authorized");
        prices[_symbol] = PriceData(_price, block.timestamp);
        emit PriceUpdated(_symbol, _price, block.timestamp);
    }
    
    /**
     * @dev Update prices for multiple assets in a single transaction
     */
    function updatePrices(string[] calldata _symbols, uint256[] calldata _prices) external {
        require(updaters[msg.sender], "Not authorized");
        require(_symbols.length == _prices.length, "Array length mismatch");
        
        for (uint i = 0; i < _symbols.length; i++) {
            prices[_symbols[i]] = PriceData(_prices[i], block.timestamp);
            emit PriceUpdated(_symbols[i], _prices[i], block.timestamp);
        }
    }
    
    /**
     * @dev Get latest price for an asset
     * @return price, timestamp
     */
    function getPrice(string calldata _symbol) external view returns (uint256, uint256) {
        PriceData memory data = prices[_symbol];
        return (data.price, data.timestamp);
    }
    
    /**
     * @dev Get latest price for an asset (simplified version)
     * @return price
     */
    function getLatestPrice(string calldata _symbol) external view returns (uint256) {
        return prices[_symbol].price;
    }
    
    /**
     * @dev Get latest price for an asset with freshness check
     * @return price, isFresh (true if price is not stale)
     */
    function getVerifiedPrice(string calldata _symbol) external view returns (uint256, bool) {
        PriceData memory data = prices[_symbol];
        bool isFresh = (block.timestamp - data.timestamp) <= stalePriceAge;
        return (data.price, isFresh);
    }
    
    /**
     * @dev Set the maximum age for price data before it's considered stale
     */
    function setStalePriceAge(uint256 _newAge) external onlyOwner {
        stalePriceAge = _newAge;
        emit StalePriceAgeUpdated(_newAge);
    }
} 