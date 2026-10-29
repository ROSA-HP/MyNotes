import { describe, it, expect, beforeEach } from 'vitest';
import {
  mergeExtractedNodes,
  normalizeTitle,
  truncateTitle,
} from '../server/services/mergeService';
import { NodePage, ExtractedNode } from '../shared';
import { CONFIG } from '../server/config';

describe('Merge Service - Master Specification Compliance', () => {
  let rootNode: NodePage;
  let existingNodes: NodePage[];

  beforeEach(() => {
    rootNode = {
      id: 'root_node',
      mapId: 'map_test',
      title: 'German Verbs',
      kind: 'topic',
      lang: 'de',
      summary: 'Root Topic',
      content: 'Root content',
      flashcards: [],
      tags: ['root'],
      parentId: null,
      childIds: [],
      depth: 0,
      order: 0,
      position: { x: 50, y: 250 },
      dismissedTitles: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    existingNodes = [rootNode];
  });

  // 1. Duplicate reuse
  it('should reuse existing node when normalized title matches instead of duplicating', () => {
    const existingChild: NodePage = {
      ...rootNode,
      id: 'existing_trennbare',
      title: 'Trennbare Verben',
      kind: 'concept',
      depth: 1,
      parentId: 'root_node',
      tags: ['separable'],
    };
    existingNodes.push(existingChild);

    const extracted: ExtractedNode[] = [
      {
        title: 'trennbare verben', // lowercase variation
        kind: 'concept',
        lang: 'de',
        summary: 'Updated explanation',
        parentTitle: 'German Verbs',
        tags: ['prefix'],
      },
    ];

    const result = mergeExtractedNodes(existingNodes, extracted, [], rootNode.id);

    // Should not create new node
    expect(result.createdNodeIds.length).toBe(0);
    expect(result.reusedNodeIds).toContain('existing_trennbare');
    // Existing node tags should be merged
    const updated = result.allNodes.find(n => n.id === 'existing_trennbare');
    expect(updated?.tags).toContain('separable');
    expect(updated?.tags).toContain('prefix');
  });

  // 2. Dismissed titles
  it('should drop nodes whose titles exist in the dismissed list', () => {
    const extracted: ExtractedNode[] = [
      {
        title: 'Unwanted Grammar Topic',
        kind: 'concept',
        lang: 'de',
        summary: 'Should be ignored',
        parentTitle: 'German Verbs',
      },
      {
        title: 'Valid Useful Node',
        kind: 'concept',
        lang: 'de',
        summary: 'Should be added',
        parentTitle: 'German Verbs',
      },
    ];

    const result = mergeExtractedNodes(existingNodes, extracted, [], rootNode.id, {
      dismissedTitles: ['Unwanted Grammar Topic'],
    });

    const titles = result.allNodes.map(n => n.title);
    expect(titles).not.toContain('Unwanted Grammar Topic');
    expect(titles).toContain('Valid Useful Node');
    expect(result.createdNodeIds.length).toBe(1);
  });

  // 3. One parent only
  it('should enforce exactly one parent for every node in the hierarchy', () => {
    const extracted: ExtractedNode[] = [
      {
        title: 'Child Concept A',
        kind: 'concept',
        lang: 'de',
        parentTitle: 'German Verbs',
      },
    ];

    const extraEdges = [
      { sourceTitle: 'German Verbs', targetTitle: 'Child Concept A' },
      { sourceTitle: 'Another Source', targetTitle: 'Child Concept A' },
    ];

    const result = mergeExtractedNodes(existingNodes, extracted, extraEdges, rootNode.id);
    const child = result.allNodes.find(n => n.title === 'Child Concept A');

    expect(child).toBeDefined();
    expect(child?.parentId).toBe('root_node');

    // Only one parent edge exists in primary tree
    const parentEdges = result.edges.filter(([_, tgt]) => tgt === child?.id);
    expect(parentEdges.length).toBe(1);
  });

  // 4. Max 7 children limit
  it('should prevent a parent from exceeding 7 direct children and overflow to Inbox/root', () => {
    // Populate parent with 7 children
    const parentNode: NodePage = {
      ...rootNode,
      id: 'busy_parent',
      title: 'Busy Parent',
      depth: 1,
      parentId: 'root_node',
      childIds: [],
    };
    existingNodes.push(parentNode);

    for (let i = 1; i <= 7; i++) {
      existingNodes.push({
        ...rootNode,
        id: `child_${i}`,
        title: `Existing Child ${i}`,
        depth: 2,
        parentId: 'busy_parent',
      });
      parentNode.childIds.push(`child_${i}`);
    }

    // Now extract an 8th child targeting "Busy Parent"
    const extracted: ExtractedNode[] = [
      {
        title: 'Overflow Child 8',
        kind: 'concept',
        lang: 'de',
        parentTitle: 'Busy Parent',
      },
    ];

    const result = mergeExtractedNodes(existingNodes, extracted, [], rootNode.id);
    const overflowChild = result.allNodes.find(n => n.title === 'Overflow Child 8');

    expect(overflowChild).toBeDefined();
    // Because busy_parent already has 7 children, it overflows to root/inbox!
    expect(overflowChild?.parentId).toBe('root_node');
  });

  // 5. Depth limit
  it('should enforce maximum depth limit of 5', () => {
    // Create chain depth 0 -> 1 -> 2 -> 3 -> 4 -> 5
    let prevId = rootNode.id;
    for (let d = 1; d <= 5; d++) {
      const deepNode: NodePage = {
        ...rootNode,
        id: `level_${d}`,
        title: `Level ${d} Node`,
        depth: d,
        parentId: prevId,
      };
      existingNodes.push(deepNode);
      prevId = `level_${d}`;
    }

    // Try to attach child to level_5 node
    const extracted: ExtractedNode[] = [
      {
        title: 'Beyond Max Depth',
        kind: 'concept',
        lang: 'de',
        parentTitle: 'Level 5 Node',
      },
    ];

    const result = mergeExtractedNodes(existingNodes, extracted, [], rootNode.id);
    const beyondNode = result.allNodes.find(n => n.title === 'Beyond Max Depth');

    expect(beyondNode).toBeDefined();
    expect(beyondNode?.depth).toBeLessThanOrEqual(CONFIG.MAX_DEPTH);
  });

  // 6. Orphan to Inbox
  it('should attach orphan nodes with missing or unknown parent to the Inbox/root node', () => {
    const extracted: ExtractedNode[] = [
      {
        title: 'Orphan Star Node',
        kind: 'concept',
        lang: 'de',
        parentTitle: 'Non-Existent Mystery Parent',
      },
    ];

    const result = mergeExtractedNodes(existingNodes, extracted, [], rootNode.id);
    const orphan = result.allNodes.find(n => n.title === 'Orphan Star Node');

    expect(orphan).toBeDefined();
    expect(orphan?.parentId).toBe('root_node');
  });

  // 7. Unknown edge endpoints dropped
  it('should drop edges referencing unknown source or target endpoints', () => {
    const extracted: ExtractedNode[] = [
      {
        title: 'Target Star',
        kind: 'concept',
        lang: 'de',
        parentTitle: 'German Verbs',
      },
    ];

    const extraEdges = [
      { sourceTitle: 'Target Star', targetTitle: 'Phantom Node XYZ' },
      { sourceTitle: 'Unknown Source Ghost', targetTitle: 'Target Star' },
      { sourceTitle: 'Phantom 1', targetTitle: 'Phantom 2' },
    ];

    const result = mergeExtractedNodes(existingNodes, extracted, extraEdges, rootNode.id);
    const target = result.allNodes.find(n => n.title === 'Target Star');

    // None of the phantom edges should be retained
    for (const [src, tgt] of result.edges) {
      expect(src).not.toBe('Phantom Node XYZ');
      expect(tgt).not.toBe('Phantom Node XYZ');
      expect(src).not.toBe('Unknown Source Ghost');
    }
  });

  // 8. Title truncation
  it('should truncate titles longer than MAX_TITLE_LEN cleanly', () => {
    const veryLongTitle =
      'This is an excessively long concept title that definitely exceeds sixty characters in total length';
    expect(veryLongTitle.length).toBeGreaterThan(CONFIG.MAX_TITLE_LEN);

    const truncated = truncateTitle(veryLongTitle);
    expect(truncated.length).toBeLessThanOrEqual(CONFIG.MAX_TITLE_LEN);

    const extracted: ExtractedNode[] = [
      {
        title: veryLongTitle,
        kind: 'concept',
        lang: 'de',
        parentTitle: 'German Verbs',
      },
    ];

    const result = mergeExtractedNodes(existingNodes, extracted, [], rootNode.id);
    const addedNode = result.allNodes.find(n => n.parentId === 'root_node' && n.id !== 'root_node');

    expect(addedNode).toBeDefined();
    expect(addedNode!.title.length).toBeLessThanOrEqual(CONFIG.MAX_TITLE_LEN);
    expect(addedNode!.title).toBe(truncated);
  });
});
