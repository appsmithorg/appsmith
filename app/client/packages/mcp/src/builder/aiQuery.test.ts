import {
  buildAiActionDto,
  compileAiQuery,
  aiQuerySpecSchema,
} from "./aiQuery.js";

function parse(query: unknown) {
  return aiQuerySpecSchema.safeParse(query);
}

const base = {
  name: "AskAI",
  applicationId: "app1",
  pageId: "p1",
  datasourceId: "ds1",
};

describe("create_ai_query builder", () => {
  it("compiles an OpenAI chat query with a widget-bound prompt", () => {
    const parsed = parse({
      ...base,
      model: "gpt-4o",
      messages: [
        { role: "system", content: { literal: "You are helpful." } },
        { role: "user", content: { widget: "PromptInput", property: "text" } },
      ],
      maxTokens: 512,
      temperature: 0.7,
    });

    expect(parsed.success).toBe(true);
    const compiled = compileAiQuery(parsed.data!, "openai-plugin");

    expect(compiled.provider).toBe("OpenAI");
    expect(compiled.formData.command).toEqual({ data: "CHAT" });
    expect(compiled.formData.chatModel).toEqual({ data: "gpt-4o" });
    // Top-level strings, NOT `{ data: ... }` and NOT numbers: the plugins read this pair with
    // extractValueFromFormData, which casts the top-level value straight to String.
    expect(compiled.formData.maxTokens).toBe("512");
    expect(compiled.formData.temperature).toBe("0.7");

    const messages = JSON.parse(
      (compiled.formData.messages as { data: string }).data,
    );

    expect(messages).toEqual([
      { role: "system", content: "You are helpful." },
      { role: "user", content: "{{ PromptInput.text }}" },
    ]);
    expect(compiled.bindingPaths).toEqual(["formData.messages.data"]);

    const dto = buildAiActionDto(parsed.data!, compiled) as {
      actionConfiguration: { dynamicBindingPathList?: { key: string }[] };
    };

    expect(dto.actionConfiguration.dynamicBindingPathList).toEqual([
      { key: "formData.messages.data" },
    ]);
  });

  it("compiles a Google AI query — GENERATE_CONTENT, generateContentModel, per-message type, no tuning", () => {
    const parsed = parse({
      ...base,
      model: "gemini-1.5-pro",
      messages: [{ role: "user", content: { literal: "Hello" } }],
      // maxTokens is accepted by the schema but must be dropped for Google AI (no tuning support).
      maxTokens: 256,
    });

    expect(parsed.success).toBe(true);
    const compiled = compileAiQuery(parsed.data!, "googleai-plugin");

    expect(compiled.provider).toBe("Google AI");
    expect(compiled.formData.command).toEqual({ data: "GENERATE_CONTENT" });
    expect(compiled.formData.generateContentModel).toEqual({
      data: "gemini-1.5-pro",
    });
    expect(compiled.formData.maxTokens).toBeUndefined();

    const messages = JSON.parse(
      (compiled.formData.messages as { data: string }).data,
    );

    expect(messages).toEqual([
      { role: "user", type: "text", content: "Hello" },
    ]);
  });

  it("compiles an Anthropic chat query (chatModel + CHAT + tuning)", () => {
    const parsed = parse({
      ...base,
      model: "claude-3-5-sonnet-20241022",
      messages: [{ role: "user", content: { literal: "Hi" } }],
      temperature: 1,
    });

    expect(parsed.success).toBe(true);
    const compiled = compileAiQuery(parsed.data!, "anthropic-plugin");

    expect(compiled.provider).toBe("Anthropic");
    expect(compiled.formData.command).toEqual({ data: "CHAT" });
    expect(compiled.formData.chatModel).toEqual({
      data: "claude-3-5-sonnet-20241022",
    });
    expect(compiled.formData.temperature).toBe("1");
  });

  // Regression guard for the ClassCastException class: openAiPlugin (ChatCommand/VisionCommand) and
  // anthropicPlugin (CommandUtils) both read maxTokens/temperature via
  // RequestUtils.extractValueFromFormData -> `(String) formData.get(key)`. A JSON number deserializes to
  // Integer/Double server-side and blows up on that cast, and a `{ data: ... }` wrapper blows up the same way.
  it("serializes tuning values as top-level strings, never numbers or data-wrapped", () => {
    const parsed = parse({
      ...base,
      model: "gpt-4o",
      messages: [{ role: "user", content: { literal: "hi" } }],
      maxTokens: 512,
      temperature: 0.7,
    });

    expect(parsed.success).toBe(true);
    const compiled = compileAiQuery(parsed.data!, "openai-plugin");

    for (const key of ["maxTokens", "temperature"]) {
      const value = compiled.formData[key];

      expect(typeof value).toBe("string");
      expect(value).not.toBeInstanceOf(Object);
    }
  });

  it("omits the binding path when all message content is literal", () => {
    const parsed = parse({
      ...base,
      model: "gpt-4o",
      messages: [{ role: "user", content: { literal: "static" } }],
    });

    expect(parsed.success).toBe(true);
    const compiled = compileAiQuery(parsed.data!, "openai-plugin");

    expect(compiled.bindingPaths).toEqual([]);
    const dto = buildAiActionDto(parsed.data!, compiled) as {
      actionConfiguration: { dynamicBindingPathList?: unknown };
    };

    expect("dynamicBindingPathList" in dto.actionConfiguration).toBe(false);
  });

  it("throws for an unsupported provider package", () => {
    const parsed = parse({
      ...base,
      model: "gpt-4o",
      messages: [{ role: "user", content: { literal: "hi" } }],
    });

    expect(() => compileAiQuery(parsed.data!, "appsmithai-plugin")).toThrow(
      /not a supported AI provider/,
    );
  });

  // JSON.stringify does not escape U+2028/U+2029, and message content is embedded inside the JSON string stored at
  // formData.messages.data — so before RAW_EXPRESSION covered them a literal carrying one rode through verbatim.
  it.each([
    ["U+2028 line separator", 0x2028],
    ["U+2029 paragraph separator", 0x2029],
  ])("rejects %s in message content", (_label, codePoint) => {
    const parsed = parse({
      ...base,
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: { literal: `a${String.fromCharCode(codePoint)}b` },
        },
      ],
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects unsafe specs (binding in literal, bad model/role, empty messages)", () => {
    const bad: unknown[] = [
      // binding/template syntax must never survive into a literal content.
      {
        ...base,
        model: "gpt-4o",
        messages: [{ role: "user", content: { literal: "{{evil}}" } }],
      },
      // model id charset (a space/quote would break the JSON value).
      {
        ...base,
        model: "gpt 4",
        messages: [{ role: "user", content: { literal: "hi" } }],
      },
      // unknown role.
      {
        ...base,
        model: "gpt-4o",
        messages: [{ role: "tool", content: { literal: "hi" } }],
      },
      // at least one message required.
      { ...base, model: "gpt-4o", messages: [] },
      // widget property path charset.
      {
        ...base,
        model: "gpt-4o",
        messages: [
          { role: "user", content: { widget: "In", property: "a; b" } },
        ],
      },
    ];

    for (const spec of bad) {
      expect(parse(spec).success).toBe(false);
    }
  });
});
