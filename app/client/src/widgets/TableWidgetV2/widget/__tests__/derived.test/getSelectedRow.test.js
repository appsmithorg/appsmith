import _ from "lodash";
import moment from "moment";
import derivedProperty from "../../derived";

import { samplePrimaryColumns, sampleProcessedTableData } from "./fixture";
describe("Validate getSelectedRow function", () => {
  it("Multple row selection, with selected rows", () => {
    const { getSelectedRow } = derivedProperty;
    const input = {
      multiRowSelection: true,
      selectedRowIndices: [0, 1],
      selectedRowIndex: 1,
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getSelectedRow(input, moment, _)).toStrictEqual({
      id: 234,
      name: "Jane Doe",
      extra: "Extra2",
    });
  });

  it("Multple row selection, with no selected rows", () => {
    const { getSelectedRow } = derivedProperty;
    const input = {
      multiRowSelection: true,
      selectedRowIndices: [],
      selectedRowIndex: 1,
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getSelectedRow(input, moment, _)).toStrictEqual({
      id: "",
      name: "",
      extra: "",
    });
  });

  it("Single row selection, with selected row", () => {
    const { getSelectedRow } = derivedProperty;
    const input = {
      multiRowSelection: false,
      selectedRowIndices: [],
      selectedRowIndex: 1,
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getSelectedRow(input, moment, _)).toStrictEqual({
      id: 234,
      name: "Jane Doe",
      extra: "Extra2",
    });
  });

  it("Single row selection, without selected row", () => {
    const { getSelectedRow } = derivedProperty;
    const input = {
      multiRowSelection: true,
      selectedRowIndices: [],
      selectedRowIndex: -1,
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getSelectedRow(input, moment, _)).toStrictEqual({
      id: "",
      name: "",
      extra: "",
    });
  });

  it("should return empty row when selectedRowIndices is a string value 'test'", () => {
    const { getSelectedRow } = derivedProperty;
    const input = {
      multiRowSelection: true,
      selectedRowIndices: ["test"],
      selectedRowIndex: -1,
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getSelectedRow(input, moment, _)).toStrictEqual({
      id: "",
      name: "",
      extra: "",
    });
  });

  it("should return empty row when selectedRowIndices is undefined", () => {
    const { getSelectedRow } = derivedProperty;
    const input = {
      multiRowSelection: true,
      selectedRowIndices: undefined,
      selectedRowIndex: -1,
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getSelectedRow(input, moment, _)).toStrictEqual({
      id: "",
      name: "",
      extra: "",
    });
  });

  it("should return empty row when selectedRowIndices contains undefined value", () => {
    const { getSelectedRow } = derivedProperty;
    const input = {
      multiRowSelection: true,
      selectedRowIndices: [undefined],
      selectedRowIndex: -1,
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getSelectedRow(input, moment, _)).toStrictEqual({
      id: "",
      name: "",
      extra: "",
    });
  });

  it("should return empty row when selectedRowIndices contains null value", () => {
    const { getSelectedRow } = derivedProperty;
    const input = {
      multiRowSelection: true,
      selectedRowIndices: [null],
      selectedRowIndex: -1,
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getSelectedRow(input, moment, _)).toStrictEqual({
      id: "",
      name: "",
      extra: "",
    });
  });

  it("should return empty row when selectedRowIndices contains string numbers", () => {
    const { getSelectedRow } = derivedProperty;
    const input = {
      multiRowSelection: true,
      selectedRowIndices: ["1", "2"],
      selectedRowIndex: -1,
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getSelectedRow(input, moment, _)).toStrictEqual({
      id: "",
      name: "",
      extra: "",
    });
  });

  it("should return empty row when selectedRowIndices is a single string number", () => {
    const { getSelectedRow } = derivedProperty;
    const input = {
      multiRowSelection: true,
      selectedRowIndices: "1",
      selectedRowIndex: -1,
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getSelectedRow(input, moment, _)).toStrictEqual({
      id: "",
      name: "",
      extra: "",
    });
  });

  it("should return empty row when selectedRowIndices is a non-numeric string", () => {
    const { getSelectedRow } = derivedProperty;
    const input = {
      multiRowSelection: true,
      selectedRowIndices: "test",
      selectedRowIndex: -1,
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getSelectedRow(input, moment, _)).toStrictEqual({
      id: "",
      name: "",
      extra: "",
    });
  });

  it("Single row selection should not have non data columns", () => {
    const { getSelectedRow } = derivedProperty;

    const input = {
      multiRowSelection: false,
      selectedRowIndices: [],
      selectedRowIndex: 1,
      processedTableData: sampleProcessedTableData,
      primaryColumns: samplePrimaryColumns,
    };

    expect(getSelectedRow(input, moment, _)).toStrictEqual({
      step: "#2",
      task: "Create a query fetch_users with the Mock DB",
      status: "--",
    });
  });
});
