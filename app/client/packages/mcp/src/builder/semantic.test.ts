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
