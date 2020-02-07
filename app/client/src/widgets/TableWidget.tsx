import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { ActionPayload, TableAction } from "constants/ActionConstants";
import { forIn } from "lodash";
import TableComponent from "components/designSystems/syncfusion/TableComponent";

import { VALIDATION_TYPES } from "constants/WidgetValidation";
import { WidgetPropertyValidationType } from "utils/ValidationFactory";
import { ColumnModel } from "@syncfusion/ej2-grids";
import { ColumnDirTypecast } from "@syncfusion/ej2-react-grids";
import { ColumnAction } from "components/propertyControls/ColumnActionSelectorControl";

function constructColumns(data: object[]): ColumnModel[] | ColumnDirTypecast[] {
  const cols: ColumnModel[] | ColumnDirTypecast[] = [];
  const listItemWithAllProperties = {};
  data.forEach(dataItem => {
    Object.assign(listItemWithAllProperties, dataItem);
  });
  forIn(listItemWithAllProperties, (value: any, key: string) => {
    cols.push({
      field: key,
      width: 200,
    });
  });
  return cols;
}

class TableWidget extends BaseWidget<TableWidgetProps, WidgetState> {
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      tableData: VALIDATION_TYPES.TABLE_DATA,
      nextPageKey: VALIDATION_TYPES.TEXT,
      prevPageKey: VALIDATION_TYPES.TEXT,
      label: VALIDATION_TYPES.TEXT,
      selectedRowIndex: VALIDATION_TYPES.NUMBER,
    };
  }
  static getDerivedPropertiesMap() {
    return {
      selectedRow: "{{this.tableData[this.selectedRowIndex]}}",
    };
  }

  getPageView() {
    const { tableData, widgetId } = this.props;
    const columns = constructColumns(tableData);

    const serverSidePaginationEnabled = (this.props
      .serverSidePaginationEnabled &&
      this.props.serverSidePaginationEnabled) as boolean;
    let pageNo = this.props.pageNo;

    if (pageNo === undefined) {
      pageNo = 1;
      super.updateWidgetMetaProperty(widgetId, "pageNo", pageNo);
    }
    return (
      <TableComponent
        data={this.props.tableData}
        columns={columns}
        isLoading={this.props.isLoading}
        height={this.state.componentHeight}
        width={this.state.componentWidth}
        disableDrag={(disable: boolean) => {
          this.disableDrag(disable);
        }}
        columnActions={this.props.columnActions}
        onCommandClick={this.onCommandClick}
        onRowClick={(rowData: object, index: number) => {
          const { onRowSelected } = this.props;
          this.updateSelectedRowProperty(index);

          super.executeAction(onRowSelected);
        }}
        serverSidePaginationEnabled={serverSidePaginationEnabled}
        pageNo={pageNo}
        nextPageClick={() => {
          let pageNo = this.props.pageNo || 1;
          pageNo = pageNo + 1;
          super.updateWidgetMetaProperty(widgetId, "pageNo", pageNo);

          super.executeAction(this.props.onPageChange, "NEXT");
        }}
        prevPageClick={() => {
          let pageNo = this.props.pageNo || 1;
          pageNo = pageNo - 1;
          if (pageNo >= 1) {
            super.updateWidgetMetaProperty(widgetId, "pageNo", pageNo);
            super.executeAction(this.props.onPageChange, "PREV");
          }
        }}
        updatePageNo={(pageNo: number) => {
          super.updateWidgetMetaProperty(widgetId, "pageNo", pageNo);
        }}
        updatePageSize={(pageSize: number) => {
          super.updateWidgetMetaProperty(widgetId, "pageSize", pageSize);
        }}
      />
    );
  }

  onCommandClick = (actions: ActionPayload[]) => {
    super.executeAction(actions);
  };

  updateSelectedRowProperty(index: number) {
    const { widgetId } = this.props;
    this.updateWidgetProperty(widgetId, "selectedRowIndex", index);
  }

  getWidgetType(): WidgetType {
    return "TABLE_WIDGET";
  }
}

type RowData = {
  rowIndex: number;
};
type SelectedRow = object & RowData;

export interface TableWidgetProps extends WidgetProps {
  nextPageKey?: string;
  prevPageKey?: string;
  label: string;
  tableData: object[];
  recordActions?: TableAction[];
  onPageChange?: ActionPayload[];
  onRowSelected?: ActionPayload[];
  selectedRowIndex?: number;
  columnActions?: ColumnAction[];
  serverSidePaginationEnabled?: boolean;
}

export default TableWidget;
