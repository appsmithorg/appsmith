import { Colors } from "constants/Colors";
import React from "react";
import { type ReactTableColumnProps } from "../Constants";
import { useAppsmithTable } from "../TableContext";
import {
  TableHeaderInnerWrapper,
  TableHeaderWrapper,
} from "../TableStyledWrappers";
import BannerNActions from "./BannerNActions";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";

export default function TableHeader() {
  const {
    accentColor,
    allowAddNewRow,
    applyFilter,
    borderRadius,
    boxShadow,
    columns,
    currentPageIndex,
    data,
    delimiter,
    disabledAddNewRowSave,
    editableCell,
    filters,
    isAddRowInProgress,
    isVisibleDownload,
    isVisibleFilters,
    isVisiblePagination,
    isVisibleSearch,
    nextPageClick,
    onAddNewRow,
    onAddNewRowAction,
    pageCount,
    pageNo,
    pageOptions,
    prevPageClick,
    searchKey,
    searchTableData,
    serverSidePaginationEnabled,
    tableSizes,
    totalRecordsCount,
    updatePageNo,
    variant,
    widgetId,
    widgetName,
    width,
  } = useAppsmithTable();

  const tableHeaderColumns = React.useMemo(
    () =>
      columns.filter((column: ReactTableColumnProps) => {
        return column.alias !== "actions";
      }),
    [columns],
  );

  return (
    <SimpleBar
      style={{
        maxHeight: tableSizes.TABLE_HEADER_HEIGHT,
      }}
    >
      <TableHeaderWrapper
        backgroundColor={Colors.WHITE}
        serverSidePaginationEnabled={serverSidePaginationEnabled}
        tableSizes={tableSizes}
        width={width}
      >
        <TableHeaderInnerWrapper
          backgroundColor={Colors.WHITE}
          serverSidePaginationEnabled={serverSidePaginationEnabled}
          tableSizes={tableSizes}
          variant={variant}
          width={width}
        >
          <BannerNActions
            accentColor={accentColor}
            allowAddNewRow={allowAddNewRow}
            applyFilter={applyFilter}
            borderRadius={borderRadius}
            boxShadow={boxShadow}
            columns={tableHeaderColumns}
            currentPageIndex={currentPageIndex}
            delimiter={delimiter}
            disableAddNewRow={!!editableCell?.column}
            disabledAddNewRowSave={disabledAddNewRowSave}
            filters={filters}
            isAddRowInProgress={isAddRowInProgress}
            isVisibleDownload={isVisibleDownload}
            isVisibleFilters={isVisibleFilters}
            isVisiblePagination={isVisiblePagination}
            isVisibleSearch={isVisibleSearch}
            nextPageClick={nextPageClick}
            onAddNewRow={onAddNewRow}
            onAddNewRowAction={onAddNewRowAction}
            pageCount={pageCount}
            pageNo={pageNo}
            pageOptions={pageOptions}
            prevPageClick={prevPageClick}
            searchKey={searchKey}
            searchTableData={searchTableData}
            serverSidePaginationEnabled={serverSidePaginationEnabled}
            tableColumns={columns}
            tableData={data}
            tableSizes={tableSizes}
            totalRecordsCount={totalRecordsCount}
            updatePageNo={updatePageNo}
            widgetId={widgetId}
            widgetName={widgetName}
          />
        </TableHeaderInnerWrapper>
      </TableHeaderWrapper>
    </SimpleBar>
  );
}
