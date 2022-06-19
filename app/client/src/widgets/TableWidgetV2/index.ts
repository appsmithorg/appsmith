import { Colors } from "constants/Colors";
import { cloneDeep, set } from "lodash";
import {
  combineDynamicBindings,
  getDynamicBindings,
} from "utils/DynamicBindingUtils";
import { WidgetProps } from "widgets/BaseWidget";
import { BlueprintOperationTypes } from "widgets/constants";
import { InlineEditingSaveOptions } from "./constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";
import { escapeString } from "./widget/utilities";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Table",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    rows: 28,
    columns: 34,
    animateLoading: true,
    defaultSelectedRowIndex: 0,
    defaultSelectedRowIndices: [0],
    label: "Data",
    widgetName: "Table",
    searchKey: "",
    textSize: "0.875rem",
    horizontalAlignment: "LEFT",
    verticalAlignment: "CENTER",
    totalRecordsCount: 0,
    defaultPageSize: 0,
    dynamicPropertyPathList: [],
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
      {
        key: "primaryColumns.action.buttonColor",
      },
      {
        key: "primaryColumns.action.borderRadius",
      },
      {
        key: "primaryColumns.action.boxShadow",
      },
    ],
    primaryColumns: {
      step: {
        index: 0,
        width: 150,
        id: "step",
        originalId: "step",
        alias: "step",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "text",
        textSize: "0.875rem",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isCellVisible: true,
        isCellEditable: false,
        isDerived: false,
        label: "step",
        computedValue: `{{Table1.processedTableData.map((currentRow, currentIndex) => ( currentRow["step"]))}}`,
      },
      task: {
        index: 1,
        width: 150,
        id: "task",
        originalId: "task",
        alias: "task",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "text",
        textSize: "0.875rem",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isCellVisible: true,
        isCellEditable: false,
        isDerived: false,
        label: "task",
        computedValue: `{{Table1.processedTableData.map((currentRow, currentIndex) => ( currentRow["task"]))}}`,
      },
      status: {
        index: 2,
        width: 150,
        id: "status",
        originalId: "status",
        alias: "status",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "text",
        textSize: "0.875rem",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isCellVisible: true,
        isCellEditable: false,
        isDerived: false,
        label: "status",
        computedValue: `{{Table1.processedTableData.map((currentRow, currentIndex) => ( currentRow["status"]))}}`,
      },
      action: {
        index: 3,
        width: 150,
        id: "action",
        originalId: "action",
        alias: "action",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "button",
        textSize: "0.875rem",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isCellVisible: true,
        isCellEditable: false,
        isDisabled: false,
        isDerived: false,
        label: "action",
        onClick:
          "{{currentRow.step === '#1' ? showAlert('Done', 'success') : currentRow.step === '#2' ? navigateTo('https://docs.appsmith.com/core-concepts/connecting-to-data-sources/querying-a-database',undefined,'NEW_WINDOW') : navigateTo('https://docs.appsmith.com/core-concepts/displaying-data-read/display-data-tables',undefined,'NEW_WINDOW')}}",
        computedValue: `{{Table1.processedTableData.map((currentRow, currentIndex) => ( currentRow["action"]))}}`,
      },
    },
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
    columnWidthMap: {
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
                `{{${
                  widget.widgetName
                }.processedTableData.map((currentRow, currentIndex) => ( currentRow["${escapeString(
                  primaryColumns[columnId].alias,
                )}"]))}}`,
              );
              set(primaryColumns, `${columnId}.labelColor`, Colors.WHITE);

              Object.keys(
                widget.childStylesheet[primaryColumns[columnId].columnType] ||
                  [],
              ).map((propertyKey) => {
                const { jsSnippets, stringSegments } = getDynamicBindings(
                  widget.childStylesheet[primaryColumns[columnId].columnType][
                    propertyKey
                  ],
                );

                const js = combineDynamicBindings(jsSnippets, stringSegments);

                set(
                  primaryColumns,
                  `${columnId}.${propertyKey}`,
                  `{{${widget.widgetName}.processedTableData.map((currentRow, currentIndex) => ( ${js}))}}`,
                );
              });
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
    version: 1,
    inlineEditingSaveOption: InlineEditingSaveOptions.ROW_LEVEL,
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
