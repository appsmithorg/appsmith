import { z } from "zod";
import { storedId } from "./schema.js";

// D5 create_ai_query — a STRUCTURED chat-completion builder for the OpenAI / Anthropic / Google AI plugins. The
// agent never authors a raw request body or raw `{{ }}` bindings: it supplies a model id and a list of role/content
// messages, and the compiler emits the provider's `actionConfiguration.formData` chat command. The message CONTENT
// is the only place runtime data enters — a literal (JSON-encoded at compile time, so it cannot break out of its
// JSON position) or a widget reference (a checked `{{ Widget.prop }}` binding that eval resolves before the request
// is sent). This is exactly the marquee "AI app" case (an input's text drives a prompt) kept inside the closed
// vocabulary. The three providers share a near-identical formData chat shape; per-provider differences (command
// verb, model field name, per-message `type`) are applied from AI_PROVIDERS by the compiler.

// The provider config, keyed by plugin packageName. command = the formData command verb; modelKey = the formData
// field holding the model id; perMessageType = whether each message needs a `type: "text"` (Google AI); supports
// tuning = whether maxTokens/temperature apply (Google AI's generate command does not expose them here).
export const AI_PROVIDERS: Record<
  string,
  {
    label: string;
    command: string;
    modelKey: string;
    perMessageType: boolean;
    supportsTuning: boolean;
  }
> = {
  "openai-plugin": {
    label: "OpenAI",
    command: "CHAT",
    modelKey: "chatModel",
    perMessageType: false,
    supportsTuning: true,
  },
  "anthropic-plugin": {
    label: "Anthropic",
    command: "CHAT",
    modelKey: "chatModel",
    perMessageType: false,
    supportsTuning: true,
  },
  "googleai-plugin": {
    label: "Google AI",
    command: "GENERATE_CONTENT",
    modelKey: "generateContentModel",
    perMessageType: true,
    supportsTuning: false,
  },
};
export type AiProviderPackage = keyof typeof AI_PROVIDERS;

// A model id: letters/digits and the punctuation real model names use (gpt-4, gpt-3.5-turbo, claude-3-opus-20240229,
// gemini-1.5-pro). No whitespace/quote/brace/`$`/backtick, so it embeds safely as a JSON string value.
const modelId = z
  .string()
  .min(1)
  .max(128)
  .regex(
    /^[A-Za-z0-9_.:\-]+$/,
    "must be a model id (letters, digits, and _ . : -)",
  );

// A binding identifier + property path (same vocabulary as the other query builders).
const bindingIdentifier = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_]+$/, "must be alphanumeric/underscore");
const propertyPath = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z_][A-Za-z0-9_.]*$/, "must be a dotted identifier path");

// Message content — a literal (no binding/template syntax) or a widget reference resolved at runtime.
const RAW_EXPRESSION = /\{\{|\}\}|\$\{|`|\u2028|\u2029/;
const contentRef = z.union([
  z
    .object({
      literal: z
        .string()
        .min(1)
        .max(8000)
        .refine((v) => !RAW_EXPRESSION.test(v), {
          message: "content must not contain binding/template syntax",
        }),
    })
    .strict(),
  z.object({ widget: bindingIdentifier, property: propertyPath }).strict(),
]);

type ContentRef = z.infer<typeof contentRef>;

export const aiQuerySpecSchema = z
  .object({
    name: bindingIdentifier,
    // No workspaceId: the tool resolves the workspace server-authoritatively from applicationId (cross-tenant guard).
    applicationId: storedId,
    pageId: storedId,
    datasourceId: storedId,
    model: modelId,
    messages: z
      .array(
        z
          .object({
            role: z.enum(["system", "user", "assistant"]),
            content: contentRef,
          })
          .strict(),
      )
      .min(1)
      .max(50),
    // Optional tuning (OpenAI/Anthropic). Ignored for a provider that does not support it (validated in the tool
    // once the provider is known — the schema alone can't see the datasource's provider).
    maxTokens: z.number().int().min(1).max(128000).optional(),
    temperature: z.number().min(0).max(2).optional(),
  })
  .strict();

export type AiQuerySpec = z.infer<typeof aiQuerySpecSchema>;

export interface CompiledAiQuery {
  provider: string;
  formData: Record<string, unknown>;
  // dynamicBindingPathList keys for any content that is a widget binding.
  bindingPaths: string[];
}

// Emit one message content value. A literal is JSON-encoded (quotes/backslashes escaped); a widget reference is a
// bare `{{ Widget.prop }}` string that eval resolves before the request is sent.
// ROBUSTNESS CAVEAT [council]: a widget-bound content is interpolated INSIDE the JSON string of messages.data, so a
// resolved runtime value containing a `"` can malform the JSON the plugin parses. This is NOT a security issue
// (same-tenant, single-pass eval — no cross-boundary reach, no second binding, no SSRF/secret exposure), but it is a
// correctness caveat to confirm on live-DP (whether the AI plugin smart-substitutes/parameterizes the binding, which
// would JSON-encode the value safely). Tracked under the PROVISIONAL label on the tool.
function emitContent(content: ContentRef): { value: string; binding: boolean } {
  if ("literal" in content) {
    return { value: content.literal, binding: false };
  }

  return {
    value: `{{ ${content.widget}.${content.property} }}`,
    binding: true,
  };
}

export function compileAiQuery(
  spec: AiQuerySpec,
  packageName: string,
): CompiledAiQuery {
  const provider = AI_PROVIDERS[packageName];

  if (provider === undefined) {
    throw new Error(`${packageName} is not a supported AI provider`);
  }

  const bindingPaths: string[] = [];
  const messages = spec.messages.map((message) => {
    const { binding, value } = emitContent(message.content);

    if (binding) bindingPaths.push("formData.messages.data");

    return provider.perMessageType
      ? { role: message.role, type: "text", content: value }
      : { role: message.role, content: value };
  });

  const formData: Record<string, unknown> = {
    command: { data: provider.command },
    [provider.modelKey]: { data: spec.model },
    // messages.data is stored as a JSON string (the ARRAY_FIELD's json view); content bindings ride inside it.
    messages: { data: JSON.stringify(messages) },
  };

  if (provider.supportsTuning) {
    // maxTokens/temperature are the one pair the plugins read with
    // RequestUtils.extractValueFromFormData -> `(String) formData.get(key)`, i.e. the TOP-LEVEL value cast straight
    // to String — unlike command/model/messages, which go through extractDataFromFormData and therefore need the
    // `{ data: ... }` wrapper. Emitting a JSON number here deserializes to Integer/Double server-side and the cast
    // throws ClassCastException, so serialize as a top-level string. Verified against openAiPlugin ChatCommand /
    // VisionCommand and anthropicPlugin CommandUtils, which both parse the string back with parseFloat/parseInt.
    if (spec.maxTokens !== undefined)
      formData.maxTokens = String(spec.maxTokens);

    if (spec.temperature !== undefined)
      formData.temperature = String(spec.temperature);
  }

  // De-duplicate the messages binding path (one entry covers the whole field).
  return {
    provider: provider.label,
    formData,
    bindingPaths: [...new Set(bindingPaths)],
  };
}

export function buildAiActionDto(
  spec: AiQuerySpec,
  compiled: CompiledAiQuery,
): Record<string, unknown> {
  return {
    name: spec.name,
    pageId: spec.pageId,
    datasource: { id: spec.datasourceId },
    actionConfiguration: {
      formData: compiled.formData,
      ...(compiled.bindingPaths.length > 0
        ? {
            dynamicBindingPathList: compiled.bindingPaths.map((key) => ({
              key,
            })),
          }
        : {}),
    },
  };
}
