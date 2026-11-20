import { createHash } from "node:crypto";
import { z } from "zod";
import { entityPropertyPath, RAW_EXPRESSION, storedId } from "./schema.js";
import { canonicalStableSerialize } from "./semantic.js";

// create_smtp_query: a STRUCTURED email query for the SMTP plugin's Send command. The agent never writes a raw
// `{{ }}` binding. Each field is literal text, a widget reference, or a list of both, which the compiler joins:
//   - Literal text is checked: no binding or template syntax anywhere, and no line breaks in a header field.
//   - A widget reference is emitted as `{{ Widget.property }}` inside a small guard. The guard turns null into "",
//     joins an array of addresses with ", ", removes line breaks from header fields, and HTML-escapes values in an
//     HTML body. So a value from a form cannot add an email header or inject markup.
//
// These guards are defense in depth in the evaluator. A caller can bypass them by calling the execute API directly
// with its own values. The SMTP plugin is the real boundary.
//
// The SMTP plugin reads plain values (formData.send.to = "…"), not the { data } wrappers other form plugins use.
// See SmtpPlugin.sendEmail.
//
// The spec has the same shape as the other query builders (name, applicationId, pageId, datasourceId, and
// { widget, property } references in dot form). An edition can reuse it for another action container. For example,
// EE workflows pass { param } values through a placeholder widget and rewrite them to this.params afterwards.

const bindingIdentifier = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_]+$/, "must be alphanumeric/underscore");
// Every dot-separated segment must be a nonempty identifier, so "text." or "selectedRow..email" is refused instead
// of compiling to a broken binding.
const widgetRef = z
  .object({ widget: bindingIdentifier, property: entityPropertyPath })
  .strict();

type WidgetRef = z.infer<typeof widgetRef>;

// Line breaks would end a header line. They are refused in header literals and removed from header references.
const LINE_BREAK = /[\r\n]/;
const SMTP_PARTS_MAX = 40;
const HEADER_MAX = 2000;
const BODY_MAX = 100_000;

function literalText(max: number, header: boolean) {
  return z
    .string()
    .max(max)
    .refine((value) => !RAW_EXPRESSION.test(value), {
      message:
        "must not contain binding/template syntax ({{ }}, ${ }, or backticks)",
    })
    .refine((value) => !header || !LINE_BREAK.test(value), {
      message: "a header field must not contain a line break",
    });
}

// Whether a list of parts would compile to text with binding syntax the compiler did not write. Each literal passes
// alone, but the joined text can still form a binding in two ways:
//   - Adjacent literals, such as "{", "{ appsmith.store.secret }" and "}". So the literals are checked joined, with
//     the references left out.
//   - A literal next to a reference. A reference compiles to "{{ … }}", so "{" or "$" just before it, or "}" just
//     after it, would make "{{{", "${{" or "}}}" and widen the binding. So those edges are refused.
function partsFormBinding(parts: readonly (string | WidgetRef)[]): boolean {
  const literals = parts
    .map((part) => (typeof part === "string" ? part : ""))
    .join("");

  if (RAW_EXPRESSION.test(literals)) return true;

  // Merge adjacent literals first, so the text that touches a reference is the whole run. Otherwise an empty
  // literal, as in ["{", "", ref], would hide the brace from the check below.
  const runs: (string | WidgetRef)[] = [];

  for (const part of parts) {
    const last = runs[runs.length - 1];

    if (typeof part === "string" && typeof last === "string") {
      runs[runs.length - 1] = last + part;
    } else {
      runs.push(part);
    }
  }

  return runs.some((part, index) => {
    if (typeof part !== "string") return false;

    const next = runs[index + 1];
    const previous = runs[index - 1];

    return (
      (next !== undefined && typeof next !== "string" && /[{$]$/.test(part)) ||
      (previous !== undefined &&
        typeof previous !== "string" &&
        part.startsWith("}"))
    );
  });
}

// One field: literal text, a widget reference, or a list of both that the compiler joins in order.
function smtpText(max: number, header: boolean) {
  const literal = literalText(max, header);

  return z.union([
    literal,
    widgetRef,
    z
      .array(z.union([literal, widgetRef]))
      .min(1)
      .max(SMTP_PARTS_MAX)
      .refine((parts) => !partsFormBinding(parts), {
        message:
          "the parts must not join into binding/template syntax ({{ }}, ${ }, or backticks). A literal must not end with { or $ before a widget reference, or start with } after one",
      }),
  ]);
}

const headerText = smtpText(HEADER_MAX, true);
const bodyText = smtpText(BODY_MAX, false);

export const SMTP_BODY_TYPES = ["text/plain", "text/html"] as const;

export const smtpQuerySpecSchema = z
  .object({
    name: bindingIdentifier,
    applicationId: storedId,
    pageId: storedId,
    datasourceId: storedId,
    from: headerText,
    to: headerText,
    cc: headerText.optional(),
    bcc: headerText.optional(),
    replyTo: headerText.optional(),
    subject: headerText,
    body: bodyText.optional(),
    // Written explicitly. The plugin falls back to text/html when the field is missing, while the editor starts at
    // text/plain, so leaving it out would be ambiguous.
    bodyType: z.enum(SMTP_BODY_TYPES).default("text/plain"),
  })
  .strict();

export type SmtpQuerySpec = z.infer<typeof smtpQuerySpecSchema>;
type SmtpText = SmtpQuerySpec["to"];

// The stored fields a compiled email writes. Each is the text the plugin reads after binding evaluation.
export interface SmtpEmail {
  from: string;
  to: string;
  cc: string;
  bcc: string;
  replyTo: string;
  subject: string;
  bodyType: string;
}

export interface CompiledSmtpQuery {
  // actionConfiguration.formData, including the MCP marker.
  formData: Record<string, unknown>;
  // actionConfiguration.body.
  body: string;
  // Paths, relative to actionConfiguration, that hold a binding.
  bindingPaths: string[];
}

type FieldKind = "address" | "subject" | "textBody" | "htmlBody";

// The guard around a widget reference, by field kind. Each one is brace-free, so the emitted `{{ … }}` stays
// balanced. Quotes are written as " and ' inside the regex so a quote-aware binding splitter sees none.
function guardedReference(ref: WidgetRef, kind: FieldKind): string {
  const read = `${ref.widget}.${ref.property}`;

  switch (kind) {
    case "address":
      return `{{ ((v) => (v == null ? "" : Array.isArray(v) ? v.join(", ") : String(v)).replace(/[\\r\\n]+/g, " "))(${read}) }}`;
    case "subject":
      return `{{ ((v) => (v == null ? "" : String(v)).replace(/[\\r\\n]+/g, " "))(${read}) }}`;
    case "textBody":
      return `{{ ((v) => v == null ? "" : String(v))(${read}) }}`;
    case "htmlBody":
      return `{{ ((v) => (v == null ? "" : String(v)).replace(/[&<>\\u0022\\u0027]/g, (c) => "&#" + c.charCodeAt(0) + ";"))(${read}) }}`;
  }
}

function emitText(
  value: SmtpText | undefined,
  kind: FieldKind,
): { text: string; binding: boolean } {
  if (value === undefined) return { text: "", binding: false };

  const parts = Array.isArray(value) ? value : [value];
  let binding = false;
  const text = parts
    .map((part) => {
      if (typeof part === "string") return part;

      binding = true;

      return guardedReference(part, kind);
    })
    .join("");

  return { text, binding };
}

// The MCP marker. It lives in a formData key the SMTP plugin never reads, so it never reaches an email.
export const MCP_SMTP_MARKER_KEY = "mcpAuthored";
const MCP_SMTP_MARKER = /^v1 sha256=([0-9a-f]{64})$/;

function textOf(value: unknown): string {
  if (typeof value === "string") return value;

  // Tolerate a { data } wrapper, in case a form version stores one.
  if (value !== null && typeof value === "object") {
    const data = (value as { data?: unknown }).data;

    if (typeof data === "string") return data;
  }

  return "";
}

function sendOf(actionConfiguration: unknown): Record<string, unknown> | null {
  const formData = (actionConfiguration as { formData?: unknown } | null)
    ?.formData;
  const send = (formData as { send?: unknown } | null | undefined)?.send;

  return send !== null && typeof send === "object" && !Array.isArray(send)
    ? (send as Record<string, unknown>)
    : null;
}

// Whether a stored action configuration is an SMTP send. SMTP's plugin type is DB, the same as SQL, so the shape
// tells them apart: only the SMTP form writes formData.send.
export function isSmtpActionConfiguration(
  actionConfiguration: unknown,
): boolean {
  return sendOf(actionConfiguration) !== null;
}

// Whether a stored SMTP action has attachments set (in the editor). The SMTP compiler writes none, so an update
// from a spec would remove them. An empty list ("[]") or blank text counts as none.
export function smtpHasAttachments(actionConfiguration: unknown): boolean {
  const attachments = sendOf(actionConfiguration)?.attachments;

  if (Array.isArray(attachments)) return attachments.length > 0;

  const text = textOf(attachments).trim();

  return text !== "" && text !== "[]";
}

// The email's header fields as stored. These are addresses and a subject, never datasource credentials (those stay
// in the datasource), so they are returned for any SMTP action, including one written in the editor. The body is
// not here. It is returned only for an MCP-authored action (mcpAuthoredSmtpBody).
export function smtpEmailOf(actionConfiguration: unknown): SmtpEmail | null {
  const send = sendOf(actionConfiguration);

  if (send === null) return null;

  return {
    from: textOf(send.from),
    to: textOf(send.to),
    cc: textOf(send.cc),
    bcc: textOf(send.bcc),
    // The plugin ignores replyTo unless isReplyTo is true, so report what it will actually use.
    replyTo: send.isReplyTo === true ? textOf(send.replyTo) : "",
    subject: textOf(send.subject),
    // The plugin's default when the field is missing.
    bodyType: textOf(send.bodyType) || "text/html",
  };
}

// The digest covers every field the plugin reads, including attachments, so an edit to any of them hides the body.
function smtpConfigDigest(actionConfiguration: unknown): string {
  const send = sendOf(actionConfiguration) ?? {};

  return createHash("sha256")
    .update(
      canonicalStableSerialize({
        email: smtpEmailOf(actionConfiguration),
        isReplyTo: send.isReplyTo === true,
        // The stored value as it is, so a list of attachments changes the digest too. textOf would read a list as "".
        attachments: send.attachments ?? "",
        body: textOf((actionConfiguration as { body?: unknown } | null)?.body),
      }),
      "utf8",
    )
    .digest("hex");
}

// Writes the MCP marker for an action configuration's current content. An edition that rewrites a compiled
// configuration afterwards (EE: { param } placeholders to this.params) calls this again, so the marker matches what
// is stored.
export function stampMcpSmtpMarker(
  actionConfiguration: Record<string, unknown>,
): Record<string, unknown> {
  const formData = {
    ...((actionConfiguration.formData as Record<string, unknown> | undefined) ??
      {}),
  };

  delete formData[MCP_SMTP_MARKER_KEY];

  const unmarked = { ...actionConfiguration, formData };

  return {
    ...unmarked,
    formData: {
      ...formData,
      [MCP_SMTP_MARKER_KEY]: `v1 sha256=${smtpConfigDigest(unmarked)}`,
    },
  };
}

// The body of an SMTP action the MCP wrote, or undefined when it has no marker or was changed after the MCP wrote
// it. A body written in the editor can hold anything, so it is never returned.
export function mcpAuthoredSmtpBody(
  actionConfiguration: unknown,
): string | undefined {
  const formData = (actionConfiguration as { formData?: unknown } | null)
    ?.formData as Record<string, unknown> | undefined;
  const match = MCP_SMTP_MARKER.exec(textOf(formData?.[MCP_SMTP_MARKER_KEY]));

  if (!match || smtpConfigDigest(actionConfiguration) !== match[1]) {
    return undefined;
  }

  return textOf((actionConfiguration as { body?: unknown }).body);
}

export function compileSmtpQuery(spec: SmtpQuerySpec): CompiledSmtpQuery {
  const bindingPaths: string[] = [];
  const send: Record<string, unknown> = {};
  const header = (
    field: "from" | "to" | "cc" | "bcc" | "replyTo" | "subject",
    kind: FieldKind,
  ) => {
    const { binding, text } = emitText(spec[field], kind);

    send[field] = text;

    if (binding) bindingPaths.push(`formData.send.${field}`);
  };

  header("from", "address");
  header("to", "address");
  header("cc", "address");
  header("bcc", "address");
  header("subject", "subject");

  if (spec.replyTo !== undefined) {
    send.isReplyTo = true;
    header("replyTo", "address");
  } else {
    send.isReplyTo = false;
    send.replyTo = "";
  }

  send.bodyType = spec.bodyType;

  const body = emitText(
    spec.body,
    spec.bodyType === "text/html" ? "htmlBody" : "textBody",
  );

  if (body.binding) bindingPaths.push("body");

  const stamped = stampMcpSmtpMarker({
    formData: { command: "SEND", send },
    body: body.text,
  });

  return {
    formData: stamped.formData as Record<string, unknown>,
    body: body.text,
    bindingPaths,
  };
}

// Builds the ActionDTO accepted by POST /api/v1/actions. Sending email is a side effect, so the query never runs on
// page load. The create tool also pins MANUAL run behaviour, because the server can switch a query onto page load
// when a widget binds it.
export function buildSmtpActionDto(
  spec: SmtpQuerySpec,
  compiled: CompiledSmtpQuery,
): Record<string, unknown> {
  return {
    name: spec.name,
    pageId: spec.pageId,
    datasource: { id: spec.datasourceId },
    executeOnLoad: false,
    actionConfiguration: {
      formData: compiled.formData,
      body: compiled.body,
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
