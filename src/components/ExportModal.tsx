import React, { useState } from 'react';
import { X, Download, FileJson, FileText, Check, Copy } from 'lucide-react';
import { MindMapData } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  mapData: MindMapData;
  onToast: (msg: string) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  mapData,
  onToast,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onToast(`Downloaded ${filename} successfully!`);
    onClose();
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(mapData, null, 2);
    downloadFile(jsonStr, `${mapData.title.toLowerCase().replace(/\s+/g, '_')}_mindlex.json`, 'application/json');
  };

  const handleExportAnkiCsv = () => {
    // Generate CSV: Front, Back, Tags
    const rows = [['Front', 'Back', 'Tags']];
    for (const node of mapData.nodes) {
      if (node.rows) {
        const front = node.rows.de || '';
        const back = `English: ${node.rows.en || ''}<br>Arabic: ${node.rows.ar || ''}`;
        const tags = (node.foot || []).join(' ');
        rows.push([`"${front.replace(/"/g, '""')}"`, `"${back.replace(/"/g, '""')}"`, `"${tags}"`]);
      } else if (node.label) {
        rows.push([`"${node.label.replace(/"/g, '""')}"`, `"${(node.desc || '').replace(/"/g, '""')}"`, `"${node.kind}"`]);
      }
    }
    const csvContent = rows.map(r => r.join(',')).join('\n');
    downloadFile(csvContent, `${mapData.title.toLowerCase().replace(/\s+/g, '_')}_anki.csv`, 'text/csv');
  };

  const handleExportMarkdown = () => {
    let md = `# ${mapData.title}\n\n`;
    if (mapData.subtitle) md += `*${mapData.subtitle}*\n\n`;

    md += `## Vocabulary & Concepts\n\n`;
    for (const node of mapData.nodes) {
      if (node.rows) {
        md += `### ${node.rows.de || node.label}\n`;
        if (node.rows.en) md += `- **EN**: ${node.rows.en}\n`;
        if (node.rows.ar) md += `- **AR**: ${node.rows.ar}\n`;
      } else {
        md += `### [${node.kind.toUpperCase()}] ${node.label}\n`;
        if (node.desc) md += `${node.desc}\n`;
      }
      if (node.foot && node.foot.length > 0) {
        md += `*Tags: ${node.foot.join(', ')}*\n`;
      }
      md += '\n';
    }

    downloadFile(md, `${mapData.title.toLowerCase().replace(/\s+/g, '_')}_notes.md`, 'text/markdown');
  };

  const handleCopyJson = () => {
    const jsonStr = JSON.stringify(mapData, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onToast('Copied JSON data to clipboard!');
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm anim-bl"
    >
      <div
        className="w-full max-w-md p-6 rounded-3xl border shadow-2xl flex flex-col gap-4"
        style={{
          backgroundColor: 'var(--sf)',
          borderColor: 'var(--bd)',
          color: 'var(--tx)',
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">Export Mind Map</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full grid place-items-center text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--sf2)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-[var(--mu)]">
          Export &ldquo;{mapData.title}&rdquo; with all star nodes, translations, and connections.
        </p>

        <div className="flex flex-col gap-2.5">
          {/* Anki CSV */}
          <button
            onClick={handleExportAnkiCsv}
            className="flex items-center justify-between p-3.5 rounded-2xl border border-[var(--bd)] bg-[var(--sf2)] hover:border-[var(--br)] transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl grid place-items-center bg-[var(--sf)] text-[var(--rw)] group-hover:scale-105 transition-transform">
                <Download size={15} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[var(--tx)]">Anki Flashcards CSV</h4>
                <p className="text-[11px] text-[var(--mu)]">Import directly into Anki with front/back fields</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[var(--br)]">.CSV</span>
          </button>

          {/* JSON */}
          <button
            onClick={handleExportJson}
            className="flex items-center justify-between p-3.5 rounded-2xl border border-[var(--bd)] bg-[var(--sf2)] hover:border-[var(--br)] transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl grid place-items-center bg-[var(--sf)] text-[var(--en)] group-hover:scale-105 transition-transform">
                <FileJson size={15} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[var(--tx)]">MindLex JSON Map</h4>
                <p className="text-[11px] text-[var(--mu)]">Complete node coordinates and connections backup</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[var(--br)]">.JSON</span>
          </button>

          {/* Markdown */}
          <button
            onClick={handleExportMarkdown}
            className="flex items-center justify-between p-3.5 rounded-2xl border border-[var(--bd)] bg-[var(--sf2)] hover:border-[var(--br)] transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl grid place-items-center bg-[var(--sf)] text-[var(--ar)] group-hover:scale-105 transition-transform">
                <FileText size={15} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[var(--tx)]">Markdown Study Notes</h4>
                <p className="text-[11px] text-[var(--mu)]">Structured document for Obsidian, Notion, or printing</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[var(--br)]">.MD</span>
          </button>
        </div>

        <div className="pt-2 border-t border-[var(--bd)] flex items-center justify-between">
          <button
            onClick={handleCopyJson}
            className="flex items-center gap-1.5 text-xs text-[var(--mu)] hover:text-[var(--tx)] transition-colors"
          >
            {copied ? <Check size={13} className="text-[var(--ar)]" /> : <Copy size={13} />}
            <span>{copied ? 'Copied JSON!' : 'Copy raw JSON'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-[var(--sf2)] text-[var(--tx)] hover:brightness-110"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
