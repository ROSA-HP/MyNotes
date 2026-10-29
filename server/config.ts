import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  PORT: Number(process.env.PORT || 3000),
  MONGODB_URI: process.env.MONGODB_URI || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',

  // Master Spec Constraints
  MAX_CHILDREN: 7,
  MAX_DEPTH: 5,
  MAX_TITLE_LEN: 60,
  MAX_SUGGEST_LINKS: 8,
  GEMINI_TIMEOUT_MS: 30000, // 30 seconds
  MAX_INGEST_CHARS: 20000,
};
