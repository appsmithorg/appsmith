import type { WidgetNode } from "./layout.js";
import {
  canonicalStableSerialize,
  fingerprintDsl,
  projectSemanticPage,
} from "./semantic.js";

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

describe("projectSemanticPage", () => {
  it("reports computed now/count bindings on text; concat stays hidden (no-raw-bindings default)", () => {
    const dsl = node({
      widgetId: "root",
      widgetName: "MainContainer",
      type: "CANVAS_WIDGET",
      children: [
        node({
          widgetId: "t1",
          widgetName: "Today",
          type: "TEXT_WIDGET",
          text: "{{ moment().format('dddd') }}",
        }),
        node({
          widgetId: "t2",
          widgetName: "Matches",
          type: "TEXT_WIDGET",
          text: "{{ (getUsers.data?.items ?? []).length }}",
        }),
        node({
          widgetId: "t3",
          widgetName: "FullName",
          type: "TEXT_WIDGET",
          text: '{{ [Users.selectedRow["first"], " "].join("") }}',
        }),
      ],
    });
    const widgets = projectSemanticPage(dsl).widgets;
    const today = widgets.find((w) => w.name === "Today")!;
    const matches = widgets.find((w) => w.name === "Matches")!;
    const fullName = widgets.find((w) => w.name === "FullName")!;

    expect(today.bindings).toEqual({ text: { now: { format: "dayOfWeek" } } });
    expect(matches.bindings).toEqual({
      text: { count: { query: "getUsers", field: "items" } },
    });
    // Concat is not read back (yet): hidden is the safe default for anything unrecognized.
    expect(fullName.bindings).toBeUndefined();
  });

  it("hides hand-authored moment formats and reads back count without a field", () => {
    const dsl = node({
      widgetId: "root",
      widgetName: "MainContainer",
      type: "CANVAS_WIDGET",
      children: [
        node({
          widgetId: "t1",
          widgetName: "HandAuthored",
          type: "TEXT_WIDGET",
          // Matches the NOW regex charset but is NOT a compiler preset: the reverse-map gate must hide it.
          text: "{{ moment().format('X') }}",
        }),
        node({
          widgetId: "t2",
          widgetName: "Total",
          type: "TEXT_WIDGET",
          text: "{{ (getUsers.data ?? []).length }}",
        }),
      ],
    });
    const widgets = projectSemanticPage(dsl).widgets;

    expect(
      widgets.find((w) => w.name === "HandAuthored")!.bindings,
    ).toBeUndefined();
    expect(widgets.find((w) => w.name === "Total")!.bindings).toEqual({
      text: { count: { query: "getUsers" } },
    });
  });

  it("reports query-field display bindings on text and image", () => {
    const dsl = node({
      widgetId: "root",
      widgetName: "MainContainer",
      type: "CANVAS_WIDGET",
      children: [
        node({
          widgetId: "t1",
          widgetName: "Temp",
          type: "TEXT_WIDGET",
          text: '{{ getWeather.data?.current.temp ?? "" }}',
        }),
        node({
          widgetId: "img1",
          widgetName: "Photo",
          type: "IMAGE_WIDGET",
          image: '{{ getProfile.data?.avatarUrl ?? "" }}',
        }),
        node({
          widgetId: "t2",
          widgetName: "Whole",
          type: "TEXT_WIDGET",
          text: '{{ getDay.data ?? "" }}',
        }),
      ],
    });
    const widgets = projectSemanticPage(dsl).widgets;
    const temp = widgets.find((w) => w.name === "Temp")!;
    const photo = widgets.find((w) => w.name === "Photo")!;
    const whole = widgets.find((w) => w.name === "Whole")!;

    expect(temp.bindings).toEqual({
      text: { query: "getWeather", field: "current.temp" },
    });
    expect(photo.bindings).toEqual({
      image: { query: "getProfile", field: "avatarUrl" },
    });
    expect(whole.bindings).toEqual({ text: { query: "getDay" } });
  });

  it("flattens containers and retains the immediate parent name", () => {
    const dsl = node({
      widgetId: "root",
      widgetName: "MainContainer",
      type: "CANVAS_WIDGET",
      children: [
        node({
          widgetId: "container",
          widgetName: "ProfileCard",
          type: "CONTAINER_WIDGET",
          topRow: 2,
          bottomRow: 20,
          rightColumn: 40,
          children: [
            node({
              widgetId: "canvas",
              widgetName: "ProfileCanvas",
              type: "CANVAS_WIDGET",
              children: [
                node({
                  widgetId: "text",
                  widgetName: "WelcomeText",
                  type: "TEXT_WIDGET",
                  text: "Welcome",
                }),
              ],
            }),
          ],
        }),
      ],
    });

    expect(projectSemanticPage(dsl).widgets).toEqual([
      expect.objectContaining({
        id: "root",
        name: "MainContainer",
        appsmithType: "CANVAS_WIDGET",
        geometry: { topRow: 0, bottomRow: 4, leftColumn: 0, rightColumn: 24 },
      }),
      expect.objectContaining({
        id: "container",
        catalogType: "container",
        parentWidgetName: "MainContainer",
        geometry: { topRow: 2, bottomRow: 20, leftColumn: 0, rightColumn: 40 },
      }),
      expect.objectContaining({
        id: "canvas",
        parentWidgetName: "ProfileCard",
      }),
      expect.objectContaining({
        id: "text",
        catalogType: "text",
        parentWidgetName: "ProfileCanvas",
        props: { text: "Welcome" },
      }),
    ]);
  });

  it("represents unknown widgets without exposing arbitrary props or bindings", () => {
    const dsl = node({
      widgetId: "custom",
      widgetName: "CustomWidget",
      type: "VENDOR_WIDGET",
      title: "Safe title",
      text: "{{ query.data }}",
      options: [
        { label: "Safe", value: "one" },
        { label: "{{ unsafe }}", value: "two" },
      ],
      dynamicBindingPathList: [{ key: "text" }],
      dynamicTriggerPathList: [{ key: "onClick" }],
      secretConfiguration: { token: "do not disclose" },
      children: [],
    });

    const [widget] = projectSemanticPage(dsl).widgets;

    expect(widget).toMatchObject({
      id: "custom",
      name: "CustomWidget",
      appsmithType: "VENDOR_WIDGET",
      geometry: { topRow: 0, bottomRow: 4, leftColumn: 0, rightColumn: 24 },
      props: { title: "Safe title" },
    });
    expect(widget.catalogType).toBeUndefined();
    expect(widget.props).not.toHaveProperty("text");
    expect(widget.props).not.toHaveProperty("options");
    expect(JSON.stringify(widget)).not.toContain("dynamicBindingPathList");
    expect(JSON.stringify(widget)).not.toContain("secretConfiguration");
  });

  it("surfaces compiler-emitted bindings as structured refs (round-trip), never raw expressions", () => {
    const dsl = node({
      widgetId: "root",
      widgetName: "MainContainer",
      type: "CANVAS_WIDGET",
      children: [
        node({
          widgetId: "detail",
          widgetName: "EmailDetail",
          type: "TEXT_WIDGET",
          text: '{{ Users.selectedRow["user email"] }}',
        }),
        node({
          widgetId: "input",
          widgetName: "EmailInput",
          type: "INPUT_WIDGET_V2",
          defaultText: '{{ Users.selectedRow["email"] }}',
        }),
        node({
          widgetId: "table",
          widgetName: "Users",
          type: "TABLE_WIDGET_V2",
          tableData: "{{ getUsers.data ?? [] }}",
        }),
        node({
          widgetId: "handwritten",
          widgetName: "Custom",
          type: "TEXT_WIDGET",
          // NOT a compiler shape — must stay hidden entirely.
          text: "{{ appsmith.store.secret + Users.selectedRow.x }}",
        }),
      ],
    });
    const widgets = projectSemanticPage(dsl).widgets;
    const byName = new Map(widgets.map((widget) => [widget.name, widget]));

    expect(byName.get("EmailDetail")?.bindings).toEqual({
      text: { table: "Users", column: "user email" },
    });
    expect(byName.get("EmailInput")?.bindings).toEqual({
      defaultText: { table: "Users", column: "email" },
    });
    expect(byName.get("Users")?.bindings).toEqual({
      tableData: { query: "getUsers" },
    });
    // The arbitrary expression is neither surfaced as a binding nor leaked as a prop.
    expect(byName.get("Custom")?.bindings).toBeUndefined();
    expect(JSON.stringify(byName.get("Custom"))).not.toContain(
      "appsmith.store",
    );
  });

  it("projects a guarded (clear-when-empty) table binding as a structured ref", () => {
    const dsl = node({
      widgetId: "0",
      widgetName: "MainContainer",
      type: "CANVAS_WIDGET",
      children: [
        node({
          widgetId: "table",
          widgetName: "Results",
          type: "TABLE_WIDGET_V2",
          tableData:
            "{{ ZipInput.text ? (lookupZip.data?.places ?? []) : [] }}",
        }),
      ],
    });
    const widgets = projectSemanticPage(dsl).widgets;
    const results = widgets.find((widget) => widget.name === "Results");

    expect(results?.bindings).toEqual({
      tableData: {
        query: "lookupZip",
        field: "places",
        clearWhenEmpty: "ZipInput",
      },
    });
  });

  it("projects a guarded binding with no field", () => {
    const dsl = node({
      widgetId: "0",
      widgetName: "MainContainer",
      type: "CANVAS_WIDGET",
      children: [
        node({
          widgetId: "table",
          widgetName: "Results",
          type: "TABLE_WIDGET_V2",
          tableData: "{{ Search.text ? (getRows.data ?? []) : [] }}",
        }),
      ],
    });
    const results = projectSemanticPage(dsl).widgets.find(
      (widget) => widget.name === "Results",
    );

    expect(results?.bindings).toEqual({
      tableData: { query: "getRows", clearWhenEmpty: "Search" },
    });
  });

  it("surfaces an input's literal validation props (regex + errorMessage)", () => {
    const dsl = node({
      widgetId: "0",
      widgetName: "MainContainer",
      type: "CANVAS_WIDGET",
      children: [
        node({
          widgetId: "in1",
          widgetName: "ZipInput",
          type: "INPUT_WIDGET_V2",
          regex: "^\\d{5}$",
          errorMessage: "Please enter a 5-digit zip code",
          isRequired: true,
        }),
      ],
    });
    const input = projectSemanticPage(dsl).widgets.find(
      (widget) => widget.name === "ZipInput",
    );

    expect(input?.props).toMatchObject({
      regex: "^\\d{5}$",
      errorMessage: "Please enter a 5-digit zip code",
      isRequired: true,
    });
  });

  it("hides a binding-bearing regex from the projection (no raw expression leak)", () => {
    const dsl = node({
      widgetId: "0",
      widgetName: "MainContainer",
      type: "CANVAS_WIDGET",
      children: [
        node({
          widgetId: "in1",
          widgetName: "Sneaky",
          type: "INPUT_WIDGET_V2",
          regex: "{{ appsmith.store.secret }}",
        }),
      ],
    });
    const input = projectSemanticPage(dsl).widgets.find(
      (widget) => widget.name === "Sneaky",
    );

    expect(input?.props.regex).toBeUndefined();
    expect(JSON.stringify(input)).not.toContain("appsmith.store");
  });

  it("projects a visible-when binding as a structured ref", () => {
    const dsl = node({
      widgetId: "0",
      widgetName: "MainContainer",
      type: "CANVAS_WIDGET",
      children: [
        node({
          widgetId: "t",
          widgetName: "Results",
          type: "TABLE_WIDGET_V2",
          isVisible: "{{ ViewToggle.selectedOptionValue === 'Table' }}",
        }),
      ],
    });
    const results = projectSemanticPage(dsl).widgets.find(
      (widget) => widget.name === "Results",
    );

    expect(results?.bindings).toEqual({
      isVisible: { control: "ViewToggle", equals: "Table" },
    });
  });

  it("projects a disable-when-invalid binding as a structured ref", () => {
    const dsl = node({
      widgetId: "0",
      widgetName: "MainContainer",
      type: "CANVAS_WIDGET",
      children: [
        node({
          widgetId: "btn",
          widgetName: "LookupButton",
          type: "BUTTON_WIDGET",
          isDisabled: "{{ !ZipInput.isValid }}",
        }),
      ],
    });
    const button = projectSemanticPage(dsl).widgets.find(
      (widget) => widget.name === "LookupButton",
    );

    expect(button?.bindings).toEqual({
      isDisabled: { disableWhenInvalid: "ZipInput" },
    });
  });

  it("reverse-maps the M4-T5 widget types to their catalog types (read round-trip)", () => {
    const dsl = node({
      widgetId: "root",
      widgetName: "MainContainer",
      type: "CANVAS_WIDGET",
      children: [
        node({ widgetId: "c", widgetName: "Agree", type: "CHECKBOX_WIDGET" }),
        node({ widgetId: "s", widgetName: "Toggle", type: "SWITCH_WIDGET" }),
        node({
          widgetId: "r",
          widgetName: "Choice",
          type: "RADIO_GROUP_WIDGET",
        }),
        node({
          widgetId: "m",
          widgetName: "Tags",
          type: "MULTI_SELECT_WIDGET_V2",
        }),
        node({
          widgetId: "f",
          widgetName: "Upload",
          type: "FILE_PICKER_WIDGET_V2",
        }),
      ],
    });
    const byName = Object.fromEntries(
      projectSemanticPage(dsl).widgets.map((w) => [w.name, w.catalogType]),
    );

    expect(byName.Agree).toBe("checkbox");
    expect(byName.Toggle).toBe("switch");
    expect(byName.Choice).toBe("radio");
    expect(byName.Tags).toBe("multiselect");
    expect(byName.Upload).toBe("filepicker");
  });
});

describe("DSL fingerprints", () => {
  it("uses stable key ordering and changes when the DSL changes", () => {
    const first = node({
      widgetId: "one",
      widgetName: "Text1",
      type: "TEXT_WIDGET",
      text: "Hello",
      label: "Greeting",
    });
    const reordered = node({
      type: "TEXT_WIDGET",
      widgetName: "Text1",
      widgetId: "one",
      label: "Greeting",
      text: "Hello",
    });
    const changed = node({
      widgetId: "one",
      widgetName: "Text1",
      type: "TEXT_WIDGET",
      text: "Goodbye",
      label: "Greeting",
    });

    expect(canonicalStableSerialize(first)).toBe(
      canonicalStableSerialize(reordered),
    );
    expect(fingerprintDsl(first)).toBe(fingerprintDsl(reordered));
    expect(fingerprintDsl(first)).not.toBe(fingerprintDsl(changed));
  });
});
