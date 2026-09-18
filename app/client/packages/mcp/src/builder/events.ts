import { z } from "zod";
import type { WidgetNode } from "./layout.js";
import { responseFieldPath, storeKeySchema } from "./schema.js";

// M-F event wiring. A CLOSED event vocabulary: the agent supplies a structured action reference (run a query,
// navigate to a page, show/close a modal), and the compiler emits the trigger binding. The agent never authors raw
// `{{ }}` or JS. Names are strict identifiers / safe page names, so the single-quoted arguments the compiler emits
// (e.g. navigateTo('Page')) cannot be broken out of.

const queryName = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_]+$/, "must be a query name (alphanumeric/underscore)");
const widgetName = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_]+$/, "must be a widget name (alphanumeric/underscore)");
const pageName = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_ ]+$/, "must be a safe page name");

// Alert text is emitted inside a single-quoted argument, so the charset excludes quotes, backslashes, braces, and
// backticks — nothing in it can terminate the string or open an expression.
const alertMessage = z
  .string()
  .min(1)
  .max(200)
  .regex(
    /^[A-Za-z0-9_ .,:!?()-]+$/,
    "alert messages allow letters, numbers, spaces, and . , : ! ? ( ) -",
  );

const alertStyle = z.enum(["info", "success", "warning", "error"]);

// Reset (clear) one or more widgets to their default state — e.g. a Clear button that empties an input and resets a
// table. Each name is a strict widget identifier, so the emitted resetWidget('Name', true) cannot be broken out of.
const resetAction = z
  .object({
    reset: z.union([widgetName, z.array(widgetName).min(1).max(10)]),
  })
  .strict();

// M5 fields projection — one bracket-access path element into the query's response: a string key or a non-negative
// integer array index. Each element is emitted through JSON.stringify into `?.[...]` bracket access, so quotes and
// backslashes in a key cannot terminate the emitted string literal. Defense-in-depth ON TOP of that escaping: the
// binding-syntax charsets are still rejected, because Appsmith's `{{ }}` extraction is text-level (not JS-aware) —
// a `}}` inside a JSON-escaped string would still terminate the outer binding and let a following `{{ ... }}` in the
// same key become a second, evaluated expression. Same rejection set as schema.ts safeText (incl. U+2028/U+2029).
const RAW_EXPRESSION = /\u007b\u007b|\u007d\u007d|\$\u007b|`|\u2028|\u2029/;
const storePathElement = z.union([
  z
    .string()
    .min(1)
    .max(100)
    .refine((value) => !RAW_EXPRESSION.test(value), {
      message:
        "path elements must not contain binding/template syntax ({{ }}, ${ }, or backticks)",
    })
    // M6 hardening: a single quote in a path element would let an agent embed the literal text
    // closeModal('Host') / showModal('X') inside the compiled binding's JSON string. The wiring being made is
    // judged structurally, but LATER text scans of the persisted binding would misread those as edges —
    // closeModal poisoning could reclassify a real stacking edge as a wizard transition and skip the depth
    // gate. JSON keys with apostrophes are vanishingly rare; reject the quote outright.
    .refine((value) => !value.includes("'"), {
      message: "path elements must not contain single quotes",
    }),
  z.number().int().min(0).max(100_000),
]);

// One projected row field: `as` names the property on the appended row (a store key — identifier-shaped and
// prototype-denylisted, because it is emitted as an UNQUOTED object-literal key where `__proto__:` would rewrite
// the row's prototype); `path` is the bracket-access path into the query's response. The projection exists because
// real APIs return space-keyed and array-indexed values ("post code", places[0].state) that the dotted `field`
// identifier path cannot reach.
const storeFieldProjection = z
  .object({
    as: storeKeySchema,
    path: z.array(storePathElement).min(1).max(5),
  })
  .strict();

// M5 appendToStore — accumulate a query's response under a store key (the ZIP-lookup "results table that grows with
// each lookup" pattern). `field` keeps the existing responseFieldPath rules; `fields` projects named paths into ONE
// appended row; the two are mutually exclusive. `query` resolves through the same dangling-reference guard as `run`.
const appendToStoreSpec = z
  .object({
    key: storeKeySchema,
    query: queryName,
    field: responseFieldPath.optional(),
    fields: z.array(storeFieldProjection).min(1).max(20).optional(),
  })
  .strict()
  .refine((spec) => !(spec.field !== undefined && spec.fields !== undefined), {
    message: "'field' and 'fields' are mutually exclusive",
  });

const appendToStoreAction = z
  .object({ appendToStore: appendToStoreSpec })
  .strict();

// M5 clearStoreKey — empty ONE store key (storeValue('<key>', [])), keeping the `?? []` table binding stable.
// Deliberately NOT named clearStore: the platform global clearStore() wipes the entire store.
const clearStoreKeyAction = z
  .object({ clearStoreKey: z.object({ key: storeKeySchema }).strict() })
  .strict();

// A follow-up step inside a run's onSuccess/onError callback: the same closed kinds plus showAlert and reset.
// Follow-ups can never nest further (no callbacks on callbacks), so the compiled binding stays one bounded chain.
const followUpActionSchema = z.union([
  z.object({ run: queryName }).strict(),
  z.object({ navigate: pageName }).strict(),
  z.object({ showModal: widgetName }).strict(),
  z.object({ closeModal: widgetName }).strict(),
  z.object({ showAlert: alertMessage, style: alertStyle.optional() }).strict(),
  resetAction,
  appendToStoreAction,
  clearStoreKeyAction,
]);

export type FollowUpAction = z.infer<typeof followUpActionSchema>;

// One primary action per event. `run` may chain follow-ups: onSuccess runs after the query resolves (refresh a
// table by re-running its query, close the modal, confirm with an alert) and onError after it rejects.
export const eventActionSchema = z.union([
  z
    .object({
      run: queryName,
      onSuccess: z.array(followUpActionSchema).min(1).max(5).optional(),
      onError: z.array(followUpActionSchema).min(1).max(5).optional(),
    })
    .strict(),
  z.object({ navigate: pageName }).strict(),
  z.object({ showModal: widgetName }).strict(),
  z.object({ closeModal: widgetName }).strict(),
  z.object({ showAlert: alertMessage, style: alertStyle.optional() }).strict(),
  resetAction,
  appendToStoreAction,
  clearStoreKeyAction,
]);

export type EventAction = z.infer<typeof eventActionSchema>;

// M5: the primary action may also be a LIST of 2–5 statements executed in order — required so a Clear button can
// clearStoreKey AND reset the input in one click. Only `run` carries onSuccess/onError, and at most one run per
// list keeps the emission a single bounded chain; the statements join the same fixed templates with ';', so the
// security profile is unchanged.
export const eventActionListSchema = z
  .array(eventActionSchema)
  .min(2)
  .max(5)
  .refine((actions) => actions.filter((step) => "run" in step).length <= 1, {
    message: "a statement list may contain at most one 'run'",
  })
  // The list is STARTED in order but `run` is asynchronous: a sibling appendToStore of the same query would
  // execute before the run resolves and read the PREVIOUS response — the exact stale-table confusion this
  // vocabulary exists to eliminate. Data-dependent verbs belong in that run's onSuccess.
  .refine(
    (actions) => {
      const runs = new Set(
        actions.flatMap((step) => ("run" in step ? [step.run] : [])),
      );

      return !actions.some(
        (step) => "appendToStore" in step && runs.has(step.appendToStore.query),
      );
    },
    {
      message:
        "appendToStore of a query that a sibling 'run' starts would read the previous response ('run' is asynchronous); put the appendToStore in that run's onSuccess instead",
    },
  );

export type EventActionInput = EventAction | EventAction[];

// The event property allowed on each widget type (closed). form submit is wired via the form's button onClick.
// Change/submit events let controls drive queries directly ("re-run when the dropdown changes") — the page-load
// case needs no event at all: the server auto-derives on-page-load execution from widget bindings when the
// layout is saved, so a query bound to any widget already runs on load.
const EVENTS_BY_TYPE: Record<string, readonly string[]> = {
  BUTTON_WIDGET: ["onClick"],
  TABLE_WIDGET_V2: ["onRowSelected"],
  MODAL_WIDGET: ["onClose"],
  TABS_WIDGET: ["onTabSelected"],
  SELECT_WIDGET: ["onOptionChange"],
  INPUT_WIDGET_V2: ["onSubmit"],
  CHECKBOX_WIDGET: ["onCheckChange"],
  SWITCH_WIDGET: ["onChange"],
  DATE_PICKER_WIDGET2: ["onDateSelected"],
};

export const wireEventSpecSchema = z
  .object({
    widget: widgetName,
    event: z.enum([
      "onClick",
      "onRowSelected",
      "onClose",
      "onTabSelected",
      "onOptionChange",
      "onSubmit",
      "onCheckChange",
      "onChange",
      "onDateSelected",
    ]),
    // A single action, or (M5) an ordered list of 2–5 statements.
    action: z.union([eventActionSchema, eventActionListSchema]),
  })
  .strict();

export type WireEventSpec = z.infer<typeof wireEventSpecSchema>;

// The bracket-access path into a query's response for one projected field: `Q.data?.["post code"]`,
// `Q.data?.["places"]?.[0]?.["state"]`. Every element passes through JSON.stringify, so a key's quotes/backslashes
// cannot terminate the emitted string literal (binding syntax is additionally rejected by storePathElement).
function compileStorePath(query: string, path: (string | number)[]): string {
  return path.reduce<string>(
    (expression, element) => `${expression}?.[${JSON.stringify(element)}]`,
    `${query}.data`,
  );
}

// One statement of the closed vocabulary, without the outer `{{ }}`. Every interpolated value is a validated
// identifier / safe charset, so no argument can escape its single-quoted position.
function compileStatement(action: FollowUpAction): string {
  if ("run" in action) return `${action.run}.run()`;

  if ("navigate" in action) {
    return `navigateTo('${action.navigate}', {}, 'SAME_WINDOW')`;
  }

  if ("showModal" in action) return `showModal('${action.showModal}')`;

  if ("closeModal" in action) return `closeModal('${action.closeModal}')`;

  if ("reset" in action) {
    const names = Array.isArray(action.reset) ? action.reset : [action.reset];

    return names.map((name) => `resetWidget('${name}', true)`).join("; ");
  }

  // M5 appendToStore: accumulate under a store key. `[].concat` (not spread) flattens an array-returning query
  // (one row per record) and appends an object response — or the fields-projected row — as a single row.
  // `persist=false` (third arg) is deliberate: the Appsmith store persists to localStorage keyed per APP, not per
  // user, so persisted accumulation would leak one user's rows to the next user of a shared browser and outlive
  // logout. Session-only means results reset on reload — by design.
  if ("appendToStore" in action) {
    const { field, fields, key, query } = action.appendToStore;
    const expression = fields
      ? `{ ${fields
          .map(({ as, path }) => `${as}: ${compileStorePath(query, path)}`)
          .join(", ")} }`
      : field
        ? `${query}.data?.${field}`
        : `${query}.data`;

    return `storeValue('${key}', [].concat(appsmith.store.${key} ?? [], ${expression} ?? []), false)`;
  }

  // M5 clearStoreKey: empty ONE key (never the platform clearStore(), which wipes the whole store). Writing []
  // rather than removing the value keeps the table's `?? []` binding stable.
  if ("clearStoreKey" in action) {
    return `storeValue('${action.clearStoreKey.key}', [], false)`;
  }

  return `showAlert('${action.showAlert}', '${action.style ?? "info"}')`;
}

// One primary statement's full expression: a chained run compiles to one bounded promise expression
// (`Q.run().then(() => { ...; }).catch(() => { ...; })`), every other verb to its fixed template.
function compilePrimaryExpression(action: EventAction): string {
  if (!("run" in action)) return compileStatement(action);

  let expression = `${action.run}.run()`;

  if (action.onSuccess !== undefined) {
    const steps = action.onSuccess.map(compileStatement).join("; ");

    expression += `.then(() => { ${steps}; })`;
  }

  if (action.onError !== undefined) {
    const steps = action.onError.map(compileStatement).join("; ");

    expression += `.catch(() => { ${steps}; })`;
  }

  return expression;
}

// The single binding emitter. A statement list (M5) joins the same fixed per-statement templates with ';' — the
// schema caps it at 5 statements with at most one run, so the emission stays one bounded expression.
export function compileEventBinding(action: EventActionInput): string {
  const actions = Array.isArray(action) ? action : [action];

  return `{{ ${actions.map(compilePrimaryExpression).join("; ")} }}`;
}

// Every entity an event references — each primary statement plus all follow-ups — so the caller can verify each
// exists before writing (dangling-reference guard). showAlert and clearStoreKey reference nothing;
// appendToStore references its source query.
export function eventReferences(action: EventActionInput): {
  kind: "query" | "page" | "widget";
  name: string;
}[] {
  const single = (
    step: FollowUpAction,
  ): { kind: "query" | "page" | "widget"; name: string }[] => {
    if ("run" in step) return [{ kind: "query" as const, name: step.run }];

    if ("navigate" in step) {
      return [{ kind: "page" as const, name: step.navigate }];
    }

    if ("showModal" in step) {
      return [{ kind: "widget" as const, name: step.showModal }];
    }

    if ("closeModal" in step) {
      return [{ kind: "widget" as const, name: step.closeModal }];
    }

    if ("reset" in step) {
      const names = Array.isArray(step.reset) ? step.reset : [step.reset];

      return names.map((name) => ({ kind: "widget" as const, name }));
    }

    if ("appendToStore" in step) {
      return [{ kind: "query" as const, name: step.appendToStore.query }];
    }

    return [];
  };
  const primary = (
    step: EventAction,
  ): { kind: "query" | "page" | "widget"; name: string }[] => {
    if (!("run" in step)) return single(step);

    return [
      { kind: "query" as const, name: step.run },
      ...(step.onSuccess ?? []).flatMap(single),
      ...(step.onError ?? []).flatMap(single),
    ];
  };
  const actions = Array.isArray(action) ? action : [action];

  return actions.flatMap(primary);
}

// The statement verb kinds an action uses (each primary statement plus its follow-ups), deduped in encounter
// order — recorded in wire_event's audit/telemetry payload so verb adoption (e.g. appendToStore) is measurable.
export function eventActionKinds(action: EventActionInput): string[] {
  const kindOf = (step: FollowUpAction | EventAction): string => {
    if ("run" in step) return "run";

    if ("navigate" in step) return "navigate";

    if ("showModal" in step) return "showModal";

    if ("closeModal" in step) return "closeModal";

    if ("reset" in step) return "reset";

    if ("appendToStore" in step) return "appendToStore";

    if ("clearStoreKey" in step) return "clearStoreKey";

    return "showAlert";
  };
  const kinds: string[] = [];
  const add = (kind: string): void => {
    if (!kinds.includes(kind)) kinds.push(kind);
  };

  for (const step of Array.isArray(action) ? action : [action]) {
    add(kindOf(step));

    if ("run" in step) {
      for (const followUp of step.onSuccess ?? []) add(kindOf(followUp));

      for (const followUp of step.onError ?? []) add(kindOf(followUp));
    }
  }

  return kinds;
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function locateWidgetNamed(
  node: WidgetNode,
  name: string,
): WidgetNode | undefined {
  if (node.widgetName === name) return node;

  for (const child of node.children ?? []) {
    const found = locateWidgetNamed(child, name);

    if (found) return found;
  }

  return undefined;
}

// Set the event's trigger binding on the named widget and register the trigger path. Returns a new DSL (the caller's
// DSL is never mutated) plus a small change summary. Throws on unknown widget or an event invalid for the type.
export function applyEvent(
  dsl: WidgetNode,
  spec: WireEventSpec,
): { dsl: WidgetNode; widgetType: string; binding: string } {
  const next = cloneJson(dsl);
  const widget = locateWidgetNamed(next, spec.widget);

  if (!widget) {
    throw new Error(`widget "${spec.widget}" was not found on this page`);
  }

  const allowed = EVENTS_BY_TYPE[widget.type];

  if (!allowed || !allowed.includes(spec.event)) {
    throw new Error(
      `event "${spec.event}" is not supported on ${widget.type} (${spec.widget})`,
    );
  }

  const binding = compileEventBinding(spec.action);

  widget[spec.event] = binding;

  const triggerPaths = Array.isArray(widget.dynamicTriggerPathList)
    ? (widget.dynamicTriggerPathList as { key: string }[])
    : [];

  if (!triggerPaths.some((entry) => entry.key === spec.event)) {
    triggerPaths.push({ key: spec.event });
  }

  widget.dynamicTriggerPathList = triggerPaths;

  return { dsl: next, widgetType: widget.type, binding };
}

// Whether a modal/widget referenced by show/closeModal exists on the page (widget-scoped reference check).
export function widgetExists(dsl: WidgetNode, name: string): boolean {
  return locateWidgetNamed(dsl, name) !== undefined;
}
