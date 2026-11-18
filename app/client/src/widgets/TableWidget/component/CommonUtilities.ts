import type { TableColumnProps } from "./Constants";
import { ColumnTypes } from "./Constants";
import { isPlainObject, isNil, isString } from "lodash";
import moment from "moment";
import { neutralizeSpreadsheetFormula } from "widgets/TableWidgetV2/utilities/getExportCellValue";

export function sortTableFunction(
  filteredTableData: Array<Record<string, unknown>>,
  columnType: string,
  sortedColumn: string,
  sortOrder: boolean,
) {
  const tableData = filteredTableData ? [...filteredTableData] : [];

  return tableData.sort(
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (a: { [key: string]: any }, b: { [key: string]: any }) => {
      if (
        isPlainObject(a) &&
        isPlainObject(b) &&
        !isNil(a[sortedColumn]) &&
        !isNil(b[sortedColumn])
      ) {
        switch (columnType) {
          case ColumnTypes.NUMBER:
            return sortOrder
              ? Number(a[sortedColumn]) > Number(b[sortedColumn])
                ? 1
                : -1
              : Number(b[sortedColumn]) > Number(a[sortedColumn])
                ? 1
                : -1;
          case ColumnTypes.DATE:
            return sortOrder
              ? moment(a[sortedColumn]).isAfter(b[sortedColumn])
                ? 1
                : -1
              : moment(b[sortedColumn]).isAfter(a[sortedColumn])
                ? 1
                : -1;
          default:
            return sortOrder
              ? a[sortedColumn].toString().toUpperCase() >
                b[sortedColumn].toString().toUpperCase()
                ? 1
                : -1
              : b[sortedColumn].toString().toUpperCase() >
                  a[sortedColumn].toString().toUpperCase()
                ? 1
                : -1;
        }
      } else {
        return sortOrder ? 1 : 0;
      }
    },
  );
}

const formatCsvCell = (rawValue: unknown, delimiter: string): unknown => {
  if (!isString(rawValue)) {
    return rawValue;
  }

  // Neutralize formula prefixes before collapsing newlines so values like "\r=cmd" are still caught.
  const neutralized = neutralizeSpreadsheetFormula(rawValue);
  // Collapse all newlines (CRLF, CR, LF) so a cell cannot split CSV rows.
  const normalized = neutralized.replace(/\r\n|\r|\n/g, " ");

  if (normalized.includes(delimiter) || normalized.includes('"')) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }

  return normalized;
};

export const transformTableDataIntoCsv = (props: {
  columns: TableColumnProps[];
  data: Array<Record<string, unknown>>;
  delimiter?: string;
}) => {
  const csvData = [];
  const delimiter = props.delimiter || ",";

  csvData.push(
    props.columns
      .map((column: TableColumnProps) => {
        if (column.metaProperties && !column.metaProperties.isHidden) {
          return formatCsvCell(column.Header, delimiter);
        }

        return null;
      })
      .filter((i) => !!i),
  );

  for (let row = 0; row < props.data.length; row++) {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: { [key: string]: any } = props.data[row];
    const csvDataRow = [];

    for (let colIndex = 0; colIndex < props.columns.length; colIndex++) {
      const column = props.columns[colIndex];
      const value = data[column.accessor];

      if (column.metaProperties && !column.metaProperties.isHidden) {
        csvDataRow.push(formatCsvCell(value, delimiter));
      }
    }

    csvData.push(csvDataRow);
  }

  return csvData;
};

export const transformTableDataIntoExcel = (props: {
  columns: TableColumnProps[];
  data: Array<Record<string, unknown>>;
}): Array<Array<unknown>> => {
  const tableData: Array<Array<unknown>> = [];
  const visibleColumns = props.columns.filter(
    (column: TableColumnProps) =>
      column.metaProperties && !column.metaProperties.isHidden,
  );

  tableData.push(visibleColumns.map((column) => column.Header));

  for (let row = 0; row < props.data.length; row++) {
    const data = props.data[row];
    const tableRow: Array<unknown> = visibleColumns.map((column) => {
      const value = data[column.accessor];

      if (
        column.columnProperties?.columnType === ColumnTypes.NUMBER &&
        typeof value === "string"
      ) {
        return Number(value) || 0;
      }

      return value;
    });

    tableData.push(tableRow);
  }

  return tableData;
};
