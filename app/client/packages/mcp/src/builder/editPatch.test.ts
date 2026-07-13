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
    const { dsl, changes } = applyWidgetPatch(original, {
      operations: [
        {
          kind: "update",
          name: "Greeting",
          props: { text: "Welcome", isVisible: false },
        },
      ],
    });
    const greeting = dsl.children?.[0]!;

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

  it("moves a widget into a container's inner canvas and preserves its size", () => {
    const { dsl, changes } = applyWidgetPatch(page(), {
      operations: [
        {
          kind: "move",
          name: "Greeting",
          parent: "Details",
          position: { topRow: 8, leftColumn: 4 },
        },
      ],
    });
    const container = dsl.children?.[0]!;
    const innerCanvas = container.children?.[0]!;
    const greeting = innerCanvas.children?.[0]!;

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
    const { dsl, changes } = applyWidgetPatch(page(), {
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
          operations: [
            { kind: "update", name: "Greeting", props: { text } },
          ],
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
