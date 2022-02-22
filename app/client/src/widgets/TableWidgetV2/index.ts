import { Colors } from "constants/Colors";
import { cloneDeep, set } from "lodash";
import { WidgetProps } from "widgets/BaseWidget";
import { BlueprintOperationTypes } from "widgets/constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Table V2",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    rows: 28,
    columns: 34,
    animateLoading: true,
    defaultSelectedRowIndex: "0",
    defaultSelectedRowIndices: ["0"],
    label: "Data",
    widgetName: "Table_V2_",
    searchKey: "",
    textSize: "PARAGRAPH",
    horizontalAlignment: "LEFT",
    verticalAlignment: "CENTER",
    totalRecordsCount: 0,
    defaultPageSize: 0,
    dynamicBindingPathList: [
      {
        key: "primaryColumns._7564271686515424.computedValue",
      },
      {
        key: "primaryColumns._3356042849650782.computedValue",
      },
      {
        key: "primaryColumns._2413015321063834.computedValue",
      },
      {
        key: "primaryColumns._7359744396795533.computedValue",
      },
    ],
    accessorMap: {
      step: "step",
      task: "task",
      status: "status",
      action: "action",
    },
    primaryColumns: {
      _7564271686515424: {
        index: 0,
        width: 150,
        id: "_7564271686515424",
        originalId: "step",
        accessor: "step",
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
          "{{Table1.processedTableData.map((currentRow) => ( currentRow.step))}}",
      },
      _3356042849650782: {
        index: 1,
        width: 150,
        id: "_3356042849650782",
        originalId: "task",
        accessor: "task",
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
          "{{Table1.processedTableData.map((currentRow) => ( currentRow.task))}}",
      },
      _2413015321063834: {
        index: 2,
        width: 150,
        id: "_2413015321063834",
        originalId: "status",
        accessor: "status",
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
          "{{Table1.processedTableData.map((currentRow) => ( currentRow.status))}}",
      },
      _7359744396795533: {
        index: 3,
        width: 150,
        id: "_7359744396795533",
        originalId: "action",
        accessor: "action",
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
          "{{Table1.processedTableData.map((currentRow) => ( currentRow.action))}}",
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
      _3356042849650782: 245,
      _7564271686515424: 62,
      _2413015321063834: 75,
    },
    columnOrder: [
      "_7564271686515424",
      "_3356042849650782",
      "_2413015321063834",
      "_7359744396795533",
    ],
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
                `{{${widget.widgetName}.processedTableData.map((currentRow) => ( currentRow.${primaryColumns[columnId].accessor}))}}`,
              );
              set(primaryColumns, `${columnId}.buttonColor`, Colors.GREEN);
              set(primaryColumns, `${columnId}.menuColor`, Colors.GREEN);
              set(primaryColumns, `${columnId}.labelColor`, Colors.WHITE);
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
