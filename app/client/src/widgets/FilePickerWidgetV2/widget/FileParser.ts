import FileDataTypes from "../constants";
import * as XLSX from "xlsx";

interface ExcelSheetData {
  name: string;
  data: unknown[];
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CSVRowData = Record<any, any>; // key represents column name, value represents cell value

async function parseFileData(
  data: Blob,
  type: FileDataTypes,
  fileType: string,
  extension: string,
  dynamicTyping = false,
): Promise<unknown> {
  switch (type) {
    case FileDataTypes.Base64: {
      return parseBase64Blob(data);
    }
    case FileDataTypes.Binary: {
      return parseBinaryString(data);
    }
    case FileDataTypes.Text: {
      return parseText(data);
    }
    case FileDataTypes.Array: {
      return parseArrayTypeFile(data, fileType, extension, dynamicTyping);
    }
  }
}

async function parseBase64Blob(data: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(data);
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
  });
}

async function parseBinaryString(data: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsBinaryString(data);
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
  });
}

async function parseText(data: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsText(data);
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
  });
}

async function parseArrayTypeFile(
  data: Blob,
  filetype: string,
  extension: string,
  dynamicTyping = false,
): Promise<unknown> {
  return new Promise((resolve) => {
    (async () => {
      let result: unknown = [];

      if (filetype.indexOf("csv") > -1) {
        result = await parseCSVBlob(data, dynamicTyping);
      } else if (
        filetype.indexOf("openxmlformats-officedocument.spreadsheet") > -1 ||
        extension.indexOf("xls") > -1
      ) {
        result = await parseXLSFile(data);
      } else if (filetype.indexOf("json") > -1) {
        result = parseJSONFile(data);
      } else if (filetype.indexOf("text/tab-separated-values") > -1) {
        result = await parseCSVBlob(data, dynamicTyping);
      }
      resolve(result);
    })();
  });
}

async function parseJSONFile(data: Blob): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      let result: Record<string, unknown> = {};
      try {
        result = JSON.parse(reader.result as string);
      } catch {}
      resolve(result);
    };
    reader.readAsText(data);
  });
}

async function parseXLSFile(data: Blob): Promise<ExcelSheetData[]> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const sheetsData: ExcelSheetData[] = [];
      const workbook = XLSX.read(reader.result as ArrayBuffer, {
        type: "array",
      });

      workbook.SheetNames.forEach((sheetName) => {
        const sheetData: ExcelSheetData = { name: "", data: [] };
        try {
          const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
            header: 1,
          });
          sheetData["name"] = sheetName;
          sheetData["data"] = data;
          sheetsData.push(sheetData);
        } catch {}
      });
      resolve(sheetsData);
    };
    reader.readAsArrayBuffer(data);
  });
}

async function parseCSVBlob(
  data: Blob,
  dynamicTyping = false,
): Promise<CSVRowData[]> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      let result: CSVRowData[] = [];
      try {
        result = parseCSVString(reader.result as string, dynamicTyping);
      } catch {}
      resolve(result);
    };
    reader.readAsText(data);
  });
}

function parseCSVString(data: string, dynamicTyping = false): CSVRowData[] {
  const result: CSVRowData[] = [];
  const workbook = XLSX.read(data, {
    type: "binary",
    cellDates: true,
    dateNF: "yyyy-mm-dd",
    raw: dynamicTyping ? false : true, // parse values
  });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData: XLSX.CellObject[] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1, // to notify that the first row is the header row
    defval: "", // to get empty cells as empty strings
  });
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const headerRow: any[] = jsonData[0] as any;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dataRows: any[][] = jsonData.slice(1) as any;

  dataRows.forEach((row: string[]) => {
    const rowData: CSVRowData = {};
    for (let i = 0; i < row.length; i++) {
      const columnName = headerRow[i];
      const cellValue = row[i];
      rowData[columnName] = cellValue;
    }
    result.push(rowData);
  });

  return result;
}

export default parseFileData;
