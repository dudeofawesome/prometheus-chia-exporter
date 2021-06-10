export interface ChiaWallets {
  wallets: {
    data: string;
    id: number;
    name: string;
    type: number;
  }[];
  success: true;
}

export interface ChiaWalletFarmedAmount {
  farmed_amount: number;
  farmer_reward_amount: number;
  fee_amount: number;
  last_height_farmed: number;
  pool_reward_amount: number;
  success: true;
}

export interface ChiaWalletSyncStatus {
  genesis_initialized: boolean;
  synced: boolean;
  syncing: boolean;
  success: true;
}

export interface ChiaWalletTransactionCount {
  count: number;
  wallet_id: number;
  success: true;
}
