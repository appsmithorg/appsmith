import React from "react";
import styled from "styled-components";
import { Icon, Classes } from "@blueprintjs/core";
import {
  TableHeaderContentWrapper,
  PaginationWrapper,
  PaginationItemWrapper,
  CommonFunctionsMenuWrapper,
} from "../../TableStyledWrappers";
import { SearchComponent } from "design-system";
import TableFilters from "./filter";
import {
  ReactTableColumnProps,
  TableSizes,
  ReactTableFilter,
} from "../../Constants";
import TableDataDownload from "./Download";
import { Colors } from "constants/Colors";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { lightenColor } from "widgets/WidgetUtils";
import { PageNumberInput } from "./PageNumberInput";
import ActionItem from "./ActionItem";

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
export interface ActionsPropsType {
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
  boxShadow: string;
  accentColor: string;
  allowAddNewRow: boolean;
  onAddNewRow: () => void;
  disableAddNewRow: boolean;
}

function Actions(props: ActionsPropsType) {
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
      {(props.isVisibleFilters ||
        props.isVisibleDownload ||
        props.allowAddNewRow) && (
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

          {props.allowAddNewRow && (
            <ActionItem
              borderRadius={props.borderRadius}
              className="t--add-new-row"
              disabled={props.disableAddNewRow}
              disabledMessage="Save or discard the unsaved row to add a new row"
              icon="add"
              selectMenu={props.onAddNewRow}
              selected={false}
              title="Add new row"
              width={12}
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

export default Actions;
