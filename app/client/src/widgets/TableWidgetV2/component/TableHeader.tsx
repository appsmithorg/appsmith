import React, { useEffect, useCallback } from "react";
import styled from "styled-components";
import { Icon, NumericInput, Keys, Classes } from "@blueprintjs/core";
import {
  TableHeaderContentWrapper,
  PaginationWrapper,
  PaginationItemWrapper,
  CommonFunctionsMenuWrapper,
} from "./TableStyledWrappers";
import { SearchComponent } from "design-system";
import TableFilters from "./TableFilters";
import {
  ReactTableColumnProps,
  TableSizes,
  ReactTableFilter,
} from "./Constants";
import TableDataDownload from "./TableDataDownload";
import { Colors } from "constants/Colors";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { lightenColor } from "widgets/WidgetUtils";

const PageNumberInputWrapper = styled(NumericInput)<{
  borderRadius: string;
  accentColor?: string;
}>`
  &&& input {
    box-shadow: none;
    border: 1px solid var(--wds-color-border);
    background: var(--wds-color-bg);
    box-sizing: border-box;
    width: 24px;
    height: 24px;
    line-height: 24px;
    padding: 0 !important;
    text-align: center;
    font-size: 12px;
    border-radius: ${({ borderRadius }) => borderRadius};

    &:disabled {
      border-color: var(--wds-color-border-disabled);
      background: var(--wds-color-bg-disabled);
      color: var(--wds-color-text-disabled);
    }
  }

  &&&.bp3-control-group > :only-child {
    border-radius: 0;
  }

  & input:hover:not(:disabled) {
    border-color: var(--wds-color-border-hover) !important;
  }

  & input:focus {
    box-shadow: 0 0 0 2px ${({ accentColor }) => lightenColor(accentColor)} !important;
    border-color: ${({ accentColor }) => accentColor} !important;
  }
  margin: 0 8px;
`;

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

function PageNumberInput(props: {
  pageNo: number;
  pageCount: number;
  updatePageNo: (pageNo: number, event?: EventType) => void;
  disabled: boolean;
  borderRadius: string;
  accentColor?: string;
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
      accentColor={props.accentColor}
      borderRadius={props.borderRadius}
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
  delimiter: string;
  borderRadius: string;
  boxShadow?: string;
  accentColor: string;
}

function TableHeader(props: TableHeaderProps) {
  return (
    <>
      {props.isVisibleSearch && (
        <SearchComponentWrapper
          accentColor={props.accentColor}
          borderRadius={props.borderRadius}
          boxShadow={props.boxShadow}
        >
          <SearchComponent
            onSearch={props.searchTableData}
            placeholder="Search..."
            value={props.searchKey}
          />
        </SearchComponentWrapper>
      )}
      {(props.isVisibleFilters || props.isVisibleDownload) && (
        <CommonFunctionsMenuWrapper tableSizes={props.tableSizes}>
          {props.isVisibleFilters && (
            <TableFilters
              accentColor={props.accentColor}
              applyFilter={props.applyFilter}
              borderRadius={props.borderRadius}
              columns={props.columns}
              filters={props.filters}
              widgetId={props.widgetId}
            />
          )}

          {props.isVisibleDownload && (
            <TableDataDownload
              borderRadius={props.borderRadius}
              columns={props.tableColumns}
              data={props.tableData}
              delimiter={props.delimiter}
              widgetName={props.widgetName}
            />
          )}
        </CommonFunctionsMenuWrapper>
      )}

      {props.isVisiblePagination && props.serverSidePaginationEnabled && (
        <PaginationWrapper>
          {props.totalRecordsCount ? (
            <TableHeaderContentWrapper className="show-page-items">
              {props.totalRecordsCount} Records
            </TableHeaderContentWrapper>
          ) : null}
          <PaginationItemWrapper
            accentColor={props.accentColor}
            borderRadius={props.borderRadius}
            className="t--table-widget-prev-page"
            disabled={props.pageNo === 0}
            onClick={() => {
              props.prevPageClick();
            }}
          >
            <Icon color={Colors.HIT_GRAY} icon="chevron-left" iconSize={16} />
          </PaginationItemWrapper>
          {props.totalRecordsCount ? (
            <TableHeaderContentWrapper>
              Page&nbsp;
              <PaginationItemWrapper
                accentColor={props.accentColor}
                borderRadius={props.borderRadius}
                className="page-item"
                selected
              >
                {props.pageNo + 1}
              </PaginationItemWrapper>
              &nbsp;
              <span
                data-pagecount={props.pageCount}
              >{`of ${props.pageCount}`}</span>
            </TableHeaderContentWrapper>
          ) : (
            <PaginationItemWrapper
              accentColor={props.accentColor}
              borderRadius={props.borderRadius}
              className="page-item"
              selected
            >
              {props.pageNo + 1}
            </PaginationItemWrapper>
          )}
          <PaginationItemWrapper
            accentColor={props.accentColor}
            borderRadius={props.borderRadius}
            className="t--table-widget-next-page"
            disabled={
              !!props.totalRecordsCount && props.pageNo === props.pageCount - 1
            }
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
          <TableHeaderContentWrapper className="show-page-items">
            {props.tableData?.length} Records
          </TableHeaderContentWrapper>
          <PaginationItemWrapper
            accentColor={props.accentColor}
            borderRadius={props.borderRadius}
            className="t--table-widget-prev-page"
            disabled={props.currentPageIndex === 0}
            onClick={() => {
              const pageNo =
                props.currentPageIndex > 0 ? props.currentPageIndex - 1 : 0;
              !(props.currentPageIndex === 0) &&
                props.updatePageNo(pageNo + 1, EventType.ON_PREV_PAGE);
            }}
          >
            <Icon color={Colors.GRAY} icon="chevron-left" iconSize={16} />
          </PaginationItemWrapper>
          <TableHeaderContentWrapper>
            Page{" "}
            <PageNumberInput
              accentColor={props.accentColor}
              borderRadius={props.borderRadius}
              disabled={props.pageCount === 1}
              pageCount={props.pageCount}
              pageNo={props.pageNo + 1}
              updatePageNo={props.updatePageNo}
            />{" "}
            of {props.pageCount}
          </TableHeaderContentWrapper>
          <PaginationItemWrapper
            accentColor={props.accentColor}
            borderRadius={props.borderRadius}
            className="t--table-widget-next-page"
            disabled={props.currentPageIndex === props.pageCount - 1}
            onClick={() => {
              const pageNo =
                props.currentPageIndex < props.pageCount - 1
                  ? props.currentPageIndex + 1
                  : 0;
              !(props.currentPageIndex === props.pageCount - 1) &&
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
