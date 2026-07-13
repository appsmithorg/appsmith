import { z } from "zod";
import type { WidgetNode } from "./layout.js";
import { applyWidgetPatch, widgetPatchSchema } from "./editPatch.js";

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
