import React, { Suspense } from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/ActionConstants";
import ReactTableComponent from "components/designSystems/appsmith/ReactTableComponent";

import { VALIDATION_TYPES } from "constants/WidgetValidation";
import {
  WidgetPropertyValidationType,
  BASE_WIDGET_VALIDATION,
} from "utils/ValidationFactory";
import { ColumnAction } from "components/propertyControls/ColumnActionSelectorControl";
import { TriggerPropertiesMap } from "utils/WidgetFactory";
import Skeleton from "components/utils/Skeleton";

class TableWidget extends BaseWidget<TableWidgetProps, WidgetState> {
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      ...BASE_WIDGET_VALIDATION,
      tableData: VALIDATION_TYPES.TABLE_DATA,
      nextPageKey: VALIDATION_TYPES.TEXT,
      prevPageKey: VALIDATION_TYPES.TEXT,
      label: VALIDATION_TYPES.TEXT,
      selectedRowIndex: VALIDATION_TYPES.NUMBER,
      searchKey: VALIDATION_TYPES.TEXT,
      // columnActions: VALIDATION_TYPES.ARRAY_ACTION_SELECTOR,
      // onRowSelected: VALIDATION_TYPES.ACTION_SELECTOR,
      // onPageChange: VALIDATION_TYPES.ACTION_SELECTOR,
    };
  }
  static getDerivedPropertiesMap() {
    return {
      selectedRow: "{{this.tableData[this.selectedRowIndex]}}",
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      pageNo: 1,
      pageSize: undefined,
      selectedRowIndex: -1,
      searchKey: "",
    };
  }

  static getTriggerPropertyMap(): TriggerPropertiesMap {
    return {
      onRowSelected: true,
      onPageChange: true,
      onSearch: true,
    };
  }

  searchTableData = (tableData: object[]) => {
    const searchKey =
      this.props.searchKey !== undefined
        ? this.props.searchKey.toString().toUpperCase()
        : "";
    return tableData.filter((item: object) => {
      return Object.values(item)
        .join(", ")
        .toUpperCase()
        .includes(searchKey);
    });
  };

  getPageView() {
    const { tableData, hiddenColumns } = this.props;
    const filteredTableData = this.searchTableData(tableData);

    const serverSidePaginationEnabled = (this.props
      .serverSidePaginationEnabled &&
      this.props.serverSidePaginationEnabled) as boolean;
    let pageNo = this.props.pageNo;

    if (pageNo === undefined) {
      pageNo = 1;
      super.updateWidgetMetaProperty("pageNo", pageNo);
    }
    const { componentWidth, componentHeight } = this.getComponentDimensions();
    const pageSize = Math.floor((componentHeight - 104) / 52);

    if (pageSize !== this.props.pageSize) {
      super.updateWidgetMetaProperty("pageSize", pageSize);
    }
    // /*
    return (
      <Suspense fallback={<Skeleton />}>
        <ReactTableComponent
          height={componentHeight}
          width={componentWidth}
          tableData={filteredTableData}
          isLoading={this.props.isLoading}
          widgetId={this.props.widgetId}
          widgetName={this.props.widgetName}
          searchKey={this.props.searchKey}
          renderMode={this.props.renderMode}
          hiddenColumns={hiddenColumns}
          columnActions={this.props.columnActions}
          columnNameMap={this.props.columnNameMap}
          columnTypeMap={this.props.columnTypeMap}
          columnOrder={this.props.columnOrder}
          pageSize={pageSize}
          onCommandClick={this.onCommandClick}
          selectedRowIndex={
            this.props.selectedRowIndex === undefined
              ? -1
              : this.props.selectedRowIndex
          }
          serverSidePaginationEnabled={serverSidePaginationEnabled}
          onRowClick={this.handleRowClick}
          pageNo={pageNo}
          nextPageClick={this.handleNextPageClick}
          prevPageClick={this.handlePrevPageClick}
          updatePageNo={(pageNo: number) => {
            super.updateWidgetMetaProperty("pageNo", pageNo);
          }}
          updateHiddenColumns={(hiddenColumns?: string[]) => {
            super.updateWidgetProperty("hiddenColumns", hiddenColumns);
          }}
          updateColumnType={(columnTypeMap: {
            [key: string]: { type: string; format: string };
          }) => {
            super.updateWidgetProperty("columnTypeMap", columnTypeMap);
          }}
          updateColumnName={(columnNameMap: { [key: string]: string }) => {
            super.updateWidgetProperty("columnNameMap", columnNameMap);
          }}
          handleResizeColumn={(columnSizeMap: { [key: string]: number }) => {
            super.updateWidgetProperty("columnSizeMap", columnSizeMap);
          }}
          handleReorderColumn={(columnOrder: string[]) => {
            super.updateWidgetProperty("columnOrder", columnOrder);
          }}
          columnSizeMap={this.props.columnSizeMap}
          resetSelectedRowIndex={this.resetSelectedRowIndex}
          disableDrag={(disable: boolean) => {
            this.disableDrag(disable);
          }}
          searchTableData={this.handleSearchTable}
        />
      </Suspense>
    );
  }

  handleSearchTable = (searchKey: any) => {
    const { onSearch } = this.props;
    super.updateWidgetMetaProperty("searchKey", searchKey);
    if (onSearch) {
      super.executeAction({
        dynamicString: onSearch,
        event: {
          type: EventType.ON_SEARCH,
        },
      });
    }
  };

  updateHiddenColumns = (hiddenColumns?: string[]) => {
    super.updateWidgetProperty("hiddenColumns", hiddenColumns);
  };

  onCommandClick = (action: string, onComplete: () => void) => {
    super.executeAction({
      dynamicString: action,
      event: {
        type: EventType.ON_CLICK,
        callback: onComplete,
      },
    });
  };

  handleRowClick = (rowData: object, index: number) => {
    const { onRowSelected } = this.props;
    super.updateWidgetMetaProperty("selectedRowIndex", index);
    if (onRowSelected) {
      super.executeAction({
        dynamicString: onRowSelected,
        event: {
          type: EventType.ON_ROW_SELECTED,
        },
      });
    }
  };

  handleNextPageClick = () => {
    let pageNo = this.props.pageNo || 1;
    pageNo = pageNo + 1;
    super.updateWidgetMetaProperty("pageNo", pageNo);
    if (this.props.onPageChange) {
      this.resetSelectedRowIndex();
      super.executeAction({
        dynamicString: this.props.onPageChange,
        event: {
          type: EventType.ON_NEXT_PAGE,
        },
      });
    }
  };

  resetSelectedRowIndex = () => {
    super.updateWidgetMetaProperty("selectedRowIndex", -1);
  };

  handlePrevPageClick = () => {
    let pageNo = this.props.pageNo || 1;
    pageNo = pageNo - 1;
    if (pageNo >= 1) {
      super.updateWidgetMetaProperty("pageNo", pageNo);
      if (this.props.onPageChange) {
        this.resetSelectedRowIndex();
        super.executeAction({
          dynamicString: this.props.onPageChange,
          event: {
            type: EventType.ON_PREV_PAGE,
          },
        });
      }
    }
  };

  getWidgetType(): WidgetType {
    return "TABLE_WIDGET";
  }
}

export interface TableWidgetProps extends WidgetProps {
  nextPageKey?: string;
  prevPageKey?: string;
  label: string;
  searchKey: string;
  tableData: object[];
  onPageChange?: string;
  pageSize: number;
  onRowSelected?: string;
  onSearch: string;
  selectedRowIndex?: number;
  columnActions?: ColumnAction[];
  serverSidePaginationEnabled?: boolean;
  hiddenColumns?: string[];
  columnOrder?: string[];
  columnNameMap?: { [key: string]: string };
  columnTypeMap?: { [key: string]: { type: string; format: string } };
  columnSizeMap?: { [key: string]: number };
}

export default TableWidget;
