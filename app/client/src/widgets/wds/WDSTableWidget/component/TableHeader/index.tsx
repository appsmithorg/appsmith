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
      </>
    );
  })();

  return (
    <>
      <div className={styles["table-header"]} ref={tableHeaderRef}>
        {content}
      </div>
      <FilterPane {...props} targetNode={tableHeaderRef.current ?? undefined} />
    </>
  );
}

export { TableHeader };
