import { compileApp } from "./compile.js";
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
