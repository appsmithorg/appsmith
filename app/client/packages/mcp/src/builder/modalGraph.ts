import type { WidgetNode } from "./layout.js";
import type {
  EventAction,
  EventActionInput,
  FollowUpAction,
} from "./events.js";
import { nameOf } from "./occupancy.js";

// M6 modal discipline — the modal-open EVENT GRAPH. Appsmith modals are page-level overlays, so modal-on-modal
// stacking is a property of wired events, not of DSL nesting: modal A's button runs showModal('B') while A stays
// open. This module builds that graph and enforces the council policy: a stack of depth 2 (one modal over another,
// e.g. confirm-over-edit) warns; depth >= 3 and cycles over STACKING edges reject.
//
// CLOSE-AWARE TRANSITIONS: an edge whose binding also closes its host modal (closeModal('<host>') in the same
// statement list / onSuccess chain) is a TRANSITION, not stacking — sequential wizards (Step1 -> close+open Step2)
// and modal back-navigation (Confirm's Back closes itself and reopens Edit) never stack at runtime, so they carry
// no depth and are excluded from cycle detection.
//
// PARSER CONTRACT (security-reviewed): pre-existing DSL bindings are scanned with LINEAR global regexes only —
// no nested quantifiers, no anchored full-match (M5 emits showModal inside `.then(() => { ... })` chains and
// ';'-joined lists, which an anchored match would miss) — over TRIGGER PROPS ONLY, each capped in size, per-prop
// fail-open. Never eval or AST-parse user JS. The NEW edge being wired must come from the STRUCTURAL action walk
// (structuralModalRefs), never from text-parsing the just-compiled binding, so an agent can never emit a showModal
// the graph misses; an emitter<->parser coupling test pins the two extractions equal on every emittable shape.

export const PAGE_HOST = "__page__";

// Per-prop scan cap: beyond this an (invariably human-authored) binding is skipped and counted as excluded —
// neutralizes the quadratic worst case of brace-matching regex classes on adversarial inputs.
export const MAX_SCANNED_BINDING_LENGTH = 50_000;

const SHOW_MODAL = /showModal\('([A-Za-z0-9_]{1,64})'\)/g;
const CLOSE_MODAL = /closeModal\('([A-Za-z0-9_]{1,64})'\)/g;

export interface ModalEdge {
  // The modal whose canvas hosts the triggering widget, or PAGE_HOST.
  host: string;
  // The modal the binding opens.
  target: string;
  // True when the same binding also closes the host — a wizard/back-nav transition, not stacking.
  closesHost: boolean;
  // The widget carrying the binding (for messages).
  via: string;
}

export interface ModalGraph {
  edges: ModalEdge[];
  // Trigger bindings excluded from analysis: oversized, nested-path trigger keys (e.g. table primaryColumns
  // events — not authorable via MCP), or showModal/closeModal text in a shape the closed emitter never produces.
  excludedBindings: number;
}

// Structural extraction from a PARSED action — the authoritative source for the edge being wired.
export function structuralModalRefs(action: EventActionInput): {
  opens: string[];
  closes: string[];
} {
  const opens: string[] = [];
  const closes: string[] = [];
  const step = (statement: FollowUpAction | EventAction) => {
    if ("showModal" in statement) opens.push(statement.showModal);

    if ("closeModal" in statement) closes.push(statement.closeModal);

    if ("run" in statement) {
      const chained = statement as EventAction & { run: string };

      if ("onSuccess" in chained) chained.onSuccess?.forEach(step);

      if ("onError" in chained) chained.onError?.forEach(step);
    }
  };
  const actions = Array.isArray(action) ? action : [action];

  actions.forEach(step);

  return { opens: [...new Set(opens)], closes: [...new Set(closes)] };
}

function matchAll(pattern: RegExp, text: string): string[] {
  const names: string[] = [];

  pattern.lastIndex = 0;

  for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
    names.push(match[1]);
  }

  return names;
}

interface ScanTarget {
  widget: WidgetNode;
  host: string;
  // Skip this widget's named event prop (the binding being overwritten by the current wire_event call).
  skipProp?: string;
}

function triggerKeys(widget: WidgetNode): {
  topLevel: string[];
  nested: number;
} {
  const list = widget.dynamicTriggerPathList;

  if (!Array.isArray(list)) return { topLevel: [], nested: 0 };

  // Deduped: N duplicate {key:"onClick"} entries in a hostile list must not rescan the same prop N times.
  const topLevel = new Set<string>();
  let nested = 0;

  for (const entry of list) {
    const key = (entry as { key?: unknown } | null)?.key;

    if (typeof key !== "string") continue;

    // Nested trigger paths (table primaryColumns button events, human-authored) are outside the scan — the
    // documented fail-open limitation; they are counted so inspect_page can surface the omission.
    if (key.includes(".")) nested += 1;
    else topLevel.add(key);
  }

  return { topLevel: [...topLevel], nested };
}

function scanWidget(target: ScanTarget): {
  edges: ModalEdge[];
  excluded: number;
} {
  const { host, skipProp, widget } = target;
  const { nested, topLevel } = triggerKeys(widget);
  const edges: ModalEdge[] = [];
  let excluded = nested;

  for (const key of topLevel) {
    if (key === skipProp) continue;

    const value = widget[key];

    if (typeof value !== "string" || value.length === 0) continue;

    if (value.length > MAX_SCANNED_BINDING_LENGTH) {
      excluded += 1;
      continue;
    }

    try {
      const opens = matchAll(SHOW_MODAL, value);
      const closes = new Set(matchAll(CLOSE_MODAL, value));

      // A binding that mentions the verbs in a shape the closed emitter never produces (e.g. double quotes,
      // variable arguments) parsed to nothing — count it excluded rather than silently treating it as inert.
      if (
        opens.length === 0 &&
        closes.size === 0 &&
        /showModal|closeModal/.test(value)
      ) {
        excluded += 1;
        continue;
      }

      for (const open of new Set(opens)) {
        edges.push({
          host,
          target: open,
          closesHost: host !== PAGE_HOST && closes.has(host),
          via: nameOf(widget),
        });
      }
    } catch {
      excluded += 1;
    }
  }

  return { edges, excluded };
}

// Build the graph from the live DSL. `skip` names a widget/event pair whose existing binding is being replaced
// by the current wire_event call (its old edges must not count against the new action).
export function collectModalGraph(
  dsl: WidgetNode,
  skip?: { widget: string; event: string },
): ModalGraph {
  const edges: ModalEdge[] = [];
  let excludedBindings = 0;
  const walk = (node: WidgetNode, host: string) => {
    const scanned = scanWidget({
      widget: node,
      host,
      skipProp:
        skip !== undefined && nameOf(node) === skip.widget
          ? skip.event
          : undefined,
    });

    edges.push(...scanned.edges);
    excludedBindings += scanned.excluded;
    const nextHost = node.type === "MODAL_WIDGET" ? nameOf(node) : host;

    for (const child of node.children ?? []) walk(child, nextHost);
  };

  walk(dsl, PAGE_HOST);

  return { edges, excludedBindings };
}

// Nearest enclosing MODAL_WIDGET ancestor of a named widget, or PAGE_HOST.
export function hostModalOf(dsl: WidgetNode, widgetName: string): string {
  let found = PAGE_HOST;
  const walk = (node: WidgetNode, host: string): boolean => {
    if (nameOf(node) === widgetName) {
      found = host;

      return true;
    }

    const nextHost = node.type === "MODAL_WIDGET" ? nameOf(node) : host;

    return (node.children ?? []).some((child) => walk(child, nextHost));
  };

  walk(dsl, PAGE_HOST);

  return found;
}

function stackingEdges(graph: ModalGraph): ModalEdge[] {
  return graph.edges.filter((edge) => !edge.closesHost);
}

// The policy only ever distinguishes depths up to "3 or more" and prints chains of at most 5, so both walks
// short-circuit there — longest-path DFS without a bound is exponential on dense (hand-authorable) graphs, and
// these run inside every lint/inspect_page and every wire_event. Local-CPU hardening, not a correctness change.
const MAX_TRACKED_DEPTH = 4;
const MAX_TRACKED_CHAIN = 5;

// Longest stacking path from the page to `modal`, capped at MAX_TRACKED_DEPTH (an unopened modal still renders
// at depth 1). Cycle-safe.
function modalDepth(
  modal: string,
  edges: ModalEdge[],
  visiting: Set<string> = new Set(),
): number {
  if (visiting.has(modal)) return 1;

  if (visiting.size >= MAX_TRACKED_DEPTH) return 1;

  visiting.add(modal);
  let deepest = 1;

  for (const edge of edges) {
    if (edge.target !== modal) continue;

    deepest = Math.max(
      deepest,
      edge.host === PAGE_HOST ? 1 : 1 + modalDepth(edge.host, edges, visiting),
    );

    if (deepest >= MAX_TRACKED_DEPTH) break;
  }

  visiting.delete(modal);

  return Math.min(deepest, MAX_TRACKED_DEPTH);
}

// Longest stacking chain OPENED FROM `modal`, capped at MAX_TRACKED_CHAIN, with the path (for messages).
// Cycle-safe.
function chainFrom(
  modal: string,
  edges: ModalEdge[],
  visiting: Set<string> = new Set(),
): string[] {
  if (visiting.has(modal) || visiting.size >= MAX_TRACKED_CHAIN) return [];

  visiting.add(modal);
  let longest: string[] = [];

  for (const edge of edges) {
    if (edge.host !== modal) continue;

    const rest = [edge.target, ...chainFrom(edge.target, edges, visiting)];

    if (rest.length > longest.length) longest = rest;

    if (longest.length >= MAX_TRACKED_CHAIN - visiting.size + 1) break;
  }

  visiting.delete(modal);

  return longest;
}

function stackingReachable(from: string, edges: ModalEdge[]): Set<string> {
  const seen = new Set<string>();
  const queue = [from];

  while (queue.length > 0) {
    const current = queue.pop() as string;

    for (const edge of edges) {
      if (edge.host === current && !seen.has(edge.target)) {
        seen.add(edge.target);
        queue.push(edge.target);
      }
    }
  }

  return seen;
}

const truncate = (name: string): string =>
  name.length > 40 ? `${name.slice(0, 40)}…` : name;

const printChain = (chain: string[]): string =>
  chain.slice(0, 5).map(truncate).join(" → ") +
  (chain.length > 5 ? " → …" : "");

export interface ModalWiringVerdict {
  error?: string;
  warning?: string;
  excludedBindings: number;
}

// Evaluate wiring `action` onto `widgetName`'s `event` against the live DSL. Only STACKING opens count; a
// close-then-open transition (the action also closes the host) adds no depth and joins no cycle.
export function evaluateModalWiring(params: {
  dsl: WidgetNode;
  widgetName: string;
  event: string;
  action: EventActionInput;
}): ModalWiringVerdict {
  const { action, dsl, event, widgetName } = params;
  const refs = structuralModalRefs(action);
  const graph = collectModalGraph(dsl, { widget: widgetName, event });

  if (refs.opens.length === 0) {
    return { excludedBindings: graph.excludedBindings };
  }

  const host = hostModalOf(dsl, widgetName);
  const existing = stackingEdges(graph);
  let warning: string | undefined;

  for (const target of refs.opens) {
    const isTransition = host !== PAGE_HOST && refs.closes.includes(host);

    if (isTransition) continue;

    // Cycle over stacking edges: the new edge host -> target closes a loop back to the host.
    if (
      host !== PAGE_HOST &&
      (target === host || stackingReachable(target, existing).has(host))
    ) {
      const loop = [host, target, ...chainFrom(target, existing)];

      return {
        error:
          `wiring this event creates a modal cycle (${printChain(loop)}): each showModal leaves the previous ` +
          "modal open. Close the host modal in the same action (closeModal) to make it a transition instead",
        excludedBindings: graph.excludedBindings,
      };
    }

    const hostDepth = host === PAGE_HOST ? 0 : modalDepth(host, existing);
    const below = chainFrom(target, existing);
    const depth = hostDepth + 1 + below.length;

    if (depth >= 3) {
      const chain = [...(host === PAGE_HOST ? [] : [host]), target, ...below];

      return {
        error:
          `wiring this event stacks ${depth} modals (${printChain(chain)}). Stacks deeper than 2 are not ` +
          "allowed: close the host modal in the same action (closeModal) to transition instead of stacking",
        excludedBindings: graph.excludedBindings,
      };
    }

    if (depth === 2 && warning === undefined) {
      warning =
        `"${truncate(target)}" will open on top of "${truncate(host)}" (modal stack depth 2). This is allowed ` +
        "but consider closing the host modal in the same action for a transition instead of a stack";
    }
  }

  return { warning, excludedBindings: graph.excludedBindings };
}

export interface ModalStackFinding {
  rule: "modal-stack" | "modal-cycle" | "modal-analysis-excluded";
  msg: string;
  widget?: string;
}

// Lint-side view: existing stacks (depth >= 2) and stacking cycles as warnings; the excluded-bindings count so
// the fail-open omission is visible per page rather than buried in docs.
export function modalStackFindings(dsl: WidgetNode): ModalStackFinding[] {
  const graph = collectModalGraph(dsl);
  const edges = stackingEdges(graph);
  const findings: ModalStackFinding[] = [];
  const modals = new Set<string>();

  for (const edge of edges) {
    modals.add(edge.target);

    if (edge.host !== PAGE_HOST) modals.add(edge.host);
  }

  for (const modal of modals) {
    if (stackingReachable(modal, edges).has(modal)) {
      findings.push({
        rule: "modal-cycle",
        msg: `modal "${truncate(modal)}" is part of a showModal cycle (${printChain([modal, ...chainFrom(modal, edges)])})`,
        widget: modal,
      });
      continue;
    }

    const depth = modalDepth(modal, edges);

    if (depth >= 2) {
      findings.push({
        rule: "modal-stack",
        msg: `modal "${truncate(modal)}" opens at stack depth ${depth}; stacks deeper than 2 will be rejected when wired via MCP`,
        widget: modal,
      });
    }
  }

  if (graph.excludedBindings > 0) {
    findings.push({
      rule: "modal-analysis-excluded",
      msg: `${graph.excludedBindings} event binding(s) were excluded from modal-stack analysis (oversized, nested trigger paths, or shapes the MCP never emits)`,
    });
  }

  return findings;
}

// Structural rule: no MODAL_WIDGET anywhere inside another modal's subtree.
export function containsModal(node: WidgetNode): boolean {
  if (node.type === "MODAL_WIDGET") return true;

  return (node.children ?? []).some(containsModal);
}

// Every "outer>inner" nested-modal pair in the tree (any depth, incl. modal-in-container-in-modal).
export function nestedModalViolations(root: WidgetNode): string[] {
  const violations: string[] = [];
  const walk = (node: WidgetNode, enclosingModal: string | undefined) => {
    const isModal = node.type === "MODAL_WIDGET";

    if (isModal && enclosingModal !== undefined) {
      violations.push(`${enclosingModal}>${nameOf(node)}`);
    }

    const nextModal = isModal ? nameOf(node) : enclosingModal;

    for (const child of node.children ?? []) walk(child, nextModal);
  };

  walk(root, undefined);

  return violations;
}

// Delta-aware structural gate: a mutation may not INTRODUCE a nested modal (pre-existing human-authored nesting
// stays editable, matching the overlap gate's philosophy). Pass `before: undefined` for fresh builds.
export function assertNoNewNestedModals(
  before: WidgetNode | undefined,
  after: WidgetNode,
): void {
  const preExisting = new Set(
    before === undefined ? [] : nestedModalViolations(before),
  );
  const introduced = nestedModalViolations(after).filter(
    (violation) => !preExisting.has(violation),
  );

  if (introduced.length > 0) {
    const [outer, inner] = introduced[0].split(">");

    throw new Error(
      `a modal ("${truncate(inner)}") cannot be placed inside another modal ("${truncate(outer)}") — modals are ` +
        "page-level overlays. Place it at the page level and open it with a wire_event showModal action instead",
    );
  }
}
