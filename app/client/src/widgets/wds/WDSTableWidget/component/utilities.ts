import type { TableColumnProps } from "./Constants";
import { isString } from "lodash";

interface DataCellProps {
  value: string | number;
  type: "string" | "number";
}

/**
 * downloads the data as CSV
 *
 * @param props
 */
export const downloadDataAsCSV = (props: {
  csvData: Array<Array<any>>;
  delimiter: string;
  fileName: string;
}) => {
  let csvContent = "";
  props.csvData.forEach((infoArray: Array<any>, index: number) => {
    const dataString = infoArray.join(props.delimiter);
    csvContent += index < props.csvData.length ? dataString + "\n" : dataString;
  });
  const anchor = document.createElement("a");
  const mimeType = "application/octet-stream";
  // @ts-expect-error: msSaveBlob does not exists on navigator
  if (navigator.msSaveBlob) {
    // @ts-expect-error: msSaveBlob does not exists on navigator
    navigator.msSaveBlob(
      new Blob([csvContent], {
        type: mimeType,
      }),
      props.fileName,
    );
  } else if (URL && "download" in anchor) {
    anchor.href = URL.createObjectURL(
      new Blob([csvContent], {
        type: mimeType,
      }),
    );
    anchor.setAttribute("download", props.fileName);
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }
};

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
      let value = data[column.alias];
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

export function transformTableDataIntoExcel(props: {
  columns: TableColumnProps[];
  data: Array<Record<string, unknown>>;
}) {
  const tableData: Array<Array<DataCellProps>> = [];
  const tableHeaders: Array<DataCellProps> = props.columns
    .filter((column: TableColumnProps) => {
      return column.metaProperties && !column.metaProperties.isHidden;
    })
    .map((column: TableColumnProps) => {
      return {
        value: column.Header,
        type:
          column.columnProperties?.columnType === "number"
            ? "number"
            : "string",
      };
    });

  tableData.push(tableHeaders);

  for (let row = 0; row < props.data.length; row++) {
    const data: { [key: string]: any } = props.data[row];
    const tableRow: Array<DataCellProps> = [];
    for (let colIndex = 0; colIndex < props.columns.length; colIndex++) {
      const column = props.columns[colIndex];
      const type =
        column.columnProperties?.columnType === "number" ? "number" : "string";
      if (column.metaProperties && !column.metaProperties.isHidden) {
        tableRow.push({
          value: data[column.alias],
          type: type,
        });
      }
    }
    tableData.push(tableRow);
  }

  return tableData;
}
