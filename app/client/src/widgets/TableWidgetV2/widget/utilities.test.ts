import { ColumnProperties, TableStyles } from "../component/Constants";
import {
  getAllTableColumnKeys,
  getDerivedColumns,
  getOriginalRowIndex,
  getSelectRowIndex,
  getSelectRowIndices,
  getTableStyles,
} from "./utilities";

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
