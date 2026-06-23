import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { NodeStatus, type HostNode } from '@alexion/shared';
import { SupabaseService } from '../supabase/supabase.service';

interface NodeRow {
  id: string;
  name: string;
  region: string;
  agent_base_url: string;
  status: string;
  public_host: string;
  capacity_memory_mb: number;
  allocated_memory_mb: number;
  created_at: string;
  updated_at: string;
}

function toNode(row: NodeRow): HostNode {
  return {
    id: row.id,
    name: row.name,
    region: row.region,
    agentBaseUrl: row.agent_base_url,
    status: (row.status as HostNode['status']) ?? NodeStatus.OFFLINE,
    publicHost: row.public_host,
    capacityMemoryMb: row.capacity_memory_mb,
    allocatedMemoryMb: row.allocated_memory_mb,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

@Injectable()
export class NodesService {
  constructor(private readonly supabase: SupabaseService) {}

  async list(): Promise<HostNode[]> {
    const { data, error } = await this.supabase.db
      .from('nodes')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) {
      throw new Error(error.message);
    }
    return (data as NodeRow[]).map(toNode);
  }

  async findById(id: string): Promise<HostNode> {
    const { data, error } = await this.supabase.db
      .from('nodes')
      .select('*')
      .eq('id', id)
      .maybeSingle<NodeRow>();
    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      throw new NotFoundException(`Node ${id} not found`);
    }
    return toNode(data);
  }

  /**
   * Picks an online node with enough free memory for the requested server.
   * Strategy: least-loaded-first among nodes that fit.
   */
  async pickNode(requiredMemoryMb: number, preferredNodeId?: string): Promise<HostNode> {
    if (preferredNodeId) {
      const node = await this.findById(preferredNodeId);
      this.assertFits(node, requiredMemoryMb);
      return node;
    }

    const nodes = await this.list();
    const candidates = nodes
      .filter((node) => node.status === NodeStatus.ONLINE)
      .filter((node) => node.capacityMemoryMb - node.allocatedMemoryMb >= requiredMemoryMb)
      .sort((a, b) => a.allocatedMemoryMb - b.allocatedMemoryMb);

    const chosen = candidates[0];
    if (!chosen) {
      throw new ServiceUnavailableException(
        'No node currently has capacity for this server. Try again later.',
      );
    }
    return chosen;
  }

  /** Adjusts a node's allocated-memory accounting after (de)provisioning. */
  async adjustAllocation(nodeId: string, deltaMb: number): Promise<void> {
    const node = await this.findById(nodeId);
    const next = Math.max(0, node.allocatedMemoryMb + deltaMb);
    const { error } = await this.supabase.db
      .from('nodes')
      .update({ allocated_memory_mb: next, updated_at: new Date().toISOString() })
      .eq('id', nodeId);
    if (error) {
      throw new Error(error.message);
    }
  }

  private assertFits(node: HostNode, requiredMemoryMb: number): void {
    if (node.status !== NodeStatus.ONLINE) {
      throw new ServiceUnavailableException(`Node ${node.name} is not online`);
    }
    if (node.capacityMemoryMb - node.allocatedMemoryMb < requiredMemoryMb) {
      throw new ServiceUnavailableException(`Node ${node.name} has insufficient capacity`);
    }
  }
}
