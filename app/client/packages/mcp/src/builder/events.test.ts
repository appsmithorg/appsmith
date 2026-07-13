import {
  applyEvent,
  compileEventBinding,
  eventReference,
  widgetExists,
  wireEventSpecSchema,
} from "./events.js";
import type { WidgetNode } from "./layout.js";

function page(children: WidgetNode[]): WidgetNode {
  return {
    widgetId: "0",
    widgetName: "MainContainer",
    type: "CANVAS_WIDGET",
    topRow: 0,
    bottomRow: 380,
    leftColumn: 0,
    rightColumn: 640,
    children,
  };
}

function widget(
  overrides: Partial<WidgetNode> & { widgetId: string },
): WidgetNode {
  return {
    widgetName: overrides.widgetId,
    type: "BUTTON_WIDGET",
    topRow: 0,
    bottomRow: 4,
    leftColumn: 0,
    rightColumn: 16,
    ...overrides,
  };
}

describe("compileEventBinding — closed vocabulary", () => {
  it("emits the correct binding for each action kind", () => {
    expect(compileEventBinding({ run: "insertRow" })).toBe(
      "{{ insertRow.run() }}",
    );
    expect(compileEventBinding({ navigate: "Details Page" })).toBe(
      "{{ navigateTo('Details Page', {}, 'SAME_WINDOW') }}",
    );
    expect(compileEventBinding({ showModal: "EditModal" })).toBe(
      "{{ showModal('EditModal') }}",
    );
    expect(compileEventBinding({ closeModal: "EditModal" })).toBe(
      "{{ closeModal('EditModal') }}",
    );
  });
});

describe("wireEventSpecSchema — rejects anything unsafe", () => {
  const bad: unknown[] = [
    { widget: "Btn", event: "onClick", action: { run: "a; DROP" } },
    { widget: "Btn", event: "onClick", action: { run: "{{evil}}" } },
    {
      widget: "Btn",
      event: "onClick",
      action: { navigate: "Page');evil()//" },
    },
    { widget: "Btn", event: "onClick", action: { showModal: "a'b" } },
    { widget: "Btn", event: "onBogus", action: { run: "q" } },
    { widget: "Btn", event: "onClick", action: { run: "q", navigate: "P" } },
    { widget: "Btn", event: "onClick", action: {} },
  ];

  it.each(bad.map((b, i) => [i, b] as const))("rejects case %#", (_i, spec) => {
    expect(wireEventSpecSchema.safeParse(spec).success).toBe(false);
  });

  it("accepts a valid spec", () => {
    expect(
      wireEventSpecSchema.safeParse({
        widget: "SaveButton",
        event: "onClick",
        action: { run: "insertRow" },
      }).success,
    ).toBe(true);
  });
});

describe("applyEvent", () => {
  it("sets the trigger binding and registers the trigger path without mutating input", () => {
    const dsl = page([widget({ widgetId: "Save", widgetName: "Save" })]);
    const { binding, dsl: next } = applyEvent(dsl, {
      widget: "Save",
      event: "onClick",
      action: { run: "insertRow" },
    });
    const button = (next.children as WidgetNode[])[0];

    expect(button.onClick).toBe("{{ insertRow.run() }}");
    expect(button.dynamicTriggerPathList).toEqual([{ key: "onClick" }]);
    expect(binding).toBe("{{ insertRow.run() }}");
    // Input DSL is untouched.
    expect((dsl.children as WidgetNode[])[0].onClick).toBeUndefined();
  });

  it("does not duplicate an already-registered trigger path", () => {
    const dsl = page([
      widget({
        widgetId: "Save",
        widgetName: "Save",
        dynamicTriggerPathList: [{ key: "onClick" }],
      }),
    ]);
    const { dsl: next } = applyEvent(dsl, {
      widget: "Save",
      event: "onClick",
      action: { run: "q" },
    });

    expect((next.children as WidgetNode[])[0].dynamicTriggerPathList).toEqual([
      { key: "onClick" },
    ]);
  });

  it("rejects an unknown widget", () => {
    expect(() =>
      applyEvent(page([]), {
        widget: "Missing",
        event: "onClick",
        action: { run: "q" },
      }),
    ).toThrow(/was not found/);
  });

  it("rejects an event that is invalid for the widget type", () => {
    const dsl = page([
      widget({ widgetId: "T", widgetName: "T", type: "TABLE_WIDGET_V2" }),
    ]);

    expect(() =>
      applyEvent(dsl, { widget: "T", event: "onClick", action: { run: "q" } }),
    ).toThrow(/not supported/);
  });

  it("supports table selection, modal close, and tab change events", () => {
    const dsl = page([
      widget({ widgetId: "T", widgetName: "T", type: "TABLE_WIDGET_V2" }),
      widget({ widgetId: "M", widgetName: "M", type: "MODAL_WIDGET" }),
      widget({ widgetId: "Tabs", widgetName: "Tabs", type: "TABS_WIDGET" }),
    ]);

    expect(
      (
        applyEvent(dsl, {
          widget: "T",
          event: "onRowSelected",
          action: { run: "loadRow" },
        }).dsl.children as WidgetNode[]
      )[0].onRowSelected,
    ).toBe("{{ loadRow.run() }}");
    expect(
      (
        applyEvent(dsl, {
          widget: "M",
          event: "onClose",
          action: { run: "cleanup" },
        }).dsl.children as WidgetNode[]
      )[1].onClose,
    ).toBe("{{ cleanup.run() }}");
  });
});

describe("eventReference / widgetExists", () => {
  it("returns the referenced entity for validation", () => {
    expect(eventReference({ run: "q" })).toEqual({ kind: "query", name: "q" });
    expect(eventReference({ navigate: "Home" })).toEqual({
      kind: "page",
      name: "Home",
    });
    expect(eventReference({ showModal: "M" })).toEqual({
      kind: "widget",
      name: "M",
    });
  });

  it("finds nested widgets by name", () => {
    const dsl = page([
      {
        ...widget({ widgetId: "C", widgetName: "C", type: "CANVAS_WIDGET" }),
        children: [
          widget({
            widgetId: "M",
            widgetName: "EditModal",
            type: "MODAL_WIDGET",
          }),
        ],
      },
    ]);

    expect(widgetExists(dsl, "EditModal")).toBe(true);
    expect(widgetExists(dsl, "Nope")).toBe(false);
  });
});
