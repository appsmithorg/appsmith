import React, { useEffect, useState } from "react";
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

interface DocumentViewerState {
  sheetNames: string[];
  currentTableData: any[];
  currentTableHeaders: Column[];
  tableData: Record<number, any[]>;
  headerData: Record<number, Column[]>;
}

export default function XlsxViewer(props: { blob?: Blob }) {
  const [sheetIndex, setSheetIndex] = useState<number>(-1);
  const [state, setState] = useState<DocumentViewerState>(newStateInstance());

  useEffect(() => {
    if (!props.blob) {
      resetStates();
    } else {
      parseBlob(props.blob)
        .then((jsonData: { sheetsData: any; sheetNames: string[] }) => {
          const newState = newStateInstance();
          newState.sheetNames = jsonData.sheetNames;
          const newSheetIndex = jsonData.sheetsData.length > 0 ? 0 : -1;

          jsonData.sheetsData.forEach((data: any[], index: number) => {
            newState.tableData[index] = parseTableBody(data);
            newState.headerData[index] = parseTableHeaders(data);
          });

          newState.currentTableData = newState.tableData[newSheetIndex];
          newState.currentTableHeaders = newState.headerData[newSheetIndex];

          setState(newState);
          setSheetIndex(newSheetIndex);
        })
        .catch(() => {
          resetStates();
        });
    }
  }, [props.blob]);

  async function parseBlob(blob: Blob) {
    const buffer = await blob.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const jsonData = convertWorkbookDataToJSON(workbook);
    return jsonData;
  }

  const convertWorkbookDataToJSON = (workbook: XLSX.WorkBook) => {
    const sheetsData: any[] = [];
    const sheetNames: string[] = [];

    workbook.SheetNames.forEach((name, index) => {
      sheetNames.push(name);

      const result = XLSX.utils.sheet_to_json(
        workbook.Sheets[workbook.SheetNames[index]],
        { header: 1 },
      );
      sheetsData.push(result);
    });

    return { sheetsData, sheetNames };
  };

  function newStateInstance() {
    const defaultTableData: Record<number, []> = { "-1": [] };
    const newState: DocumentViewerState = {
      sheetNames: [],
      currentTableData: [],
      currentTableHeaders: [],
      tableData: { ...defaultTableData },
      headerData: { ...defaultTableData },
    };
    return newState;
  }

  const resetStates = () => {
    const newState = newStateInstance();
    setState(newState);
    setSheetIndex(-1);
  };

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

  const { getTableBodyProps, getTableProps, headerGroups, prepareRow, rows } =
    useTable({
      columns: state.headerData[sheetIndex],
      data: state.tableData[sheetIndex],
    });

  return (
    <StyledViewer>
      <div>
        {state.sheetNames.map((name, index) => (
          <button
            key={index}
            onClick={() => {
              setSheetIndex(index);
            }}
          >
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
