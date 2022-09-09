import { getCellText } from "./DefaultCell";
import { ColumnTypes } from "widgets/TableWidgetV2/constants";

describe("DefaultRendere - ", () => {
  describe("getCellText", () => {
    it("should test with different values", () => {
      [
        {
          value: "#1",
          cellProperties: { displayText: "test" },
          columnType: ColumnTypes.TEXT,
          expected: "#1",
        },
        {
          value: 1,
          cellProperties: { displayText: "test" },
          columnType: ColumnTypes.TEXT,
          expected: "1",
        },
        {
          value: true,
          cellProperties: { displayText: "test" },
          columnType: ColumnTypes.TEXT,
          expected: "true",
        },
        {
          value: undefined,
          cellProperties: { displayText: "test" },
          columnType: ColumnTypes.TEXT,
          expected: "",
        },
        {
          value: null,
          cellProperties: { displayText: "test" },
          columnType: ColumnTypes.TEXT,
          expected: "",
        },
        {
          value: NaN,
          cellProperties: { displayText: "test" },
          columnType: ColumnTypes.TEXT,
          expected: "",
        },
        {
          value: "www.appsmith.com",
          cellProperties: { displayText: "test" },
          columnType: ColumnTypes.URL,
          expected: "test",
        },
        {
          value: { test: 1 },
          cellProperties: { displayText: "test" },
          columnType: ColumnTypes.TEXT,
          expected: "[object Object]",
        },
      ].forEach((testValue) => {
        expect(
          getCellText(
            testValue.value,
            testValue.columnType,
            testValue.cellProperties.displayText,
          ),
        ).toEqual(testValue.expected);
      });
    });
  });
});
