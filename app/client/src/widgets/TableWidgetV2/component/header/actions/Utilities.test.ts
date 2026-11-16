import { transformTableDataIntoCsv } from "./Utilities";
import type { TableColumnProps } from "../../Constants";
import { ColumnTypes } from "widgets/TableWidgetV2/constants";

describe("TransformTableDataIntoArrayOfArray", () => {
  const columns: TableColumnProps[] = [
    {
      Header: "Id",
      id: "id",
      alias: "id",
      accessor: "id",
      minWidth: 60,
      draggable: true,
      metaProperties: {
        isHidden: false,
        type: ColumnTypes.TEXT,
      },
      columnProperties: {
        id: "id",
        originalId: "id",
        alias: "id",
        label: "Id",
        columnType: "string",
        isVisible: true,
        index: 0,
        width: 60,
        isDerived: false,
        computedValue: "",
        isCellEditable: false,
        isEditable: false,
        allowCellWrapping: false,
      },
    },
  ];

  const htmlColumns: TableColumnProps[] = [
    {
      ...columns[0],
      metaProperties: {
        isHidden: false,
        type: ColumnTypes.HTML,
      },
      columnProperties: {
        ...columns[0].columnProperties,
        columnType: ColumnTypes.HTML,
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

  it("replaces all newlines in any column", () => {
    const data = [
      {
        id: "abc\ntest\nmore",
      },
      {
        id: "crlf\r\nline\roldmac",
      },
    ];
    const csvData = transformTableDataIntoCsv({
      columns,
      data,
    });
    const expectedCsvData = [["Id"], ["abc test more"], ["crlf line oldmac"]];

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

  it("quotes values that contain a custom delimiter", () => {
    const data = [
      {
        id: "abc;test",
      },
      {
        id: "plain",
      },
    ];
    const csvData = transformTableDataIntoCsv({
      columns,
      data,
      delimiter: ";",
    });
    const expectedCsvData = [["Id"], ['"abc;test"'], ["plain"]];

    expect(JSON.stringify(csvData)).toStrictEqual(
      JSON.stringify(expectedCsvData),
    );
  });

  it("quotes and escapes double quotes in any column", () => {
    const data = [
      {
        id: 'He said "hi"',
      },
      {
        id: 'a,"b",c',
      },
    ];
    const csvData = transformTableDataIntoCsv({
      columns,
      data,
    });
    const expectedCsvData = [["Id"], ['"He said ""hi"""'], ['"a,""b"",c"']];

    expect(JSON.stringify(csvData)).toStrictEqual(
      JSON.stringify(expectedCsvData),
    );
  });

  it("keeps HTML-looking markup for non-HTML columns", () => {
    const data = [
      {
        id: "<p>abc</p>",
      },
      {
        id: "<table><tr><td>abc</td></tr></table>",
      },
    ];
    const csvData = transformTableDataIntoCsv({
      columns,
      data,
    });
    const expectedCsvData = [
      ["Id"],
      ["<p>abc</p>"],
      ["<table><tr><td>abc</td></tr></table>"],
    ];

    expect(JSON.stringify(csvData)).toStrictEqual(
      JSON.stringify(expectedCsvData),
    );
  });

  it("strips HTML markup for HTML columns", () => {
    const data = [
      {
        id: "<p>abc</p>",
      },
      {
        id: '<span style="color:white">completed</span>',
      },
      {
        id: "<table><tr><td>abc</td></tr></table>",
      },
    ];
    const csvData = transformTableDataIntoCsv({
      columns: htmlColumns,
      data,
    });
    const expectedCsvData = [["Id"], ["abc"], ["completed"], ["abc"]];

    expect(JSON.stringify(csvData)).toStrictEqual(
      JSON.stringify(expectedCsvData),
    );
  });

  it("strips HTML then applies CSV quoting rules", () => {
    const data = [
      {
        id: "<p>line1\nline2\nline3</p>",
      },
      {
        id: '<span>He said "hi"</span>',
      },
    ];
    const csvData = transformTableDataIntoCsv({
      columns: htmlColumns,
      data,
    });
    const expectedCsvData = [
      ["Id"],
      ["line1 line2 line3"],
      ['"He said ""hi"""'],
    ];

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
});
