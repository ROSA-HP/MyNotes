import { CONFIG } from '../config';

export interface PreParsedResult {
  cleanedText: string;
  charCount: number;
  wordCount: number;
  languages: {
    ar: number;
    de: number;
    en: number;
  };
  dominantLang: 'ar' | 'de' | 'en';
  isTruncated: boolean;
  preliminaryVocabulary: Array<{ term: string; lang: 'ar' | 'de' | 'en' }>;
}

const COMMON_DE_WORDS = new Set([
  'der', 'die', 'das', 'dem', 'den', 'des', 'ein', 'eine', 'einen', 'einem', 'einer',
  'und', 'in', 'zu', 'den', 'mit', 'auf', 'für', 'ist', 'im', 'von', 'nicht',
  'sie', 'es', 'an', 'er', 'so', 'auch', 'als', 'an', 'nach', 'wie', 'im',
  'für', 'man', 'aber', 'aus', 'durch', 'wenn', 'nur', 'war', 'noch', 'werden',
  'haben', 'hat', 'habe', 'hast', 'hatte', 'sein', 'sind', 'bin', 'bist', 'war',
  'gestern', 'buch', 'gekauft', 'verstehen', 'stehe', 'uhr', 'verben', 'kaufen',
  'aufstehen', 'trennbare', 'dass', 'weil', 'dann'
]);

export function preParseText(rawInput: string): PreParsedResult {
  if (!rawInput || typeof rawInput !== 'string') {
    throw new Error('Input text must be a valid non-empty string');
  }

  let text = rawInput.replace(/\r\n/g, '\n').trim();
  let isTruncated = false;

  if (text.length > CONFIG.MAX_INGEST_CHARS) {
    text = text.slice(0, CONFIG.MAX_INGEST_CHARS);
    isTruncated = true;
  }

  const words = text.split(/\s+/).filter(Boolean);
  let arCount = 0;
  let deCount = 0;
  let enCount = 0;
  const vocabFound: Array<{ term: string; lang: 'ar' | 'de' | 'en' }> = [];

  for (const rawWord of words) {
    const cleaned = rawWord.toLowerCase().replace(/[^a-zäöüß\u0600-\u06FF]/g, '');
    if (!cleaned) continue;

    if (/[\u0600-\u06FF]/.test(cleaned)) {
      arCount++;
      if (cleaned.length > 2 && vocabFound.length < 10) {
        vocabFound.push({ term: rawWord, lang: 'ar' });
      }
    } else if (/[äöüß]/.test(cleaned) || COMMON_DE_WORDS.has(cleaned)) {
      deCount++;
      if (cleaned.length > 3 && vocabFound.length < 10) {
        vocabFound.push({ term: rawWord, lang: 'de' });
      }
    } else {
      enCount++;
    }
  }

  const total = arCount + deCount + enCount || 1;
  const pAr = Math.round((arCount / total) * 100);
  const pDe = Math.round((deCount / total) * 100);
  const pEn = Math.max(0, 100 - (pAr + pDe));

  let dominantLang: 'ar' | 'de' | 'en' = 'de';
  if (pAr > pDe && pAr > pEn) dominantLang = 'ar';
  else if (pEn > pDe && pEn > pAr) dominantLang = 'en';

  return {
    cleanedText: text,
    charCount: text.length,
    wordCount: words.length,
    languages: {
      ar: pAr,
      de: pDe,
      en: pEn,
    },
    dominantLang,
    isTruncated,
    preliminaryVocabulary: vocabFound,
  };
}
