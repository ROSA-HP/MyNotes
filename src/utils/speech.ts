// Web Speech API utility for MindLex
export function speakText(text: string, lang: 'de' | 'en' | 'ar' | string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('Web Speech API is not supported in this browser.');
    return;
  }

  // Cancel any active speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  let targetLang = 'en-US';
  if (lang === 'de' || lang === 'de-DE') targetLang = 'de-DE';
  else if (lang === 'ar' || lang === 'ar-SA') targetLang = 'ar-SA';
  else if (lang === 'en' || lang === 'en-US') targetLang = 'en-US';

  utterance.lang = targetLang;
  utterance.rate = 0.95; // Slightly measured for clear language learning

  // Try to pick a natural voice if available
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find(v => v.lang.startsWith(targetLang.slice(0, 2)));
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  window.speechSynthesis.speak(utterance);
}

export const speak = speakText;
