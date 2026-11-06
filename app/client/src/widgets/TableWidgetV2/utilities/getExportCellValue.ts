import { ColumnTypes } from "widgets/TableWidgetV2/constants";
import { getTextFromHTML } from "./getTextFromHTML";

/**
 * Spreadsheet formula-injection prefixes (CSV/Excel).
 * Prefixing with `'` forces the cell to be treated as text.
 * See https://owasp.org/www-community/attacks/CSV_Injection
 */
const SPREADSHEET_FORMULA_PREFIX = /^[=+\-@\t\r]/;

export const neutralizeSpreadsheetFormula = (value: string): string => {
  if (SPREADSHEET_FORMULA_PREFIX.test(value)) {
    return `'${value}`;
  }

  return value;
};

export type GetExportCellValueOptions = {
  /**
   * When true, coerce string values to numbers (Excel number columns)
   * before formula neutralization so legitimate negatives stay numeric.
   */
  asNumber?: boolean;
};

/**
 * Shared cell formatting for CSV and Excel download.
 * Strips HTML columns to plain text, then neutralizes spreadsheet
 * formula-injection prefixes on string values.
 */
export const getExportCellValue = (
  columnType: string | undefined,
  value: unknown,
  options?: GetExportCellValueOptions,
): unknown => {
  let result: unknown = value;

  if (columnType === ColumnTypes.HTML) {
    result = getTextFromHTML(value);
  }

  if (options?.asNumber) {
    if (typeof result === "string") {
      return Number(result) || 0;
    }

    return result;
  }

  if (typeof result === "string") {
    return neutralizeSpreadsheetFormula(result);
  }

  return result;
};
