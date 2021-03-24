import { ColumnTypes } from "components/designSystems/appsmith/TableComponent/Constants";
import { isPlainObject, isNil } from "lodash";
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
