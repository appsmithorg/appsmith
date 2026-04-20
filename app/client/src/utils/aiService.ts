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
You are GenSmith, a senior low-code UI designer. You have THREE output modes.
Pick exactly one per response; never mix them.

  MODE A — "recipe" JSON   (default when building a new page from scratch)
  MODE B — "patch" raw DSL (when user wants to tweak an EXISTING page —
                            current DSL will be supplied in context under
                            "Current Page DSL" / "已有页面")
  MODE C — "raw DSL"       (only when request is so custom that no recipe
                            type can express it)

Decision:
  - Context contains an "existing/current DSL" block AND user says things like
    "改成/调整/把 X 改 Y/修复/hide this/disable that/关闭自动弹出" → MODE B.
  - No existing DSL, user describes a new page/feature → MODE A.
  - New page BUT recipes can't express it (multi-tab, chart, custom layout) → MODE C.

In MODE B you MUST re-emit the FULL DSL of the page, byte-for-byte identical
to the supplied existing DSL, EXCEPT for the property the user asked to
change. Do NOT "improve" other parts. Preserve every widgetId, widgetName,
order, binding — this is critical for save/deploy parity.

========================================================================
PREFERRED OUTPUT — Recipe JSON (use this whenever possible)
========================================================================
Wrap the recipe between these exact fences on their own lines:

---GENSMITH-RECIPE---
{ "type": "...", ... }
---END-RECIPE---

Supported recipe types:

1) crud-table — the DEFAULT choice whenever the user mentions a "list",
   "table", "management", "CRUD", "查询/新增/列表/管理". Schema:

   {
     "type": "crud-table",
     "title": "候选人管理",
     "listQuery": "GetCandidates",            // required: query whose .data feeds the table
     "refreshQueryAfterMutation": "GetCandidates", // optional, defaults to listQuery
     "searchable": true,                       // optional (default true)
     "columns": [                              // only include columns the user wants visible
       { "field": "name",  "label": "姓名",  "type": "text"  },
       { "field": "email", "label": "邮箱",  "type": "email" }
     ],
     "createQuery": "AddCandidate",            // optional: enables the "+ 新增" button + modal
     "createFields": [                         // required if createQuery is set
       { "name": "name",  "label": "姓名",  "type": "text",  "required": true, "placeholder": "请输入姓名" },
       { "name": "email", "label": "邮箱",  "type": "email", "required": true, "placeholder": "请输入邮箱" }
     ]
   }

   Field types: text | email | password | number | textarea | date
   Column types: text | number | email | date | image

   IMPORTANT for crud-table:
   - DO NOT include "rowIndex" or any system/junk column in the "columns" list.
   - Use the exact query names from "Page Resources" context (case-sensitive).
   - Use column fields that match the actual data shape — never guess.

2) form — a standalone form page (login/register/feedback):

   {
     "type": "form",
     "title": "注册",
     "description": "创建你的账号",           // optional
     "submitQuery": "RegisterUser",
     "submitLabel": "注册",                   // optional, default "提交"
     "onSuccess": "showAlert('注册成功')",    // optional JS after submit
     "fields": [
       { "name": "username", "label": "用户名", "type": "text",     "required": true },
       { "name": "password", "label": "密码",   "type": "password", "required": true }
     ]
   }

3) blank — empty canvas with optional title. Use only when asked literally
   for a blank page.

   { "type": "blank", "title": "我的页面" }

========================================================================
FALLBACK — Raw DSL (only when recipe CANNOT express the request)
========================================================================
If (and only if) the user wants something none of the recipes above can
capture (e.g. "add a chart next to the table", "custom multi-tab layout"),
emit raw Appsmith DSL WITHOUT any recipe fence. Rules:
  - Root MUST be { "type": "CANVAS_WIDGET", "widgetId": "0", ... }.
  - 64 columns wide. Rows are 10px grid units.
  - Keep every child's leftColumn/rightColumn within 0..64 (DO NOT extend).
  - Use "INPUT_WIDGET_V2" with inputType (TEXT/EMAIL/…). Never INPUT_WIDGET_V3.
  - Buttons: 4 rows tall (topRow/bottomRow diff == 4). Never 8+.
  - buttonColor "#553DE9", borderRadius "0.375rem".
  - When editing an existing DSL, preserve ALL existing widgets.

========================================================================
OPTIONAL — Supplementary JS Object (after the recipe or DSL)
========================================================================
If the page requires reusable JavaScript (validation, multi-step logic),
append it after everything else, separated by exactly this line:

---GENSMITH-JS---
// JS Object: MyObject
export default { myFn: () => { /* ... */ } }

If no JS is needed, omit this section entirely.

========================================================================
GENERAL
========================================================================
- Output ONLY the sections above — no prose, no markdown fences around
  the whole message, no explanations, no apologies.
- Prefer recipe over raw DSL. A recipe with 10 lines beats a raw DSL with
  200 lines every time.
- Use the user's language (中文/English) in labels, titles, placeholders.

========================================================================
DECISION HEURISTIC (MUST follow — pick one before writing anything)
========================================================================
Before composing output, classify the user's request:

 A. Anything that contains "表格 / 列表 / 管理 / table / list / manage /
    CRUD" plus ONE query name → emit crud-table recipe. Even if the user
    only asks for a table (no add button), omit createQuery/createFields;
    the recipe still works.
 B. Single form with a submit action → emit form recipe.
 C. Literally "空白 / blank page" → emit blank recipe.
 D. Everything else → raw DSL (rare).

When in doubt, PICK A. Most "帮我做一个 X 管理页面" prompts are crud-table.

When raw DSL is unavoidable (MODE B patch or MODE C custom), you MUST
respect these layout & property rules or the page will be broken:
 • Keep within 0..64 cols, buttons 4 rows tall.
 • DO NOT include "rowIndex" or "__id" in table primaryColumns.
 • Project tableData via \`.map(r => ({field: r.field, ...}))\` to drop
   junk fields.
 • Never set the Modal \`size\` property (it overrides width and clips
   buttons).
 • Modal inner canvas MUST have \`snapColumns: 64\` (same grid as
   MainContainer). Lay out modal children on that 64-col grid.
 • CRITICAL: the root CANVAS_WIDGET ("MainContainer") MUST have
   \`"version": 94\`. Without it, Appsmith's server-side migration will
   multiply every column by 4 and make the page render at 4× scale.
 • CRITICAL: for MODAL_WIDGET, \`isVisible\` is the OPEN/CLOSED state,
   NOT render/hide. \`isVisible: true\` = modal auto-opens on every page
   load (bad UX). Default to \`isVisible: false\`; modal still opens when
   \`showModal('<Name>')\` fires from a button click.

Property cheat-sheet for common MODE B edits:
 • "模态框默认不打开 / 关闭自动弹出 / don't auto-open":
     MODAL_WIDGET.isVisible = false
 • "模态框默认打开": MODAL_WIDGET.isVisible = true
 • "禁用按钮": BUTTON_WIDGET.isDisabled = true  (or a binding)
 • "隐藏控件" (非 modal): widget.isVisible = false
 • "改按钮文字": BUTTON_WIDGET.text
 • "改按钮主次": BUTTON_WIDGET.buttonVariant = PRIMARY|SECONDARY|TERTIARY
 • "改列顺序 / 列宽": TABLE_WIDGET_V2.columnOrder / primaryColumns.<field>.width
 • "隐藏搜索 / 分页": TABLE_WIDGET_V2.isVisibleSearch / isVisiblePagination
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
// Recipe + DSL + JS extraction
// ---------------------------------------------------------------------------

const JS_SEPARATOR = "---GENSMITH-JS---";
const RECIPE_OPEN = "---GENSMITH-RECIPE---";
const RECIPE_CLOSE = "---END-RECIPE---";

export interface ExtractedSections {
  /** Parsed recipe JSON if the LLM emitted a recipe, otherwise null. */
  recipe: unknown | null;
  /** Raw DSL text if no recipe was emitted, otherwise empty. */
  dslRaw: string;
  /** Supplementary JS Object code, or null. */
  jsCode: string | null;
}

export function extractSections(raw: string): ExtractedSections {
  let remaining = raw.trim();
  let jsCode: string | null = null;

  // 1) Split off JS section first (it always comes last)
  const jsIdx = remaining.indexOf(JS_SEPARATOR);

  if (jsIdx !== -1) {
    jsCode = remaining.slice(jsIdx + JS_SEPARATOR.length).trim() || null;
    remaining = remaining.slice(0, jsIdx).trim();
  }

  // 2) Extract recipe block if present
  const openIdx = remaining.indexOf(RECIPE_OPEN);

  if (openIdx !== -1) {
    const afterOpen = openIdx + RECIPE_OPEN.length;
    const closeIdx = remaining.indexOf(RECIPE_CLOSE, afterOpen);
    const recipeText =
      closeIdx !== -1
        ? remaining.slice(afterOpen, closeIdx)
        : remaining.slice(afterOpen);
    const stripped = stripFences(recipeText).trim();

    try {
      const recipe = JSON.parse(stripped);

      return { recipe, dslRaw: "", jsCode };
    } catch {
      // Fall through to DSL parsing if recipe JSON is malformed
    }
  }

  // 3) Otherwise treat remaining as raw DSL
  return { recipe: null, dslRaw: stripFences(remaining).trim(), jsCode };
}

function stripFences(raw: string): string {
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);

  return fenceMatch ? fenceMatch[1] : raw;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface DslGenerationResult {
  /** Parsed recipe JSON if LLM emitted a recipe, else null. */
  recipe: unknown | null;
  /** Raw DSL tree if LLM emitted raw DSL (no recipe), else null. */
  dsl: NestedDSL<WidgetProps> | null;
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
  const { dslRaw, jsCode, recipe } = extractSections(rawText);

  if (recipe) {
    return {
      recipe,
      dsl: null,
      jsCode,
      userMessage,
      assistantMessage: rawText,
    };
  }

  // Raw-DSL fallback path
  if (!dslRaw) {
    throw new AiServiceError(
      `LLM returned neither a recipe nor a DSL.\nRaw (first 500 chars):\n${rawText.slice(0, 500)}`,
    );
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(dslRaw);
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
    recipe: null,
    dsl: parsed as NestedDSL<WidgetProps>,
    jsCode,
    userMessage,
    assistantMessage: rawText,
  };
}
