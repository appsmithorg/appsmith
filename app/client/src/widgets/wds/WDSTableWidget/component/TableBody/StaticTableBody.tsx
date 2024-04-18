import React from "react";
import { EmptyRows, Row } from "./Row";
import type { StaticTableProps } from "./types";

export const StaticTableBody = (props: StaticTableProps) => {
  return (
    <div {...props.getTableBodyProps()} className="tbody body">
      {props.rows.map((row, index) => {
        return <Row index={index} key={index} row={row} />;
      })}
      {props.pageSize > props.rows.length && (
        <EmptyRows rowCount={props.pageSize - props.rows.length} />
      )}
    </div>
  );
};
