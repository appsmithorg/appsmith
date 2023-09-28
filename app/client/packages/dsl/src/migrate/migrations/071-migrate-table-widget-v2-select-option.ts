import type { DSLWidget, WidgetProps } from "../types";
import { isDynamicValue, stringToJS, traverseDSLAndMigrate } from "../utils";

export const migrateTableWidgetV2SelectOption = (currentDSL: DSLWidget) => {
  return traverseDSLAndMigrate(currentDSL, (widget: WidgetProps) => {
    if (widget.type === "TABLE_WIDGET_V2") {
      Object.values(
        widget.primaryColumns as Record<
          string,
          { columnType: string; selectOptions: string }
        >,
      )
        .filter((column) => column.columnType === "select")
        .forEach((column) => {
          const selectOptions = column.selectOptions;

          if (selectOptions && isDynamicValue(selectOptions)) {
            column.selectOptions = `{{${
              widget.widgetName
            }.processedTableData.map((currentRow, currentIndex) => ( ${stringToJS(
              selectOptions,
            )}))}}`;
          }
        });
    }
  });
};
