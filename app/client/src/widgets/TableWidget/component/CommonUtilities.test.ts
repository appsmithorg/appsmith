import {
  sortTableFunction,
  transformTableDataIntoCsv,
  transformTableDataIntoExcel,
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

  it("neutralizes spreadsheet formula prefixes in CSV cells and headers", () => {
    const formulaColumns: TableColumnProps[] = [
      {
        ...columns[0],
        Header: "=HEADER()",
      },
    ];
    const data = [
      { id: "=1+2" },
      { id: "+1234" },
      { id: "-5" },
      { id: "@SUM(A1)" },
      { id: "\t=cmd" },
      { id: "\r=cmd" },
      { id: "line1\nline2\n=cmd" },
      { id: "=1,2" },
      { id: "safe" },
    ];
    const csvData = transformTableDataIntoCsv({
      columns: formulaColumns,
      data,
    });
    const expectedCsvData = [
      ["'=HEADER()"],
      ["'=1+2"],
      ["'+1234"],
      ["'-5"],
      ["'@SUM(A1)"],
      ["'\t=cmd"],
      ["' =cmd"],
      ["line1 line2 =cmd"],
      ['"\'=1,2"'],
      ["safe"],
    ];

    expect(JSON.stringify(csvData)).toStrictEqual(
      JSON.stringify(expectedCsvData),
    );
  });

  it("quotes cells using custom delimiter and escapes embedded quotes in CSV", () => {
    const data = [{ id: 'a;b"c' }];
    const csvData = transformTableDataIntoCsv({
      columns,
      data,
      delimiter: ";",
    });

    expect(csvData).toStrictEqual([["Id"], ['"a;b""c"']]);
  });

  it("prepares Excel rows without passing uncoerced strings in number columns", () => {
    const excelColumns: TableColumnProps[] = [
      ...columns,
      {
        Header: "Amount",
        accessor: "amount",
        minWidth: 60,
        draggable: true,
        metaProperties: {
          isHidden: false,
          type: ColumnTypes.NUMBER,
        },
        columnProperties: {
          id: "amount",
          label: "Amount",
          columnType: ColumnTypes.NUMBER,
          isVisible: true,
          index: 1,
          width: 60,
          isDerived: false,
          computedValue: "",
        },
      },
    ];
    const excelData = transformTableDataIntoExcel({
      columns: excelColumns,
      data: [
        { id: "=1+2", amount: "-5" },
        { id: "safe", amount: "=CMD()" },
      ],
    });

    expect(excelData).toStrictEqual([
      ["Id", "Amount"],
      ["=1+2", -5],
      ["safe", 0],
    ]);
  });
});
