import {
  buildFieldBinding,
  buildGuessedSubtitleBinding,
  buildGuessedTitleBinding,
  getRecordExpression,
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
      "{{Query1.data?.[0]?.email}}",
    );
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
