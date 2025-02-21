import type { DSLWidget } from "../types";
import { isDynamicValue } from "../utils";

/**
 * This migration updates the table compute value bindings to use the new robust fallback mechanism
 * Old format: {{table.processedTableData.map((currentRow, currentIndex) => ( value ))}}
 * New format: {{(() => { const tableData = table.processedTableData || []; return tableData.length > 0 ? tableData.map((currentRow, currentIndex) => (value)) : value })()}}
 */
export const migrateTableComputeValueBinding = (currentDSL: DSLWidget) => {
  if (currentDSL.type === "TABLE_WIDGET_V2") {
    // Migrate primary columns compute values
    if (currentDSL.primaryColumns) {
      Object.keys(currentDSL.primaryColumns).forEach((columnKey) => {
        const column = currentDSL.primaryColumns[columnKey];

        if (column.computedValue && isDynamicValue(column.computedValue)) {
          const oldBindingPrefix = `{{${currentDSL.widgetName}.processedTableData.map((currentRow, currentIndex) => (`;
          const oldBindingSuffix = `))}}`;

          if (column.computedValue.includes(oldBindingPrefix)) {
            // Extract the value expression from between the old binding
            const valueExpression = column.computedValue.substring(
              oldBindingPrefix.length,
              column.computedValue.length - oldBindingSuffix.length,
            );

            // Create new binding with fallback mechanism
            column.computedValue = `{{(() => { const tableData = ${currentDSL.widgetName}.processedTableData || []; return tableData.length > 0 ? tableData.map((currentRow, currentIndex) => (${valueExpression})) : ${valueExpression} })()}}`;
          }
        }
      });
    }
  }

  // Recursively migrate children
  if (currentDSL.children && currentDSL.children.length > 0) {
    currentDSL.children = currentDSL.children.map((child: DSLWidget) =>
      migrateTableComputeValueBinding(child),
    );
  }

  return currentDSL;
};
