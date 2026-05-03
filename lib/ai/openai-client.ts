import OpenAI from "openai";

const DEFAULT_MODEL = "gpt-4o-mini";

export function getOpenAIModel() {
  return process.env.OPENAI_INSPECTION_SUMMARY_MODEL?.trim() || DEFAULT_MODEL;
}

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return null;
  }

  return new OpenAI({ apiKey });
}
