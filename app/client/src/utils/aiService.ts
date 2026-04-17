/**
 * GenSmith AI Service — multi-provider + conversation history edition
 *
 * Configuration in `app/client/.env`:
 *   REACT_APP_AI_GEMINI_KEY=AIza...
 *   REACT_APP_AI_GEMINI_MODEL=gemini-2.5-flash-preview-04-17  (optional)
 *   REACT_APP_AI_QWEN_KEY=sk-...
 *   REACT_APP_AI_QWEN_MODEL=qwen3-235b-a22b                   (optional)
 *   REACT_APP_AI_DEEPSEEK_KEY=sk-...
 *   REACT_APP_AI_DEEPSEEK_MODEL=deepseek-chat                 (optional)
 *   REACT_APP_AI_OPENAI_KEY=sk-...
 *   REACT_APP_AI_OPENAI_MODEL=gpt-4o                         (optional)
 *
 * All configured providers appear in the GenSmith toolbar dropdown.
 */

import { objectKeys } from "@appsmith/utils";
import type { NestedDSL } from "@shared/dsl";
import type { WidgetProps } from "widgets/BaseWidget";

// ---------------------------------------------------------------------------
// Provider registry
// ---------------------------------------------------------------------------

export type AiProvider = "openai" | "gemini" | "qwen" | "deepseek";

export const PROVIDER_LABELS: Record<AiProvider, string> = {
  openai: "GPT",
  gemini: "Gemini",
  qwen: "通义千问",
  deepseek: "DeepSeek",
};

interface ProviderDefaults {
  url: string;
  model: string;
  envKey: string;
  envModel: string;
}

const PROVIDER_DEFAULTS: Record<AiProvider, ProviderDefaults> = {
  openai: {
    url: "https://api.openai.com/v1",
    model: "gpt-4o",
    envKey: "REACT_APP_AI_OPENAI_KEY",
    envModel: "REACT_APP_AI_OPENAI_MODEL",
  },
  gemini: {
    url: "https://generativelanguage.googleapis.com/v1beta",
    model: "gemini-2.0-flash",
    envKey: "REACT_APP_AI_GEMINI_KEY",
    envModel: "REACT_APP_AI_GEMINI_MODEL",
  },
  qwen: {
    url: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "qwen-max",
    envKey: "REACT_APP_AI_QWEN_KEY",
    envModel: "REACT_APP_AI_QWEN_MODEL",
  },
  deepseek: {
    url: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
    envKey: "REACT_APP_AI_DEEPSEEK_KEY",
    envModel: "REACT_APP_AI_DEEPSEEK_MODEL",
  },
};

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export function getAvailableProviders(): AiProvider[] {
  return (objectKeys(PROVIDER_DEFAULTS) as AiProvider[]).filter(
    (p) => !!process.env[PROVIDER_DEFAULTS[p].envKey],
  );
}

export interface AiServiceConfig {
  provider?: AiProvider;
  apiUrl?: string;
  apiKey?: string;
  model?: string;
}

/**
 * One completed exchange in the conversation.
 * Stored in the component and passed back with each new request so the LLM
 * has full memory of prior interactions (iterative debugging, follow-ups).
 */
export interface ConversationTurn {
  /** The full message sent to the LLM (prompt + injected context). */
  userMessage: string;
  /** The raw text response from the LLM. */
  assistantMessage: string;
  /** Short label shown in the history chip (first 60 chars of the user prompt). */
  label: string;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `
You are GenSmith, an expert Appsmith DSL architect.
Your primary output is a valid JSON object representing an Appsmith page DSL (nested widget tree).

Hard rules for the DSL JSON:
- Root MUST have type "CANVAS_WIDGET" and widgetId "0".
- Every widget MUST have a unique widgetId (short UUID), type, widgetName, and grid fields (topRow, bottomRow, leftColumn, rightColumn).
- Canvas is 64 columns wide. Rows are grid units (~10px each).
- Widget names MUST be PascalCase (e.g. "UserTable", "SubmitButton").
- Text/email/number inputs MUST use type "INPUT_WIDGET_V2" with inputType (TEXT, EMAIL, etc.). Never use "INPUT_WIDGET_V3" — it is not registered in this codebase and will crash widget loading.
- Use Appsmith primary color #553DE9 for buttons and accents.
- Parameterise all dynamic values: {{QueryName.data}}, {{Input.text}}, etc.
- When modifying an existing DSL, preserve ALL existing widgets unless asked to remove them.

JS Object rule:
- If the user's request requires new reusable JavaScript logic (validation, transformation, multi-step operations) that belongs in a JS Object, output the JavaScript code AFTER the JSON, separated by EXACTLY this line on its own: ---GENSMITH-JS---
- Format the JS section as: // JS Object: <ObjectName>\nexport default { ... }
- If no new JS Object is needed, output ONLY the JSON — no separator, no extra text.

Output format (JSON only, or JSON + JS):
<raw JSON DSL — no markdown fences>
---GENSMITH-JS---
// JS Object: MyObject
export default {
  myFunction: () => { ... }
}
`.trim();

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class AiServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "AiServiceError";
  }
}

// ---------------------------------------------------------------------------
// Config resolution
// ---------------------------------------------------------------------------

function resolveConfig(config: AiServiceConfig): {
  provider: AiProvider;
  apiUrl: string;
  apiKey: string;
  model: string;
} {
  let provider = config.provider;

  if (!provider) {
    const available = getAvailableProviders();

    provider = available[0] ?? "openai";
  }

  const defaults = PROVIDER_DEFAULTS[provider];
  const apiKey = config.apiKey || process.env[defaults.envKey] || "";
  const model =
    config.model || process.env[defaults.envModel] || defaults.model;
  const apiUrl = config.apiUrl || defaults.url;

  return { provider, apiUrl, apiKey, model };
}

// ---------------------------------------------------------------------------
// OpenAI-compatible call  (OpenAI / Qwen / DeepSeek)
// ---------------------------------------------------------------------------

async function callOpenAICompatible(
  userMessage: string,
  apiUrl: string,
  apiKey: string,
  model: string,
  history: ConversationTurn[],
): Promise<string> {
  const historyMessages = history.flatMap((turn) => [
    { role: "user" as const, content: turn.userMessage },
    { role: "assistant" as const, content: turn.assistantMessage },
  ]);

  const response = await fetch(`${apiUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...historyMessages,
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");

    throw new AiServiceError(
      `[${model}] HTTP ${response.status}: ${body.slice(0, 300)}`,
      response.status,
    );
  }

  const data = await response.json();
  const text: string = data?.choices?.[0]?.message?.content ?? "";

  if (!text) throw new AiServiceError(`[${model}] Empty response from API.`);

  return text;
}

// ---------------------------------------------------------------------------
// Gemini call
// ---------------------------------------------------------------------------

async function callGemini(
  userMessage: string,
  apiUrl: string,
  apiKey: string,
  model: string,
  history: ConversationTurn[],
): Promise<string> {
  const url = `${apiUrl}/models/${model}:generateContent?key=${apiKey}`;

  const historyContents = history.flatMap((turn) => [
    { role: "user", parts: [{ text: turn.userMessage }] },
    { role: "model", parts: [{ text: turn.assistantMessage }] },
  ]);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [
        ...historyContents,
        { role: "user", parts: [{ text: userMessage }] },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "text/plain",
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");

    throw new AiServiceError(
      `[Gemini/${model}] HTTP ${response.status}: ${body.slice(0, 300)}`,
      response.status,
    );
  }

  const data = await response.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  if (!text)
    throw new AiServiceError(`[Gemini/${model}] Empty response from API.`);

  return text;
}

// ---------------------------------------------------------------------------
// Main dispatcher
// ---------------------------------------------------------------------------

async function callLLM(
  userMessage: string,
  config: AiServiceConfig,
  history: ConversationTurn[],
): Promise<string> {
  const { apiKey, apiUrl, model, provider } = resolveConfig(config);

  if (!apiKey) {
    throw new AiServiceError(
      `No API key for "${provider}". Add ${PROVIDER_DEFAULTS[provider].envKey}=<key> to app/client/.env and restart yarn start.`,
    );
  }

  if (provider === "gemini") {
    return callGemini(userMessage, apiUrl, apiKey, model, history);
  }

  return callOpenAICompatible(userMessage, apiUrl, apiKey, model, history);
}

// ---------------------------------------------------------------------------
// JSON + JS extraction
// ---------------------------------------------------------------------------

const JS_SEPARATOR = "---GENSMITH-JS---";

function extractDslAndJs(raw: string): {
  dslRaw: string;
  jsCode: string | null;
} {
  const sepIdx = raw.indexOf(JS_SEPARATOR);

  if (sepIdx !== -1) {
    return {
      dslRaw: raw.slice(0, sepIdx).trim(),
      jsCode: raw.slice(sepIdx + JS_SEPARATOR.length).trim() || null,
    };
  }

  return { dslRaw: raw.trim(), jsCode: null };
}

function extractJson(raw: string): string {
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);

  return fenceMatch ? fenceMatch[1].trim() : raw.trim();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface DslGenerationResult {
  dsl: NestedDSL<WidgetProps>;
  /** JavaScript code the AI suggests for a new JS Object, or null if none. */
  jsCode: string | null;
  /** The exact message sent to the LLM (for storing in conversation history). */
  userMessage: string;
  /** The raw text response from the LLM (for storing in conversation history). */
  assistantMessage: string;
}

/**
 * Ask the configured LLM to generate or modify a page DSL.
 *
 * @param prompt          Natural-language instruction from the user.
 * @param currentDsl      Current nested DSL for context (AI preserves existing widgets).
 * @param pageContext      Auto-built string of query names/bodies + JS Object code from Redux.
 * @param extraContext    Optional free-text user context (schemas, business rules, etc.).
 * @param config          AI provider/model overrides.
 * @param history         Prior conversation turns for iterative editing/debugging.
 */
export async function generateDslFromPrompt(
  prompt: string,
  currentDsl: NestedDSL<WidgetProps> | null,
  pageContext: string,
  extraContext: string,
  config: AiServiceConfig,
  history: ConversationTurn[],
): Promise<DslGenerationResult> {
  const parts: string[] = [prompt];

  if (pageContext) {
    parts.push(`\n=== Page Resources (auto-injected) ===\n${pageContext}`);
  }

  if (extraContext.trim()) {
    parts.push(
      `\n=== Extra Context (user-provided) ===\n${extraContext.trim()}`,
    );
  }

  if (currentDsl) {
    parts.push(
      `\n=== Current Page DSL (preserve all existing widgets) ===\n${JSON.stringify(currentDsl, null, 2)}`,
    );
  }

  const userMessage = parts.join("\n");
  const rawText = await callLLM(userMessage, config, history);
  const { dslRaw, jsCode } = extractDslAndJs(rawText);
  const jsonStr = extractJson(dslRaw);

  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new AiServiceError(
      `LLM returned invalid JSON.\nRaw (first 500 chars):\n${rawText.slice(0, 500)}`,
    );
  }

  if (typeof parsed !== "object" || parsed === null || !("type" in parsed)) {
    throw new AiServiceError(
      'LLM response is not a valid DSL (missing "type" on root object).',
    );
  }

  return {
    dsl: parsed as NestedDSL<WidgetProps>,
    jsCode,
    userMessage,
    assistantMessage: rawText,
  };
}
