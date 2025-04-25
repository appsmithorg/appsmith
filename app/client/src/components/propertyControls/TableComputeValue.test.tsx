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

  it("3. should handle nested parentheses correctly", () => {
    const input =
      "JSObject1.complexFunction(currentRow.id, JSObject2.helperFunction(currentRow.name))";
    const computedValue = ComputeTablePropertyControlV2.getTableComputeBinding(
      tableName,
      input,
    );

    expect(
      ComputeTablePropertyControlV2.getInputComputedValue(computedValue),
    ).toBe(`{{${input}}}`);
  });

  it("4. should handle malformed expressions with unbalanced parentheses", () => {
    // Create a malformed expression by manually crafting a bad computedValue string
    // Removing the proper closing parenthesis structure
    const malformedComputedValue =
      "{{(() => { const tableData = Table1.processedTableData || []; return tableData.length > 0 ? tableData.map((currentRow, currentIndex) => (currentRow.function(unbalanced)) : fallback })";

    // The function should gracefully handle this and return the original string
    // rather than throwing an error or returning a partial/incorrect result
    expect(
      ComputeTablePropertyControlV2.getInputComputedValue(
        malformedComputedValue,
      ),
    ).toBe(malformedComputedValue);
  });

  it("5. should correctly parse complex but valid expressions with multiple nested parentheses", () => {
    const complexInput =
      "JSObject1.process(currentRow.value1, (currentRow.value2 || getDefault()), JSObject2.format(currentRow.value3))";
    const computedValue = ComputeTablePropertyControlV2.getTableComputeBinding(
      tableName,
      complexInput,
    );

    expect(
      ComputeTablePropertyControlV2.getInputComputedValue(computedValue),
    ).toBe(`{{${complexInput}}}`);
  });
});
