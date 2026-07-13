import { compileApp } from "./compile.js";
import { sequentialIdGenerator, type WidgetNode } from "./layout.js";
import { lintDsl } from "./lint.js";
import type { WidgetSpec } from "./schema.js";
import { appSpecSchema } from "./schema.js";

function build(widgets: WidgetSpec[]): WidgetNode {
  const artifact = compileApp(
    { name: "App", pages: [{ name: "Home", widgets }] },
    sequentialIdGenerator(),
  );
  const pageList = artifact.pageList as {
    unpublishedPage: { layouts: { dsl: WidgetNode }[] };
  }[];

  return pageList[0].unpublishedPage.layouts[0].dsl;
}

function children(node: WidgetNode): WidgetNode[] {
  return (node.children ?? []) as WidgetNode[];
}

describe("M3 catalog — new widgets", () => {
  it("compiles an input with named-format validation (vetted regex + required)", () => {
    const [input] = children(
      build([
        { type: "input", label: "Zip", validation: { format: "zipcode" } },
      ]),
    );

    expect(input.type).toBe("INPUT_WIDGET_V2");
    expect(input.regex).toBe("^\\d{5}$");
    expect(input.errorMessage).toBe("Please enter a 5-digit zip code");
    expect(input.isRequired).toBe(true);
  });

  it("leaves an un-validated input optional (isRequired false, no regex)", () => {
    const [input] = children(build([{ type: "input", label: "Name" }]));

    expect(input.type).toBe("INPUT_WIDGET_V2");
    expect(input.isRequired).toBe(false);
    expect(input.regex).toBeUndefined();
    expect(input.errorMessage).toBeUndefined();
  });

  it("compiles a datepicker leaf to the correct type/version", () => {
    const [picker] = children(build([{ type: "datepicker", label: "When" }]));

    expect(picker.type).toBe("DATE_PICKER_WIDGET2");
    expect(picker.version).toBe(2);
    expect(picker.label).toBe("When");
    // Leaf: no inner canvas.
    expect(picker.children).toBeUndefined();
  });

  it("compiles a modal as a container-like widget with an inner canvas", () => {
    const [modal] = children(
      build([
        {
          type: "modal",
          title: "Edit",
          children: [{ type: "text", text: "Body" }],
        },
      ]),
    );

    expect(modal.type).toBe("MODAL_WIDGET");
    expect(modal.title).toBe("Edit");
    const inner = children(modal)[0];

    expect(inner.type).toBe("CANVAS_WIDGET");
    expect(children(inner).map((c) => c.type)).toContain("TEXT_WIDGET");
    // Height invariant (same as container): box encloses inner extent.
    expect(modal.bottomRow).toBe(modal.topRow + inner.bottomRow);
  });

  it("compiles a form and auto-adds a submit button after the fields", () => {
    const [form] = children(
      build([
        {
          type: "form",
          submitLabel: "Save",
          children: [{ type: "input", label: "Name" }],
        },
      ]),
    );

    expect(form.type).toBe("FORM_WIDGET");
    const inner = children(form)[0];
    const kinds = children(inner).map((c) => c.type);

    expect(kinds).toEqual(["INPUT_WIDGET_V2", "BUTTON_WIDGET"]);
    const button = children(inner).find((c) => c.type === "BUTTON_WIDGET")!;

    expect(button.text).toBe("Save");
    // Event stub: inert onClick, no dynamic trigger.
    expect(button.onClick).toBe("");
    expect(form.bottomRow).toBe(form.topRow + inner.bottomRow);
  });

  it("produces lint-clean output for every new widget type", () => {
    const dsl = build([
      { type: "datepicker", label: "When" },
      { type: "modal", title: "M", children: [{ type: "text", text: "x" }] },
      {
        type: "form",
        children: [{ type: "input", label: "A" }],
        placement: { after: "DatePicker" },
      },
    ]);
    const diagnostics = lintDsl(dsl);

    expect(diagnostics.errors).toBe(0);
    expect(diagnostics.warnings).toBe(0);
  });

  it("rejects malformed props on the new arms (M3)", () => {
    // form.submitLabel must be safe text
    expect(
      appSpecSchema.safeParse({
        name: "App",
        pages: [
          {
            name: "P",
            widgets: [{ type: "form", submitLabel: "{{evil()}}" }],
          },
        ],
      }).success,
    ).toBe(false);
    // unknown prop on datepicker is rejected (strict object)
    expect(
      appSpecSchema.safeParse({
        name: "App",
        pages: [
          {
            name: "P",
            widgets: [{ type: "datepicker", bogus: 1 }],
          },
        ],
      }).success,
    ).toBe(false);
  });
});

describe("M3b catalog — chart, tabs, list", () => {
  it("compiles a chart leaf with static series data", () => {
    const [chart] = children(
      build([
        {
          type: "chart",
          title: "Sales",
          chartType: "BAR_CHART",
          series: [{ name: "Q1", points: [{ x: "Jan", y: 10 }] }],
        },
      ]),
    );

    expect(chart.type).toBe("CHART_WIDGET");
    expect(chart.chartType).toBe("BAR_CHART");
    expect(chart.children).toBeUndefined();
    const chartData = chart.chartData as Record<
      string,
      { seriesName: string; data: unknown[] }
    >;

    expect(chartData.series1.seriesName).toBe("Q1");
    expect(chartData.series1.data).toEqual([{ x: "Jan", y: 10 }]);
  });

  it("compiles tabs into one inner canvas per tab plus a tabsObj", () => {
    const [tabs] = children(
      build([
        {
          type: "tabs",
          tabs: [
            { label: "One", children: [{ type: "text", text: "a" }] },
            { label: "Two", children: [{ type: "input", label: "b" }] },
          ],
        },
      ]),
    );

    expect(tabs.type).toBe("TABS_WIDGET");
    const canvases = children(tabs);

    expect(canvases).toHaveLength(2);
    expect(canvases.every((c) => c.type === "CANVAS_WIDGET")).toBe(true);
    expect(canvases.map((c) => c.tabName)).toEqual(["One", "Two"]);
    // tabsObj has one entry per tab, each pointing at its canvas.
    const tabsObj = tabs.tabsObj as Record<string, { widgetId: string }>;

    expect(Object.keys(tabsObj)).toHaveLength(2);
    expect(Object.values(tabsObj).map((t) => t.widgetId)).toEqual(
      canvases.map((c) => c.widgetId),
    );
  });

  it("compiles a list with a repeating item template canvas", () => {
    const [list] = children(
      build([{ type: "list", children: [{ type: "text", text: "row" }] }]),
    );

    expect(list.type).toBe("LIST_WIDGET_V2");
    const inner = children(list)[0];

    expect(inner.type).toBe("CANVAS_WIDGET");
    expect(children(inner).map((c) => c.type)).toContain("TEXT_WIDGET");
  });

  it("is lint-clean for chart, tabs, and list", () => {
    const dsl = build([
      { type: "chart", series: [{ name: "s", points: [{ x: 1, y: 2 }] }] },
      {
        type: "tabs",
        tabs: [{ label: "T", children: [{ type: "text", text: "x" }] }],
      },
      { type: "list", children: [{ type: "text", text: "y" }] },
    ]);

    expect(lintDsl(dsl).errors).toBe(0);
  });
});

describe("M3b theming — validated tokens applied to widgets", () => {
  function buildThemed(theme: unknown, widgets: WidgetSpec[]): WidgetNode {
    const artifact = compileApp(
      { name: "App", theme, pages: [{ name: "Home", widgets }] } as never,
      sequentialIdGenerator(),
    );
    const pageList = artifact.pageList as {
      unpublishedPage: { layouts: { dsl: WidgetNode }[] };
    }[];

    return pageList[0].unpublishedPage.layouts[0].dsl;
  }

  it("applies primaryColor to buttons, borderRadius broadly, fontFamily to text", () => {
    const theme = {
      primaryColor: "#123456",
      borderRadius: "0.5rem",
      fontFamily: "Inter",
    };
    const [text, button] = children(
      buildThemed(theme, [
        { type: "text", text: "Hi" },
        { type: "button", text: "Go" },
      ]),
    );

    expect(button.buttonColor).toBe("#123456");
    expect(button.borderRadius).toBe("0.5rem");
    expect(text.fontFamily).toBe("Inter");
    expect(text.borderRadius).toBe("0.5rem");
  });

  it("rejects an invalid theme (non-hex color / raw expression)", () => {
    expect(
      appSpecSchema.safeParse({
        name: "App",
        theme: { primaryColor: "red; {{evil}}" },
        pages: [{ name: "P", widgets: [{ type: "text", text: "x" }] }],
      }).success,
    ).toBe(false);
  });

  it("changes nothing when no theme is given", () => {
    const [button] = children(
      buildThemed(undefined, [{ type: "button", text: "Go" }]),
    );

    expect(button.buttonColor).toBeUndefined();
  });
});

describe("M4 binding vocabulary — safe query bindings only", () => {
  it("compiles table.source to a data binding and registers the path", () => {
    const [table] = children(
      build([{ type: "table", name: "T", source: { query: "getUsers" } }]),
    );

    expect(table.tableData).toBe("{{ getUsers.data ?? [] }}");
    expect(table.dynamicBindingPathList).toEqual([{ key: "tableData" }]);
  });

  it("compiles button.onClick to a run() trigger and registers the path", () => {
    const [button] = children(
      build([{ type: "button", text: "Save", onClick: { run: "insertRow" } }]),
    );

    expect(button.onClick).toBe("{{ insertRow.run() }}");
    expect(button.dynamicTriggerPathList).toEqual([{ key: "onClick" }]);
  });

  it("keeps an unbound button inert (stub, no trigger path)", () => {
    const [button] = children(build([{ type: "button", text: "X" }]));

    expect(button.onClick).toBe("");
    expect(button.dynamicTriggerPathList).toEqual([]);
  });

  it("rejects a query reference that is not a plain identifier", () => {
    for (const bad of ["{{evil}}", "a.b", "a b", "a()", "$x"]) {
      expect(
        appSpecSchema.safeParse({
          name: "App",
          pages: [
            {
              name: "P",
              widgets: [{ type: "table", source: { query: bad } }],
            },
          ],
        }).success,
      ).toBe(false);
    }
  });

  it("rejects a table that sets both static data and a query source", () => {
    // Schema accepts the shape; the compiler rejects the conflict.
    expect(() =>
      build([
        { type: "table", data: [{ id: 1 }], source: { query: "getUsers" } },
      ]),
    ).toThrow(/both 'data' and 'source'/);
  });

  it("emits a binding the dangling-binding lint accepts when the query is known", () => {
    const dsl = build([{ type: "table", source: { query: "getUsers" } }]);

    expect(lintDsl(dsl, { knownDataNames: ["getUsers"] }).errors).toBe(0);
    expect(
      lintDsl(dsl, { knownDataNames: ["other"] }).issues.map((i) => i.rule),
    ).toContain("dangling-binding");
  });
});
