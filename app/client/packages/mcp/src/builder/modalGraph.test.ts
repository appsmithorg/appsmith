import {
  assertNoNewNestedModals,
  collectModalGraph,
  containsModal,
  evaluateModalWiring,
  hostModalOf,
  MAX_SCANNED_BINDING_LENGTH,
  modalStackFindings,
  nestedModalViolations,
  PAGE_HOST,
  structuralModalRefs,
} from "./modalGraph.js";
import { compileEventBinding, type EventActionInput } from "./events.js";
import { applyWidgetPatch } from "./editPatch.js";
import type { WidgetNode } from "./layout.js";

// Minimal DSL fixtures: geometry is irrelevant to the modal graph, so nodes carry only identity, type,
// children, and trigger props (declared via dynamicTriggerPathList, as the real DSL does).
let nextId = 0;

function node(
  name: string,
  type: string,
  children: WidgetNode[] = [],
  triggers: Record<string, string> = {},
): WidgetNode {
  return {
    widgetId: `w${nextId++}`,
    widgetName: name,
    type,
    children,
    ...triggers,
    dynamicTriggerPathList: Object.keys(triggers).map((key) => ({ key })),
  } as unknown as WidgetNode;
}

const canvas = (name: string, children: WidgetNode[]): WidgetNode =>
  node(name, "CANVAS_WIDGET", children);

const modal = (name: string, children: WidgetNode[]): WidgetNode =>
  node(name, "MODAL_WIDGET", [canvas(`${name}Canvas`, children)]);

const button = (name: string, onClick?: string): WidgetNode =>
  node(name, "BUTTON_WIDGET", [], onClick ? { onClick } : {});

const page = (children: WidgetNode[]): WidgetNode =>
  node("MainContainer", "CANVAS_WIDGET", children);

describe("M6 modal graph — structural extraction and DSL scan", () => {
  it("extracts opens/closes structurally from every action shape", () => {
    expect(structuralModalRefs({ showModal: "M1" })).toEqual({
      opens: ["M1"],
      closes: [],
    });
    expect(
      structuralModalRefs({
        run: "Save",
        onSuccess: [{ closeModal: "Edit" }, { showModal: "Done" }],
        onError: [{ showModal: "ErrorBox" }],
      }),
    ).toEqual({ opens: ["Done", "ErrorBox"], closes: ["Edit"] });
    expect(
      structuralModalRefs([{ closeModal: "Step1" }, { showModal: "Step2" }]),
    ).toEqual({ opens: ["Step2"], closes: ["Step1"] });
  });

  it("emitter↔parser coupling: the text scan extracts exactly the structural set for every emittable shape", () => {
    const shapes: EventActionInput[] = [
      { showModal: "M1" },
      { closeModal: "M1" },
      { run: "Q", onSuccess: [{ showModal: "A" }, { closeModal: "B" }] },
      { run: "Q", onError: [{ showModal: "C" }] },
      [{ closeModal: "Step1" }, { showModal: "Step2" }, { reset: "Zip" }],
      [
        { showAlert: "hi" },
        {
          run: "Q",
          onSuccess: [{ showModal: "Deep" }],
        },
      ],
    ];

    for (const shape of shapes) {
      const binding = compileEventBinding(shape);
      const scanned = collectModalGraph(
        page([node("Btn", "BUTTON_WIDGET", [], { onClick: binding })]),
      );
      const structural = structuralModalRefs(shape);
      const scannedOpens = [...new Set(scanned.edges.map((e) => e.target))];

      expect(scannedOpens.sort()).toEqual([...structural.opens].sort());
      expect(scanned.excludedBindings).toBe(0);
    }
  });

  it("coupling: closeModal extraction matches the structural set (closesHost round-trip)", () => {
    const shape: EventActionInput = {
      run: "Q",
      onSuccess: [{ closeModal: "Host" }, { showModal: "Next" }],
    };
    const dsl = page([
      modal("Host", [
        node("Btn", "BUTTON_WIDGET", [], {
          onClick: compileEventBinding(shape),
        }),
      ]),
    ]);

    expect(structuralModalRefs(shape).closes).toEqual(["Host"]);
    // The persisted-binding scan reads the same close back: the edge is a transition, exactly as the
    // structural walk classified it at wire time.
    expect(collectModalGraph(dsl).edges).toEqual([
      { host: "Host", target: "Next", closesHost: true, via: "Btn" },
    ]);
  });

  it("scans trigger props only, fail-open with a visible excluded count", () => {
    const dsl = page([
      node("Big", "BUTTON_WIDGET", [], {
        onClick: `{{ showModal('X') }}`.padEnd(
          MAX_SCANNED_BINDING_LENGTH + 10,
          " ",
        ),
      }),
      node("Weird", "BUTTON_WIDGET", [], {
        onClick: `{{ showModal(dynamicName) }}`,
      }),
      // A nested trigger path (table row button) is outside the scan and counted.
      {
        ...node("Table1", "TABLE_WIDGET_V2", []),
        dynamicTriggerPathList: [{ key: "primaryColumns.x.onClick" }],
      } as unknown as WidgetNode,
      // Non-trigger string props are never scanned even if they contain the text.
      node("Label", "TEXT_WIDGET", []),
    ]);
    const graph = collectModalGraph(dsl);

    expect(graph.edges).toEqual([]);
    expect(graph.excludedBindings).toBe(3);
  });

  it("attributes hosts to the nearest enclosing modal and honors the skip parameter", () => {
    const dsl = page([
      modal("Edit", [button("Save", "{{ showModal('Confirm') }}")]),
      button("Open", "{{ showModal('Edit') }}"),
    ]);
    const graph = collectModalGraph(dsl);

    expect(graph.edges).toEqual([
      { host: "Edit", target: "Confirm", closesHost: false, via: "Save" },
      { host: PAGE_HOST, target: "Edit", closesHost: false, via: "Open" },
    ]);
    expect(hostModalOf(dsl, "Save")).toBe("Edit");
    expect(hostModalOf(dsl, "Open")).toBe(PAGE_HOST);

    const skipped = collectModalGraph(dsl, {
      widget: "Save",
      event: "onClick",
    });

    expect(skipped.edges).toHaveLength(1);
  });

  it("marks close-then-open of the host as a transition", () => {
    const dsl = page([
      modal("Step1", [
        button("Next", "{{ closeModal('Step1'); showModal('Step2') }}"),
      ]),
    ]);

    expect(collectModalGraph(dsl).edges).toEqual([
      { host: "Step1", target: "Step2", closesHost: true, via: "Next" },
    ]);
  });
});

describe("M6 modal graph — wiring policy", () => {
  it("depth 1 (page opens a modal) passes silently", () => {
    const verdict = evaluateModalWiring({
      dsl: page([button("Open"), modal("Edit", [])]),
      widgetName: "Open",
      event: "onClick",
      action: { showModal: "Edit" },
    });

    expect(verdict.error).toBeUndefined();
    expect(verdict.warning).toBeUndefined();
  });

  it("depth 2 (modal over modal) warns but is allowed", () => {
    const dsl = page([
      button("Open", "{{ showModal('Edit') }}"),
      modal("Edit", [button("Delete")]),
      modal("Confirm", []),
    ]);
    const verdict = evaluateModalWiring({
      dsl,
      widgetName: "Delete",
      event: "onClick",
      action: { showModal: "Confirm" },
    });

    expect(verdict.error).toBeUndefined();
    expect(verdict.warning).toContain("depth 2");
  });

  it("depth 3 rejects, printing the chain", () => {
    const dsl = page([
      modal("Edit", [button("Delete", "{{ showModal('Confirm') }}")]),
      modal("Confirm", [button("Really")]),
      modal("ReallySure", []),
    ]);
    const verdict = evaluateModalWiring({
      dsl,
      widgetName: "Really",
      event: "onClick",
      action: { showModal: "ReallySure" },
    });

    expect(verdict.error).toContain("stacks 3 modals");
    expect(verdict.error).toContain("Confirm → ReallySure");
  });

  it("a wizard (close host + open next) is a transition at any length", () => {
    const dsl = page([
      modal("Step1", [
        button("Next1", "{{ closeModal('Step1'); showModal('Step2') }}"),
      ]),
      modal("Step2", [
        button("Next2", "{{ closeModal('Step2'); showModal('Step3') }}"),
      ]),
      modal("Step3", [button("Next3")]),
    ]);
    const verdict = evaluateModalWiring({
      dsl,
      widgetName: "Next3",
      event: "onClick",
      action: [{ closeModal: "Step3" }, { showModal: "Step1" }],
    });

    expect(verdict.error).toBeUndefined();
    expect(verdict.warning).toBeUndefined();
  });

  it("back-navigation (transition both ways) is valid; a stacking cycle rejects", () => {
    const dsl = page([
      modal("Edit", [button("ToConfirm", "{{ showModal('Confirm') }}")]),
      modal("Confirm", [button("Back")]),
    ]);

    // Back closes Confirm and reopens Edit — a transition, no cycle.
    expect(
      evaluateModalWiring({
        dsl,
        widgetName: "Back",
        event: "onClick",
        action: [{ closeModal: "Confirm" }, { showModal: "Edit" }],
      }).error,
    ).toBeUndefined();

    // Leaving Confirm open while reopening Edit is a stacking cycle — rejected.
    expect(
      evaluateModalWiring({
        dsl,
        widgetName: "Back",
        event: "onClick",
        action: { showModal: "Edit" },
      }).error,
    ).toContain("modal cycle");
  });

  it("truncates long widget names in messages", () => {
    const long = "M".repeat(64);
    const dsl = page([
      modal("Edit", [button("Btn", `{{ showModal('${long}') }}`)]),
      modal(long, [button("Deep")]),
      modal("Third", []),
    ]);
    const verdict = evaluateModalWiring({
      dsl,
      widgetName: "Deep",
      event: "onClick",
      action: { showModal: "Third" },
    });

    expect(verdict.error).toBeDefined();
    expect(verdict.error).toContain(`${"M".repeat(40)}…`);
    expect(verdict.error).not.toContain("M".repeat(41));
  });
});

describe("M6 modal graph — lint findings and structural rules", () => {
  it("reports existing stacks, stacking cycles, and the excluded-bindings count", () => {
    const dsl = page([
      modal("A", [button("ToB", "{{ showModal('B') }}")]),
      modal("B", [button("ToA", "{{ showModal('A') }}")]),
      node("Weird", "BUTTON_WIDGET", [], {
        onClick: "{{ showModal(pickModal()) }}",
      }),
    ]);
    const findings = modalStackFindings(dsl);
    const rules = findings.map((finding) => finding.rule);

    expect(rules).toContain("modal-cycle");
    expect(rules).toContain("modal-analysis-excluded");
  });

  it("reports a plain stack of depth 2 as a warning finding", () => {
    const dsl = page([
      button("Open", "{{ showModal('Edit') }}"),
      modal("Edit", [button("Del", "{{ showModal('Confirm') }}")]),
      modal("Confirm", []),
    ]);
    const findings = modalStackFindings(dsl);

    expect(
      findings.some(
        (finding) =>
          finding.rule === "modal-stack" && finding.widget === "Confirm",
      ),
    ).toBe(true);
  });

  it("containsModal and nestedModalViolations see any depth", () => {
    const nested = modal("Outer", [
      node("Card", "CONTAINER_WIDGET", [
        canvas("CardCanvas", [modal("Inner", [])]),
      ]),
    ]);

    expect(containsModal(nested)).toBe(true);
    expect(nestedModalViolations(page([nested]))).toEqual(["Outer>Inner"]);
  });

  it("patch move rejects reparenting a modal (or a subtree containing one) under a modal", () => {
    const dsl = page([
      modal("Outer", []),
      modal("Floating", []),
      node("Wrap", "CONTAINER_WIDGET", [
        canvas("WrapCanvas", [modal("Smuggled", [])]),
      ]),
    ]);

    expect(() =>
      applyWidgetPatch(dsl, {
        operations: [{ kind: "move", name: "Floating", parent: "Outer" }],
      }),
    ).toThrow(/cannot live inside another modal/);
    expect(() =>
      applyWidgetPatch(dsl, {
        operations: [{ kind: "move", name: "Wrap", parent: "Outer" }],
      }),
    ).toThrow(/it contains a modal/);
  });

  it("assertNoNewNestedModals is delta-aware", () => {
    const before = page([modal("Outer", [modal("Legacy", [])])]);
    const stillNested = page([
      modal("Outer", [modal("Legacy", [])]),
      button("New"),
    ]);

    // Pre-existing human nesting does not brick edits.
    expect(() => assertNoNewNestedModals(before, stillNested)).not.toThrow();
    // A NEW nesting is rejected, on builds and edits alike.
    expect(() =>
      assertNoNewNestedModals(before, page([modal("A", [modal("B", [])])])),
    ).toThrow(/cannot be placed inside another modal/);
    expect(() =>
      assertNoNewNestedModals(undefined, page([modal("A", [modal("B", [])])])),
    ).toThrow(/page-level overlays/);
  });
});
