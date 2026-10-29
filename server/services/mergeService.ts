import { NodePage, ExtractedNode, Edge } from '../../shared';
import { CONFIG } from '../config';

export interface MergeResult {
  allNodes: NodePage[];
  createdNodeIds: string[];
  reusedNodeIds: string[];
  edges: Edge[];
}

export interface MergeOptions {
  dismissedTitles?: string[];
  inboxNodeId?: string;
  defaultMapId?: string;
}

/**
 * Normalizes title for case-insensitive and whitespace comparison
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.,:;!?]+$/, '');
}

/**
 * Truncates title to max allowed length cleanly
 */
export function truncateTitle(title: string, maxLen: number = CONFIG.MAX_TITLE_LEN): string {
  const trimmed = title.trim();
  if (trimmed.length <= maxLen) return trimmed;
  // Try to truncate at a word boundary
  const sliced = trimmed.slice(0, maxLen);
  const lastSpace = sliced.lastIndexOf(' ');
  if (lastSpace > maxLen * 0.7) {
    return sliced.slice(0, lastSpace).trim();
  }
  return sliced.trim();
}

/**
 * The core Merge Service adhering strictly to the Master Specification
 */
export function mergeExtractedNodes(
  existingNodes: NodePage[],
  extractedNodes: ExtractedNode[],
  extractedEdges: Array<{ sourceTitle: string; targetTitle: string; type?: string; label?: string }> = [],
  rootNodeId: string,
  options: MergeOptions = {}
): MergeResult {
  const mapId = existingNodes[0]?.mapId || options.defaultMapId || 'default_map';
  const dismissedSet = new Set(
    (options.dismissedTitles || []).map(normalizeTitle)
  );

  // Collect any dismissed titles stored on existing nodes as well
  for (const en of existingNodes) {
    if (en.dismissedTitles && Array.isArray(en.dismissedTitles)) {
      en.dismissedTitles.forEach(t => dismissedSet.add(normalizeTitle(t)));
    }
  }

  // Find root or Inbox node
  let rootNode = existingNodes.find(n => n.id === rootNodeId);
  if (!rootNode) {
    rootNode = existingNodes[0];
  }
  const inboxNode = options.inboxNodeId
    ? existingNodes.find(n => n.id === options.inboxNodeId) || rootNode
    : rootNode;

  const nodeMap = new Map<string, NodePage>();
  const titleToNode = new Map<string, NodePage>();

  // Index existing nodes
  for (const n of existingNodes) {
    nodeMap.set(n.id, { ...n, childIds: [...n.childIds] });
    titleToNode.set(normalizeTitle(n.title), nodeMap.get(n.id)!);
  }

  const createdNodeIds: string[] = [];
  const reusedNodeIds: string[] = [];

  // Track parent -> children count for MAX_CHILDREN limit enforcement
  const parentChildrenMap = new Map<string, Set<string>>();
  for (const n of nodeMap.values()) {
    if (n.parentId) {
      if (!parentChildrenMap.has(n.parentId)) {
        parentChildrenMap.set(n.parentId, new Set());
      }
      parentChildrenMap.get(n.parentId)!.add(n.id);
    }
  }

  // Helper to determine node depth
  const getNodeDepth = (nodeId: string | null): number => {
    if (!nodeId) return 0;
    const parent = nodeMap.get(nodeId);
    if (!parent) return 0;
    return parent.depth + 1;
  };

  // Helper to pick valid parent with max 7 children limit
  const assignParent = (childId: string, candidateParentId: string | null): string => {
    const fallbackId = inboxNode ? inboxNode.id : rootNodeId;
    let targetParentId = candidateParentId || fallbackId;

    if (!nodeMap.has(targetParentId)) {
      targetParentId = fallbackId;
    }

    // Check depth limit
    const targetDepth = getNodeDepth(targetParentId);
    if (targetDepth >= CONFIG.MAX_DEPTH) {
      // Find parent at max allowed depth or fallback to root
      targetParentId = fallbackId;
    }

    // Check max 7 children limit
    const existingChildren = parentChildrenMap.get(targetParentId) || new Set();
    if (existingChildren.size >= CONFIG.MAX_CHILDREN && !existingChildren.has(childId)) {
      // Parent is full (7 children max), overflow to inbox or root
      targetParentId = fallbackId;
    }

    // Record relationship
    if (!parentChildrenMap.has(targetParentId)) {
      parentChildrenMap.set(targetParentId, new Set());
    }
    parentChildrenMap.get(targetParentId)!.add(childId);

    return targetParentId;
  };

  // Process extracted nodes
  for (const raw of extractedNodes) {
    // 1. Truncate title
    const cleanTitle = truncateTitle(raw.title);
    const norm = normalizeTitle(cleanTitle);

    // 2. Dismissed titles: do not recreate
    if (dismissedSet.has(norm)) {
      continue;
    }

    // 3. Duplicate reuse
    if (titleToNode.has(norm)) {
      const existing = titleToNode.get(norm)!;
      reusedNodeIds.push(existing.id);

      // Merge additional tags or flashcards if present
      if (raw.tags && raw.tags.length > 0) {
        const mergedTags = Array.from(new Set([...existing.tags, ...raw.tags]));
        existing.tags = mergedTags;
      }
      if (raw.rows) {
        existing.rows = { ...(existing.rows || {}), ...raw.rows };
      }
      continue;
    }

    // Resolve parent node
    let candidateParentId: string | null = null;
    if (raw.parentTitle) {
      const normParent = normalizeTitle(raw.parentTitle);
      const foundParent = titleToNode.get(normParent);
      if (foundParent) {
        candidateParentId = foundParent.id;
      }
    }

    const newId = `node_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const finalParentId = assignParent(newId, candidateParentId);
    const parentNode = nodeMap.get(finalParentId);

    const calcDepth = parentNode ? parentNode.depth + 1 : 1;
    const boundedDepth = Math.min(calcDepth, CONFIG.MAX_DEPTH);

    // Compute coordinate layout
    const siblingCount = (parentChildrenMap.get(finalParentId) || new Set()).size;
    const parentX = parentNode ? parentNode.position.x : 50;
    const parentY = parentNode ? parentNode.position.y : 250;

    const posX = parentX + 320;
    const posY = parentY + (siblingCount - 1) * 120;

    const newNode: NodePage = {
      id: newId,
      mapId,
      title: cleanTitle,
      kind: raw.kind,
      lang: raw.lang,
      summary: raw.summary || '',
      content: raw.content || '',
      rows: raw.rows,
      flashcards: [],
      tags: raw.tags || [],
      parentId: finalParentId, // One parent only!
      childIds: [],
      depth: boundedDepth,
      order: siblingCount,
      position: { x: posX, y: posY },
      dismissedTitles: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    nodeMap.set(newId, newNode);
    titleToNode.set(norm, newNode);
    createdNodeIds.push(newId);

    // Update parent's childIds
    if (parentNode && !parentNode.childIds.includes(newId)) {
      parentNode.childIds.push(newId);
    }
  }

  // Construct edges and filter out any unknown endpoints
  const validEdges: Edge[] = [];
  const edgeSet = new Set<string>();

  // 1. Primary hierarchical edges (one parent per child)
  for (const n of nodeMap.values()) {
    if (n.parentId && nodeMap.has(n.parentId)) {
      const edgeKey = `${n.parentId}->${n.id}`;
      if (!edgeSet.has(edgeKey)) {
        edgeSet.add(edgeKey);
        validEdges.push([n.parentId, n.id]);
      }
    }
  }

  // 2. Extra semantic edges suggested from extractedEdges
  for (const extra of extractedEdges) {
    const sNode = titleToNode.get(normalizeTitle(extra.sourceTitle));
    const tNode = titleToNode.get(normalizeTitle(extra.targetTitle));

    // Unknown edge endpoints dropped!
    if (!sNode || !tNode) {
      continue;
    }
    if (sNode.id === tNode.id) continue;

    const edgeKey = `${sNode.id}->${tNode.id}`;
    if (!edgeSet.has(edgeKey)) {
      edgeSet.add(edgeKey);
      validEdges.push([sNode.id, tNode.id]);
    }
  }

  return {
    allNodes: Array.from(nodeMap.values()),
    createdNodeIds,
    reusedNodeIds,
    edges: validEdges,
  };
}
