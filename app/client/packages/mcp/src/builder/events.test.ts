import {
  applyEvent,
  compileEventBinding,
  eventActionKinds,
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

describe("M5 store accumulation — appendToStore / clearStoreKey / statement lists", () => {
  function accepts(action: unknown): boolean {
    return wireEventSpecSchema.safeParse({
      widget: "Btn",
      event: "onClick",
      action,
    }).success;
  }

  it("compiles a plain appendToStore ([].concat flattening, persist=false)", () => {
    expect(
      compileEventBinding({
        appendToStore: { key: "zipResults", query: "LookupZip" },
      }),
    ).toBe(
      "{{ storeValue('zipResults', [].concat(appsmith.store.zipResults ?? [], LookupZip.data ?? []), false) }}",
    );
  });

  it("compiles appendToStore with a dotted response field", () => {
    expect(
      compileEventBinding({
        appendToStore: { key: "rows", query: "LookupZip", field: "places" },
      }),
    ).toBe(
      "{{ storeValue('rows', [].concat(appsmith.store.rows ?? [], LookupZip.data?.places ?? []), false) }}",
    );
  });

  it("compiles a fields projection (space-keyed + numeric-index paths) into ONE bracket-access row", () => {
    expect(
      compileEventBinding({
        appendToStore: {
          key: "zipResults",
          query: "LookupZip",
          fields: [
            { as: "zip", path: ["post code"] },
            { as: "city", path: ["places", 0, "place name"] },
            { as: "state", path: ["places", 0, "state"] },
          ],
        },
      }),
    ).toBe(
      "{{ storeValue('zipResults', [].concat(appsmith.store.zipResults ?? [], " +
        '{ zip: LookupZip.data?.["post code"], city: LookupZip.data?.["places"]?.[0]?.["place name"], state: LookupZip.data?.["places"]?.[0]?.["state"] }' +
        " ?? []), false) }}",
    );
  });

  it("JSON.stringify-escapes hostile path elements (quotes/backslashes cannot escape the literal)", () => {
    expect(
      compileEventBinding({
        appendToStore: {
          key: "k",
          query: "q",
          fields: [{ as: "a", path: ['x"] , evil ["y'] }],
        },
      }),
    ).toBe(
      "{{ storeValue('k', [].concat(appsmith.store.k ?? [], " +
        '{ a: q.data?.["x\\"] , evil [\\"y"] }' +
        " ?? []), false) }}",
    );
  });

  it("compiles clearStoreKey (one key emptied, never the whole store)", () => {
    expect(compileEventBinding({ clearStoreKey: { key: "zipResults" } })).toBe(
      "{{ storeValue('zipResults', [], false) }}",
    );
  });

  it("compiles a statement-list primary joined with ';' (the Clear button)", () => {
    expect(
      compileEventBinding([
        { clearStoreKey: { key: "zipResults" } },
        { reset: "ZipInput" },
      ]),
    ).toBe(
      "{{ storeValue('zipResults', [], false); resetWidget('ZipInput', true) }}",
    );
  });

  it("compiles a statement list whose run keeps its onSuccess chain", () => {
    expect(
      compileEventBinding([
        { showAlert: "Looking up" },
        {
          run: "LookupZip",
          onSuccess: [
            { appendToStore: { key: "zipResults", query: "LookupZip" } },
          ],
        },
      ]),
    ).toBe(
      "{{ showAlert('Looking up', 'info'); LookupZip.run().then(() => { storeValue('zipResults', [].concat(appsmith.store.zipResults ?? [], LookupZip.data ?? []), false); }) }}",
    );
  });

  it("accepts the new verbs as primary and as onSuccess/onError follow-ups", () => {
    expect(
      accepts({ appendToStore: { key: "zipResults", query: "LookupZip" } }),
    ).toBe(true);
    expect(accepts({ clearStoreKey: { key: "zipResults" } })).toBe(true);
    expect(
      accepts({
        run: "LookupZip",
        onSuccess: [
          {
            appendToStore: {
              key: "zipResults",
              query: "LookupZip",
              fields: [{ as: "zip", path: ["post code"] }],
            },
          },
        ],
        onError: [{ clearStoreKey: { key: "zipResults" } }],
      }),
    ).toBe(true);
  });

  it("rejects prototype-polluting, digit-leading, and malformed store keys", () => {
    for (const badKey of [
      "__proto__",
      "constructor",
      "prototype",
      "hasOwnProperty",
      "1zipResults",
      "zip-results",
      "zip results",
      "a".repeat(65),
      "",
    ]) {
      expect(
        accepts({ appendToStore: { key: badKey, query: "LookupZip" } }),
      ).toBe(false);
      expect(accepts({ clearStoreKey: { key: badKey } })).toBe(false);
      // The same denylist guards `as` — an unquoted object-literal key where __proto__ would pollute the row.
      expect(
        accepts({
          appendToStore: {
            key: "ok",
            query: "q",
            fields: [{ as: badKey, path: ["x"] }],
          },
        }),
      ).toBe(false);
    }
  });

  it("rejects field+fields together, oversized projections, and binding syntax in a path element", () => {
    expect(
      accepts({
        appendToStore: {
          key: "k",
          query: "q",
          field: "places",
          fields: [{ as: "a", path: ["x"] }],
        },
      }),
    ).toBe(false);
    // > 20 fields.
    expect(
      accepts({
        appendToStore: {
          key: "k",
          query: "q",
          fields: Array.from({ length: 21 }, (_, i) => ({
            as: `f${i}`,
            path: ["x"],
          })),
        },
      }),
    ).toBe(false);
    // > 5 path elements.
    expect(
      accepts({
        appendToStore: {
          key: "k",
          query: "q",
          fields: [{ as: "a", path: ["a", "b", "c", "d", "e", "f"] }],
        },
      }),
    ).toBe(false);

    // A path element that could terminate the outer {{ }} or open an expression is rejected outright, even though
    // JSON.stringify would escape quotes — the mustache splitter is not JS-aware.
    for (const badElement of ["a}}b", "a{{b", "a${b}", "a`b"]) {
      expect(
        accepts({
          appendToStore: {
            key: "k",
            query: "q",
            fields: [{ as: "a", path: [badElement] }],
          },
        }),
      ).toBe(false);
    }

    // Negative / fractional array indexes are rejected.
    expect(
      accepts({
        appendToStore: {
          key: "k",
          query: "q",
          fields: [{ as: "a", path: [-1] }],
        },
      }),
    ).toBe(false);
    expect(
      accepts({
        appendToStore: {
          key: "k",
          query: "q",
          fields: [{ as: "a", path: [1.5] }],
        },
      }),
    ).toBe(false);
  });

  it("bounds statement lists to 2–5 entries with at most one run", () => {
    // A single-entry list is not a list; use the plain form.
    expect(accepts([{ clearStoreKey: { key: "k" } }])).toBe(false);
    expect(
      accepts([{ clearStoreKey: { key: "k" } }, { reset: "ZipInput" }]),
    ).toBe(true);
    // Two runs would emit two independent promise chains — rejected.
    expect(accepts([{ run: "a" }, { run: "b" }])).toBe(false);
    // > 5 statements.
    expect(
      accepts(
        Array.from({ length: 6 }, () => ({ clearStoreKey: { key: "k" } })),
      ),
    ).toBe(false);
  });

  it("rejects a sibling appendToStore of a query the same list runs (stale-read footgun)", () => {
    // run() is async: the sibling append would execute before it resolves and read the PREVIOUS response.
    expect(
      accepts([
        { run: "LookupZip" },
        { appendToStore: { key: "zipResults", query: "LookupZip" } },
      ]),
    ).toBe(false);
    // The correct shape — append inside the run's onSuccess — stays valid.
    expect(
      accepts([
        {
          run: "LookupZip",
          onSuccess: [
            { appendToStore: { key: "zipResults", query: "LookupZip" } },
          ],
        },
        { reset: "ZipInput" },
      ]),
    ).toBe(true);
    // Appending a DIFFERENT query's (existing) response alongside a run is allowed.
    expect(
      accepts([
        { run: "LookupZip" },
        { appendToStore: { key: "zipResults", query: "Other" } },
      ]),
    ).toBe(true);
  });

  it("routes appendToStore's query through eventReferences (dangling guard) across lists and chains", () => {
    expect(
      eventReferences({
        appendToStore: { key: "zipResults", query: "LookupZip" },
      }),
    ).toEqual([{ kind: "query", name: "LookupZip" }]);
    // clearStoreKey references nothing.
    expect(eventReferences({ clearStoreKey: { key: "zipResults" } })).toEqual(
      [],
    );
    expect(
      eventReferences([
        { clearStoreKey: { key: "zipResults" } },
        { reset: "ZipInput" },
        {
          run: "LookupZip",
          onSuccess: [{ appendToStore: { key: "zipResults", query: "Other" } }],
        },
      ]),
    ).toEqual([
      { kind: "widget", name: "ZipInput" },
      { kind: "query", name: "LookupZip" },
      { kind: "query", name: "Other" },
    ]);
  });

  it("reports deduped statement verb kinds for telemetry", () => {
    expect(
      eventActionKinds({
        run: "LookupZip",
        onSuccess: [
          { appendToStore: { key: "zipResults", query: "LookupZip" } },
        ],
      }),
    ).toEqual(["run", "appendToStore"]);
    expect(
      eventActionKinds([
        { clearStoreKey: { key: "zipResults" } },
        { reset: "ZipInput" },
        { reset: "Other" },
      ]),
    ).toEqual(["clearStoreKey", "reset"]);
    expect(eventActionKinds({ showAlert: "Done" })).toEqual(["showAlert"]);
  });

  it("applyEvent writes a statement-list binding and registers the trigger path", () => {
    const dsl = page([widget({ widgetId: "Clear", widgetName: "Clear" })]);
    const { binding, dsl: next } = applyEvent(dsl, {
      widget: "Clear",
      event: "onClick",
      action: [{ clearStoreKey: { key: "zipResults" } }, { reset: "ZipInput" }],
    });

    expect(binding).toBe(
      "{{ storeValue('zipResults', [], false); resetWidget('ZipInput', true) }}",
    );
    expect((next.children as WidgetNode[])[0].dynamicTriggerPathList).toEqual([
      { key: "onClick" },
    ]);
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
