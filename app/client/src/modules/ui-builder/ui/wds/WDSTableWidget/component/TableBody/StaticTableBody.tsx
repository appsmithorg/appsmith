import React from "react";
import { EmptyRows, Row } from "./Row";
import type {
  TableBodyProps,
  TableBodyPropGetter,
  Row as ReactTableRowType,
} from "react-table";

export interface StaticTableProps {
  getTableBodyProps(
    propGetter?: TableBodyPropGetter<Record<string, unknown>> | undefined,
  ): TableBodyProps;
  pageSize: number;
  rows: ReactTableRowType<Record<string, unknown>>[];
  height: number;
  excludeFromTabOrder?: boolean;
}

export const StaticTableBody = (props: StaticTableProps) => {
  return (
    <div {...props.getTableBodyProps()} className="tbody body">
      {props.rows.map((row, index) => {
        return (
          <Row
            excludeFromTabOrder={props.excludeFromTabOrder}
            index={index}
            key={index}
            row={row}
          />
        );
      })}
      {props.pageSize > props.rows.length && (
        <EmptyRows
          excludeFromTabOrder={props.excludeFromTabOrder}
          rowCount={props.pageSize - props.rows.length}
        />
      )}
    </div>
  );
};
