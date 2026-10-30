import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useReactFlow,
  OnConnectStartParams,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { TopicNode } from './TopicNode';
import { SubtopicNode } from './SubtopicNode';
import { HierarchyEdge } from './HierarchyEdge';
import { RelationEdge } from './RelationEdge';
import { SuggestedEdge } from './SuggestedEdge';
import { ConnectionPopover } from './ConnectionPopover';
import { EdgeToolbar } from './EdgeToolbar';
import { ContextMenu, ContextMenuTarget } from './ContextMenu';
import { useMapStore } from '../../store/useMapStore';
import { MindLexFlowNode, MindLexFlowEdge, RelationType } from '../../types/canvas';

interface MindLexCanvasProps {
  placementMode: 'none' | 'topic' | 'subtopic';
  onClearPlacementMode: () => void;
  onEditNodeDetails: (nodeId: string) => void;
}

const nodeTypes = {
  topic: TopicNode,
  subtopic: SubtopicNode,
};

const edgeTypes = {
  hierarchy: HierarchyEdge,
  relation: RelationEdge,
  suggested: SuggestedEdge,
};

const InnerCanvas: React.FC<MindLexCanvasProps> = ({
  placementMode,
  onClearPlacementMode,
  onEditNodeDetails,
}) => {
  const reactFlow = useReactFlow();

  const storeNodes = useMapStore(s => s.nodes);
  const storeEdges = useMapStore(s => s.edges);
  const snapToGrid = useMapStore(s => s.snapToGrid);
  const selectedNodeId = useMapStore(s => s.selectedNodeId);
  const selectedEdgeId = useMapStore(s => s.selectedEdgeId);
  const highlightedNodeId = useMapStore(s => s.highlightedNodeId);
  const map = useMapStore(s => s.map);

  const addNode = useMapStore(s => s.addNode);
  const addEdge = useMapStore(s => s.addEdge);
  const updateNodePosition = useMapStore(s => s.updateNodePosition);
  const deleteNodes = useMapStore(s => s.deleteNodes);
  const deleteEdge = useMapStore(s => s.deleteEdge);
  const updateEdge = useMapStore(s => s.updateEdge);
  const reconnectEdge = useMapStore(s => s.reconnectEdge);
  const selectNode = useMapStore(s => s.selectNode);
  const selectEdge = useMapStore(s => s.selectEdge);
  const toggleCollapseBranch = useMapStore(s => s.toggleCollapseBranch);
  const setFocusedBranch = useMapStore(s => s.setFocusedBranch);
  const duplicateSelected = useMapStore(s => s.duplicateSelected);
  const autoArrange = useMapStore(s => s.autoArrange);
  const openPage = useMapStore(s => s.openPage);
  const closePage = useMapStore(s => s.closePage);
  const isConnectingMode = useMapStore(s => s.isConnectingMode);
  const finishConnecting = useMapStore(s => s.finishConnecting);

  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges);

  // Sync with store
  useEffect(() => {
    setNodes(storeNodes);
  }, [storeNodes, setNodes]);

  useEffect(() => {
    setEdges(storeEdges);
  }, [storeEdges, setEdges]);

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuTarget | null>(null);

  // Connection Popover state
  const [pendingConnection, setPendingConnection] = useState<{
    source: string;
    target: string;
    sourceHandle: string | null;
    targetHandle: string | null;
    position: { x: number; y: number };
  } | null>(null);

  const connectionStartRef = useRef<{
    nodeId: string | null;
    handleId: string | null;
    handleType: string | null;
    isShiftPressed: boolean;
  } | null>(null);

  // Highlight and Center search results
  useEffect(() => {
    if (highlightedNodeId) {
      const target = storeNodes.find(n => n.id === highlightedNodeId);
      if (target) {
        reactFlow.setCenter(target.position.x + 140, target.position.y + 70, {
          duration: 600,
          zoom: 1,
        });
        selectNode(highlightedNodeId);
      }
    }
  }, [highlightedNodeId, storeNodes, reactFlow, selectNode]);

  // Handle Drag Start
  const handleConnectStart = useCallback(
    (_: any, params: OnConnectStartParams) => {
      connectionStartRef.current = {
        nodeId: params.nodeId,
        handleId: params.handleId,
        handleType: params.handleType,
        isShiftPressed: false,
      };
    },
    []
  );

  // Handle Drag to another node (Connect)
  const handleConnect = useCallback(
    (connection: any) => {
      const isShift = connectionStartRef.current?.isShiftPressed || false;
      const { source, target, sourceHandle, targetHandle } = connection;
      if (!source || !target || source === target) return;

      // Holding Shift skips popover and immediately creates a 'related' link!
      if (isShift) {
        addEdge({
          id: `rel_${source}_${target}_${Date.now()}`,
          source,
          target,
          sourceHandle,
          targetHandle,
          type: 'relation',
          data: {
            relationType: 'related',
            label: 'related',
            direction: 'forward',
          },
        });
        return;
      }

      // Otherwise open popover
      setPendingConnection({
        source,
        target,
        sourceHandle,
        targetHandle,
        position: { x: window.innerWidth / 2 - 120, y: window.innerHeight / 2 - 100 },
      });
    },
    [addEdge]
  );

  // Handle Drag to empty canvas (Connect End)
  const handleConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      const conn = connectionStartRef.current;
      if (!conn || !conn.nodeId) return;

      const targetEl = event.target as HTMLElement;
      const isCanvasBackground =
        targetEl?.classList.contains('react-flow__pane') ||
        targetEl?.id === 'canvas-wrapper' ||
        targetEl?.closest('.react-flow__pane');

      if (isCanvasBackground) {
        const clientX = 'clientX' in event ? event.clientX : event.touches[0].clientX;
        const clientY = 'clientY' in event ? event.clientY : event.touches[0].clientY;
        const projected = reactFlow.screenToFlowPosition({ x: clientX, y: clientY });

        const newId = `node_${Date.now()}`;
        const sourceNode = storeNodes.find(n => n.id === conn.nodeId);
        const sourceHandle = conn.handleId || '';

        // Structure if started from the right handle, otherwise related!
        const isRightHandle = sourceHandle.includes('right');

        const newNode: MindLexFlowNode = {
          id: newId,
          type: 'subtopic',
          position: projected,
          data: {
            id: newId,
            mapId: map?.id || 'default_map',
            title: 'New idea',
            kind: 'concept',
            lang: sourceNode?.data.lang || 'de',
            parentId: isRightHandle ? conn.nodeId : null,
            childIds: [],
            depth: (sourceNode?.data.depth || 0) + 1,
            pinned: true,
          },
        };

        addNode(newNode);

        if (isRightHandle) {
          addEdge({
            id: `e_${conn.nodeId}_${newId}`,
            source: conn.nodeId,
            target: newId,
            type: 'hierarchy',
            data: { childLang: newNode.data.lang, isNew: true },
          });
        } else {
          addEdge({
            id: `rel_${conn.nodeId}_${newId}`,
            source: conn.nodeId,
            target: newId,
            type: 'relation',
            data: { relationType: 'related', label: 'related', direction: 'forward' },
          });
        }
      }

      connectionStartRef.current = null;
    },
    [reactFlow, storeNodes, map, addNode, addEdge]
  );

  // Canvas Click / Double-click
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      setContextMenu(null);
      selectNode(null);
      selectEdge(null);

      if (placementMode !== 'none') {
        const projected = reactFlow.screenToFlowPosition({ x: e.clientX, y: e.clientY });
        const newId = `node_${Date.now()}`;
        const newNode: MindLexFlowNode = {
          id: newId,
          type: placementMode === 'topic' ? 'topic' : 'subtopic',
          position: projected,
          data: {
            id: newId,
            mapId: map?.id || 'default_map',
            title: placementMode === 'topic' ? 'New Topic' : 'New Subtopic',
            kind: placementMode === 'topic' ? 'topic' : 'concept',
            lang: 'de',
            childIds: [],
            depth: placementMode === 'topic' ? 0 : 1,
            pinned: true,
          },
        };
        addNode(newNode);
        onClearPlacementMode();
      }
    },
    [placementMode, reactFlow, map, addNode, onClearPlacementMode, selectNode, selectEdge]
  );

  const handleCanvasDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const projected = reactFlow.screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const newId = `node_${Date.now()}`;
      const newNode: MindLexFlowNode = {
        id: newId,
        type: 'subtopic',
        position: projected,
        data: {
          id: newId,
          mapId: map?.id || 'default_map',
          title: 'New idea',
          kind: 'concept',
          lang: 'de',
          childIds: [],
          depth: 1,
          pinned: true,
        },
      };
      addNode(newNode);
    },
    [reactFlow, map, addNode]
  );

  // Node Drag Stop -> set pinned = true
  const handleNodeDragStop = useCallback(
    (_: any, node: MindLexFlowNode) => {
      updateNodePosition(node.id, node.position, true);
    },
    [updateNodePosition]
  );

  // Keyboard Shortcuts: Tab, Enter, F2, Cmd/Ctrl+D, Delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName);

      if (e.key === 'Shift') {
        if (connectionStartRef.current) {
          connectionStartRef.current.isShiftPressed = true;
        }
      }

      if (isInput) return;

      const isCmd = e.metaKey || e.ctrlKey;

      // Duplicate: Cmd/Ctrl + D
      if (isCmd && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateSelected();
        return;
      }

      // Open Page: key O or Space when a node is selected
      if ((e.key.toLowerCase() === 'o' || e.key === ' ') && selectedNodeId) {
        e.preventDefault();
        openPage(selectedNodeId);
        return;
      }

      // Close Page / Cancel connecting: Escape
      if (e.key === 'Escape') {
        closePage();
        if (isConnectingMode) useMapStore.getState().cancelConnecting();
        return;
      }

      // Add child: Tab
      if (e.key === 'Tab' && selectedNodeId) {
        e.preventDefault();
        const parent = storeNodes.find(n => n.id === selectedNodeId);
        if (parent) {
          const newId = `node_${Date.now()}`;
          const childNode: MindLexFlowNode = {
            id: newId,
            type: 'subtopic',
            position: { x: parent.position.x + 340, y: parent.position.y + 60 },
            data: {
              id: newId,
              mapId: parent.data.mapId,
              title: 'New idea',
              kind: 'concept',
              lang: parent.data.lang,
              parentId: parent.id,
              depth: (parent.data.depth || 0) + 1,
              pinned: true,
            },
          };
          addNode(childNode);
          addEdge({
            id: `e_${parent.id}_${newId}`,
            source: parent.id,
            target: newId,
            type: 'hierarchy',
            data: { childLang: childNode.data.lang, isNew: true },
          });
        }
        return;
      }

      // Add sibling: Enter
      if (e.key === 'Enter' && selectedNodeId) {
        e.preventDefault();
        const sibling = storeNodes.find(n => n.id === selectedNodeId);
        if (sibling) {
          const newId = `node_${Date.now()}`;
          const newNode: MindLexFlowNode = {
            id: newId,
            type: 'subtopic',
            position: { x: sibling.position.x, y: sibling.position.y + 120 },
            data: {
              id: newId,
              mapId: sibling.data.mapId,
              title: 'New sibling',
              kind: 'concept',
              lang: sibling.data.lang,
              parentId: sibling.data.parentId,
              depth: sibling.data.depth,
              pinned: true,
            },
          };
          addNode(newNode);
          if (sibling.data.parentId) {
            addEdge({
              id: `e_${sibling.data.parentId}_${newId}`,
              source: sibling.data.parentId,
              target: newId,
              type: 'hierarchy',
              data: { childLang: newNode.data.lang, isNew: true },
            });
          }
        }
        return;
      }

      // Rename: F2
      if (e.key === 'F2' && selectedNodeId) {
        e.preventDefault();
        onEditNodeDetails(selectedNodeId);
        return;
      }

      // Delete: Backspace / Delete
      if ((e.key === 'Delete' || e.key === 'Backspace') && (selectedNodeId || selectedEdgeId)) {
        if (selectedNodeId) deleteNodes([selectedNodeId]);
        if (selectedEdgeId) deleteEdge(selectedEdgeId);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift' && connectionStartRef.current) {
        connectionStartRef.current.isShiftPressed = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedNodeId, selectedEdgeId, storeNodes, duplicateSelected, addNode, addEdge, deleteNodes, deleteEdge, onEditNodeDetails]);

  // Context Menu handlers
  const handlePaneContextMenu = useCallback(
    (e: any) => {
      e.preventDefault();
      const projected = reactFlow.screenToFlowPosition({ x: e.clientX, y: e.clientY });
      setContextMenu({
        type: 'canvas',
        x: e.clientX,
        y: e.clientY,
        canvasX: projected.x,
        canvasY: projected.y,
      });
    },
    [reactFlow]
  );

  const handleNodeContextMenu = useCallback(
    (e: React.MouseEvent, node: MindLexFlowNode) => {
      e.preventDefault();
      e.stopPropagation();
      selectNode(node.id);
      setContextMenu({
        type: 'node',
        nodeId: node.id,
        x: e.clientX,
        y: e.clientY,
      });
    },
    [selectNode]
  );

  const handleEdgeContextMenu = useCallback(
    (e: React.MouseEvent, edge: MindLexFlowEdge) => {
      e.preventDefault();
      e.stopPropagation();
      selectEdge(edge.id);
      setContextMenu({
        type: 'edge',
        edgeId: edge.id,
        x: e.clientX,
        y: e.clientY,
      });
    },
    [selectEdge]
  );

  const selectedEdge = useMemo(
    () => storeEdges.find(e => e.id === selectedEdgeId) || null,
    [storeEdges, selectedEdgeId]
  );

  const sourceNode = pendingConnection
    ? storeNodes.find(n => n.id === pendingConnection.source)
    : null;
  const targetNode = pendingConnection
    ? storeNodes.find(n => n.id === pendingConnection.target)
    : null;

  return (
    <div className="absolute inset-0 top-14 canvas-bg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes as any}
        edgeTypes={edgeTypes as any}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnectStart={handleConnectStart}
        onConnect={handleConnect}
        onConnectEnd={handleConnectEnd}
        onReconnect={reconnectEdge}
        onNodeDragStop={handleNodeDragStop}
        onPaneClick={handleCanvasClick}
        onDoubleClick={handleCanvasDoubleClick}
        onPaneContextMenu={handlePaneContextMenu}
        onNodeClick={(_, n) => {
          if (isConnectingMode) {
            finishConnecting(n.id);
          } else {
            selectNode(n.id);
          }
        }}
        onNodeDoubleClick={(_, n) => openPage(n.id)}
        onEdgeClick={(_, e) => selectEdge(e.id)}
        connectionMode={ConnectionMode.Loose} // Any node can connect to ANY node!
        snapToGrid={snapToGrid}
        snapGrid={[16, 16]}
        fitView
        minZoom={0.2}
        maxZoom={2.2}
        panOnDrag
        zoomOnScroll
      >
        <Background variant={BackgroundVariant.Dots} gap={32} size={1.5} color="rgba(154, 162, 199, 0.25)" />
        <Controls showInteractive={false} className="!bg-[var(--sf)] !border !border-[var(--bd)] !rounded-2xl !shadow-xl !p-1" />

        {/* MiniMap colored by language */}
        <MiniMap
          nodeColor={(n: any) => {
            const lang = n.data?.lang;
            if (lang === 'ar') return '#2DD4A0'; // Emerald Aurora
            if (lang === 'de') return '#FFB04D'; // Solar Amber
            return '#4DA3FF'; // Sky Blue
          }}
          maskColor="rgba(11, 15, 30, 0.75)"
          className="!bg-[var(--sf)] !border !border-[var(--bd)] !rounded-2xl !shadow-xl !overflow-hidden"
        />
      </ReactFlow>

      {/* Floating Edge Toolbar on edge click */}
      <EdgeToolbar edge={selectedEdge} onClose={() => selectEdge(null)} />

      {/* Context Menu on node, canvas, edge */}
      <ContextMenu
        target={contextMenu}
        onClose={() => setContextMenu(null)}
        onAddChild={(nodeId) => {
          const parent = storeNodes.find(n => n.id === nodeId);
          if (parent) {
            const newId = `node_${Date.now()}`;
            const childNode: MindLexFlowNode = {
              id: newId,
              type: 'subtopic',
              position: { x: parent.position.x + 340, y: parent.position.y + 60 },
              data: {
                id: newId,
                mapId: parent.data.mapId,
                title: 'New idea',
                kind: 'concept',
                lang: parent.data.lang,
                parentId: parent.id,
                depth: (parent.data.depth || 0) + 1,
                pinned: true,
              },
            };
            addNode(childNode);
            addEdge({
              id: `e_${parent.id}_${newId}`,
              source: parent.id,
              target: newId,
              type: 'hierarchy',
              data: { childLang: childNode.data.lang, isNew: true },
            });
          }
        }}
        onAddSibling={(nodeId) => {
          const sibling = storeNodes.find(n => n.id === nodeId);
          if (sibling) {
            const newId = `node_${Date.now()}`;
            const newNode: MindLexFlowNode = {
              id: newId,
              type: 'subtopic',
              position: { x: sibling.position.x, y: sibling.position.y + 120 },
              data: {
                id: newId,
                mapId: sibling.data.mapId,
                title: 'New sibling',
                kind: 'concept',
                lang: sibling.data.lang,
                parentId: sibling.data.parentId,
                depth: sibling.data.depth,
                pinned: true,
              },
            };
            addNode(newNode);
            if (sibling.data.parentId) {
              addEdge({
                id: `e_${sibling.data.parentId}_${newId}`,
                source: sibling.data.parentId,
                target: newId,
                type: 'hierarchy',
                data: { childLang: newNode.data.lang, isNew: true },
              });
            }
          }
        }}
        onEditNode={(nodeId) => onEditNodeDetails(nodeId)}
        onFocusBranch={(nodeId) => {
          const branch = new Set<string>([nodeId]);
          const queue = [nodeId];
          while (queue.length > 0) {
            const cur = queue.shift()!;
            for (const edge of storeEdges) {
              if (edge.source === cur && !branch.has(edge.target)) {
                branch.add(edge.target);
                queue.push(edge.target);
              }
            }
          }
          setFocusedBranch(branch);
        }}
        onCollapseBranch={(nodeId) => toggleCollapseBranch(nodeId)}
        onDuplicateNode={() => duplicateSelected()}
        onDeleteNode={(nodeId) => deleteNodes([nodeId])}
        onAddTopicCanvas={(pos) => {
          const newId = `node_${Date.now()}`;
          addNode({
            id: newId,
            type: 'topic',
            position: pos,
            data: {
              id: newId,
              mapId: map?.id || 'default_map',
              title: 'New Topic',
              kind: 'topic',
              lang: 'de',
              childIds: [],
              depth: 0,
              pinned: true,
            },
          });
        }}
        onAddSubtopicCanvas={(pos) => {
          const newId = `node_${Date.now()}`;
          addNode({
            id: newId,
            type: 'subtopic',
            position: pos,
            data: {
              id: newId,
              mapId: map?.id || 'default_map',
              title: 'New Subtopic',
              kind: 'concept',
              lang: 'de',
              childIds: [],
              depth: 1,
              pinned: true,
            },
          });
        }}
        onAutoArrange={() => autoArrange(false)}
        onFitView={() => reactFlow.fitView({ duration: 500 })}
        onToggleEdgeType={(edgeId) => {
          const edge = storeEdges.find(e => e.id === edgeId);
          if (!edge) return;
          if (edge.type === 'relation') {
            updateEdge(edgeId, { type: 'hierarchy', data: { childLang: 'de' } });
          } else {
            updateEdge(edgeId, { type: 'relation', data: { relationType: 'semantic', label: 'related' } });
          }
        }}
        onDeleteEdge={(edgeId) => deleteEdge(edgeId)}
      />

      {/* Connection Popover when dropping handle on another node */}
      {pendingConnection && (
        <ConnectionPopover
          position={pendingConnection.position}
          sourceNodeTitle={sourceNode?.data.title || 'Source'}
          targetNodeTitle={targetNode?.data.title || 'Target'}
          onConfirm={(config) => {
            if (config.kind === 'hierarchy') {
              addEdge({
                id: `e_${pendingConnection.source}_${pendingConnection.target}`,
                source: pendingConnection.source,
                target: pendingConnection.target,
                sourceHandle: pendingConnection.sourceHandle,
                targetHandle: pendingConnection.targetHandle,
                type: 'hierarchy',
                data: { childLang: targetNode?.data.lang || 'de', isNew: true },
              });
            } else {
              addEdge({
                id: `rel_${pendingConnection.source}_${pendingConnection.target}_${Date.now()}`,
                source: pendingConnection.source,
                target: pendingConnection.target,
                sourceHandle: pendingConnection.sourceHandle,
                targetHandle: pendingConnection.targetHandle,
                type: 'relation',
                data: {
                  relationType: config.relationType || 'semantic',
                  label: config.label || config.relationType || 'related',
                  direction: config.direction || 'forward',
                },
              });
            }
            setPendingConnection(null);
          }}
          onCancel={() => setPendingConnection(null)}
        />
      )}
    </div>
  );
};

export const MindLexCanvas: React.FC<MindLexCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <InnerCanvas {...props} />
    </ReactFlowProvider>
  );
};
