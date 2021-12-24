import React, { useEffect, useState, useRef, useCallback } from "react";
import styled from "styled-components";
import Excel from "exceljs-lightweight";
import { useTable, Column } from "react-table";
import _ from "lodash";

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
  index -= 1;
  const quotient = Math.floor(index / 26);
  if (quotient > 0) {
    return numberToExcelHeader(quotient) + chars[index % 26];
  }
  return chars[index % 26];
};

type sheetsDataType = {
  name: string;
  id: number;
};

export default function XlsxViewer(props: { blob?: Blob }) {
  const [sheets, setSheets] = useState([] as sheetsDataType[]);
  const [tableData, setTableData] = useState([]);
  const [headerData, setHeaderData] = useState([] as Column[]);
  const workbook = useRef(new Excel.Workbook());

  useEffect(() => {
    props.blob?.arrayBuffer().then((buffer) => {
      // read excel
      workbook.current.xlsx.load(buffer).then(() => {
        const newSheets = [] as any;
        // get all sheets from excel
        workbook.current.eachSheet((sheet, id) => {
          newSheets.push({ name: sheet.name, id });
        });
        setSheets(newSheets);
        // get 1st sheet data
        getSheetData(1);
      });
    });
  }, [props.blob]);

  // get provided sheet data, read all row and columns
  const getSheetData = useCallback((sheetId: number) => {
    const worksheet = workbook.current.getWorksheet(sheetId);
    // collect all row data
    const data = [] as any;
    worksheet.eachRow({ includeEmpty: true }, (row) => {
      const currRow = {} as any;
      // read value of each cell of current row
      row.eachCell((cell) => {
        // value can be merged value | Date | formula result | string | number
        let value: any;
        if (cell.isMerged) {
          value = _.get(cell, "_mergeCount") ? cell.value : "";
        } else {
          value = cell.value;
        }
        if (_.isDate(value)) {
          value = value.toDateString();
        } else if (_.isObject(value) && _.has(value, "result")) {
          value = _.get(value, "result", "");
        }
        currRow[String(numberToExcelHeader(Number(cell.col)))] = value;
      });
      data.push(currRow);
    });
    setTableData(data);
    if (data.length) {
      // create header letters based on columnCount
      const newHeader = [];
      for (let index = 1; index <= worksheet.columnCount; index++) {
        const currHeader = numberToExcelHeader(index);
        newHeader.push({
          Header: currHeader,
          accessor: currHeader,
        });
      }
      setHeaderData(newHeader);
    } else {
      setHeaderData([]);
    }
  }, []);

  // when user click on another sheet, re-generate data
  const updateSheet = useCallback(
    (sheetId) => () => {
      getSheetData(sheetId);
    },
    [],
  );

  const {
    getTableBodyProps,
    getTableProps,
    headerGroups,
    prepareRow,
    rows,
  } = useTable({ columns: headerData, data: tableData });

  return (
    <StyledViewer>
      <div>
        {sheets.map((sheet) => (
          <button key={sheet.id} onClick={updateSheet(sheet.id)}>
            {sheet.name}
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
