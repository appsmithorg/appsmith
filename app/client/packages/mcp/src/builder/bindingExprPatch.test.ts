import { RECIPES } from "./instructions.js";
import type { WidgetNode } from "./layout.js";
import { applyWidgetPatch, widgetPatchSchema } from "./editPatch.js";
import {
  buildPatchColumn,
  compileInputValidation,
  inputValidationSchema,
} from "./schema.js";
import { projectSemanticPage } from "./semantic.js";

// APP-16381: binding expressions on patch_widgets, built around the license "Extend" modal from the issue.

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
  return node({
    widgetId: "0",
    widgetName: "MainContainer",
    type: "CANVAS_WIDGET",
    children: [
      node({ widgetId: "t", widgetName: "Licenses", type: "TABLE_WIDGET_V2" }),
      node({ widgetId: "r", widgetName: "Kind", type: "RADIO_GROUP_WIDGET" }),
      node({
        widgetId: "d",
        widgetName: "NewEnd",
        type: "DATE_PICKER_WIDGET2",
      }),
      node({
        widgetId: "i",
        widgetName: "Initials",
        type: "INPUT_WIDGET_V2",
      }),
      node({ widgetId: "c", widgetName: "Ack", type: "CHECKBOX_WIDGET" }),
      node({ widgetId: "w", widgetName: "Warning", type: "TEXT_WIDGET" }),
      node({ widgetId: "b", widgetName: "Submit", type: "BUTTON_WIDGET" }),
      node({
        widgetId: "u",
        widgetName: "RequestedBy",
        type: "INPUT_WIDGET_V2",
      }),
    ],
  });
}

function update(
  name: string,
  props: Record<string, unknown>,
  options?: Parameters<typeof applyWidgetPatch>[2],
  dsl: WidgetNode = page(),
) {
  return applyWidgetPatch(
    dsl,
    { operations: [{ kind: "update", name, props }] },
    options,
  );
}

function widget(dsl: WidgetNode, name: string): WidgetNode {
  const found = (dsl.children ?? []).find((w) => w.widgetName === name);

  if (!found) throw new Error(`no ${name}`);

  return found;
}

function boundKeys(w: WidgetNode): string[] {
  return ((w.dynamicBindingPathList ?? []) as { key: string }[]).map(
    (entry) => entry.key,
  );
}

// Runs a compiled `{{ … }}` binding with the named widgets in scope.
function evaluate(binding: unknown, scope: Record<string, unknown>): unknown {
  const body = String(binding)
    .replace(/^\{\{ /, "")
    .replace(/ \}\}$/, "");

  return new Function(...Object.keys(scope), `return ${body};`)(
    ...Object.values(scope),
  );
}

// "New contract is chosen and the new end date is less than a year out."
const underAYear = {
  op: "and",
  args: [
    {
      op: "eq",
      args: [{ widget: "Kind", property: "selectedOptionValue" }, "contract"],
    },
    {
      op: "lt",
      args: [
        { fn: "date", args: [{ widget: "NewEnd", property: "selectedDate" }] },
        { fn: "addYears", args: [{ fn: "now", args: [] }, 1] },
      ],
    },
  ],
};

describe("binding expressions on patch_widgets (APP-16381)", () => {
  it("compiles visibleWhen from an expression and registers the binding", () => {
    const { dsl } = update("Warning", { visibleWhen: { expr: underAYear } });
    const warning = widget(dsl, "Warning");

    expect(boundKeys(warning)).toContain("isVisible");

    const soon = new Date(Date.now() + 30 * 86_400_000).toISOString();
    const later = new Date(Date.now() + 400 * 86_400_000).toISOString();

    expect(
      evaluate(warning.isVisible, {
        Kind: { selectedOptionValue: "contract" },
        NewEnd: { selectedDate: soon },
      }),
    ).toBe(true);
    expect(
      evaluate(warning.isVisible, {
        Kind: { selectedOptionValue: "contract" },
        NewEnd: { selectedDate: later },
      }),
    ).toBe(false);
    expect(
      evaluate(warning.isVisible, {
        Kind: { selectedOptionValue: "temporary" },
        NewEnd: { selectedDate: soon },
      }),
    ).toBe(false);
  });

  it("gates on a radio with the named { control, equals } form", () => {
    const { dsl } = update("NewEnd", {
      visibleWhen: { control: "Kind", equals: "contract" },
    });

    expect(widget(dsl, "NewEnd").isVisible).toBe(
      "{{ Kind.selectedOptionValue === 'contract' }}",
    );
  });

  it("requires initials only in the under-a-year case", () => {
    const { dsl } = update("Initials", { requiredWhen: { expr: underAYear } });
    const initials = widget(dsl, "Initials");

    expect(initials.isRequired).toMatch(/^\{\{ Boolean\(/);
    expect(boundKeys(initials)).toContain("isRequired");
    expect(() =>
      update("Warning", { requiredWhen: { expr: underAYear } }),
    ).toThrow(/'requiredWhen' can only be set on/);
    expect(() =>
      update("Initials", {
        requiredWhen: { expr: underAYear },
        isRequired: true,
      }),
    ).toThrow(/cannot set both 'isRequired' and 'requiredWhen'/);
  });

  it("keeps a requiredWhen binding when validation is added in the same or a later update", () => {
    const same = update("Initials", {
      validation: { format: "initials" },
      requiredWhen: { expr: underAYear },
    }).dsl;

    expect(widget(same, "Initials").isRequired).toMatch(/^\{\{ Boolean\(/);
    expect(widget(same, "Initials").regex).toBe("^[A-Za-z]{2,4}$");

    const later = update(
      "Initials",
      { validation: { format: "alpha" } },
      undefined,
      same,
    ).dsl;

    expect(widget(later, "Initials").isRequired).toMatch(/^\{\{ Boolean\(/);
    expect(boundKeys(widget(later, "Initials"))).toContain("isRequired");
  });

  it("disables submit until initials and the acknowledgement are both valid", () => {
    const { dsl } = update("Submit", {
      disableWhenInvalid: ["Initials", "Ack"],
    });

    expect(widget(dsl, "Submit").isDisabled).toBe(
      "{{ !Initials.isValid || !Ack.isValid }}",
    );
    expect(
      update("Submit", { disableWhenInvalid: ["Initials"] }).dsl.children?.find(
        (w) => w.widgetName === "Submit",
      )?.isDisabled,
    ).toBe("{{ !Initials.isValid }}");
    expect(() => update("Submit", { disableWhenInvalid: ["Warning"] })).toThrow(
      /must be a form control with a validity check/,
    );
  });

  it("compiles disabledWhen, and refuses it next to another isDisabled source", () => {
    const { dsl } = update("Submit", {
      disabledWhen: {
        expr: { op: "not", args: [{ widget: "Ack", property: "isChecked" }] },
      },
    });

    expect(widget(dsl, "Submit").isDisabled).toBe(
      "{{ Boolean((!Ack.isChecked)) }}",
    );
    expect(() =>
      update("Submit", {
        disabledWhen: { expr: true },
        disableWhenInvalid: "Initials",
      }),
    ).toThrow(/cannot set both 'disableWhenInvalid' and 'disabledWhen'/);
    expect(() =>
      update("Submit", { disabledWhen: { expr: true }, isDisabled: false }),
    ).toThrow(/cannot set both 'isDisabled' and 'disabledWhen'/);
  });

  it("caps and defaults the date picker from expressions", () => {
    const today14 = {
      fn: "addDays",
      args: [{ fn: "startOfDay", args: [{ fn: "now", args: [] }] }, 14],
    };
    const { dsl } = update("NewEnd", {
      maxDate: { expr: today14 },
      defaultFrom: {
        expr: {
          if: {
            op: "eq",
            args: [{ widget: "Kind", property: "selectedOptionValue" }, "temp"],
          },
          then: today14,
          else: {
            fn: "addYears",
            args: [{ table: "Licenses", column: "end date" }, 1],
          },
        },
      },
    });
    const picker = widget(dsl, "NewEnd");

    expect(boundKeys(picker)).toEqual(
      expect.arrayContaining(["maxDate", "defaultDate"]),
    );

    const max = evaluate(picker.maxDate, {}) as Date;
    const expected = new Date();

    expected.setHours(0, 0, 0, 0);
    expected.setDate(expected.getDate() + 14);
    expect(max).toEqual(expected);

    expect(
      evaluate(picker.defaultDate, {
        Kind: { selectedOptionValue: "contract" },
        Licenses: { selectedRow: { "end date": "2026-10-31" } },
      }),
    ).toEqual(new Date(2027, 9, 31));
    // No selected row: the default is blank, not an error.
    expect(
      evaluate(picker.defaultDate, {
        Kind: { selectedOptionValue: "contract" },
        Licenses: { selectedRow: {} },
      }),
    ).toBe("");
    // A literal still works.
    expect(
      widget(update("NewEnd", { minDate: "2026-01-01" }).dsl, "NewEnd").minDate,
    ).toBe("2026-01-01");
  });

  it("refuses a date expression on the wrong widget or next to defaultFrom", () => {
    expect(() =>
      update("Initials", { maxDate: { expr: { fn: "now", args: [] } } }),
    ).toThrow(/'maxDate' can only be set on/);
    expect(() =>
      update("NewEnd", {
        defaultDate: { expr: { fn: "now", args: [] } },
        defaultFrom: { expr: { fn: "now", args: [] } },
      }),
    ).toThrow(/cannot set both 'defaultDate' and 'defaultFrom'/);
  });

  it("prefills Requested By with the signed-in user's name", () => {
    const { dsl } = update("RequestedBy", {
      defaultFrom: { expr: { user: "name" } },
    });

    expect(widget(dsl, "RequestedBy").defaultText).toBe(
      "{{ appsmith.user.name }}",
    );
  });

  it("shows a computed date as text, and reads the store", () => {
    const { dsl } = update("Warning", {
      value: {
        expr: {
          fn: "concat",
          args: [
            "Billed through ",
            {
              fn: "isoDate",
              args: [
                {
                  fn: "addYears",
                  args: [{ table: "Licenses", column: "end date" }, 1],
                },
              ],
            },
          ],
        },
      },
    });

    expect(
      evaluate(widget(dsl, "Warning").text, {
        Licenses: { selectedRow: { "end date": "2026-10-31" } },
      }),
    ).toBe("Billed through 2027-10-31");
    expect(
      widget(update("Warning", { source: { store: "note" } }).dsl, "Warning")
        .text,
    ).toBe('{{ appsmith.store.note ?? "" }}');
  });

  it("refuses widgets that are missing, a table leaf on a non-table, and self or two-step cycles", () => {
    expect(() =>
      update("Warning", {
        visibleWhen: { expr: { widget: "Nope", property: "text" } },
      }),
    ).toThrow(/widget "Nope" was not found/);
    expect(() =>
      update("Warning", {
        visibleWhen: { expr: { table: "Kind", column: "x" } },
      }),
    ).toThrow(/"Kind" is not a table widget/);
    expect(() =>
      update("Warning", {
        visibleWhen: { expr: { widget: "Warning", property: "isVisible" } },
      }),
    ).toThrow(/the property it sets/);
    expect(() =>
      update("Initials", {
        requiredWhen: { expr: { widget: "Initials", property: "isValid" } },
      }),
    ).toThrow(/an evaluation cycle/);

    // Warning.text already reads Submit.isDisabled, so Submit.isDisabled may not read Warning.text.
    const dsl = page();

    widget(dsl, "Warning").text = "{{ String(Submit.isDisabled) }}";
    expect(() =>
      update(
        "Submit",
        { disabledWhen: { expr: { widget: "Warning", property: "text" } } },
        undefined,
        dsl,
      ),
    ).toThrow(/which reads "Submit.isDisabled" \(an evaluation cycle\)/);
    // A validWhen reading the input's own text is the normal case and is allowed.
    expect(() =>
      update("Initials", {
        validWhen: {
          expr: {
            op: "gte",
            args: [
              {
                fn: "length",
                args: [{ widget: "Initials", property: "text" }],
              },
              2,
            ],
          },
        },
      }),
    ).not.toThrow();
  });

  it("checks query leaves against the application's queries", () => {
    const props = {
      visibleWhen: {
        expr: { op: "gt", args: [{ query: "GetLicenses", field: "total" }, 0] },
      },
    };

    expect(() => update("Warning", props)).toThrow(/cannot be checked here/);
    expect(() =>
      update("Warning", props, { queryNames: new Set(["Other"]) }),
    ).toThrow(/query "GetLicenses" was not found/);
    expect(() =>
      update("Warning", props, { queryNames: new Set(["GetLicenses"]) }),
    ).not.toThrow();
  });

  it("refuses grammar outside a binding: braces in strings, call, param, then keys", () => {
    const refuse = (expr: unknown, pattern: RegExp) =>
      expect(() => update("Warning", { value: { expr } })).toThrow(pattern);

    refuse({ fn: "concat", args: ["a}", "b"] }, /must not contain \{ or \}/);
    refuse({ call: "save" }, /cannot \{ call \}/);
    refuse({ param: "x" }, /has no \{ param \}/);
    refuse(
      { object: { then: { widget: "Ack", property: "isChecked" } } },
      /"then" is not allowed as an object key/,
    );
    // An object key that only looks like a leaf is data, not a leaf.
    expect(() =>
      update("Warning", { value: { expr: { object: { param: 1 } } } }),
    ).not.toThrow();
  });

  it("refuses a deeply nested expression without overflowing the stack", () => {
    let deep: unknown = 1;

    for (let i = 0; i < 1_000; i += 1) deep = { op: "not", args: [deep] };

    const parsed = widgetPatchSchema.safeParse({
      operations: [
        { kind: "update", name: "Warning", props: { value: { expr: deep } } },
      ],
    });

    expect(parsed.success).toBe(false);
    expect(JSON.stringify(parsed.error?.issues)).toMatch(/nests deeper/);
  });

  it("keeps the emitted text of the named forms unchanged (read_semantic_page reads it back)", () => {
    const visible = update("Warning", {
      visibleWhen: { rowSelected: "Licenses" },
    });
    const disabled = update("Submit", { disableWhenInvalid: "Initials" });
    const fromWidget = update("RequestedBy", {
      defaultFrom: { widget: "Initials", property: "text" },
    });

    expect(widget(visible.dsl, "Warning").isVisible).toBe(
      "{{ Licenses.selectedRowIndex !== -1 }}",
    );
    expect(widget(disabled.dsl, "Submit").isDisabled).toBe(
      "{{ !Initials.isValid }}",
    );
    expect(widget(fromWidget.dsl, "RequestedBy").defaultText).toBe(
      "{{ Initials.text }}",
    );
  });
});

describe("input length rules (APP-16381)", () => {
  it("compiles a length rule to a bounded regex with a message", () => {
    expect(compileInputValidation({ minLength: 2, maxLength: 4 })).toEqual({
      regex: "^[\\s\\S]{2,4}$",
      errorMessage: "Please enter 2 to 4 characters",
    });
    expect(compileInputValidation({ minLength: 3 })).toEqual({
      regex: "^[\\s\\S]{3,}$",
      errorMessage: "Please enter at least 3 characters",
    });
    expect(compileInputValidation({ maxLength: 10 }).regex).toBe(
      "^[\\s\\S]{0,10}$",
    );

    const regex = new RegExp(
      compileInputValidation({ minLength: 2, maxLength: 4 }).regex,
    );

    expect(regex.test("ab")).toBe(true);
    expect(regex.test("abcde")).toBe(false);
  });

  it("refuses a rule with no format and no length, both together, min over max, or too long", () => {
    expect(inputValidationSchema.safeParse({}).success).toBe(false);
    expect(
      inputValidationSchema.safeParse({ format: "alpha", minLength: 2 })
        .success,
    ).toBe(false);
    expect(
      inputValidationSchema.safeParse({ minLength: 5, maxLength: 2 }).success,
    ).toBe(false);
    expect(inputValidationSchema.safeParse({ maxLength: 10_001 }).success).toBe(
      false,
    );
  });
});

describe("table columns on patch_widgets (APP-16381)", () => {
  function tablePage(): WidgetNode {
    const dsl = page();
    const table = widget(dsl, "Licenses");

    table.primaryColumns = {
      name: { id: "name", index: 0, columnType: "text", label: "Name" },
      usage: {
        id: "usage",
        index: 1,
        columnType: "button",
        buttonLabel: "Usage",
      },
    };
    table.columnOrder = ["name", "usage"];

    return dsl;
  }

  const run = (operation: Record<string, unknown>, dsl = tablePage()) =>
    applyWidgetPatch(dsl, { operations: [{ name: "Licenses", ...operation }] });

  type Columns = Record<string, Record<string, unknown>>;

  it("adds a derived button column after the existing ones", () => {
    const { changes, dsl } = run({
      kind: "addColumn",
      column: { key: "extend", type: "button", buttonLabel: "Extend" },
    });
    const table = widget(dsl, "Licenses");
    const extend = (table.primaryColumns as Columns).extend;

    expect(extend).toMatchObject({
      id: "extend",
      columnType: "button",
      buttonLabel: "Extend",
      isDerived: true,
      computedValue: "",
      index: 2,
    });
    expect(table.columnOrder).toEqual(["name", "usage", "extend"]);
    // A button column has no binding of its own.
    expect(boundKeys(table)).not.toContain(
      "primaryColumns.extend.computedValue",
    );
    expect(changes).toEqual([
      { kind: "addColumn", widgetName: "Licenses", column: "extend" },
    ]);
  });

  it("adds a data column that reads its key from each row", () => {
    const { dsl } = run({
      kind: "addColumn",
      column: { key: "end date", type: "date", label: "Ends" },
    });
    const table = widget(dsl, "Licenses");
    const column = (table.primaryColumns as Columns).end_date;

    expect(column).toMatchObject({
      isDerived: false,
      columnType: "date",
      label: "Ends",
    });
    expect(String(column.computedValue)).toContain('currentRow["end date"]');
    expect(boundKeys(table)).toContain("primaryColumns.end_date.computedValue");
  });

  it("refuses an existing id, a prototype name, and a non-table", () => {
    expect(() => run({ kind: "addColumn", column: { key: "name" } })).toThrow(
      /already exists/,
    );
    expect(() =>
      run({ kind: "addColumn", column: { key: "constructor" } }),
    ).toThrow(/Object.prototype/);
    expect(() =>
      applyWidgetPatch(page(), {
        operations: [{ kind: "addColumn", name: "Kind", column: { key: "x" } }],
      }),
    ).toThrow(/columns can only be changed on a TABLE_WIDGET_V2/);
  });

  it("updates a column's label, visibility and button text, by column type", () => {
    const { dsl } = run({
      kind: "updateColumn",
      column: "usage",
      props: { buttonLabel: "View usage", hidden: true },
    });
    const usage = (widget(dsl, "Licenses").primaryColumns as Columns).usage;

    expect(usage).toMatchObject({
      buttonLabel: "View usage",
      isVisible: false,
      isCellVisible: false,
    });
    expect(() =>
      run({
        kind: "updateColumn",
        column: "name",
        props: { buttonLabel: "x" },
      }),
    ).toThrow(/only be set on a button column/);
    expect(() =>
      run({ kind: "updateColumn", column: "nope", props: { label: "x" } }),
    ).toThrow(/column "nope" was not found/);
    expect(
      widgetPatchSchema.safeParse({
        operations: [
          {
            kind: "updateColumn",
            name: "Licenses",
            column: "__proto__",
            props: { label: "x" },
          },
        ],
      }).success,
    ).toBe(false);
    expect(
      widgetPatchSchema.safeParse({
        operations: [
          {
            kind: "addColumn",
            name: "Licenses",
            column: { key: "x", type: "button", buttonLabel: "{{ evil }}" },
          },
        ],
      }).success,
    ).toBe(false);
  });
});

describe("read-back of the list form of disableWhenInvalid (APP-16381)", () => {
  it("reports every control the list names", () => {
    const { dsl } = update("Submit", {
      disableWhenInvalid: ["Initials", "Ack"],
    });
    const submit = projectSemanticPage(dsl).widgets.find(
      (w) => w.name === "Submit",
    );

    expect(submit?.bindings?.isDisabled).toEqual({
      disableWhenInvalid: ["Initials", "Ack"],
    });
    // An expression binding is summarised by name, not shown as text.
    const visible = update("Warning", { visibleWhen: { expr: underAYear } });
    const warning = projectSemanticPage(visible.dsl).widgets.find(
      (w) => w.name === "Warning",
    );

    expect(warning?.boundProps).toEqual({
      isVisible: { widgets: ["Kind", "NewEnd"] },
    });
  });
});

describe("buildPatchColumn (APP-16381)", () => {
  it("refuses a prototype name even when called without the patch schema", () => {
    for (const key of ["__proto__", "constructor"]) {
      expect(() =>
        buildPatchColumn({ key }, "Licenses", { ids: new Set(), nextIndex: 0 }),
      ).toThrow(/Object.prototype/);
    }

    expect(() =>
      buildPatchColumn({ key: "x" }, "Bad Name", {
        ids: new Set(),
        nextIndex: 0,
      }),
    ).toThrow(/not a valid table name/);
  });
});

describe("cycles through a control's isValid (APP-16381 code review)", () => {
  it("refuses requiredWhen reading another control's isValid when that control's required check reads this one's isValid", () => {
    const dsl = page();

    widget(dsl, "Ack").isRequired = "{{ Boolean(Initials.isValid) }}";
    expect(() =>
      update(
        "Initials",
        { requiredWhen: { expr: { widget: "Ack", property: "isValid" } } },
        undefined,
        dsl,
      ),
    ).toThrow(/reads "Initials.isValid" \(an evaluation cycle\)/);
  });

  it("refuses requiredWhen reading a text that reads this control's isValid", () => {
    const dsl = page();

    widget(dsl, "Warning").text = "{{ String(Initials.isValid) }}";
    expect(() =>
      update(
        "Initials",
        { requiredWhen: { expr: { widget: "Warning", property: "text" } } },
        undefined,
        dsl,
      ),
    ).toThrow(/reads "Initials.isValid" \(an evaluation cycle\)/);
  });
});

describe("validWhen owners (APP-16381)", () => {
  it("sets an input's Valid check and refuses validWhen on a widget without one", () => {
    const { dsl } = update("Initials", { validWhen: { expr: true } });

    expect(widget(dsl, "Initials").validation).toBe("{{ Boolean(true) }}");
    expect(() => update("Ack", { validWhen: { expr: true } })).toThrow(
      /'validWhen' can only be set on/,
    );
  });
});

describe("the recipe's one-year boundary (APP-16381)", () => {
  // A fixed today, so the test never runs on a 29 February (setFullYear and addYears round that day differently).
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 9, 31, 15, 30));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("does not warn for a date exactly one year from today, and warns one day earlier", () => {
    const today = { fn: "startOfDay", args: [{ fn: "now", args: [] }] };
    const { dsl } = update("Warning", {
      visibleWhen: {
        expr: {
          op: "lt",
          args: [
            {
              fn: "date",
              args: [{ widget: "NewEnd", property: "selectedDate" }],
            },
            { fn: "addYears", args: [today, 1] },
          ],
        },
      },
    });
    const at = (days: number) => {
      const d = new Date();

      d.setHours(0, 0, 0, 0);
      d.setFullYear(d.getFullYear() + 1);
      d.setDate(d.getDate() + days);

      return evaluate(widget(dsl, "Warning").isVisible, {
        NewEnd: { selectedDate: d.toISOString() },
      });
    };

    expect(at(0)).toBe(false);
    expect(at(-1)).toBe(true);
  });
});

describe("a default may not feed back into itself (CodeRabbit on #42540)", () => {
  it("refuses defaultDate reading its own picker", () => {
    expect(() =>
      update("NewEnd", {
        defaultDate: {
          expr: {
            fn: "addDays",
            args: [{ widget: "NewEnd", property: "selectedDate" }, 1],
          },
        },
      }),
    ).toThrow(/depends on the property this sets \(an evaluation cycle\)/);
    // Any other read of the picker itself is refused too, as for defaultFrom.
    expect(() =>
      update("NewEnd", {
        defaultDate: { expr: { widget: "NewEnd", property: "isVisible" } },
      }),
    ).toThrow(/'defaultDate' cannot reference the widget itself/);
  });

  it("refuses a default that reads a widget whose binding reads the default's own value", () => {
    const dsl = page();

    widget(dsl, "Warning").text = "{{ String(NewEnd.selectedDate) }}";
    expect(() =>
      update(
        "NewEnd",
        {
          defaultDate: {
            expr: { widget: "Warning", property: "text" },
          },
        },
        undefined,
        dsl,
      ),
    ).toThrow(/reads "NewEnd.selectedDate" \(an evaluation cycle\)/);
  });
});

describe("defaultFrom reading another widget that does not read back (APP-16381)", () => {
  it("is accepted", () => {
    const { dsl } = update("RequestedBy", {
      defaultFrom: { expr: { widget: "Warning", property: "text" } },
    });

    expect(widget(dsl, "RequestedBy").defaultText).toBe("{{ Warning.text }}");
  });
});

describe("review regressions: derived-property cycles", () => {
  it("refuses two input defaults reading each other's text", () => {
    const first = update("Initials", {
      defaultFrom: { expr: { widget: "RequestedBy", property: "text" } },
    }).dsl;

    expect(() =>
      update(
        "RequestedBy",
        { defaultFrom: { expr: { widget: "Initials", property: "text" } } },
        undefined,
        first,
      ),
    ).toThrow(/evaluation cycle/);
  });
  it.each(["minDate", "maxDate"])(
    "refuses %s feeding the picker's validity back to itself",
    (prop) => {
      expect(() =>
        update("NewEnd", {
          [prop]: { expr: { widget: "NewEnd", property: "isValid" } },
        }),
      ).toThrow(/evaluation cycle/);
      const dsl = page();

      widget(dsl, "NewEnd")[prop] = "{{ Initials.isRequired }}";
      expect(() =>
        update(
          "Initials",
          { requiredWhen: { expr: { widget: "NewEnd", property: "isValid" } } },
          undefined,
          dsl,
        ),
      ).toThrow(/evaluation cycle/);
    },
  );
  it("allows independent defaults between inputs", () => {
    const first = update("Initials", {
      defaultFrom: { expr: { user: "name" } },
    }).dsl;

    expect(() =>
      update(
        "RequestedBy",
        { defaultFrom: { expr: { widget: "Initials", property: "text" } } },
        undefined,
        first,
      ),
    ).not.toThrow();
  });
});

it("the documented Submit condition ignores hidden invalid initials but always checks the date", () => {
  const recipe = RECIPES.find(
    ({ slug }) => slug === "conditional-form",
  )!.render();
  const json = recipe.match(/`disabledWhen: (\{[^`]+\})`/)?.[1];

  expect(json).toBeDefined();
  const dsl = page();

  widget(dsl, "Warning").widgetName = "BillingWarning";
  const patched = update(
    "Submit",
    { disabledWhen: JSON.parse(json!) },
    undefined,
    dsl,
  ).dsl;
  const binding = widget(patched, "Submit").isDisabled;
  const check = (
    warning: boolean,
    date: boolean,
    initials: boolean,
    ack: boolean,
  ) =>
    evaluate(binding, {
      BillingWarning: { isVisible: warning },
      NewEnd: { isValid: date },
      Initials: { isValid: initials },
      Ack: { isValid: ack },
    });

  expect(check(true, true, false, true)).toBe(true);
  expect(check(true, true, true, false)).toBe(true);
  expect(check(true, true, true, true)).toBe(false);
  expect(check(false, true, false, false)).toBe(false);
  expect(check(false, false, true, true)).toBe(true);
});
