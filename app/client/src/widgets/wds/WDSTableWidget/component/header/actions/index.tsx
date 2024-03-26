import {
  TextInput,
  Text,
  Flex,
  IconButton,
  Icon,
  ActionGroup,
  Item,
} from "@design-system/widgets";
import React from "react";
import type {
  ReactTableColumnProps,
  TableSizes,
  ReactTableFilter,
} from "../../Constants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { PageNumberInput } from "./PageNumberInput";

const MIN_WIDTH_TO_SHOW_PAGE_ITEMS = 676;

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
  onSearch: (searchKey: any) => void;
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

export const Actions = (props: ActionsPropsType) => {
  const { isVisibleSearch, onSearch } = props;

  const pageCount = `${props.pageNo + 1}${
    props.totalRecordsCount ? ` of ${props.pageCount}` : ``
  }`;

  return (
    <>
      {isVisibleSearch && (
        <TextInput
          onChange={onSearch}
          placeholder="Search..."
          size="small"
          startIcon={<Icon name="search" />}
          value={props.searchKey}
        />
      )}

      <ActionGroup size="small" variant="ghost">
        <Item>Hello</Item>
        <Item icon="download" key="download">
          Download
        </Item>
        <Item icon="plus" key="add-row">
          Add Row
        </Item>
      </ActionGroup>

      {!!props.columns.length &&
        props.isVisiblePagination &&
        props.serverSidePaginationEnabled && (
          <Flex alignItems="center" gap="spacing-1" marginLeft="auto">
            {props.totalRecordsCount &&
              props.width > MIN_WIDTH_TO_SHOW_PAGE_ITEMS && (
                <Text lineClamp={1} variant="footnote">
                  {props.totalRecordsCount} Records
                </Text>
              )}
            <IconButton
              icon="chevron-left"
              isDisabled={props.pageNo === 0}
              onPress={props.prevPageClick}
              size="small"
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
            />
          </Flex>
        )}
      {!!props.columns.length &&
        props.isVisiblePagination &&
        !props.serverSidePaginationEnabled && (
          <Flex alignItems="center" gap="spacing-1" marginLeft="auto">
            {props.width > MIN_WIDTH_TO_SHOW_PAGE_ITEMS && (
              <Text lineClamp={1} variant="footnote">
                {props.tableData?.length} Records
              </Text>
            )}
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
            />
          </Flex>
        )}
    </>
  );
};
