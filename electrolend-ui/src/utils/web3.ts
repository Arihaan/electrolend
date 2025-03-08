"use client";

// Add type declaration for ethereum property on window object
declare global {
  interface Window {
    ethereum: any;
  }
}

import { ethers } from 'ethers'

// Contract ABIs
const simpleLendingABI = [
  "function deposits(address user, address token) external view returns (uint256)",
  "function deposit(address token, uint256 amount) external",
  "function withdraw(address token, uint256 amount) external",
  "function borrow(address token, uint256 amount) external",
  "function repay(address token, uint256 amount) external",
  "function getUserAccountInfo(address user) external view returns (uint256 collateralValue, uint256 borrowValue, uint256 borrowLimit)",
  "function canBorrow(address user, address token, uint256 amount) external view returns (bool)"
]

const erc20ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)"
]

// Contract addresses - replace with actual deployed addresses
export const CONTRACT_ADDRESSES = {
  LENDING_CONTRACT: '0x09308a46cb03915a530Cf4365078a3688ec90682', // SimpleLending deployed address
  ETN_TOKEN: '0x154c9fD7F006b92b6afa746098d8081A831DC1FC',
  USDC_TOKEN: '0x9a110A3Ecc8704e93Bd4FA1bA44D5CF93327202B',
  USDT_TOKEN: '0x02FeC8c559fB598762df8D033bD7A3Df9b374771'
}

// Setup provider
let provider: ethers.providers.Web3Provider | null = null
let lendingContract: ethers.Contract | null = null
let signer: ethers.Signer | null = null

// Initialize provider and contracts
export async function initializeWeb3() {
  if (typeof window === 'undefined') {
    throw new Error('Cannot connect wallet in server-side environment');
  }
  
  if (!window.ethereum) {
    throw new Error('No Ethereum provider found. Please install MetaMask or another Ethereum wallet.');
  }
  
  try {
    // Connect to the provider
    provider = new ethers.providers.Web3Provider(window.ethereum);
    
    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    // Check if we're on the correct network (Electroneum Testnet)
    const network = await provider.getNetwork();
    const electroneumTestnetId = 5201420; // Electroneum Testnet Chain ID
    
    if (network.chainId !== electroneumTestnetId) {
      // Prompt user to switch networks
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x4F5CCC' }], // '0x4F5CCC' is hex for 5201420
        });
        
        // Refresh provider after network switch
        provider = new ethers.providers.Web3Provider(window.ethereum);
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x4F5CCC',
                chainName: 'Electroneum Testnet',
                nativeCurrency: {
                  name: 'Electroneum',
                  symbol: 'ETN',
                  decimals: 18
                },
                rpcUrls: ['https://rpc.ankr.com/electroneum_testnet'],
                blockExplorerUrls: ['https://testnet.explorer.electroneum.com/']
              }]
            });
            
            // Try switching again after adding
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x4F5CCC' }],
            });
            
            // Refresh provider after network switch
            provider = new ethers.providers.Web3Provider(window.ethereum);
          } catch (addError) {
            throw new Error('Failed to add Electroneum Testnet to your wallet. Please add it manually.');
          }
        } else {
          throw new Error('Failed to switch to Electroneum Testnet. Please switch networks manually.');
        }
      }
    }
    
    // Get the signer
    signer = provider.getSigner();
    
    // Initialize lending contract
    lendingContract = new ethers.Contract(
      CONTRACT_ADDRESSES.LENDING_CONTRACT,
      simpleLendingABI,
      signer
    );
    
    return {
      provider,
      signer,
      lendingContract
    };
  } catch (error: any) {
    console.error('Error initializing web3:', error);
    throw new Error(error.message || 'Failed to connect wallet. Please try again.');
  }
}

// Utility function to get token contract
export function getTokenContract(tokenAddress: string) {
  if (!signer) {
    throw new Error('Web3 not initialized. Call initializeWeb3 first.')
  }
  
  return new ethers.Contract(tokenAddress, erc20ABI, signer)
}

// Get user account
export async function getUserAccount() {
  if (!provider) {
    throw new Error('Web3 not initialized. Call initializeWeb3 first.')
  }
  
  const accounts = await provider.listAccounts()
  return accounts[0]
}

// Get user token balance
export async function getTokenBalance(tokenAddress: string) {
  const account = await getUserAccount()
  const tokenContract = getTokenContract(tokenAddress)
  
  const balance = await tokenContract.balanceOf(account)
  const decimals = await tokenContract.decimals()
  
  return ethers.utils.formatUnits(balance, decimals)
}

// Approve token spending
export async function approveToken(tokenAddress: string, amount: string) {
  const tokenContract = getTokenContract(tokenAddress)
  const decimals = await tokenContract.decimals()
  const parsedAmount = ethers.utils.parseUnits(amount, decimals)
  
  const tx = await tokenContract.approve(
    CONTRACT_ADDRESSES.LENDING_CONTRACT,
    parsedAmount,
    {
      gasLimit: 300000,
      gasPrice: ethers.utils.parseUnits('50', 'gwei')
    }
  )
  
  return tx.wait()
}

// Deposit token
export async function depositToken(tokenAddress: string, amount: string) {
  if (!lendingContract) {
    throw new Error('Web3 not initialized. Call initializeWeb3 first.')
  }
  
  const tokenContract = getTokenContract(tokenAddress)
  const decimals = await tokenContract.decimals()
  const parsedAmount = ethers.utils.parseUnits(amount, decimals)
  
  // Check allowance and approve if needed
  const account = await getUserAccount()
  const allowance = await tokenContract.allowance(account, CONTRACT_ADDRESSES.LENDING_CONTRACT)
  
  if (allowance.lt(parsedAmount)) {
    await approveToken(tokenAddress, amount)
  }
  
  const tx = await lendingContract.deposit(
    tokenAddress,
    parsedAmount,
    {
      gasLimit: 500000,
      gasPrice: ethers.utils.parseUnits('50', 'gwei')
    }
  )
  
  return tx.wait()
}

// Withdraw token
export async function withdrawToken(tokenAddress: string, amount: string) {
  if (!lendingContract) {
    throw new Error('Web3 not initialized. Call initializeWeb3 first.')
  }
  
  const tokenContract = getTokenContract(tokenAddress)
  const decimals = await tokenContract.decimals()
  const parsedAmount = ethers.utils.parseUnits(amount, decimals)
  
  const tx = await lendingContract.withdraw(
    tokenAddress,
    parsedAmount,
    {
      gasLimit: 500000,
      gasPrice: ethers.utils.parseUnits('50', 'gwei')
    }
  )
  
  return tx.wait()
}

// Borrow token
export async function borrowToken(tokenAddress: string, amount: string) {
  if (!lendingContract) {
    throw new Error('Web3 not initialized. Call initializeWeb3 first.')
  }
  
  const tokenContract = getTokenContract(tokenAddress)
  const decimals = await tokenContract.decimals()
  const parsedAmount = ethers.utils.parseUnits(amount, decimals)
  
  const tx = await lendingContract.borrow(
    tokenAddress,
    parsedAmount,
    {
      gasLimit: 500000,
      gasPrice: ethers.utils.parseUnits('50', 'gwei')
    }
  )
  
  return tx.wait()
}

// Repay token
export async function repayToken(tokenAddress: string, amount: string) {
  if (!lendingContract) {
    throw new Error('Web3 not initialized. Call initializeWeb3 first.')
  }
  
  const tokenContract = getTokenContract(tokenAddress)
  const decimals = await tokenContract.decimals()
  const parsedAmount = ethers.utils.parseUnits(amount, decimals)
  
  // Check allowance and approve if needed
  const account = await getUserAccount()
  const allowance = await tokenContract.allowance(account, CONTRACT_ADDRESSES.LENDING_CONTRACT)
  
  if (allowance.lt(parsedAmount)) {
    await approveToken(tokenAddress, amount)
  }
  
  const tx = await lendingContract.repay(
    tokenAddress,
    parsedAmount,
    {
      gasLimit: 500000,
      gasPrice: ethers.utils.parseUnits('50', 'gwei')
    }
  )
  
  return tx.wait()
}

// Get user account information
export async function getUserAccountInfo() {
  if (!lendingContract) {
    throw new Error('Web3 not initialized. Call initializeWeb3 first.')
  }
  
  const account = await getUserAccount()
  const [collateralValue, borrowValue, borrowLimit] = await lendingContract.getUserAccountInfo(account)
  
  return {
    collateralValue: ethers.utils.formatUnits(collateralValue, 18),
    borrowValue: ethers.utils.formatUnits(borrowValue, 18),
    borrowLimit: ethers.utils.formatUnits(borrowLimit, 18),
    healthFactor: borrowValue.gt(0) 
      ? ethers.utils.formatUnits(borrowLimit.mul(100).div(borrowValue), 2)
      : 'Infinity',
  }
}

// Get user deposits
export async function getUserDeposits(tokenAddress: string) {
  if (!lendingContract) {
    throw new Error('Web3 not initialized. Call initializeWeb3 first.')
  }
  
  const account = await getUserAccount()
  const deposits = await lendingContract.deposits(account, tokenAddress)
  
  const tokenContract = getTokenContract(tokenAddress)
  const decimals = await tokenContract.decimals()
  
  return ethers.utils.formatUnits(deposits, decimals)
} 