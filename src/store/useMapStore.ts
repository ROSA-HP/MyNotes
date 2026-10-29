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
  activeLangs: Set<LanguageCode>;
  theme: 'dark' | 'light';
  searchQuery: string;
  highlightedNodeId: string | null;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  focusedBranchIds: Set<string> | null;
  collapsedNodeIds: Set<string>;
  snapToGrid: boolean;

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
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export const useMapStore = create<MapStoreState>((set, get) => ({
  map: null,
  nodes: [],
  edges: [],
  isLoading: false,
  saveStatus: 'Saved',
  dismissedTitles: [],

  activeLangs: new Set(['en', 'ar', 'de']),
  theme: (typeof window !== 'undefined' && (localStorage.getItem('mindlex_theme') as any)) || 'dark',
  searchQuery: '',
  highlightedNodeId: null,
  selectedNodeId: null,
  selectedEdgeId: null,
  focusedBranchIds: null,
  collapsedNodeIds: new Set<string>(),
  snapToGrid: true,

  history: [],
  future: [],
  toast: null,

  loadMap: async (mapId: string) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`/api/maps/${mapId}`);
      if (!res.ok) throw new Error('Failed to load map');
      const data = await res.json();

      const flowNodes: MindLexFlowNode[] = (data.nodes || []).map((n: any) => ({
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
          rows: n.rows,
          flashcards: n.flashcards || [],
          tags: n.tags || [],
          parentId: n.parentId,
          childIds: n.childIds || [],
          depth: n.depth,
          order: n.order,
          pinned: false,
          blocksCount: n.childIds?.length || 0,
          cardsCount: n.flashcards?.length || (n.rows ? 1 : 0),
          dueCount: 1,
        },
      }));

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
}));
