import { ethers } from 'ethers';

// Contract Addresses
export const LENDING_ADDRESS = '0x09308a46cb03915a530Cf4365078a3688ec90682';
export const WETN_ADDRESS = '0x154c9fD7F006b92b6afa746098d8081A831DC1FC';
export const USDC_ADDRESS = '0x9a110A3Ecc8704e93Bd4FA1bA44D5CF93327202B';
export const USDT_ADDRESS = '0x02FeC8c559fB598762df8D033bD7A3Df9b374771';

// Token prices for manual conversion (when contract price feed is not available)
export const TOKEN_PRICES: { [key: string]: number } = {
  'WETN': 0.00216, // $0.00216 per WETN
  'USDC': 1,       // $1 per USDC
  'USDT': 1        // $1 per USDT
};

// ABIs - These are simplified, include only necessary functions
export const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function decimals() external view returns (uint8)"
];

export const LENDING_ABI = [
  "function deposits(address user, address token) external view returns (uint256)",
  "function borrows(address user, address token) external view returns (uint256)",
  "function deposit(address token, uint256 amount) external",
  "function withdraw(address token, uint256 amount) external",
  "function borrow(address token, uint256 amount) external",
  "function repay(address token, uint256 amount) external",
  "function getUserAccountInfo(address user) external view returns (uint256 collateralValue, uint256 borrowValue, uint256 borrowLimit)"
];

// Transaction configuration
const TX_PARAMS = {
  gasLimit: 3000000,
  gasPrice: ethers.utils.parseUnits('100', 'gwei')
};

export interface UserAccountInfo {
  collateralValue: string;
  borrowValue: string;
  borrowLimit: string;
  healthFactor: string;
}

export interface TokenInfo {
  symbol: string;
  balance: string;
  deposited: string;
  borrowed: string;
}

export interface TokenMap {
  [symbol: string]: TokenInfo;
}

export const getTokenAddress = (symbol: string): string => {
  switch (symbol.toUpperCase()) {
    case 'WETN': return WETN_ADDRESS;
    case 'USDC': return USDC_ADDRESS;
    case 'USDT': return USDT_ADDRESS;
    case 'LENDING': return LENDING_ADDRESS;
    default: throw new Error(`Unsupported token: ${symbol}`);
  }
};

// Get token symbol from address
export const getTokenSymbol = (address: string): string => {
  // Normalize addresses to lowercase for comparison
  const normalizedAddress = address.toLowerCase();
  const normalizedWETN = WETN_ADDRESS.toLowerCase();
  const normalizedUSDC = USDC_ADDRESS.toLowerCase();
  const normalizedUSDT = USDT_ADDRESS.toLowerCase();
  
  if (normalizedAddress === normalizedWETN) return 'WETN';
  if (normalizedAddress === normalizedUSDC) return 'USDC';
  if (normalizedAddress === normalizedUSDT) return 'USDT';
  
  throw new Error(`Unknown token address: ${address}`);
};

// Get signer and provider from wallet
export const getSigner = async () => {
  if (!window.ethereum) {
    throw new Error("No Ethereum wallet detected");
  }
  
  await window.ethereum.request({ method: 'eth_requestAccounts' });
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  return provider.getSigner();
};

// Get token decimals
export const getTokenDecimals = async (tokenAddress: string): Promise<number> => {
  try {
    const signer = await getSigner();
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    return await tokenContract.decimals();
  } catch (error) {
    console.error("Error getting token decimals:", error);
    return 18; // Default to 18 if we can't determine
  }
};

// Format amount with proper decimals
export const formatAmount = async (amount: string, tokenAddress: string): Promise<string> => {
  const decimals = await getTokenDecimals(tokenAddress);
  return ethers.utils.parseUnits(amount, decimals).toString();
};

// Approve token spending
export const approveToken = async (tokenAddress: string, amount: string): Promise<boolean> => {
  try {
    const signer = await getSigner();
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    
    // Format amount with proper decimals
    const decimals = await tokenContract.decimals();
    const formattedAmount = ethers.utils.parseUnits(amount, decimals);
    
    // Check if already approved
    const signerAddress = await signer.getAddress();
    const allowance = await tokenContract.allowance(signerAddress, LENDING_ADDRESS);
    
    if (allowance.gte(formattedAmount)) {
      console.log("Already approved");
      return true;
    }
    
    // Send approval transaction
    const tx = await tokenContract.approve(LENDING_ADDRESS, formattedAmount, TX_PARAMS);
    console.log(`Approval transaction sent: ${tx.hash}`);
    
    // Wait for transaction confirmation
    await tx.wait();
    console.log("Token approved successfully");
    return true;
  } catch (error) {
    console.error("Error approving token:", error);
    return false;
  }
};

// Deposit tokens
export const depositToken = async (tokenAddress: string, amount: string): Promise<boolean> => {
  try {
    // First approve the tokens
    const approved = await approveToken(tokenAddress, amount);
    if (!approved) return false;
    
    const signer = await getSigner();
    const lendingContract = new ethers.Contract(LENDING_ADDRESS, LENDING_ABI, signer);
    
    // Format amount with proper decimals
    const decimals = await getTokenDecimals(tokenAddress);
    const formattedAmount = ethers.utils.parseUnits(amount, decimals);
    
    // Send deposit transaction
    const tx = await lendingContract.deposit(tokenAddress, formattedAmount, TX_PARAMS);
    console.log(`Deposit transaction sent: ${tx.hash}`);
    
    // Wait for transaction confirmation
    await tx.wait();
    console.log("Tokens deposited successfully");
    return true;
  } catch (error) {
    console.error("Error depositing token:", error);
    return false;
  }
};

// Withdraw tokens
export const withdrawToken = async (tokenAddress: string, amount: string): Promise<boolean> => {
  try {
    const signer = await getSigner();
    const lendingContract = new ethers.Contract(LENDING_ADDRESS, LENDING_ABI, signer);
    
    // Format amount with proper decimals
    const decimals = await getTokenDecimals(tokenAddress);
    const formattedAmount = ethers.utils.parseUnits(amount, decimals);
    
    // Send withdraw transaction
    const tx = await lendingContract.withdraw(tokenAddress, formattedAmount, TX_PARAMS);
    console.log(`Withdraw transaction sent: ${tx.hash}`);
    
    // Wait for transaction confirmation
    await tx.wait();
    console.log("Tokens withdrawn successfully");
    return true;
  } catch (error) {
    console.error("Error withdrawing token:", error);
    return false;
  }
};

// Borrow tokens
export const borrowToken = async (tokenAddress: string, amount: string): Promise<boolean> => {
  try {
    const signer = await getSigner();
    const lendingContract = new ethers.Contract(LENDING_ADDRESS, LENDING_ABI, signer);
    
    // Format amount with proper decimals
    const decimals = await getTokenDecimals(tokenAddress);
    const formattedAmount = ethers.utils.parseUnits(amount, decimals);
    
    // Send borrow transaction
    const tx = await lendingContract.borrow(tokenAddress, formattedAmount, TX_PARAMS);
    console.log(`Borrow transaction sent: ${tx.hash}`);
    
    // Wait for transaction confirmation
    await tx.wait();
    console.log("Tokens borrowed successfully");
    return true;
  } catch (error) {
    console.error("Error borrowing token:", error);
    return false;
  }
};

// Repay tokens
export const repayToken = async (tokenAddress: string, amount: string): Promise<boolean> => {
  try {
    // First approve the tokens
    const approved = await approveToken(tokenAddress, amount);
    if (!approved) return false;
    
    const signer = await getSigner();
    const lendingContract = new ethers.Contract(LENDING_ADDRESS, LENDING_ABI, signer);
    
    // Format amount with proper decimals
    const decimals = await getTokenDecimals(tokenAddress);
    const formattedAmount = ethers.utils.parseUnits(amount, decimals);
    
    // Send repay transaction
    const tx = await lendingContract.repay(tokenAddress, formattedAmount, TX_PARAMS);
    console.log(`Repay transaction sent: ${tx.hash}`);
    
    // Wait for transaction confirmation
    await tx.wait();
    console.log("Tokens repaid successfully");
    return true;
  } catch (error) {
    console.error("Error repaying token:", error);
    return false;
  }
};

// Get token balance
export const getTokenBalance = async (tokenAddress: string): Promise<string> => {
  try {
    const signer = await getSigner();
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const userAddress = await signer.getAddress();
    
    const balance = await tokenContract.balanceOf(userAddress);
    const decimals = await tokenContract.decimals();
    
    return ethers.utils.formatUnits(balance, decimals);
  } catch (error) {
    console.error("Error getting token balance:", error);
    return "0";
  }
};

// Get deposited amount for a token
export const getDepositedAmount = async (tokenAddress: string): Promise<string> => {
  try {
    const signer = await getSigner();
    const lendingContract = new ethers.Contract(LENDING_ADDRESS, LENDING_ABI, signer);
    const userAddress = await signer.getAddress();
    
    const deposited = await lendingContract.deposits(userAddress, tokenAddress);
    const decimals = await getTokenDecimals(tokenAddress);
    
    return ethers.utils.formatUnits(deposited, decimals);
  } catch (error) {
    console.error("Error getting deposited amount:", error);
    return "0";
  }
};

// Get borrowed amount for a token
export const getBorrowedAmount = async (tokenAddress: string): Promise<string> => {
  try {
    const signer = await getSigner();
    const lendingContract = new ethers.Contract(LENDING_ADDRESS, LENDING_ABI, signer);
    const userAddress = await signer.getAddress();
    
    const borrowed = await lendingContract.borrows(userAddress, tokenAddress);
    const decimals = await getTokenDecimals(tokenAddress);
    
    return ethers.utils.formatUnits(borrowed, decimals);
  } catch (error) {
    console.error("Error getting borrowed amount:", error);
    return "0";
  }
};

// Get token price in USD
export const getTokenPrice = (symbol: string): number => {
  const tokenSymbol = symbol.toUpperCase();
  if (TOKEN_PRICES[tokenSymbol] !== undefined) {
    console.log(`Getting price for ${tokenSymbol}: ${TOKEN_PRICES[tokenSymbol]}`);
    return TOKEN_PRICES[tokenSymbol];
  }
  console.error(`Price not available for token: ${symbol}`);
  throw new Error(`Price not available for token: ${symbol}`);
};

// Convert token amount to USD value
export const convertToUSD = (amount: string, symbol: string): string => {
  try {
    const price = getTokenPrice(symbol);
    const parsedAmount = parseFloat(amount || '0');
    if (isNaN(parsedAmount)) {
      return '0.00';
    }
    const value = parsedAmount * price;
    console.log(`Converting ${amount} ${symbol} to USD: $${value.toFixed(2)}`);
    return value.toFixed(2);
  } catch (error) {
    console.error(`Error converting ${amount} ${symbol} to USD:`, error);
    return '0.00';
  }
};

// Get user account information (health factor, etc.)
export const getUserAccountInfo = async (): Promise<UserAccountInfo> => {
  try {
    const signer = await getSigner();
    const lendingContract = new ethers.Contract(LENDING_ADDRESS, LENDING_ABI, signer);
    const userAddress = await signer.getAddress();
    
    const [collateralValue, borrowValue, borrowLimit] = await lendingContract.getUserAccountInfo(userAddress);
    
    // Convert to human-readable format (values are scaled by 10^8 in the contract)
    const collateralValueFormatted = ethers.utils.formatUnits(collateralValue, 8);
    const borrowValueFormatted = ethers.utils.formatUnits(borrowValue, 8);
    const borrowLimitFormatted = ethers.utils.formatUnits(borrowLimit, 8);
    
    // Calculate health factor (if borrowValue is 0, health factor is infinity)
    let healthFactor = "∞";
    if (!borrowValue.isZero()) {
      // Health factor = collateralValue / borrowValue
      const healthFactorBN = collateralValue.mul(ethers.BigNumber.from(100)).div(borrowValue);
      healthFactor = (healthFactorBN.toNumber() / 100).toFixed(2);
    }
    
    return {
      collateralValue: collateralValueFormatted,
      borrowValue: borrowValueFormatted,
      borrowLimit: borrowLimitFormatted,
      healthFactor
    };
  } catch (error) {
    console.error("Error getting user account info:", error);
    return {
      collateralValue: "0",
      borrowValue: "0",
      borrowLimit: "0",
      healthFactor: "0"
    };
  }
};

// Get all token information for the user
export const getAllTokenInfo = async (): Promise<TokenMap> => {
  const tokens = {
    'WETN': { address: WETN_ADDRESS, symbol: 'WETN' },
    'USDC': { address: USDC_ADDRESS, symbol: 'USDC' },
    'USDT': { address: USDT_ADDRESS, symbol: 'USDT' }
  };
  
  const tokenInfo: TokenMap = {};
  
  for (const [symbol, token] of Object.entries(tokens)) {
    const balance = await getTokenBalance(token.address);
    const deposited = await getDepositedAmount(token.address);
    const borrowed = await getBorrowedAmount(token.address);
    
    tokenInfo[symbol] = {
      symbol,
      balance,
      deposited,
      borrowed
    };
  }
  
  return tokenInfo;
}; 