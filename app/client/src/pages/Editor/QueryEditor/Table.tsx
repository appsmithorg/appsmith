import React from "react";
import {
  TableWrapper,
  CellWrapper,
} from "components/designSystems/appsmith/TableStyledWrappers";
import { useTable, useFlexLayout } from "react-table";
import styled from "styled-components";
import { CompactModeTypes } from "components/designSystems/appsmith/TableCompactMode";
import { TABLE_SIZES } from "components/designSystems/appsmith/Table";

interface TableProps {
  data: Record<string, any>[];
}

const StyledTableWrapped = styled(TableWrapper)`
  min-height: 0px;
  height: auto;
  .tableWrap {
    display: flex;
    flex: 1;
  }
  .table {
    display: flex;
    flex: 1;
    flex-direction: column;
    height: auto;
    .tbody {
      overflow: auto;
    }
  }
`;

const Table = (props: TableProps) => {
  const data = React.useMemo(() => props.data, [props.data]);
  const columns = React.useMemo(() => {
    if (data.length) {
      return Object.keys(data[0]).map((key: any) => {
        return {
          Header: key,
          accessor: key,
        };
      });
    }

    return [];
  }, [data]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable(
    {
      columns,
      data,
      manualPagination: true,
    },
    useFlexLayout,
  );

  return (
    <StyledTableWrapped
      width={200}
      height={200}
      tableSizes={TABLE_SIZES[CompactModeTypes.DEFAULT]}
    >
      <div className="tableWrap">
        <div {...getTableProps()} className="table">
          {headerGroups.map((headerGroup: any, index: number) => (
            <div
              key={index}
              {...headerGroup.getHeaderGroupProps()}
              className="tr"
            >
              {headerGroup.headers.map((column: any, columnIndex: number) => (
                <div
                  key={columnIndex}
                  {...column.getHeaderProps()}
                  className="th header-reorder"
                >
                  <div
                    className={
                      !column.isHidden ? "draggable-header" : "hidden-header"
                    }
                  >
                    {column.render("Header")}
                  </div>
                </div>
              ))}
            </div>
          ))}
          {headerGroups.length === 0 && renderEmptyRows(1, 2)}
          <div {...getTableBodyProps()} className="tbody">
            {rows.map((row: any, index: number) => {
              prepareRow(row);
              return (
                <div key={index} {...row.getRowProps()} className={"tr"}>
                  {row.cells.map((cell: any, cellIndex: number) => {
                    return (
                      <div
                        key={cellIndex}
                        {...cell.getCellProps()}
                        className="td"
                        data-rowindex={index}
                        data-colindex={cellIndex}
                      >
                        <CellWrapper isHidden={false}>
                          {cell.render("Cell")}
                        </CellWrapper>
                      </div>
                    );
                  })}
                </div>
              );
            })}
            {rows.length === 0 && renderEmptyRows(1, 2)}
          </div>
        </div>
      </div>
    </StyledTableWrapped>
  );
};

const renderEmptyRows = (rowCount: number, columns: number) => {
  const rows: string[] = new Array(rowCount).fill("");
  const tableColumns = new Array(columns).fill("");
  return (
    <React.Fragment>
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
            {tableColumns.map((column: any, colIndex: number) => {
              return (
                <div
                  key={colIndex}
                  className="td"
                  style={{
                    boxSizing: "border-box",
                    flex: "1 0 auto",
                  }}
                />
              );
            })}
          </div>
        );
      })}
    </React.Fragment>
  );
};

export default Table;
