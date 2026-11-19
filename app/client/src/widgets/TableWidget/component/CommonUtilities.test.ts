import {
  sortTableFunction,
  transformTableDataIntoCsv,
} from "./CommonUtilities";
import type { TableColumnProps } from "./Constants";
import { ColumnTypes } from "./Constants";

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

    expect(sortedTableData).toStrictEqual(expected);
  });
});

describe("TransformTableDataIntoArrayOfArray", () => {
  const columns: TableColumnProps[] = [
    {
      Header: "Id",
      accessor: "id",
      minWidth: 60,
      draggable: true,
      metaProperties: {
        isHidden: false,
        type: "string",
      },
      columnProperties: {
        id: "id",
        label: "Id",
        columnType: "string",
        isVisible: true,
        index: 0,
        width: 60,
        isDerived: false,
        computedValue: "",
      },
    },
  ];

  it("work as expected", () => {
    const data = [
      {
        id: "abc",
      },
      {
        id: "xyz",
      },
    ];
    const csvData = transformTableDataIntoCsv({
      columns,
      data,
    });
    const expectedCsvData = [["Id"], ["abc"], ["xyz"]];

    expect(JSON.stringify(csvData)).toStrictEqual(
      JSON.stringify(expectedCsvData),
    );
  });
  it("work as expected with newline", () => {
    const data = [
      {
        id: "abc\ntest",
      },
      {
        id: "xyz",
      },
    ];
    const csvData = transformTableDataIntoCsv({
      columns,
      data,
    });
    const expectedCsvData = [["Id"], ["abc test"], ["xyz"]];

    expect(JSON.stringify(csvData)).toStrictEqual(
      JSON.stringify(expectedCsvData),
    );
  });
  it("work as expected with comma", () => {
    const data = [
      {
        id: "abc,test",
      },
      {
        id: "xyz",
      },
    ];
    const csvData = transformTableDataIntoCsv({
      columns,
      data,
    });
    const expectedCsvData = [["Id"], ['"abc,test"'], ["xyz"]];

    expect(JSON.stringify(csvData)).toStrictEqual(
      JSON.stringify(expectedCsvData),
    );
  });

  it("neutralizes spreadsheet formula prefixes in CSV cells", () => {
    const data = [
      { id: "=1+2" },
      { id: "+1234" },
      { id: "-5" },
      { id: "@SUM(A1)" },
      { id: "safe" },
    ];
    const csvData = transformTableDataIntoCsv({
      columns,
      data,
    });
    const expectedCsvData = [
      ["Id"],
      ["'=1+2"],
      ["'+1234"],
      ["'-5"],
      ["'@SUM(A1)"],
      ["safe"],
    ];

    expect(JSON.stringify(csvData)).toStrictEqual(
      JSON.stringify(expectedCsvData),
    );
  });

  it("quotes and escapes embedded quotes so formula neutralization cannot be bypassed", () => {
    const data = [{ id: '"=1+2"' }, { id: 'He said "hi"' }];
    const csvData = transformTableDataIntoCsv({
      columns,
      data,
    });
    // Logical value `"=1+2"` stays that text after parse; not decoded to `=1+2`.
    const expectedCsvData = [["Id"], ['"""=1+2"""'], ['"He said ""hi"""']];

    expect(JSON.stringify(csvData)).toStrictEqual(
      JSON.stringify(expectedCsvData),
    );
  });
});
