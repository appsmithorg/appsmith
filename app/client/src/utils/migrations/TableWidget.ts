import { ContainerWidgetProps } from "widgets/ContainerWidget";
import { WidgetProps } from "widgets/BaseWidget";
import { WidgetTypes } from "constants/WidgetConstants";
import { getAllTableColumnKeys } from "components/designSystems/appsmith/TableComponent/TableHelpers";
import {
  ColumnProperties,
  CellAlignmentTypes,
  VerticalAlignmentTypes,
  ColumnTypes,
  TextSizes,
  FontStyleTypes,
} from "components/designSystems/appsmith/TableComponent/Constants";
import { Colors } from "constants/Colors";
import { ColumnAction } from "components/propertyControls/ColumnActionSelectorControl";
import { cloneDeep, isString } from "lodash";

export const tableWidgetPropertyPaneMigrations = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
) => {
  currentDSL.children = currentDSL.children?.map((_child: WidgetProps) => {
    let child = cloneDeep(_child);
    // If the current child is a TABLE_WIDGET
    if (child.type === WidgetTypes.TABLE_WIDGET) {
      const hiddenColumns = child.hiddenColumns || [];
      const columnNameMap = child.columnNameMap;
      const columnSizeMap = child.columnSizeMap;
      const columnTypeMap = child.columnTypeMap;
      let tableColumns: string[] = [];
      const dynamicBindingPathList = child.dynamicBindingPathList;
      if (child.tableData.length) {
        let tableData = [];
        // Try parsing the table data, if it parses great
        // If it does not parse, assign tableData the value as is.
        try {
          tableData = JSON.parse(child.tableData);
        } catch (e) {
          tableData = child.tableData;
        }
        if (
          !isString(tableData) &&
          dynamicBindingPathList?.findIndex((item) => item.key !== "tableData")
        ) {
          // Get the list of column ids
          tableColumns = getAllTableColumnKeys(tableData);
        } else {
          child.migrated = false;
        }
      }
      // Get primaryColumns to be the list of column keys
      // Use the old order if it exists, else use the new order
      const primaryColumns = child.columnOrder?.length
        ? child.columnOrder
        : tableColumns;
      child.primaryColumns = {};

      // const hasActions = child.columnActions && child.columnActions.length > 0;
      // Generate new primarycolumns
      primaryColumns.forEach((accessor: string, index: number) => {
        // Get the column type from the columnTypeMap
        let columnType =
          columnTypeMap && columnTypeMap[accessor]
            ? columnTypeMap[accessor].type
            : ColumnTypes.TEXT;
        // If the columnType is currency make it a text type
        // We're deprecating currency types
        if (columnType === "currency") {
          columnType = ColumnTypes.TEXT;
        }
        // Get a full set of column properties
        const column: ColumnProperties = {
          index, // Use to maintain order of columns
          // The widget of the column
          width:
            columnSizeMap && columnSizeMap[accessor]
              ? columnSizeMap[accessor]
              : 150,
          // id of the column
          id: accessor,
          // default horizontal alignment
          horizontalAlignment: CellAlignmentTypes.LEFT,
          // default vertical alignment
          verticalAlignment: VerticalAlignmentTypes.CENTER,
          // columnType
          columnType,
          // default text color
          textColor: Colors.THUNDER,
          // default text size
          textSize: TextSizes.PARAGRAPH,
          // default font size
          fontStyle: FontStyleTypes.REGULAR,
          enableFilter: true,
          enableSort: true,
          // hide the column if it was hidden earlier using hiddenColumns
          isVisible: hiddenColumns.includes(accessor) ? false : true,
          // We did not have a concept of derived columns so far
          isDerived: false,
          // Use renamed names from the map
          // or use the newly generated name
          label:
            columnNameMap && columnNameMap[accessor]
              ? columnNameMap[accessor]
              : accessor,
          // Generate computed value
          computedValue: `{{${child.widgetName}.tableData.map((currentRow) => { return currentRow.${accessor}})}}`,
        };
        // copy inputForma nd outputFormat for date column types
        if (columnTypeMap && columnTypeMap[accessor]) {
          column.outputFormat = columnTypeMap[accessor].format || "";
          column.inputFormat = columnTypeMap[accessor].inputFormat || "";
        }
        child.primaryColumns[column.id] = column;
      });

      // Get all column actions
      const columnActions = child.columnActions || [];
      // Get dynamicTriggerPathList
      let dynamicTriggerPathList: Array<{ key: string }> =
        child.dynamicTriggerPathList || [];

      const columnPrefix = "customColumn";
      const updatedDerivedColumns: Record<string, ColumnProperties> = {};
      // Add derived column for each column action
      columnActions.forEach((action: ColumnAction, index: number) => {
        const column = {
          index: child.primaryColumns.length + index, // Add to the end of the columns list
          width: 150, // Default width
          id: `${columnPrefix}${index + 1}`, // A random string which was generated previously
          label: action.label, // Revert back to "Actions"
          columnType: "button", // All actions are buttons
          isVisible: true,
          isDerived: true,
          buttonLabel: action.label,
          buttonStyle: "#29CCA3",
          buttonLabelColor: "#FFFFFF",
          onClick: action.dynamicTrigger,
          computedValue: "",
        };
        dynamicTriggerPathList.push({
          key: `primaryColumns.${columnPrefix}${index + 1}.onClick`,
        });
        updatedDerivedColumns[column.id] = column;
      });

      if (Object.keys(updatedDerivedColumns).length) {
        dynamicTriggerPathList = dynamicTriggerPathList.filter(
          (triggerPath: Record<string, string>) => {
            triggerPath.key !== "columnActions";
          },
        );
      }
      child.dynamicTriggerPathList = dynamicTriggerPathList;
      child.textSize = TextSizes.PARAGRAPH;
      child.horizontalAlignment = CellAlignmentTypes.LEFT;
      child.verticalAlignment = VerticalAlignmentTypes.CENTER;
      child.fontStyle = FontStyleTypes.REGULAR;

      child.derivedColumns = updatedDerivedColumns;
    } else if (child.children && child.children.length > 0) {
      child = tableWidgetPropertyPaneMigrations(child);
    }
    return child;
  });
  return currentDSL;
};
