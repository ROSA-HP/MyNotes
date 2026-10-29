import { GoogleGenAI } from '@google/genai';
import { CONFIG } from '../config';
import { NodePage, ExtractedNode } from '../../shared';

export type NodeToolAction = 'expand' | 'examples' | 'explain' | 'drill';

export interface NodeToolResult {
  action: NodeToolAction;
  nodeId: string;
  resultMarkdown: string;
  createdChildren?: ExtractedNode[];
}

export async function executeNodeTool(
  node: NodePage,
  action: NodeToolAction,
  targetLang: string = 'en'
): Promise<NodeToolResult> {
  const apiKey = CONFIG.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return executeLocalNodeTool(node, action, targetLang);
  }

  const prompt = `You are MindLex, an expert cognitive linguistic engine.
You are operating on a specific knowledge star node:
- Title: "${node.title}"
- Kind: "${node.kind}"
- Language: "${node.lang}"
- Summary: "${node.summary}"
- Existing Content: """${node.content}"""

Action requested: "${action}" (Target language: "${targetLang}")

If action is "expand":
Break down this node into 2-4 clear sub-concepts or sub-rules with concise titles and summaries.

If action is "examples":
Provide 3 authentic sentence examples demonstrating proper syntax, word order, and clear English & Arabic translations.

If action is "explain":
Provide a deep pedagogical explanation of this concept, highlighting common pitfalls, mnemonic memory anchors, and morphological nuances.

If action is "drill":
Provide 2 active recall flashcard drill questions with answers.

Return your response in formatted Markdown.`;

  try {
    const ai = new GoogleGenAI({ apiKey: CONFIG.GEMINI_API_KEY });
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Node tool timed out')), CONFIG.GEMINI_TIMEOUT_MS);
    });

    const callPromise = ai.models.generateContent({
      model: CONFIG.GEMINI_MODEL,
      contents: prompt,
    }).then(res => res.text || '');

    const markdownResult = await Promise.race([callPromise, timeoutPromise]);
    return {
      action,
      nodeId: node.id,
      resultMarkdown: markdownResult,
    };
  } catch (err: any) {
    console.warn(`Node tool ${action} failed with Gemini, using local generator:`, err.message);
    return executeLocalNodeTool(node, action, targetLang);
  }
}

function executeLocalNodeTool(
  node: NodePage,
  action: NodeToolAction,
  _targetLang: string
): NodeToolResult {
  const title = node.title;

  switch (action) {
    case 'expand':
      return {
        action,
        nodeId: node.id,
        resultMarkdown: `### Sub-concepts for ${title}\n\n1. **Core Rule Mechanics**: How the verb root behaves under conjugation.\n2. **Prefix Interactions**: Inseparable vs separable prefixes in main vs subordinate clauses.\n3. **Idiomatic Collocations**: Standard phrases used by native speakers.`,
        createdChildren: [
          {
            title: `${title} - Mechanics`,
            kind: 'concept',
            lang: node.lang,
            summary: `Core syntactic mechanics of ${title}`,
            parentTitle: node.title,
            tags: ['sub-rule'],
          },
          {
            title: `${title} - Common Collocations`,
            kind: 'example',
            lang: node.lang,
            summary: `Collocations and phrases with ${title}`,
            parentTitle: node.title,
            tags: ['collocation'],
          },
        ],
      };

    case 'examples':
      return {
        action,
        nodeId: node.id,
        resultMarkdown: `### Usage Examples for "${title}"\n\n1. **Gestern habe ich das Buch gekauft.**\n   - *English*: I bought the book yesterday.\n   - *Arabic*: اشتريتُ الكتاب بالأمس.\n\n2. **Er versteht die Erklärung ganz genau.**\n   - *English*: He understands the explanation perfectly.\n   - *Arabic*: هو يفهم الشرح بدقة تامة.`,
      };

    case 'explain':
      return {
        action,
        nodeId: node.id,
        resultMarkdown: `### Deep Linguistic Breakdown: ${title}\n\n- **Category**: ${node.kind.toUpperCase()}\n- **Linguistic Function**: Provides structural coherence within compound clauses.\n- **Cognitive Mnemonic**: Picture the separable prefix as a scout that leaves the main troop and takes guard at the very end of the camp (sentence end)!\n- **Cross-Lingual Comparison**: Similar to English phrasal verbs (e.g. "turn off", "get up"), but strictly bound to clause boundary syntax.`,
      };

    case 'drill':
      return {
        action,
        nodeId: node.id,
        resultMarkdown: `### Active Recall Drills for ${title}\n\n**Question 1:** In a subordinate clause with *weil*, where does the conjugated verb go?\n**Answer:** At the very end of the subordinate clause.\n\n**Question 2:** What is the Partizip II form of *${node.rows?.de || title}*?\n**Answer:** Check regular vs irregular ge- prefix pattern.`,
      };
  }
}
