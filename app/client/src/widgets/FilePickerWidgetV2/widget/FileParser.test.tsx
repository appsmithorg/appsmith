import FileDataTypes from "../constants";
import parseFileData from "./FileParser";
import fs from "fs";
import path from "path";

describe("File parser formats differenty file types correctly", () => {
  it("parses csv file correclty", async () => {
    const fixturePath = path.resolve(
      __dirname,
      "../../../../cypress/fixtures/Test_csv.csv",
    );
    const fileData = fs.readFileSync(fixturePath);
    const blob = new Blob([fileData]);

    const result = await parseFileData(
      blob,
      FileDataTypes.Array,
      "text/csv",
      "csv",
      false,
    );
    const expectedResult = [
      {
        "Data Id": "hsa-miR-942-5p",
        String: "Blue",
        Number: "23.788",
        Boolean: "TRUE",
        Empty: "",
        Date: "Wednesday, 20 January 1999",
      },
      {
        "Data Id": "hsa-miR-943",
        String: "Black",
        Number: "1000",
        Boolean: "FALSE",
        Empty: "",
        Date: "2022-09-15",
      },
    ];

    expect(result).toStrictEqual(expectedResult);
  });

  it("parses csv file correclty with dynamic bindig - Infer data types", async () => {
    const fixturePath = path.resolve(
      __dirname,
      "../../../../cypress/fixtures/Test_csv.csv",
    );
    const fileData = fs.readFileSync(fixturePath);
    const blob = new Blob([fileData]);

    const result = await parseFileData(
      blob,
      FileDataTypes.Array,
      "text/csv",
      "csv",
      true,
    );

    const dateString = "2022-09-15";
    const date = new Date(dateString);

    const timezoneOffset = date.getTimezoneOffset();
    const offsetMilliseconds = timezoneOffset * 60 * 1000;

    const convertedDate = new Date(date.getTime() + offsetMilliseconds);

    const expectedResult = [
      {
        "Data Id": "hsa-miR-942-5p",
        String: "Blue",
        Number: 23.788,
        Boolean: true,
        Empty: "",
        Date: "Wednesday, 20 January 1999",
      },
      {
        "Data Id": "hsa-miR-943",
        String: "Black",
        Number: 1000,
        Boolean: false,
        Empty: "",
        Date: convertedDate,
      },
    ];

    expect(result).toStrictEqual(expectedResult);
  });

  it("parses json file correclty", async () => {
    const fixturePath = path.resolve(
      __dirname,
      "../../../../cypress/fixtures/testdata.json",
    );
    const fileData = fs.readFileSync(fixturePath);
    const blob = new Blob([fileData]);

    const result = (await parseFileData(
      blob,
      FileDataTypes.Array,
      "application/json",
      "json",
      false,
    )) as Record<string, unknown>;

    expect(result["APPURL"]).toStrictEqual(
      "http://localhost:8081/app/app1/page1-63d38854252ca15b7ec9fabb",
    );
  });

  it("parses tsv file correctly", async () => {
    const fixturePath = path.resolve(
      __dirname,
      "../../../../cypress/fixtures/Sample.tsv",
    );
    const fileData = fs.readFileSync(fixturePath);
    const blob = new Blob([fileData]);

    const result = await parseFileData(
      blob,
      FileDataTypes.Array,
      "text/tab-separated-values",
      "tsv",
      false,
    );
    const expectedResult = [
      {
        "Last parameter": "12.45",
        "Other parameter": "123456",
        "Some parameter": "CONST",
      },
      {
        "Last parameter": "Row2C3",
        "Other parameter": "Row2C2",
        "Some parameter": "Row2C1",
      },
    ];

    expect(result).toStrictEqual(expectedResult);
  });

  it("parses xlsx file correctly", async () => {
    const fixturePath = path.resolve(
      __dirname,
      "../../../../cypress/fixtures/TestSpreadsheet.xlsx",
    );
    const fileData = fs.readFileSync(fixturePath);
    const blob = new Blob([fileData]);

    const result = await parseFileData(
      blob,
      FileDataTypes.Array,
      "openxmlformats-officedocument.spreadsheet",
      "xlsx",
      false,
    );
    const expectedResult = [
      {
        data: [
          ["Column A", "Column B", "Column C"],
          ["r1a", "r1b", "r1c"],
          ["r2a", "r2b", "r2c"],
          ["r3a", "r3b", "r3c"],
        ],
        name: "Sheet1",
      },
    ];

    expect(result).toStrictEqual(expectedResult);
  });

  it("parses xls file correctly", async () => {
    const fixturePath = path.resolve(
      __dirname,
      "../../../../cypress/fixtures/SampleXLS.xls",
    );
    const fileData = fs.readFileSync(fixturePath);
    const blob = new Blob([fileData]);

    const result = (await parseFileData(
      blob,
      FileDataTypes.Array,
      "",
      "xls",
      false,
    )) as Record<string, Record<string, unknown>[]>[];
    const expectedFirstRow = [
      1,
      "Dulce",
      "Abril",
      "Female",
      "United States",
      32,
      "15/10/2017",
      1562,
    ];

    expect(result[0]["name"]).toStrictEqual("Sheet1");
    expect(result[0]["data"][1]).toStrictEqual(expectedFirstRow);
  });

  it("parses text file correctly", async () => {
    const fixturePath = path.resolve(
      __dirname,
      "../../../../cypress/fixtures/testdata.json",
    );
    const fileData = fs.readFileSync(fixturePath);
    const blob = new Blob([fileData]);

    const result = await parseFileData(blob, FileDataTypes.Text, "", "", false);

    expect(typeof result).toStrictEqual("string");
    expect(result).toContain(
      "http://localhost:8081/app/app1/page1-63d38854252ca15b7ec9fabb",
    );
  });

  it("parses binary file correctly", async () => {
    const fixturePath = path.resolve(
      __dirname,
      "../../../../cypress/fixtures/testdata.json",
    );
    const fileData = fs.readFileSync(fixturePath);
    const blob = new Blob([fileData]);

    const result = await parseFileData(
      blob,
      FileDataTypes.Binary,
      "",
      "",
      false,
    );

    expect(typeof result).toStrictEqual("string");
    expect(result).toContain(
      "http://localhost:8081/app/app1/page1-63d38854252ca15b7ec9fabb",
    );
  });

  it("parses base64 file correctly", async () => {
    const fixturePath = path.resolve(
      __dirname,
      "../../../../cypress/fixtures/testdata.json",
    );
    const fileData = fs.readFileSync(fixturePath);
    const blob = new Blob([fileData]);

    const result = await parseFileData(
      blob,
      FileDataTypes.Base64,
      "",
      "",
      false,
    );

    expect(typeof result).toStrictEqual("string");
    expect(result).toContain(
      "data:application/octet-stream;base64,ewogICJiYXNlVXJsIjogImh0",
    );
  });
});
