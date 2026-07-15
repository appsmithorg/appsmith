import { compileApp } from "./compile.js";
import { sequentialIdGenerator, type WidgetNode } from "./layout.js";
import { lintDsl } from "./lint.js";
import type { WidgetSpec } from "./schema.js";
import {
  appSpecSchema,
  compileChartDataBinding,
  compileCurrentItemBinding,
  compilePrimaryKeys,
} from "./schema.js";

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

  it("compiles a card grid (list) as the 4-level List-Widget-V2 structure", () => {
    const [list] = children(
      build([
        {
          type: "list",
          source: { query: "getUsers" },
          image: "avatar",
          title: "name",
          subtitle: "email",
        },
      ]),
    );

    expect(list.type).toBe("LIST_WIDGET_V2");
    // list -> main canvas -> item container(isListItemContainer) -> inner canvas -> template widgets.
    const mainCanvas = children(list)[0];

    expect(mainCanvas.type).toBe("CANVAS_WIDGET");
    const itemContainer = children(mainCanvas)[0];

    expect(itemContainer.type).toBe("CONTAINER_WIDGET");
    expect(itemContainer.isListItemContainer).toBe(true);
    // ids cross-reference: list points at the generated main canvas + item container.
    expect(list.mainCanvasId).toBe(mainCanvas.widgetId);
    expect(list.mainContainerId).toBe(itemContainer.widgetId);
    const innerCanvas = children(itemContainer)[0];

    expect(innerCanvas.type).toBe("CANVAS_WIDGET");
    expect(children(innerCanvas).map((c) => c.type)).toEqual([
      "IMAGE_WIDGET",
      "TEXT_WIDGET",
      "TEXT_WIDGET",
    ]);
    // Per-item bindings are compiler-authored.
    const [img, title] = children(innerCanvas);

    expect(img.image).toBe('{{ currentItem["avatar"] }}');
    expect(title.text).toBe('{{ currentItem["name"] }}');
    expect(list.listData).toBe("{{ getUsers.data ?? [] }}");
  });

  it("is lint-clean for chart, tabs, and list", () => {
    const dsl = build([
      { type: "chart", series: [{ name: "s", points: [{ x: 1, y: 2 }] }] },
      {
        type: "tabs",
        tabs: [{ label: "T", children: [{ type: "text", text: "x" }] }],
      },
      { type: "list", source: { query: "getUsers" }, title: "name" },
    ]);

    expect(lintDsl(dsl).errors).toBe(0);
  });

  // A card grid binds its slots to `{{ currentItem["field"] }}`. In the real flow (lintLiveDsl) the linter runs with
  // knownDataNames populated, which is when unknown binding heads are flagged as dangling. `currentItem` (and its
  // list-scope siblings) must be recognized so the compiled card grid does not report false dangling-binding errors.
  it("card grid is lint-clean under knownDataNames (currentItem is a valid binding head)", () => {
    const dsl = build([
      {
        type: "list",
        source: { query: "getUsers", field: "users" },
        image: "image",
        title: "firstName",
        subtitle: "email",
      },
    ]);

    // The masking case (no knownDataNames) AND the real case (knownDataNames populated) must both be clean.
    expect(lintDsl(dsl).errors).toBe(0);
    expect(lintDsl(dsl, { knownDataNames: ["getUsers"] }).errors).toBe(0);
  });

  it("compiles a title-only card grid (no image/subtitle) with just a title slot", () => {
    const [list] = children(
      build([{ type: "list", source: { query: "getUsers" }, title: "name" }]),
    );
    const innerCanvas = children(children(children(list)[0])[0])[0];

    expect(children(innerCanvas).map((c) => c.type)).toEqual(["TEXT_WIDGET"]);
    expect(children(innerCanvas)[0].text).toBe('{{ currentItem["name"] }}');
  });

  it("binds card slots by exact field (spaces allowed) and registers each as a dynamic path", () => {
    const [list] = children(
      build([
        {
          type: "list",
          source: { query: "getUsers", field: "data.items" },
          image: "Photo URL",
          title: "Full Name",
        },
      ]),
    );

    // source with a nested field path compiles to the optional-chained query binding.
    expect(list.listData).toBe("{{ getUsers.data?.data.items ?? [] }}");
    // primaryKeys keys by row index, referencing only the list's own (allocated) name.
    expect(list.primaryKeys).toBe(
      compilePrimaryKeys(list.widgetName as string),
    );

    const innerCanvas = children(children(children(list)[0])[0])[0];
    const [img, title] = children(innerCanvas);

    // Field with a space compiles to a bracket-access binding and is registered as dynamic (else it renders literal).
    expect(img.image).toBe('{{ currentItem["Photo URL"] }}');
    expect(img.dynamicBindingPathList).toEqual([{ key: "image" }]);
    expect(title.text).toBe('{{ currentItem["Full Name"] }}');
    expect(title.dynamicBindingPathList).toEqual([{ key: "text" }]);
  });

  it("rejects a card item field containing binding-escape characters", () => {
    for (const badField of ['a"]}}', "a`b", "a${b}", "a}b", "a]b"]) {
      const result = appSpecSchema.safeParse({
        name: "App",
        pages: [
          {
            name: "Home",
            widgets: [
              { type: "list", source: { query: "q" }, title: badField },
            ],
          },
        ],
      });

      expect(result.success).toBe(false);
    }
  });

  it("compileCurrentItemBinding emits an un-escapable bracket-access binding", () => {
    expect(compileCurrentItemBinding("first name")).toBe(
      '{{ currentItem["first name"] }}',
    );
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

describe("M4-T1 — chart & select query sources (compiler-authored, un-escapable)", () => {
  it("compiles chart.source to a mapped chartData binding and registers chartData.series1.data", () => {
    const [chart] = children(
      build([
        {
          type: "chart",
          title: "Revenue",
          chartType: "COLUMN_CHART",
          source: { query: "getSales", x: "month", y: "revenue" },
        },
      ]),
    );

    expect(chart.type).toBe("CHART_WIDGET");
    const chartData = chart.chartData as Record<
      string,
      { seriesName: string; data: unknown }
    >;

    // Only the series' data is a binding; seriesName is the static title.
    expect(chartData.series1.seriesName).toBe("Revenue");
    expect(chartData.series1.data).toBe(
      '{{ getSales.data?.map((row) => ({ x: row["month"], y: row["revenue"] })) ?? [] }}',
    );
    // Registered at the widget's own nested binding-path format.
    expect(chart.dynamicBindingPathList).toEqual([
      { key: "chartData.series1.data" },
    ]);
  });

  it("compiles chart.source with a nested response field via optional chaining", () => {
    const [chart] = children(
      build([
        {
          type: "chart",
          source: {
            query: "getSales",
            field: "data.rows",
            x: "Month Name",
            y: "Total",
          },
        },
      ]),
    );
    const chartData = chart.chartData as Record<string, { data: unknown }>;

    expect(chartData.series1.data).toBe(
      '{{ getSales.data?.data.rows?.map((row) => ({ x: row["Month Name"], y: row["Total"] })) ?? [] }}',
    );
  });

  it("keeps a static-series chart unbound (no dynamic path)", () => {
    const [chart] = children(
      build([
        { type: "chart", series: [{ name: "s", points: [{ x: 1, y: 2 }] }] },
      ]),
    );

    expect(chart.dynamicBindingPathList).toEqual([]);
  });

  it("rejects a chart that sets both static series and a query source", () => {
    expect(() =>
      build([
        {
          type: "chart",
          series: [{ points: [{ x: 1, y: 2 }] }],
          source: { query: "getSales", x: "a", y: "b" },
        },
      ]),
    ).toThrow(/both 'series' and 'source'/);
  });

  it("compileChartDataBinding emits an un-escapable bracket-access map", () => {
    expect(
      compileChartDataBinding({ query: "q", x: "col a", y: "col b" }),
    ).toBe(
      '{{ q.data?.map((row) => ({ x: row["col a"], y: row["col b"] })) ?? [] }}',
    );
  });

  it("rejects a chart axis column containing binding-escape characters", () => {
    for (const badCol of ['a"]}}', "a`b", "a${b}", "a}b", "a]b", "a\\b"]) {
      const asX = appSpecSchema.safeParse({
        name: "App",
        pages: [
          {
            name: "Home",
            widgets: [
              { type: "chart", source: { query: "q", x: badCol, y: "y" } },
            ],
          },
        ],
      });
      const asY = appSpecSchema.safeParse({
        name: "App",
        pages: [
          {
            name: "Home",
            widgets: [
              { type: "chart", source: { query: "q", x: "x", y: badCol } },
            ],
          },
        ],
      });

      expect(asX.success).toBe(false);
      expect(asY.success).toBe(false);
    }
  });

  it("compiles select.optionsSource to a sourceData binding + literal label/value props", () => {
    const [select] = children(
      build([
        {
          type: "select",
          label: "City",
          optionsSource: {
            query: "getCities",
            label: "city name",
            value: "id",
          },
        },
      ]),
    );

    expect(select.type).toBe("SELECT_WIDGET");
    expect(select.sourceData).toBe("{{ getCities.data ?? [] }}");
    // Column names become literal props (not bindings).
    expect(select.optionLabel).toBe("city name");
    expect(select.optionValue).toBe("id");
    // A query source is a real binding AND a JS-toggled property.
    expect(select.dynamicBindingPathList).toEqual([{ key: "sourceData" }]);
    expect(select.dynamicPropertyPathList).toEqual([{ key: "sourceData" }]);
  });

  it("compiles select.optionsSource with a nested response field", () => {
    const [select] = children(
      build([
        {
          type: "select",
          optionsSource: {
            query: "getCities",
            field: "results",
            label: "name",
            value: "id",
          },
        },
      ]),
    );

    expect(select.sourceData).toBe("{{ getCities.data?.results ?? [] }}");
  });

  it("keeps a static-options select unbound (JSON sourceData, no binding path)", () => {
    const [select] = children(
      build([
        {
          type: "select",
          options: [{ label: "A", value: "1" }],
        },
      ]),
    );

    expect(JSON.parse(select.sourceData as string)).toEqual([
      { label: "A", value: "1" },
    ]);
    expect(select.optionLabel).toBe("label");
    expect(select.dynamicBindingPathList).toEqual([]);
  });

  it("rejects a select that sets both static options and a query source", () => {
    expect(() =>
      build([
        {
          type: "select",
          options: [{ label: "A", value: "1" }],
          optionsSource: { query: "q", label: "l", value: "v" },
        },
      ]),
    ).toThrow(/both 'options' and 'optionsSource'/);
  });

  it("rejects a select option column containing binding-escape characters", () => {
    for (const badCol of ['a"]}}', "a`b", "a${b}", "a}b", "a]b", "a\\b"]) {
      const asLabel = appSpecSchema.safeParse({
        name: "App",
        pages: [
          {
            name: "Home",
            widgets: [
              {
                type: "select",
                optionsSource: { query: "q", label: badCol, value: "v" },
              },
            ],
          },
        ],
      });
      const asValue = appSpecSchema.safeParse({
        name: "App",
        pages: [
          {
            name: "Home",
            widgets: [
              {
                type: "select",
                optionsSource: { query: "q", label: "l", value: badCol },
              },
            ],
          },
        ],
      });

      expect(asLabel.success).toBe(false);
      expect(asValue.success).toBe(false);
    }
  });

  it("chart & select query sources are lint-clean under populated knownDataNames", () => {
    const dsl = build([
      {
        type: "chart",
        source: { query: "getSales", x: "month", y: "revenue" },
      },
      {
        type: "select",
        optionsSource: { query: "getCities", label: "name", value: "id" },
      },
    ]);

    // No allowlisting was needed: the chart binding lives in the nested chartData object (not a scanned string leaf),
    // and the select's sourceData binding head is the query identifier, resolved against knownDataNames.
    expect(lintDsl(dsl).errors).toBe(0);
    expect(
      lintDsl(dsl, { knownDataNames: ["getSales", "getCities"] }).errors,
    ).toBe(0);
    // The select binding is genuinely checked: an unknown-only name set flags it as dangling.
    expect(
      lintDsl(dsl, { knownDataNames: ["other"] }).issues.map((i) => i.rule),
    ).toContain("dangling-binding");
  });
});
