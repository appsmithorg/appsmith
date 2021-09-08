import React, { useEffect, useCallback } from "react";
import styled from "styled-components";
import { Icon, NumericInput, Keys } from "@blueprintjs/core";
import {
  RowWrapper,
  PaginationWrapper,
  PaginationItemWrapper,
  CommonFunctionsMenuWrapper,
} from "./TableStyledWrappers";
import SearchComponent from "components/designSystems/appsmith/SearchComponent";
import TableFilters from "components/designSystems/appsmith/TableComponent/TableFilters";
import {
  ReactTableColumnProps,
  ReactTableFilter,
  TableSizes,
} from "components/designSystems/appsmith/TableComponent/Constants";
import TableDataDownload from "components/designSystems/appsmith/TableComponent/TableDataDownload";
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
  const handleUpdatePageNo = useCallback(
    (e) => {
      const oldPageNo = Number(props.pageNo || 0);
      let page = Number(e.target.value);
      // check page is less then min page count
      if (isNaN(page) || page < 1) {
        page = 1;
      }
      // check page is greater then max page count
      if (page > props.pageCount) {
        page = props.pageCount;
      }
      // fire Event based on new page number
      if (oldPageNo < page) {
        props.updatePageNo(page, EventType.ON_NEXT_PAGE);
      } else if (oldPageNo > page) {
        props.updatePageNo(page, EventType.ON_PREV_PAGE);
      }
      setPageNumber(page);
    },
    [props.pageNo, props.pageCount],
  );
  return (
    <PageNumberInputWrapper
      buttonPosition="none"
      clampValueOnBlur
      className="t--table-widget-page-input"
      disabled={props.disabled}
      max={props.pageCount || 1}
      min={1}
      onBlur={handleUpdatePageNo}
      onKeyDown={(e: any) => {
        if (e.keyCode === Keys.ENTER) {
          handleUpdatePageNo(e);
        }
      }}
      onValueChange={(value: number) => {
        setPageNumber(value);
      }}
      value={pageNumber}
    />
  );
}

function NextPageBtn(props: {
  currentPageIndex: number;
  pageCount: number;
  disabled: boolean;
  onClick?: () => void;
  updatePageNo?: (pageNo: number, event?: EventType) => void;
}) {
  const handleClick = useCallback(() => {
    if (props.onClick) {
      props.onClick();
    } else {
      const pageNo =
        props.currentPageIndex < props.pageCount - 1
          ? props.currentPageIndex + 1
          : 0;
      props.updatePageNo &&
        props.updatePageNo(pageNo + 1, EventType.ON_NEXT_PAGE);
    }
  }, [
    props.onClick,
    props.updatePageNo,
    props.currentPageIndex,
    props.pageCount,
  ]);
  return (
    <PaginationItemWrapper
      className="t--table-widget-next-page"
      disabled={props.disabled}
      onClick={handleClick}
    >
      <Icon color={Colors.GRAY} icon="chevron-right" iconSize={16} />
    </PaginationItemWrapper>
  );
}

function PrevPageBtn(props: {
  currentPageIndex: number;
  updatePageNo?: (pageNo: number, event?: EventType) => void;
  onClick?: () => void;
}) {
  const handleClick = useCallback(() => {
    if (props.onClick) {
      props.onClick();
    } else {
      const pageNo =
        props.currentPageIndex > 0 ? props.currentPageIndex - 1 : 0;
      props.updatePageNo &&
        props.updatePageNo(pageNo + 1, EventType.ON_PREV_PAGE);
    }
  }, [props.onClick, props.updatePageNo, props.currentPageIndex]);
  return (
    <PaginationItemWrapper
      className="t--table-widget-prev-page"
      disabled={props.currentPageIndex === 0}
      onClick={handleClick}
    >
      <Icon color={Colors.GRAY} icon="chevron-left" iconSize={16} />
    </PaginationItemWrapper>
  );
}

interface TableHeaderProps {
  updatePageNo: (pageNo: number, event?: EventType) => void;
  nextPageClick: () => void;
  prevPageClick: () => void;
  pageNo: number;
  totalRecordsCount?: number;
  tableData: Array<Record<string, unknown>>;
  tableColumns: ReactTableColumnProps[];
  pageCount: number;
  currentPageIndex: number;
  pageOptions: number[];
  columns: ReactTableColumnProps[];
  hiddenColumns?: string[];
  widgetName: string;
  widgetId: string;
  searchKey: string;
  searchTableData: (searchKey: any) => void;
  serverSidePaginationEnabled: boolean;
  filters?: ReactTableFilter[];
  applyFilter: (filters: ReactTableFilter[]) => void;
  tableSizes: TableSizes;
  isVisibleDownload?: boolean;
  isVisibleFilters?: boolean;
  isVisiblePagination?: boolean;
  isVisibleSearch?: boolean;
  infiniteScroll: boolean;
  delimiter: string;
}

function TableHeader(props: TableHeaderProps) {
  const showServerSidePagination =
    props.isVisiblePagination &&
    !props.infiniteScroll &&
    props.serverSidePaginationEnabled;
  const showClientSidePagination =
    props.isVisiblePagination &&
    !props.infiniteScroll &&
    !props.serverSidePaginationEnabled;
  return (
    <>
      {props.isVisibleSearch && (
        <SearchComponent
          onSearch={props.searchTableData}
          placeholder="Search..."
          value={props.searchKey}
        />
      )}
      {(props.isVisibleFilters || props.isVisibleDownload) && (
        <CommonFunctionsMenuWrapper tableSizes={props.tableSizes}>
          {props.isVisibleFilters && (
            <TableFilters
              applyFilter={props.applyFilter}
              columns={props.columns}
              filters={props.filters}
              widgetId={props.widgetId}
            />
          )}

          {props.isVisibleDownload && (
            <TableDataDownload
              columns={props.tableColumns}
              data={props.tableData}
              delimiter={props.delimiter}
              widgetName={props.widgetName}
            />
          )}
        </CommonFunctionsMenuWrapper>
      )}

      {showServerSidePagination && (
        <PaginationWrapper>
          <PrevPageBtn
            currentPageIndex={props.pageNo}
            onClick={props.prevPageClick}
          />
          <PaginationItemWrapper className="page-item" selected>
            {props.pageNo + 1}
          </PaginationItemWrapper>
          <NextPageBtn
            currentPageIndex={props.pageNo}
            disabled={
              !!props.totalRecordsCount && props.pageNo === props.pageCount - 1
            }
            onClick={props.nextPageClick}
            pageCount={props.pageCount}
          />
        </PaginationWrapper>
      )}
      {showClientSidePagination && (
        <PaginationWrapper>
          <RowWrapper className="show-page-items">
            {props.tableData?.length} Records
          </RowWrapper>
          <PrevPageBtn
            currentPageIndex={props.currentPageIndex}
            updatePageNo={props.updatePageNo}
          />
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
          <NextPageBtn
            currentPageIndex={props.currentPageIndex}
            disabled={props.currentPageIndex === props.pageCount - 1}
            pageCount={props.pageCount}
            updatePageNo={props.updatePageNo}
          />
        </PaginationWrapper>
      )}
    </>
  );
}

export default TableHeader;
