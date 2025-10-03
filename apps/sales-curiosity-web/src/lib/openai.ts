import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn('OPENAI_API_KEY is not set');
}

export const openai = new OpenAI({ apiKey: apiKey || '' });


