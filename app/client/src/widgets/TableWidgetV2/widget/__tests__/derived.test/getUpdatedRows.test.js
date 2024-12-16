import _ from "lodash";
import moment from "moment";
import derivedProperty from "../../derived";
import { samplePrimaryColumns, sampleProcessedTableData } from "../fixture";

describe("getUpdatedRows -", () => {
  it("should test that it returns empty array when transientTableData is empty", () => {
    const { getUpdatedRows } = derivedProperty;

    expect(
      getUpdatedRows(
        {
          transientTableData: {},
        },
        null,
        _,
      ),
    ).toEqual([]);
  });

  it("should test that it returns empty array when transientTableData is null", () => {
    const { getUpdatedRows } = derivedProperty;

    expect(
      getUpdatedRows(
        {
          transientTableData: null,
        },
        null,
        _,
      ),
    ).toEqual([]);
  });

  it("should test that it returns empty array when transientTableData is undefined", () => {
    const { getUpdatedRows } = derivedProperty;

    expect(
      getUpdatedRows(
        {
          transientTableData: null,
        },
        null,
        _,
      ),
    ).toEqual([]);
  });

  it("should test that it returns expected array when transientTableData has data with invalid index", () => {
    const { getUpdatedRows } = derivedProperty;

    const input = {
      transientTableData: {
        test: {
          column1: "newValue",
        },
      },
      processedTableData: [
        {
          column1: "oldValue",
          column2: "oldValue",
          __originalIndex__: 0,
        },
        {
          column1: "newValue",
          column2: "oldValue",
          __originalIndex__: 1,
        },
      ],
    };

    const expected = [];

    expect(getUpdatedRows(input, null, _)).toEqual(expected);
  });

  it("should test that it returns expected array when transientTableData has data", () => {
    const { getUpdatedRows } = derivedProperty;

    const input = {
      transientTableData: {
        1: {
          column1: "newValue",
        },
      },
      processedTableData: [
        {
          column1: "oldValue",
          column2: "oldValue",
          __originalIndex__: 0,
        },
        {
          column1: "newValue",
          column2: "oldValue",
          __originalIndex__: 1,
        },
      ],
    };

    const expected = [
      {
        index: 1,
        updatedFields: {
          column1: "newValue",
        },
        allFields: {
          column1: "newValue",
          column2: "oldValue",
        },
      },
    ];

    expect(getUpdatedRows(input, null, _)).toEqual(expected);
  });

  it("should test that it returns expected array when transientTableData has data with primary column", () => {
    const { getUpdatedRows } = derivedProperty;

    const input = {
      primaryColumnId: "column2",
      transientTableData: {
        1: {
          column1: "newValue",
        },
      },
      processedTableData: [
        {
          column1: "oldValue1",
          column2: "oldValue1",
          __originalIndex__: 0,
        },
        {
          column1: "newValue",
          column2: "oldValue2",
          __originalIndex__: 1,
        },
      ],
    };

    const expected = [
      {
        index: 1,
        column2: "oldValue2",
        updatedFields: {
          column1: "newValue",
        },
        allFields: {
          column1: "newValue",
          column2: "oldValue2",
        },
      },
    ];

    expect(getUpdatedRows(input, null, _)).toEqual(expected);
  });

  it("should test that it returns expected array when transientTableData has data with primary column and bigger tableData", () => {
    const { getUpdatedRows } = derivedProperty;

    const input = {
      primaryColumnId: "column3",
      transientTableData: {
        1: {
          column1: "newValue",
          column2: "newValue1",
        },
      },
      processedTableData: [
        {
          column1: "oldValue1",
          column2: "oldValue1",
          column3: "oldValue1",
          __originalIndex__: 0,
        },
        {
          column1: "newValue",
          column2: "newValue1",
          column3: "oldValue2",
          __originalIndex__: 1,
        },
        {
          column1: "oldValue3",
          column2: "oldValue3",
          column3: "oldValue3",
          __originalIndex__: 2,
        },
        {
          column1: "oldValue3",
          column2: "oldValue3",
          column3: "oldValue4",
          __originalIndex__: 3,
        },
      ],
    };

    const expected = [
      {
        index: 1,
        column3: "oldValue2",
        updatedFields: {
          column1: "newValue",
          column2: "newValue1",
        },
        allFields: {
          column1: "newValue",
          column2: "newValue1",
          column3: "oldValue2",
        },
      },
    ];

    expect(getUpdatedRows(input, null, _)).toEqual(expected);
  });

  it("Verify for removal of non data columns", () => {
    const { getUpdatedRows } = derivedProperty;
    const input = {
      transientTableData: {
        0: {
          task: "Drop a table first",
        },
      },
      primaryColumnId: "step",
      processedTableData: sampleProcessedTableData,
      primaryColumns: samplePrimaryColumns,
    };

    expect(getUpdatedRows(input, moment, _)).toStrictEqual([
      {
        index: 0,
        step: "#1",
        updatedFields: {
          task: "Drop a table first",
        },
        allFields: {
          step: "#1",
          task: "Drop a table",
          status: "✅",
        },
      },
    ]);
  });
});
