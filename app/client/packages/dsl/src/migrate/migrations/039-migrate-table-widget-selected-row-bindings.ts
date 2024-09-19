import type { ColumnProperties, DSLWidget } from "../types";
import { removeSpecialChars } from "../utils";

const getUpdatedColumns = (
  widgetName: string,
  columns: Record<string, ColumnProperties>,
) => {
  const updatedColumns: Record<string, ColumnProperties> = {};

  if (columns && Object.keys(columns).length > 0) {
    for (const [columnId, columnProps] of Object.entries(columns)) {
      const sanitizedColumnId = removeSpecialChars(columnId, 200);
      const selectedRowBindingValue = `${widgetName}.selectedRow`;
      let newOnClickBindingValue = undefined;

      if (
        columnProps.onClick &&
        columnProps.onClick.includes(selectedRowBindingValue)
      ) {
        newOnClickBindingValue = columnProps.onClick.replace(
          selectedRowBindingValue,
          "currentRow",
        );
      }

      updatedColumns[sanitizedColumnId] = columnProps;

      if (newOnClickBindingValue)
        updatedColumns[sanitizedColumnId].onClick = newOnClickBindingValue;
    }
  }

  return updatedColumns;
};

export const migrateTableWidgetSelectedRowBindings = (
  currentDSL: DSLWidget,
) => {
  currentDSL.children = currentDSL.children?.map((child: DSLWidget) => {
    if (child.type === "TABLE_WIDGET") {
      child.derivedColumns = getUpdatedColumns(
        child.widgetName,
        child.derivedColumns as Record<string, ColumnProperties>,
      );
      child.primaryColumns = getUpdatedColumns(
        child.widgetName,
        child.primaryColumns as Record<string, ColumnProperties>,
      );
    } else if (child.children && child.children.length > 0) {
      child = migrateTableWidgetSelectedRowBindings(child);
    }

    return child;
  });

  return currentDSL;
};
