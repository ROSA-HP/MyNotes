export type NodeKind = 'topic' | 'rule' | 'concept' | 'vocab' | 'example';
export type LanguageCode = 'de' | 'en' | 'ar';

export interface MindNode {
  id: string;
  kind: NodeKind;
  lang: LanguageCode;
  x: number;
  y: number;
  label?: string;
  desc?: string;
  rows?: {
    de?: string;
    en?: string;
    ar?: string;
    [key: string]: string | undefined;
  };
  foot?: string[];
  note?: string;
  mastery?: number; // 0-100%
  box?: number; // 1-5 Leitner box
  dueDays?: number;
}

export type Edge = [string, string]; // [sourceId, targetId]

export interface MindMapData {
  id: string;
  title: string;
  subtitle?: string;
  nodes: MindNode[];
  edges: Edge[];
  streakDays: number;
  xp: number;
  updatedAt: string;
}

export interface PaletteItem {
  t: string; // Title / label
  k: string; // Kind or badge
  l?: LanguageCode;
  f: () => void;
}
