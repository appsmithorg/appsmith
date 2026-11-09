import { getExportCellValue } from "widgets/TableWidgetV2/utilities/getExportCellValue";
import type { TableColumnProps } from "../../Constants";
import { isString } from "lodash";

const escapeCsvField = (value: string) => value.replace(/"/g, '""');

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
          return column.Header;
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
      let value = data[column.alias];

      if (column.metaProperties && !column.metaProperties.isHidden) {
        value = getExportCellValue(column.metaProperties.type, value);

        // Collapse newlines (LF, CRLF, CR) so a cell cannot split CSV rows.
        if (isString(value)) {
          value = value.replace(/\r\n|\r|\n/g, " ");
        }

        const shouldQuote =
          isString(value) && (value.includes(delimiter) || value.includes('"'));

        if (shouldQuote) {
          csvDataRow.push(`"${escapeCsvField(value)}"`);
        } else {
          csvDataRow.push(value);
        }
      }
    }

    csvData.push(csvDataRow);
  }

  return csvData;
};
