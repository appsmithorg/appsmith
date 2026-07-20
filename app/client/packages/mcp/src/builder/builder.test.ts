import { applyEdit, compileApp } from "./compile.js";
import { sequentialIdGenerator, type WidgetNode } from "./layout.js";
import { overlapDelta, overlappingPairs } from "./occupancy.js";
import {
  appSpecSchema,
  compileComputedValue,
  COMPUTED_NOW_FORMATS,
  editSpecSchema,
  type WidgetSpec,
} from "./schema.js";
import { projectSemanticPage } from "./semantic.js";
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

describe("M6 modal discipline — build/edit structural glue", () => {
  it("compileApp rejects a build spec that nests a modal inside a modal", () => {
    expect(() =>
      compileApp(
        {
          name: "App",
          pages: [
            {
              name: "Home",
              widgets: [
                {
                  type: "modal",
                  name: "Outer",
                  children: [{ type: "modal", name: "Inner" }],
                },
              ],
            },
          ],
        },
        ids(),
      ),
    ).toThrow(/cannot be placed inside another modal/);
  });

  it("applyEdit rejects adding a modal inside an existing modal; pre-existing nesting stays editable", () => {
    const artifact = compileApp(
      {
        name: "App",
        pages: [
          {
            name: "Home",
            widgets: [{ type: "modal", name: "EditModal", title: "Edit" }],
          },
        ],
      },
      ids(),
    );
    const dsl = rootOf(artifact);

    expect(() =>
      applyEdit(
        dsl,
        {
          add: [
            {
              type: "modal",
              name: "Nested",
              placement: { inside: "EditModal" },
            },
          ],
        },
        ids(),
      ),
    ).toThrow(/cannot be placed inside another modal/);

    // Argument-order pin for assertNoNewNestedModals(currentDsl, dsl): a page that ALREADY contains
    // hand-authored nesting must remain editable — only NEW nesting rejects.
    const modal = (dsl.children ?? []).find(
      (child) => child.widgetName === "EditModal",
    ) as WidgetNode;
    const modalCanvas = (modal.children ?? [])[0] as WidgetNode;

    modalCanvas.children = [
      {
        widgetId: "legacy1",
        widgetName: "LegacyNested",
        type: "MODAL_WIDGET",
        detachFromLayout: true,
        topRow: 0,
        bottomRow: 24,
        leftColumn: 0,
        rightColumn: 24,
        children: [],
      } as unknown as WidgetNode,
    ];

    const edited = applyEdit(
      dsl,
      { add: [{ type: "text", name: "Note", text: "hello" }] },
      ids(),
    );

    expect(
      (edited.dsl.children ?? []).some((child) => child.widgetName === "Note"),
    ).toBe(true);
  });
});

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

  it("JSON-serializes cleanly — no shared array reference between pageOrder and publishedPageOrder", () => {
    const artifact = compileApp(
      {
        name: "Zip Code Lookup",
        pages: [
          {
            name: "Lookup",
            widgets: [
              { type: "text", name: "Title", text: "Zip Code Lookup" },
              {
                type: "input",
                name: "ZipInput",
                label: "Zip",
                inputType: "TEXT",
              },
              { type: "button", name: "LookupButton", text: "Look up" },
              { type: "table", name: "ResultsTable", data: [{ place: "BH" }] },
            ],
          },
        ],
      },
      ids(),
    );

    // pageOrder and publishedPageOrder must be independent arrays (a shared reference is valid JSON but the
    // artifact serializer's guard rejected it, which broke every build_application call).
    expect(artifact.pageOrder).not.toBe(artifact.publishedPageOrder);
    expect(artifact.pageOrder).toEqual(artifact.publishedPageOrder);
    // The whole artifact round-trips through JSON without throwing.
    expect(() => JSON.stringify(artifact)).not.toThrow();
  });

  it("populates exportedApplication.pages so the imported app links to its pages", () => {
    const artifact = compileApp(
      {
        name: "Multi",
        pages: [
          { name: "Lookup", widgets: [{ type: "text", text: "A" }] },
          { name: "Details", widgets: [{ type: "text", text: "B" }] },
        ],
      },
      ids(),
    );
    const application = artifact.exportedApplication as {
      pages: { id: string; isDefault: boolean }[];
      publishedPages: { id: string; isDefault: boolean }[];
    };

    // At the declared schema version the server runs no import migrations, so these must be present (the migration
    // that derives them is skipped). Without them the imported app has zero pages.
    expect(application.pages).toEqual([
      { id: "Lookup", isDefault: true },
      { id: "Details", isDefault: false },
    ]);
    expect(application.publishedPages).toEqual(application.pages);
    // Independent object copies — no shared references between edit/view lists.
    expect(application.pages[0]).not.toBe(application.publishedPages[0]);
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
              { type: "table", data: [{ id: 1, name: "Ada" }] },
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
    // Literal rows are serialized as static JSON and NOT registered as a dynamic binding.
    expect(table.tableData).toBe(JSON.stringify([{ id: 1, name: "Ada" }]));
    expect(table.dynamicBindingPathList).toEqual([]);
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
            widgets: [{ type: "table" }, { type: "table" }],
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

  it("compiles a select with options into sourceData (the prop the widget reads)", () => {
    const artifact = compileApp(
      {
        name: "App",
        pages: [
          {
            name: "Home",
            widgets: [
              {
                type: "select",
                label: "Pick",
                options: [
                  { label: "Hide", value: "Hide" },
                  { label: "Show", value: "Show" },
                ],
              },
            ],
          },
        ],
      },
      ids(),
    );
    const widget = (rootOf(artifact).children as WidgetNode[])[0];

    expect(widget.type).toBe("SELECT_WIDGET");
    // sourceData is a JS-evaluated JSON array keyed by optionLabel/optionValue.
    expect(JSON.parse(widget.sourceData as string)).toEqual([
      { label: "Hide", value: "Hide" },
      { label: "Show", value: "Show" },
    ]);
    expect(widget.optionLabel).toBe("label");
    expect(widget.optionValue).toBe("value");
    expect(widget.dynamicPropertyPathList).toEqual([{ key: "sourceData" }]);
    // The legacy `options` prop is no longer emitted.
    expect(widget.options).toBeUndefined();
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

  it("compiles the W1 display widgets (divider, progress, circularprogress, rate, iconbutton)", () => {
    const artifact = compileApp(
      {
        name: "App",
        pages: [
          {
            name: "Home",
            widgets: [
              { type: "divider", name: "Sep", orientation: "vertical" },
              { type: "progress", name: "Bar", value: 75 },
              { type: "circularprogress", name: "Ring", value: 40 },
              {
                type: "rate",
                name: "Stars",
                max: 5,
                defaultRate: 4,
                allowHalf: true,
              },
              { type: "iconbutton", name: "Add", icon: "plus" },
            ],
          },
        ],
      },
      ids(),
    );
    const children = rootOf(artifact).children as WidgetNode[];
    const by = (name: string) => children.find((w) => w.widgetName === name)!;

    expect(by("Sep").type).toBe("DIVIDER_WIDGET");
    expect(by("Sep").orientation).toBe("vertical");
    expect(by("Bar").type).toBe("PROGRESS_WIDGET");
    expect(by("Bar").progress).toBe(75);
    expect(by("Ring").type).toBe("CIRCULAR_PROGRESS_WIDGET");
    expect(by("Ring").progress).toBe(40);
    expect(by("Stars").type).toBe("RATE_WIDGET");
    expect(by("Stars").maxCount).toBe(5);
    expect(by("Stars").defaultRate).toBe(4);
    expect(by("Stars").isAllowHalf).toBe(true);
    expect(by("Add").type).toBe("ICON_BUTTON_WIDGET");
    expect(by("Add").iconName).toBe("plus");
  });

  it("rejects unsafe W1 widget props (bad icon, out-of-range progress/rate)", () => {
    const bad = [
      { type: "iconbutton", icon: "plus{{evil}}" },
      { type: "progress", value: 150 },
      { type: "circularprogress", value: -5 },
      { type: "rate", max: 0 },
    ];

    for (const widget of bad) {
      expect(
        appSpecSchema.safeParse({
          name: "App",
          pages: [{ name: "Home", widgets: [widget] }],
        }).success,
      ).toBe(false);
    }
  });

  it("compiles the W3 input widgets (currency, phone, sliders, groups)", () => {
    const artifact = compileApp(
      {
        name: "App",
        pages: [
          {
            name: "Home",
            widgets: [
              {
                type: "currencyinput",
                name: "Price",
                defaultValue: 12.5,
                decimals: 2,
                currencyCode: "eur",
              },
              { type: "phoneinput", name: "Phone", defaultValue: "5551234" },
              {
                type: "numberslider",
                name: "Vol",
                min: 0,
                max: 11,
                defaultValue: 7,
              },
              {
                type: "categoryslider",
                name: "Size",
                options: [
                  { label: "S", value: "s" },
                  { label: "L", value: "l" },
                ],
                defaultValue: "l",
              },
              {
                type: "rangeslider",
                name: "Band",
                min: 0,
                max: 50,
                defaultStart: 10,
                defaultEnd: 40,
              },
              {
                type: "checkboxgroup",
                name: "Colors",
                options: [
                  { label: "Red", value: "R" },
                  { label: "Blue", value: "B" },
                ],
                defaultSelected: ["R", "nonexistent"],
              },
              {
                type: "switchgroup",
                name: "Flags",
                options: [{ label: "On", value: "ON" }],
                defaultSelected: ["ON"],
                inline: false,
              },
            ],
          },
        ],
      },
      ids(),
    );
    const children = rootOf(artifact).children as WidgetNode[];
    const by = (name: string) => children.find((w) => w.widgetName === name)!;

    expect(by("Price").type).toBe("CURRENCY_INPUT_WIDGET");
    expect(by("Price").defaultText).toBe("12.5");
    expect(by("Price").decimals).toBe(2);
    // currencyCode is normalized to upper-case ISO.
    expect(by("Price").defaultCurrencyCode).toBe("EUR");
    expect(by("Phone").type).toBe("PHONE_INPUT_WIDGET");
    expect(by("Phone").defaultText).toBe("5551234");
    expect(by("Vol").type).toBe("NUMBER_SLIDER_WIDGET");
    expect(by("Vol").max).toBe(11);
    expect(by("Vol").defaultValue).toBe(7);
    expect(by("Size").type).toBe("CATEGORY_SLIDER_WIDGET");
    expect(by("Size").defaultOptionValue).toBe("l");
    expect(by("Band").type).toBe("RANGE_SLIDER_WIDGET");
    expect(by("Band").defaultStartValue).toBe(10);
    expect(by("Band").defaultEndValue).toBe(40);
    expect(by("Colors").type).toBe("CHECKBOX_GROUP_WIDGET");
    // Only the default matching a real option survives; the orphan is dropped.
    expect(by("Colors").defaultSelectedValues).toEqual(["R"]);
    expect(by("Flags").type).toBe("SWITCH_GROUP_WIDGET");
    expect(by("Flags").isInline).toBe(false);
  });

  it("rejects unsafe W3 input props (binding text, bad currency code/decimals)", () => {
    const bad = [
      { type: "currencyinput", label: "Cost {{evil}}" },
      { type: "currencyinput", currencyCode: "US" },
      { type: "currencyinput", decimals: 9 },
      { type: "phoneinput", defaultValue: "`backtick`" },
      { type: "checkboxgroup", options: [] },
    ];

    for (const widget of bad) {
      expect(
        appSpecSchema.safeParse({
          name: "App",
          pages: [{ name: "Home", widgets: [widget] }],
        }).success,
      ).toBe(false);
    }
  });

  it("compiles the W4 action widgets (menubutton, buttongroup)", () => {
    const artifact = compileApp(
      {
        name: "App",
        pages: [
          {
            name: "Home",
            widgets: [
              {
                type: "menubutton",
                name: "Actions",
                label: "Do",
                items: [{ label: "Edit" }, { label: "Delete" }],
              },
              {
                type: "buttongroup",
                name: "Toolbar",
                orientation: "vertical",
                buttons: [
                  { label: "Save", icon: "floppy-disk" },
                  { label: "Cancel" },
                ],
              },
            ],
          },
        ],
      },
      ids(),
    );
    const children = rootOf(artifact).children as WidgetNode[];
    const by = (name: string) => children.find((w) => w.widgetName === name)!;

    const menu = by("Actions");

    expect(menu.type).toBe("MENU_BUTTON_WIDGET");
    expect(menu.label).toBe("Do");
    const menuItems = menu.menuItems as Record<string, { label: string }>;

    expect(Object.keys(menuItems)).toEqual(["menuItem1", "menuItem2"]);
    expect(menuItems.menuItem2.label).toBe("Delete");

    const group = by("Toolbar");

    expect(group.type).toBe("BUTTON_GROUP_WIDGET");
    expect(group.orientation).toBe("vertical");
    const groupButtons = group.groupButtons as Record<
      string,
      { label: string; iconName?: string }
    >;

    expect(Object.keys(groupButtons)).toEqual(["groupButton1", "groupButton2"]);
    expect(groupButtons.groupButton1.iconName).toBe("floppy-disk");
    // A button with no icon omits iconName entirely.
    expect(groupButtons.groupButton2.iconName).toBeUndefined();
  });

  it("rejects unsafe W4 action props (binding label, bad icon)", () => {
    const bad = [
      { type: "menubutton", items: [{ label: "Edit {{evil}}" }] },
      { type: "buttongroup", buttons: [{ label: "Go", icon: "Bad Icon" }] },
      { type: "menubutton", items: [] },
    ];

    for (const widget of bad) {
      expect(
        appSpecSchema.safeParse({
          name: "App",
          pages: [{ name: "Home", widgets: [widget] }],
        }).success,
      ).toBe(false);
    }
  });

  it("compiles the W6 device-capture widgets (camera, audiorecorder, codescanner)", () => {
    const artifact = compileApp(
      {
        name: "App",
        pages: [
          {
            name: "Home",
            widgets: [
              { type: "camera", name: "Cam", mode: "VIDEO", mirrored: false },
              { type: "audiorecorder", name: "Mic" },
              {
                type: "codescanner",
                name: "Scan",
                label: "Scan ticket",
                scanMode: "CLICK_TO_SCAN",
              },
            ],
          },
        ],
      },
      ids(),
    );
    const children = rootOf(artifact).children as WidgetNode[];
    const by = (name: string) => children.find((w) => w.widgetName === name)!;

    expect(by("Cam").type).toBe("CAMERA_WIDGET");
    expect(by("Cam").mode).toBe("VIDEO");
    expect(by("Cam").isMirrored).toBe(false);
    expect(by("Mic").type).toBe("AUDIO_RECORDER_WIDGET");
    expect(by("Scan").type).toBe("CODE_SCANNER_WIDGET");
    expect(by("Scan").scannerLayout).toBe("CLICK_TO_SCAN");
    expect(by("Scan").label).toBe("Scan ticket");
  });

  it("rejects unsafe W6 device-capture props (bad enum, binding label)", () => {
    const bad = [
      { type: "camera", mode: "PHOTO" },
      { type: "codescanner", scanMode: "MAYBE" },
      { type: "codescanner", label: "Scan {{evil}}" },
    ];

    for (const widget of bad) {
      expect(
        appSpecSchema.safeParse({
          name: "App",
          pages: [{ name: "Home", widgets: [widget] }],
        }).success,
      ).toBe(false);
    }
  });

  it("compiles the W7 map widgets (map, mapchart)", () => {
    const artifact = compileApp(
      {
        name: "App",
        pages: [
          {
            name: "Home",
            widgets: [
              {
                type: "map",
                name: "Loc",
                center: { lat: 51.5, long: -0.12 },
                zoom: 70,
                markers: [{ lat: 51.5, long: -0.12, title: "London" }],
              },
              {
                type: "mapchart",
                name: "Pop",
                title: "Populations",
                region: "EUROPE",
                data: [
                  { id: "GB", value: 67 },
                  { id: "FR", value: 68 },
                ],
              },
            ],
          },
        ],
      },
      ids(),
    );
    const children = rootOf(artifact).children as WidgetNode[];
    const by = (name: string) => children.find((w) => w.widgetName === name)!;

    const map = by("Loc");

    expect(map.type).toBe("MAP_WIDGET");
    expect(map.zoomLevel).toBe(70);
    expect(map.mapCenter).toEqual({ lat: 51.5, long: -0.12 });
    expect(map.defaultMarkers).toEqual([
      { lat: 51.5, long: -0.12, title: "London" },
    ]);

    const chart = by("Pop");

    expect(chart.type).toBe("MAP_CHART_WIDGET");
    expect(chart.mapType).toBe("EUROPE");
    // Numeric values are coerced to the widget's string form.
    expect(chart.data).toEqual([
      { id: "GB", value: "67" },
      { id: "FR", value: "68" },
    ]);
  });

  it("rejects unsafe W7 map props (out-of-range coords, bad region/id)", () => {
    const bad = [
      { type: "map", center: { lat: 200, long: 0 } },
      { type: "map", markers: [{ lat: 0, long: 999 }] },
      { type: "mapchart", region: "MARS" },
      { type: "mapchart", data: [{ id: "bad id!", value: 1 }] },
    ];

    for (const widget of bad) {
      expect(
        appSpecSchema.safeParse({
          name: "App",
          pages: [{ name: "Home", widgets: [widget] }],
        }).success,
      ).toBe(false);
    }
  });

  it("compiles the W5 tree-select widgets (single, multi) with nested options", () => {
    const options = [
      {
        label: "Fruit",
        value: "FRUIT",
        children: [
          { label: "Apple", value: "APPLE" },
          { label: "Pear", value: "PEAR" },
        ],
      },
      { label: "Veg", value: "VEG" },
    ];
    const artifact = compileApp(
      {
        name: "App",
        pages: [
          {
            name: "Home",
            widgets: [
              {
                type: "singleselecttree",
                name: "One",
                options,
                // A nested value must resolve through the whole tree.
                defaultValue: "APPLE",
                expandAll: true,
              },
              {
                type: "multiselecttree",
                name: "Many",
                options,
                defaultSelected: ["PEAR", "notreal"],
              },
            ],
          },
        ],
      },
      ids(),
    );
    const children = rootOf(artifact).children as WidgetNode[];
    const by = (name: string) => children.find((w) => w.widgetName === name)!;

    const one = by("One");

    expect(one.type).toBe("SINGLE_SELECT_TREE_WIDGET");
    expect(one.defaultOptionValue).toBe("APPLE");
    expect(one.expandAll).toBe(true);
    expect((one.options as unknown[]).length).toBe(2);

    const many = by("Many");

    expect(many.type).toBe("MULTI_SELECT_TREE_WIDGET");
    // The orphan default is filtered; the valid nested one survives.
    expect(many.defaultOptionValue).toEqual(["PEAR"]);
  });

  it("rejects unsafe W5 tree-select props (binding label/value, empty options)", () => {
    const bad = [
      {
        type: "singleselecttree",
        options: [{ label: "X {{evil}}", value: "X" }],
      },
      {
        type: "multiselecttree",
        options: [
          {
            label: "X",
            value: "X",
            children: [{ label: "Y", value: "`bad`" }],
          },
        ],
      },
      { type: "singleselecttree", options: [] },
    ];

    for (const widget of bad) {
      expect(
        appSpecSchema.safeParse({
          name: "App",
          pages: [{ name: "Home", widgets: [widget] }],
        }).success,
      ).toBe(false);
    }
  });

  it("compiles the W2 media/embed widgets with validated http(s) URLs", () => {
    const artifact = compileApp(
      {
        name: "App",
        pages: [
          {
            name: "Home",
            widgets: [
              {
                type: "iframe",
                name: "Site",
                source: "https://example.com/embed",
                title: "Embedded",
              },
              {
                type: "video",
                name: "Clip",
                url: "https://cdn.example.com/a.mp4",
                autoPlay: true,
              },
              {
                type: "audio",
                name: "Tune",
                url: "http://cdn.example.com/b.mp3",
              },
              {
                type: "documentviewer",
                name: "Doc",
                url: "https://example.com/report.pdf",
              },
            ],
          },
        ],
      },
      ids(),
    );
    const children = rootOf(artifact).children as WidgetNode[];
    const by = (name: string) => children.find((w) => w.widgetName === name)!;

    expect(by("Site").type).toBe("IFRAME_WIDGET");
    expect(by("Site").source).toBe("https://example.com/embed");
    expect(by("Clip").type).toBe("VIDEO_WIDGET");
    expect(by("Clip").autoPlay).toBe(true);
    expect(by("Tune").type).toBe("AUDIO_WIDGET");
    expect(by("Doc").type).toBe("DOCUMENT_VIEWER_WIDGET");
    expect(by("Doc").docUrl).toBe("https://example.com/report.pdf");
  });

  it("rejects dangerous media URLs (non-http scheme, credentials, missing, binding)", () => {
    const bad = [
      // javascript: URI would execute in the app origin — the core threat this gate blocks.
      { type: "iframe", source: "javascript:alert(document.cookie)" },
      { type: "iframe", source: "data:text/html,<script>alert(1)</script>" },
      { type: "video", url: "file:///etc/passwd" },
      { type: "audio", url: "vbscript:msgbox(1)" },
      // Embedded credentials would leak into the DSL and the request.
      { type: "video", url: "https://user:pass@example.com/a.mp4" },
      // Not a URL at all.
      { type: "documentviewer", url: "not a url" },
      // Binding syntax must never survive into a URL prop.
      { type: "iframe", source: "https://example.com/{{Query1.data}}" },
      // The URL is required.
      { type: "iframe", title: "no source" },
      // WHATWG-normalization guarantees (council regression pins): leading/mid-scheme whitespace and case
      // variants of javascript:, protocol-relative, and other non-http schemes must all still be rejected.
      { type: "iframe", source: "\tjavascript:alert(1)" },
      { type: "iframe", source: "JavaScript:alert(1)" },
      { type: "iframe", source: "java\tscript:alert(1)" },
      { type: "iframe", source: "//evil.com/embed" },
      { type: "documentviewer", url: "mailto:a@b.com" },
      { type: "video", url: "ftp://example.com/a.mp4" },
    ];

    for (const widget of bad) {
      expect(
        appSpecSchema.safeParse({
          name: "App",
          pages: [{ name: "Home", widgets: [widget] }],
        }).success,
      ).toBe(false);
    }
  });

  it("compiles richtext (plain-text seed) and jsonform (auto-generated from data)", () => {
    const artifact = compileApp(
      {
        name: "App",
        pages: [
          {
            name: "Home",
            widgets: [
              {
                type: "richtext",
                name: "Notes",
                label: "Notes",
                defaultValue: "Type here",
              },
              {
                type: "jsonform",
                name: "Signup",
                title: "Sign up",
                data: { name: "", age: 0 },
                submitLabel: "Register",
              },
            ],
          },
        ],
      },
      ids(),
    );
    const children = rootOf(artifact).children as WidgetNode[];
    const by = (name: string) => children.find((w) => w.widgetName === name)!;

    expect(by("Notes").type).toBe("RICH_TEXT_EDITOR_WIDGET");
    expect(by("Notes").defaultText).toBe("Type here");
    expect(by("Notes").inputType).toBe("html");

    const form = by("Signup");

    expect(form.type).toBe("JSON_FORM_WIDGET");
    expect(form.autoGenerateForm).toBe(true);
    // sourceData is a literal JSON string the client derives fields from.
    expect(form.sourceData).toBe(JSON.stringify({ name: "", age: 0 }));
    expect(form.submitButtonLabel).toBe("Register");
  });

  it("compiles statbox as a STATBOX_WIDGET container with caption/value children", () => {
    const artifact = compileApp(
      {
        name: "App",
        pages: [
          {
            name: "Home",
            widgets: [
              {
                type: "statbox",
                name: "Kpi",
                title: "Page Views",
                value: "2.6 M",
                subtext: "21% up",
                icon: "arrow-top-right",
              },
            ],
          },
        ],
      },
      ids(),
    );
    const statbox = (rootOf(artifact).children as WidgetNode[])[0];

    expect(statbox.type).toBe("STATBOX_WIDGET");
    // The composite's parts live in its inner canvas.
    const canvas = (statbox.children as WidgetNode[])[0];
    const parts = canvas.children as WidgetNode[];
    const texts = parts.filter((w) => w.type === "TEXT_WIDGET");

    expect(texts.map((t) => t.text)).toEqual(["Page Views", "2.6 M", "21% up"]);
    expect(parts.some((w) => w.type === "ICON_BUTTON_WIDGET")).toBe(true);
  });

  it("rejects richtext HTML tags and binding syntax", () => {
    const bad = [
      { type: "richtext", defaultValue: "<script>alert(1)</script>" },
      { type: "richtext", defaultValue: "<b>bold</b>" },
      { type: "richtext", defaultValue: "{{Query1.data}}" },
      { type: "statbox", title: "KPI {{evil}}" },
    ];

    for (const widget of bad) {
      expect(
        appSpecSchema.safeParse({
          name: "App",
          pages: [{ name: "Home", widgets: [widget] }],
        }).success,
      ).toBe(false);
    }
  });

  it("T1: compiles explicit table columns (type/label/hidden + computed) into primaryColumns", () => {
    const artifact = compileApp(
      {
        name: "App",
        pages: [
          {
            name: "Home",
            widgets: [
              {
                type: "table",
                name: "Orders",
                data: [{ price: 10, qty: 2, "sign up": "y" }],
                columns: [
                  { key: "price", type: "number", label: "Unit Price" },
                  { key: "sign up", type: "date", hidden: true },
                  {
                    key: "total",
                    computed: {
                      op: "mul",
                      args: [{ cell: "price" }, { cell: "qty" }],
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
      ids(),
    );
    const table = (rootOf(artifact).children as WidgetNode[])[0];

    expect(table.type).toBe("TABLE_WIDGET_V2");
    const primaryColumns = table.primaryColumns as Record<
      string,
      Record<string, unknown>
    >;

    // A space in the key is sanitized to an underscore for the column id; originalId/alias keep the raw field.
    expect(table.columnOrder).toEqual(["price", "sign_up", "total"]);
    expect(primaryColumns.price.columnType).toBe("number");
    expect(primaryColumns.price.label).toBe("Unit Price");
    expect(primaryColumns.sign_up.originalId).toBe("sign up");
    expect(primaryColumns.sign_up.columnType).toBe("date");
    expect(primaryColumns.sign_up.isVisible).toBe(false);

    // The data column reads currentRow by the raw field name and self-references the table name.
    expect(primaryColumns.price.isDerived).toBe(false);
    expect(primaryColumns.price.computedValue).toContain(
      "Orders.processedTableData",
    );
    expect(primaryColumns.price.computedValue).toContain('currentRow["price"]');

    // The computed column is derived and evaluates the per-row formula (finite-guarded).
    expect(primaryColumns.total.isDerived).toBe(true);
    expect(primaryColumns.total.columnType).toBe("number");
    expect(primaryColumns.total.computedValue).toContain(
      '(Number(currentRow["price"]) * Number(currentRow["qty"]))',
    );

    // Each column's computedValue is registered as a dynamic binding.
    const paths = (table.dynamicBindingPathList as { key: string }[]).map(
      (p) => p.key,
    );

    expect(paths).toContain("primaryColumns.total.computedValue");
    expect(paths).toContain("primaryColumns.price.computedValue");
  });

  it("T1: rejects a { cell } leaf outside a computed column, and bad computed formulas", () => {
    const bad = [
      // A cell leaf has no meaning in a text widget's value formula (no currentRow) — must be rejected.
      {
        widgets: [{ type: "text", value: { formula: { cell: "price" } } }],
      },
      // Bad arity inside a computed column formula.
      {
        widgets: [
          {
            type: "table",
            data: [{ a: 1 }],
            columns: [
              { key: "x", computed: { op: "sub", args: [{ cell: "a" }] } },
            ],
          },
        ],
      },
      // Column key charset (a quote would break out of currentRow["..."]).
      {
        widgets: [
          { type: "table", data: [{ a: 1 }], columns: [{ key: 'a"]//' }] },
        ],
      },
      // SECURITY [council]: a table name with a metacharacter is emitted unescaped into the computedValue binding,
      // so nameField must reject it — this locks the injection invariant the emitters depend on.
      {
        widgets: [
          {
            type: "table",
            name: 'T"];alert(1)//',
            data: [{ a: 1 }],
            columns: [{ key: "a" }],
          },
        ],
      },
      // Formula depth/node limits stay enforced through cell leaves (deeply nested add of cells).
      {
        widgets: [
          {
            type: "table",
            data: [{ a: 1 }],
            columns: [
              {
                key: "deep",
                computed: {
                  op: "add",
                  args: [
                    { cell: "a" },
                    {
                      op: "add",
                      args: [
                        { cell: "a" },
                        {
                          op: "add",
                          args: [
                            { cell: "a" },
                            {
                              op: "add",
                              args: [
                                { cell: "a" },
                                {
                                  op: "add",
                                  args: [
                                    { cell: "a" },
                                    {
                                      op: "add",
                                      args: [
                                        { cell: "a" },
                                        { op: "add", args: [{ cell: "a" }, 1] },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    ];

    for (const page of bad) {
      expect(
        appSpecSchema.safeParse({
          name: "App",
          pages: [{ name: "Home", widgets: page.widgets }],
        }).success,
      ).toBe(false);
    }
  });

  it("T1: omitting `columns` preserves auto-derive (primaryColumns stays empty)", () => {
    const artifact = compileApp(
      {
        name: "App",
        pages: [
          {
            name: "Home",
            widgets: [{ type: "table", name: "Auto", data: [{ a: 1, b: 2 }] }],
          },
        ],
      },
      ids(),
    );
    const table = (rootOf(artifact).children as WidgetNode[])[0];

    expect(table.primaryColumns).toEqual({});
    expect(table.columnOrder).toEqual([]);
    expect(table.dynamicBindingPathList).toEqual([]);
  });

  it("T1: duplicate keys that sanitize to the same id get distinct suffixed ids", () => {
    const artifact = compileApp(
      {
        name: "App",
        pages: [
          {
            name: "Home",
            widgets: [
              {
                type: "table",
                name: "Dup",
                data: [{ "a b": 1 }],
                // "a b" and "a_b" both sanitize to "a_b" → the second is disambiguated.
                columns: [{ key: "a b" }, { key: "a_b" }],
              },
            ],
          },
        ],
      },
      ids(),
    );
    const table = (rootOf(artifact).children as WidgetNode[])[0];

    expect(table.columnOrder).toEqual(["a_b", "a_b1"]);
    const primaryColumns = table.primaryColumns as Record<
      string,
      Record<string, unknown>
    >;

    // originalId keeps each raw key even though the ids were disambiguated.
    expect(primaryColumns.a_b.originalId).toBe("a b");
    expect(primaryColumns.a_b1.originalId).toBe("a_b");
  });

  it("Ch1: compiles a multi-series query chart with axis/label config", () => {
    const artifact = compileApp(
      {
        name: "App",
        pages: [
          {
            name: "Home",
            widgets: [
              {
                type: "chart",
                name: "Sales",
                chartType: "COLUMN_CHART",
                source: [
                  { query: "Q1", x: "month", y: "revenue", name: "Revenue" },
                  { query: "Q2", x: "month", y: "cost", name: "Cost" },
                ],
                xAxisLabel: "Month",
                yAxisLabel: "USD",
                labelOrientation: "slant",
                showDataLabels: true,
              },
            ],
          },
        ],
      },
      ids(),
    );
    const chart = (rootOf(artifact).children as WidgetNode[])[0];

    expect(chart.type).toBe("CHART_WIDGET");
    expect(chart.chartType).toBe("COLUMN_CHART");
    expect(chart.xAxisName).toBe("Month");
    expect(chart.yAxisName).toBe("USD");
    expect(chart.labelOrientation).toBe("slant");
    expect(chart.showDataPointLabel).toBe(true);

    const chartData = chart.chartData as Record<
      string,
      { seriesName: string; data: string }
    >;

    expect(Object.keys(chartData)).toEqual(["series1", "series2"]);
    expect(chartData.series1.seriesName).toBe("Revenue");
    expect(chartData.series2.seriesName).toBe("Cost");
    // Each query series' data is a compiler-authored binding over that query's rows.
    expect(chartData.series1.data).toContain("Q1.data");
    expect(chartData.series2.data).toContain("Q2.data");

    // Both series' data are registered as dynamic bindings.
    const paths = (chart.dynamicBindingPathList as { key: string }[]).map(
      (p) => p.key,
    );

    expect(paths).toEqual(["chartData.series1.data", "chartData.series2.data"]);
  });

  it("Ch1: a single query source still yields one series named after the title", () => {
    const artifact = compileApp(
      {
        name: "App",
        pages: [
          {
            name: "Home",
            widgets: [
              {
                type: "chart",
                name: "One",
                title: "Trend",
                source: { query: "Q1", x: "d", y: "v" },
              },
            ],
          },
        ],
      },
      ids(),
    );
    const chart = (rootOf(artifact).children as WidgetNode[])[0];
    const chartData = chart.chartData as Record<string, { seriesName: string }>;

    expect(Object.keys(chartData)).toEqual(["series1"]);
    expect(chartData.series1.seriesName).toBe("Trend");
  });

  it("Ch1: rejects unsafe chart props (bad type, binding axis label, series+source)", () => {
    const bad = [
      { type: "chart", chartType: "CUSTOM_ECHART" },
      { type: "chart", xAxisLabel: "X {{evil}}" },
      { type: "chart", labelOrientation: "sideways" },
      { type: "chart", source: [{ query: "Q1", x: 'x"]//', y: "y" }] },
    ];

    for (const widget of bad) {
      expect(
        appSpecSchema.safeParse({
          name: "App",
          pages: [{ name: "Home", widgets: [widget] }],
        }).success,
      ).toBe(false);
    }

    // series + source together is rejected at compile time (mutually exclusive).
    expect(() =>
      compileApp(
        {
          name: "App",
          pages: [
            {
              name: "Home",
              widgets: [
                {
                  type: "chart",
                  series: [{ name: "S", points: [{ x: 1, y: 2 }] }],
                  source: { query: "Q1", x: "d", y: "v" },
                },
              ],
            },
          ],
        },
        ids(),
      ),
    ).toThrow(/cannot set both/);
  });

  it("compiles selected-row display bindings for text and input", () => {
    const artifact = compileApp(
      {
        name: "App",
        pages: [
          {
            name: "Home",
            widgets: [
              { type: "table", name: "Users", data: [{ id: 1 }] },
              {
                type: "text",
                name: "EmailDetail",
                source: { table: "Users", column: "email" },
              },
              {
                type: "input",
                name: "EmailInput",
                defaultValue: { table: "Users", column: "user email" },
              },
            ],
          },
        ],
      },
      ids(),
    );
    const children = rootOf(artifact).children as WidgetNode[];
    const text = children.find((w) => w.widgetName === "EmailDetail")!;
    const input = children.find((w) => w.widgetName === "EmailInput")!;

    expect(text.text).toBe('{{ Users.selectedRow["email"] }}');
    expect(text.dynamicBindingPathList).toEqual([{ key: "text" }]);
    expect(input.defaultText).toBe('{{ Users.selectedRow["user email"] }}');
    expect(input.dynamicBindingPathList).toEqual([{ key: "defaultText" }]);
  });

  it("binds a table to a query's data, optionally into a nested response field", () => {
    const artifact = compileApp(
      {
        name: "App",
        pages: [
          {
            name: "Home",
            widgets: [
              { type: "table", name: "Whole", source: { query: "getRow" } },
              {
                type: "table",
                name: "Nested",
                source: { query: "lookupZip", field: "places" },
              },
            ],
          },
        ],
      },
      ids(),
    );
    const children = rootOf(artifact).children as WidgetNode[];
    const whole = children.find((w) => w.widgetName === "Whole")!;
    const nested = children.find((w) => w.widgetName === "Nested")!;

    // Optional chaining + `?? []` keeps the table valid before the query runs (no "Data is undefined" error).
    expect(whole.tableData).toBe("{{ getRow.data ?? [] }}");
    expect(nested.tableData).toBe("{{ lookupZip.data?.places ?? [] }}");
    expect(nested.dynamicBindingPathList).toEqual([{ key: "tableData" }]);
  });

  it("keeps unbound text/input static with no dynamic paths", () => {
    const artifact = compileApp(
      {
        name: "App",
        pages: [
          {
            name: "Home",
            widgets: [
              { type: "text", text: "Hello" },
              { type: "input", label: "Name" },
            ],
          },
        ],
      },
      ids(),
    );
    const children = rootOf(artifact).children as WidgetNode[];

    expect(children[0].dynamicBindingPathList).toEqual([]);
    expect(children[1].defaultText).toBe("");
    expect(children[1].dynamicBindingPathList).toEqual([]);
  });

  it("rejects a text widget setting both text and source", () => {
    expect(() =>
      compileApp(
        {
          name: "App",
          pages: [
            {
              name: "Home",
              widgets: [
                {
                  type: "text",
                  text: "static",
                  source: { table: "Users", column: "email" },
                },
              ],
            },
          ],
        },
        ids(),
      ),
    ).toThrow(/cannot set both 'text' and 'source'/);
  });

  it("binds a text and an image to a query response field (scalar display bindings)", () => {
    const artifact = compileApp(
      {
        name: "App",
        pages: [
          {
            name: "Home",
            widgets: [
              {
                type: "text",
                name: "Temperature",
                source: { query: "getWeather", field: "current.temp" },
              },
              { type: "text", name: "WholeBody", source: { query: "getDay" } },
              {
                type: "image",
                name: "Photo",
                source: { query: "getProfile", field: "avatarUrl" },
              },
            ],
          },
        ],
      },
      ids(),
    );
    const children = rootOf(artifact).children as WidgetNode[];
    const temperature = children.find((w) => w.widgetName === "Temperature")!;
    const wholeBody = children.find((w) => w.widgetName === "WholeBody")!;
    const photo = children.find((w) => w.widgetName === "Photo")!;

    // Optional chaining + `?? ""` keeps the widget blank before the query has run.
    expect(temperature.text).toBe('{{ getWeather.data?.current.temp ?? "" }}');
    expect(temperature.dynamicBindingPathList).toEqual([{ key: "text" }]);
    expect(wholeBody.text).toBe('{{ getDay.data ?? "" }}');
    expect(photo.image).toBe('{{ getProfile.data?.avatarUrl ?? "" }}');
    expect(photo.dynamicBindingPathList).toEqual([{ key: "image" }]);
  });

  it("compiles computed-value tokens on text: now, count, and concat", () => {
    const artifact = compileApp(
      {
        name: "App",
        pages: [
          {
            name: "Home",
            widgets: [
              {
                type: "text",
                name: "Today",
                value: { now: { format: "dayOfWeek" } },
              },
              {
                type: "text",
                name: "Matches",
                value: { count: { query: "getUsers", field: "items" } },
              },
              {
                type: "text",
                name: "FullName",
                value: {
                  concat: [
                    { table: "Users", column: "first" },
                    { literal: " " },
                    { table: "Users", column: "last" },
                  ],
                },
              },
            ],
          },
        ],
      },
      ids(),
    );
    const children = rootOf(artifact).children as WidgetNode[];
    const today = children.find((w) => w.widgetName === "Today")!;
    const matches = children.find((w) => w.widgetName === "Matches")!;
    const fullName = children.find((w) => w.widgetName === "FullName")!;

    // The agent picks a NAMED format; the compiler owns the moment format literal.
    expect(today.text).toBe("{{ moment().format('dddd') }}");
    expect(today.dynamicBindingPathList).toEqual([{ key: "text" }]);
    expect(matches.text).toBe("{{ (getUsers.data?.items ?? []).length }}");
    // Literals are JSON-escaped at compile time so agent text stays inert.
    expect(fullName.text).toBe(
      '{{ [Users.selectedRow["first"], " ", Users.selectedRow["last"]].join("") }}',
    );
  });

  it("compiles EVERY named now-format and each round-trips through semantic read-back", () => {
    // Table-driven over the emitter's own map (mirrors the input-validation formats test): a typo in any
    // format literal, or drift between the emitter and the read-back reverse map, fails here.
    for (const name of Object.keys(COMPUTED_NOW_FORMATS)) {
      const artifact = compileApp(
        {
          name: "App",
          pages: [
            {
              name: "Home",
              widgets: [
                {
                  type: "text",
                  name: "Now",
                  value: {
                    now: { format: name as keyof typeof COMPUTED_NOW_FORMATS },
                  },
                },
              ],
            },
          ],
        },
        ids(),
      );
      const text = (rootOf(artifact).children as WidgetNode[])[0];

      expect(text.text).toBe(
        `{{ moment().format('${COMPUTED_NOW_FORMATS[name as keyof typeof COMPUTED_NOW_FORMATS]}') }}`,
      );

      const projected = projectSemanticPage(rootOf(artifact)).widgets.find(
        (w) => w.name === "Now",
      )!;

      expect(projected.bindings).toEqual({ text: { now: { format: name } } });
    }
  });

  it("compiles concat query-field parts and pins JSON escaping of hostile literals", () => {
    const artifact = compileApp(
      {
        name: "App",
        pages: [
          {
            name: "Home",
            widgets: [
              {
                type: "text",
                name: "Combo",
                value: {
                  concat: [
                    { query: "getUser", field: "name" },
                    { literal: ' says "hi" \\ ' },
                    { query: "getDay" },
                  ],
                },
              },
              {
                type: "text",
                name: "Total",
                value: { count: { query: "getUsers" } },
              },
            ],
          },
        ],
      },
      ids(),
    );
    const children = rootOf(artifact).children as WidgetNode[];
    const combo = children.find((w) => w.widgetName === "Combo")!;
    const total = children.find((w) => w.widgetName === "Total")!;

    // Quotes and backslashes in the agent literal arrive JSON-escaped — inert inside the expression.
    expect(combo.text).toBe(
      '{{ [getUser.data?.name, " says \\"hi\\" \\\\ ", getDay.data].join("") }}',
    );
    // Count without a field reads the whole response array.
    expect(total.text).toBe("{{ (getUsers.data ?? []).length }}");
  });

  it("compiles a formula value: Fahrenheit conversion with rounding, finite-guarded", () => {
    const artifact = compileApp(
      {
        name: "App",
        pages: [
          {
            name: "Home",
            widgets: [
              {
                type: "text",
                name: "TempF",
                value: {
                  formula: {
                    op: "round",
                    args: [
                      {
                        op: "add",
                        args: [
                          {
                            op: "mul",
                            args: [
                              { query: "getWeather", field: "current.temp" },
                              1.8,
                            ],
                          },
                          32,
                        ],
                      },
                      1,
                    ],
                  },
                },
              },
              {
                type: "text",
                name: "Half",
                value: {
                  formula: {
                    op: "div",
                    args: [{ table: "Users", column: "amount" }, 2],
                  },
                },
              },
            ],
          },
        ],
      },
      ids(),
    );
    const children = rootOf(artifact).children as WidgetNode[];
    const tempF = children.find((w) => w.widgetName === "TempF")!;
    const half = children.find((w) => w.widgetName === "Half")!;

    // The whole expression is finite-guarded (blank instead of NaN/Infinity), refs are coerced via
    // Number(), and every compound is parenthesized — all compiler-owned characters.
    // round always parenthesizes its operand (a bare literal would otherwise emit `1.toFixed(...)`,
    // a syntax error), so compound operands carry doubled parens — harmless and uniform.
    expect(tempF.text).toBe(
      '{{ ((v) => Number.isFinite(v) ? v : "")(Number((((Number(getWeather.data?.current.temp) * 1.8) + 32)).toFixed(1))) }}',
    );
    expect(tempF.dynamicBindingPathList).toEqual([{ key: "text" }]);
    expect(half.text).toBe(
      '{{ ((v) => Number.isFinite(v) ? v : "")((Number(Users.selectedRow["amount"]) / 2)) }}',
    );
  });

  it("rejects malformed formulas: bad ops, arity, depth, size, and non-finite literals", () => {
    const deep = (levels: number): unknown =>
      levels === 0 ? 1 : { op: "abs", args: [deep(levels - 1)] };
    const wide = {
      op: "add",
      args: [1, 2],
    } as { op: string; args: unknown[] };
    let node: { op: string; args: unknown[] } = wide;

    for (let i = 0; i < 30; i += 1) {
      node.args[1] = { op: "add", args: [1, 2] };
      node = node.args[1] as { op: string; args: unknown[] };
    }

    const badFormulas = [
      { op: "evil()", args: [1, 2] },
      { op: "sub", args: [1, 2, 3] },
      { op: "abs", args: [1, 2] },
      { op: "round", args: [1, 9] },
      { op: "round", args: [1, { op: "abs", args: [1] }] },
      { op: "div", args: [{ query: "get(); x" }, 2] },
      deep(10),
      wide,
      // Variadic ops need at least 2 arguments.
      { op: "add", args: [1] },
      // Width limit: 9 args rejects (schema max is 8).
      { op: "add", args: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
      // Node cap isolated: wide and SHALLOW (depth 3) but 28 nodes > 25 — only the node check can catch it.
      {
        op: "add",
        args: [
          { op: "add", args: [1, 2, 3, 4, 5, 6, 7, 8] },
          { op: "add", args: [1, 2, 3, 4, 5, 6, 7, 8] },
          { op: "add", args: [1, 2, 3, 4, 5, 6, 7, 8] },
        ],
      },
      Number.POSITIVE_INFINITY,
    ];

    for (const formula of badFormulas) {
      expect(
        appSpecSchema.safeParse({
          name: "App",
          pages: [
            { name: "Home", widgets: [{ type: "text", value: { formula } }] },
          ],
        }).success,
      ).toBe(false);
    }
  });

  it("pins every formula op branch, bare leaves, mixed refs, and boundary acceptance", () => {
    const WRAP = (expr: string) =>
      `{{ ((v) => Number.isFinite(v) ? v : "")(${expr}) }}`;
    const cases: { name: string; formula: unknown; expected: string }[] = [
      {
        name: "Sub",
        formula: { op: "sub", args: [10, 4] },
        expected: WRAP("(10 - 4)"),
      },
      {
        name: "Min",
        formula: { op: "min", args: [1, 2, 3] },
        expected: WRAP("Math.min(1, 2, 3)"),
      },
      {
        name: "Max",
        formula: { op: "max", args: [3, 4] },
        expected: WRAP("Math.max(3, 4)"),
      },
      {
        name: "Abs",
        formula: { op: "abs", args: [-5] },
        expected: WRAP("Math.abs(-5)"),
      },
      // round arity-1 takes the Math.round branch, not toFixed.
      {
        name: "RoundWhole",
        formula: { op: "round", args: [{ op: "div", args: [10, 3] }] },
        expected: WRAP("Math.round((10 / 3))"),
      },
      { name: "BareNumber", formula: 42, expected: WRAP("42") },
      {
        name: "BareRef",
        formula: { query: "getX", field: "n" },
        expected: WRAP("Number(getX.data?.n)"),
      },
      {
        name: "MixedLeaves",
        formula: {
          op: "add",
          args: [
            { query: "getX", field: "n" },
            { table: "Users", column: "amt" },
          ],
        },
        expected: WRAP(
          '(Number(getX.data?.n) + Number(Users.selectedRow["amt"]))',
        ),
      },
      // Boundary ACCEPTANCE: exactly 8 args; exactly 25 nodes (1 + 8×3); max valid depth (5 ops + leaf = 6).
      {
        name: "Wide8",
        formula: { op: "add", args: [1, 2, 3, 4, 5, 6, 7, 8] },
        expected: WRAP("(1 + 2 + 3 + 4 + 5 + 6 + 7 + 8)"),
      },
      {
        name: "Nodes25",
        formula: {
          op: "add",
          args: Array.from({ length: 8 }, () => ({ op: "add", args: [1, 2] })),
        },
        expected: WRAP(
          `(${Array.from({ length: 8 }, () => "(1 + 2)").join(" + ")})`,
        ),
      },
      {
        name: "Depth6",
        formula: {
          op: "abs",
          args: [
            {
              op: "abs",
              args: [
                {
                  op: "abs",
                  args: [{ op: "abs", args: [{ op: "abs", args: [1] }] }],
                },
              ],
            },
          ],
        },
        expected: WRAP("Math.abs(Math.abs(Math.abs(Math.abs(Math.abs(1)))))"),
      },
    ];
    const artifact = compileApp(
      {
        name: "App",
        pages: [
          {
            name: "Home",
            widgets: cases.map((c) => ({
              type: "text",
              name: c.name,
              value: { formula: c.formula },
            })) as never,
          },
        ],
      },
      ids(),
    );
    const children = rootOf(artifact).children as WidgetNode[];

    for (const c of cases) {
      expect(children.find((w) => w.widgetName === c.name)?.text).toBe(
        c.expected,
      );
    }
  });

  it("emitted formulas are parseable JS and evaluate correctly (all 8 ops)", () => {
    const compiled = compileComputedValue({
      formula: {
        op: "round",
        args: [
          {
            op: "add",
            args: [
              { op: "mul", args: [2, 3] },
              { op: "sub", args: [10, { op: "div", args: [8, 4] }] },
              { op: "min", args: [1, 2] },
              { op: "max", args: [3, 4] },
              { op: "abs", args: [-2] },
            ],
          },
          1,
        ],
      },
    } as never);
    // Strip the {{ }} shell and execute the pure-numeric expression: 6 + 8 + 1 + 4 + 2 = 21.
    const inner = compiled.slice(3, -3);
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const evaluate = new Function(`return ${inner}`) as () => number;

    expect(evaluate()).toBe(21);
  });

  it("rejects source together with value on the build path", () => {
    expect(() =>
      compileApp(
        {
          name: "App",
          pages: [
            {
              name: "Home",
              widgets: [
                {
                  type: "text",
                  source: { query: "getDay" },
                  value: { now: { format: "date" } },
                },
              ],
            },
          ],
        },
        ids(),
      ),
    ).toThrow(/cannot set 'value' together with/);
  });

  it("rejects a text widget combining value with text or source, and unsafe computed refs", () => {
    const base = { name: "App" };

    expect(() =>
      compileApp(
        {
          ...base,
          pages: [
            {
              name: "Home",
              widgets: [
                {
                  type: "text",
                  text: "static",
                  value: { now: { format: "dayOfWeek" } },
                },
              ],
            },
          ],
        },
        ids(),
      ),
    ).toThrow(/cannot set/);

    // Unknown format names, injection in concat literals, and bad refs are schema-rejected.
    const badValues = [
      { now: { format: "'; evil() //" } },
      { count: { query: "get(); x" } },
      { concat: [{ literal: "a{{evil}}" }, { literal: "b" }] },
      { concat: [{ literal: "only one part" }] },
    ];

    for (const value of badValues) {
      expect(
        appSpecSchema.safeParse({
          ...base,
          pages: [{ name: "Home", widgets: [{ type: "text", value }] }],
        }).success,
      ).toBe(false);
    }
  });

  it("rejects an image widget setting both image and source", () => {
    expect(() =>
      compileApp(
        {
          name: "App",
          pages: [
            {
              name: "Home",
              widgets: [
                {
                  type: "image",
                  image: "https://example.com/x.png",
                  source: { query: "getProfile", field: "avatarUrl" },
                },
              ],
            },
          ],
        },
        ids(),
      ),
    ).toThrow(/cannot set both 'image' and 'source'/);
  });

  it("schema rejects injection through query-field refs", () => {
    const cases = [
      { query: "get(); evil//", field: "a" },
      { query: "getX", field: "a{{evil}}" },
      { query: "getX", field: 'a"b' },
      { query: "getX", field: "a b" },
      // Malformed dotted paths would compile to a JS syntax error in the eval worker.
      { query: "getX", field: "a." },
      { query: "getX", field: "a..b" },
      { query: "getX", field: ".a" },
    ];

    for (const source of cases) {
      expect(
        appSpecSchema.safeParse({
          name: "App",
          pages: [
            {
              name: "Home",
              widgets: [{ type: "text", source }],
            },
          ],
        }).success,
      ).toBe(false);
    }
  });

  it("schema rejects injection through selected-row refs", () => {
    const cases = [
      { table: "Users']; evil()//", column: "email" },
      { table: "Users", column: 'em"ail' },
      { table: "Users", column: "x{{evil}}" },
      { table: "Users", column: "a`b" },
    ];

    for (const source of cases) {
      expect(
        appSpecSchema.safeParse({
          name: "App",
          pages: [
            {
              name: "Home",
              widgets: [{ type: "text", source }],
            },
          ],
        }).success,
      ).toBe(false);
    }
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
    // Add enough widgets to overflow the container's initial height, so growth is exercised (not just fit).
    const { dsl: edited } = applyEdit(
      dsl,
      {
        add: Array.from({ length: 12 }, (_, i) => ({
          type: "input" as const,
          label: `Note ${i}`,
          placement: { inside: "Details" },
        })),
      },
      ids(),
    );
    const originalContainer = (dsl.children as WidgetNode[]).find(
      (c) => c.widgetName === "Details",
    )!;
    const container = (edited.children as WidgetNode[]).find(
      (c) => c.widgetName === "Details",
    )!;
    const inner = (container.children as WidgetNode[])[0];
    const names = (inner.children as WidgetNode[]).map((c) => c.type);

    expect(names).toContain("INPUT_WIDGET_V2");
    // The container must grow to encompass the inner canvas's new extent, not clip it, and must maintain the
    // build-time invariant container.bottomRow = container.topRow + innerCanvas.bottomRow.
    expect(container.bottomRow).toBeGreaterThan(originalContainer.bottomRow);
    expect(container.bottomRow).toBe(container.topRow + inner.bottomRow);
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

  // M6 CRITICAL regression case (design section D): applyEdit already grows containers — adding a widget inside a
  // container that must grow PAST a widget below it must keep working under the delta overlap gate: the container
  // grows AND the widget below is pushed down, so the final DSL introduces no overlapping pair.
  it("grows a container past the widget below it and pushes that widget down (no introduced overlap)", () => {
    const artifact = compileApp(
      {
        name: "App",
        pages: [
          {
            name: "Home",
            widgets: [
              {
                type: "container",
                name: "Details",
                children: [{ type: "text", name: "Heading", text: "Hi" }],
              },
              { type: "button", name: "Below", text: "Save" },
            ],
          },
        ],
      },
      ids(),
    );
    const dsl = rootOf(artifact);
    const { dsl: edited, notes } = applyEdit(
      dsl,
      {
        add: Array.from({ length: 12 }, (_, i) => ({
          type: "input" as const,
          label: `Note ${i}`,
          placement: { inside: "Details" },
        })),
      },
      ids(),
    );
    const container = (edited.children as WidgetNode[]).find(
      (c) => c.widgetName === "Details",
    )!;
    const below = (edited.children as WidgetNode[]).find(
      (c) => c.widgetName === "Below",
    )!;

    // The container grew well past the button's original rows...
    const originalBelow = (dsl.children as WidgetNode[]).find(
      (c) => c.widgetName === "Below",
    )!;

    expect(container.bottomRow).toBeGreaterThan(originalBelow.topRow);
    // ...and the button was pushed below the grown container instead of being overlapped.
    expect(below.topRow).toBeGreaterThanOrEqual(container.bottomRow);
    expect(notes.join(" ")).toContain('"Below"');

    // The exact invariant the commitLayout gate enforces: no overlapping sibling pairs were introduced.
    expect(overlapDelta(dsl, edited).introduced).toEqual([]);
    expect(overlappingPairs(edited.children as WidgetNode[])).toEqual([]);
  });

  it("pushes existing widgets down when an `after` placement inserts into the middle of the page", () => {
    const dsl = baseDsl(); // Email (rows 0..7) then Details below it
    const { dsl: edited, notes } = applyEdit(
      dsl,
      {
        add: [{ type: "input", label: "Phone", placement: { after: "Email" } }],
      },
      ids(),
    );
    const children = edited.children as WidgetNode[];
    const added = children.find((c) => c.widgetName === "Input")!;
    const details = children.find((c) => c.widgetName === "Details")!;

    // The new input landed right below Email — where Details used to be — and Details moved down.
    expect(added.topRow).toBeGreaterThanOrEqual(
      children.find((c) => c.widgetName === "Email")!.bottomRow,
    );
    expect(details.topRow).toBeGreaterThanOrEqual(added.bottomRow);
    expect(notes.join(" ")).toContain('"Details"');
    expect(overlapDelta(dsl, edited).introduced).toEqual([]);
    expect(overlappingPairs(children)).toEqual([]);
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

  it("rejects a placement that sets both after and inside", () => {
    const result = editSpecSchema.safeParse({
      add: [
        { type: "input", label: "X", placement: { after: "Y", inside: "Z" } },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("accepts a placement that sets only inside", () => {
    const result = editSpecSchema.safeParse({
      add: [{ type: "input", label: "X", placement: { inside: "Z" } }],
    });

    expect(result.success).toBe(true);
  });
});

describe("security — agents never author raw expressions", () => {
  const rawStrings = [
    "{{ malicious() }}",
    "trailing }} brace",
    "template ${injection}",
    "backtick `literal`",
  ];

  it.each(rawStrings)(
    "rejects binding/template syntax in text: %s",
    (value) => {
      const result = appSpecSchema.safeParse({
        name: "App",
        pages: [{ name: "P", widgets: [{ type: "text", text: value }] }],
      });

      expect(result.success).toBe(false);
    },
  );

  it("rejects binding syntax in a button label and an image url", () => {
    expect(
      appSpecSchema.safeParse({
        name: "App",
        pages: [{ name: "P", widgets: [{ type: "button", text: "{{x}}" }] }],
      }).success,
    ).toBe(false);
    expect(
      appSpecSchema.safeParse({
        name: "App",
        pages: [{ name: "P", widgets: [{ type: "image", image: "{{x}}" }] }],
      }).success,
    ).toBe(false);
  });

  it("no longer accepts table data as a free string (must be literal rows)", () => {
    const asString = appSpecSchema.safeParse({
      name: "App",
      pages: [{ name: "P", widgets: [{ type: "table", data: "{{q.data}}" }] }],
    });
    const asRows = appSpecSchema.safeParse({
      name: "App",
      pages: [{ name: "P", widgets: [{ type: "table", data: [{ id: 1 }] }] }],
    });

    expect(asString.success).toBe(false);
    expect(asRows.success).toBe(true);
  });

  it("rejects binding syntax hidden inside a literal table cell", () => {
    const result = appSpecSchema.safeParse({
      name: "App",
      pages: [
        {
          name: "P",
          widgets: [{ type: "table", data: [{ note: "{{ steal() }}" }] }],
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects a malicious table COLUMN KEY (not just the value)", () => {
    // Column keys are embedded into a generated {{ }} binding on the client, so a hostile key must be rejected.
    const result = appSpecSchema.safeParse({
      name: "App",
      pages: [
        {
          name: "P",
          widgets: [{ type: "table", data: [{ "}} {{evil()}} {{": 1 }] }],
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects binding/template syntax in the application name", () => {
    expect(
      appSpecSchema.safeParse({
        name: "App {{evil()}}",
        pages: [{ name: "P", widgets: [{ type: "text", text: "hi" }] }],
      }).success,
    ).toBe(false);
  });

  it("does not register static table data as a dynamic binding", () => {
    const artifact = compileApp(
      {
        name: "App",
        pages: [
          {
            name: "Home",
            widgets: [{ type: "table", name: "T", data: [{ id: 1 }] }],
          },
        ],
      },
      ids(),
    );
    const table = (rootOf(artifact).children as WidgetNode[])[0];

    expect(table.dynamicBindingPathList).toEqual([]);
    expect(table.tableData).toBe(JSON.stringify([{ id: 1 }]));
  });
});
