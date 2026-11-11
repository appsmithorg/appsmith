import { ColumnTypes } from "widgets/TableWidgetV2/constants";
import { getTextFromHTML } from "./getTextFromHTML";

/**
 * Shared cell formatting for CSV and Excel download.
 * Strips HTML columns to plain text; leaves other column types unchanged.
 */
export const getExportCellValue = (
  columnType: string | undefined,
  value: unknown,
): unknown => {
  if (columnType === ColumnTypes.HTML) {
    return getTextFromHTML(value);
  }

  return value;
};
