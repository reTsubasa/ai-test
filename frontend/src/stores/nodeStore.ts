import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NodeStatus = 'online' | 'offline' | 'degraded' | 'maintenance';

export type NodeType = 'router' | 'switch' | 'firewall' | 'load-balancer' | 'other';

export interface NodeHealthMetric {
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  timestamp: Date;
}

export interface Node {
  id: string;
  name: string;
  hostname: string;
  ipAddress: string;
  port: number;
  type: NodeType;
  status: NodeStatus;
  version: string;
  description?: string;
  location?: string;
  tags: string[];
  healthMetrics: NodeHealthMetric[];
  lastConnected: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestConnectionResult {
  success: boolean;
  latency?: number;
  error?: string;
}

interface NodeState {
  // State
  nodes: Node[];
  selectedNodeId: string | null;
  isLoading: boolean;
  isConnecting: boolean;
  connectionError: string | null;

  // Actions
  setNodes: (nodes: Node[]) => void;
  addNode: (node: Node) => void;
  updateNode: (id: string, node: Partial<Node>) => void;
  removeNode: (id: string) => void;
  setSelectedNode: (id: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  setConnecting: (isConnecting: boolean) => void;
  setConnectionError: (error: string | null) => void;

  // Computed
  getSelectedNode: () => Node | null;
  getNodesByStatus: (status: NodeStatus) => Node[];
  getNodesByType: (type: NodeType) => Node[];
  getOnlineNodes: () => Node[];
  getOfflineNodes: () => Node[];
}

export const useNodeStore = create<NodeState>()(
  persist(
    (set, get) => ({
      // Initial state
      nodes: [],
      selectedNodeId: null,
      isLoading: false,
      isConnecting: false,
      connectionError: null,

      // Actions
      setNodes: (nodes) => set({ nodes }),

      addNode: (node) =>
        set((state) => ({
          nodes: [...state.nodes, node],
        })),

      updateNode: (id, updatedNode) =>
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === id ? { ...node, ...updatedNode, updatedAt: new Date() } : node,
          ),
        })),

      removeNode: (id) =>
        set((state) => ({
          nodes: state.nodes.filter((node) => node.id !== id),
          selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
        })),

      setSelectedNode: (id) => set({ selectedNodeId: id }),

      setLoading: (isLoading) => set({ isLoading }),

      setConnecting: (isConnecting) => set({ isConnecting }),

      setConnectionError: (error) => set({ connectionError: error }),

      // Computed
      getSelectedNode: () => {
        const { nodes, selectedNodeId } = get();
        return nodes.find((node) => node.id === selectedNodeId) || null;
      },

      getNodesByStatus: (status) => {
        const { nodes } = get();
        return nodes.filter((node) => node.status === status);
      },

      getNodesByType: (type) => {
        const { nodes } = get();
        return nodes.filter((node) => node.type === type);
      },

      getOnlineNodes: () => {
        const { nodes } = get();
        return nodes.filter((node) => node.status === 'online');
      },

      getOfflineNodes: () => {
        const { nodes } = get();
        return nodes.filter((node) => node.status === 'offline');
      },
    }),
    {
      name: 'node-storage',
      partialize: (state) => ({
        nodes: state.nodes,
        selectedNodeId: state.selectedNodeId,
      }),
    },
  ),
);