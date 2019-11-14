import React from "react";
import _ from "lodash";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "../constants/WidgetConstants";
import { ActionPayload } from "../constants/ActionConstants";
import { AutoResizer } from "react-base-table";
import "react-base-table/styles.css";
import { forIn } from "lodash";
import SelectableTable, {
  Column,
} from "../components/designSystems/appsmith/TableComponent";

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

const getTableArrayData = (
  tableData: string | object[] | undefined,
): object[] => {
  try {
    if (!tableData) return [];
    if (_.isString(tableData)) {
      return JSON.parse(tableData);
    }
    return tableData;
  } catch (error) {
    console.error({ error });
    return [];
  }
};

class TableWidget extends BaseWidget<TableWidgetProps, WidgetState> {
  getPageView() {
    const { tableData } = this.props;
    const data = getTableArrayData(tableData);
    const columns = constructColumns(data);
    return (
      <AutoResizer>
        {({ width, height }: { width: number; height: number }) => (
          <SelectableTable
            width={width}
            height={height}
            columns={columns}
            data={data}
            maxHeight={height}
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
    const { tableData, selectedRow } = this.props;
    const newData = getTableArrayData(tableData);
    if (
      newData &&
      !_.isEmpty(newData) &&
      selectedRow &&
      !_.isEqual(
        newData[selectedRow.rowIndex],
        _.omit(selectedRow, ["rowIndex"]),
      )
    ) {
      this.updateSelectedRowProperty(
        newData[selectedRow.rowIndex],
        selectedRow.rowIndex,
      );
    }
  }

  updateSelectedRowProperty(rowData: object, index: number) {
    const { widgetId } = this.props;
    super.updateWidgetProperty(widgetId, "selectedRow", {
      ...rowData,
      rowIndex: index,
    });
  }

  getWidgetType(): WidgetType {
    return "TABLE_WIDGET";
  }
}

export type PaginationType = "PAGES" | "INFINITE_SCROLL";

export interface TableAction extends ActionPayload {
  actionName: string;
}

type RowData = {
  rowIndex: number;
};
type SelectedRow = object & RowData;

export interface TableWidgetProps extends WidgetProps {
  nextPageKey?: string;
  prevPageKey?: string;
  label: string;
  tableData?: string | object[];
  recordActions?: TableAction[];
  onPageChange?: ActionPayload[];
  onRowSelected?: ActionPayload[];
  selectedRow?: SelectedRow;
}

export default TableWidget;
