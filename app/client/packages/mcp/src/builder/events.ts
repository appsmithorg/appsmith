import { z } from "zod";
import type { WidgetNode } from "./layout.js";

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

// A follow-up step inside a run's onSuccess/onError callback: the same closed kinds plus showAlert. Follow-ups can
// never nest further (no callbacks on callbacks), so the compiled binding stays one bounded promise chain.
const followUpActionSchema = z.union([
  z.object({ run: queryName }).strict(),
  z.object({ navigate: pageName }).strict(),
  z.object({ showModal: widgetName }).strict(),
  z.object({ closeModal: widgetName }).strict(),
  z.object({ showAlert: alertMessage, style: alertStyle.optional() }).strict(),
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
]);

export type EventAction = z.infer<typeof eventActionSchema>;

// The event property allowed on each widget type (closed). form submit is wired via the form's button onClick.
const EVENTS_BY_TYPE: Record<string, readonly string[]> = {
  BUTTON_WIDGET: ["onClick"],
  TABLE_WIDGET_V2: ["onRowSelected"],
  MODAL_WIDGET: ["onClose"],
  TABS_WIDGET: ["onTabSelected"],
};

export const wireEventSpecSchema = z
  .object({
    widget: widgetName,
    event: z.enum(["onClick", "onRowSelected", "onClose", "onTabSelected"]),
    action: eventActionSchema,
  })
  .strict();

export type WireEventSpec = z.infer<typeof wireEventSpecSchema>;

// One statement of the closed vocabulary, without the outer `{{ }}`. Every interpolated value is a validated
// identifier / safe charset, so no argument can escape its single-quoted position.
function compileStatement(action: FollowUpAction): string {
  if ("run" in action) return `${action.run}.run()`;

  if ("navigate" in action) {
    return `navigateTo('${action.navigate}', {}, 'SAME_WINDOW')`;
  }

  if ("showModal" in action) return `showModal('${action.showModal}')`;

  if ("closeModal" in action) return `closeModal('${action.closeModal}')`;

  return `showAlert('${action.showAlert}', '${action.style ?? "info"}')`;
}

// The single binding emitter. A chained run compiles to one bounded promise expression:
// `{{ Q.run().then(() => { ...; }).catch(() => { ...; }) }}`.
export function compileEventBinding(action: EventAction): string {
  if (!("run" in action)) return `{{ ${compileStatement(action)} }}`;

  let expression = `${action.run}.run()`;

  if (action.onSuccess !== undefined) {
    const steps = action.onSuccess.map(compileStatement).join("; ");

    expression += `.then(() => { ${steps}; })`;
  }

  if (action.onError !== undefined) {
    const steps = action.onError.map(compileStatement).join("; ");

    expression += `.catch(() => { ${steps}; })`;
  }

  return `{{ ${expression} }}`;
}

// Every entity an event references — the primary action plus all follow-ups — so the caller can verify each exists
// before writing (dangling-reference guard). showAlert references nothing.
export function eventReferences(action: EventAction): {
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

    return [];
  };

  if (!("run" in action)) return single(action);

  return [
    { kind: "query" as const, name: action.run },
    ...(action.onSuccess ?? []).flatMap(single),
    ...(action.onError ?? []).flatMap(single),
  ];
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
