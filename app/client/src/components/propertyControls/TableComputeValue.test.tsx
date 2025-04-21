import ComputeTablePropertyControlV2 from "./TableComputeValue";

describe("ComputeTablePropertyControlV2.getInputComputedValue", () => {
  const tableName = "Table1";
  const inputVariations = [
    "currentRow.price",
    `JSObject1.somefunction(currentRow["id"] || 0)`,
    `
    [
      {
        "value": "male",
        "label": "male"
      },
      {
        "value": "female",
        "label": "female"
      }
    ]
    `,
    `["123", "-456", "0.123", "-0.456"]`,
    `["true", "false"]`,
    `["null", "undefined"]`,
    `{
      "name": "John Doe",
      "age": 30,
      "isActive": true,
      "address": {
        "street": "123 Main St",
        "city": "Boston"
      },
      "hobbies": ["reading", "gaming"]
    }`,
    "() => { return true; }",
    "(x) => x * 2",
    "currentRow.price * 2",
    "currentRow.isValid && true",
    "!currentRow.isDeleted",
  ];

  it("1. should return the correct computed value", () => {
    inputVariations.forEach((input) => {
      const computedValue =
        ComputeTablePropertyControlV2.getTableComputeBinding(tableName, input);

      expect(
        ComputeTablePropertyControlV2.getInputComputedValue(computedValue),
      ).toBe(`{{${input}}}`);
    });
  });

  it("2. should handle addition values", () => {
    const input = "currentRow.quantity + 5";
    const computedValue = ComputeTablePropertyControlV2.getTableComputeBinding(
      tableName,
      input,
    );

    expect(
      ComputeTablePropertyControlV2.getInputComputedValue(computedValue),
    ).toBe(`{{currentRow.quantity}}{{5}}`);
  });
});
