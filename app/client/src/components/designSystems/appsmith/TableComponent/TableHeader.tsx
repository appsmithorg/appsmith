import React, { useEffect } from "react";
import styled from "styled-components";
import { Icon, NumericInput } from "@blueprintjs/core";
import {
  RowWrapper,
  PaginationWrapper,
  PaginationItemWrapper,
  CommonFunctionsMenuWrapper,
} from "./TableStyledWrappers";
import SearchComponent from "components/designSystems/appsmith/SearchComponent";
// import TableColumnsVisibility from "components/designSystems/appsmith/TableColumnsVisibility";
import TableFilters, {
  ReactTableFilter,
} from "components/designSystems/appsmith/TableComponent/TableFilters";
import {
  ReactTableColumnProps,
  CompactMode,
  TableSizes,
} from "components/designSystems/appsmith/TableComponent/Constants";
import TableDataDownload from "components/designSystems/appsmith/TableComponent/TableDataDownload";
import TableCompactMode from "components/designSystems/appsmith/TableComponent/TableCompactMode";
import { Colors } from "constants/Colors";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

const PageNumberInputWrapper = styled(NumericInput)`
  &&& input {
    box-shadow: none;
    border: 1px solid ${Colors.DANUBE};
    background: linear-gradient(0deg, ${Colors.WHITE}, ${Colors.WHITE}),
      ${Colors.POLAR};
    border-radius: none;
    box-sizing: border-box;
    width: 24px;
    height: 24px;
    line-height: 24px;
    padding: 0 !important;
    text-align: center;
    font-size: 12px;
  }
  &&&.bp3-control-group > :only-child {
    border-radius: 0;
  }
  margin: 0 8px;
`;

function PageNumberInput(props: {
  pageNo: number;
  pageCount: number;
  updatePageNo: (pageNo: number, event?: EventType) => void;
  disabled: boolean;
}) {
  const [pageNumber, setPageNumber] = React.useState(props.pageNo || 0);
  useEffect(() => {
    setPageNumber(props.pageNo || 0);
  }, [props.pageNo]);
  return (
    <PageNumberInputWrapper
      buttonPosition="none"
      clampValueOnBlur
      className="t--table-widget-page-input"
      disabled={props.disabled}
      max={props.pageCount || 1}
      min={1}
      onBlur={(e: any) => {
        const oldPageNo = Number(props.pageNo || 0);
        const value = e.target.value;
        let page = Number(value);
        if (isNaN(value) || Number(value) < 1) {
          page = 1;
        }
        if (oldPageNo < page) {
          props.updatePageNo(page, EventType.ON_NEXT_PAGE);
        } else if (oldPageNo > page) {
          props.updatePageNo(page, EventType.ON_PREV_PAGE);
        }
      }}
      onValueChange={(value: number) => {
        if (isNaN(value) || value < 1) {
          setPageNumber(1);
        } else if (value > props.pageCount) {
          setPageNumber(props.pageCount);
        } else {
          setPageNumber(value);
        }
      }}
      value={pageNumber}
    />
  );
}

interface TableHeaderProps {
  updatePageNo: (pageNo: number, event?: EventType) => void;
  nextPageClick: () => void;
  prevPageClick: () => void;
  pageNo: number;
  defaultPageSize?: number;
  totalRecordsCount?: number;
  tableData: Array<Record<string, unknown>>;
  tableColumns: ReactTableColumnProps[];
  pageCount: number;
  currentPageIndex: number;
  pageOptions: number[];
  columns: ReactTableColumnProps[];
  hiddenColumns?: string[];
  widgetName: string;
  searchKey: string;
  searchTableData: (searchKey: any) => void;
  serverSidePaginationEnabled: boolean;
  filters?: ReactTableFilter[];
  applyFilter: (filters: ReactTableFilter[]) => void;
  editMode: boolean;
  compactMode?: CompactMode;
  updateCompactMode: (compactMode: CompactMode) => void;
  tableSizes: TableSizes;
  isVisibleCompactMode?: boolean;
  isVisibleDownload?: boolean;
  isVisibleFilters?: boolean;
  isVisiblePagination?: boolean;
  isVisibleSearch?: boolean;
}

function TableHeader(props: TableHeaderProps) {
  return (
    <>
      {props.isVisibleSearch && (
        <SearchComponent
          onSearch={props.searchTableData}
          placeholder="Search..."
          value={props.searchKey}
        />
      )}
      {(props.isVisibleFilters ||
        props.isVisibleDownload ||
        props.isVisibleCompactMode) && (
        <CommonFunctionsMenuWrapper tableSizes={props.tableSizes}>
          {props.isVisibleFilters && (
            <TableFilters
              applyFilter={props.applyFilter}
              columns={props.columns}
              editMode={props.editMode}
              filters={props.filters}
            />
          )}

          {props.isVisibleDownload && (
            <TableDataDownload
              columns={props.tableColumns}
              data={props.tableData}
              widgetName={props.widgetName}
            />
          )}

          {props.isVisibleCompactMode && (
            <TableCompactMode
              compactMode={props.compactMode}
              updateCompactMode={props.updateCompactMode}
            />
          )}
        </CommonFunctionsMenuWrapper>
      )}

      {props.isVisiblePagination && props.serverSidePaginationEnabled && (
        <PaginationWrapper>
          <PaginationItemWrapper
            className="t--table-widget-prev-page"
            disabled={props.pageNo === 0}
            onClick={() => {
              props.prevPageClick();
            }}
          >
            <Icon color={Colors.HIT_GRAY} icon="chevron-left" iconSize={16} />
          </PaginationItemWrapper>
          <PaginationItemWrapper className="page-item" selected>
            {props.pageNo + 1}
          </PaginationItemWrapper>
          <PaginationItemWrapper
            className="t--table-widget-next-page"
            disabled={props.pageNo === props.pageCount - 1}
            onClick={() => {
              props.nextPageClick();
            }}
          >
            <Icon color={Colors.HIT_GRAY} icon="chevron-right" iconSize={16} />
          </PaginationItemWrapper>
        </PaginationWrapper>
      )}
      {props.isVisiblePagination && !props.serverSidePaginationEnabled && (
        <PaginationWrapper>
          <RowWrapper className="show-page-items">
            {props.totalRecordsCount
              ? props.totalRecordsCount
              : props.tableData?.length}{" "}
            Records
          </RowWrapper>
          <PaginationItemWrapper
            className="t--table-widget-prev-page"
            disabled={props.currentPageIndex === 0}
            onClick={() => {
              const pageNo =
                props.currentPageIndex > 0 ? props.currentPageIndex - 1 : 0;
              props.updatePageNo(pageNo + 1, EventType.ON_PREV_PAGE);
            }}
          >
            <Icon color={Colors.GRAY} icon="chevron-left" iconSize={16} />
          </PaginationItemWrapper>
          <RowWrapper>
            Page{" "}
            <PageNumberInput
              disabled={props.pageCount === 1}
              pageCount={props.pageCount}
              pageNo={props.pageNo + 1}
              updatePageNo={props.updatePageNo}
            />{" "}
            of {props.pageCount}
          </RowWrapper>
          <PaginationItemWrapper
            className="t--table-widget-next-page"
            disabled={props.currentPageIndex === props.pageCount - 1}
            onClick={() => {
              const pageNo =
                props.currentPageIndex < props.pageCount - 1
                  ? props.currentPageIndex + 1
                  : 0;
              props.updatePageNo(pageNo + 1, EventType.ON_NEXT_PAGE);
            }}
          >
            <Icon color={Colors.GRAY} icon="chevron-right" iconSize={16} />
          </PaginationItemWrapper>
        </PaginationWrapper>
      )}
    </>
  );
}

export default TableHeader;
