import React, { useState, useEffect } from 'react';
import { Trash2, Edit3, ArrowRight, ArrowLeft, ArrowLeftRight, X } from 'lucide-react';
import { MindLexFlowEdge, RelationType } from '../../types/canvas';
import { useMapStore } from '../../store/useMapStore';

interface EdgeToolbarProps {
  edge: MindLexFlowEdge | null;
  onClose: () => void;
}

export const EdgeToolbar: React.FC<EdgeToolbarProps> = ({ edge, onClose }) => {
  const updateEdge = useMapStore(s => s.updateEdge);
  const deleteEdge = useMapStore(s => s.deleteEdge);

  const [labelDraft, setLabelDraft] = useState('');
  const [isEditingLabel, setIsEditingLabel] = useState(false);

  useEffect(() => {
    if (edge) {
      setLabelDraft((edge.data as any)?.label || '');
      setIsEditingLabel(false);
    }
  }, [edge]);

  if (!edge) return null;

  const isRelation = edge.type === 'relation';
  const currentType = (edge.data as any)?.relationType || 'related';
  const currentDirection = (edge.data as any)?.direction || 'forward';

  const handleToggleKind = () => {
    if (isRelation) {
      updateEdge(edge.id, {
        type: 'hierarchy',
        data: { childLang: 'de' },
      });
    } else {
      updateEdge(edge.id, {
        type: 'relation',
        data: { relationType: 'semantic', label: 'related', direction: 'forward' },
      });
    }
  };

  const handleCycleDirection = () => {
    const nextDir =
      currentDirection === 'forward'
        ? 'backward'
        : currentDirection === 'backward'
        ? 'bi'
        : 'forward';

    updateEdge(edge.id, {
      data: {
        ...(edge.data as any),
        direction: nextDir,
      },
    });
  };

  const handleSaveLabel = () => {
    setIsEditingLabel(false);
    updateEdge(edge.id, {
      data: {
        ...(edge.data as any),
        label: labelDraft.trim() || undefined,
      },
    });
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--sf)',
        borderColor: 'var(--bd)',
      }}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 p-2 rounded-2xl border shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs anim-bl"
    >
      <div className="flex items-center gap-1 font-metric text-[11px] text-[var(--mu)] px-2 border-r border-[var(--bd)]">
        <span>Edge:</span>
        <b className="text-[var(--tx)] capitalize">{edge.type || 'hierarchy'}</b>
      </div>

      {/* Switch between Hierarchy & Relation */}
      <button
        onClick={handleToggleKind}
        className="px-2.5 py-1 rounded-xl bg-[var(--sf2)] hover:bg-[var(--br)] hover:text-white transition-colors text-[11px] font-semibold"
      >
        Make {isRelation ? 'Structure' : 'Relation'}
      </button>

      {isRelation && (
        <>
          {/* Relation Type Dropdown */}
          <select
            value={currentType}
            onChange={(e) =>
              updateEdge(edge.id, {
                data: {
                  ...(edge.data as any),
                  relationType: e.target.value as RelationType,
                },
              })
            }
            className="bg-[var(--sf2)] border border-[var(--bd)] rounded-xl px-2 py-1 outline-none text-[11px] text-[var(--tx)]"
          >
            <option value="semantic">Semantic</option>
            <option value="prerequisite">Prerequisite</option>
            <option value="analogy">Analogy</option>
            <option value="contrast">Contrast</option>
            <option value="derivation">Derivation</option>
            <option value="related">Related</option>
          </select>

          {/* Direction toggle button */}
          <button
            onClick={handleCycleDirection}
            title={`Direction: ${currentDirection}`}
            className="w-7 h-7 rounded-xl bg-[var(--sf2)] hover:bg-[var(--sf)] grid place-items-center text-[var(--tx)]"
          >
            {currentDirection === 'forward' ? (
              <ArrowRight size={13} />
            ) : currentDirection === 'backward' ? (
              <ArrowLeft size={13} />
            ) : (
              <ArrowLeftRight size={13} />
            )}
          </button>

          {/* Editable Label */}
          {isEditingLabel ? (
            <input
              type="text"
              value={labelDraft}
              onChange={(e) => setLabelDraft(e.target.value)}
              onBlur={handleSaveLabel}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveLabel()}
              autoFocus
              className="bg-[var(--sf2)] border border-[var(--br)] rounded-lg px-2 py-0.5 outline-none text-[11px] w-28 text-[var(--tx)]"
            />
          ) : (
            <button
              onClick={() => setIsEditingLabel(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-[var(--sf2)] hover:bg-[var(--sf)] text-[11px] text-[var(--tx)]"
              title="Edit label"
            >
              <Edit3 size={11} className="text-[var(--mu)]" />
              <span className="truncate max-w-[80px]">
                {(edge.data as any)?.label || 'Add label'}
              </span>
            </button>
          )}
        </>
      )}

      {/* Delete Edge */}
      <button
        onClick={() => deleteEdge(edge.id)}
        className="w-7 h-7 rounded-xl bg-[var(--sf2)] hover:bg-[var(--dg)] hover:text-white grid place-items-center text-[var(--dg)] transition-colors ml-1"
        title="Delete Edge"
      >
        <Trash2 size={13} />
      </button>

      {/* Close toolbar */}
      <button
        onClick={onClose}
        className="w-6 h-6 rounded-full hover:bg-[var(--sf2)] grid place-items-center text-[var(--mu)] hover:text-[var(--tx)]"
      >
        <X size={12} />
      </button>
    </div>
  );
};
