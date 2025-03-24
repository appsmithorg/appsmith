import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import TableCustomSortControl from "./TableCustomSortControl";

const requiredParams = {
  evaluatedValue: "",
  widgetProperties: {
    widgetName: "Table1",
    primaryColumns: {
      id: {
        alias: "id",
        originalId: "id",
      },
      name: {
        alias: "name",
        originalId: "name",
      },
    },
  },
  parentPropertyName: "",
  parentPropertyValue: "",
  additionalDynamicData: {},
  label: "Custom Sort",
  propertyName: "customSort",
  controlType: "TABLE_CUSTOM_SORT",
  isBindProperty: true,
  isTriggerProperty: false,
  onPropertyChange: jest.fn(),
  openNextPanel: jest.fn(),
  deleteProperties: jest.fn(),
  hideEvaluatedValue: false,
  placeholderText: "Enter custom sort logic",
};

describe("TableCustomSortControl.getInputComputedValue", () => {
  // Create an instance to use for generating test data
  const testInstance = new TableCustomSortControl({
    ...requiredParams,
    theme: EditorTheme.LIGHT,
  });

  it("should extract computation expression correctly from binding string with arrow function", () => {
    const sortExpression = "tableData.sort((a, b) => a.id - b.id)";

    const bindingString = testInstance.getComputedValue(
      `{{${sortExpression}}}`,
      "Table1",
    );

    const result = TableCustomSortControl.getInputComputedValue(bindingString);

    expect(result).toBe(`{{${sortExpression}}}`);
  });

  it("should extract computation expression correctly from binding string with function body", () => {
    const sortExpression = `{
      return tableData.filter(row => row.original_status === "active");
    }`;

    const bindingString = testInstance.getComputedValue(
      `{{${sortExpression}}}`,
      "Table1",
    );

    const result = TableCustomSortControl.getInputComputedValue(bindingString);

    expect(result).toBe(`{{${sortExpression}}}`);
  });

  it("should return original value when binding string doesn't match expected format", () => {
    const nonMatchingString = "{{Table1.tableData[0].id}}";
    const result =
      TableCustomSortControl.getInputComputedValue(nonMatchingString);

    expect(result).toBe(nonMatchingString);
  });

  it("should handle empty string input", () => {
    const emptyString = "";
    const result = TableCustomSortControl.getInputComputedValue(emptyString);

    expect(result).toBe(emptyString);
  });

  it("should support round-trip conversion (getComputedValue -> getInputComputedValue)", () => {
    // Test with arrow function
    const arrowExpression =
      "tableData.sort((a, b) => a.name.localeCompare(b.name))";
    const arrowBindingString = testInstance.getComputedValue(
      arrowExpression,
      "Table1",
    );
    const arrowResult =
      TableCustomSortControl.getInputComputedValue(arrowBindingString);

    expect(arrowResult).toBe(arrowExpression);

    // Test with function body
    const bodyExpression = `{
      const direction = order === "asc" ? 1 : -1;
      return tableData.sort((a, b) => direction * (a[column] - b[column]));
    }`;
    const bodyBindingString = testInstance.getComputedValue(
      `{{${bodyExpression}}}`,
      "Table1",
    );
    const bodyResult =
      TableCustomSortControl.getInputComputedValue(bodyBindingString);
    // We need to normalize the whitespace for this comparison
    const normalizeWhitespace = (str: string) =>
      str.replace(/\s+/g, " ").trim();

    expect(normalizeWhitespace(bodyResult)).toBe(
      normalizeWhitespace(`{{${bodyExpression}}}`),
    );
  });
});

describe("TableCustomSortControl instance methods", () => {
  const testInstance = new TableCustomSortControl({
    ...requiredParams,
    theme: EditorTheme.LIGHT,
  });

  it("generates correct binding with getComputedValue", () => {
    const inputValue = "{{tableData.sort((a, b) => a.id - b.id)}}";
    const result = testInstance.getComputedValue(inputValue, "Table1");

    // Check that the result contains key parts of our expected binding
    expect(result).toContain(
      "const originalTableData = Table1.tableData || []",
    );
    expect(result).toContain(
      "const filteredTableData = Table1.filteredTableData || []",
    );
    expect(result).toContain("const primaryColumnId = Table1.primaryColumnId");
    expect(result).toContain(
      "const getMergedTableData = (originalData, filteredData, primaryId)",
    );
    expect(result).toContain(
      "const mergedTableData = primaryColumnId ? getMergedTableData(originalTableData, filteredTableData, primaryColumnId) : filteredTableData",
    );
    expect(result).toContain("tableData.sort((a, b) => a.id - b.id)");
    expect(result).toContain(
      "if (Array.isArray(sortedTableData) && primaryColumnId)",
    );
    expect(result).toContain('console.error("Error in table custom sort:", e)');
  });

  it("handles non-binding values correctly in getComputedValue", () => {
    const plainValue = "plain text";
    const result = testInstance.getComputedValue(plainValue, "Table1");

    expect(result).toBe(plainValue);
  });

  it("handles empty string in getComputedValue", () => {
    const emptyValue = "";
    const result = testInstance.getComputedValue(emptyValue, "Table1");

    expect(result).toBe(emptyValue);
  });

  it("correctly handles original data in computed value", () => {
    const inputValue =
      "{{tableData.map(row => ({...row, age: row.__original__.age}))}}";
    const result = testInstance.getComputedValue(inputValue, "Table1");

    expect(result).toContain(
      "const originalTableData = Table1.tableData || []",
    );
    expect(result).toContain(
      "const filteredTableData = Table1.filteredTableData || []",
    );
    expect(result).toContain("const primaryColumnId = Table1.primaryColumnId");
    expect(result).toContain(
      "const getMergedTableData = (originalData, filteredData, primaryId)",
    );
    expect(result).toContain(
      "const mergedTableData = primaryColumnId ? getMergedTableData(originalTableData, filteredTableData, primaryColumnId) : filteredTableData",
    );
    expect(result).toContain(
      "tableData.map(row => ({...row, age: row.__original__.age}))",
    );
  });
});

describe("TableCustomSortControl.getControlType", () => {
  it("returns the correct control type", () => {
    expect(TableCustomSortControl.getControlType()).toBe("TABLE_CUSTOM_SORT");
  });
});
