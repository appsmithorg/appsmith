import _ from "lodash";
import moment from "moment";
import derivedProperty from "../../derived";
import { samplePrimaryColumns, sampleProcessedTableData } from "./fixture";

describe("validate getUpdatedRow", () => {
  it("should check that valid updated row index returns the valid value", () => {
    const { getUpdatedRow } = derivedProperty;
    const input1 = {
      updatedRowIndex: 1,
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe1", extra: "Extra1", __originalIndex__: 1 },
      ],
    };
    const input2 = {
      updatedRowIndex: 0,
      processedTableData: [
        { id: 1, name: "Lorem Ipsum", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getUpdatedRow(input1, moment, _)).toStrictEqual({
      id: 123,
      name: "John Doe1",
      extra: "Extra1",
    });
    expect(getUpdatedRow(input2, moment, _)).toStrictEqual({
      id: 1,
      name: "Lorem Ipsum",
      extra: "",
    });
  });

  it("should check that it returns empty values when updateRowIndex is invalid or -1", () => {
    const { getUpdatedRow } = derivedProperty;
    const input1 = {
      updatedRowIndex: -1,
      processedTableData: [
        { id: 1, name: "Lorem Ipsum", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };
    const input2 = {
      updatedRowIndex: "dummyIndex",
      processedTableData: [
        { id: 1, name: "Lorem Ipsum", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    const input3 = {
      updatedRowIndex: undefined,
      processedTableData: [
        { id: 1, name: "Lorem Ipsum", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getUpdatedRow(input1, moment, _)).toStrictEqual({
      id: "",
      name: "",
      extra: "",
    });

    expect(getUpdatedRow(input2, moment, _)).toStrictEqual({
      id: "",
      name: "",
      extra: "",
    });

    expect(getUpdatedRow(input3, moment, _)).toStrictEqual({
      id: "",
      name: "",
      extra: "",
    });
  });

  it("should check that it removes non data columns", () => {
    const { getUpdatedRow } = derivedProperty;
    const input = {
      updatedRowIndex: 1,
      processedTableData: sampleProcessedTableData,
      primaryColumns: samplePrimaryColumns,
    };

    expect(getUpdatedRow(input, moment, _)).toStrictEqual({
      step: "#2",
      task: "Create a query fetch_users with the Mock DB",
      status: "--",
    });
  });
});
