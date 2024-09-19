import type { RawSheetData, ExcelData, HeaderCell } from "./ExcelDataParser";
import { parseExcelData } from "./ExcelDataParser";

describe("parseExcelData", () => {
  describe("Header", () => {
    it("returns a list of header columns using the data", () => {
      const data: RawSheetData = [
        ["r0c0", "r0c1", "r0c2"],
        ["r1c1", "r1c1", "r1c2"],
      ];
      const expectedHeader: HeaderCell[] = [
        {
          Header: "A",
          accessor: "A",
        },
        {
          Header: "B",
          accessor: "B",
        },
        {
          Header: "C",
          accessor: "C",
        },
      ];
      const output = parseExcelData(data);

      expect(output.headers).toEqual(expectedHeader);
    });

    it("includes data with maximum number of elements for calculation of headers, not just first row", () => {
      const data: RawSheetData = [["r0c0"], ["r1c1", "r1c1", "r1c2"]];
      const expectedHeaders = [
        {
          Header: "A",
          accessor: "A",
        },
        {
          Header: "B",
          accessor: "B",
        },
        {
          Header: "C",
          accessor: "C",
        },
      ];
      const output = parseExcelData(data);

      expect(output.headers).toEqual(expectedHeaders);
    });

    it("includes headers for empty values", () => {
      const data: RawSheetData = [["r0c0"], ["r1c1", "r1c1", , "r1c3"]];
      const expectedHeaders = [
        {
          Header: "A",
          accessor: "A",
        },
        {
          Header: "B",
          accessor: "B",
        },
        {
          Header: "C",
          accessor: "C",
        },
        {
          Header: "D",
          accessor: "D",
        },
      ];
      const output = parseExcelData(data);

      expect(output.headers).toEqual(expectedHeaders);
    });

    it("calculates double letter headers if number of items in data is more than 26", () => {
      const lastRowData = [["r26c0", "r26c1"]];
      let data: RawSheetData = [
        ["r0c0"],
        ["r1c0"],
        ["r2c0"],
        ["r3c0"],
        ["r4c0"],
        ["r5c0"],
        ["r6c0"],
        ["r7c0"],
        ["r8c0"],
        ["r9c0"],
        ["r10c0"],
        ["r11c0"],
        ["r12c0"],
        ["r13c0"],
        ["r14c0"],
        ["r15c0"],
        ["r16c0"],
        ["r17c0"],
        ["r18c0"],
        ["r19c0"],
        ["r20c0"],
        ["r21c0"],
        ["r22c0"],
        ["r23c0"],
        ["r24c0"],
        ["r25c0"],
      ];

      data = [...data, ...lastRowData];

      const expectedHeaders = [
        {
          Header: "A",
          accessor: "A",
        },
        {
          Header: "B",
          accessor: "B",
        },
      ];
      const output = parseExcelData(data);

      expect(output.headers).toEqual(expectedHeaders);
    });
  });

  describe("Body", () => {
    it("parses raw data into excel data format", () => {
      const data = [["r0c0"], ["r1c0", "r1c1"], ["r2c0", "r2c1", "r2c2"]];
      const expectedBody = [
        { A: "r0c0" },
        { A: "r1c0", B: "r1c1" },
        { A: "r2c0", B: "r2c1", C: "r2c2" },
      ];

      const output = parseExcelData(data);

      expect(output.body).toEqual(expectedBody);
    });

    it("includes empty values into excel data format", () => {
      const data = [["r0c0"], ["r1c0", "r1c1"], ["r2c0", "r2c1", , "r2c3"]];
      const expectedBody = [
        { A: "r0c0" },
        { A: "r1c0", B: "r1c1" },
        { A: "r2c0", B: "r2c1", C: undefined, D: "r2c3" },
      ];

      const output = parseExcelData(data);

      expect(output.body).toEqual(expectedBody);
    });
  });

  describe("Output", () => {
    it("returns correctly parsed header and body together", () => {
      const data: RawSheetData = [
        ["r0c0", "r0c1", "r0c2"],
        ["r1c0", "r1c1", "r1c2"],
      ];
      const expectedOutput: ExcelData = {
        headers: [
          {
            Header: "A",
            accessor: "A",
          },
          {
            Header: "B",
            accessor: "B",
          },
          {
            Header: "C",
            accessor: "C",
          },
        ],

        body: [
          { A: "r0c0", B: "r0c1", C: "r0c2" },
          { A: "r1c0", B: "r1c1", C: "r1c2" },
        ],
      };

      const output = parseExcelData(data);

      expect(output).toEqual(expectedOutput);
    });

    it("returns correctly parsed header and body together for empty values", () => {
      const data: RawSheetData = [
        ["r0c0", "r0c1", "r0c2"],
        ["r1c0", "r1c1", "r1c2", , , "r1c5"],
      ];
      const expectedOutput: ExcelData = {
        headers: [
          {
            Header: "A",
            accessor: "A",
          },
          {
            Header: "B",
            accessor: "B",
          },
          {
            Header: "C",
            accessor: "C",
          },
          {
            Header: "D",
            accessor: "D",
          },
          {
            Header: "E",
            accessor: "E",
          },
          {
            Header: "F",
            accessor: "F",
          },
        ],

        body: [
          { A: "r0c0", B: "r0c1", C: "r0c2" },
          {
            A: "r1c0",
            B: "r1c1",
            C: "r1c2",
            D: undefined,
            E: undefined,
            F: "r1c5",
          },
        ],
      };

      const output = parseExcelData(data);

      expect(output).toEqual(expectedOutput);
    });
  });
});
