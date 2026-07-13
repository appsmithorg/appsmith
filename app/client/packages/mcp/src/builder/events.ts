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

// Exactly one action per event.
export const eventActionSchema = z.union([
  z.object({ run: queryName }).strict(),
  z.object({ navigate: pageName }).strict(),
  z.object({ showModal: widgetName }).strict(),
  z.object({ closeModal: widgetName }).strict(),
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

// The single binding emitter. Every argument is a validated identifier / safe page name.
export function compileEventBinding(action: EventAction): string {
  if ("run" in action) return `{{ ${action.run}.run() }}`;

  if ("navigate" in action) {
    return `{{ navigateTo('${action.navigate}', {}, 'SAME_WINDOW') }}`;
  }

  if ("showModal" in action) return `{{ showModal('${action.showModal}') }}`;

  return `{{ closeModal('${action.closeModal}') }}`;
}

// The entity an event references, so the caller can verify it exists before writing (dangling-reference guard).
export function eventReference(action: EventAction): {
  kind: "query" | "page" | "widget";
  name: string;
} {
  if ("run" in action) return { kind: "query", name: action.run };

  if ("navigate" in action) return { kind: "page", name: action.navigate };

  if ("showModal" in action) return { kind: "widget", name: action.showModal };

  return { kind: "widget", name: action.closeModal };
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
