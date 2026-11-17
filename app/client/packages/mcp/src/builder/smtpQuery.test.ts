import {
  buildSmtpActionDto,
  compileSmtpQuery,
  isSmtpActionConfiguration,
  MCP_SMTP_MARKER_KEY,
  mcpAuthoredSmtpBody,
  smtpEmailOf,
  smtpHasAttachments,
  smtpQuerySpecSchema,
  stampMcpSmtpMarker,
} from "./smtpQuery.js";

const BASE = {
  name: "SendWelcome",
  applicationId: "app1",
  pageId: "page1",
  datasourceId: "ds1",
  from: "noreply@example.com",
  to: { widget: "inpEmail", property: "text" },
  subject: ["Welcome, ", { widget: "inpName", property: "text" }],
  body: "Thanks for signing up.",
};

function compile(overrides: Record<string, unknown> = {}) {
  const spec = smtpQuerySpecSchema.parse({ ...BASE, ...overrides });

  return { spec, compiled: compileSmtpQuery(spec) };
}

// Evaluates one `{{ … }}` binding the way the evaluator would, with the given widget values in scope.
function evaluateBinding(
  text: string,
  widgets: Record<string, Record<string, unknown>>,
): string {
  return text.replace(/\{\{ (.*?) \}\}(?!\})/g, (_match, code: string) => {
    const names = Object.keys(widgets);

    return String(
      new Function(...names, `return (${code});`)(
        ...names.map((name) => widgets[name]),
      ),
    );
  });
}

describe("create_smtp_query builder", () => {
  it("writes the plugin's plain formData.send values and the Send command", () => {
    const { compiled } = compile();
    const send = compiled.formData.send as Record<string, unknown>;

    expect(compiled.formData.command).toBe("SEND");
    expect(send.from).toBe("noreply@example.com");
    expect(send.bodyType).toBe("text/plain");
    expect(send.isReplyTo).toBe(false);
    expect(send.cc).toBe("");
    expect(compiled.body).toBe("Thanks for signing up.");
    expect(compiled.bindingPaths).toEqual([
      "formData.send.to",
      "formData.send.subject",
    ]);
  });

  it("builds a DTO that never runs on page load", () => {
    const { compiled, spec } = compile();
    const dto = buildSmtpActionDto(spec, compiled);

    expect(dto.executeOnLoad).toBe(false);
    expect(dto.datasource).toEqual({ id: "ds1" });
    expect(dto.pageId).toBe("page1");
    expect(
      (dto.actionConfiguration as Record<string, unknown>)
        .dynamicBindingPathList,
    ).toEqual([{ key: "formData.send.to" }, { key: "formData.send.subject" }]);
  });

  it("guards header references: null, arrays and line breaks", () => {
    const { compiled } = compile({
      cc: { widget: "msCc", property: "selectedOptionValues" },
    });
    const send = compiled.formData.send as Record<string, string>;

    expect(
      evaluateBinding(send.cc, {
        msCc: { selectedOptionValues: ["a@x.com", "b@x.com"] },
      }),
    ).toBe("a@x.com, b@x.com");
    expect(evaluateBinding(send.to, { inpEmail: { text: null } })).toBe("");
    expect(
      evaluateBinding(send.subject, {
        inpName: { text: "Ann\r\nBcc: evil@x.com" },
      }),
    ).toBe("Welcome, Ann Bcc: evil@x.com");
  });

  it("strips CR and LF from an address reference, so a value cannot add a header", () => {
    const { compiled } = compile();
    const send = compiled.formData.send as Record<string, string>;
    const to = evaluateBinding(send.to, {
      inpEmail: { text: "a@x.com\r\nBcc: evil@x.com" },
    });

    expect(to).not.toMatch(/[\r\n]/);
    expect(to).toBe("a@x.com Bcc: evil@x.com");
  });

  it("HTML-escapes references in an HTML body and leaves literal markup alone", () => {
    const { compiled } = compile({
      bodyType: "text/html",
      body: ["<p>Hi ", { widget: "inpName", property: "text" }, "</p>"],
    });

    expect(compiled.bindingPaths).toContain("body");
    expect(
      evaluateBinding(compiled.body, {
        inpName: { text: `<a href="x">'o'</a> & co` },
      }),
    ).toBe(
      "<p>Hi &#60;a href=&#34;x&#34;&#62;&#39;o&#39;&#60;/a&#62; &#38; co</p>",
    );
  });

  it("keeps a plain-text body reference unescaped", () => {
    const { compiled } = compile({
      body: { widget: "inpNote", property: "text" },
    });

    expect(evaluateBinding(compiled.body, { inpNote: { text: "a < b" } })).toBe(
      "a < b",
    );
  });

  it("emits brace-balanced bindings with no quote character in a regex", () => {
    const { compiled } = compile({
      bodyType: "text/html",
      body: [{ widget: "inpName", property: "text" }],
      replyTo: { widget: "inpReply", property: "text" },
    });
    const texts = [
      ...Object.values(compiled.formData.send as Record<string, unknown>),
      compiled.body,
    ].filter((value): value is string => typeof value === "string");

    for (const text of texts) {
      expect(text.split("{").length).toBe(text.split("}").length);
      expect(text).not.toMatch(/\/\[[^\]]*["'][^\]]*\]\//);
    }
  });

  it("sets isReplyTo only when replyTo is given", () => {
    const send = compile({ replyTo: "help@example.com" }).compiled.formData
      .send as Record<string, unknown>;

    expect(send.isReplyTo).toBe(true);
    expect(send.replyTo).toBe("help@example.com");
  });

  it.each([
    ["template syntax in a literal", { body: "Hi {{ evil }}" }],
    ["a line break in a header literal", { subject: "Hi\r\nBcc: x@y.z" }],
    ["a backtick", { from: "a`b@x.com" }],
    ["an unknown body type", { bodyType: "text/markdown" }],
    ["an unknown field", { attachments: "x" }],
    ["a non-identifier widget", { to: { widget: "a.b", property: "text" } }],
    ["an empty part list", { to: [] }],
    ["a missing recipient", { to: undefined }],
  ])("refuses %s", (_label, overrides) => {
    expect(
      smtpQuerySpecSchema.safeParse({ ...BASE, ...overrides }).success,
    ).toBe(false);
  });

  it("allows line breaks in a body literal", () => {
    expect(
      smtpQuerySpecSchema.safeParse({ ...BASE, body: "Line 1\nLine 2" })
        .success,
    ).toBe(true);
  });

  it.each(["text.", ".text", "selectedRow..email", "__proto__"])(
    "refuses the widget property path %p",
    (property) => {
      expect(
        smtpQuerySpecSchema.safeParse({
          ...BASE,
          to: { widget: "inpEmail", property },
        }).success,
      ).toBe(false);
    },
  );

  it("accepts a nested widget property path", () => {
    expect(
      smtpQuerySpecSchema.safeParse({
        ...BASE,
        to: { widget: "tblUsers", property: "selectedRow.email" },
      }).success,
    ).toBe(true);
  });

  it.each([
    // Each part passes alone. Only the joined text holds a binding.
    ["three literals", ["{", "{ appsmith.store.secret }", "}"]],
    ["literals around a reference", ["{", BASE.to, "{ x }", "}"]],
    ["a split template", ["$", "{ x }"]],
    // The literals join to plain "{x}", but each brace touches a reference's own braces.
    ["single braces around references", ["{", BASE.to, "x", BASE.to, "}"]],
    ["a dollar before a reference", ["$", BASE.to]],
    ["a closing brace after a reference", [BASE.to, "} tail"]],
    // The security review's input: one binding segment that spans both references.
    [
      "a binding widened across references",
      ["a{", BASE.to, " + 1 ", BASE.to, "}"],
    ],
    // An empty literal must not hide a brace from its reference.
    ["an empty literal before a reference", ["{", "", BASE.to]],
    ["an empty literal after a reference", [BASE.to, "", "}"]],
  ])("refuses list parts that join into a binding: %s", (_label, parts) => {
    expect(
      smtpQuerySpecSchema.safeParse({ ...BASE, body: parts }).success,
    ).toBe(false);
    expect(
      smtpQuerySpecSchema.safeParse({ ...BASE, subject: parts }).success,
    ).toBe(false);
  });

  it("accepts list parts whose joined text is plain", () => {
    expect(
      smtpQuerySpecSchema.safeParse({
        ...BASE,
        body: ["Hi ", BASE.to, ", { braces } are fine. Cost: $", "5"],
      }).success,
    ).toBe(true);
  });
});

describe("SMTP read projection and marker", () => {
  function stored(overrides: Record<string, unknown> = {}) {
    const { compiled } = compile(overrides);

    return { formData: compiled.formData, body: compiled.body };
  }

  it("recognises an SMTP configuration by formData.send", () => {
    expect(isSmtpActionConfiguration(stored())).toBe(true);
    expect(isSmtpActionConfiguration({ body: "SELECT 1" })).toBe(false);
    expect(isSmtpActionConfiguration({ formData: { send: "x" } })).toBe(false);
  });

  it("returns the header fields, with the plugin's replyTo and bodyType rules", () => {
    expect(
      smtpEmailOf({
        formData: {
          send: {
            from: "a@x.com",
            to: "b@x.com",
            subject: "Hi",
            replyTo: "ignored@x.com",
          },
        },
      }),
    ).toEqual({
      from: "a@x.com",
      to: "b@x.com",
      cc: "",
      bcc: "",
      replyTo: "",
      subject: "Hi",
      bodyType: "text/html",
    });
    expect(
      smtpEmailOf({ formData: { send: { to: { data: "c@x.com" } } } }),
    ).toMatchObject({ to: "c@x.com" });
    expect(smtpEmailOf({ body: "x" })).toBeNull();
  });

  it("detects attachments set in the editor", () => {
    const withAttachments = (attachments: unknown) => ({
      formData: { send: { to: "a@x.com", attachments } },
    });

    expect(smtpHasAttachments(stored())).toBe(false);
    expect(smtpHasAttachments(withAttachments(""))).toBe(false);
    expect(smtpHasAttachments(withAttachments("[]"))).toBe(false);
    expect(smtpHasAttachments(withAttachments([]))).toBe(false);
    expect(smtpHasAttachments(withAttachments("{{ fpFiles.files }}"))).toBe(
      true,
    );
    expect(smtpHasAttachments(withAttachments([{ name: "a.pdf" }]))).toBe(true);
  });

  it("returns the body of an MCP-written email", () => {
    expect(mcpAuthoredSmtpBody(stored())).toBe("Thanks for signing up.");
  });

  it.each([
    ["the body", (config: Record<string, unknown>) => (config.body = "edited")],
    [
      "a recipient",
      (config: Record<string, unknown>) =>
        ((config.formData as { send: Record<string, unknown> }).send.bcc =
          "spy@x.com"),
    ],
    [
      "an attachment",
      (config: Record<string, unknown>) =>
        ((
          config.formData as { send: Record<string, unknown> }
        ).send.attachments = "[]x"),
    ],
    [
      "an attachment list",
      (config: Record<string, unknown>) =>
        ((
          config.formData as { send: Record<string, unknown> }
        ).send.attachments = [{ name: "a.pdf" }]),
    ],
  ])("hides the body after an edit to %s", (_label, edit) => {
    const config = structuredClone(stored()) as Record<string, unknown>;

    edit(config);

    expect(mcpAuthoredSmtpBody(config)).toBeUndefined();
  });

  it("hides the body of an email without a marker", () => {
    const config = structuredClone(stored()) as Record<string, unknown>;

    delete (config.formData as Record<string, unknown>)[MCP_SMTP_MARKER_KEY];

    expect(mcpAuthoredSmtpBody(config)).toBeUndefined();
  });

  it("re-stamps the marker after an edition rewrites the content", () => {
    const config = structuredClone(stored()) as Record<string, unknown>;

    config.body = "Rewritten by the edition";

    expect(mcpAuthoredSmtpBody(config)).toBeUndefined();
    expect(mcpAuthoredSmtpBody(stampMcpSmtpMarker(config))).toBe(
      "Rewritten by the edition",
    );
  });
});
