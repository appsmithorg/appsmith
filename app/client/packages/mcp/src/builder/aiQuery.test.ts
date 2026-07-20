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
    expect(compiled.formData.maxTokens).toBe(512);
    expect(compiled.formData.temperature).toBe(0.7);

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
    expect(compiled.formData.temperature).toBe(1);
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
