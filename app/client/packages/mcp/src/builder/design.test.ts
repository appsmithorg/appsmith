import {
  applyRoleStyling,
  inferRoles,
  planLayout,
  type WidgetRole,
} from "./design.js";
import { applyEdit, compileApp } from "./compile.js";
import { sequentialIdGenerator, type WidgetNode } from "./layout.js";
import { overlappingPairs } from "./occupancy.js";
import type { WidgetSpec } from "./schema.js";

const ids = () => sequentialIdGenerator();

function page(widgets: WidgetSpec[]) {
  return { name: "App", pages: [{ name: "Home", widgets }] };
}

function rootChildren(artifact: Record<string, unknown>) {
  // pageList[0].unpublishedPage.layouts[0].dsl.children
  const pageList = artifact.pageList as Array<{
    unpublishedPage: { layouts: Array<{ dsl: { children: unknown[] } }> };
  }>;

  return pageList[0].unpublishedPage.layouts[0].dsl.children as Array<
    Record<string, unknown>
  >;
}

describe("design pass — role inference", () => {
  it("marks the first static text of a page as the page title, root only", () => {
    const specs: WidgetSpec[] = [
      { type: "text", text: "Dashboard" },
      { type: "text", text: "Just prose" },
    ];

    expect(inferRoles(specs, { pageRoot: true })).toEqual([
      "pageTitle",
      "body",
    ]);
    expect(inferRoles(specs, { pageRoot: false })).toEqual(["body", "body"]);
  });

  it("marks a static text directly before a section-type widget as its header", () => {
    const specs: WidgetSpec[] = [
      { type: "text", text: "Orders" },
      { type: "table", data: [{ id: 1 }] },
    ];

    expect(inferRoles(specs, { pageRoot: false })).toEqual([
      "sectionHeader",
      "body",
    ]);
  });

  it("treats count/formula texts as KPIs but now/concat as body", () => {
    const specs: WidgetSpec[] = [
      { type: "text", value: { count: { query: "getOrders" } } },
      { type: "text", value: { now: { format: "dayOfWeek" } } },
    ];

    expect(inferRoles(specs, { pageRoot: false })).toEqual(["kpi", "body"]);
  });

  it("bound texts never become titles or headers", () => {
    const specs: WidgetSpec[] = [
      { type: "text", source: { query: "getUser", field: "name" } },
      { type: "table", data: [{ id: 1 }] },
    ];

    expect(inferRoles(specs, { pageRoot: true })).toEqual(["body", "body"]);
  });
});

describe("design pass — row planner", () => {
  it("pairs two consecutive fields side by side with a gutter", () => {
    const specs: WidgetSpec[] = [
      { type: "input", label: "First" },
      { type: "input", label: "Last" },
    ];
    const rows = planLayout(specs, inferRoles(specs, { pageRoot: false }), 64);

    expect(rows).toHaveLength(1);
    expect(rows[0].slots).toEqual([
      expect.objectContaining({ index: 0, leftColumn: 0, columns: 31 }),
      expect.objectContaining({ index: 1, leftColumn: 33, columns: 31 }),
    ]);
  });

  it("does not pair fields on a canvas too narrow to split", () => {
    const specs: WidgetSpec[] = [
      { type: "input", label: "First" },
      { type: "input", label: "Last" },
    ];
    const rows = planLayout(specs, inferRoles(specs, { pageRoot: false }), 30);

    expect(rows).toHaveLength(2);
  });

  it("splits three KPIs evenly across the row", () => {
    const specs: WidgetSpec[] = [
      { type: "text", value: { count: { query: "a" } } },
      { type: "text", value: { count: { query: "b" } } },
      { type: "text", value: { count: { query: "c" } } },
    ];
    const rows = planLayout(specs, inferRoles(specs, { pageRoot: false }), 64);

    expect(rows).toHaveLength(1);
    expect(rows[0].slots.map((slot) => slot.leftColumn)).toEqual([0, 22, 44]);
    expect(rows[0].slots.every((slot) => slot.columns === 20)).toBe(true);
  });

  it("right-aligns buttons that follow fields, packs left otherwise", () => {
    const afterFields: WidgetSpec[] = [
      { type: "input", label: "Name" },
      { type: "button", text: "Save" },
    ];
    const standalone: WidgetSpec[] = [{ type: "button", text: "Go" }];

    const formRows = planLayout(
      afterFields,
      inferRoles(afterFields, { pageRoot: false }),
      64,
    );

    // Right-aligned to 64 - 16 (button) - 2 (edge margin) = 46, so it isn't flush against the canvas edge.
    expect(formRows[1].slots[0].leftColumn).toBe(46);

    const soloRows = planLayout(
      standalone,
      inferRoles(standalone, { pageRoot: false }),
      64,
    );

    expect(soloRows[0].slots[0].leftColumn).toBe(0);
  });

  it("applies the spacing rhythm: gap after title, section gap before headers and bare sections", () => {
    const specs: WidgetSpec[] = [
      { type: "text", text: "Dashboard" },
      { type: "text", text: "Orders" },
      { type: "table", data: [{ id: 1 }] },
      {
        type: "chart",
        chartType: "LINE_CHART",
        source: { query: "q", x: "day", y: "total" },
      },
    ];
    const rows = planLayout(specs, inferRoles(specs, { pageRoot: true }), 64);

    // title, header, table, chart
    expect(rows.map((row) => row.gapBefore)).toEqual([0, 2, 1, 3]);
  });
});

describe("design pass — compiled output", () => {
  it("styles the page title and leaves body text normal weight", () => {
    const artifact = compileApp(
      page([
        { type: "text", text: "Dashboard" },
        { type: "text", text: "Welcome back" },
      ]),
      ids(),
    );
    const [title, body] = rootChildren(artifact);

    expect(title.fontSize).toBe("1.875rem");
    expect(title.fontStyle).toBe("BOLD");
    expect(body.fontSize).toBe("1rem");
    expect(body.fontStyle).toBe("NORMAL");
  });

  it("places paired fields on the same row without overlap", () => {
    const artifact = compileApp(
      page([
        { type: "input", label: "First" },
        { type: "input", label: "Last" },
      ]),
      ids(),
    );
    const [first, last] = rootChildren(artifact);

    expect(first.topRow).toBe(last.topRow);
    expect(first.rightColumn as number).toBeLessThanOrEqual(
      last.leftColumn as number,
    );
  });

  it("only ever writes typography keys — the compiler-owned prop surface stays fixed", () => {
    const roles: WidgetRole[] = [
      "pageTitle",
      "sectionHeader",
      "kpi",
      "field",
      "action",
      "body",
    ];
    const allowed = new Set(["fontSize", "fontStyle", "textAlign"]);

    for (const role of roles) {
      const props: Record<string, unknown> = {};

      applyRoleStyling(props, "TEXT_WIDGET", role);

      for (const key in props) {
        expect(allowed.has(key)).toBe(true);
      }
    }
  });

  it("keeps compileApp deterministic with the design pass active", () => {
    const spec = page([
      { type: "text", text: "Tasks" },
      { type: "input", label: "Title" },
      { type: "input", label: "Owner" },
      { type: "button", text: "Add" },
      { type: "table", data: [{ id: 1 }] },
    ]);

    expect(JSON.stringify(compileApp(spec, ids()))).toBe(
      JSON.stringify(compileApp(spec, ids())),
    );
  });
});

function rootDsl(artifact: Record<string, unknown>): WidgetNode {
  const pageList = artifact.pageList as Array<{
    unpublishedPage: { layouts: Array<{ dsl: WidgetNode }> };
  }>;

  return pageList[0].unpublishedPage.layouts[0].dsl;
}

function widgetNamed(node: WidgetNode, name: string): WidgetNode | undefined {
  if (node.widgetName === name) return node;

  for (const child of node.children ?? []) {
    const found = widgetNamed(child, name);

    if (found) return found;
  }

  return undefined;
}

// Assert every canvas in the tree — root, container/form inner canvases, tab canvases — holds no overlapping
// widgets, using the same helper the occupancy delta gate relies on.
function assertNoOverlapsDeep(node: WidgetNode): void {
  const children = node.children ?? [];

  if (node.type === "CANVAS_WIDGET" && children.length > 0) {
    expect(overlappingPairs(children)).toEqual([]);
  }

  for (const child of children) assertNoOverlapsDeep(child);
}

describe("design pass — nested canvases and overlap safety", () => {
  it("compiles a representative app with zero overlaps on any canvas", () => {
    const artifact = compileApp(
      page([
        { type: "text", text: "Ops Dashboard" },
        { type: "text", value: { count: { query: "a" } } },
        { type: "text", value: { count: { query: "b" } } },
        { type: "text", value: { count: { query: "c" } } },
        { type: "text", value: { count: { query: "d" } } },
        { type: "input", label: "One" },
        { type: "input", label: "Two" },
        { type: "input", label: "Three" },
        { type: "button", text: "Save" },
        { type: "button", text: "Reset" },
        { type: "button", text: "Export" },
        {
          type: "form",
          name: "OrderForm",
          children: [
            { type: "input", label: "First" },
            { type: "input", label: "Last" },
          ],
        },
        {
          type: "modal",
          name: "EditModal",
          children: [
            { type: "input", label: "A" },
            { type: "input", label: "B" },
          ],
        },
        {
          type: "container",
          name: "Nested",
          children: [
            { type: "input", label: "X" },
            { type: "input", label: "Y" },
            { type: "input", label: "Z" },
          ],
        },
      ]),
      ids(),
    );

    assertNoOverlapsDeep(rootDsl(artifact));
  });

  it("pairs fields and right-aligns the synthetic submit inside a form's 64-col inner canvas", () => {
    const artifact = compileApp(
      page([
        {
          type: "form",
          name: "OrderForm",
          children: [
            { type: "input", name: "FirstInput", label: "First" },
            { type: "input", name: "LastInput", label: "Last" },
          ],
        },
      ]),
      ids(),
    );
    const dsl = rootDsl(artifact);
    const first = widgetNamed(dsl, "FirstInput")!;
    const last = widgetNamed(dsl, "LastInput")!;
    const submit = widgetNamed(dsl, "Button")!;

    expect(first.topRow).toBe(last.topRow);
    expect(first.rightColumn).toBeLessThanOrEqual(last.leftColumn);
    // Every inner canvas is a 64-column grid (the client snaps each canvas to 64 whatever its pixel width), so the
    // 16-col submit right-aligns to 64 - 16 - 2 (edge margin) = 46, off the canvas edge; the pair fills the width.
    expect(submit.leftColumn).toBe(46);
    expect(submit.rightColumn).toBe(62);
    expect(last.rightColumn as number).toBeGreaterThan(40);
  });

  it("pairs fields inside a 32-col modal too: its inner canvas is 64 columns, not the modal's span", () => {
    const artifact = compileApp(
      page([
        {
          type: "modal",
          name: "EditModal",
          children: [
            { type: "input", name: "AInput", label: "A" },
            { type: "input", name: "BInput", label: "B" },
          ],
        },
      ]),
      ids(),
    );
    const dsl = rootDsl(artifact);
    const a = widgetNamed(dsl, "AInput")!;
    const b = widgetNamed(dsl, "BInput")!;
    const modal = widgetNamed(dsl, "EditModal")!;
    const canvas = (modal.children ?? [])[0]!;

    // Before the fix the modal's content was budgeted at the modal's 32-column span and rendered in the left half
    // of the modal (deploy-preview finding); the canvas is 64 wide and the two inputs share a row across it.
    expect(canvas.rightColumn).toBe(64);
    expect(a.topRow).toBe(b.topRow);
    expect(a.leftColumn).toBe(0);
    expect(a.rightColumn).toBeLessThanOrEqual(b.leftColumn);
    expect(b.rightColumn as number).toBeGreaterThan(32);
    expect(b.rightColumn as number).toBeLessThanOrEqual(64);
  });

  it("lays out each tab panel on a 64-column canvas, not the tabs widget's own 40-column span", () => {
    const artifact = compileApp(
      page([
        {
          type: "tabs",
          name: "Views",
          tabs: [
            {
              label: "One",
              children: [
                { type: "input", name: "AInput", label: "A" },
                { type: "input", name: "BInput", label: "B" },
              ],
            },
            {
              label: "Two",
              children: [{ type: "table", name: "Orders", data: [{ id: 1 }] }],
            },
          ],
        },
      ]),
      ids(),
    );
    const dsl = rootDsl(artifact);
    const tabs = widgetNamed(dsl, "Views")!;

    // The tabs widget keeps its template span in the page grid...
    expect((tabs.rightColumn as number) - (tabs.leftColumn as number)).toBe(40);

    // ...but every tab canvas is a full 64-column grid and its content uses it.
    for (const canvas of tabs.children ?? []) {
      expect(canvas.type).toBe("CANVAS_WIDGET");
      expect(canvas.rightColumn).toBe(64);
    }

    const a = widgetNamed(dsl, "AInput")!;
    const b = widgetNamed(dsl, "BInput")!;
    const orders = widgetNamed(dsl, "Orders")!;

    expect(a.topRow).toBe(b.topRow);
    expect(b.rightColumn as number).toBeGreaterThan(40);
    expect(b.rightColumn as number).toBeLessThanOrEqual(64);
    // A table keeps its 40-column template footprint; it is not clamped below it.
    expect(orders.rightColumn).toBe(40);
  });

  it("builds every canvas of a list card on 64 columns, not the list widget's own 40-column span", () => {
    const artifact = compileApp(
      page([
        {
          type: "list",
          name: "Cards",
          source: { query: "getUsers" },
          image: "avatar",
          title: "name",
          subtitle: "email",
        },
      ]),
      ids(),
    );
    const dsl = rootDsl(artifact);
    const list = widgetNamed(dsl, "Cards")!;

    expect((list.rightColumn as number) - (list.leftColumn as number)).toBe(40);

    const mainCanvas = (list.children ?? [])[0]!;
    const itemContainer = (mainCanvas.children ?? [])[0]!;
    const innerCanvas = (itemContainer.children ?? [])[0]!;

    expect(mainCanvas.type).toBe("CANVAS_WIDGET");
    expect(mainCanvas.rightColumn).toBe(64);
    expect(itemContainer.type).toBe("CONTAINER_WIDGET");
    expect(itemContainer.rightColumn).toBe(64);
    expect(innerCanvas.type).toBe("CANVAS_WIDGET");
    expect(innerCanvas.rightColumn).toBe(64);

    // Template widgets (image, title, subtitle) span the inner canvas.
    const template = innerCanvas.children ?? [];

    expect(template.length).toBe(3);

    for (const child of template) expect(child.rightColumn).toBe(64);
  });

  it("keeps an empty container at its template height", () => {
    const artifact = compileApp(
      page([{ type: "container", name: "Empty", children: [] }]),
      ids(),
    );
    const empty = widgetNamed(rootDsl(artifact), "Empty")!;

    expect(empty.bottomRow - empty.topRow).toBe(30);
  });
});

describe("design pass — edit_page path", () => {
  const basePage = () =>
    rootDsl(compileApp(page([{ type: "text", text: "Seed" }]), ids()));

  it("gives an appended static text body styling at full template width", () => {
    const { dsl } = applyEdit(
      basePage(),
      { add: [{ type: "text", name: "Note", text: "hello" }] },
      ids(),
    );
    const note = widgetNamed(dsl, "Note")!;

    expect(note.fontSize).toBe("1rem");
    expect(note.fontStyle).toBe("NORMAL");
    expect(note.leftColumn).toBe(0);
  });

  it("styles an appended KPI text exactly like the build path", () => {
    const { dsl } = applyEdit(
      basePage(),
      {
        add: [
          { type: "text", name: "Kpi", value: { count: { query: "orders" } } },
        ],
      },
      ids(),
    );
    const kpi = widgetNamed(dsl, "Kpi")!;

    expect(kpi.fontSize).toBe("1.5rem");
    expect(kpi.fontStyle).toBe("BOLD");
    expect(kpi.bottomRow - kpi.topRow).toBe(6);
  });
});
