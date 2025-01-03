import type { ColumnProperties, DSLWidget, WidgetProps } from "../types";
import { isDynamicValue, traverseDSLAndMigrate } from "../utils";

const oldBindingPrefix = (tableName: string) => {
  return `{{${tableName}.processedTableData.map((currentRow, currentIndex) => (`;
};

const newBindingPrefix = (tableName: string) => {
  return `{{${tableName}.processedTableData.map((currentRow, currentIndex) => { try { return (`;
};

const oldBindingSuffix = `))}}`;
const newBindingSuffix = `); } catch (e) { return null; }})}}`;

export const migrateTableWidgetV2ValidationTryCatch = (
  currentDSL: DSLWidget,
) => {
  return traverseDSLAndMigrate(currentDSL, (widget: WidgetProps) => {
    if (widget.type !== "TABLE_WIDGET_V2") return;

    const primaryColumns: Record<string, ColumnProperties> =
      widget.primaryColumns as Record<string, ColumnProperties>;

    Object.values(primaryColumns).forEach((colProperties) => {
      if (!colProperties.computedValue) return;

      const value = colProperties.computedValue;

      if (!isDynamicValue(value)) return;

      const tableName = widget.widgetName;
      const oldPrefix = oldBindingPrefix(tableName);

      // Only update if it matches the old format
      if (!value.startsWith(oldPrefix)) return;

      // Replace old prefix/suffix with new ones
      const computation = value
        .replace(oldPrefix, "")
        .replace(oldBindingSuffix, "");

      // Add the new prefix and suffix with try-catch
      colProperties.computedValue = `${newBindingPrefix(tableName)}${computation}${newBindingSuffix}`;
    });
  });
};
