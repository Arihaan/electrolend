// Market data and assets types

export interface MarketAsset {
  asset: string;
  symbol: string;
  logoSrc: string;
  full_name?: string;
  depositAPY: string;
  borrowAPY: string | {
    variable: string;
    stable: string;
  };
  totalSupplied: string;
  totalBorrowed: string;
  liquidity: string;
  price: string;
  canBeCollateral?: boolean;
  ltv?: number;
  utilizationRate?: number;
  change: string;
  trending?: 'up' | 'down' | 'neutral';
}

export interface UserPosition {
  netWorth: string;
  supplied: {
    total: string;
    assets: UserAsset[];
  };
  borrowed: {
    total: string;
    assets: UserAsset[];
  };
  healthFactor: string;
}

export interface UserAsset {
  asset: string;
  symbol: string;
  amount: string;
  value: string;
  apy: string;
  isCollateral?: boolean;
}

export interface AccountInfo {
  collateralValue: string;
  borrowValue: string;
  healthFactor: string;
}

// Action types
export type AssetAction = 'supply' | 'withdraw' | 'borrow' | 'repay';

export interface ModalState {
  isOpen: boolean;
  action: AssetAction | null;
  asset: MarketAsset | UserAsset | null;
  market?: MarketAsset | null;
}

// Component props
export interface AssetActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: AssetAction | null;
  asset: MarketAsset | UserAsset | null;
  onConfirm: (asset: UserAsset | MarketAsset, amount: string) => Promise<void>;
  isLoading?: boolean;
}

export interface MarketActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: AssetAction | null;
  market: MarketAsset | null;
  onConfirm: (market: MarketAsset, amount: string) => Promise<void>;
  isLoading?: boolean;
} 