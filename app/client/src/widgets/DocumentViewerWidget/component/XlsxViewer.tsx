import React, { useEffect, useState, useCallback } from "react";
import styled from "styled-components";
import type { Column } from "react-table";
import { useTable } from "react-table";
import _ from "lodash";
import * as XLSX from "xlsx";

const StyledViewer = styled.div`
  width: 100%;
  height: 100%;
  background: #fff;
  overflow: auto;

  table {
    border: 1px solid #b0cbef;
    border-width: 1px 0 0 1px;
    border-spacing: 0;
    border-collapse: collapse;
    padding: 10px;

    th {
      font-weight: 700;
      font-size: 14px;
      border: 1px solid #9eb6ce;
      border-width: 0 1px 1px 0;
      height: 17px;
      line-height: 17px;
      text-align: center;
      background: #9eb6ce4d;
    }

    td {
      background-color: #fff;
      padding: 0 4px 0 2px;
      border: 1px solid #d0d7e5;
      border-width: 0 1px 1px 0;
    }
  }
`;

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

export default function XlsxViewer(props: { blob?: Blob }) {
  const [sheetNames, setSheetNames] = useState([] as string[]);
  const [tableData, setTableData] = useState([]);
  const [headerData, setHeaderData] = useState([] as Column[]);
  const jsonData: any[] = [];

  useEffect(() => {
    props.blob?.arrayBuffer().then((buffer) => {
      const workbook = XLSX.read(buffer, { type: "array" });

      const sheetNames: string[] = [];
      workbook.SheetNames.map((name, index) => {
        sheetNames.push(name);

        const result = XLSX.utils.sheet_to_json(
          workbook.Sheets[workbook.SheetNames[index]],
          { header: 1 },
        );
        jsonData.push(result);
      });

      setSheetNames(sheetNames);
      getSheetData(0);
    });
  }, [props.blob]);

  function parseTableBody(excelData: any[]) {
    const data = [] as any;
    for (const row of excelData) {
      const currRow = {} as any;

      for (const [index, value] of row.entries()) {
        const columnLabel = String(numberToExcelHeader(index));
        let cellValue = value;
        if (_.isDate(value)) {
          cellValue = value.toDateString();
        }

        currRow[columnLabel] = cellValue;
      }

      data.push(currRow);
    }
    return data;
  }

  const parseTableHeaders = (tableData: any[]) => {
    const newHeader: any[] = [];
    if (tableData.length) {
      // create header letters based on columnCount
      const headers = tableData[0];

      for (let i = 0; i < headers.length; i++) {
        const currHeader = numberToExcelHeader(i);
        newHeader.push({
          Header: currHeader,
          accessor: currHeader,
        });
      }
    }
    return newHeader;
  };

  // get provided sheet data, read all row and columns
  const getSheetData = useCallback((sheetIndex: number) => {
    // collect all row data
    const body = parseTableBody(jsonData[sheetIndex]);
    const headers = parseTableHeaders(jsonData[sheetIndex]);

    setTableData(body);
    setHeaderData(headers);
  }, []);

  // // when user click on another sheet, re-generate data
  const updateSheet = useCallback(
    (sheetIndex) => () => {
      getSheetData(sheetIndex);
    },
    [],
  );

  const { getTableBodyProps, getTableProps, headerGroups, prepareRow, rows } =
    useTable({ columns: headerData, data: tableData });

  return (
    <StyledViewer>
      <div>
        {sheetNames.map((name, index) => (
          <button key={index} onClick={updateSheet(index)}>
            {name}
          </button>
        ))}
      </div>
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup, hgInd) => (
            <tr {...headerGroup.getHeaderGroupProps()} key={hgInd}>
              {headerGroup.headers.map((column, colId) => (
                <th {...column.getHeaderProps()} key={colId}>
                  {column.render("Header")}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row, rInd) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()} key={rInd}>
                {row.cells.map((cell, ind) => {
                  return (
                    <td {...cell.getCellProps()} key={ind}>
                      {cell.render("Cell")}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </StyledViewer>
  );
}
