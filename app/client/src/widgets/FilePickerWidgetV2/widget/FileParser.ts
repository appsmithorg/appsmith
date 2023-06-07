import Papa from "papaparse";
import FileDataTypes from "../constants";
import log from "loglevel";
import * as XLSX from "xlsx";

interface ExcelSheetData {
  name: string;
  data: unknown[];
}

type CSVRowData = Record<any, any>; // key represents column name, value represents cell value

function parseFileData(
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

function parseBase64Blob(data: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(data);
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
  });
}

function parseBinaryString(data: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsBinaryString(data);
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
  });
}

function parseText(data: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsText(data);
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
  });
}

function parseArrayTypeFile(
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

function parseJSONFile(data: Blob): Promise<Record<string, unknown>> {
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

function parseXLSFile(data: Blob): Promise<ExcelSheetData[]> {
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

function parseCSVBlob(
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
  const errors: Papa.ParseError[] = [];

  function chunk(results: Papa.ParseStepResult<any>) {
    if (results?.errors?.length) {
      errors.push(...results.errors);
    }
    result.push(...results.data);
  }

  const config = {
    header: true,
    dynamicTyping: dynamicTyping,
    chunk,
  };

  const startParsing = performance.now();
  Papa.parse(data, config);

  const endParsing = performance.now();

  log.debug(
    `### FILE_PICKER_WIDGET_V2 - CSV PARSING  `,
    `${endParsing - startParsing} ms`,
  );
  return result;
}

export default parseFileData;
