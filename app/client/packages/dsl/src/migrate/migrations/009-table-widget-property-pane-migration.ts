/* eslint-disable @typescript-eslint/no-explicit-any */
import { cloneDeep, isString } from "lodash";
import type { DSLWidget } from "../types";
import { removeSpecialChars } from "../utils";

export const getAllTableColumnKeys = (
  tableData?: Array<Record<string, unknown>>,
) => {
  const columnKeys: string[] = [];

  if (tableData) {
    for (let i = 0, tableRowCount = tableData.length; i < tableRowCount; i++) {
      const row = tableData[i];

      for (const key in row) {
        // Replace all special characters to _, limit key length to 200 characters.
        const sanitizedKey = removeSpecialChars(key, 200);

        if (!columnKeys.includes(sanitizedKey)) {
          columnKeys.push(sanitizedKey);
        }
      }
    }
  }

  return columnKeys;
};

export const tableWidgetPropertyPaneMigrations = (currentDSL: DSLWidget) => {
  currentDSL.children = currentDSL.children?.map((_child: DSLWidget) => {
    let child = cloneDeep(_child);

    // If the current child is a TABLE_WIDGET
    if (child.type === "TABLE_WIDGET") {
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
          dynamicBindingPathList?.findIndex(
            (item: { key: string }) => item.key !== "tableData",
          )
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
            : "text";

        // If the columnType is currency make it a text type
        // We're deprecating currency types
        if (columnType === "currency") {
          columnType = "text";
        }

        // Get a full set of column properties
        const column: any = {
          index, // Use to maintain order of columns
          // The widget of the column
          width:
            columnSizeMap && columnSizeMap[accessor]
              ? columnSizeMap[accessor]
              : 150,
          // id of the column
          id: accessor,
          // default horizontal alignment
          horizontalAlignment: "LEFT",
          // default vertical alignment
          verticalAlignment: "CENTER",
          // columnType
          columnType,
          // default text color
          textColor: "#231F20",
          // default text size
          textSize: "PARAGRAPH",
          // default font size
          fontStyle: "REGULAR",
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
          computedValue: `{{${child.widgetName}.sanitizedTableData.map((currentRow) => ( currentRow.${accessor})}}`,
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
      const updatedDerivedColumns: Record<string, object> = {};

      // Add derived column for each column action
      columnActions.forEach((action: any, index: number) => {
        const column = {
          index: child.primaryColumns.length + index, // Add to the end of the columns list
          width: 150, // Default width
          id: `${columnPrefix}${index + 1}`, // A random string which was generated previously
          label: action.label, // Revert back to "Actions"
          columnType: "button", // All actions are buttons
          isVisible: true,
          isDisabled: false,
          isDerived: true,
          buttonLabel: action.label,
          buttonStyle: "rgb(3, 179, 101)",
          buttonLabelColor: "#FFFFFF",
          onClick: action.dynamicTrigger,
          computedValue: "",
        };

        dynamicTriggerPathList.push({
          key: `primaryColumns.${columnPrefix}${index + 1}.onClick`,
        });
        updatedDerivedColumns[column.id] = column;
        child.primaryColumns[column.id] = column;
      });

      if (Object.keys(updatedDerivedColumns).length) {
        dynamicTriggerPathList = dynamicTriggerPathList.filter(
          (triggerPath: Record<string, string>) => {
            triggerPath.key !== "columnActions";
          },
        );
      }

      child.dynamicTriggerPathList = dynamicTriggerPathList;
      child.textSize = "PARAGRAPH";
      child.horizontalAlignment = "LEFT";
      child.verticalAlignment = "CENTER";
      child.fontStyle = "REGULAR";

      child.derivedColumns = updatedDerivedColumns;
    } else if (child.children && child.children.length > 0) {
      child = tableWidgetPropertyPaneMigrations(child);
    }

    return child;
  });

  return currentDSL;
};
