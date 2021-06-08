export interface ChiaSignagePoints {
  signage_points: {
    proofs: any[];
    signage_point: {
      challenge_chain_sp: string;
      challenge_hash: string;
      difficulty: number;
      reward_chain_sp: string;
      signage_point_index: number;
      sub_slot_iters: number;
    };
  }[];
  success: true;
}
