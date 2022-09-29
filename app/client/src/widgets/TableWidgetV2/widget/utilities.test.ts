import { ColumnProperties, TableStyles } from "../component/Constants";
import { ColumnTypes } from "../constants";
import {
  escapeString,
  getAllTableColumnKeys,
  getColumnType,
  getDerivedColumns,
  getOriginalRowIndex,
  getSelectRowIndex,
  getSelectRowIndices,
  getTableStyles,
  reorderColumns,
} from "./utilities";

const getCurrentRowBinding = (
  entityName: string,
  userInput: string,
  withBinding = true,
) => {
  let rowBinding = `${entityName}.processedTableData.map((currentRow, currentIndex) => ( ${userInput}))`;
  if (withBinding) rowBinding = `{{${rowBinding}}}`;
  return rowBinding;
};

describe("getOriginalRowIndex", () => {
  it("With no new data ", () => {
    const oldTableData = [
      {
        step: "#1",
        task: " a  fetch_users wih the Mock DB",
        status: "--",
      },
      {
        step: "#2",
        task: " a  fetch_users wih the Mock DB",
        status: "--",
      },
      {
        step: "#3",
        task: "Bind the query  => fetch_users.data",
        status: "--",
      },
    ];
    const newTableData: Record<string, unknown>[] = [];
    const selectedRowIndex = 1;
    const result = getOriginalRowIndex(
      oldTableData,
      newTableData,
      selectedRowIndex,
      "step",
    );
    const expected = -1;
    expect(result).toStrictEqual(expected);
  });

  it("With no old data", () => {
    const oldTableData: Record<string, unknown>[] = [];
    const newTableData = [
      {
        step: "#1",
        task: " a  fetch_users wih the Mock DB",
        status: "--",
      },
      {
        step: "#2",
        task: " a  fetch_users wih the Mock DB",
        status: "--",
      },
      {
        step: "#3",
        task: "Bind the query  => fetch_users.data",
        status: "--",
      },
    ];

    const selectedRowIndex = 1;
    const result = getOriginalRowIndex(
      oldTableData,
      newTableData,
      selectedRowIndex,
      "step",
    );
    const expected = -1;
    expect(result).toStrictEqual(expected);
  });

  it("With no selectedRowIndex", () => {
    const oldTableData = [
      {
        step: "#1",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 0,
        __primaryKey__: "1",
      },
      {
        step: "#2",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 1,
        __primaryKey__: "",
      },
      {
        step: "#3",
        task: "Bind the query  => fetch_users.data",
        status: "--",
        __originalIndex__: 2,
        __primaryKey__: "2",
      },
    ];
    const newTableData = [
      {
        step: "#1",
        task: " a fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 0,
        __primaryKey__: "1",
      },
      {
        step: "#2",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 1,
        __primaryKey__: "",
      },
      {
        step: "#3",
        task: "Bind the query  => fetch_users.data",
        status: "--",
        __originalIndex__: 2,
        __primaryKey__: "2",
      },
    ];
    const result = getOriginalRowIndex(
      oldTableData,
      newTableData,
      undefined,
      "step",
    );
    const expected = -1;
    expect(result).toStrictEqual(expected);
  });

  it("With no data", () => {
    const oldTableData = undefined;
    const newTableData = undefined;
    const selectedRowIndex = 1;
    const result = getOriginalRowIndex(
      (oldTableData as any) as Array<Record<string, unknown>>,
      (newTableData as any) as Array<Record<string, unknown>>,
      selectedRowIndex,
      "step",
    );
    const expected = -1;
    expect(result).toStrictEqual(expected);
  });

  it("With selectedRowIndex and data", () => {
    const oldTableData = [
      {
        step: "#1",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 0,
        __primaryKey__: "#1",
      },
      {
        step: "#2",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 1,
        __primaryKey__: "#2",
      },
      {
        step: "#3",
        task: "Bind the query  => fetch_users.data",
        status: "--",
        __originalIndex__: 2,
        __primaryKey__: "#3",
      },
    ];
    const newTableData = [
      {
        step: "#3",
        task: "Bind the query  => fetch_users.data",
        status: "--",
        __originalIndex__: 0,
        __primaryKey__: "#3",
      },
      {
        step: "#2",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 1,
        __primaryKey__: "#2",
      },
      {
        step: "#1",
        task: " a fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 2,
        __primaryKey__: "#1",
      },
    ];
    const result = getOriginalRowIndex(oldTableData, newTableData, 0, "step");
    const expected = 2;
    expect(result).toStrictEqual(expected);
  });

  it("With invalid primaryColumnId", () => {
    const oldTableData = [
      {
        step: "#1",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 0,
        __primaryKey__: "#1",
      },
      {
        step: "#2",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 1,
        __primaryKey__: "#2",
      },
      {
        step: "#3",
        task: "Bind the query  => fetch_users.data",
        status: "--",
        __originalIndex__: 2,
        __primaryKey__: "#3",
      },
    ];
    const newTableData = [
      {
        step: "#3",
        task: "Bind the query  => fetch_users.data",
        status: "--",
        __originalIndex__: 0,
        __primaryKey__: "#3",
      },
      {
        step: "#2",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 1,
        __primaryKey__: "#2",
      },
      {
        step: "#1",
        task: " a fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 2,
        __primaryKey__: "#1",
      },
    ];
    const result = getOriginalRowIndex(oldTableData, newTableData, 0, "");
    const expected = -1;
    expect(result).toStrictEqual(expected);
  });

  it("With new primaryColumn values", () => {
    const oldTableData = [
      {
        step: "#1",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 0,
        __primaryKey__: "#1",
      },
      {
        step: "#2",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 1,
        __primaryKey__: "#2",
      },
      {
        step: "#3",
        task: "Bind the query  => fetch_users.data",
        status: "--",
        __originalIndex__: 2,
        __primaryKey__: "#3",
      },
    ];
    const newTableData = [
      {
        step: "#3",
        task: "Bind the query  => fetch_users.data",
        status: "--",
        __originalIndex__: 0,
        __primaryKey__: "#31",
      },
      {
        step: "#2",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 1,
        __primaryKey__: "#21",
      },
      {
        step: "#1",
        task: " a fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 2,
        __primaryKey__: "#11",
      },
    ];
    const result = getOriginalRowIndex(oldTableData, newTableData, 0, "");
    const expected = -1;
    expect(result).toStrictEqual(expected);
  });
});

describe("selectRowIndex", () => {
  it("With new Data", () => {
    const oldTableData = [
      {
        step: "#1",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 0,
        __primaryKey__: "#1",
      },
      {
        step: "#2",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 1,
        __primaryKey__: "#2",
      },
      {
        step: "#3",
        task: "Bind the query  => fetch_users.data",
        status: "--",
        __originalIndex__: 2,
        __primaryKey__: "#3",
      },
    ];
    const newTableData = [
      {
        step: "#1",
        task: " a fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 0,
        __primaryKey__: "#1",
      },
      {
        step: "#2",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 1,
        __primaryKey__: "#2",
      },
      {
        step: "#3",
        task: "Bind the query  => fetch_users.data",
        status: "--",
        __originalIndex__: 2,
        __primaryKey__: "#3",
      },
    ];
    const selectedRowIndexProp = 0;
    const defaultSelectedRowIndex = 0;
    const result = getSelectRowIndex(
      oldTableData,
      newTableData,
      defaultSelectedRowIndex,
      selectedRowIndexProp,
      "step",
    );
    expect(result).toStrictEqual(0);
  });

  it("With new Data and different order", () => {
    const oldTableData = [
      {
        step: "#1",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 0,
        __primaryKey__: "#1",
      },
      {
        step: "#2",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 1,
        __primaryKey__: "#2",
      },
      {
        step: "#3",
        task: "Bind the query  => fetch_users.data",
        status: "--",
        __originalIndex__: 2,
        __primaryKey__: "#3",
      },
    ];
    const newTableData = [
      {
        step: "#3",
        task: "Bind the query  => fetch_users.data",
        status: "--",
        __originalIndex__: 0,
        __primaryKey__: "#3",
      },
      {
        step: "#2",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 1,
        __primaryKey__: "#2",
      },
      {
        step: "#1",
        task: " a fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 2,
        __primaryKey__: "#1",
      },
    ];
    const selectedRowIndexProp = 0;
    const defaultSelectedRowIndex = 0;
    const result = getSelectRowIndex(
      oldTableData,
      newTableData,
      defaultSelectedRowIndex,
      selectedRowIndexProp,
      "step",
    );
    expect(result).toStrictEqual(2);
  });

  it("With new Data and no primaryColumnId", () => {
    const oldTableData = [
      {
        step: "#1",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 0,
        __primaryKey__: "#1",
      },
      {
        step: "#2",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 1,
        __primaryKey__: "#2",
      },
      {
        step: "#3",
        task: "Bind the query  => fetch_users.data",
        status: "--",
        __originalIndex__: 2,
        __primaryKey__: "#3",
      },
    ];
    const newTableData = [
      {
        step: "#3",
        task: "Bind the query  => fetch_users.data",
        status: "--",
        __originalIndex__: 0,
        __primaryKey__: "#3",
      },
      {
        step: "#2",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 1,
        __primaryKey__: "#2",
      },
      {
        step: "#1",
        task: " a fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 2,
        __primaryKey__: "#1",
      },
    ];
    const selectedRowIndexProp = -1;
    const defaultSelectedRowIndex = 0;
    const result = getSelectRowIndex(
      oldTableData,
      newTableData,
      defaultSelectedRowIndex,
      selectedRowIndexProp,
      undefined,
    );
    expect(result).toStrictEqual(0);
  });

  it("With new Data and primaryColumnId, without selectRowIndex", () => {
    const oldTableData = [
      {
        step: "#1",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 0,
        __primaryKey__: "#1",
      },
      {
        step: "#2",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 1,
        __primaryKey__: "#2",
      },
      {
        step: "#3",
        task: "Bind the query  => fetch_users.data",
        status: "--",
        __originalIndex__: 2,
        __primaryKey__: "#3",
      },
    ];
    const newTableData = [
      {
        step: "#3",
        task: "Bind the query  => fetch_users.data",
        status: "--",
        __originalIndex__: 0,
        __primaryKey__: "#3",
      },
      {
        step: "#2",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 1,
        __primaryKey__: "#2",
      },
      {
        step: "#1",
        task: " a fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 2,
        __primaryKey__: "#1",
      },
    ];
    const selectedRowIndexProp = -1;
    const defaultSelectedRowIndex = 0;
    const result = getSelectRowIndex(
      oldTableData,
      newTableData,
      defaultSelectedRowIndex,
      selectedRowIndexProp,
      "step",
    );
    expect(result).toStrictEqual(0);
  });

  it("With new Data and primaryColumnId, without selectRowIndex, defaultRowIndex", () => {
    const oldTableData = [
      {
        step: "#1",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 0,
        __primaryKey__: "#1",
      },
      {
        step: "#2",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 1,
        __primaryKey__: "#2",
      },
      {
        step: "#3",
        task: "Bind the query  => fetch_users.data",
        status: "--",
        __originalIndex__: 2,
        __primaryKey__: "#3",
      },
    ];
    const newTableData = [
      {
        step: "#3",
        task: "Bind the query  => fetch_users.data",
        status: "--",
        __originalIndex__: 0,
        __primaryKey__: "#3",
      },
      {
        step: "#2",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 1,
        __primaryKey__: "#2",
      },
      {
        step: "#1",
        task: " a fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 2,
        __primaryKey__: "#1",
      },
    ];
    const selectedRowIndexProp = -1;
    const defaultSelectedRowIndex = -1;
    const result = getSelectRowIndex(
      oldTableData,
      newTableData,
      defaultSelectedRowIndex,
      selectedRowIndexProp,
      "step",
    );
    expect(result).toStrictEqual(-1);
  });
});

describe("selectRowIndices", () => {
  it("With no selected index", () => {
    const oldTableData = [
      {
        step: "#1",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 0,
        __primaryKey__: "1",
      },
      {
        step: "#2",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 1,
        __primaryKey__: "",
      },
      {
        step: "#3",
        task: "Bind the query  => fetch_users.data",
        status: "--",
        __originalIndex__: 2,
        __primaryKey__: "2",
      },
    ];
    const newTableData = [
      {
        step: "#1",
        task: " a fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 0,
        __primaryKey__: "1",
      },
      {
        step: "#2",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 1,
        __primaryKey__: "",
      },
      {
        step: "#3",
        task: "Bind the query  => fetch_users.data",
        status: "--",
        __originalIndex__: 2,
        __primaryKey__: "2",
      },
    ];
    const defaultSelectedRowIndices = [0];
    const result = getSelectRowIndices(
      oldTableData,
      newTableData,
      defaultSelectedRowIndices,
      [],
      undefined,
    );
    expect(result).toEqual([0]);
  });

  it("With selected indices and defaultRowIndices", () => {
    const oldTableData = [
      {
        step: "#1",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 0,
        __primaryKey__: "1",
      },
      {
        step: "#2",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 1,
        __primaryKey__: "",
      },
      {
        step: "#3",
        task: "Bind the query  => fetch_users.data",
        status: "--",
        __originalIndex__: 2,
        __primaryKey__: "2",
      },
    ];
    const newTableData = [
      {
        step: "#1",
        task: " a fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 0,
        __primaryKey__: "1",
      },
      {
        step: "#2",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 1,
        __primaryKey__: "",
      },
      {
        step: "#3",
        task: "Bind the query  => fetch_users.data",
        status: "--",
        __originalIndex__: 2,
        __primaryKey__: "2",
      },
    ];
    const defaultSelectedRowIndices = undefined;
    const result = getSelectRowIndices(
      oldTableData,
      newTableData,
      defaultSelectedRowIndices,
      [],
      undefined,
    );
    expect(result).toEqual([]);
  });

  it("With selected indices and no primaryColumnid", () => {
    const oldTableData = [
      {
        step: "#1",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 0,
        __primaryKey__: "#1",
      },
      {
        step: "#2",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 1,
        __primaryKey__: "#2",
      },
      {
        step: "#3",
        task: "Bind the query  => fetch_users.data",
        status: "--",
        __originalIndex__: 2,
        __primaryKey__: "#3",
      },
    ];
    const newTableData = [
      {
        step: "#1",
        task: " a fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 0,
        __primaryKey__: "#1",
      },
      {
        step: "#2",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 1,
        __primaryKey__: "#2",
      },
      {
        step: "#3",
        task: "Bind the query  => fetch_users.data",
        status: "--",
        __originalIndex__: 2,
        __primaryKey__: "#3",
      },
    ];
    const defaultSelectedRowIndices = undefined;
    const result = getSelectRowIndices(
      oldTableData,
      newTableData,
      defaultSelectedRowIndices,
      [0],
      undefined,
    );
    expect(result).toEqual([]);
  });

  it("With selected indices and primaryColumnid", () => {
    const oldTableData = [
      {
        step: "#1",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 0,
        __primaryKey__: "#1",
      },
      {
        step: "#2",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 1,
        __primaryKey__: "#2",
      },
      {
        step: "#3",
        task: "Bind the query  => fetch_users.data",
        status: "--",
        __originalIndex__: 2,
        __primaryKey__: "#3",
      },
    ];
    const newTableData = [
      {
        step: "#1",
        task: " a fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 0,
        __primaryKey__: "#1",
      },
      {
        step: "#2",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 1,
        __primaryKey__: "#2",
      },
      {
        step: "#3",
        task: "Bind the query  => fetch_users.data",
        status: "--",
        __originalIndex__: 2,
        __primaryKey__: "#3",
      },
    ];
    const defaultSelectedRowIndices = undefined;
    const result = getSelectRowIndices(
      oldTableData,
      newTableData,
      defaultSelectedRowIndices,
      [0],
      "step",
    );
    expect(result).toEqual([0]);
  });

  it("With selected indices, primaryColumnid and new order", () => {
    const oldTableData = [
      {
        step: "#1",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 0,
        __primaryKey__: "#1",
      },
      {
        step: "#2",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 1,
        __primaryKey__: "#2",
      },
      {
        step: "#3",
        task: "Bind the query  => fetch_users.data",
        status: "--",
        __originalIndex__: 2,
        __primaryKey__: "#3",
      },
    ];
    const newTableData = [
      {
        step: "#3",
        task: "Bind the query  => fetch_users.data",
        status: "--",
        __originalIndex__: 0,
        __primaryKey__: "#3",
      },
      {
        step: "#2",
        task: "fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 1,
        __primaryKey__: "#2",
      },
      {
        step: "#1",
        task: " a fetch_users with the Mock DB",
        status: "--",
        __originalIndex__: 2,
        __primaryKey__: "#1",
      },
    ];
    const defaultSelectedRowIndices = undefined;
    const result = getSelectRowIndices(
      oldTableData,
      newTableData,
      defaultSelectedRowIndices,
      [0, 2],
      "step",
    );
    expect(result).toEqual([2, 0]);
  });
});

describe("getAllTableColumnKeys - ", () => {
  it("should test with a valid tableData", () => {
    const tableData = [
      {
        name: "jest",
        type: "unit",
      },
      {
        name: "cypress",
        type: "integration",
      },
    ];

    expect(getAllTableColumnKeys(tableData)).toEqual(["name", "type"]);
  });

  it("should test with a valid tableData with varying schema", () => {
    const tableData = [
      {
        name: "jest",
        type: "unit",
        typescript: true,
      },
      {
        name: "cypress",
        type: "integration",
        coverage: "56%",
      },
    ];

    expect(getAllTableColumnKeys(tableData)).toEqual([
      "name",
      "type",
      "typescript",
      "coverage",
    ]);
  });

  it("should test with a empty tableData", () => {
    expect(getAllTableColumnKeys([] as Array<Record<string, unknown>>)).toEqual(
      [],
    );
  });

  it("should test with undefined", () => {
    expect(
      getAllTableColumnKeys(
        (undefined as any) as Array<Record<string, unknown>>,
      ),
    ).toEqual([]);
  });
});

describe("getTableStyles - ", () => {
  it("should test with valid values", () => {
    expect(
      (getTableStyles({
        textColor: "#fff",
        textSize: "HEADING1",
        fontStyle: "12",
        cellBackground: "#f00",
        verticalAlignment: "TOP",
        horizontalAlignment: "CENTER",
      }) as any) as TableStyles,
    ).toEqual({
      textColor: "#fff",
      textSize: "HEADING1",
      fontStyle: "12",
      cellBackground: "#f00",
      verticalAlignment: "TOP",
      horizontalAlignment: "CENTER",
    });
  });
});

describe("getDerivedColumns - ", () => {
  it("should check with primary columns without derived columns", () => {
    const primaryColumns = {
      column1: {
        isDerived: false,
        id: "column1",
      },
      column2: {
        isDerived: false,
        id: "column2",
      },
      column3: {
        isDerived: false,
        id: "column3",
      },
    };

    expect(
      getDerivedColumns(
        (primaryColumns as any) as Record<string, ColumnProperties>,
      ),
    ).toEqual({});
  });

  it("should check with primary columns with derived columns", () => {
    const primaryColumns = {
      column1: {
        isDerived: true,
        id: "column1",
      },
      column2: {
        isDerived: false,
        id: "column2",
      },
      column3: {
        isDerived: false,
        id: "column3",
      },
    };

    expect(
      getDerivedColumns(
        (primaryColumns as any) as Record<string, ColumnProperties>,
      ),
    ).toEqual({
      column1: {
        isDerived: true,
        id: "column1",
      },
    });
  });

  it("should check with primary columns with all derived columns", () => {
    const primaryColumns = {
      column1: {
        isDerived: true,
        id: "column1",
      },
      column2: {
        isDerived: true,
        id: "column2",
      },
      column3: {
        isDerived: true,
        id: "column3",
      },
    };

    expect(
      getDerivedColumns(
        (primaryColumns as any) as Record<string, ColumnProperties>,
      ),
    ).toEqual({
      column1: {
        isDerived: true,
        id: "column1",
      },
      column2: {
        isDerived: true,
        id: "column2",
      },
      column3: {
        isDerived: true,
        id: "column3",
      },
    });
  });

  it("should check with undefined", () => {
    expect(
      getDerivedColumns((undefined as any) as Record<string, ColumnProperties>),
    ).toEqual({});
  });

  it("should check with simple string", () => {
    expect(
      getDerivedColumns(("test" as any) as Record<string, ColumnProperties>),
    ).toEqual({});
  });

  it("should check with number", () => {
    expect(
      getDerivedColumns((1 as any) as Record<string, ColumnProperties>),
    ).toEqual({});
  });
});

describe("escapeString", () => {
  it("should test that string without quotes are retured as it is", () => {
    ["column", "1", "columnNameThatIsReallyLong"].forEach((str) => {
      expect(escapeString(str)).toBe(str);
    });
  });

  it("should test that string with quotes are escaped correctly", () => {
    [
      {
        input: `column"`,
        output: `column\"`,
      },
      {
        input: `1"`,
        output: `1\"`,
      },
      {
        input: `columnName " ThatIsReallyLong`,
        output: `columnName \" ThatIsReallyLong`,
      },
    ].forEach(({ input, output }) => {
      expect(escapeString(input)).toBe(output);
    });
  });

  it("should test that string with escaped quotes are returned as it is", () => {
    [
      `column\"`,
      `column\\\"`,
      `column\\\\\"`,
      `col\\\\\"umn\\\\\"`,
      `1\"`,
      `columnNameThatIsReallyLong\"`,
    ].forEach((str) => {
      expect(escapeString(str)).toBe(str);
    });
  });
});

const MOCK_COLUMNS: Record<string, any> = {
  id: {
    isDerived: false,
    computedValue: getCurrentRowBinding("Table1", "currentRow.id"),
    textSize: "PARAGRAPH",
    index: 0,
    isVisible: true,
    label: "id",
    columnType: "text",
    horizontalAlignment: "LEFT",
    width: 150,
    enableFilter: true,
    enableSort: true,
    id: "id",
    verticalAlignment: "CENTER",
    isEditable: false,
    isCellEditable: false,
    allowCellWrapping: false,
  },

  name: {
    index: 1,
    width: 150,
    id: "name",
    horizontalAlignment: "LEFT",
    verticalAlignment: "CENTER",
    columnType: "text",
    textSize: "PARAGRAPH",
    enableFilter: true,
    enableSort: true,
    isVisible: true,
    isDerived: false,
    label: "name",
    computedValue: getCurrentRowBinding("Table1", "currentRow.name"),
    isEditable: false,
    isCellEditable: false,
    allowCellWrapping: false,
  },
  createdAt: {
    index: 2,
    width: 150,
    id: "createdAt",
    horizontalAlignment: "LEFT",
    verticalAlignment: "CENTER",
    columnType: "text",
    textSize: "PARAGRAPH",
    enableFilter: true,
    enableSort: true,
    isVisible: true,
    isDerived: false,
    label: "createdAt",
    computedValue: getCurrentRowBinding("Table1", "currentRow.createdAt"),
    isEditable: false,
    isCellEditable: false,
    allowCellWrapping: false,
  },
  updatedAt: {
    index: 3,
    width: 150,
    id: "updatedAt",
    horizontalAlignment: "LEFT",
    verticalAlignment: "CENTER",
    columnType: "text",
    textSize: "PARAGRAPH",
    enableFilter: true,
    enableSort: true,
    isVisible: true,
    isDerived: false,
    label: "updatedAt",
    computedValue: getCurrentRowBinding("Table1", "currentRow.updatedAt"),
    isEditable: false,
    isCellEditable: false,
    allowCellWrapping: false,
  },
  status: {
    index: 4,
    width: 150,
    id: "status",
    horizontalAlignment: "LEFT",
    verticalAlignment: "CENTER",
    columnType: "text",
    textSize: "PARAGRAPH",
    enableFilter: true,
    enableSort: true,
    isVisible: true,
    isDerived: false,
    label: "status",
    computedValue: getCurrentRowBinding("Table1", "currentRow.status"),
    isEditable: false,
    isCellEditable: false,
    allowCellWrapping: false,
  },
  gender: {
    index: 5,
    width: 150,
    id: "gender",
    horizontalAlignment: "LEFT",
    verticalAlignment: "CENTER",
    columnType: "text",
    textSize: "PARAGRAPH",
    enableFilter: true,
    enableSort: true,
    isVisible: true,
    isDerived: false,
    label: "gender",
    computedValue: getCurrentRowBinding("Table1", "currentRow.gender"),
    isEditable: false,
    isCellEditable: false,
    allowCellWrapping: false,
  },
  avatar: {
    index: 6,
    width: 150,
    id: "avatar",
    horizontalAlignment: "LEFT",
    verticalAlignment: "CENTER",
    columnType: "text",
    textSize: "PARAGRAPH",
    enableFilter: true,
    enableSort: true,
    isVisible: true,
    isDerived: false,
    label: "avatar",
    computedValue: getCurrentRowBinding("Table1", "currentRow.avatar"),
    isEditable: false,
    isCellEditable: false,
    allowCellWrapping: false,
  },
  address: {
    index: 8,
    width: 150,
    id: "address",
    horizontalAlignment: "LEFT",
    verticalAlignment: "CENTER",
    columnType: "text",
    textSize: "PARAGRAPH",
    enableFilter: true,
    enableSort: true,
    isVisible: true,
    isDerived: false,
    label: "address",
    computedValue: getCurrentRowBinding("Table1", "currentRow.address"),
    isEditable: false,
    isCellEditable: false,
    allowCellWrapping: false,
  },
  role: {
    index: 9,
    id: "role",
    horizontalAlignment: "LEFT",
    verticalAlignment: "CENTER",
    columnType: "text",
    textSize: "PARAGRAPH",
    enableFilter: true,
    enableSort: true,
    isVisible: true,
    isDerived: false,
    width: 150,
    label: "address",
    computedValue: getCurrentRowBinding("Table1", "currentRow.address"),
    isEditable: false,
    isCellEditable: false,
    allowCellWrapping: false,
  },
  dob: {
    index: 10,
    width: 150,
    id: "dob",
    horizontalAlignment: "LEFT",
    verticalAlignment: "CENTER",
    columnType: "text",
    textSize: "PARAGRAPH",
    enableFilter: true,
    enableSort: true,
    isVisible: true,
    isDerived: false,
    label: "dob",
    computedValue: getCurrentRowBinding("Table1", "currentRow.dob"),
    isEditable: false,
    isCellEditable: false,
    allowCellWrapping: false,
  },
  phoneNo: {
    index: 11,
    width: 150,
    id: "phoneNo",
    horizontalAlignment: "LEFT",
    verticalAlignment: "CENTER",
    columnType: "text",
    textSize: "PARAGRAPH",
    enableFilter: true,
    enableSort: true,
    isVisible: true,
    isDerived: false,
    label: "phoneNo",
    computedValue: getCurrentRowBinding("Table1", "currentRow.phoneNo"),
    isEditable: false,
    isCellEditable: false,
    allowCellWrapping: false,
  },
  email: {
    isDerived: false,
    computedValue: getCurrentRowBinding("Table1", "currentRow.email"),
    textSize: "PARAGRAPH",
    index: 1,
    isVisible: true,
    label: "email",
    columnType: "text",
    horizontalAlignment: "LEFT",
    width: 150,
    enableFilter: true,
    enableSort: true,
    id: "email",
    verticalAlignment: "CENTER",
    isEditable: false,
    isCellEditable: false,
    allowCellWrapping: false,
  },
};

describe("reorderColumns", () => {
  it("correctly reorders columns", () => {
    const columnOrder = [
      "phoneNo",
      "id",
      "name",
      "createdAt",
      "updatedAt",
      "status",
      "gender",
      "avatar",
      "email",
      "address",
      "role",
      "dob",
    ];

    const expected = {
      phoneNo: {
        index: 0,
        width: 150,
        id: "phoneNo",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "text",
        textSize: "PARAGRAPH",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isDerived: false,
        label: "phoneNo",
        computedValue: getCurrentRowBinding("Table1", "currentRow.phoneNo"),
        isEditable: false,
        isCellEditable: false,
        allowCellWrapping: false,
      },
      id: {
        isDerived: false,
        computedValue: getCurrentRowBinding("Table1", "currentRow.id"),
        textSize: "PARAGRAPH",
        index: 1,
        isVisible: true,
        label: "id",
        columnType: "text",
        horizontalAlignment: "LEFT",
        width: 150,
        enableFilter: true,
        enableSort: true,
        id: "id",
        verticalAlignment: "CENTER",
        isEditable: false,
        isCellEditable: false,
        allowCellWrapping: false,
      },
      name: {
        index: 2,
        width: 150,
        id: "name",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "text",
        textSize: "PARAGRAPH",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isDerived: false,
        label: "name",
        computedValue: getCurrentRowBinding("Table1", "currentRow.name"),
        isEditable: false,
        isCellEditable: false,
        allowCellWrapping: false,
      },
      createdAt: {
        index: 3,
        width: 150,
        id: "createdAt",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "text",
        textSize: "PARAGRAPH",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isDerived: false,
        label: "createdAt",
        computedValue: getCurrentRowBinding("Table1", "currentRow.createdAt"),
        isEditable: false,
        isCellEditable: false,
        allowCellWrapping: false,
      },
      updatedAt: {
        index: 4,
        width: 150,
        id: "updatedAt",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "text",
        textSize: "PARAGRAPH",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isDerived: false,
        label: "updatedAt",
        computedValue: getCurrentRowBinding("Table1", "currentRow.updatedAt"),
        isEditable: false,
        isCellEditable: false,
        allowCellWrapping: false,
      },
      status: {
        index: 5,
        width: 150,
        id: "status",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "text",
        textSize: "PARAGRAPH",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isDerived: false,
        label: "status",
        computedValue: getCurrentRowBinding("Table1", "currentRow.status"),
        isEditable: false,
        isCellEditable: false,
        allowCellWrapping: false,
      },
      gender: {
        index: 6,
        width: 150,
        id: "gender",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "text",
        textSize: "PARAGRAPH",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isDerived: false,
        label: "gender",
        computedValue: getCurrentRowBinding("Table1", "currentRow.gender"),
        isEditable: false,
        isCellEditable: false,
        allowCellWrapping: false,
      },
      avatar: {
        index: 7,
        width: 150,
        id: "avatar",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "text",
        textSize: "PARAGRAPH",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isDerived: false,
        label: "avatar",
        computedValue: getCurrentRowBinding("Table1", "currentRow.avatar"),
        isEditable: false,
        isCellEditable: false,
        allowCellWrapping: false,
      },
      email: {
        isDerived: false,
        computedValue: getCurrentRowBinding("Table1", "currentRow.email"),
        textSize: "PARAGRAPH",
        index: 8,
        isVisible: true,
        label: "email",
        columnType: "text",
        horizontalAlignment: "LEFT",
        width: 150,
        enableFilter: true,
        enableSort: true,
        id: "email",
        verticalAlignment: "CENTER",
        isEditable: false,
        isCellEditable: false,
        allowCellWrapping: false,
      },
      address: {
        index: 9,
        width: 150,
        id: "address",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "text",
        textSize: "PARAGRAPH",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isDerived: false,
        label: "address",
        computedValue: getCurrentRowBinding("Table1", "currentRow.address"),
        isEditable: false,
        isCellEditable: false,
        allowCellWrapping: false,
      },
      role: {
        index: 10,
        id: "role",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "text",
        textSize: "PARAGRAPH",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isDerived: false,
        width: 150,
        label: "address",
        computedValue: getCurrentRowBinding("Table1", "currentRow.address"),
        isEditable: false,
        isCellEditable: false,
        allowCellWrapping: false,
      },
      dob: {
        index: 11,
        width: 150,
        id: "dob",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "text",
        textSize: "PARAGRAPH",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isDerived: false,
        label: "dob",
        computedValue: getCurrentRowBinding("Table1", "currentRow.dob"),
        isEditable: false,
        isCellEditable: false,
        allowCellWrapping: false,
      },
    };

    const result = reorderColumns(MOCK_COLUMNS, columnOrder);

    expect(expected).toEqual(result);
  });

  it("Ignores duplicates in column order and includes all columns", () => {
    const columnOrder = [
      "phoneNo",
      "id",
      "name",
      "createdAt",
      "updatedAt",
      "status",
      "status",
      "gender",
      "avatar",
      "email",
    ];

    const expected = {
      phoneNo: {
        index: 0,
        width: 150,
        id: "phoneNo",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "text",
        textSize: "PARAGRAPH",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isDerived: false,
        label: "phoneNo",
        computedValue: getCurrentRowBinding("Table1", "currentRow.phoneNo"),
        allowCellWrapping: false,
        isCellEditable: false,
        isEditable: false,
      },
      id: {
        isDerived: false,
        computedValue: getCurrentRowBinding("Table1", "currentRow.id"),
        textSize: "PARAGRAPH",
        index: 1,
        isVisible: true,
        label: "id",
        columnType: "text",
        horizontalAlignment: "LEFT",
        width: 150,
        enableFilter: true,
        enableSort: true,
        id: "id",
        verticalAlignment: "CENTER",
        allowCellWrapping: false,
        isCellEditable: false,
        isEditable: false,
      },
      name: {
        index: 2,
        width: 150,
        id: "name",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "text",
        textSize: "PARAGRAPH",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isDerived: false,
        label: "name",
        computedValue: getCurrentRowBinding("Table1", "currentRow.name"),
        allowCellWrapping: false,
        isCellEditable: false,
        isEditable: false,
      },
      createdAt: {
        index: 3,
        width: 150,
        id: "createdAt",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "text",
        textSize: "PARAGRAPH",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isDerived: false,
        label: "createdAt",
        computedValue: getCurrentRowBinding("Table1", "currentRow.createdAt"),
        allowCellWrapping: false,
        isCellEditable: false,
        isEditable: false,
      },
      updatedAt: {
        index: 4,
        width: 150,
        id: "updatedAt",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "text",
        textSize: "PARAGRAPH",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isDerived: false,
        label: "updatedAt",
        computedValue: getCurrentRowBinding("Table1", "currentRow.updatedAt"),
        allowCellWrapping: false,
        isCellEditable: false,
        isEditable: false,
      },
      status: {
        index: 5,
        width: 150,
        id: "status",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "text",
        textSize: "PARAGRAPH",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isDerived: false,
        label: "status",
        computedValue: getCurrentRowBinding("Table1", "currentRow.status"),
        allowCellWrapping: false,
        isCellEditable: false,
        isEditable: false,
      },
      gender: {
        index: 6,
        width: 150,
        id: "gender",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "text",
        textSize: "PARAGRAPH",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isDerived: false,
        label: "gender",
        computedValue: getCurrentRowBinding("Table1", "currentRow.gender"),
        allowCellWrapping: false,
        isCellEditable: false,
        isEditable: false,
      },
      avatar: {
        index: 7,
        width: 150,
        id: "avatar",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "text",
        textSize: "PARAGRAPH",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isDerived: false,
        label: "avatar",
        computedValue: getCurrentRowBinding("Table1", "currentRow.avatar"),
        allowCellWrapping: false,
        isCellEditable: false,
        isEditable: false,
      },
      email: {
        isDerived: false,
        computedValue: getCurrentRowBinding("Table1", "currentRow.email"),
        textSize: "PARAGRAPH",
        index: 8,
        isVisible: true,
        label: "email",
        columnType: "text",
        horizontalAlignment: "LEFT",
        width: 150,
        enableFilter: true,
        enableSort: true,
        id: "email",
        verticalAlignment: "CENTER",
        allowCellWrapping: false,
        isCellEditable: false,
        isEditable: false,
      },
      address: {
        index: 9,
        width: 150,
        id: "address",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "text",
        textSize: "PARAGRAPH",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isDerived: false,
        label: "address",
        computedValue: getCurrentRowBinding("Table1", "currentRow.address"),
        allowCellWrapping: false,
        isCellEditable: false,
        isEditable: false,
      },
      role: {
        index: 10,
        id: "role",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "text",
        textSize: "PARAGRAPH",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isDerived: false,
        width: 150,
        label: "address",
        computedValue: getCurrentRowBinding("Table1", "currentRow.address"),
        allowCellWrapping: false,
        isCellEditable: false,
        isEditable: false,
      },
      dob: {
        index: 11,
        width: 150,
        id: "dob",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "text",
        textSize: "PARAGRAPH",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isDerived: false,
        label: "dob",
        computedValue: getCurrentRowBinding("Table1", "currentRow.dob"),
        allowCellWrapping: false,
        isCellEditable: false,
        isEditable: false,
      },
    };

    const result = reorderColumns(MOCK_COLUMNS, columnOrder);
    expect(expected).toEqual(result);
  });
});

describe("getColumnType", () => {
  const tableData = [
    {
      id: 1,
      gender: "female",
      latitude: -45.7997,
      longitude: null,
      dob: null,
      phone: null,
      email: "bene@bene.bene",
      image: "https://randomuser.me/api/portraits/med/women/39.jpg",
      country: "Germany",
      name: "Bene",
      checked: true,
    },
    {
      id: 2,
      gender: "male",
      latitude: "42.9756",
      longitude: null,
      dob: null,
      phone: null,
      email: "alice@example.com",
      image: "https://randomuser.me/api/portraits/med/women/6.jpg",
      country: "Netherlandss",
      name: "AliceBggg11144",
      checked: false,
    },
    {
      id: 3,
      gender: "female",
      latitude: "-14.0884",
      longitude: 27.0428,
      dob: null,
      phone: null,
      email: null,
      image: "https://randomuser.me/api/portraits/med/women/88.jpg",
      country: "Norway",
      name: null,
      checked: true,
    },
    {
      id: 4,
      gender: "male",
      latitude: "-88.0169",
      longitude: "-118.7708",
      dob: "1984-02-25T07:31:12.723Z",
      phone: "594-620-3202",
      email: "jack.frost@example.com",
      image: "https://randomuser.me/api/portraits/med/men/52.jpg",
      country: "Cornwall",
      name: "Jack1",
    },
    {
      id: 5,
      gender: "female",
      latitude: "73.6320",
      longitude: "-167.3976",
      dob: null,
      phone: null,
      email: "",
      image: "https://randomuser.me/api/portraits/med/women/91.jpg",
      country: "United Kingdom",
      name: "Sue",
      premium: false,
    },
    {
      id: 6,
      gender: "male",
      latitude: "86.1891",
      longitude: "-56.8442",
      dob: "1959-02-20T02:42:20.579Z",
      phone: "61521059",
      email: "mohamad.persson@example.com",
      image: "https://randomuser.me/api/portraits/med/men/58.jpg",
      country: "Norway",
      name: "Allih Persson",
    },
    {
      id: 7,
      gender: "male",
      latitude: "-83.6654",
      longitude: "87.6481",
      dob: "1952-02-22T18:47:29.476Z",
      phone: "(212)-051-1147",
      email: "julia.armstrong@example.com",
      image: "https://randomuser.me/api/portraits/med/women/30.jpg",
      country: "United States",
      name: "Julia Armstrong",
    },
    {
      id: 8,
      gender: "female",
      latitude: "38.7394",
      longitude: "-31.7919",
      dob: "1955-10-07T11:31:49.823Z",
      phone: "(817)-164-4040",
      email: "shiva.duijf@example.com",
      image: "https://randomuser.me/api/portraits/med/women/88.jpg",
      country: "Netherlands",
      name: "Shiva Duijf",
    },
    {
      id: 9,
      gender: "male",
      latitude: "4.5623",
      longitude: "9.0901",
      dob: null,
      phone: null,
      email: null,
      image: "https://randomuser.me/api/portraits/med/men/30.jpg",
      country: "Norway",
      name: null,
    },
    {
      id: 10,
      gender: "male",
      latitude: "-49.4156",
      longitude: "-132.3755",
      dob: "1977-03-27T02:12:01.151Z",
      phone: "212-355-8035",
      email: "david.mackay@example.com",
      image: "https://randomuser.me/api/portraits/med/men/73.jpg",
      country: "Canada",
      name: "David Mackay",
    },
  ];

  it("returns NUMBER column type for number value", () => {
    const result = getColumnType(tableData, "id");
    expect(ColumnTypes.NUMBER).toEqual(result);
  });

  it("returns TEXT column type for empty columnKey", () => {
    const result = getColumnType(tableData, "");
    expect(ColumnTypes.TEXT).toEqual(result);
  });

  it("returns TEXT column type for string value", () => {
    const result = getColumnType(tableData, "gender");
    expect(ColumnTypes.TEXT).toEqual(result);
  });

  it("returns TEXT column type for string columnKey that does not exist in tableData", () => {
    const result = getColumnType(tableData, "coordinates");
    expect(ColumnTypes.TEXT).toEqual(result);
  });

  it("returns CHECKBOX column type for columnKey that has boolean columnValue", () => {
    const result = getColumnType(tableData, "checked");
    expect(ColumnTypes.CHECKBOX).toEqual(result);
  });

  it("returns proper column type for columnKey that has first few rows data as null", () => {
    const result = getColumnType(tableData, "longitude");
    expect(ColumnTypes.NUMBER).toEqual(result);
  });

  it("returns proper column type for columnKey that does not exist in the first few rows", () => {
    const result = getColumnType(tableData, "premium");
    expect(ColumnTypes.CHECKBOX).toEqual(result);
  });

  it("returns Date column type for valid Date field", () => {
    const result = getColumnType(tableData, "dob");
    expect(ColumnTypes.DATE).toEqual(result);
  });
});
