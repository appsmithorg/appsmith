import { ColumnTypes, TableColumnProps } from "./Constants";
import { isPlainObject, isNil, isString } from "lodash";
import moment from "moment";

export function sortTableFunction(
  filteredTableData: Array<Record<string, unknown>>,
  columnType: string,
  sortedColumn: string,
  sortOrder: boolean,
) {
  const tableData = filteredTableData ? [...filteredTableData] : [];
  return tableData.sort(
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

export const transformTableDataIntoCsv = (props: {
  columns: TableColumnProps[];
  data: Array<Record<string, unknown>>;
}) => {
  const csvData = [];
  csvData.push(
    props.columns
      .map((column: TableColumnProps) => {
        if (column.metaProperties && !column.metaProperties.isHidden) {
          return column.Header;
        }
        return null;
      })
      .filter((i) => !!i),
  );
  for (let row = 0; row < props.data.length; row++) {
    const data: { [key: string]: any } = props.data[row];
    const csvDataRow = [];
    for (let colIndex = 0; colIndex < props.columns.length; colIndex++) {
      const column = props.columns[colIndex];
      let value = data[column.accessor];
      if (column.metaProperties && !column.metaProperties.isHidden) {
        value =
          isString(value) && value.includes("\n")
            ? value.replace("\n", " ")
            : value;
        if (isString(value) && value.includes(",")) {
          csvDataRow.push(`"${value}"`);
        } else {
          csvDataRow.push(value);
        }
      }
    }
    csvData.push(csvDataRow);
  }
  return csvData;
};
