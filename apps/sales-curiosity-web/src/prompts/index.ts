export type PromptTemplate = {
  id: string;
  title: string;
  description: string;
  template: string;
};

export const PROMPTS: PromptTemplate[] = [
  {
    id: "prospecting_research",
    title: "Prospecting Research",
    description: "Research a prospect using public data and summarize insights.",
    template: `You are a sales research assistant. Using the data below, produce a concise brief:

Input context:
{{context}}

Deliverables:
- 3 key company facts
- 3 recent events (with dates if possible)
- 3 likely priorities
- 3 tailored opening angles`
  },
  {
    id: "email_opening",
    title: "Personalized Email Opening",
    description: "Draft a first-line email opener based on prospect context.",
    template: `Write a single compelling opening line for a cold email based on the context.
Constraints: 1 sentence, specific, no fluff.

Context:
{{context}}`
  },
  {
    id: "discovery_questions",
    title: "Discovery Questions",
    description: "Generate targeted discovery questions for a first call.",
    template: `Generate 6 discovery questions for a first sales call.
Constraints: Open-ended, non-leading, clear.

Persona:
{{persona}}

Context:
{{context}}`
  },
  {
    id: "call_summary",
    title: "Call Summary",
    description: "Summarize notes into a clean call recap with next steps.",
    template: `Summarize the following notes into:
- TL;DR (1-2 sentences)
- Pain points
- Impact/urgency
- Agreed next steps (owners + dates)

Notes:
{{notes}}`
  },
  {
    id: "pain_points",
    title: "Extract Pain Points",
    description: "Extract explicit and implied pain points with supporting quotes.",
    template: `From the transcript, list pain points with 1 supporting quote each.

Transcript:
{{transcript}}`
  }
];

export function renderTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/{{(.*?)}}/g, (_match, key) => variables[key.trim()] ?? "");
}


