import { MindMap, NodePage, Ingestion, Progress } from '../../shared';
import { MindMapModel, NodePageModel, IngestionModel, ProgressModel } from './models';
import { isDbConnected } from './connection';

// In-memory backing stores
const memoryMaps = new Map<string, MindMap>();
const memoryNodes = new Map<string, NodePage>();
const memoryIngestions = new Map<string, Ingestion>();
const memoryProgress = new Map<string, Progress>();

export const dbStore = {
  // Maps
  async getMap(id: string): Promise<MindMap | null> {
    if (isDbConnected()) {
      const doc = await MindMapModel.findOne({ id }).lean();
      return doc ? (doc as unknown as MindMap) : null;
    }
    return memoryMaps.get(id) || null;
  },

  async getAllMaps(): Promise<MindMap[]> {
    if (isDbConnected()) {
      const docs = await MindMapModel.find().sort({ updatedAt: -1 }).lean();
      return docs as unknown as MindMap[];
    }
    return Array.from(memoryMaps.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  async saveMap(map: MindMap): Promise<MindMap> {
    memoryMaps.set(map.id, map);
    if (isDbConnected()) {
      await MindMapModel.findOneAndUpdate({ id: map.id }, map, { upsert: true, new: true });
    }
    return map;
  },

  async deleteMap(id: string): Promise<boolean> {
    memoryMaps.delete(id);
    for (const [nodeId, node] of memoryNodes.entries()) {
      if (node.mapId === id) memoryNodes.delete(nodeId);
    }
    if (isDbConnected()) {
      await MindMapModel.deleteOne({ id });
      await NodePageModel.deleteMany({ mapId: id });
      await IngestionModel.deleteMany({ mapId: id });
      await ProgressModel.deleteMany({ mapId: id });
    }
    return true;
  },

  // Nodes
  async getNode(id: string): Promise<NodePage | null> {
    if (isDbConnected()) {
      const doc = await NodePageModel.findOne({ id }).lean();
      return doc ? (doc as unknown as NodePage) : null;
    }
    return memoryNodes.get(id) || null;
  },

  async getNodesByMap(mapId: string): Promise<NodePage[]> {
    if (isDbConnected()) {
      const docs = await NodePageModel.find({ mapId }).lean();
      return docs as unknown as NodePage[];
    }
    return Array.from(memoryNodes.values()).filter(n => n.mapId === mapId);
  },

  async saveNode(node: NodePage): Promise<NodePage> {
    memoryNodes.set(node.id, node);
    if (isDbConnected()) {
      await NodePageModel.findOneAndUpdate({ id: node.id }, node, { upsert: true, new: true });
    }
    return node;
  },

  async saveNodes(nodes: NodePage[]): Promise<NodePage[]> {
    for (const n of nodes) {
      memoryNodes.set(n.id, n);
    }
    if (isDbConnected()) {
      for (const n of nodes) {
        await NodePageModel.findOneAndUpdate({ id: n.id }, n, { upsert: true, new: true });
      }
    }
    return nodes;
  },

  async deleteNode(id: string): Promise<boolean> {
    memoryNodes.delete(id);
    if (isDbConnected()) {
      await NodePageModel.deleteOne({ id });
      await ProgressModel.deleteMany({ nodeId: id });
    }
    return true;
  },

  // Ingestions
  async saveIngestion(ingestion: Ingestion): Promise<Ingestion> {
    memoryIngestions.set(ingestion.id, ingestion);
    if (isDbConnected()) {
      await IngestionModel.findOneAndUpdate({ id: ingestion.id }, ingestion, { upsert: true });
    }
    return ingestion;
  },

  async getIngestion(id: string): Promise<Ingestion | null> {
    if (isDbConnected()) {
      const doc = await IngestionModel.findOne({ id }).lean();
      return doc ? (doc as unknown as Ingestion) : null;
    }
    return memoryIngestions.get(id) || null;
  },

  // Progress
  async getProgressByMap(mapId: string): Promise<Progress[]> {
    if (isDbConnected()) {
      const docs = await ProgressModel.find({ mapId }).lean();
      return docs as unknown as Progress[];
    }
    return Array.from(memoryProgress.values()).filter(p => p.mapId === mapId);
  },

  async getProgressByNode(nodeId: string): Promise<Progress | null> {
    if (isDbConnected()) {
      const doc = await ProgressModel.findOne({ nodeId }).lean();
      return doc ? (doc as unknown as Progress) : null;
    }
    return memoryProgress.get(nodeId) || null;
  },

  async saveProgress(progress: Progress): Promise<Progress> {
    memoryProgress.set(progress.nodeId, progress);
    if (isDbConnected()) {
      await ProgressModel.findOneAndUpdate({ nodeId: progress.nodeId }, progress, { upsert: true });
    }
    return progress;
  },

  // Reset helper for tests
  clearMemory() {
    memoryMaps.clear();
    memoryNodes.clear();
    memoryIngestions.clear();
    memoryProgress.clear();
  },
};
