import ComputeTablePropertyControlV2 from "./TableComputeValue";

describe("ComputeTablePropertyControlV2.getInputComputedValue", () => {
  const tableName = "Table1";

  it("1. should extract computation logic from simpletable compute binding", () => {
    const input = "currentRow.price";
    const computedValue = ComputeTablePropertyControlV2.getTableComputeBinding(
      tableName,
      input,
    );

    expect(
      ComputeTablePropertyControlV2.getInputComputedValue(computedValue),
    ).toBe(`{{${input}}}`);
  });

  it("2. should extract computation logic from array compute binding", () => {
    const input = `
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
    `;
    const computedValue = ComputeTablePropertyControlV2.getTableComputeBinding(
      tableName,
      input,
    );

    expect(
      ComputeTablePropertyControlV2.getInputComputedValue(computedValue),
    ).toBe(`{{${input}}}`);
  });

  it("3. should handle numeric values", () => {
    const inputs = ["123", "-456", "0.123", "-0.456"];

    inputs.forEach((input) => {
      const computedValue =
        ComputeTablePropertyControlV2.getTableComputeBinding(tableName, input);

      expect(
        ComputeTablePropertyControlV2.getInputComputedValue(computedValue),
      ).toBe(`{{${input}}}`);
    });
  });

  it("4. should handle boolean values", () => {
    const inputs = ["true", "false"];

    inputs.forEach((input) => {
      const computedValue =
        ComputeTablePropertyControlV2.getTableComputeBinding(tableName, input);

      expect(
        ComputeTablePropertyControlV2.getInputComputedValue(computedValue),
      ).toBe(`{{${input}}}`);
    });
  });

  it("5. should handle null and undefined", () => {
    const inputs = ["null", "undefined"];

    inputs.forEach((input) => {
      const computedValue =
        ComputeTablePropertyControlV2.getTableComputeBinding(tableName, input);

      expect(
        ComputeTablePropertyControlV2.getInputComputedValue(computedValue),
      ).toBe(`{{${input}}}`);
    });
  });

  it("6. should handle complex objects", () => {
    const input = `{
      "name": "John Doe",
      "age": 30,
      "isActive": true,
      "address": {
        "street": "123 Main St",
        "city": "Boston"
      },
      "hobbies": ["reading", "gaming"]
    }`;
    const computedValue = ComputeTablePropertyControlV2.getTableComputeBinding(
      tableName,
      input,
    );

    expect(
      ComputeTablePropertyControlV2.getInputComputedValue(computedValue),
    ).toBe(`{{${input}}}`);
  });

  it("7. should handle simple arrow function with block", () => {
    const input = "() => { return true; }";
    const computedValue = ComputeTablePropertyControlV2.getTableComputeBinding(
      tableName,
      input,
    );

    expect(
      ComputeTablePropertyControlV2.getInputComputedValue(computedValue),
    ).toBe(`{{${input}}}`);
  });

  it("8. should handle arrow function with single parameter", () => {
    const input = "(x) => x * 2";
    const computedValue = ComputeTablePropertyControlV2.getTableComputeBinding(
      tableName,
      input,
    );

    expect(
      ComputeTablePropertyControlV2.getInputComputedValue(computedValue),
    ).toBe(`{{${input}}}`);
  });

  it("9. should handle multiplication", () => {
    const input = "currentRow.price * 2";
    const computedValue = ComputeTablePropertyControlV2.getTableComputeBinding(
      tableName,
      input,
    );

    expect(
      ComputeTablePropertyControlV2.getInputComputedValue(computedValue),
    ).toBe(`{{${input}}}`);
  });

  it("10. should handle addition", () => {
    const input = "currentRow.quantity + 5";
    const computedValue = ComputeTablePropertyControlV2.getTableComputeBinding(
      tableName,
      input,
    );

    expect(
      ComputeTablePropertyControlV2.getInputComputedValue(computedValue),
    ).toBe(`{{currentRow.quantity}}{{5}}`);
  });

  it("11. should handle logical AND", () => {
    const input = "currentRow.isValid && true";
    const computedValue = ComputeTablePropertyControlV2.getTableComputeBinding(
      tableName,
      input,
    );

    expect(
      ComputeTablePropertyControlV2.getInputComputedValue(computedValue),
    ).toBe(`{{${input}}}`);
  });

  it("12. should handle logical NOT", () => {
    const input = "!currentRow.isDeleted";
    const computedValue = ComputeTablePropertyControlV2.getTableComputeBinding(
      tableName,
      input,
    );

    expect(
      ComputeTablePropertyControlV2.getInputComputedValue(computedValue),
    ).toBe(`{{${input}}}`);
  });
});
