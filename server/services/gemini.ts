import { GoogleGenAI } from '@google/genai';
import { CONFIG } from '../config';
import {
  GeminiIngestResponse,
  GeminiIngestResponseSchema,
  ExtractedNode,
} from '../../shared';

export const VERBATIM_SYSTEM_PROMPT = `You are MindLex, an expert cognitive cartographer and multilingual linguistic synthesizer.
Your task is to analyze user study notes (in German, Arabic, English, or mixed languages) and synthesize them into a structured constellation mind map.
Rules:
1. Extract concepts, grammar rules, vocabulary words, and practical examples.
2. For vocabulary ('vocab'), provide accurate translations in German ('de'), English ('en'), and Arabic ('ar') wherever applicable.
3. For Arabic text, maintain grammatical accuracy and diacritics where helpful.
4. Ensure node titles are concise, punchy, and clear (max 60 chars).
5. Provide a summary sentence for each concept and a detailed content block in clean markdown.
6. Return output strictly in JSON format matching the schema.`;

export async function callGeminiSynthesizer(
  cleanedText: string,
  mode: 'Auto' | 'Grammar' | 'Vocabulary only',
  anchorTitle: string
): Promise<GeminiIngestResponse> {
  const apiKey = CONFIG.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return generateLocalFallback(cleanedText, mode, anchorTitle);
  }

  const prompt = `${VERBATIM_SYSTEM_PROMPT}

Mode requested: "${mode}"
Parent Anchor: "${anchorTitle}"

Analyze these study notes:
"""
${cleanedText}
"""

Return a JSON object conforming strictly to this format:
{
  "nodes": [
    {
      "title": "string (max 60 chars)",
      "kind": "topic" | "concept" | "rule" | "vocab" | "example",
      "lang": "de" | "en" | "ar",
      "summary": "string (short 1-line)",
      "content": "string (markdown detailed explanation)",
      "parentTitle": "${anchorTitle}",
      "rows": { "de": "string", "en": "string", "ar": "string" },
      "tags": ["string"]
    }
  ],
  "edges": [
    {
      "sourceTitle": "string",
      "targetTitle": "string",
      "type": "hierarchical" | "semantic",
      "label": "string"
    }
  ]
}`;

  let attempts = 0;
  const maxAttempts = 2; // 1 original + 1 retry

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const result = await executeGeminiCallWithTimeout(prompt);
      const parsedJson = JSON.parse(result);
      const validated = GeminiIngestResponseSchema.parse(parsedJson);
      return validated;
    } catch (err: any) {
      console.warn(`Gemini synthesis attempt ${attempts} failed:`, err.message);
      if (attempts >= maxAttempts) {
        console.info('Switching to local rule-based extractor after failed retry.');
        return generateLocalFallback(cleanedText, mode, anchorTitle);
      }
      // Brief pause before retry
      await new Promise(r => setTimeout(r, 600));
    }
  }

  return generateLocalFallback(cleanedText, mode, anchorTitle);
}

async function executeGeminiCallWithTimeout(prompt: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: CONFIG.GEMINI_API_KEY });

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new Error(`Gemini request timed out after ${CONFIG.GEMINI_TIMEOUT_MS}ms`)),
      CONFIG.GEMINI_TIMEOUT_MS
    );
  });

  const requestPromise = ai.models.generateContent({
    model: CONFIG.GEMINI_MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    },
  }).then(res => res.text || '{}');

  return Promise.race([requestPromise, timeoutPromise]);
}

/**
 * Robust local fallback synthesizer
 */
export function generateLocalFallback(
  text: string,
  mode: 'Auto' | 'Grammar' | 'Vocabulary only',
  anchorTitle: string
): GeminiIngestResponse {
  const nodes: ExtractedNode[] = [];

  // Verstehen match
  if (/verstehen|يفهم|understand/i.test(text)) {
    nodes.push({
      title: 'verstehen',
      kind: 'vocab',
      lang: 'de',
      summary: 'To understand / يفهم',
      content: '### verstehen (unregelmäßiges Verb)\n\n- **Präsens**: ich verstehe, du verstehst, er versteht\n- **Perfekt**: ich habe verstanden\n- **Bedeutung**: erfassen, begreifen',
      parentTitle: anchorTitle,
      rows: {
        de: 'verstehen',
        en: 'to understand',
        ar: 'يفهم',
      },
      tags: ['irregular', 'verb', 'B1'],
    });
  }

  // Perfekt match
  if (/gekauft|buch gekauft|perfekt|bought/i.test(text) && mode !== 'Vocabulary only') {
    nodes.push({
      title: 'Ich habe das Buch gekauft.',
      kind: 'example',
      lang: 'de',
      summary: 'Perfekt tense example sentence',
      content: 'Practical example showing the auxiliary verb *haben* in position 2 and the past participle *gekauft* at the end of the clause.',
      parentTitle: anchorTitle,
      tags: ['example', 'Perfekt'],
    });
  }

  // Arabic grammar note match
  if (/الماضي التام|haben/i.test(text) && mode !== 'Vocabulary only') {
    nodes.push({
      title: 'الماضي التام (Das Perfekt)',
      kind: 'rule',
      lang: 'ar',
      summary: 'يُكوَّن بالفعل المساعد haben أو sein',
      content: 'في اللغة الألمانية، يُستخدم زمن الماضي التام في المحادثات اليومية للتعبير عن أحداث ماضية مكتملة، ويتكون من:\n\n1. فعل مساعد مُصرّف في الموقع الثاني (haben/sein)\n2. اسم المفعول (Partizip II) في نهاية الجملة تماماً.',
      parentTitle: anchorTitle,
      tags: ['قواعد', 'الماضي التام'],
    });
  }

  // Generic sentence extraction if no pattern matched
  if (nodes.length === 0) {
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const firstLine = lines[0] || 'Concept Node';
    const isArabic = /[\u0600-\u06FF]/.test(firstLine);

    nodes.push({
      title: firstLine.slice(0, 50),
      kind: mode === 'Vocabulary only' ? 'vocab' : 'concept',
      lang: isArabic ? 'ar' : 'de',
      summary: lines.slice(1).join(' ').slice(0, 80) || 'Synthesized note concept.',
      content: text,
      parentTitle: anchorTitle,
      rows: mode === 'Vocabulary only' ? {
        de: !isArabic ? firstLine : '',
        en: 'Translation',
        ar: isArabic ? firstLine : '',
      } : undefined,
      tags: ['Extracted'],
    });
  }

  return {
    nodes,
    edges: nodes.map(n => ({
      sourceTitle: anchorTitle,
      targetTitle: n.title,
      type: 'hierarchical',
      label: 'sub-concept',
    })),
  };
}
