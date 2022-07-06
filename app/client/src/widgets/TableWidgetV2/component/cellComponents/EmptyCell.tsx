import React from "react";
import { Cell, Row } from "react-table";
import { ReactTableColumnProps } from "../Constants";
import { EmptyCell, EmptyRow } from "../TableStyledWrappers";
import { renderBodyCheckBoxCell } from "./CheckboxCell";

export const renderEmptyRows = (
  rowCount: number,
  columns: ReactTableColumnProps[],
  tableWidth: number,
  page: Row<Record<string, unknown>>[],
  prepareRow: (row: Row<Record<string, unknown>>) => void,
  multiRowSelection = false,
  accentColor: string,
  borderRadius: string,
) => {
  const rows: string[] = new Array(rowCount).fill("");

  if (page.length) {
    const row = page[0];

    return rows.map((item: string, index: number) => {
      prepareRow(row);
      const rowProps = {
        ...row.getRowProps(),
        style: { display: "flex" },
      };
      return (
        <div {...rowProps} className="tr" key={index}>
          {multiRowSelection &&
            renderBodyCheckBoxCell(false, accentColor, borderRadius)}
          {row.cells.map((cell: Cell<Record<string, unknown>>) => {
            const cellProps = cell.getCellProps();
            return <div {...cellProps} className="td" key={cellProps.key} />;
          })}
        </div>
      );
    });
  } else {
    const tableColumns = columns.length
      ? columns
      : new Array(3).fill({ width: tableWidth / 3, isHidden: false });

    return (
      <>
        {rows.map((row: string, index: number) => {
          return (
            <EmptyRow className="tr" key={index}>
              {multiRowSelection &&
                renderBodyCheckBoxCell(false, accentColor, borderRadius)}
              {tableColumns.map((column: any, colIndex: number) => {
                return (
                  <EmptyCell
                    className="td"
                    key={colIndex}
                    width={column.width}
                  />
                );
              })}
            </EmptyRow>
          );
        })}
      </>
    );
  }
};
