import React from "react";
import styled, { useTheme } from "styled-components";
import { FixedSizeList } from "react-window";
import { useTable, useBlockLayout, useResizeColumns } from "react-table";

import { scrollbarWidth } from "utils/helpers";
import { getType, Types } from "utils/TypeHelpers";
import ErrorBoundary from "components/editorComponents/ErrorBoundry";

// TODO(abhinav): The following two imports are from the table widget's component
// We need to decouple the platform stuff from the widget stuff
import { CellWrapper } from "widgets/TableWidget/component/TableStyledWrappers";
import AutoToolTipComponent from "widgets/TableWidget/component/AutoToolTipComponent";
import { isArray, uniqueId } from "lodash";
import type { Theme } from "constants/DefaultTheme";

interface TableProps {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>[];
  tableBodyHeight?: number;
  shouldResize?: boolean;
}

const TABLE_SIZES = {
  COLUMN_HEADER_HEIGHT: 38,
  TABLE_HEADER_HEIGHT: 42,
  ROW_HEIGHT: 40,
  ROW_FONT_SIZE: 14,
  SCROLL_SIZE: 20,
};

const NoDataMessage = styled.span`
  margin-left: 24px;
`;

// TODO: replace with ads table
export const TableWrapper = styled.div<{ minColumnWidth?: number }>`
  width: 100%;
  height: auto;
  background: var(--ads-v2-color-bg);
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  overflow: scroll;
  .tableWrap {
    height: 100%;
    display: block;
    overflow-x: auto;
    overflow-y: hidden;
  }
  .table {
    border-spacing: 0;
    color: var(--ads-v2-color-fg);
    position: relative;
    display: table;
    width: 100%;
    height: auto;
    .thead,
    .tbody {
      overflow: hidden;
    }
    .tbody {
      height: calc(100% - ${TABLE_SIZES.COLUMN_HEADER_HEIGHT}px);
      .tr {
        width: 100%;
      }
    }
    .tr {
      overflow: hidden;
      border-bottom: 1px solid var(--ads-v2-color-black-75);
      &.selected-row {
        background: var(--ads-v2-color-bg-subtle);
        &:hover {
          background: var(--ads-v2-color-bg-subtle);
        }
      }
      &:hover {
        background: var(--ads-v2-color-gray-50);
      }
    }
    .th,
    .td {
      margin: 0;
      padding: 9px 10px;
      position: relative;
      font-size: ${TABLE_SIZES.ROW_FONT_SIZE}px;
      line-height: ${TABLE_SIZES.ROW_FONT_SIZE}px;
      ${(props) =>
        `${
          props.minColumnWidth ? `min-width: ${props.minColumnWidth}px;` : ""
        }`}
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
          cursor: n-resize;
        }
      }
    }
    .th {
      padding: 0 10px 0 0;
      height: ${TABLE_SIZES.COLUMN_HEADER_HEIGHT}px;
      line-height: ${TABLE_SIZES.COLUMN_HEADER_HEIGHT}px;
      background: var(--ads-v2-color-gray-50);
    }
    .td {
      height: auto;
      line-height: ${TABLE_SIZES.ROW_HEIGHT}px;
      padding: 0 10px;
    }
  }
  .draggable-header,
  .hidden-header {
    width: 100%;
    height: 100%;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    color: var(--ads-v2-color-fg);
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
    height: ${TABLE_SIZES.COLUMN_HEADER_HEIGHT}px;
    line-height: ${TABLE_SIZES.COLUMN_HEADER_HEIGHT}px;
  }
  .th {
    display: flex;
    justify-content: space-between;
    &.highlight-left {
      border-left: 2px solid var(--ads-v2-color-border-success);
    }
    &.highlight-right {
      border-right: 2px solid var(--ads-v2-color-border-success);
    }
  }
`;

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    <AutoToolTipComponent
      boundary="viewport"
      position="left"
      title={displayValue}
    >
      {displayValue}
    </AutoToolTipComponent>
  );
};

// The function will return the scrollbar width that needs to be added
// in the table body width, when scrollbar is shown the width should be > 0,
// when scrollbar is not shown, width should be 0
// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getScrollBarWidth = (tableBodyEle: any, scrollBarW: number) => {
  return !!tableBodyEle && tableBodyEle.scrollHeight > tableBodyEle.clientHeight
    ? scrollBarW
    : 0;
};

function Table(props: TableProps) {
  const theme = useTheme() as Theme;
  const tableBodyRef = React.useRef<HTMLElement>();
  const { shouldResize = true } = props;

  const data = React.useMemo(() => {
    /* Check for length greater than 0 of rows returned from the query for mappings keys */
    if (!!props.data && isArray(props.data) && props.data.length > 0) {
      return props.data;
    }

    return [];
  }, [props.data]);

  const columns = React.useMemo(() => {
    if (data.length) {
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return Object.keys(data[0]).map((key: any) => {
        const uniqueKey = uniqueId();

        return {
          Header: key === "" ? uniqueKey : key,
          accessor: key,
          Cell: renderCell,
        };
      });
    }

    return [];
  }, [data]);

  const defaultColumn = React.useMemo(
    () => ({
      minWidth: 170,
    }),
    [],
  );

  const {
    getTableBodyProps,
    getTableProps,
    headerGroups,
    prepareRow,
    rows,
    totalColumnsWidth,
  } = useTable(
    {
      columns,
      data,
      manualPagination: true,
      defaultColumn,
    },
    useBlockLayout,
    useResizeColumns,
  );

  const responseTypePanelHeight = 24;
  const tableRowHeight = 35;

  // height of response pane with respect to other constants.
  let tableBodyHeightComputed =
    (props.tableBodyHeight || window.innerHeight) -
    TABLE_SIZES.COLUMN_HEADER_HEIGHT -
    theme.tabPanelHeight -
    TABLE_SIZES.SCROLL_SIZE -
    responseTypePanelHeight -
    2 * theme.spaces[4]; //top and bottom padding

  // actual height of all the rows.
  const actualHeightOfAllRows = rows.length * tableRowHeight;

  // if the actual height of all the rows is less than computed table body height
  // set the height of the body to it.
  if (rows.length && actualHeightOfAllRows < tableBodyHeightComputed) {
    tableBodyHeightComputed = actualHeightOfAllRows;
  }

  const tableBodyEle = tableBodyRef?.current;
  const scrollBarW = React.useMemo(() => scrollbarWidth(), []);
  const scrollBarSize = getScrollBarWidth(tableBodyEle, scrollBarW);

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
          {/* TODO: Fix this the next time the file is edited */}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {row.cells.map((cell: any, cellIndex: number) => {
            return (
              <div {...cell.getCellProps()} className="td" key={cellIndex}>
                <CellWrapper>{cell.render("Cell")}</CellWrapper>
              </div>
            );
          })}
        </div>
      );
    },
    [prepareRow, rows],
  );

  if (rows.length === 0 || headerGroups.length === 0)
    return (
      <NoDataMessage data-testid="no-data-table-message">
        No data records to show
      </NoDataMessage>
    );

  return (
    <ErrorBoundary>
      <TableWrapper
        className="t--table-response"
        data-guided-tour-id="query-table-response"
        minColumnWidth={defaultColumn.minWidth}
      >
        <div className="tableWrap">
          <div {...getTableProps()} className="table">
            <div>
              {/* TODO: Fix this the next time the file is edited */}
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {headerGroups.map((headerGroup: any, index: number) => (
                <div
                  {...headerGroup.getHeaderGroupProps()}
                  className="tr"
                  key={index}
                >
                  {headerGroup.headers.map(
                    // TODO: Fix this the next time the file is edited
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (column: any, columnIndex: number) => (
                      <div
                        {...column.getHeaderProps()}
                        className="th header-reorder"
                        key={columnIndex}
                      >
                        <div
                          className={
                            !column.isHidden
                              ? "draggable-header"
                              : "hidden-header"
                          }
                        >
                          <AutoToolTipComponent
                            boundary="viewport"
                            position="left"
                            title={column.render("Header")}
                          >
                            {column.render("Header")}
                            {shouldResize && (
                              <div
                                {...column.getResizerProps()}
                                className={`resizer ${
                                  column.isResizing ? "isResizing" : ""
                                }`}
                              />
                            )}
                          </AutoToolTipComponent>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              ))}
            </div>

            <div {...getTableBodyProps()} className="tbody">
              <FixedSizeList
                height={tableBodyHeightComputed || window.innerHeight}
                itemCount={rows.length}
                itemSize={35}
                outerRef={tableBodyRef}
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
}

export default Table;
