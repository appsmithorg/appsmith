import Papa from "papaparse";
import FileDataTypes from "../constants";
import log from "loglevel";
import Excel from "exceljs";

function parseFileData(
  data: Blob,
  type: FileDataTypes,
  fileType: string,
  extension: string,
  dynamicTyping = false,
): Promise<any> {
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
): Promise<any[]> {
  return new Promise((resolve) => {
    (async () => {
      let result: any = [];

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
      } else {
        result = [];
      }
      resolve(result);
    })();
  });
}

function parseJSONFile(data: Blob): Promise<any> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      let result: any = {};
      try {
        result = JSON.parse(reader.result as string);
      } finally {
        resolve(result);
      }
    };
    reader.readAsText(data);
  });
}

function parseXLSFile(data: Blob): Promise<any[]> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const workbook = new Excel.Workbook();
      const results: any = [];
      workbook.xlsx
        .load(reader.result as ArrayBuffer)
        .then(() => {
          workbook.eachSheet((sheet) => {
            const sheetData: Record<string, any> = {};
            sheetData["sheetName"] = sheet.name;
            sheetData["data"] = [];
            sheet.eachRow((row) => {
              const rowData: any[] = [];
              row.eachCell((cell) => {
                if (cell.value?.hasOwnProperty("result")) {
                  rowData.push(cell.result);
                } else {
                  rowData.push(cell.value);
                }
              });
              sheetData["data"].push(rowData);
            });
            results.push(sheetData);
          });
          resolve(results);
        })
        .catch(() => {
          resolve([]);
        });
    };
    reader.readAsArrayBuffer(data);
  });
}

function parseCSVBlob(data: Blob, dynamicTyping = false): Promise<any[]> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        const result = parseCSVString(reader.result as string, dynamicTyping);
        resolve(result);
      } catch (error) {
        // TODO: show error alert here
        resolve([]);
      }
    };
    reader.readAsText(data);
  });
}

function parseCSVString(data: string, dynamicTyping = false): any[] {
  const result: Record<string, string>[] = [];
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
