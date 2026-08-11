import {
  buildFieldBinding,
  buildGuessedSubtitleBinding,
  buildGuessedTitleBinding,
  getRecordExpression,
  isBindableColumnName,
} from "./dataBinding";

describe("getRecordExpression", () => {
  it("indexes the first record of a bound collection", () => {
    expect(getRecordExpression("{{Query1.data}}")).toBe("Query1.data?.[0]");
  });

  it("handles a nested binding path", () => {
    expect(getRecordExpression("{{Query1.data.users}}")).toBe(
      "Query1.data.users?.[0]",
    );
  });

  it("tolerates surrounding whitespace", () => {
    expect(getRecordExpression("  {{ Query1.data }}  ")).toBe(
      "Query1.data?.[0]",
    );
  });

  it.each([
    ["a plain string", "not-a-binding"],
    ["an empty binding", "{{}}"],
    ["an empty string", ""],
    ["a non-string", 42],
    ["undefined", undefined],
  ])("returns null for %s so callers leave it untouched", (_label, value) => {
    expect(getRecordExpression(value)).toBeNull();
  });
});

describe("generated bindings", () => {
  const record = "Query1.data?.[0]";

  it("binds a known column exactly", () => {
    expect(buildFieldBinding(record, "email")).toBe(
      '{{Query1.data?.[0]?.["email"]}}',
    );
  });

  // Column names come from the datasource. Google Sheets headers routinely
  // contain spaces, and quoted SQL identifiers can too — dot notation cannot
  // express those, so the binding must use escaped bracket notation.
  it.each([
    ["a space", "First Name", '{{Query1.data?.[0]?.["First Name"]}}'],
    ["a hyphen", "first-name", '{{Query1.data?.[0]?.["first-name"]}}'],
    ["a dot", "user.name", '{{Query1.data?.[0]?.["user.name"]}}'],
    ["a quote", 'say"hi', '{{Query1.data?.[0]?.["say\\"hi"]}}'],
    ["a backslash", "back\\slash", '{{Query1.data?.[0]?.["back\\\\slash"]}}'],
    ["a leading digit", "1st", '{{Query1.data?.[0]?.["1st"]}}'],
  ])("escapes a column name containing %s", (_label, column, expected) => {
    expect(buildFieldBinding(record, column)).toBe(expected);
  });

  it("evaluates a column name containing a space", () => {
    const binding = buildFieldBinding(record, "First Name");
    const data = [{ "First Name": "Ada" }];

    expect(
      new Function("Query1", `return (${binding.slice(2, -2)});`)({ data }),
    ).toBe("Ada");
  });
  it("optional-chains every access", () => {
    // Binding happens before the query runs, so `data` is undefined then.
    for (const binding of [
      buildFieldBinding(record, "name"),
      buildGuessedTitleBinding(record),
      buildGuessedSubtitleBinding(record),
    ]) {
      expect(binding.startsWith("{{")).toBe(true);
      expect(binding.endsWith("}}")).toBe(true);
      expect(binding).not.toMatch(/data\.\[0\]/);
      expect(binding).not.toMatch(/\]\.\w/);
    }
  });

  // The guessed bindings must survive every state a real query passes through,
  // because a throw here puts an error on the card the instant it is bound.
  describe("evaluate safely across query states", () => {
    const evaluate = (expr: string, data: unknown) => {
      const body = expr.slice(2, -2);

      return new Function("Query1", `return (${body});`)({ data });
    };

    it.each([
      ["query never run", undefined],
      ["empty array", []],
      ["bare object instead of an array", { name: "nope" }],
      ["record with no string fields", [{ id: 1, active: true }]],
    ])("does not throw when %s", (_label, data) => {
      expect(() =>
        evaluate(buildGuessedTitleBinding(record), data),
      ).not.toThrow();
      expect(() =>
        evaluate(buildGuessedSubtitleBinding(record), data),
      ).not.toThrow();
      expect(() =>
        evaluate(buildFieldBinding(record, "name"), data),
      ).not.toThrow();
    });

    it("resolves the common field names", () => {
      const data = [{ id: 7, name: "Ada", description: "Engineer" }];

      expect(evaluate(buildGuessedTitleBinding(record), data)).toBe("Ada");
      expect(evaluate(buildGuessedSubtitleBinding(record), data)).toBe(
        "Engineer",
      );
    });

    it("prefers title/subtitle when present", () => {
      const data = [{ title: "T", subtitle: "S", name: "N" }];

      expect(evaluate(buildGuessedTitleBinding(record), data)).toBe("T");
      expect(evaluate(buildGuessedSubtitleBinding(record), data)).toBe("S");
    });

    it("falls back to the first string field for the title", () => {
      const data = [{ id: 1, city: "Oslo" }];

      expect(evaluate(buildGuessedTitleBinding(record), data)).toBe("Oslo");
    });
  });
});

describe("isBindableColumnName", () => {
  it.each(["name", "First Name", "first-name", 'say"hi', "1st"])(
    "accepts %p",
    (column) => {
      expect(isBindableColumnName(column)).toBe(true);
    },
  );

  // No amount of quoting survives the closing delimiter: it terminates the
  // {{ }} expression early and leaves a broken binding behind.
  it.each([
    ["the closing delimiter", "a}}b"],
    ["a trailing delimiter", "name}}"],
    ["an empty string", ""],
    ["a non-string", 42],
    ["undefined", undefined],
  ])("rejects %s", (_label, column) => {
    expect(isBindableColumnName(column)).toBe(false);
  });
});
