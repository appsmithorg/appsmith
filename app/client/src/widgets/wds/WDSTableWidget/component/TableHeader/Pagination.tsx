import { IconButton, Text } from "@design-system/widgets";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import React from "react";
import { PageNumberInput } from "./PageNumberInput";
import type {
  ReactTableColumnProps,
  ReactTableFilter,
  TableSizes,
} from "../Constants";

export interface PaginationProps {
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
  allowAddNewRow: boolean;
  onAddNewRow: () => void;
  disableAddNewRow: boolean;
  width: number;
}

export const Pagination = (props: PaginationProps) => {
  const pageCount = `${props.pageNo + 1}${
    props.totalRecordsCount ? ` of ${props.pageCount}` : ``
  }`;

  return (
    <>
      {!!props.columns.length &&
        props.isVisiblePagination &&
        props.serverSidePaginationEnabled && (
          <div data-table-header-pagination="">
            {props.totalRecordsCount ? (
              <Text lineClamp={1} variant="footnote">
                {props.totalRecordsCount} Records
              </Text>
            ) : null}
            <IconButton
              icon="chevron-left"
              isDisabled={props.pageNo === 0}
              onPress={props.prevPageClick}
              size="small"
              variant="outlined"
            />
            <Text lineClamp={1} variant="footnote">
              Page {pageCount}
            </Text>
            <IconButton
              icon="chevron-right"
              isDisabled={
                !!props.totalRecordsCount &&
                props.pageNo === props.pageCount - 1
              }
              onPress={props.nextPageClick}
              size="small"
              variant="outlined"
            />
          </div>
        )}
      {!!props.columns.length &&
        props.isVisiblePagination &&
        !props.serverSidePaginationEnabled && (
          <div data-table-header-pagination="">
            <Text lineClamp={1} variant="footnote">
              {props.tableData?.length} Records
            </Text>
            <IconButton
              icon="chevron-left"
              isDisabled={props.currentPageIndex === 0}
              onPress={() => {
                const pageNo =
                  props.currentPageIndex > 0 ? props.currentPageIndex - 1 : 0;
                !(props.currentPageIndex === 0) &&
                  props.updatePageNo(pageNo + 1, EventType.ON_PREV_PAGE);
              }}
              size="small"
              variant="outlined"
            />
            <Text lineClamp={1} variant="footnote">
              Page
            </Text>
            <PageNumberInput
              disabled={props.pageCount === 1}
              pageCount={props.pageCount}
              pageNo={props.pageNo + 1}
              updatePageNo={props.updatePageNo}
            />
            <Text lineClamp={1} variant="footnote">
              of {props.pageCount}
            </Text>
            <IconButton
              icon="chevron-right"
              isDisabled={props.currentPageIndex === props.pageCount - 1}
              onPress={() => {
                const pageNo =
                  props.currentPageIndex < props.pageCount - 1
                    ? props.currentPageIndex + 1
                    : 0;
                !(props.currentPageIndex === props.pageCount - 1) &&
                  props.updatePageNo(pageNo + 1, EventType.ON_NEXT_PAGE);
              }}
              size="small"
              variant="outlined"
            />
          </div>
        )}
    </>
  );
};
