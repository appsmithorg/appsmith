import { z } from "zod";
import type { WidgetNode } from "./layout.js";
import { applyWidgetPatch, widgetPatchSchema } from "./editPatch.js";
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
    expect(changes).toEqual([
      {
        kind: "move",
        widgetName: "Greeting",
        previousParentWidgetName: "MainContainer",
        parentWidgetName: "Details",
        previousPosition: { topRow: 0, leftColumn: 0 },
        position: { topRow: 8, leftColumn: 4 },
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
