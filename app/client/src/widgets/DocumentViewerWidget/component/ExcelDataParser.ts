import _ from "lodash";

export type RawRowData = unknown[];
export type RawSheetData = RawRowData[];

// key is column name, value is cell value
export type RowData = Record<string, unknown>;

export interface HeaderCell {
  Header: string;
  accessor: string;
}

export interface ExcelData {
  body: RowData[];
  headers: HeaderCell[];
}

const chars = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

// get excel column name from index, e.g. A,B,...,AA,AB
const numberToExcelHeader = (index: number): string => {
  const quotient = Math.floor(index / 26);

  if (quotient > 0) {
    return numberToExcelHeader(quotient - 1) + chars[index % 26];
  }

  return chars[index % 26];
};

export const parseExcelData = (rawData: RawSheetData): ExcelData => {
  const body: RowData[] = [];
  const headers: HeaderCell[] = [];

  for (const row of rawData) {
    const currRow: RowData = {};

    for (const [index, dataValue] of row.entries()) {
      const columnLabel: string = numberToExcelHeader(index);

      // process header
      if (index == headers.length) {
        // a higher column label has been encountered
        headers.push(headerItemFromLabel(columnLabel));
      }

      // process body
      let cellValue = dataValue;

      if (_.isDate(dataValue)) {
        cellValue = dataValue.toDateString();
      }

      currRow[columnLabel] = cellValue;
    }

    body.push(currRow);
  }

  return {
    headers: headers,
    body: body,
  };
};

const headerItemFromLabel = (label: string) => {
  return {
    Header: label,
    accessor: label,
  };
};
