import { TextInput, Text, Flex, IconButton } from "@design-system/widgets";
import { importSvg } from "design-system-old";
import React from "react";
import { TableFilters } from "./filter";
import type {
  ReactTableColumnProps,
  TableSizes,
  ReactTableFilter,
} from "../../Constants";
import TableDataDownload from "./Download";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { PageNumberInput } from "./PageNumberInput";
import { Icon as BIcon } from "@blueprintjs/core";

import { Button, Tooltip } from "@design-system/widgets";
const AddIcon = importSvg(async () => import("assets/icons/control/add.svg"));

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

export const Actions = (props: ActionsPropsType) => {
  const pageCount = `${props.pageNo + 1}${
    props.totalRecordsCount ? ` of ${props.pageCount}` : ``
  }`;

  return (
    <>
      {props.isVisibleSearch && (
        <TextInput
          onChange={props.searchTableData}
          placeholder="Search..."
          startIcon={<BIcon icon="search" />}
          value={props.searchKey}
        />
      )}
      {(props.isVisibleFilters ||
        props.isVisibleDownload ||
        props.allowAddNewRow) &&
        !!props.columns.length && (
          <>
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

            {props.allowAddNewRow && (
              <Tooltip
                tooltip={
                  props.disableAddNewRow
                    ? "Save or discard the unsaved row to add a new row"
                    : ""
                }
              >
                <Button
                  data-testid="t--add-new-row"
                  icon={AddIcon}
                  isDisabled={props.disableAddNewRow}
                  onPress={props.onAddNewRow}
                  variant="ghost"
                >
                  Add new row
                </Button>
              </Tooltip>
            )}
          </>
        )}

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
              icon={() => <BIcon icon="chevron-left" />}
              isDisabled={props.pageNo === 0}
              onPress={props.prevPageClick}
              size="small"
            />
            <Text lineClamp={1} variant="footnote">
              Page {pageCount}
            </Text>
            <IconButton
              icon={() => <BIcon icon="chevron-right" />}
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
              icon={() => <BIcon icon="chevron-left" />}
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
              icon={() => <BIcon icon="chevron-right" />}
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
