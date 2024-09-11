import React from "react";
import { IconButton, Text } from "@appsmith/wds";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

import type { ReactTableColumnProps } from "../Constants";
import { PageNumberInput } from "./PageNumberInput";

export interface PaginationProps {
  updatePageNo: (pageNo: number, event?: EventType) => void;
  nextPageClick: () => void;
  prevPageClick: () => void;
  pageNo: number;
  totalRecordsCount?: number;
  tableData: Array<Record<string, unknown>>;
  pageCount: number;
  currentPageIndex: number;
  columns: ReactTableColumnProps[];
  serverSidePaginationEnabled: boolean;
  isVisiblePagination?: boolean;
  excludeFromTabOrder?: boolean;
}

export const Pagination = (props: PaginationProps) => {
  if (!props.columns.length) return null;
  if (!props.isVisiblePagination) return null;

  return (
    <div data-table-header-pagination="">
      <Text lineClamp={1} size="footnote">
        {props.tableData?.length} Records
      </Text>
      <IconButton
        excludeFromTabOrder={props.excludeFromTabOrder}
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
      <Text lineClamp={1} size="footnote">
        Page
      </Text>
      <PageNumberInput
        disabled={props.pageCount === 1}
        excludeFromTabOrder={props.excludeFromTabOrder}
        pageCount={props.pageCount}
        pageNo={props.pageNo + 1}
        updatePageNo={props.updatePageNo}
      />
      <Text lineClamp={1} size="footnote">
        of {props.pageCount}
      </Text>
      <IconButton
        excludeFromTabOrder={props.excludeFromTabOrder}
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
  );
};
