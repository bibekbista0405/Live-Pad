import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: 3000,
  host: '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  isProduction: process.env.NODE_ENV === 'production'
};
