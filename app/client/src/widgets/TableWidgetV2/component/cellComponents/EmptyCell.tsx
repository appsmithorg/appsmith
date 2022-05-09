import React from "react";
import { renderBodyCheckBoxCell } from "./CheckboxCell";

export const renderEmptyRows = (
  rowCount: number,
  columns: any,
  tableWidth: number,
  page: any,
  prepareRow: any,
  multiRowSelection = false,
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
          {multiRowSelection && renderBodyCheckBoxCell(false)}
          {row.cells.map((cell: any, cellIndex: number) => {
            const cellProps = cell.getCellProps();
            if (columns[0]?.columnProperties?.cellBackground) {
              cellProps.style.background =
                columns[0].columnProperties.cellBackground;
            }
            return <div {...cellProps} className="td" key={cellIndex} />;
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
            <div
              className="tr"
              key={index}
              style={{
                display: "flex",
                flex: "1 0 auto",
              }}
            >
              {multiRowSelection && renderBodyCheckBoxCell(false)}
              {tableColumns.map((column: any, colIndex: number) => {
                return (
                  <div
                    className="td"
                    key={colIndex}
                    style={{
                      width: column.width + "px",
                      boxSizing: "border-box",
                      flex: `${column.width} 0 auto`,
                    }}
                  />
                );
              })}
            </div>
          );
        })}
      </>
    );
  }
};
