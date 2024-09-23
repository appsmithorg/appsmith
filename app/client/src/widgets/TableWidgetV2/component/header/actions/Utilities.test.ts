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
});
