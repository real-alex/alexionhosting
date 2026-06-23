/**
 * Node (host) domain model.
 *
 * A node is a physical/virtual host that runs the Alexion agent and hosts
 * customer game servers in Docker. The API talks to one agent per node.
 */

export const NodeStatus = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  DRAINING: 'draining',
} as const;
export type NodeStatus = (typeof NodeStatus)[keyof typeof NodeStatus];

export interface HostNode {
  id: string;
  name: string;
  /** Human-friendly region/location label, e.g. "eu-central". */
  region: string;
  /** Base URL the API uses to reach this node's agent. */
  agentBaseUrl: string;
  status: NodeStatus;
  /** Public host customers connect to for servers on this node. */
  publicHost: string;
  /** Total memory the node may allocate to game servers, in MB. */
  capacityMemoryMb: number;
  /** Currently allocated memory across servers on this node, in MB. */
  allocatedMemoryMb: number;
  createdAt: string;
  updatedAt: string;
}
