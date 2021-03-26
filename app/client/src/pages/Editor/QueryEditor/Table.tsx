import React from "react";
import styled from "styled-components";
import { FixedSizeList } from "react-window";
import { useTable, useBlockLayout } from "react-table";

import { Colors } from "constants/Colors";
import { scrollbarWidth } from "utils/helpers";
import { getType, Types } from "utils/TypeHelpers";
import ErrorBoundary from "components/editorComponents/ErrorBoundry";
import { CellWrapper } from "components/designSystems/appsmith/TableComponent/TableStyledWrappers";
import AutoToolTipComponent from "components/designSystems/appsmith/TableComponent/AutoToolTipComponent";

interface TableProps {
  data: Record<string, any>[];
}

const TABLE_SIZES = {
  COLUMN_HEADER_HEIGHT: 38,
  TABLE_HEADER_HEIGHT: 42,
  ROW_HEIGHT: 40,
  ROW_FONT_SIZE: 14,
};

export const TableWrapper = styled.div`
  width: 100%;
  height: 100%;
  background: white;
  border: 1px solid ${Colors.GEYSER_LIGHT};
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  overflow: hidden;
  .tableWrap {
    height: 100%;
    display: block;
    overflow-x: auto;
    overflow-y: hidden;
  }
  .table {
    border-spacing: 0;
    color: ${Colors.THUNDER};
    position: relative;
    background: ${Colors.ATHENS_GRAY_DARKER};
    display: table;
    width: 100%;
    .thead,
    .tbody {
      overflow: hidden;
    }
    .tbody {
      overflow-y: scroll;
      height: 100%;
      .tr {
        width: 100%;
      }
    }
    .tr {
      overflow: hidden;
      border-right: 1px solid ${Colors.GEYSER_LIGHT};
      :nth-child(even) {
        background: ${Colors.ATHENS_GRAY_DARKER};
      }
      :nth-child(odd) {
        background: ${Colors.WHITE};
      }
      &.selected-row {
        background: ${Colors.POLAR};
        &:hover {
          background: ${Colors.POLAR};
        }
      }
      &:hover {
        background: ${Colors.ATHENS_GRAY};
      }
    }
    .th,
    .td {
      margin: 0;
      padding: 9px 10px;
      border-bottom: 1px solid ${Colors.GEYSER_LIGHT};
      border-right: 1px solid ${Colors.GEYSER_LIGHT};
      position: relative;
      font-size: ${TABLE_SIZES.ROW_FONT_SIZE}px;
      line-height: ${TABLE_SIZES.ROW_FONT_SIZE}px;
      :last-child {
        border-right: 0;
      }
      .resizer {
        display: inline-block;
        width: 10px;
        height: 100%;
        position: absolute;
        right: 0;
        top: 0;
        transform: translateX(50%);
        z-index: 1;
        ${"" /* prevents from scrolling while dragging on touch devices */}
        touch-action:none;
        &.isResizing {
          cursor: isResizing;
        }
      }
    }
    .th {
      padding: 0 10px 0 0;
      height: ${TABLE_SIZES.COLUMN_HEADER_HEIGHT}px;
      line-height: ${TABLE_SIZES.COLUMN_HEADER_HEIGHT}px;
      background: ${Colors.ATHENS_GRAY_DARKER};
    }
    .td {
      height: ${TABLE_SIZES.ROW_HEIGHT}px;
      line-height: ${TABLE_SIZES.ROW_HEIGHT}px;
      padding: 0 10px;
    }
  }
  .draggable-header,
  .hidden-header {
    width: 100%;
    text-overflow: ellipsis;
    overflow: hidden;
    color: ${Colors.OXFORD_BLUE};
    font-weight: 500;
    padding-left: 10px;
    &.sorted {
      padding-left: 5px;
    }
  }
  .draggable-header {
    cursor: pointer;
    &.reorder-line {
      width: 1px;
      height: 100%;
    }
  }
  .hidden-header {
    opacity: 0.6;
  }
  .column-menu {
    cursor: pointer;
    height: ${TABLE_SIZES.COLUMN_HEADER_HEIGHT}px;
    line-height: ${TABLE_SIZES.COLUMN_HEADER_HEIGHT}px;
  }
  .th {
    display: flex;
    justify-content: space-between;
    &.highlight-left {
      border-left: 2px solid ${Colors.GREEN};
    }
    &.highlight-right {
      border-right: 2px solid ${Colors.GREEN};
    }
  }
`;

const renderCell = (props: any) => {
  const value = props.cell.value;
  let displayValue;
  switch (getType(value)) {
    case Types.NUMBER:
    case Types.BOOLEAN:
      displayValue = value.toString();
      break;
    case Types.ARRAY:
    case Types.FUNCTION:
    case Types.OBJECT:
      displayValue = JSON.stringify(value);
      break;
    case Types.STRING:
      displayValue = value;
      break;
    case Types.NULL:
    case Types.UNDEFINED:
    case Types.UNKNOWN:
      displayValue = "";
      break;
    default:
      displayValue = "";
  }

  return (
    <AutoToolTipComponent title={displayValue}>
      {displayValue}
    </AutoToolTipComponent>
  );
};

const Table = (props: TableProps) => {
  const data = React.useMemo(() => props.data, [props.data]);
  const columns = React.useMemo(() => {
    if (data.length) {
      return Object.keys(data[0]).map((key: any) => {
        return {
          Header: key,
          accessor: key,
          Cell: renderCell,
        };
      });
    }

    return [];
  }, [data]);

  const defaultColumn = React.useMemo(
    () => ({
      width: 170,
    }),
    [],
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    totalColumnsWidth,
  } = useTable(
    {
      columns,
      data,
      manualPagination: true,
      defaultColumn,
    },
    useBlockLayout,
  );

  const scrollBarSize = React.useMemo(() => scrollbarWidth(), []);

  const RenderRow = React.useCallback(
    ({ index, style }) => {
      const row = rows[index];

      prepareRow(row);
      return (
        <div
          {...row.getRowProps({
            style,
          })}
          className="tr"
        >
          {row.cells.map((cell: any, cellIndex: number) => {
            return (
              <div key={cellIndex} {...cell.getCellProps()} className="td">
                <CellWrapper>{cell.render("Cell")}</CellWrapper>
              </div>
            );
          })}
        </div>
      );
    },
    [prepareRow, rows],
  );

  if (rows.length === 0 || headerGroups.length === 0) return null;

  return (
    <ErrorBoundary>
      <TableWrapper>
        <div className="tableWrap">
          <div {...getTableProps()} className="table">
            <div>
              {headerGroups.map((headerGroup: any, index: number) => (
                <div
                  key={index}
                  {...headerGroup.getHeaderGroupProps()}
                  className="tr"
                >
                  {headerGroup.headers.map(
                    (column: any, columnIndex: number) => (
                      <div
                        key={columnIndex}
                        {...column.getHeaderProps()}
                        className="th header-reorder"
                      >
                        <div
                          className={
                            !column.isHidden
                              ? "draggable-header"
                              : "hidden-header"
                          }
                        >
                          {column.render("Header")}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              ))}
            </div>

            <div {...getTableBodyProps()} className="tbody">
              <FixedSizeList
                height={window.innerHeight}
                itemCount={rows.length}
                itemSize={35}
                width={totalColumnsWidth + scrollBarSize}
              >
                {RenderRow}
              </FixedSizeList>
            </div>
          </div>
        </div>
      </TableWrapper>
    </ErrorBoundary>
  );
};

export default Table;
