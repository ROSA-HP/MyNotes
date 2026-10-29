import React, { useState } from 'react';
import { X, Plus, MapPin, Check, Trash2 } from 'lucide-react';
import { MindMapData } from '../types';

interface MapsDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  maps: MindMapData[];
  activeMapId: string;
  onSelectMap: (id: string) => void;
  onCreateMap: (title: string) => void;
  onDeleteMap: (id: string) => void;
}

export const MapsDirectoryModal: React.FC<MapsDirectoryModalProps> = ({
  isOpen,
  onClose,
  maps,
  activeMapId,
  onSelectMap,
  onCreateMap,
  onDeleteMap,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateMap(newTitle.trim());
    setNewTitle('');
    setIsCreating(false);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm anim-bl"
    >
      <div
        className="w-full max-w-lg p-6 rounded-3xl border shadow-2xl flex flex-col gap-4"
        style={{
          backgroundColor: 'var(--sf)',
          borderColor: 'var(--bd)',
          color: 'var(--tx)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold">Mind Maps Library</h2>
            <p className="text-xs text-[var(--mu)]">
              Switch or create celestial knowledge maps
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full grid place-items-center text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--sf2)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Maps List */}
        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
          {maps.map((m) => {
            const isActive = m.id === activeMapId;
            return (
              <div
                key={m.id}
                onClick={() => {
                  onSelectMap(m.id);
                  onClose();
                }}
                className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  isActive
                    ? 'border-[var(--br)] bg-[var(--sf2)] shadow-sm'
                    : 'border-[var(--bd)] hover:bg-[var(--sf2)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl grid place-items-center text-xs font-bold"
                    style={{
                      backgroundColor: isActive ? 'var(--br)' : 'var(--sf2)',
                      color: isActive ? '#fff' : 'var(--mu)',
                    }}
                  >
                    <MapPin size={14} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--tx)]">{m.title}</h3>
                    <p className="text-xs text-[var(--mu)] font-metric">
                      {m.nodes.length} stars · {m.edges.length} connections · {m.xp} XP
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isActive ? (
                    <span className="flex items-center gap-1 text-xs font-metric text-[var(--ar)] font-semibold">
                      <Check size={14} /> Active
                    </span>
                  ) : maps.length > 1 ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteMap(m.id);
                      }}
                      className="text-[var(--mu)] hover:text-[var(--dg)] p-1 transition-colors"
                      title="Delete Map"
                    >
                      <Trash2 size={13} />
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* Create Map Section */}
        {isCreating ? (
          <form onSubmit={handleCreate} className="flex gap-2 pt-2 border-t border-[var(--bd)]">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. French Subjunctive Mood"
              autoFocus
              className="flex-1 text-xs bg-[var(--sf2)] border border-[var(--bd)] rounded-xl p-2 outline-none text-[var(--tx)] focus:border-[var(--br)]"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md hover:brightness-110"
              style={{ backgroundColor: 'var(--br)' }}
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-[var(--mu)] bg-[var(--sf2)]"
            >
              Cancel
            </button>
          </form>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-[var(--bd)] text-xs font-semibold text-[var(--tx)] hover:bg-[var(--sf2)] transition-colors"
          >
            <Plus size={14} />
            <span>Create New Constellation Map</span>
          </button>
        )}
      </div>
    </div>
  );
};
