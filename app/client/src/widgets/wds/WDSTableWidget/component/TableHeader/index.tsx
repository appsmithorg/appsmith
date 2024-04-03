import React, { useRef } from "react";

import { Search } from "./Search";
import { Actions } from "./Actions";
import type { SearchProps } from "./Search";
import type { ActionsPropsType } from "./Actions";
import { AddNewRowBanner } from "./AddNewRowBanner";
import type { AddNewRowBannerProps } from "./AddNewRowBanner";

import FilterPane from "./FilterPane";
import styles from "./styles.module.css";
import { Pagination } from "./Pagination";
import { Flex } from "@design-system/widgets";

interface TableHeaderProps
  extends ActionsPropsType,
    AddNewRowBannerProps,
    SearchProps {
  isAddRowInProgress: boolean;
}

function TableHeader(props: TableHeaderProps) {
  const {
    applyFilter,
    columns,
    disabledAddNewRowSave,
    isAddRowInProgress,
    isVisibleSearch,
    onAddNewRowAction,
    onSearch,
    searchKey,
    tableData,
    widgetId,
    ...rest
  } = props;
  const tableHeaderRef = useRef<HTMLDivElement>(null);

  const content = (() => {
    if (isAddRowInProgress) {
      return (
        <AddNewRowBanner
          disabledAddNewRowSave={disabledAddNewRowSave}
          onAddNewRowAction={onAddNewRowAction}
        />
      );
    }

    return (
      <>
        <Search
          isVisibleSearch={isVisibleSearch}
          onSearch={onSearch}
          searchKey={searchKey}
        />
        <Flex flexGrow={1} gap="spacing-1" justifyContent="space-between">
          <Actions
            applyFilter={applyFilter}
            columns={columns}
            tableData={tableData}
            widgetId={widgetId}
            {...rest}
          />
          <Pagination
            applyFilter={applyFilter}
            columns={columns}
            searchKey={searchKey}
            searchTableData={onSearch}
            tableData={tableData}
            widgetId={widgetId}
            {...rest}
          />
        </Flex>
      </>
    );
  })();

  return (
    <>
      <div className={styles["table-header"]} ref={tableHeaderRef}>
        <div data-layout="">{content}</div>
      </div>
      <FilterPane {...props} targetNode={tableHeaderRef.current ?? undefined} />
    </>
  );
}

export { TableHeader };
