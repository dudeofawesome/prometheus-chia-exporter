export interface ChiaGetConnections {
  connections: {
    bytes_read: number;
    bytes_written: number;
    /** seconds since epoch */
    creation_time: number;
    /** seconds since epoch */
    last_message_time: number;
    local_port: number;
    node_id: string;
    peak_hash: null;
    peak_height: null;
    peak_weight: null;
    /** IPv4 address */
    peer_host: string;
    peer_port: number;
    peer_server_port: number;
    type: number;
  }[];
  success: true;
}
