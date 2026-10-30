import { Node, Edge } from '@xyflow/react';
import { NodeKind, LanguageCode, VocabRows, Flashcard, Block } from '../../shared';

export interface MindLexNodeData extends Record<string, unknown> {
  id: string;
  mapId: string;
  title: string;
  kind: NodeKind;
  lang: LanguageCode;
  summary?: string;
  content?: string;
  blocks?: Block[];
  rows?: VocabRows;
  flashcards?: Flashcard[];
  tags?: string[];
  parentId?: string | null;
  childIds?: string[];
  depth?: number;
  order?: number;
  pinned?: boolean;
  collapsed?: boolean;
  collapsedChildCount?: number;
  blocksCount?: number;
  cardsCount?: number;
  dueCount?: number;
  isAiCreated?: boolean;
  isNew?: boolean;
  isEditingInline?: boolean;
}

export type MindLexFlowNode = Node<MindLexNodeData>;

export type RelationType = 'prerequisite' | 'analogy' | 'contrast' | 'derivation' | 'semantic' | 'related';

export interface HierarchyEdgeData extends Record<string, unknown> {
  childLang?: LanguageCode;
  isNew?: boolean;
}

export interface RelationEdgeData extends Record<string, unknown> {
  relationType: RelationType;
  label?: string;
  direction?: 'forward' | 'backward' | 'bi';
}

export interface SuggestedEdgeData extends Record<string, unknown> {
  relationType: RelationType;
  label?: string;
  score?: number;
}

export type MindLexFlowEdge = Edge<HierarchyEdgeData | RelationEdgeData | SuggestedEdgeData>;
