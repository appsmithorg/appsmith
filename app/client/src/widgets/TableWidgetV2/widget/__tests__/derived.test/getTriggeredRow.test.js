import _ from "lodash";
import moment from "moment";
import derivedProperty from "../../derived";
import { samplePrimaryColumns, sampleProcessedTableData } from "../fixture";

describe("Validate getTriggeredRow function", () => {
  it("with valid triggered row index", () => {
    const { getTriggeredRow } = derivedProperty;
    const input = {
      triggeredRowIndex: 1,
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getTriggeredRow(input, moment, _)).toStrictEqual({
      id: 123,
      name: "John Doe",
      extra: "Extra1",
    });
  });

  it("with valid triggered row index", () => {
    const { getTriggeredRow } = derivedProperty;
    const input = {
      triggeredRowIndex: 0,
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getTriggeredRow(input, moment, _)).toStrictEqual({
      id: 1234,
      name: "Jim Doe",
      extra: "",
    });
  });

  it("with triggered row index -1", () => {
    const { getTriggeredRow } = derivedProperty;
    const input = {
      triggeredRowIndex: -1,
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getTriggeredRow(input, moment, _)).toStrictEqual({
      id: "",
      name: "",
      extra: "",
    });
  });

  it("with invalid triggered row index", () => {
    const { getTriggeredRow } = derivedProperty;
    const input = {
      triggeredRowIndex: "test",
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getTriggeredRow(input, moment, _)).toStrictEqual({
      id: "",
      name: "",
      extra: "",
    });
  });

  it("with invalid triggered row index", () => {
    const { getTriggeredRow } = derivedProperty;
    const input = {
      triggeredRowIndex: undefined,
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getTriggeredRow(input, moment, _)).toStrictEqual({
      id: "",
      name: "",
      extra: "",
    });
  });

  it("for removal of non data columns", () => {
    const { getTriggeredRow } = derivedProperty;
    const input = {
      triggeredRowIndex: 1,
      processedTableData: sampleProcessedTableData,
      primaryColumns: samplePrimaryColumns,
    };

    expect(getTriggeredRow(input, moment, _)).toStrictEqual({
      step: "#2",
      task: "Create a query fetch_users with the Mock DB",
      status: "--",
    });
  });
});
