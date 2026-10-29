import mongoose, { Schema, Document } from 'mongoose';
import { NodeKind, LanguageCode } from '../../shared';

export interface IMindMap extends Document {
  id: string;
  title: string;
  description?: string;
  rootNodeId: string;
  activeLanguages: LanguageCode[];
  streakDays: number;
  xp: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const MindMapMongooseSchema = new Schema<IMindMap>(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    rootNodeId: { type: String, required: true },
    activeLanguages: { type: [String], default: ['de', 'en', 'ar'] },
    streakDays: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export interface INodePage extends Document {
  id: string;
  mapId: string;
  title: string;
  kind: NodeKind;
  lang: LanguageCode;
  summary: string;
  content: string;
  rows?: Record<string, string>;
  flashcards: Array<{ id: string; front: string; back: string; notes?: string }>;
  tags: string[];
  parentId: string | null;
  childIds: string[];
  depth: number;
  order: number;
  position: { x: number; y: number };
  dismissedTitles: string[];
  createdAt: Date;
  updatedAt: Date;
}

const NodePageMongooseSchema = new Schema<INodePage>(
  {
    id: { type: String, required: true, unique: true, index: true },
    mapId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    kind: { type: String, required: true, default: 'concept' },
    lang: { type: String, required: true, default: 'de' },
    summary: { type: String, default: '' },
    content: { type: String, default: '' },
    rows: { type: Map, of: String },
    flashcards: [
      {
        id: String,
        front: String,
        back: String,
        notes: String,
      },
    ],
    tags: { type: [String], default: [] },
    parentId: { type: String, default: null, index: true },
    childIds: { type: [String], default: [] },
    depth: { type: Number, default: 0 },
    order: { type: Number, default: 0 },
    position: {
      x: { type: Number, default: 100 },
      y: { type: Number, default: 100 },
    },
    dismissedTitles: { type: [String], default: [] },
  },
  { timestamps: true }
);

export interface IIngestion extends Document {
  id: string;
  mapId: string;
  rawText: string;
  mode: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  detectedLanguages: { ar: number; de: number; en: number };
  extractedCount: number;
  createdNodeIds: string[];
  error?: string;
  createdAt: Date;
}

const IngestionMongooseSchema = new Schema<IIngestion>(
  {
    id: { type: String, required: true, unique: true, index: true },
    mapId: { type: String, required: true, index: true },
    rawText: { type: String, required: true },
    mode: { type: String, default: 'Auto' },
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
    detectedLanguages: {
      ar: { type: Number, default: 0 },
      de: { type: Number, default: 0 },
      en: { type: Number, default: 0 },
    },
    extractedCount: { type: Number, default: 0 },
    createdNodeIds: { type: [String], default: [] },
    error: { type: String },
  },
  { timestamps: true }
);

export interface IProgress extends Document {
  id: string;
  mapId: string;
  nodeId: string;
  box: number;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  dueAt: Date;
  lastReviewedAt: Date | null;
  reviewsCount: number;
  lapsesCount: number;
}

const ProgressMongooseSchema = new Schema<IProgress>(
  {
    id: { type: String, required: true, unique: true, index: true },
    mapId: { type: String, required: true, index: true },
    nodeId: { type: String, required: true, index: true },
    box: { type: Number, default: 1 },
    intervalDays: { type: Number, default: 1 },
    easeFactor: { type: Number, default: 2.5 },
    repetitions: { type: Number, default: 0 },
    dueAt: { type: Date, default: Date.now },
    lastReviewedAt: { type: Date, default: null },
    reviewsCount: { type: Number, default: 0 },
    lapsesCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const MindMapModel = mongoose.models.MindMap || mongoose.model<IMindMap>('MindMap', MindMapMongooseSchema);
export const NodePageModel = mongoose.models.NodePage || mongoose.model<INodePage>('NodePage', NodePageMongooseSchema);
export const IngestionModel = mongoose.models.Ingestion || mongoose.model<IIngestion>('Ingestion', IngestionMongooseSchema);
export const ProgressModel = mongoose.models.Progress || mongoose.model<IProgress>('Progress', ProgressMongooseSchema);
