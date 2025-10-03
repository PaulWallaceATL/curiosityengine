export const PROMPTS = {
  prospecting_research: `You are a sales research assistant. Using the data below, produce a concise brief:\n\nInput context:\n{{context}}\n\nDeliverables:\n- 3 key company facts\n- 3 recent events (with dates if possible)\n- 3 likely priorities\n- 3 tailored opening angles`,
  email_opening: `Write a single compelling opening line for a cold email based on the context.\nConstraints: 1 sentence, specific, no fluff.\n\nContext:\n{{context}}`,
  discovery_questions: `Generate 6 discovery questions for a first sales call.\nConstraints: Open-ended, non-leading, clear.\n\nPersona:\n{{persona}}\n\nContext:\n{{context}}`,
};

export function renderPrompt(template: string, variables: Record<string, string>): string {
  return template.replace(/{{(.*?)}}/g, (_match, key) => variables[key.trim()] ?? "");
}


