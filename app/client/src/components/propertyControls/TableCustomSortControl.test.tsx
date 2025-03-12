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
  it("should extract computation expression correctly from binding string", () => {
    const bindingString = `{{(() => {
    try {
      const tableData = Table1.tableData || [];
      const filteredTableData = Table1.filteredTableData || [];
      if(filteredTableData.length > 0 && true) {
        const sortedTableData = ((originalTableData, computedTableData, column, order) => (computedTableData.length > 5))(tableData, filteredTableData, Table1.sortOrder.column, Table1.sortOrder.order);
        return Array.isArray(sortedTableData) && sortedTableData.length > 0 ? sortedTableData : filteredTableData;
      }
      return filteredTableData;
    } catch (e) {
      return filteredTableData;
    }
    })()}}`;

    const result = TableCustomSortControl.getInputComputedValue(bindingString);

    expect(result).toBe("{{computedTableData.length > 5}}");
  });

  it("should handle complex expressions", () => {
    const bindingString = `{{(() => {
    try {
      const tableData = Table1.tableData || [];
      const filteredTableData = Table1.filteredTableData || [];
      if(filteredTableData.length > 0 && true) {
        const sortedTableData = ((originalTableData, computedTableData, column, order) => (computedTableData.filter(item => item.id > 10)))(tableData, filteredTableData, Table1.sortOrder.column, Table1.sortOrder.order);
        return Array.isArray(sortedTableData) && sortedTableData.length > 0 ? sortedTableData : filteredTableData;
      }
      return filteredTableData;
    } catch (e) {
      return filteredTableData;
    }
    })()}}`;

    const result = TableCustomSortControl.getInputComputedValue(bindingString);

    expect(result).toBe("{{computedTableData.filter(item => item.id > 10)}}");
  });

  it("should return original value when binding string doesn't match expected format", () => {
    const nonMatchingString = "{{Table1.tableData[0].id}}";
    const result =
      TableCustomSortControl.getInputComputedValue(nonMatchingString);

    expect(result).toBe(nonMatchingString);
  });
});

describe("TableCustomSortControl instance methods", () => {
  it("generates correct binding with getComputedValue", () => {
    const instance = new TableCustomSortControl({
      ...requiredParams,
      theme: EditorTheme.LIGHT,
    });

    const inputValue = "{{computedTableData.sort((a, b) => a.id - b.id)}}";
    const expectedOutput = `{{(() => {
    try {
      const tableData = Table1.tableData || [];
      const filteredTableData = Table1.filteredTableData || [];
      if(filteredTableData.length > 0 && computedTableData.sort((a, b) => a.id - b.id)) {
        const sortedTableData = ((originalTableData, computedTableData, column, order) => (computedTableData.sort((a, b) => a.id - b.id)))(tableData, filteredTableData, Table1.sortOrder.column, Table1.sortOrder.order);
        return Array.isArray(sortedTableData) && sortedTableData.length > 0 ? sortedTableData : filteredTableData;
      }
      return filteredTableData;
    } catch (e) {
      return filteredTableData;
    }
    })()}}`;

    // Use a regex to ignore whitespace differences
    const normalizeString = (str: string) => str.replace(/\s+/g, " ").trim();

    const result = instance.getComputedValue(inputValue, "Table1");

    expect(normalizeString(result)).toBe(normalizeString(expectedOutput));
  });

  it("handles non-binding values correctly in getComputedValue", () => {
    const instance = new TableCustomSortControl({
      ...requiredParams,
      theme: EditorTheme.LIGHT,
    });

    const plainValue = "plain text";
    const result = instance.getComputedValue(plainValue, "Table1");

    expect(result).toBe(plainValue);
  });
});

describe("TableCustomSortControl.getControlType", () => {
  it("returns the correct control type", () => {
    expect(TableCustomSortControl.getControlType()).toBe("TABLE_CUSTOM_SORT");
  });
});
