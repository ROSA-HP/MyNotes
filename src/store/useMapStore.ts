import { create } from 'zustand';
import {
  MindLexFlowNode,
  MindLexFlowEdge,
  MindLexNodeData,
  RelationType,
} from '../types/canvas';
import { MindMap, LanguageCode } from '../../shared';
import { layoutWithDagre } from '../utils/dagreLayout';

export type SaveStatus = 'Saving' | 'Saved' | 'Offline';

interface MapStateSnapshot {
  nodes: MindLexFlowNode[];
  edges: MindLexFlowEdge[];
}

interface MapStoreState {
  // Data
  map: MindMap | null;
  nodes: MindLexFlowNode[];
  edges: MindLexFlowEdge[];
  isLoading: boolean;
  saveStatus: SaveStatus;
  dismissedTitles: string[];

  // View settings & filtering
  viewMode: 'map' | 'outline';
  activeLangs: Set<LanguageCode>;
  theme: 'dark' | 'light';
  searchQuery: string;
  highlightedNodeId: string | null;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  focusedBranchIds: Set<string> | null;
  collapsedNodeIds: Set<string>;
  snapToGrid: boolean;

  // Page Panel (RemNote style)
  openNodePageId: string | null;
  isPageExpanded: boolean;

  // Node Bar Interactive Connect Mode
  isConnectingMode: boolean;
  connectingSourceId: string | null;

  // History (50 states)
  history: MapStateSnapshot[];
  future: MapStateSnapshot[];

  // Toast notifications
  toast: {
    message: string;
    actionLabel?: string;
    onAction?: () => void;
  } | null;

  // Actions
  loadMap: (mapId: string) => Promise<void>;
  saveMapDebounced: () => void;
  undo: () => void;
  redo: () => void;
  setNodes: (nodes: MindLexFlowNode[]) => void;
  setEdges: (edges: MindLexFlowEdge[]) => void;
  addNode: (node: MindLexFlowNode) => void;
  updateNodeData: (id: string, patch: Partial<MindLexNodeData>) => void;
  updateNodeBlocks: (id: string, blocks: any[]) => void;
  updateNodePosition: (id: string, pos: { x: number; y: number }, pinned?: boolean) => void;
  deleteNodes: (ids: string[]) => void;
  addEdge: (edge: MindLexFlowEdge) => void;
  updateEdge: (id: string, patch: Partial<MindLexFlowEdge>) => void;
  deleteEdge: (id: string) => void;
  reconnectEdge: (oldEdge: MindLexFlowEdge, newConnection: { source: string; target: string; sourceHandle?: string | null; targetHandle?: string | null }) => void;
  acceptSuggestedEdge: (edgeId: string) => void;
  rejectSuggestedEdge: (edgeId: string) => void;
  toggleCollapseBranch: (nodeId: string) => void;
  autoArrange: (unpinAll?: boolean) => void;
  setSearchQuery: (q: string) => void;
  selectNode: (id: string | null) => void;
  selectEdge: (id: string | null) => void;
  setFocusedBranch: (branchIds: Set<string> | null) => void;
  toggleLang: (lang: LanguageCode) => void;
  toggleTheme: () => void;
  toggleSnapToGrid: () => void;
  dismissToast: () => void;
  duplicateSelected: () => void;

  // New Phase 3 Actions
  setViewMode: (mode: 'map' | 'outline') => void;
  openPage: (nodeId: string, expand?: boolean) => void;
  closePage: () => void;
  togglePageExpanded: () => void;
  startConnecting: (sourceId: string) => void;
  finishConnecting: (targetId: string, kind?: 'hierarchy' | 'relation') => void;
  cancelConnecting: () => void;
  changeNodeParent: (nodeId: string, newParentId: string | null) => void;
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export const useMapStore = create<MapStoreState>((set, get) => ({
  map: null,
  nodes: [],
  edges: [],
  isLoading: false,
  saveStatus: 'Saved',
  dismissedTitles: [],

  viewMode: 'map',
  activeLangs: new Set(['en', 'ar', 'de']),
  theme: (typeof window !== 'undefined' && (localStorage.getItem('mindlex_theme') as any)) || 'dark',
  searchQuery: '',
  highlightedNodeId: null,
  selectedNodeId: null,
  selectedEdgeId: null,
  focusedBranchIds: null,
  collapsedNodeIds: new Set<string>(),
  snapToGrid: true,

  openNodePageId: null,
  isPageExpanded: false,
  isConnectingMode: false,
  connectingSourceId: null,

  history: [],
  future: [],
  toast: null,

  loadMap: async (mapId: string) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`/api/maps/${mapId}`);
      if (!res.ok) throw new Error('Failed to load map');
      const data = await res.json();

      const flowNodes: MindLexFlowNode[] = (data.nodes || []).map((n: any) => {
        const rawBlocks = n.blocks && Array.isArray(n.blocks) && n.blocks.length > 0 ? n.blocks : [];
        const initialBlocks = [...rawBlocks];
        if (initialBlocks.length === 0) {
          if (n.rows) {
            initialBlocks.push({
              id: `blk_v_${n.id}`,
              type: 'vocab',
              content: '',
              vocab: n.rows,
              isCard: true,
            });
          }
          if (n.content && n.content.trim()) {
            initialBlocks.push({
              id: `blk_c_${n.id}`,
              type: 'text',
              content: n.content,
            });
          } else if (n.summary && n.summary.trim()) {
            initialBlocks.push({
              id: `blk_s_${n.id}`,
              type: 'text',
              content: n.summary,
            });
          }
        }

        const cardsCount = initialBlocks.filter((b: any) => b.isCard).length || (n.rows ? 1 : 0);

        return {
          id: n.id,
          type: n.depth === 0 ? 'topic' : 'subtopic',
          position: n.position || { x: 100, y: 100 },
          data: {
            id: n.id,
            mapId: n.mapId,
            title: n.title,
            kind: n.kind,
            lang: n.lang,
            summary: n.summary,
            content: n.content,
            blocks: initialBlocks,
            rows: n.rows,
            flashcards: n.flashcards || [],
            tags: n.tags || [],
            parentId: n.parentId,
            childIds: n.childIds || [],
            depth: n.depth,
            order: n.order,
            pinned: false,
            blocksCount: initialBlocks.length,
            cardsCount,
            dueCount: 1,
          },
        };
      });

      // Build hierarchy edges from parentId
      const flowEdges: MindLexFlowEdge[] = [];
      const parentEdges = data.edges || [];
      for (const [source, target] of parentEdges) {
        const targetNode = flowNodes.find(n => n.id === target);
        flowEdges.push({
          id: `e_${source}_${target}`,
          source,
          target,
          type: 'hierarchy',
          data: {
            childLang: targetNode?.data.lang || 'de',
          },
        });
      }

      set({
        map: data.map,
        nodes: flowNodes,
        edges: flowEdges,
        isLoading: false,
        saveStatus: 'Saved',
        history: [],
        future: [],
      });
    } catch (err) {
      console.warn('Network error loading map from server, using local fallback:', err);
      set({ isLoading: false, saveStatus: 'Offline' });
    }
  },

  saveMapDebounced: () => {
    set({ saveStatus: 'Saving' });
    if (saveTimeout) clearTimeout(saveTimeout);

    saveTimeout = setTimeout(async () => {
      const state = get();
      if (!state.map) return;

      const nodesPayload = state.nodes.map(n => ({
        id: n.id,
        mapId: state.map!.id,
        title: n.data.title,
        kind: n.data.kind,
        lang: n.data.lang,
        summary: n.data.summary,
        content: n.data.content,
        rows: n.data.rows,
        flashcards: n.data.flashcards,
        tags: n.data.tags,
        parentId: n.data.parentId,
        childIds: n.data.childIds,
        depth: n.data.depth,
        order: n.data.order,
        position: n.position,
      }));

      try {
        const res = await fetch(`/api/maps/${state.map.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: state.map.title,
            description: state.map.description,
            streakDays: state.map.streakDays,
            xp: state.map.xp,
            activeLanguages: Array.from(state.activeLangs),
            version: state.map.version,
            nodes: nodesPayload,
          }),
        });

        if (res.status === 409) {
          // 409 Conflict detected!
          set({
            saveStatus: 'Offline',
            toast: {
              message: 'This map changed in another tab',
              actionLabel: 'Reload latest',
              onAction: () => get().loadMap(state.map!.id),
            },
          });
          return;
        }

        if (res.ok) {
          const result = await res.json();
          set({
            map: result.map,
            saveStatus: 'Saved',
          });
        } else {
          set({ saveStatus: 'Offline' });
        }
      } catch (err) {
        console.warn('Auto-save network error:', err);
        set({ saveStatus: 'Offline' });
      }
    }, 1000);
  },

  undo: () => {
    const { history, nodes, edges } = get();
    if (history.length === 0) return;

    const previous = history[history.length - 1];
    const newHistory = history.slice(0, -1);

    set({
      nodes: previous.nodes,
      edges: previous.edges,
      history: newHistory,
      future: [{ nodes, edges }, ...get().future.slice(0, 49)],
    });
    get().saveMapDebounced();
  },

  redo: () => {
    const { future, nodes, edges } = get();
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);

    set({
      nodes: next.nodes,
      edges: next.edges,
      history: [...get().history.slice(-49), { nodes, edges }],
      future: newFuture,
    });
    get().saveMapDebounced();
  },

  setNodes: (nodes) => {
    set({ nodes });
  },

  setEdges: (edges) => {
    set({ edges });
  },

  addNode: (node) => {
    const { nodes, edges, history } = get();
    set({
      history: [...history.slice(-49), { nodes, edges }],
      future: [],
      nodes: [...nodes, node],
      selectedNodeId: node.id,
    });
    get().saveMapDebounced();
  },

  updateNodeData: (id, patch) => {
    const { nodes, edges, history } = get();
    set({
      history: [...history.slice(-49), { nodes, edges }],
      future: [],
      nodes: nodes.map(n =>
        n.id === id
          ? { ...n, data: { ...n.data, ...patch } }
          : n
      ),
    });
    get().saveMapDebounced();
  },

  updateNodePosition: (id, pos, pinned = true) => {
    set({
      nodes: get().nodes.map(n =>
        n.id === id
          ? {
              ...n,
              position: pos,
              data: { ...n.data, pinned },
            }
          : n
      ),
    });
    get().saveMapDebounced();
  },

  deleteNodes: (ids) => {
    const { nodes, edges, history, dismissedTitles } = get();
    const toDeleteSet = new Set(ids);

    // Collect titles of AI-created nodes or deleted nodes for dismissed titles list
    const newlyDismissed: string[] = [];
    nodes.forEach(n => {
      if (toDeleteSet.has(n.id) && n.data.title) {
        newlyDismissed.push(n.data.title.toLowerCase().trim());
      }
    });

    set({
      history: [...history.slice(-49), { nodes, edges }],
      future: [],
      nodes: nodes.filter(n => !toDeleteSet.has(n.id)),
      edges: edges.filter(e => !toDeleteSet.has(e.source) && !toDeleteSet.has(e.target)),
      dismissedTitles: Array.from(new Set([...dismissedTitles, ...newlyDismissed])),
      selectedNodeId: null,
    });
    get().saveMapDebounced();
  },

  addEdge: (edge) => {
    const { nodes, edges, history } = get();
    // Prevent duplicate edges
    if (edges.some(e => e.source === edge.source && e.target === edge.target)) {
      return;
    }
    set({
      history: [...history.slice(-49), { nodes, edges }],
      future: [],
      edges: [...edges, edge],
    });
    get().saveMapDebounced();
  },

  updateEdge: (id, patch) => {
    const { nodes, edges, history } = get();
    set({
      history: [...history.slice(-49), { nodes, edges }],
      future: [],
      edges: edges.map(e => (e.id === id ? { ...e, ...patch } : e)),
    });
    get().saveMapDebounced();
  },

  deleteEdge: (id) => {
    const { nodes, edges, history } = get();
    set({
      history: [...history.slice(-49), { nodes, edges }],
      future: [],
      edges: edges.filter(e => e.id !== id),
      selectedEdgeId: null,
    });
    get().saveMapDebounced();
  },

  reconnectEdge: (oldEdge, newConnection) => {
    const { nodes, edges, history } = get();
    set({
      history: [...history.slice(-49), { nodes, edges }],
      future: [],
      edges: edges.map(e =>
        e.id === oldEdge.id
          ? {
              ...e,
              source: newConnection.source,
              target: newConnection.target,
              sourceHandle: newConnection.sourceHandle,
              targetHandle: newConnection.targetHandle,
            }
          : e
      ),
    });
    get().saveMapDebounced();
  },

  acceptSuggestedEdge: (edgeId) => {
    const { edges } = get();
    const edge = edges.find(e => e.id === edgeId);
    if (!edge) return;

    get().updateEdge(edgeId, {
      type: 'relation',
      data: {
        relationType: (edge.data as any)?.relationType || 'semantic',
        label: (edge.data as any)?.label || 'related',
      },
    });
  },

  rejectSuggestedEdge: (edgeId) => {
    get().deleteEdge(edgeId);
  },

  toggleCollapseBranch: (nodeId) => {
    const { nodes, collapsedNodeIds } = get();
    const newCollapsed = new Set(collapsedNodeIds);
    const isNowCollapsed = !newCollapsed.has(nodeId);

    if (isNowCollapsed) {
      newCollapsed.add(nodeId);
    } else {
      newCollapsed.delete(nodeId);
    }

    // Find all descendants of nodeId
    const getDescendants = (parentId: string): string[] => {
      const children = nodes.filter(n => n.data.parentId === parentId);
      let desc: string[] = [];
      for (const c of children) {
        desc.push(c.id);
        desc = desc.concat(getDescendants(c.id));
      }
      return desc;
    };

    const descendants = new Set(getDescendants(nodeId));

    set({
      collapsedNodeIds: newCollapsed,
      nodes: nodes.map(n => {
        if (n.id === nodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              collapsed: isNowCollapsed,
              collapsedChildCount: descendants.size,
            },
          };
        }
        if (descendants.has(n.id)) {
          return {
            ...n,
            hidden: isNowCollapsed,
          };
        }
        return n;
      }),
    });
  },

  autoArrange: (unpinAll = false) => {
    const { nodes, edges, history } = get();
    set({
      history: [...history.slice(-49), { nodes, edges }],
      future: [],
    });
    const arrangedNodes = layoutWithDagre(nodes, edges, unpinAll);
    set({ nodes: arrangedNodes });
    get().saveMapDebounced();
  },

  setSearchQuery: (q) => {
    const query = q.trim().toLowerCase();
    const { nodes } = get();

    let matchedId: string | null = null;
    if (query) {
      const found = nodes.find(n =>
        n.data.title.toLowerCase().includes(query) ||
        (n.data.summary && n.data.summary.toLowerCase().includes(query)) ||
        (n.data.rows && (
          n.data.rows.de?.toLowerCase().includes(query) ||
          n.data.rows.en?.toLowerCase().includes(query) ||
          n.data.rows.ar?.toLowerCase().includes(query)
        ))
      );
      if (found) matchedId = found.id;
    }

    set({
      searchQuery: q,
      highlightedNodeId: matchedId,
    });
  },

  selectNode: (id) => {
    set({ selectedNodeId: id, selectedEdgeId: null });
  },

  selectEdge: (id) => {
    set({ selectedEdgeId: id, selectedNodeId: null });
  },

  setFocusedBranch: (branchIds) => {
    set({ focusedBranchIds: branchIds });
  },

  toggleLang: (lang) => {
    const activeLangs = new Set(get().activeLangs);
    if (activeLangs.has(lang)) {
      if (activeLangs.size > 1) activeLangs.delete(lang);
    } else {
      activeLangs.add(lang);
    }
    set({ activeLangs });
  },

  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem('mindlex_theme', nextTheme);
    set({ theme: nextTheme });
  },

  toggleSnapToGrid: () => {
    set({ snapToGrid: !get().snapToGrid });
  },

  dismissToast: () => {
    set({ toast: null });
  },

  duplicateSelected: () => {
    const { selectedNodeId, nodes } = get();
    if (!selectedNodeId) return;

    const source = nodes.find(n => n.id === selectedNodeId);
    if (!source) return;

    const newId = `node_${Date.now()}`;
    const duplicatedNode: MindLexFlowNode = {
      ...source,
      id: newId,
      position: {
        x: source.position.x + 40,
        y: source.position.y + 40,
      },
      data: {
        ...source.data,
        id: newId,
        title: `${source.data.title} (Copy)`,
        pinned: true,
      },
      selected: true,
    };

    get().addNode(duplicatedNode);
  },

  updateNodeBlocks: (id, blocks) => {
    const { nodes } = get();
    const targetNode = nodes.find(n => n.id === id);
    if (!targetNode) return;

    const cardsCount = blocks.filter((b: any) => b.isCard).length;
    get().updateNodeData(id, {
      blocks,
      blocksCount: blocks.length,
      cardsCount,
    });

    // Debounced PUT of the page to /api/maps/:mapId/nodes/:nodeId
    const mapId = targetNode.data.mapId;
    if (mapId) {
      fetch(`/api/maps/${mapId}/nodes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blocks,
          summary: targetNode.data.summary,
          content: targetNode.data.content,
        }),
      }).catch(console.warn);
    }
  },

  setViewMode: (mode) => {
    set({ viewMode: mode });
  },

  openPage: (nodeId, expand = false) => {
    set({
      openNodePageId: nodeId,
      selectedNodeId: nodeId,
      isPageExpanded: expand,
    });
  },

  closePage: () => {
    set({
      openNodePageId: null,
      isPageExpanded: false,
    });
  },

  togglePageExpanded: () => {
    set(s => ({ isPageExpanded: !s.isPageExpanded }));
  },

  startConnecting: (sourceId) => {
    set({
      isConnectingMode: true,
      connectingSourceId: sourceId,
      toast: {
        message: 'Click another star node to connect',
        actionLabel: 'Cancel',
        onAction: () => get().cancelConnecting(),
      },
    });
  },

  finishConnecting: (targetId, kind = 'relation') => {
    const { connectingSourceId, edges, addEdge } = get();
    if (!connectingSourceId || connectingSourceId === targetId) {
      set({ isConnectingMode: false, connectingSourceId: null });
      return;
    }

    if (kind === 'hierarchy') {
      addEdge({
        id: `e_${connectingSourceId}_${targetId}`,
        source: connectingSourceId,
        target: targetId,
        type: 'hierarchy',
        data: { childLang: 'de', isNew: true },
      });
    } else {
      addEdge({
        id: `rel_${connectingSourceId}_${targetId}_${Date.now()}`,
        source: connectingSourceId,
        target: targetId,
        type: 'relation',
        data: { relationType: 'related', label: 'related', direction: 'forward' },
      });
    }

    set({
      isConnectingMode: false,
      connectingSourceId: null,
      toast: { message: 'Link connected successfully!' },
    });
  },

  cancelConnecting: () => {
    set({
      isConnectingMode: false,
      connectingSourceId: null,
      toast: null,
    });
  },

  changeNodeParent: (nodeId, newParentId) => {
    const { nodes, edges, history } = get();
    const node = nodes.find(n => n.id === nodeId);
    if (!node || node.data.parentId === newParentId) return;

    set({
      history: [...history.slice(-49), { nodes, edges }],
      future: [],
    });

    // Remove old hierarchy edge targeting nodeId
    const filteredEdges = edges.filter(
      e => !(e.target === nodeId && (e.type === 'hierarchy' || !e.type))
    );

    const nextEdges = [...filteredEdges];
    if (newParentId) {
      nextEdges.push({
        id: `e_${newParentId}_${nodeId}`,
        source: newParentId,
        target: nodeId,
        type: 'hierarchy',
        data: { childLang: node.data.lang || 'de' },
      });
    }

    const updatedNodes = nodes.map(n =>
      n.id === nodeId
        ? {
            ...n,
            data: {
              ...n.data,
              parentId: newParentId,
            },
          }
        : n
    );

    set({ nodes: updatedNodes, edges: nextEdges });
    get().saveMapDebounced();
  },
}));
