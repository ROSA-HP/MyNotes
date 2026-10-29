import dagre from 'dagre';
import { MindLexFlowNode, MindLexFlowEdge } from '../types/canvas';

export function layoutWithDagre(
  nodes: MindLexFlowNode[],
  edges: MindLexFlowEdge[],
  unpinAll: boolean = false
): MindLexFlowNode[] {
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: 'LR', // Left to Right hierarchy
    nodesep: 40,
    ranksep: 100,
    marginx: 40,
    marginy: 40,
  });
  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes to graph
  for (const node of nodes) {
    const width = node.type === 'topic' ? 360 : 280;
    const height = 150;
    g.setNode(node.id, { width, height });
  }

  // Hierarchy edges ONLY! Relation edges never affect layout.
  for (const edge of edges) {
    if (edge.type === 'hierarchy' || !edge.type) {
      g.setEdge(edge.source, edge.target);
    }
  }

  dagre.layout(g);

  return nodes.map((node) => {
    // If pinned and not forcing unpin, keep current position
    if (node.data.pinned && !unpinAll) {
      return node;
    }

    const nodeWithPos = g.node(node.id);
    if (!nodeWithPos) return node;

    const width = node.type === 'topic' ? 360 : 280;
    const height = 150;

    return {
      ...node,
      position: {
        x: Math.round(nodeWithPos.x - width / 2),
        y: Math.round(nodeWithPos.y - height / 2),
      },
      data: {
        ...node.data,
        pinned: unpinAll ? false : node.data.pinned,
      },
    };
  });
}
