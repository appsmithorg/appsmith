import type { DSLWidget, WidgetProps } from "../types";
import { traverseDSLAndMigrate } from "../utils";

export const migrateChildStylesheetFromDynamicBindingPathList = (
  currentDSL: DSLWidget,
) => {
  const widgetsWithChildStylesheet = [
    "TABLE_WIDGET_V2",
    "BUTTON_GROUP_WIDGET",
    "JSON_FORM_WIDGET",
  ];

  return traverseDSLAndMigrate(currentDSL, (widget: WidgetProps) => {
    if (
      widgetsWithChildStylesheet.includes(widget.type) &&
      widget.childStylesheet
    ) {
      const newPaths = widget.dynamicBindingPathList?.filter(
        ({ key }: { key: string }) => !key.startsWith("childStylesheet."),
      );

      widget.dynamicBindingPathList = newPaths;
    }
  });
};
