import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { ActionPayload, TableAction } from "constants/ActionConstants";
import _, { forIn } from "lodash";
import TableComponent from "components/designSystems/syncfusion/TableComponent";

import { VALIDATION_TYPES } from "constants/WidgetValidation";
import { WidgetPropertyValidationType } from "utils/ValidationFactory";
import { ColumnModel } from "@syncfusion/ej2-grids";
import { ColumnDirTypecast } from "@syncfusion/ej2-react-grids";

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
      selectedRow: VALIDATION_TYPES.OBJECT,
    };
  }

  getPageView() {
    const { tableData } = this.props;
    const columns = constructColumns(tableData);
    return (
      <TableComponent
        data={this.props.tableData}
        columns={columns}
        isLoading={this.props.isLoading}
        height={this.state.componentHeight}
        width={this.state.componentWidth}
        selectedRowIndex={
          this.props.selectedRow && this.props.selectedRow.rowIndex
        }
        onRowClick={(rowData: object, index: number) => {
          const { onRowSelected } = this.props;
          this.updateSelectedRowProperty(rowData, index);
          super.executeAction(onRowSelected);
        }}
      ></TableComponent>
    );
  }

  componentDidUpdate(prevProps: TableWidgetProps) {
    super.componentDidUpdate(prevProps);
    if (
      !_.isEqual(prevProps.tableData, this.props.tableData) &&
      prevProps.selectedRow
    ) {
      this.updateSelectedRowProperty(
        this.props.tableData[prevProps.selectedRow.rowIndex],
        prevProps.selectedRow.rowIndex,
      );
    }
  }

  updateSelectedRowProperty(rowData: object, index: number) {
    const { widgetId } = this.props;
    this.updateWidgetProperty(widgetId, "selectedRow", {
      ...rowData,
      rowIndex: index,
    });
  }

  getWidgetType(): WidgetType {
    return "TABLE_WIDGET";
  }
}

export type PaginationType = "PAGES" | "INFINITE_SCROLL";

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
  selectedRow?: SelectedRow;
}

export default TableWidget;
