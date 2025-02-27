import { Classes, Icon } from "@blueprintjs/core";
import { SearchComponent } from "@design-system/widgets-old";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { Colors } from "constants/Colors";
import React from "react";
import styled from "styled-components";
import { lightenColor } from "widgets/WidgetUtils";
import type { ReactTableColumnProps } from "../../Constants";
import { useAppsmithTable } from "../../TableContext";
import {
  CommonFunctionsMenuWrapper,
  PaginationItemWrapper,
  PaginationWrapper,
  TableHeaderContentWrapper,
} from "../../TableStyledWrappers";
import ActionItem from "./ActionItem";
import TableDataDownload from "./Download";
import TableFilters from "./filter";
import { PageNumberInput } from "./PageNumberInput";

const SearchComponentWrapper = styled.div<{
  borderRadius: string;
  boxShadow?: string;
  accentColor: string;
}>`
  margin: 6px 8px;
  padding: 0 8px;
  flex: 0 0 200px;
  border: 1px solid var(--wds-color-border);
  border-radius: ${({ borderRadius }) => borderRadius} !important;
  overflow: hidden;

  &:hover {
    border-color: var(--wds-color-border-hover);
  }

  &:focus-within {
    border-color: ${({ accentColor }) => accentColor} !important;
    box-shadow: 0 0 0 2px ${({ accentColor }) => lightenColor(accentColor)} !important;
  }

  & .${Classes.INPUT} {
    height: 100%;
    padding-left: 20px !important;
  }

  & > div {
    height: 100%;
  }

  // search component
  & > div > div {
    height: 100%;

    svg {
      height: 12px;
      width: 12px;

      path {
        fill: var(--wds-color-icon) !important;
      }
    }
  }

  // cross icon component
  & > div > div + div {
    top: 0;
    right: -4px;
    height: 100%;
    align-items: center;
    display: flex;

    svg {
      top: initial !important;
    }
  }

  & .${Classes.ICON} {
    margin: 0;
    height: 100%;
    display: flex;
    align-items: center;
  }

  & .${Classes.INPUT}:active, & .${Classes.INPUT}:focus {
    border-radius: ${({ borderRadius }) => borderRadius};
    border: 0px solid !important;
    border-color: ${({ accentColor }) => accentColor} !important;
    box-shadow: none !important;
  }
`;

function Actions() {
  const {
    accentColor,
    allowAddNewRow,
    applyFilter,
    borderRadius,
    boxShadow,
    columns: tableColumns,
    currentPageIndex,
    data: tableData,
    delimiter,
    disabledAddNewRowSave,
    filters,
    isInfiniteScrollEnabled,
    isVisibleDownload,
    isVisibleFilters,
    isVisiblePagination,
    isVisibleSearch,
    nextPageClick,
    onAddNewRow,
    pageCount,
    pageNo,
    prevPageClick,
    searchKey,
    searchTableData,
    serverSidePaginationEnabled,
    tableSizes,
    totalRecordsCount,
    updatePageNo,
    widgetId,
    widgetName,
  } = useAppsmithTable();

  const headerColumns = React.useMemo(
    () =>
      tableColumns.filter((column: ReactTableColumnProps) => {
        return column.alias !== "actions";
      }),
    [tableColumns],
  );

  return (
    <>
      {isVisibleSearch && (
        <SearchComponentWrapper
          accentColor={accentColor}
          borderRadius={borderRadius}
          boxShadow={boxShadow}
        >
          <SearchComponent
            onSearch={searchTableData}
            placeholder="Search..."
            value={searchKey}
          />
        </SearchComponentWrapper>
      )}
      {(isVisibleFilters || isVisibleDownload || allowAddNewRow) &&
        !!headerColumns.length && (
          <CommonFunctionsMenuWrapper tableSizes={tableSizes}>
            {isVisibleFilters && (
              <TableFilters
                accentColor={accentColor}
                applyFilter={applyFilter}
                borderRadius={borderRadius}
                columns={headerColumns}
                filters={filters}
                widgetId={widgetId}
              />
            )}

            {isVisibleDownload && (
              <TableDataDownload
                borderRadius={borderRadius}
                columns={tableColumns}
                data={tableData}
                delimiter={delimiter}
                widgetId={widgetId}
                widgetName={widgetName}
              />
            )}

            {allowAddNewRow && (
              <ActionItem
                borderRadius={borderRadius}
                className="t--add-new-row"
                disabled={disabledAddNewRowSave}
                disabledMessage="Save or discard the unsaved row to add a new row"
                icon="add"
                selectMenu={onAddNewRow}
                selected={false}
                title="Add new row"
                width={12}
              />
            )}
          </CommonFunctionsMenuWrapper>
        )}
      {!!headerColumns.length && isVisiblePagination ? (
        isInfiniteScrollEnabled ? (
          // When infinite scroll is enabled, n Records or n out of k Records is displayed
          <PaginationWrapper>
            <TableHeaderContentWrapper className="show-page-items">
              {tableData.length}{" "}
              {totalRecordsCount ? `out of ${totalRecordsCount}` : ""} Records
            </TableHeaderContentWrapper>
          </PaginationWrapper>
        ) : serverSidePaginationEnabled ? (
          // When server side pagination is enabled, n Records is displayed with prev and next buttons
          <PaginationWrapper>
            {totalRecordsCount ? (
              <TableHeaderContentWrapper className="show-page-items">
                {totalRecordsCount} Records
              </TableHeaderContentWrapper>
            ) : null}
            <PaginationItemWrapper
              accentColor={accentColor}
              borderRadius={borderRadius}
              className="t--table-widget-prev-page"
              disabled={pageNo === 0}
              onClick={() => {
                prevPageClick();
              }}
            >
              <Icon color={Colors.HIT_GRAY} icon="chevron-left" iconSize={16} />
            </PaginationItemWrapper>
            {totalRecordsCount ? (
              <TableHeaderContentWrapper>
                Page&nbsp;
                <PaginationItemWrapper
                  accentColor={accentColor}
                  borderRadius={borderRadius}
                  className="page-item"
                  selected
                >
                  {pageNo + 1}
                </PaginationItemWrapper>
                &nbsp;
                <span>{`of ${pageCount}`}</span>
              </TableHeaderContentWrapper>
            ) : (
              <PaginationItemWrapper
                accentColor={accentColor}
                borderRadius={borderRadius}
                className="page-item"
                selected
              >
                {pageNo + 1}
              </PaginationItemWrapper>
            )}
            <PaginationItemWrapper
              accentColor={accentColor}
              borderRadius={borderRadius}
              className="t--table-widget-next-page"
              disabled={!!totalRecordsCount && pageNo === pageCount - 1}
              onClick={() => {
                if (!(!!totalRecordsCount && pageNo === pageCount - 1))
                  nextPageClick();
              }}
            >
              <Icon
                color={Colors.HIT_GRAY}
                icon="chevron-right"
                iconSize={16}
              />
            </PaginationItemWrapper>
          </PaginationWrapper>
        ) : (
          // When client side pagination is enabled, n Records is displayed with prev and next buttons
          <PaginationWrapper>
            <TableHeaderContentWrapper className="show-page-items">
              {tableData?.length} Records
            </TableHeaderContentWrapper>
            <PaginationItemWrapper
              accentColor={accentColor}
              borderRadius={borderRadius}
              className="t--table-widget-prev-page"
              disabled={currentPageIndex === 0}
              onClick={() => {
                const pageNo = currentPageIndex > 0 ? currentPageIndex - 1 : 0;

                !(currentPageIndex === 0) &&
                  updatePageNo(pageNo + 1, EventType.ON_PREV_PAGE);
              }}
            >
              <Icon color={Colors.GRAY} icon="chevron-left" iconSize={16} />
            </PaginationItemWrapper>
            <TableHeaderContentWrapper>
              Page{" "}
              <PageNumberInput
                accentColor={accentColor}
                borderRadius={borderRadius}
                disabled={pageCount === 1}
                pageCount={pageCount}
                pageNo={pageNo + 1}
                updatePageNo={updatePageNo}
              />{" "}
              of {pageCount}
            </TableHeaderContentWrapper>
            <PaginationItemWrapper
              accentColor={accentColor}
              borderRadius={borderRadius}
              className="t--table-widget-next-page"
              disabled={currentPageIndex === pageCount - 1}
              onClick={() => {
                const pageNo =
                  currentPageIndex < pageCount - 1 ? currentPageIndex + 1 : 0;

                !(currentPageIndex === pageCount - 1) &&
                  updatePageNo(pageNo + 1, EventType.ON_NEXT_PAGE);
              }}
            >
              <Icon color={Colors.GRAY} icon="chevron-right" iconSize={16} />
            </PaginationItemWrapper>
          </PaginationWrapper>
        )
      ) : null}
    </>
  );
}

export default Actions;
