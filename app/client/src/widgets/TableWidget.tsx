import React from "react";
import _ from "lodash";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { ActionPayload, TableAction } from "constants/ActionConstants";
import { AutoResizer } from "react-base-table";
import "react-base-table/styles.css";
import { forIn } from "lodash";
import SelectableTable, {
  Column,
} from "components/designSystems/appsmith/TableComponent";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import { WidgetPropertyValidationType } from "utils/ValidationFactory";

function constructColumns(data: object[]): Column[] {
  const cols: Column[] = [];
  const listItemWithAllProperties = {};
  data.forEach(dataItem => {
    Object.assign(listItemWithAllProperties, dataItem);
  });
  forIn(listItemWithAllProperties, (value, key) => {
    cols.push({
      key: key,
      dataKey: key,
      width: 200,
      title: key,
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
      <AutoResizer>
        {({ width, height }: { width: number; height: number }) => (
          <SelectableTable
            width={width}
            height={height}
            columns={columns}
            data={tableData}
            maxHeight={height}
            isLoading={this.props.isLoading}
            selectedRowIndex={
              this.props.selectedRow && this.props.selectedRow.rowIndex
            }
            onRowClick={(rowData: object, index: number) => {
              const { onRowSelected } = this.props;
              this.updateSelectedRowProperty(rowData, index);
              super.executeAction(onRowSelected);
            }}
          />
        )}
      </AutoResizer>
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
