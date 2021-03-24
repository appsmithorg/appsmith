import { sortTableFunction } from "components/designSystems/appsmith/TableComponent/CommonUtilities";
import { ColumnTypes } from "components/designSystems/appsmith/TableComponent/Constants";

describe("TableUtilities", () => {
  it("works as expected for sort table rows", () => {
    const filteredTableData: Array<Record<string, unknown>> = [
      {
        url: "https://www.google.com",
      },
      {
        url: "https://www.amazon.com",
      },
    ];
    const expected: Array<Record<string, unknown>> = [
      {
        url: "https://www.amazon.com",
      },
      {
        url: "https://www.google.com",
      },
    ];
    const sortedTableData = sortTableFunction(
      filteredTableData,
      ColumnTypes.URL,
      "url",
      true,
    );
    // console.log(JSON.stringify(sortedTableData));
    expect(sortedTableData).toStrictEqual(expected);
  });
});
