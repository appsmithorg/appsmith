import { compileApp } from "./compile.js";
import { applyWidgetPatch, widgetPatchSchema } from "./editPatch.js";
import { sequentialIdGenerator, type WidgetNode } from "./layout.js";
import { lintArtifact, lintDsl } from "./lint.js";

// A minimal root page canvas with the given children.
function canvas(children: WidgetNode[]): WidgetNode {
  return {
    widgetId: "0",
    widgetName: "MainContainer",
    type: "CANVAS_WIDGET",
    topRow: 0,
    bottomRow: 380,
    leftColumn: 0,
    rightColumn: 640,
    children,
  };
}

function widget(
  overrides: Partial<WidgetNode> & { widgetId: string },
): WidgetNode {
  return {
    widgetName: overrides.widgetId,
    type: "INPUT_WIDGET_V2",
    topRow: 0,
    bottomRow: 7,
    leftColumn: 0,
    rightColumn: 24,
    ...overrides,
  };
}

function rules(dsl: WidgetNode): string[] {
  return lintDsl(dsl).issues.map((issue) => issue.rule);
}

describe("lintDsl — tree integrity", () => {
  it("flags a duplicate widget id", () => {
    const dsl = canvas([
      widget({ widgetId: "a", widgetName: "A", topRow: 0, bottomRow: 7 }),
      widget({ widgetId: "a", widgetName: "B", topRow: 8, bottomRow: 15 }),
    ]);

    expect(rules(dsl)).toContain("duplicate-id");
  });

  it("flags a missing root", () => {
    const diagnostics = lintDsl(undefined as unknown as WidgetNode);

    expect(diagnostics.errors).toBeGreaterThan(0);
    expect(diagnostics.issues[0].rule).toBe("tree");
  });
});

describe("lintDsl — geometry", () => {
  it("flags a widget that extends past the grid", () => {
    const dsl = canvas([widget({ widgetId: "a", rightColumn: 68 })]);

    expect(rules(dsl)).toContain("off-grid");
  });

  it("flags two overlapping siblings", () => {
    const dsl = canvas([
      widget({
        widgetId: "a",
        topRow: 0,
        bottomRow: 10,
        leftColumn: 0,
        rightColumn: 30,
      }),
      widget({
        widgetId: "b",
        topRow: 5,
        bottomRow: 15,
        leftColumn: 10,
        rightColumn: 40,
      }),
    ]);

    expect(rules(dsl)).toContain("overlap");
  });

  it("flags a non-positive height", () => {
    const dsl = canvas([widget({ widgetId: "a", topRow: 10, bottomRow: 10 })]);

    expect(rules(dsl)).toContain("zero-height");
  });

  it("flags a container shorter than its inner content", () => {
    const inner: WidgetNode = {
      widgetId: "canvas1",
      widgetName: "Canvas1",
      type: "CANVAS_WIDGET",
      topRow: 0,
      bottomRow: 40, // inner extent 40 rows
      leftColumn: 0,
      rightColumn: 40,
      children: [],
    };
    const container: WidgetNode = {
      widgetId: "c1",
      widgetName: "Container1",
      type: "CONTAINER_WIDGET",
      topRow: 0,
      bottomRow: 20, // only 20 rows tall — clips the 40-row inner canvas
      leftColumn: 0,
      rightColumn: 40,
      children: [inner],
    };

    expect(rules(canvas([container]))).toContain("container-clips");
  });
});

// M6 — detached widgets (modals) are overlays, not in-flow: the overlap lint skips their nominal rects (a
// deliberate change layered on the behavior-identical predicate extraction into occupancy.ts).
describe("lintDsl — detached widgets are excluded from overlap", () => {
  it("does not report a modal's nominal rect overlapping an in-flow sibling", () => {
    const dsl = canvas([
      widget({
        widgetId: "t",
        widgetName: "Results",
        topRow: 0,
        bottomRow: 28,
      }),
      widget({
        widgetId: "m",
        widgetName: "AddModal",
        type: "MODAL_WIDGET",
        topRow: 0,
        bottomRow: 24,
        rightColumn: 32,
        detachFromLayout: true,
      }),
    ]);

    expect(rules(dsl)).not.toContain("overlap");
  });

  it("still reports overlap between the in-flow siblings themselves", () => {
    const dsl = canvas([
      widget({ widgetId: "a", topRow: 0, bottomRow: 10 }),
      widget({ widgetId: "b", topRow: 5, bottomRow: 15 }),
      widget({
        widgetId: "m",
        widgetName: "AddModal",
        type: "MODAL_WIDGET",
        topRow: 0,
        bottomRow: 24,
        detachFromLayout: true,
      }),
    ]);

    expect(rules(dsl)).toContain("overlap");
  });
});

// M6 — actionable repair payloads (design section F): overlap and clipped diagnostics carry a literal,
// schema-valid patch_widgets payload the agent can apply verbatim.
describe("lintDsl — suggestedFix payloads", () => {
  it("attaches a schema-valid, round-trippable fix to overlap warnings (multi-overlap, sequential)", () => {
    const dsl = canvas([
      widget({ widgetId: "a", widgetName: "A", topRow: 0, bottomRow: 10 }),
      widget({ widgetId: "b", widgetName: "B", topRow: 4, bottomRow: 14 }),
      widget({ widgetId: "c", widgetName: "C", topRow: 8, bottomRow: 18 }),
    ]);
    const overlaps = lintDsl(dsl).issues.filter(
      (issue) => issue.rule === "overlap",
    );

    expect(overlaps.length).toBeGreaterThan(1);

    for (const issue of overlaps) {
      // Every emitted suggestion validates against the real patch schema (not just "clears the diagnostic").
      expect(
        widgetPatchSchema.safeParse({
          operations: issue.suggestedFix!.operations,
        }).success,
      ).toBe(true);
      expect(issue.suggestedFix!.tool).toBe("patch_widgets");
    }

    // Applying ONE issue's payload clears EVERY overlap on the canvas (fixes are computed sequentially against
    // simulated occupancy, so the whole payload is conflict-free).
    const { dsl: repaired } = applyWidgetPatch(dsl, {
      operations: overlaps[0].suggestedFix!.operations,
    });

    expect(
      lintDsl(repaired).issues.filter((issue) => issue.rule === "overlap"),
    ).toEqual([]);
  });

  it("attaches an executable resize fix to container-clips and applying it clears the warning", () => {
    const inner: WidgetNode = {
      widgetId: "canvas1",
      widgetName: "Canvas1",
      type: "CANVAS_WIDGET",
      topRow: 0,
      bottomRow: 40,
      leftColumn: 0,
      rightColumn: 40,
      children: [],
    };
    const container: WidgetNode = {
      widgetId: "c1",
      widgetName: "Container1",
      type: "CONTAINER_WIDGET",
      topRow: 0,
      bottomRow: 20,
      leftColumn: 0,
      rightColumn: 40,
      children: [inner],
    };
    const dsl = canvas([container]);
    const issue = lintDsl(dsl).issues.find(
      (candidate) => candidate.rule === "container-clips",
    )!;

    expect(issue.suggestedFix).toEqual({
      tool: "patch_widgets",
      operations: [{ kind: "resize", name: "Container1", rows: 40 }],
    });
    expect(
      widgetPatchSchema.safeParse({
        operations: issue.suggestedFix!.operations,
      }).success,
    ).toBe(true);

    const { dsl: repaired } = applyWidgetPatch(dsl, {
      operations: issue.suggestedFix!.operations,
    });

    expect(rules(repaired)).not.toContain("container-clips");
  });

  it("warns (never errors) on a modal body taller than its pixel height, with a resize fix", () => {
    const inner: WidgetNode = {
      widgetId: "mc",
      widgetName: "ModalCanvas",
      type: "CANVAS_WIDGET",
      topRow: 0,
      bottomRow: 24,
      leftColumn: 0,
      rightColumn: 32,
      children: [
        widget({
          widgetId: "f",
          widgetName: "Field",
          topRow: 0,
          bottomRow: 40,
        }),
      ],
    };
    const modal: WidgetNode = {
      widgetId: "m1",
      widgetName: "AddModal",
      type: "MODAL_WIDGET",
      topRow: 0,
      bottomRow: 24,
      leftColumn: 0,
      rightColumn: 32,
      height: 252,
      detachFromLayout: true,
      children: [inner],
    };
    const dsl = canvas([modal]);
    const diagnostics = lintDsl(dsl);
    const issue = diagnostics.issues.find(
      (candidate) => candidate.rule === "modal-clips",
    )!;

    expect(issue.sev).toBe("warn");
    expect(diagnostics.errors).toBe(0);
    expect(issue.suggestedFix).toEqual({
      tool: "patch_widgets",
      operations: [{ kind: "resize", name: "AddModal", rows: 40 }],
    });

    // The fix round-trips: resizing the modal to 40 rows (400px) clears the warning.
    const { dsl: repaired } = applyWidgetPatch(dsl, {
      operations: issue.suggestedFix!.operations,
    });

    expect(rules(repaired)).not.toContain("modal-clips");
  });
});

describe("lintDsl — naming", () => {
  it("flags duplicate widget names", () => {
    const dsl = canvas([
      widget({ widgetId: "a", widgetName: "Dup", topRow: 0, bottomRow: 7 }),
      widget({ widgetId: "b", widgetName: "Dup", topRow: 8, bottomRow: 15 }),
    ]);

    expect(rules(dsl)).toContain("duplicate-name");
  });

  it("flags a name with characters Appsmith may reject", () => {
    const dsl = canvas([widget({ widgetId: "a", widgetName: "bad-name!" })]);

    expect(rules(dsl)).toContain("invalid-name");
  });
});

describe("lintDsl — counting contract", () => {
  it("reports errors and warnings equal to the matching issue counts", () => {
    const dsl = canvas([
      widget({ widgetId: "a", widgetName: "Dup", topRow: 10, bottomRow: 10 }), // dup-name + zero-height (errors)
      widget({ widgetId: "b", widgetName: "Dup", rightColumn: 68 }), // dup-name (error) + off-grid (warn)
    ]);
    const diagnostics = lintDsl(dsl);
    const errors = diagnostics.issues.filter((i) => i.sev === "error").length;
    const warnings = diagnostics.issues.filter((i) => i.sev === "warn").length;

    expect(diagnostics.errors).toBe(errors);
    expect(diagnostics.warnings).toBe(warnings);
    expect(diagnostics.errors + diagnostics.warnings).toBe(
      diagnostics.issues.length,
    );
  });
});

describe("lintDsl — dangling-binding check is dormant until M4", () => {
  const dslWithBinding = canvas([
    widget({ widgetId: "a", widgetName: "A", label: "{{ getUsers.data }}" }),
  ]);

  it("stays silent with no known data names (M1)", () => {
    expect(lintDsl(dslWithBinding).issues).toHaveLength(0);
  });

  it("fires when known data names are supplied and the reference is unknown (M4 activation)", () => {
    const diagnostics = lintDsl(dslWithBinding, { knownDataNames: ["other"] });

    expect(diagnostics.issues.map((i) => i.rule)).toContain("dangling-binding");
  });

  it("stays clean when the reference is a declared data name", () => {
    const diagnostics = lintDsl(dslWithBinding, {
      knownDataNames: ["getUsers"],
    });

    expect(diagnostics.errors).toBe(0);
  });

  it("treats widget names as valid binding heads (selected-row display bindings)", () => {
    // The text widget references the table by widget name — and the table sits AFTER it in the tree, so this also
    // proves bindings are resolved against the complete name set, not traversal order.
    const dsl = canvas([
      widget({
        widgetId: "t",
        widgetName: "EmailDetail",
        text: '{{ Users.selectedRow["email"] }}',
      }),
      widget({ widgetId: "u", widgetName: "Users" }),
    ]);
    const diagnostics = lintDsl(dsl, { knownDataNames: ["getUsers"] });

    expect(diagnostics.errors).toBe(0);
  });

  it("still flags a selected-row binding whose table does not exist", () => {
    const dsl = canvas([
      widget({
        widgetId: "t",
        widgetName: "EmailDetail",
        text: '{{ Missing.selectedRow["email"] }}',
      }),
    ]);
    const diagnostics = lintDsl(dsl, { knownDataNames: ["getUsers"] });

    expect(diagnostics.issues.map((i) => i.rule)).toContain("dangling-binding");
  });

  it("treats platform action functions as valid binding heads (compiler-emitted event bindings)", () => {
    // A Clear button whose onClick resets an input and a table — the head is resetWidget, not an entity name.
    const dsl = canvas([
      widget({
        widgetId: "b",
        widgetName: "ClearButton",
        onClick:
          "{{ resetWidget('ZipInput', true); resetWidget('Results', true) }}",
      }),
    ]);
    const diagnostics = lintDsl(dsl, { knownDataNames: ["getPlaces"] });

    expect(diagnostics.errors).toBe(0);
  });
});

describe("lintDsl — M5 store accumulation (store-never-written)", () => {
  function storeTable(key: string): WidgetNode {
    return widget({
      widgetId: "t",
      widgetName: "ZipResults",
      type: "TABLE_WIDGET_V2",
      tableData: `{{ appsmith.store.${key} ?? [] }}`,
    });
  }

  it("warns (not errors) when a store-bound table's key has no writer on the page", () => {
    const diagnostics = lintDsl(canvas([storeTable("zipResults")]));
    const issue = diagnostics.issues.find(
      (candidate) => candidate.rule === "store-never-written",
    );

    expect(issue?.sev).toBe("warn");
    expect(issue?.msg).toBe(
      "store key 'zipResults' is never written on this page",
    );
    expect(issue?.widget).toBe("ZipResults");
    expect(diagnostics.errors).toBe(0);
  });

  it("stays silent when an appendToStore/clearStoreKey writer targets the key", () => {
    const writer = widget({
      widgetId: "b",
      widgetName: "LookupButton",
      type: "BUTTON_WIDGET",
      topRow: 30,
      bottomRow: 34,
      onClick:
        "{{ LookupZip.run().then(() => { storeValue('zipResults', [].concat(appsmith.store.zipResults ?? [], LookupZip.data ?? []), false); }) }}",
    });

    expect(rules(canvas([storeTable("zipResults"), writer]))).not.toContain(
      "store-never-written",
    );
  });

  it("still warns when the only writer targets a DIFFERENT key", () => {
    const writer = widget({
      widgetId: "b",
      widgetName: "ClearButton",
      type: "BUTTON_WIDGET",
      topRow: 30,
      bottomRow: 34,
      onClick: "{{ storeValue('otherKey', [], false) }}",
    });

    expect(rules(canvas([storeTable("zipResults"), writer]))).toContain(
      "store-never-written",
    );
  });

  it("does not warn about a query-bound or static table", () => {
    const queryTable = widget({
      widgetId: "t",
      widgetName: "Rows",
      type: "TABLE_WIDGET_V2",
      tableData: "{{ getRows.data ?? [] }}",
    });

    expect(rules(canvas([queryTable]))).not.toContain("store-never-written");
  });
});

describe("lintDsl — close the loop (write-no-refresh, selection-unused)", () => {
  const OPTIONS = {
    knownDataNames: ["getTasks", "insertTask"],
    writeDataNames: ["insertTask"],
  };

  function queryTable(overrides: Partial<WidgetNode> = {}): WidgetNode {
    return widget({
      widgetId: "t1",
      widgetName: "TasksTable",
      type: "TABLE_WIDGET_V2",
      tableData: "{{ getTasks.data ?? [] }}",
      bottomRow: 28,
      ...overrides,
    });
  }

  it("flags a write run with no follow-up read", () => {
    const dsl = canvas([
      widget({
        widgetId: "b1",
        widgetName: "AddButton",
        type: "BUTTON_WIDGET",
        onClick: "{{ insertTask.run() }}",
      }),
    ]);
    const issues = lintDsl(dsl, OPTIONS).issues;

    expect(issues.map((issue) => issue.rule)).toContain("write-no-refresh");
    expect(
      issues.find((issue) => issue.rule === "write-no-refresh")?.widget,
    ).toBe("AddButton");
  });

  it("stays quiet when the write chains a read re-run", () => {
    const dsl = canvas([
      widget({
        widgetId: "b1",
        widgetName: "AddButton",
        type: "BUTTON_WIDGET",
        onClick:
          "{{ insertTask.run().then(() => { getTasks.run(); showAlert('Added', 'success'); }) }}",
      }),
    ]);

    expect(
      lintDsl(dsl, OPTIONS).issues.map((issue) => issue.rule),
    ).not.toContain("write-no-refresh");
  });

  it("stays quiet without a write classification (build-time lint)", () => {
    const dsl = canvas([
      widget({
        widgetId: "b1",
        widgetName: "AddButton",
        type: "BUTTON_WIDGET",
        onClick: "{{ insertTask.run() }}",
      }),
    ]);

    expect(lintDsl(dsl).issues.map((issue) => issue.rule)).not.toContain(
      "write-no-refresh",
    );
  });

  it("flags a query-bound table whose selection nothing consumes", () => {
    const dsl = canvas([queryTable()]);
    const issues = lintDsl(dsl, OPTIONS).issues;

    expect(issues.map((issue) => issue.rule)).toContain("selection-unused");
    expect(
      issues.find((issue) => issue.rule === "selection-unused")?.widget,
    ).toBe("TasksTable");
  });

  it("counts a selectedRow binding on another widget as consumption", () => {
    const dsl = canvas([
      queryTable(),
      widget({
        widgetId: "d1",
        widgetName: "Detail",
        type: "TEXT_WIDGET",
        topRow: 29,
        bottomRow: 33,
        text: '{{ TasksTable.selectedRow["name"] }}',
      }),
    ]);

    expect(
      lintDsl(dsl, OPTIONS).issues.map((issue) => issue.rule),
    ).not.toContain("selection-unused");
  });

  it("counts onRowSelected wiring as consumption", () => {
    const dsl = canvas([
      queryTable({ onRowSelected: "{{ showModal('EditModal') }}" }),
    ]);

    expect(
      lintDsl(dsl, OPTIONS).issues.map((issue) => issue.rule),
    ).not.toContain("selection-unused");
  });

  it("skips static, store-bound, and build-time (no data names) tables", () => {
    const staticTable = canvas([queryTable({ tableData: '[{"id":1}]' })]);
    const storeTable = canvas([
      queryTable({ tableData: "{{ appsmith.store.zipResults ?? [] }}" }),
    ]);
    const buildTime = canvas([queryTable()]);

    expect(
      lintDsl(staticTable, OPTIONS).issues.map((issue) => issue.rule),
    ).not.toContain("selection-unused");
    expect(
      lintDsl(storeTable, OPTIONS).issues.map((issue) => issue.rule),
    ).not.toContain("selection-unused");
    expect(lintDsl(buildTime).issues.map((issue) => issue.rule)).not.toContain(
      "selection-unused",
    );
  });
});

describe("lintArtifact — compiler output is lint-clean", () => {
  it("produces zero errors and warnings for a compiled app", () => {
    const artifact = compileApp(
      {
        name: "App",
        pages: [
          {
            name: "Home",
            widgets: [
              { type: "input", name: "Email", label: "Email" },
              {
                type: "container",
                name: "Details",
                children: [{ type: "text", name: "Heading", text: "Details" }],
              },
              { type: "table", name: "Records", data: [{ id: 1 }] },
            ],
          },
        ],
      },
      sequentialIdGenerator(),
    );
    const diagnostics = lintArtifact(artifact);

    expect(diagnostics.errors).toBe(0);
    expect(diagnostics.warnings).toBe(0);
    expect(Object.keys(diagnostics.pages)).toContain("Home");
  });
});
