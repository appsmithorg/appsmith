import {
  applyEvent,
  compileEventBinding,
  eventReferences,
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
    expect(compileEventBinding({ showAlert: "Saved!", style: "success" })).toBe(
      "{{ showAlert('Saved!', 'success') }}",
    );
    // Alert style defaults to info.
    expect(compileEventBinding({ showAlert: "Heads up" })).toBe(
      "{{ showAlert('Heads up', 'info') }}",
    );
    // Reset a single widget, and several at once (a Clear button).
    expect(compileEventBinding({ reset: "ZipInput" })).toBe(
      "{{ resetWidget('ZipInput', true) }}",
    );
    expect(compileEventBinding({ reset: ["ZipInput", "Results"] })).toBe(
      "{{ resetWidget('ZipInput', true); resetWidget('Results', true) }}",
    );
  });

  it("validates and references every widget in a reset action", () => {
    expect(
      wireEventSpecSchema.safeParse({
        widget: "ClearButton",
        event: "onClick",
        action: { reset: ["ZipInput", "Results"] },
      }).success,
    ).toBe(true);
    // Injection in a reset target is rejected — both the array form and the single-string form.
    expect(
      wireEventSpecSchema.safeParse({
        widget: "ClearButton",
        event: "onClick",
        action: { reset: ["ZipInput'); evil("] },
      }).success,
    ).toBe(false);
    expect(
      wireEventSpecSchema.safeParse({
        widget: "ClearButton",
        event: "onClick",
        action: { reset: "ZipInput'); evil(" },
      }).success,
    ).toBe(false);
    expect(eventReferences({ reset: ["ZipInput", "Results"] })).toEqual([
      { kind: "widget", name: "ZipInput" },
      { kind: "widget", name: "Results" },
    ]);
  });

  it("compiles the canonical submit -> refresh -> close -> alert chain", () => {
    expect(
      compileEventBinding({
        run: "insertUser",
        onSuccess: [
          { run: "getUsers" },
          { closeModal: "AddUserModal" },
          { showAlert: "Saved", style: "success" },
        ],
        onError: [{ showAlert: "Save failed", style: "error" }],
      }),
    ).toBe(
      "{{ insertUser.run().then(() => { getUsers.run(); closeModal('AddUserModal'); showAlert('Saved', 'success'); }).catch(() => { showAlert('Save failed', 'error'); }) }}",
    );
  });

  it("compiles reset as an onSuccess follow-up of a run chain", () => {
    expect(
      compileEventBinding({
        run: "deleteRow",
        onSuccess: [{ run: "getRows" }, { reset: ["ZipInput", "Results"] }],
      }),
    ).toBe(
      "{{ deleteRow.run().then(() => { getRows.run(); resetWidget('ZipInput', true); resetWidget('Results', true); }) }}",
    );
    // And it round-trips through eventReferences (primary query + reset widgets).
    expect(
      eventReferences({
        run: "deleteRow",
        onSuccess: [{ reset: "ZipInput" }],
      }),
    ).toEqual([
      { kind: "query", name: "deleteRow" },
      { kind: "widget", name: "ZipInput" },
    ]);
  });

  it("compiles onSuccess without onError (and vice versa)", () => {
    expect(
      compileEventBinding({ run: "save", onSuccess: [{ run: "reload" }] }),
    ).toBe("{{ save.run().then(() => { reload.run(); }) }}");
    expect(
      compileEventBinding({
        run: "save",
        onError: [{ showAlert: "Failed", style: "error" }],
      }),
    ).toBe("{{ save.run().catch(() => { showAlert('Failed', 'error'); }) }}");
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
    // Alert messages exclude quotes/backticks/braces — nothing can escape the single-quoted argument.
    { widget: "Btn", event: "onClick", action: { showAlert: "it's done" } },
    { widget: "Btn", event: "onClick", action: { showAlert: "x'); evil(" } },
    { widget: "Btn", event: "onClick", action: { showAlert: "{{evil}}" } },
    // Follow-ups are validated with the same closed vocabulary and cannot nest further chains.
    {
      widget: "Btn",
      event: "onClick",
      action: { run: "q", onSuccess: [{ run: "a; DROP" }] },
    },
    {
      widget: "Btn",
      event: "onClick",
      action: { run: "q", onSuccess: [{ run: "a", onSuccess: [] }] },
    },
    {
      widget: "Btn",
      event: "onClick",
      action: { run: "q", onError: [{ showAlert: "bad`tick" }] },
    },
    // Chains only hang off run — a navigate cannot have callbacks.
    {
      widget: "Btn",
      event: "onClick",
      action: { navigate: "P", onSuccess: [{ run: "q" }] },
    },
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

  it("accepts a chained run with onSuccess/onError follow-ups", () => {
    expect(
      wireEventSpecSchema.safeParse({
        widget: "SaveButton",
        event: "onClick",
        action: {
          run: "insertUser",
          onSuccess: [
            { run: "getUsers" },
            { closeModal: "AddUserModal" },
            { showAlert: "Saved", style: "success" },
          ],
          onError: [{ showAlert: "Save failed", style: "error" }],
        },
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

describe("eventReferences / widgetExists", () => {
  it("returns the referenced entity for validation", () => {
    expect(eventReferences({ run: "q" })).toEqual([
      { kind: "query", name: "q" },
    ]);
    expect(eventReferences({ navigate: "Home" })).toEqual([
      { kind: "page", name: "Home" },
    ]);
    expect(eventReferences({ showModal: "M" })).toEqual([
      { kind: "widget", name: "M" },
    ]);
    // showAlert references nothing.
    expect(eventReferences({ showAlert: "Done" })).toEqual([]);
  });

  it("collects every reference across a chain (primary + follow-ups)", () => {
    expect(
      eventReferences({
        run: "insertUser",
        onSuccess: [
          { run: "getUsers" },
          { closeModal: "AddUserModal" },
          { showAlert: "Saved" },
        ],
        onError: [{ navigate: "Errors" }],
      }),
    ).toEqual([
      { kind: "query", name: "insertUser" },
      { kind: "query", name: "getUsers" },
      { kind: "widget", name: "AddUserModal" },
      { kind: "page", name: "Errors" },
    ]);
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
