import Widget from "./widget";
import IconSVG from "./icon.svg";
import { WidgetProps } from "widgets/BaseWidget";
import { cloneDeep, set } from "lodash";
import {
  BlueprintOperationTypes,
  GRID_DENSITY_MIGRATION_V1,
} from "widgets/constants";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Table",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    rows: 7 * GRID_DENSITY_MIGRATION_V1,
    columns: 8.5 * GRID_DENSITY_MIGRATION_V1,
    defaultSelectedRow: "0",
    label: "Data",
    widgetName: "Table",
    searchKey: "",
    textSize: "PARAGRAPH",
    horizontalAlignment: "LEFT",
    verticalAlignment: "CENTER",
    totalRecordsCount: 0,
    defaultPageSize: 0,
    dynamicBindingPathList: [
      {
        key: "primaryColumns.step.computedValue",
      },
      {
        key: "primaryColumns.task.computedValue",
      },
      {
        key: "primaryColumns.status.computedValue",
      },
      {
        key: "primaryColumns.action.computedValue",
      },
    ],
    primaryColumns: {
      step: {
        index: 0,
        width: 150,
        id: "step",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "text",
        textSize: "PARAGRAPH",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isCellVisible: true,
        isDerived: false,
        label: "step",
        computedValue:
          "{{Table1.sanitizedTableData.map((currentRow) => ( currentRow.step))}}",
      },
      task: {
        index: 1,
        width: 150,
        id: "task",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "text",
        textSize: "PARAGRAPH",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isCellVisible: true,
        isDerived: false,
        label: "task",
        computedValue:
          "{{Table1.sanitizedTableData.map((currentRow) => ( currentRow.task))}}",
      },
      status: {
        index: 2,
        width: 150,
        id: "status",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "text",
        textSize: "PARAGRAPH",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isCellVisible: true,
        isDerived: false,
        label: "status",
        computedValue:
          "{{Table1.sanitizedTableData.map((currentRow) => ( currentRow.status))}}",
      },
      action: {
        index: 3,
        width: 150,
        id: "action",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "button",
        textSize: "PARAGRAPH",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isCellVisible: true,
        isDisabled: false,
        isDerived: false,
        label: "action",
        onClick:
          "{{currentRow.step === '#1' ? showAlert('Done', 'success') : currentRow.step === '#2' ? navigateTo('https://docs.appsmith.com/core-concepts/connecting-to-data-sources/querying-a-database',undefined,'NEW_WINDOW') : navigateTo('https://docs.appsmith.com/core-concepts/displaying-data-read/display-data-tables',undefined,'NEW_WINDOW')}}",
        computedValue:
          "{{Table1.sanitizedTableData.map((currentRow) => ( currentRow.action))}}",
      },
    },
    derivedColumns: {},
    tableData: [
      {
        step: "#1",
        task: "Drop a table",
        status: "✅",
        action: "",
      },
      {
        step: "#2",
        task: "Create a query fetch_users with the Mock DB",
        status: "--",
        action: "",
      },
      {
        step: "#3",
        task: "Bind the query using => fetch_users.data",
        status: "--",
        action: "",
      },
    ],
    columnSizeMap: {
      task: 245,
      step: 62,
      status: 75,
    },
    columnOrder: ["step", "task", "status", "action"],
    blueprint: {
      operations: [
        {
          type: BlueprintOperationTypes.MODIFY_PROPS,
          fn: (widget: WidgetProps & { children?: WidgetProps[] }) => {
            const primaryColumns = cloneDeep(widget.primaryColumns);
            const columnIds = Object.keys(primaryColumns);
            columnIds.forEach((columnId) => {
              set(
                primaryColumns,
                `${columnId}.computedValue`,
                `{{${widget.widgetName}.sanitizedTableData.map((currentRow) => ( currentRow.${columnId}))}}`,
              );
            });
            const updatePropertyMap = [
              {
                widgetId: widget.widgetId,
                propertyName: "primaryColumns",
                propertyValue: primaryColumns,
              },
            ];
            return updatePropertyMap;
          },
        },
      ],
    },
    enableClientSideSearch: true,
    isVisibleSearch: true,
    isVisibleFilters: true,
    isVisibleDownload: true,
    isVisiblePagination: true,
    isSortable: true,
    delimiter: ",",
    version: 3,
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
