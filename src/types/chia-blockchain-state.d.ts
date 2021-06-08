export interface ChiaBlockChainState {
  blockchain_state: {
    difficulty: number;
    genesis_challenge_initialized: boolean;
    mempool_size: number;
    peak: {
      challenge_block_info_hash: string;
      challenge_vdf_output: {
        data: string;
      };
      deficit: number;
      farmer_puzzle_hash: string;
      fees: number;
      finished_challenge_slot_hashes?: string;
      finished_infused_challenge_slot_hashes?: string;
      finished_reward_slot_hashes?: string;
      header_hash: string;
      height: number;
      infused_challenge_vdf_output: {
        data: string;
      };
      overflow: boolean;
      pool_puzzle_hash: string;
      prev_hash: string;
      prev_transaction_block_hash: string;
      prev_transaction_block_height: number;
      required_iters: number;
      reward_claims_incorporated: {
        amount: number;
        parent_coin_info: string;
        puzzle_hash: string;
      }[];
      reward_infusion_new_challenge: string;
      signage_point_index: number;
      sub_epoch_summary_included?: boolean;
      sub_slot_iters: number;
      timestamp: number;
      total_iters: number;
      weight: number;
    };
    space: number;
    sub_slot_iters: number;
    sync: {
      sync_mode: boolean;
      sync_progress_height: number;
      sync_tip_height: number;
      synced: boolean;
    };
  };
  success: boolean;
}
