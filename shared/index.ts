import { z } from 'zod';

export const NodeKindSchema = z.enum(['topic', 'concept', 'rule', 'vocab', 'example']);
export type NodeKind = z.infer<typeof NodeKindSchema>;

export const LanguageCodeSchema = z.enum(['de', 'en', 'ar', 'es', 'fr', 'it', 'ja']);
export type LanguageCode = z.infer<typeof LanguageCodeSchema>;

export const VocabRowsSchema = z.object({
  de: z.string().optional(),
  en: z.string().optional(),
  ar: z.string().optional(),
  es: z.string().optional(),
  fr: z.string().optional(),
}).catchall(z.string().optional());
export type VocabRows = z.infer<typeof VocabRowsSchema>;

export const FlashcardSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).slice(2, 9)),
  front: z.string(),
  back: z.string(),
  notes: z.string().optional(),
});
export type Flashcard = z.infer<typeof FlashcardSchema>;

export const BlockTypeSchema = z.enum([
  'text',
  'bullet',
  'example',
  'vocab',
  'formula',
  'question',
  'cloze',
]);
export type BlockType = z.infer<typeof BlockTypeSchema>;

export const BlockSchema = z.object({
  id: z.string(),
  type: BlockTypeSchema.default('text'),
  content: z.string().default(''),
  indent: z.number().int().min(0).max(4).optional(),
  translation: z.string().optional(),
  vocab: VocabRowsSchema.optional(),
  example: z.object({
    sentence: z.string(),
    translation: z.string().optional(),
  }).optional(),
  formula: z.object({
    latex: z.string(),
    variables: z.array(z.object({ name: z.string(), desc: z.string() })).optional(),
    isVerified: z.boolean().optional(),
  }).optional(),
  question: z.object({
    front: z.string(),
    back: z.string(),
  }).optional(),
  variables: z.array(z.object({ name: z.string(), desc: z.string() })).optional(),
  isCard: z.boolean().optional(),
  box: z.number().optional(),
  isAiGenerated: z.boolean().optional(),
  aiSuggested: z.boolean().optional(),
});
export type Block = z.infer<typeof BlockSchema>;

export const NodePageSchema = z.object({
  id: z.string(),
  mapId: z.string(),
  title: z.string().max(120),
  kind: NodeKindSchema.default('concept'),
  lang: LanguageCodeSchema.default('de'),
  summary: z.string().optional().default(''),
  content: z.string().optional().default(''), // Full markdown note page
  blocks: z.array(BlockSchema).optional().default([]),
  rows: VocabRowsSchema.optional(),
  flashcards: z.array(FlashcardSchema).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  parentId: z.string().nullable().default(null),
  childIds: z.array(z.string()).optional().default([]),
  depth: z.number().int().min(0).default(0),
  order: z.number().int().default(0),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).default({ x: 100, y: 100 }),
  dismissedTitles: z.array(z.string()).optional().default([]),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString()),
});
export type NodePage = z.infer<typeof NodePageSchema>;

export const EdgeSchema = z.tuple([z.string(), z.string()]);
export type Edge = z.infer<typeof EdgeSchema>;

export const MindMapSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(100),
  description: z.string().optional().default(''),
  rootNodeId: z.string(),
  activeLanguages: z.array(LanguageCodeSchema).default(['de', 'en', 'ar']),
  streakDays: z.number().int().min(0).default(1),
  xp: z.number().int().min(0).default(0),
  version: z.number().int().default(1),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString()),
});
export type MindMap = z.infer<typeof MindMapSchema>;

export const IngestionSchema = z.object({
  id: z.string(),
  mapId: z.string(),
  rawText: z.string(),
  mode: z.enum(['Auto', 'Grammar', 'Vocabulary only']).default('Auto'),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).default('pending'),
  detectedLanguages: z.object({
    ar: z.number(),
    de: z.number(),
    en: z.number(),
  }).default({ ar: 0, de: 0, en: 0 }),
  extractedCount: z.number().default(0),
  createdNodeIds: z.array(z.string()).default([]),
  error: z.string().optional(),
  createdAt: z.string().default(() => new Date().toISOString()),
});
export type Ingestion = z.infer<typeof IngestionSchema>;

export const ProgressSchema = z.object({
  id: z.string(),
  mapId: z.string(),
  nodeId: z.string(),
  box: z.number().int().min(1).max(5).default(1),
  intervalDays: z.number().default(1),
  easeFactor: z.number().default(2.5),
  repetitions: z.number().int().default(0),
  dueAt: z.string().default(() => new Date().toISOString()),
  lastReviewedAt: z.string().nullable().default(null),
  reviewsCount: z.number().int().default(0),
  lapsesCount: z.number().int().default(0),
});
export type Progress = z.infer<typeof ProgressSchema>;

// Extracted node format from Gemini LLM
export const ExtractedNodeSchema = z.object({
  title: z.string(),
  kind: NodeKindSchema,
  lang: LanguageCodeSchema,
  summary: z.string().optional(),
  content: z.string().optional(),
  parentTitle: z.string().optional(),
  rows: VocabRowsSchema.optional(),
  tags: z.array(z.string()).optional(),
});
export type ExtractedNode = z.infer<typeof ExtractedNodeSchema>;

export const GeminiIngestResponseSchema = z.object({
  nodes: z.array(ExtractedNodeSchema),
  edges: z.array(z.object({
    sourceTitle: z.string(),
    targetTitle: z.string(),
    type: z.string().optional().default('hierarchical'),
    label: z.string().optional().default(''),
  })).optional().default([]),
});
export type GeminiIngestResponse = z.infer<typeof GeminiIngestResponseSchema>;

// Compact node for link suggestions
export const CompactNodeSchema = z.object({
  id: z.string(),
  title: z.string(),
  kind: NodeKindSchema,
  lang: LanguageCodeSchema,
});
export type CompactNode = z.infer<typeof CompactNodeSchema>;

export const SuggestedLinkSchema = z.object({
  sourceId: z.string(),
  targetId: z.string(),
  type: z.enum(['prerequisite', 'analogy', 'contrast', 'derivation', 'semantic']),
  label: z.string().max(30),
});
export type SuggestedLink = z.infer<typeof SuggestedLinkSchema>;

export const SuggestLinksResponseSchema = z.object({
  relations: z.array(SuggestedLinkSchema).max(8),
});
export type SuggestLinksResponse = z.infer<typeof SuggestLinksResponseSchema>;
