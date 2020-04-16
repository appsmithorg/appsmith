import React, { lazy, Suspense } from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/ActionConstants";
import { forIn } from "lodash";

import { VALIDATION_TYPES } from "constants/WidgetValidation";
import {
  WidgetPropertyValidationType,
  BASE_WIDGET_VALIDATION,
} from "utils/ValidationFactory";
import { ColumnModel } from "@syncfusion/ej2-grids";
import { ColumnDirTypecast } from "@syncfusion/ej2-react-grids";
import { ColumnAction } from "components/propertyControls/ColumnActionSelectorControl";
import { TriggerPropertiesMap } from "utils/WidgetFactory";
import Skeleton from "components/utils/Skeleton";

const TableComponent = lazy(() =>
  import("components/designSystems/syncfusion/TableComponent"),
);

function constructColumns(
  data: object[],
  hiddenColumns?: string[],
): ColumnModel[] | ColumnDirTypecast[] {
  let cols: ColumnModel[] | ColumnDirTypecast[] = [];
  const listItemWithAllProperties = {};
  data.forEach(dataItem => {
    Object.assign(listItemWithAllProperties, dataItem);
  });
  forIn(listItemWithAllProperties, (value: any, key: string) => {
    cols.push({
      field: key,
      visible: !hiddenColumns?.includes(key),
    });
  });
  cols = (cols as any[]).filter(col => col.field !== "_color") as
    | ColumnModel[]
    | ColumnDirTypecast[];
  return cols;
}

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

  static getTriggerPropertyMap(): TriggerPropertiesMap {
    return {
      onRowSelected: true,
      onPageChange: true,
    };
  }

  getPageView() {
    const { tableData, hiddenColumns } = this.props;
    const columns = constructColumns(tableData, hiddenColumns);

    const serverSidePaginationEnabled = (this.props
      .serverSidePaginationEnabled &&
      this.props.serverSidePaginationEnabled) as boolean;
    let pageNo = this.props.pageNo;

    if (pageNo === undefined) {
      pageNo = 1;
      super.updateWidgetMetaProperty("pageNo", pageNo);
    }
    const { componentWidth, componentHeight } = this.getComponentDimensions();
    return (
      <Suspense fallback={<Skeleton />}>
        <TableComponent
          id={this.props.widgetName}
          data={this.props.tableData}
          columns={columns}
          isLoading={this.props.isLoading}
          height={componentHeight}
          width={componentWidth}
          disableDrag={(disable: boolean) => {
            this.disableDrag(disable);
          }}
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
          updatePageSize={(pageSize: number) => {
            super.updateWidgetMetaProperty("pageSize", pageSize);
          }}
          exportCsv={this.props.exportCsv}
          exportPDF={this.props.exportPDF}
          exportExcel={this.props.exportExcel}
        />
      </Suspense>
    );
  }

  updateHiddenColumns = (hiddenColumns?: string[]) => {
    this.updateWidgetProperty("hiddenColumns", hiddenColumns);
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
  tableData: object[];
  onPageChange?: string;
  onRowSelected?: string;
  selectedRowIndex?: number;
  columnActions?: ColumnAction[];
  serverSidePaginationEnabled?: boolean;
  hiddenColumns?: string[];
}

export default TableWidget;
