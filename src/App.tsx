import React, { useState, useEffect } from 'react';
import { useMapStore } from './store/useMapStore';
import { CanvasTopBar } from './components/canvas/CanvasTopBar';
import { MindLexCanvas } from './components/canvas/MindLexCanvas';
import { EmptyMapFirstRun } from './components/canvas/EmptyMapFirstRun';
import { SkeletonLoader } from './components/canvas/SkeletonLoader';
import { HomeView } from './components/HomeView';
import { NoteComposerDock } from './components/NoteComposerDock';
import { EditNodeModal } from './components/EditNodeModal';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { StudyModal } from './components/StudyModal';
import { ExportModal } from './components/ExportModal';
import { MapsDirectoryModal } from './components/MapsDirectoryModal';
import { Toast } from './components/Toast';
import { BottomNodeBar } from './components/canvas/BottomNodeBar';
import { NodePagePanel } from './components/page/NodePagePanel';
import { OutlineView } from './components/outline/OutlineView';
import { MindNode, NodeKind, LanguageCode } from './types';

export default function App() {
  // Navigation / Route state
  const [currentRoute, setCurrentRoute] = useState<'home' | 'map'>('map');
  const [activeMapId, setActiveMapId] = useState<string>('map_german_verbs');
  const [allMapsList, setAllMapsList] = useState<any[]>([]);

  // Store bindings
  const map = useMapStore(s => s.map);
  const nodes = useMapStore(s => s.nodes);
  const edges = useMapStore(s => s.edges);
  const isLoading = useMapStore(s => s.isLoading);
  const toast = useMapStore(s => s.toast);
  const loadMap = useMapStore(s => s.loadMap);
  const addNode = useMapStore(s => s.addNode);
  const addEdge = useMapStore(s => s.addEdge);
  const updateNodeData = useMapStore(s => s.updateNodeData);
  const deleteNodes = useMapStore(s => s.deleteNodes);
  const dismissToast = useMapStore(s => s.dismissToast);
  const theme = useMapStore(s => s.theme);
  const viewMode = useMapStore(s => s.viewMode);
  const selectedNodeId = useMapStore(s => s.selectedNodeId);

  // Placement mode: 'none' | 'topic' | 'subtopic'
  const [placementMode, setPlacementMode] = useState<'none' | 'topic' | 'subtopic'>('none');

  // Modals state
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isStudyOpen, setIsStudyOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isMapsDirectoryOpen, setIsMapsDirectoryOpen] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  // Load active map on startup or id change
  useEffect(() => {
    loadMap(activeMapId);
    // Fetch all maps for the switcher
    fetch('/api/maps')
      .then(res => res.json())
      .then(data => {
        if (data.maps) setAllMapsList(data.maps);
      })
      .catch(console.warn);
  }, [activeMapId, loadMap]);

  // Sync HTML title & meta with map
  useEffect(() => {
    if (map) {
      document.title = `${map.title} – MindLex Canvas`;
    }
  }, [map]);

  // Node to edit modal adapter
  const editingNode = nodes.find(n => n.id === editingNodeId);
  const editingNodeAdapted: MindNode | null = editingNode
    ? {
        id: editingNode.id,
        kind: editingNode.data.kind as NodeKind,
        lang: editingNode.data.lang as LanguageCode,
        x: editingNode.position.x,
        y: editingNode.position.y,
        label: editingNode.data.title,
        desc: editingNode.data.summary,
        rows: editingNode.data.rows,
        foot: editingNode.data.tags,
        note: editingNode.data.content,
      }
    : null;

  // Selected or anchor node for composer
  const selectedNodeObj = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;
  const selectedNodeForComposer: MindNode | null = selectedNodeObj
    ? {
        id: selectedNodeObj.id,
        kind: (selectedNodeObj.data?.kind as NodeKind) || 'concept',
        lang: (selectedNodeObj.data?.lang as LanguageCode) || 'de',
        x: selectedNodeObj.position?.x || 100,
        y: selectedNodeObj.position?.y || 100,
        label: selectedNodeObj.data?.title || 'Anchor',
        desc: selectedNodeObj.data?.summary,
        rows: selectedNodeObj.data?.rows,
      }
    : null;

  const defaultAnchorNode: MindNode = {
    id: selectedNodeObj?.id || nodes[0]?.id || 'root',
    kind: (selectedNodeObj?.data?.kind as NodeKind) || 'topic',
    lang: (selectedNodeObj?.data?.lang as LanguageCode) || 'de',
    x: selectedNodeObj?.position?.x || 100,
    y: selectedNodeObj?.position?.y || 100,
    label: selectedNodeObj?.data?.title || 'Anchor',
  };

  // Convert nodes for Study Modal
  const studyCards: MindNode[] = nodes.map(n => ({
    id: n.id,
    kind: n.data.kind as NodeKind,
    lang: n.data.lang as LanguageCode,
    x: n.position.x,
    y: n.position.y,
    label: n.data.title,
    desc: n.data.summary,
    rows: n.data.rows,
    foot: n.data.tags,
  }));

  // Empty-map first-run state check (0 or 1 node)
  const isFirstRunEmptyMap = nodes.length <= 1;

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col bg-[var(--bg)] text-[var(--tx)]">
      {/* Top Bar Shell */}
      <CanvasTopBar
        currentRoute={currentRoute}
        onNavigateRoute={setCurrentRoute}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenComposer={() => setIsComposerOpen(true)}
        onAddTopicClick={() => setPlacementMode('topic')}
        onAddSubtopicClick={() => setPlacementMode('subtopic')}
      />

      {/* Loading Skeleton */}
      {isLoading && <SkeletonLoader />}

      {/* Route: Home Placeholder */}
      {currentRoute === 'home' && (
        <HomeView
          maps={allMapsList.length > 0 ? allMapsList : [map].filter(Boolean)}
          activeMapId={activeMapId}
          onOpenMap={(id) => {
            setActiveMapId(id);
            setCurrentRoute('map');
          }}
          onOpenStudy={() => setIsStudyOpen(true)}
          onOpenNewMapModal={() => setIsMapsDirectoryOpen(true)}
          streakDays={map?.streakDays || 1}
          xp={map?.xp || 0}
        />
      )}

      {/* Route: /map/:id React Flow Canvas or Outline View */}
      {currentRoute === 'map' && (
        <>
          {viewMode === 'outline' ? (
            <OutlineView />
          ) : (
            <>
              <MindLexCanvas
                placementMode={placementMode}
                onClearPlacementMode={() => setPlacementMode('none')}
                onEditNodeDetails={(id) => setEditingNodeId(id)}
              />

              {/* Empty-Map First-Run State */}
              {isFirstRunEmptyMap && !isLoading && (
                <EmptyMapFirstRun
                  rootTitle={map?.title || 'German Verbs'}
                  onOpenComposer={() => setIsComposerOpen(true)}
                  onAddFirstChild={() => {
                    const root = nodes[0];
                    const newId = `node_${Date.now()}`;
                    addNode({
                      id: newId,
                      type: 'subtopic',
                      position: { x: (root?.position.x || 100) + 360, y: (root?.position.y || 100) + 60 },
                      data: {
                        id: newId,
                        mapId: map?.id || 'default_map',
                        title: 'Core Concept',
                        kind: 'concept',
                        lang: 'de',
                        parentId: root?.id || null,
                        pinned: true,
                      },
                    });
                    if (root) {
                      addEdge({
                        id: `e_${root.id}_${newId}`,
                        source: root.id,
                        target: newId,
                        type: 'hierarchy',
                        data: { childLang: 'de', isNew: true },
                      });
                    }
                  }}
                />
              )}
            </>
          )}

          {/* Bottom Node Bar (Slides up when single node is selected) */}
          <BottomNodeBar />

          {/* RemNote Style Page Panel (Slides in from right) */}
          <NodePagePanel />

          {/* AI Note Synthesizer Dock */}
          <NoteComposerDock
            isOpen={isComposerOpen}
            onOpen={() => setIsComposerOpen(true)}
            onClose={() => setIsComposerOpen(false)}
            selectedNode={selectedNodeForComposer}
            defaultAnchorNode={defaultAnchorNode}
            onNodesSynthesized={(newNodes, parentId) => {
              const startX = ((selectedNodeObj || nodes[0])?.position.x || 100) + 360;
              const startY = (selectedNodeObj || nodes[0])?.position.y || 100;

              newNodes.forEach((n, idx) => {
                addNode({
                  id: n.id,
                  type: n.kind === 'topic' ? 'topic' : 'subtopic',
                  position: { x: startX + (idx > 1 ? 320 : 0), y: startY + (idx % 2 === 0 ? idx * 70 : -idx * 70) },
                  data: {
                    id: n.id,
                    mapId: map?.id || 'default_map',
                    title: n.rows ? (n.rows.de || n.rows.en || n.label || 'Word') : (n.label || 'Idea'),
                    kind: n.kind,
                    lang: n.lang,
                    summary: n.desc,
                    content: n.desc,
                    rows: n.rows,
                    tags: n.foot || ['AI Extracted'],
                    parentId,
                    isAiCreated: true,
                    isNew: true,
                    pinned: true,
                  },
                });

                addEdge({
                  id: `e_${parentId}_${n.id}`,
                  source: parentId,
                  target: n.id,
                  type: 'hierarchy',
                  data: { childLang: n.lang, isNew: true },
                });
              });
            }}
          />
        </>
      )}

      {/* Edit Node Modal */}
      <EditNodeModal
        node={editingNodeAdapted}
        isOpen={!!editingNodeId}
        onClose={() => setEditingNodeId(null)}
        onSave={(updated) => {
          updateNodeData(updated.id, {
            title: updated.label || (updated.rows ? updated.rows.de : 'Untitled'),
            kind: updated.kind,
            lang: updated.lang,
            summary: updated.desc,
            content: updated.note,
            rows: updated.rows,
          });
        }}
        onDelete={(id) => {
          deleteNodes([id]);
          setEditingNodeId(null);
        }}
      />

      {/* Command Palette Modal */}
      <CommandPaletteModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        nodes={studyCards}
        onSelectNode={(id) => {
          useMapStore.getState().selectNode(id);
          setCurrentRoute('map');
        }}
        onOpenStudy={() => setIsStudyOpen(true)}
        onOpenComposer={() => {
          setCurrentRoute('map');
          setIsComposerOpen(true);
        }}
        onToggleTheme={useMapStore.getState().toggleTheme}
        onOpenMapsDirectory={() => setIsMapsDirectoryOpen(true)}
      />

      {/* Study Modal */}
      <StudyModal
        isOpen={isStudyOpen}
        onClose={() => setIsStudyOpen(false)}
        cards={studyCards}
        onCompleteSession={(known, xpGained) => {
          if (map) {
            useMapStore.setState(s => ({
              map: s.map ? { ...s.map, xp: s.map.xp + xpGained } : null,
            }));
            useMapStore.getState().saveMapDebounced();
          }
        }}
        streakDays={map?.streakDays || 1}
      />

      {/* Export Modal */}
      {map && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          mapData={{
            id: map.id,
            title: map.title,
            subtitle: map.description,
            streakDays: map.streakDays,
            xp: map.xp,
            updatedAt: map.updatedAt,
            nodes: studyCards,
            edges: edges.map(e => [e.source, e.target]),
          }}
          onToast={(msg) => useMapStore.setState({ toast: { message: msg } })}
        />
      )}

      {/* Maps Directory Switcher */}
      <MapsDirectoryModal
        isOpen={isMapsDirectoryOpen}
        onClose={() => setIsMapsDirectoryOpen(false)}
        maps={allMapsList.map(m => ({
          ...m,
          nodes: [],
          edges: [],
        }))}
        activeMapId={activeMapId}
        onSelectMap={(id) => {
          setActiveMapId(id);
          setCurrentRoute('map');
        }}
        onCreateMap={(title) => {
          fetch('/api/maps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title }),
          })
            .then(res => res.json())
            .then(data => {
              if (data.map) {
                setActiveMapId(data.map.id);
                setCurrentRoute('map');
              }
            })
            .catch(console.warn);
        }}
        onDeleteMap={(id) => {
          fetch(`/api/maps/${id}`, { method: 'DELETE' })
            .then(() => {
              setAllMapsList(prev => prev.filter(m => m.id !== id));
            })
            .catch(console.warn);
        }}
      />

      {/* Toast Notification (including 409 conflict and reload action) */}
      <Toast
        toast={toast ? { id: 'toast', message: toast.message, onUndo: toast.onAction } : null}
        onDismiss={dismissToast}
      />
    </div>
  );
}
