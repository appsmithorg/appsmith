import { EmptyRows } from "../../TableBody/Row";

import { Row } from "../../TableBody/Row";

import React from "react";
import { useAppsmithTable } from "../../TableContext";

export const StaticTableBodyComponent = () => {
  const { getTableBodyProps, pageSize, subPage: rows } = useAppsmithTable();

  return (
    <div {...getTableBodyProps()} className="tbody body">
      {rows.map((row, index) => {
        return <Row index={index} key={index} row={row} />;
      })}
      {pageSize > rows.length && (
        <EmptyRows rowCount={pageSize - rows.length} />
      )}
    </div>
  );
};
