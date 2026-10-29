const SPEECH_CODES: Record<string, string> = {
  de: 'de-DE',
  en: 'en-US',
  ar: 'ar-SA',
};

export function speak(text: string, lang: string): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('Speech synthesis not supported in this browser.');
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = SPEECH_CODES[lang] || 'en-US';
    utterance.rate = 0.92;
    utterance.pitch = 1.0;

    // Pick best matching voice if available
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const targetLang = SPEECH_CODES[lang] || lang;
      const matched = voices.find(v => v.lang.startsWith(targetLang.split('-')[0]));
      if (matched) {
        utterance.voice = matched;
      }
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error('Failed to trigger speech synthesis:', err);
  }
}
