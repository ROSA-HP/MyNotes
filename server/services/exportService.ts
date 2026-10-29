import { MindMap, NodePage, Edge } from '../../shared';

export interface ExportData {
  contentType: string;
  filename: string;
  content: string;
}

export function exportMindMap(
  map: MindMap,
  nodes: NodePage[],
  edges: Edge[],
  format: 'json' | 'md' | 'anki'
): ExportData {
  const safeTitle = map.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'mindlex_map';

  switch (format) {
    case 'json': {
      const payload = {
        map,
        nodes,
        edges,
        exportedAt: new Date().toISOString(),
        version: '2.0.0',
      };
      return {
        contentType: 'application/json; charset=utf-8',
        filename: `${safeTitle}.json`,
        content: JSON.stringify(payload, null, 2),
      };
    }

    case 'md': {
      let md = `# ${map.title}\n\n`;
      if (map.description) {
        md += `> ${map.description}\n\n`;
      }
      md += `*Exported on ${new Date().toLocaleDateString()} · ${nodes.length} Star Nodes*\n\n---\n\n`;

      // Build hierarchical or organized outline
      const nodeById = new Map<string, NodePage>();
      nodes.forEach(n => nodeById.set(n.id, n));

      // Separate topics, rules, vocab, examples
      for (const node of nodes) {
        const indent = '#'.repeat(Math.min(4, Math.max(2, node.depth + 1)));
        md += `${indent} [${node.kind.toUpperCase()}] ${node.title} (${node.lang.toUpperCase()})\n\n`;

        if (node.summary) {
          md += `**Summary**: ${node.summary}\n\n`;
        }

        if (node.rows) {
          md += `**Vocabulary Rows**:\n`;
          if (node.rows.de) md += `- **Deutsch**: ${node.rows.de}\n`;
          if (node.rows.en) md += `- **English**: ${node.rows.en}\n`;
          if (node.rows.ar) md += `- **العربية**: ${node.rows.ar}\n`;
          md += '\n';
        }

        if (node.content) {
          md += `${node.content}\n\n`;
        }

        if (node.tags && node.tags.length > 0) {
          md += `*Tags: ${node.tags.map(t => `\`#${t}\``).join(' ')}*\n\n`;
        }

        md += `---\n\n`;
      }

      return {
        contentType: 'text/markdown; charset=utf-8',
        filename: `${safeTitle}_outline.md`,
        content: md,
      };
    }

    case 'anki': {
      // Must include UTF-8 BOM (\uFEFF) as requested!
      const BOM = '\uFEFF';
      const rows: string[] = ['Front,Back,Tags'];

      for (const node of nodes) {
        let front = '';
        let back = '';
        const tags = (node.tags || []).join(' ') || node.kind;

        if (node.rows) {
          front = node.rows.de || node.rows.ar || node.title;
          const backLines: string[] = [];
          if (node.rows.en) backLines.push(`<b>EN:</b> ${escapeHtml(node.rows.en)}`);
          if (node.rows.ar && node.rows.ar !== front) backLines.push(`<div dir="rtl"><b>AR:</b> ${escapeHtml(node.rows.ar)}</div>`);
          if (node.rows.de && node.rows.de !== front) backLines.push(`<b>DE:</b> ${escapeHtml(node.rows.de)}`);
          if (node.summary) backLines.push(`<small>${escapeHtml(node.summary)}</small>`);
          back = backLines.join('<br>');
        } else if (node.flashcards && node.flashcards.length > 0) {
          const fc = node.flashcards[0];
          front = fc.front;
          back = fc.back;
        } else {
          front = node.title;
          back = node.summary || node.content.replace(/\n/g, '<br>');
        }

        // Escape CSV double quotes
        const csvFront = `"${front.replace(/"/g, '""')}"`;
        const csvBack = `"${back.replace(/"/g, '""')}"`;
        const csvTags = `"${tags.replace(/"/g, '""')}"`;

        rows.push(`${csvFront},${csvBack},${csvTags}`);
      }

      return {
        contentType: 'text/csv; charset=utf-8',
        filename: `${safeTitle}_anki.csv`,
        content: BOM + rows.join('\r\n'),
      };
    }
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
