import { applyEdit, compileApp } from "./compile.js";
import { sequentialIdGenerator, type WidgetNode } from "./layout.js";
import { appSpecSchema, editSpecSchema, type WidgetSpec } from "./schema.js";
import { PRESETS } from "./presets.js";

function ids() {
  return sequentialIdGenerator();
}

function rootOf(artifact: Record<string, unknown>, pageIndex = 0): WidgetNode {
  const pageList = artifact.pageList as {
    unpublishedPage: { layouts: { dsl: WidgetNode }[] };
  }[];

  return pageList[pageIndex].unpublishedPage.layouts[0].dsl;
}

describe("compileApp — import artifact contract", () => {
  it("emits the required top-level fields the import API validates", () => {
    const artifact = compileApp(
      {
        name: "My App",
        pages: [{ name: "Home", widgets: [{ type: "text", text: "Hi" }] }],
      },
      ids(),
    );

    expect(artifact.clientSchemaVersion).toBe(2);
    expect(artifact.serverSchemaVersion).toBe(12);
    expect(artifact.artifactJsonType).toBe("APPLICATION");
    expect(artifact.actionList).toEqual([]);
    expect(artifact.datasourceList).toEqual([]);
    expect((artifact.exportedApplication as { name: string }).name).toBe(
      "My App",
    );
    expect(Array.isArray(artifact.pageList)).toBe(true);
    expect((artifact.pageList as unknown[]).length).toBe(1);
  });

  it("builds a root canvas with widgetId '0' and a 64-column grid", () => {
    const artifact = compileApp(
      {
        name: "App",
        pages: [{ name: "Home", widgets: [{ type: "text", text: "Hi" }] }],
      },
      ids(),
    );
    const root = rootOf(artifact);

    expect(root.widgetId).toBe("0");
    expect(root.type).toBe("CANVAS_WIDGET");
    expect(root.snapColumns).toBe(64);
    expect(root.children).toHaveLength(1);
  });

  it("maps spec widget types to the correct Appsmith widget types and versions", () => {
    const artifact = compileApp(
      {
        name: "App",
        pages: [
          {
            name: "Home",
            widgets: [
              { type: "table", data: "{{q.data}}" },
              { type: "input", label: "Email", inputType: "EMAIL" },
              { type: "button", text: "Go" },
            ],
          },
        ],
      },
      ids(),
    );
    const [table, input, button] = rootOf(artifact).children as WidgetNode[];

    expect(table.type).toBe("TABLE_WIDGET_V2");
    expect(table.version).toBe(2);
    expect(table.tableData).toBe("{{q.data}}");
    expect(input.type).toBe("INPUT_WIDGET_V2");
    expect(input.inputType).toBe("EMAIL");
    expect(button.type).toBe("BUTTON_WIDGET");
  });

  it("stamps every widget with the mandatory DSL fields", () => {
    const artifact = compileApp(
      {
        name: "App",
        pages: [{ name: "Home", widgets: [{ type: "input", label: "X" }] }],
      },
      ids(),
    );
    const widget = (rootOf(artifact).children as WidgetNode[])[0];

    for (const field of [
      "widgetId",
      "widgetName",
      "type",
      "version",
      "parentId",
      "renderMode",
      "topRow",
      "bottomRow",
      "leftColumn",
      "rightColumn",
    ]) {
      expect(widget[field]).toBeDefined();
    }

    expect(widget.parentId).toBe("0");
    expect(widget.isVisible).toBe(true);
    // rows/columns must not leak into the persisted DSL.
    expect(widget.rows).toBeUndefined();
    expect(widget.columns).toBeUndefined();
  });

  it("auto-stacks widgets vertically without overlap", () => {
    const artifact = compileApp(
      {
        name: "App",
        pages: [
          {
            name: "Home",
            widgets: [
              { type: "text", text: "A" },
              { type: "input", label: "B" },
              { type: "button", text: "C" },
            ],
          },
        ],
      },
      ids(),
    );
    const children = rootOf(artifact).children as WidgetNode[];

    for (let i = 1; i < children.length; i += 1) {
      expect(children[i].topRow).toBeGreaterThanOrEqual(
        children[i - 1].bottomRow,
      );
    }
  });

  it("gives colliding widgets unique names", () => {
    const artifact = compileApp(
      {
        name: "App",
        pages: [
          {
            name: "Home",
            widgets: [
              { type: "table", data: "" },
              { type: "table", data: "" },
            ],
          },
        ],
      },
      ids(),
    );
    const [a, b] = rootOf(artifact).children as WidgetNode[];

    expect(a.widgetName).not.toBe(b.widgetName);
  });

  it("nests container children inside an inner canvas", () => {
    const artifact = compileApp(
      {
        name: "App",
        pages: [
          {
            name: "Home",
            widgets: [
              {
                type: "container",
                name: "Card",
                children: [{ type: "text", text: "In card" }],
              },
            ],
          },
        ],
      },
      ids(),
    );
    const container = (rootOf(artifact).children as WidgetNode[])[0];

    expect(container.type).toBe("CONTAINER_WIDGET");
    const inner = (container.children as WidgetNode[])[0];

    expect(inner.type).toBe("CANVAS_WIDGET");
    expect(inner.parentId).toBe(container.widgetId);
    expect((inner.children as WidgetNode[])[0].type).toBe("TEXT_WIDGET");
  });

  it("compiles a select with default options", () => {
    const artifact = compileApp(
      {
        name: "App",
        pages: [{ name: "Home", widgets: [{ type: "select", label: "Pick" }] }],
      },
      ids(),
    );
    const widget = (rootOf(artifact).children as WidgetNode[])[0];

    expect(widget.type).toBe("SELECT_WIDGET");
    expect(Array.isArray(widget.options)).toBe(true);
  });

  it("rejects container nesting beyond the maximum depth", () => {
    let nested: WidgetSpec = { type: "text", text: "leaf" };

    for (let i = 0; i < 7; i += 1) {
      nested = { type: "container", children: [nested] };
    }

    expect(() =>
      compileApp(
        { name: "App", pages: [{ name: "Home", widgets: [nested] }] },
        ids(),
      ),
    ).toThrow(/nesting/);
  });

  it("compiles every preset without error", () => {
    for (const preset of Object.values(PRESETS)) {
      const artifact = compileApp({ name: "P", pages: [preset.spec] }, ids());

      expect(
        (rootOf(artifact).children as WidgetNode[]).length,
      ).toBeGreaterThan(0);
    }
  });
});

describe("applyEdit — append to an existing page", () => {
  function baseDsl(): WidgetNode {
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
            ],
          },
        ],
      },
      ids(),
    );

    return rootOf(artifact);
  }

  it("appends below existing content when no placement is given", () => {
    const dsl = baseDsl();
    const before = (dsl.children as WidgetNode[]).length;
    const maxBottom = Math.max(
      ...(dsl.children as WidgetNode[]).map((c) => c.bottomRow),
    );
    const { dsl: edited, notes } = applyEdit(
      dsl,
      { add: [{ type: "button", text: "Save" }] },
      ids(),
    );
    const children = edited.children as WidgetNode[];

    expect(children).toHaveLength(before + 1);
    expect(children[children.length - 1].topRow).toBeGreaterThanOrEqual(
      maxBottom,
    );
    expect(notes).toHaveLength(0);
  });

  it("places a widget after a named widget", () => {
    const dsl = baseDsl();
    const email = (dsl.children as WidgetNode[]).find(
      (c) => c.widgetName === "Email",
    )!;
    const { dsl: edited } = applyEdit(
      dsl,
      {
        add: [{ type: "input", label: "Phone", placement: { after: "Email" } }],
      },
      ids(),
    );
    const added = (edited.children as WidgetNode[]).find(
      (c) => c.widgetName === "Input",
    )!;

    expect(added.topRow).toBeGreaterThanOrEqual(email.bottomRow);
  });

  it("places a widget inside a named container's inner canvas", () => {
    const dsl = baseDsl();
    const { dsl: edited } = applyEdit(
      dsl,
      {
        add: [
          { type: "input", label: "Note", placement: { inside: "Details" } },
        ],
      },
      ids(),
    );
    const container = (edited.children as WidgetNode[]).find(
      (c) => c.widgetName === "Details",
    )!;
    const inner = (container.children as WidgetNode[])[0];
    const names = (inner.children as WidgetNode[]).map((c) => c.type);

    expect(names).toContain("INPUT_WIDGET_V2");
  });

  it("falls back with a note when placement.inside targets a non-container", () => {
    const dsl = baseDsl();
    const { notes } = applyEdit(
      dsl,
      { add: [{ type: "text", text: "x", placement: { inside: "Email" } }] },
      ids(),
    );

    expect(notes.join(" ")).toContain("Email");
  });

  it("falls back to append and reports a note when a target is missing", () => {
    const dsl = baseDsl();
    const { notes } = applyEdit(
      dsl,
      { add: [{ type: "text", text: "x", placement: { after: "Nope" } }] },
      ids(),
    );

    expect(notes.join(" ")).toContain("Nope");
  });

  it("never mutates the caller's DSL and preserves existing widgets", () => {
    const dsl = baseDsl();
    const snapshot = JSON.stringify(dsl);
    const { dsl: edited } = applyEdit(
      dsl,
      { add: [{ type: "button", text: "New" }] },
      ids(),
    );

    expect(JSON.stringify(dsl)).toBe(snapshot); // input untouched
    const names = (edited.children as WidgetNode[]).map((c) => c.widgetName);

    expect(names).toContain("Email");
    expect(names).toContain("Details");
  });
});

describe("spec validation", () => {
  it("rejects an unknown widget type", () => {
    const result = appSpecSchema.safeParse({
      name: "A",
      pages: [{ name: "P", widgets: [{ type: "carousel" }] }],
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty page", () => {
    const result = appSpecSchema.safeParse({
      name: "A",
      pages: [{ name: "P", widgets: [] }],
    });

    expect(result.success).toBe(false);
  });

  it("accepts a valid edit spec with placement", () => {
    const result = editSpecSchema.safeParse({
      add: [{ type: "input", label: "X", placement: { after: "Y" } }],
    });

    expect(result.success).toBe(true);
  });
});
