// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.6.12;

import {ElectroOwnable} from '../../dependencies/ElectroOwnable.sol';
import {ILendingPoolAddressesProviderRegistry} from '../../interfaces/ILendingPoolAddressesProviderRegistry.sol';
import {Errors} from '../libraries/helpers/Errors.sol';
import {Initializable} from '../../dependencies/openzeppelin/upgradeability/Initializable.sol';

/**
 * @title LendingPoolAddressesProviderRegistry
 * @notice provides the interface to register and retrieve lending pool addresses providers
 * @author ElectroLend
 **/
contract LendingPoolAddressesProviderRegistry is
  ILendingPoolAddressesProviderRegistry,
  ElectroOwnable,
  Initializable
{
  mapping(address => uint256) private _addressesProviders;
  address[] private _addressesProvidersList;

  constructor(address initialOwner) public ElectroOwnable(initialOwner) {}

  /**
   * @dev Returns the list of registered addresses provider
   * @return The list of addresses provider, potentially containing address(0) elements
   **/
  function getAddressesProvidersList() external view override returns (address[] memory) {
    address[] memory addressesProvidersList = _addressesProvidersList;

    uint256 maxLength = addressesProvidersList.length;

    address[] memory activeProviders = new address[](maxLength);

    for (uint256 i = 0; i < maxLength; i++) {
      if (_addressesProviders[addressesProvidersList[i]] > 0) {
        activeProviders[i] = addressesProvidersList[i];
      }
    }

    return activeProviders;
  }

  /**
   * @dev Registers an addresses provider
   * @param provider The address of the new LendingPoolAddressesProvider
   * @param id The id for the new LendingPoolAddressesProvider, referring to the market it belongs to
   **/
  function registerAddressesProvider(address provider, uint256 id) external override onlyOwner {
    require(id != 0, Errors.LPAPR_INVALID_ADDRESSES_PROVIDER_ID);

    _addressesProviders[provider] = id;
    _addToAddressesProvidersList(provider);
    emit AddressesProviderRegistered(provider);
  }

  /**
   * @dev Removes a LendingPoolAddressesProvider from the list of registered addresses provider
   * @param provider The LendingPoolAddressesProvider address
   **/
  function unregisterAddressesProvider(address provider) external override onlyOwner {
    require(_addressesProviders[provider] > 0, Errors.LPAPR_PROVIDER_NOT_REGISTERED);
    _addressesProviders[provider] = 0;
    emit AddressesProviderUnregistered(provider);
  }

  /**
   * @dev Returns the id on a registered LendingPoolAddressesProvider
   * @return The id or 0 if the LendingPoolAddressesProvider is not registered
   */
  function getAddressesProviderIdByAddress(
    address addressesProvider
  ) external view override returns (uint256) {
    return _addressesProviders[addressesProvider];
  }

  function _addToAddressesProvidersList(address provider) internal {
    uint256 providersCount = _addressesProvidersList.length;

    for (uint256 i = 0; i < providersCount; i++) {
      if (_addressesProvidersList[i] == provider) {
        return;
      }
    }

    _addressesProvidersList.push(provider);
  }
}
