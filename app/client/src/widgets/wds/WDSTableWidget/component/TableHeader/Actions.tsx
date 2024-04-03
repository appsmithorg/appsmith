import { ActionGroup, Item } from "@design-system/widgets";
import type { Key } from "react";
import React, { useCallback } from "react";
import type {
  ReactTableColumnProps,
  TableSizes,
  ReactTableFilter,
} from "../Constants";
import type { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import {
  downloadDataAsCSV,
  transformTableDataIntoCsv,
  transformTableDataIntoExcel,
} from "../utilities";
import zipcelx from "zipcelx";
import { useDispatch } from "react-redux";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

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
  serverSidePaginationEnabled: boolean;
  filters?: ReactTableFilter[];
  applyFilter: (filters: ReactTableFilter[]) => void;
  tableSizes: TableSizes;
  isVisibleDownload?: boolean;
  isVisibleFilters?: boolean;
  isVisiblePagination?: boolean;
  delimiter: string;
  allowAddNewRow: boolean;
  onAddNewRow: () => void;
  disableAddNewRow: boolean;
  width: number;
}

export const Actions = (props: ActionsPropsType) => {
  const dispatch = useDispatch();
  const { allowAddNewRow, isVisibleDownload, isVisibleFilters, widgetId } =
    props;

  const toggleFilterPane = useCallback(
    (selected: boolean) => {
      if (selected) {
        dispatch({
          type: ReduxActionTypes.SHOW_TABLE_FILTER_PANE,
          payload: { widgetId, force: true },
        });
      } else {
        dispatch({
          type: ReduxActionTypes.HIDE_TABLE_FILTER_PANE,
          payload: { widgetId },
        });
      }
    },
    [widgetId],
  );

  // if no columns are present, return
  if (!props.columns.length) return null;

  // if none of the actions are visible, return
  if (!(isVisibleFilters || isVisibleDownload || allowAddNewRow)) return null;

  const onAction = (key: Key) => {
    switch (key) {
      case "filter":
        toggleFilterPane(true);
        break;
      case "add-row":
        props.onAddNewRow();
        break;
      case "download-csv":
        const csvData = transformTableDataIntoCsv({
          columns: props.columns,
          data: props.tableData,
        });

        downloadDataAsCSV({
          csvData: csvData,
          delimiter: props.delimiter,
          fileName: `${props.widgetName}.csv`,
        });
        break;
      case "download-excel":
        const tableData = transformTableDataIntoExcel({
          columns: props.columns,
          data: props.tableData,
        });

        zipcelx({
          filename: props.widgetName,
          sheet: {
            data: tableData,
          },
        });
        break;
      default:
        break;
    }
  };

  const actionItems = (() => {
    const items = [];

    if (isVisibleFilters)
      items.push(
        <Item icon="filter" key="filter">
          Filters
        </Item>,
      );
    if (isVisibleDownload) {
      items.push(
        <Item icon="download" key="download-csv">
          CSV
        </Item>,
      );
      items.push(
        <Item icon="download" key="download-excel">
          Excel
        </Item>,
      );
    }
    if (allowAddNewRow)
      items.push(
        <Item icon="plus" key="add-row">
          Add Row
        </Item>,
      );

    return items;
  })();

  return (
    <ActionGroup
      data-table-actions=""
      onAction={onAction}
      size="small"
      variant="ghost"
    >
      {actionItems}
    </ActionGroup>
  );
};
