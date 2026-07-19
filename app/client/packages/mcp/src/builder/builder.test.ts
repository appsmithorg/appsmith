import { applyEdit, compileApp } from "./compile.js";
import { sequentialIdGenerator, type WidgetNode } from "./layout.js";
import { overlapDelta, overlappingPairs } from "./occupancy.js";
import {
  appSpecSchema,
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
