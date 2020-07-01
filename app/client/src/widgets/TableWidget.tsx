import React, { Suspense } from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/ActionConstants";
// import { forIn } from "lodash";
import ReactTableComponent from "components/designSystems/appsmith/ReactTableComponent";

import { VALIDATION_TYPES } from "constants/WidgetValidation";
import {
  WidgetPropertyValidationType,
  BASE_WIDGET_VALIDATION,
} from "utils/ValidationFactory";
import { ColumnAction } from "components/propertyControls/ColumnActionSelectorControl";
import { TriggerPropertiesMap } from "utils/WidgetFactory";
import Skeleton from "components/utils/Skeleton";
import { Classes } from "@blueprintjs/core";

// const ROW_HEIGHT = 37;
// const TABLE_HEADER_HEIGHT = 39;
// const TABLE_FOOTER_HEIGHT = 48;
// const TABLE_EXPORT_HEIGHT = 43;

// function constructColumns(
//   data: object[],
//   hiddenColumns?: string[],
// ): ColumnModel[] | ColumnDirTypecast[] {
//   let cols: ColumnModel[] | ColumnDirTypecast[] = [];
//   const listItemWithAllProperties = {};
//   data.forEach(dataItem => {
//     Object.assign(listItemWithAllProperties, dataItem);
//   });
//   forIn(listItemWithAllProperties, (value: any, key: string) => {
//     cols.push({
//       field: key,
//       visible: !hiddenColumns?.includes(key),
//     });
//   });
//   cols = (cols as any[]).filter(col => col.field !== "_color") as
//     | ColumnModel[]
//     | ColumnDirTypecast[];
//   return cols;
// }

class TableWidget extends BaseWidget<TableWidgetProps, WidgetState> {
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      ...BASE_WIDGET_VALIDATION,
      tableData: VALIDATION_TYPES.TABLE_DATA,
      nextPageKey: VALIDATION_TYPES.TEXT,
      prevPageKey: VALIDATION_TYPES.TEXT,
      label: VALIDATION_TYPES.TEXT,
      selectedRowIndex: VALIDATION_TYPES.NUMBER,
      columnActions: VALIDATION_TYPES.ARRAY_ACTION_SELECTOR,
      onRowSelected: VALIDATION_TYPES.ACTION_SELECTOR,
      onPageChange: VALIDATION_TYPES.ACTION_SELECTOR,
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
    };
  }

  static getTriggerPropertyMap(): TriggerPropertiesMap {
    return {
      onRowSelected: true,
      onPageChange: true,
    };
  }

  searchTableData = (tableData: object[]) => {
    const searchValue =
      this.props.searchValue !== undefined
        ? this.props.searchValue.toString()
        : "";
    return tableData.filter((item: object) => {
      return Object.values(item)
        .join(", ")
        .includes(searchValue);
    });
  };

  getPageView() {
    const { tableData, hiddenColumns } = this.props;
    // const columns = constructColumns(tableData, hiddenColumns);
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

    // const exportHeight =
    //   this.props.exportCsv || this.props.exportPDF || this.props.exportCsv
    //     ? TABLE_EXPORT_HEIGHT
    //     : 0;
    // const tableHeaderHeight =
    //   this.props.tableData.length === 0 ? 2 : TABLE_HEADER_HEIGHT;
    // const tableContentHeight =
    //   componentHeight - TABLE_FOOTER_HEIGHT - tableHeaderHeight - exportHeight;
    // Use below code to calculate page size for old table component
    //  const pageSize = Math.floor(tableContentHeight / ROW_HEIGHT);
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
          searchValue={this.props.searchValue}
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
    // */
    /*
    return (
      <Suspense fallback={<Skeleton />}>
        <TableComponent
          id={this.props.widgetName}
          data={this.props.tableData}
          columns={columns}
          isLoading={this.props.isLoading}
          height={componentHeight}
          contentHeight={tableContentHeight}
          width={componentWidth}
          disableDrag={(disable: boolean) => {
            this.disableDrag(disable);
          }}
          pageSize={pageSize}
          rowHeight={ROW_HEIGHT}
          columnActions={this.props.columnActions}
          onCommandClick={this.onCommandClick}
          onRowClick={this.handleRowClick}
          selectedRowIndex={this.props.selectedRowIndex || -1}
          serverSidePaginationEnabled={serverSidePaginationEnabled}
          pageNo={pageNo}
          nextPageClick={this.handleNextPageClick}
          prevPageClick={this.handlePrevPageClick}
          updatePageNo={(pageNo: number) => {
            super.updateWidgetMetaProperty("pageNo", pageNo);
          }}
          updateHiddenColumns={this.updateHiddenColumns}
          resetSelectedRowIndex={this.resetSelectedRowIndex}
          exportCsv={this.props.exportCsv}
          exportPDF={this.props.exportPDF}
          exportExcel={this.props.exportExcel}
        />
      </Suspense>
    );
    */
  }

  handleSearchTable = (searchValue: any) => {
    const { onSearch } = this.props;
    super.updateWidgetMetaProperty("searchValue", searchValue);
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

  onCommandClick = (action: string) => {
    super.executeAction({
      dynamicString: action,
      event: {
        type: EventType.ON_CLICK,
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
  searchValue: string;
  tableData: object[];
  onPageChange?: string;
  pageSize: number;
  onRowSelected?: string;
  onSearch?: string;
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
