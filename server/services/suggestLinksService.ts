import { GoogleGenAI } from '@google/genai';
import { CONFIG } from '../config';
import {
  CompactNode,
  SuggestLinksResponse,
  SuggestLinksResponseSchema,
  SuggestedLink,
} from '../../shared';

export async function suggestCrossLinks(
  compactNodes: CompactNode[]
): Promise<SuggestLinksResponse> {
  if (!compactNodes || compactNodes.length < 2) {
    return { relations: [] };
  }

  const apiKey = CONFIG.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return generateLocalSuggestedLinks(compactNodes);
  }

  // Minimize prompt footprint: model only sees compact nodes!
  const prompt = `You are a knowledge graph link-prediction assistant for a multilingual language learning constellation map.
You are given a compact list of nodes:
${JSON.stringify(compactNodes, null, 2)}

Identify cross-cutting semantic links between these nodes.
Rules:
1. Return relations ONLY when strongly implied by grammar, semantics, or learning prerequisites.
2. Max 8 total relations.
3. Every relation must have:
   - "sourceId": exact node id from the list
   - "targetId": exact node id from the list
   - "type": "prerequisite" | "analogy" | "contrast" | "derivation" | "semantic"
   - "label": short human readable link description (max 30 chars)
4. Do NOT link a node to itself.

Return ONLY a JSON object:
{
  "relations": [
    { "sourceId": "...", "targetId": "...", "type": "...", "label": "..." }
  ]
}`;

  try {
    const ai = new GoogleGenAI({ apiKey: CONFIG.GEMINI_API_KEY });
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error('Suggest-links timed out')),
        CONFIG.GEMINI_TIMEOUT_MS
      );
    });

    const callPromise = ai.models.generateContent({
      model: CONFIG.GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    }).then(res => res.text || '{}');

    const result = await Promise.race([callPromise, timeoutPromise]);
    const parsed = JSON.parse(result);
    const validated = SuggestLinksResponseSchema.parse(parsed);

    // Verify all source and target IDs exist in compactNodes
    const validNodeIds = new Set(compactNodes.map(n => n.id));
    const safeRelations = validated.relations
      .filter(r => validNodeIds.has(r.sourceId) && validNodeIds.has(r.targetId) && r.sourceId !== r.targetId)
      .slice(0, CONFIG.MAX_SUGGEST_LINKS);

    return { relations: safeRelations };
  } catch (err: any) {
    console.warn('Suggest links Gemini call failed, using heuristic linker:', err.message);
    return generateLocalSuggestedLinks(compactNodes);
  }
}

/**
 * Deterministic local semantic linker when offline
 */
export function generateLocalSuggestedLinks(nodes: CompactNode[]): SuggestLinksResponse {
  const relations: SuggestedLink[] = [];
  const nodeIds = new Set(nodes.map(n => n.id));

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (relations.length >= CONFIG.MAX_SUGGEST_LINKS) break;

      const a = nodes[i];
      const b = nodes[j];

      // Example 1: German vocab linked to concept about separable verbs
      if (
        (a.title.includes('aufstehen') && b.title.includes('Trennbare')) ||
        (b.title.includes('aufstehen') && a.title.includes('Trennbare'))
      ) {
        relations.push({
          sourceId: a.title.includes('Trennbare') ? a.id : b.id,
          targetId: a.title.includes('aufstehen') ? a.id : b.id,
          type: 'semantic',
          label: 'separable prefix instance',
        });
      }

      // Example 2: Arabic concept linked to German rule (analogy)
      if (
        (a.lang === 'ar' && b.lang === 'de' && a.title.includes('الفصل')) ||
        (b.lang === 'ar' && a.lang === 'de' && b.title.includes('الفصل'))
      ) {
        relations.push({
          sourceId: a.lang === 'de' ? a.id : b.id,
          targetId: a.lang === 'ar' ? a.id : b.id,
          type: 'analogy',
          label: 'cross-lingual counterpart',
        });
      }
    }
  }

  return { relations: relations.slice(0, CONFIG.MAX_SUGGEST_LINKS) };
}
