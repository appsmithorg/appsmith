import { Row } from "../TableBodyCoreComponents/Row";

import React from "react";
import { useAppsmithTable } from "../TableContext";
import { EmptyRows } from "../cellComponents/EmptyCell";

export const StaticTableBodyComponent = () => {
  const {
    getTableBodyProps,
    isAutoHeightEnabled,
    pageSize,
    subPage: rows,
  } = useAppsmithTable();

  return (
    <div {...getTableBodyProps()} className="tbody body">
      {rows.map((row, index) => {
        return <Row index={index} key={index} row={row} />;
      })}
      {!isAutoHeightEnabled && pageSize > rows.length && (
        <EmptyRows rows={pageSize - rows.length} />
      )}
    </div>
  );
};
