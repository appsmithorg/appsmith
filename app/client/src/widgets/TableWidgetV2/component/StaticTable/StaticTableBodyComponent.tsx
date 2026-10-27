import { Row } from "../TableBodyCoreComponents/Row";

import React from "react";
import { useAppsmithTable } from "../TableContext";
import { EmptyRows } from "../cellComponents/EmptyCell";

export const StaticTableBodyComponent = () => {
  const {
    getTableBodyProps,
    isAutoHeightEnabled,
    isLoading,
    pageSize,
    subPage: rows,
  } = useAppsmithTable();

  return (
    <div {...getTableBodyProps()} className="tbody body">
      {rows.map((row, index) => {
        return <Row index={index} key={index} row={row} />;
      })}
      {/* Auto height skips filler rows, except while loading so the table keeps its size */}
      {(!isAutoHeightEnabled || isLoading) && pageSize > rows.length && (
        <EmptyRows rows={pageSize - rows.length} />
      )}
    </div>
  );
};
