import _ from "lodash";
import moment from "moment";
import derivedProperty from "../../derived";
import { samplePrimaryColumns, sampleProcessedTableData } from "./fixture";

describe("Validate getSelectedRows function", () => {
  it("with valid index", () => {
    const { getSelectedRows } = derivedProperty;
    const input = {
      multiRowSelection: true,
      selectedRowIndices: [1],
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getSelectedRows(input, moment, _)).toStrictEqual([
      {
        id: 234,
        name: "Jane Doe",
        extra: "Extra2",
      },
    ]);
  });

  it("with valid indices", () => {
    const { getSelectedRows } = derivedProperty;
    const input = {
      multiRowSelection: true,
      selectedRowIndices: [0, 1],
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getSelectedRows(input, moment, _)).toStrictEqual([
      {
        id: 1234,
        name: "Jim Doe",
        extra: "",
      },
      {
        id: 234,
        name: "Jane Doe",
        extra: "Extra2",
      },
    ]);
  });

  it("with invalid indices", () => {
    const { getSelectedRows } = derivedProperty;
    const input = {
      selectedRowIndices: [0, "test"],
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getSelectedRows(input, moment, _)).toStrictEqual([]);
  });

  it("with no indices", () => {
    const { getSelectedRows } = derivedProperty;
    const input = {
      selectedRowIndices: [],
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getSelectedRows(input, moment, _)).toStrictEqual([]);
  });

  it("for removal of non data columns", () => {
    const { getSelectedRows } = derivedProperty;
    const input = {
      multiRowSelection: true,
      selectedRowIndices: [1],
      processedTableData: sampleProcessedTableData,
      primaryColumns: samplePrimaryColumns,
    };

    expect(getSelectedRows(input, moment, _)).toStrictEqual([
      {
        step: "#2",
        task: "Create a query fetch_users with the Mock DB",
        status: "--",
      },
    ]);
  });
});
