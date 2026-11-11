import { ColumnTypes } from "widgets/TableWidgetV2/constants";
import { getTextFromHTML } from "./getTextFromHTML";

/**
 * Spreadsheet formula-injection prefixes for CSV export.
 * Prefixing with `'` forces the cell to be treated as text.
 * Excel skips this step: SheetJS writes primitive strings as text cells.
 * See https://owasp.org/www-community/attacks/CSV_Injection
 */
const SPREADSHEET_FORMULA_PREFIX = /^[=+\-@\t\r]/;

export const neutralizeSpreadsheetFormula = (value: string): string => {
  if (SPREADSHEET_FORMULA_PREFIX.test(value)) {
    return `'${value}`;
  }

  return value;
};

export interface GetExportCellValueOptions {
  /**
   * When true, coerce string values to numbers (Excel number columns)
   * before formula neutralization so legitimate negatives stay numeric.
   */
  asNumber?: boolean;
  /**
   * When false, skip the CSV apostrophe prefix. Use for Excel, where
   * SheetJS already stores primitive strings as text cells. Default true.
   */
  neutralizeFormulas?: boolean;
}

/**
 * Shared cell formatting for CSV and Excel download.
 * Strips HTML columns to plain text, then optionally neutralizes
 * spreadsheet formula-injection prefixes on string values (CSV).
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

  if (typeof result === "string" && options?.neutralizeFormulas !== false) {
    return neutralizeSpreadsheetFormula(result);
  }

  return result;
};
