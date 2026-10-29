import { MindNode } from '../types';

const COMMON_DE_WORDS = new Set([
  'der', 'die', 'das', 'dem', 'den', 'des', 'ein', 'eine', 'einen', 'einem', 'einer',
  'und', 'in', 'zu', 'den', 'mit', 'auf', 'für', 'ist', 'im', 'von', 'nicht',
  'sie', 'es', 'an', 'er', 'so', 'auch', 'als', 'an', 'nach', 'wie', 'im',
  'für', 'man', 'aber', 'aus', 'durch', 'wenn', 'nur', 'war', 'noch', 'werden',
  'haben', 'hat', 'habe', 'hast', 'hatte', 'sein', 'sind', 'bin', 'bist', 'war',
  'gestern', 'buch', 'gekauft', 'verstehen', 'stehe', 'uhr', 'verben', 'kaufen',
  'aufstehen', 'trennbare', 'dass', 'weil', 'dann', 'deutsch', 'deutsche'
]);

export interface LanguageMix {
  ar: number;
  de: number;
  en: number;
}

export function detectLanguageMix(text: string): LanguageMix {
  if (!text || text.trim().length === 0) {
    return { ar: 0, de: 0, en: 0 };
  }

  const words = text.split(/\s+/).filter(Boolean);
  let arCount = 0;
  let deCount = 0;
  let enCount = 0;

  for (const raw of words) {
    const cleaned = raw.toLowerCase().replace(/[^a-zäöüß\u0600-\u06FF]/g, '');
    if (!cleaned) continue;

    if (/[\u0600-\u06FF]/.test(cleaned)) {
      arCount++;
    } else if (/[äöüß]/.test(cleaned) || COMMON_DE_WORDS.has(cleaned)) {
      deCount++;
    } else {
      enCount++;
    }
  }

  const total = arCount + deCount + enCount || 1;
  return {
    ar: Math.round((arCount / total) * 100),
    de: Math.round((deCount / total) * 100),
    en: Math.round((enCount / total) * 100),
  };
}

/**
 * Intelligent local fallback synthesizer when AI proxy is offline or keys not configured
 */
export function synthesizeNotesLocally(
  text: string,
  mode: 'Auto' | 'Grammar' | 'Vocabulary only',
  anchorNode: MindNode
): MindNode[] {
  const generated: MindNode[] = [];
  const baseId = 'node_' + Date.now();
  const baseX = anchorNode.x + 340;
  const baseY = anchorNode.y;

  // 1. Check for German-Arabic-English vocab pattern like "الفعل verstehen يعني يفهم" or "kaufen (to buy)"
  if (text.includes('verstehen') || text.includes('يفهم') || text.includes('understand')) {
    generated.push({
      id: `${baseId}_v1`,
      kind: 'vocab',
      lang: 'de',
      x: baseX,
      y: baseY + (generated.length * 160),
      rows: {
        de: 'verstehen',
        en: 'to understand',
        ar: 'يفهم',
      },
      foot: ['irregular', 'separable: no', 'Box 1 · due today'],
      box: 1,
      dueDays: 0,
      mastery: 0,
    });
  }

  // 2. Check for sentence examples
  if (text.includes('gekauft') || text.includes('das Buch gekauft') || text.includes('bought')) {
    if (mode !== 'Vocabulary only') {
      generated.push({
        id: `${baseId}_ex1`,
        kind: 'example',
        lang: 'de',
        x: baseX + 340,
        y: baseY - 120,
        label: 'Ich habe das Buch gekauft.',
        desc: 'I bought the book. (Perfekt tense)',
        foot: ['Perfekt', 'haben + Partizip II'],
      });
    }
  }

  // 3. Check for Arabic grammar note like "الماضي التام"
  if (text.includes('الماضي التام') || text.includes('haben') || text.includes('Perfekt')) {
    if (mode !== 'Vocabulary only') {
      generated.push({
        id: `${baseId}_c1`,
        kind: 'concept',
        lang: 'ar',
        x: anchorNode.x,
        y: anchorNode.y + 220,
        label: 'الماضي التام (Das Perfekt)',
        desc: 'يُكوَّن بالفعل المساعد haben أو sein مع اسم المفعول في نهاية الجملة.',
        foot: ['قواعد زمنية', 'نهاية الجملة'],
      });
    }
  }

  // Generic fallback if user typed something arbitrary
  if (generated.length === 0) {
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const firstLine = lines[0] || 'Note Concept';
    const isArabic = /[\u0600-\u06FF]/.test(firstLine);
    const isGerman = /[äöüß]/i.test(firstLine) || COMMON_DE_WORDS.has(firstLine.split(' ')[0]?.toLowerCase());

    generated.push({
      id: `${baseId}_custom`,
      kind: mode === 'Vocabulary only' ? 'vocab' : 'concept',
      lang: isArabic ? 'ar' : isGerman ? 'de' : 'en',
      x: baseX,
      y: baseY + 80,
      label: firstLine.slice(0, 48),
      desc: lines.slice(1).join(' ').slice(0, 120) || 'Synthesized from notes.',
      rows: mode === 'Vocabulary only' ? {
        de: isGerman ? firstLine : '',
        en: !isGerman && !isArabic ? firstLine : '',
        ar: isArabic ? firstLine : '',
      } : undefined,
      foot: ['New Star', 'Extracted'],
    });
  }

  return generated;
}
