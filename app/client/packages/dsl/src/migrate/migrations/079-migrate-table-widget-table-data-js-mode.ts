import type { DSLWidget, WidgetProps } from "../types";
import { traverseDSLAndMigrate } from "../utils";

export const migrateTableWidgetTableDataJsMode = (currentDSL: DSLWidget) => {
  return traverseDSLAndMigrate(currentDSL, (widget: WidgetProps) => {
    if (widget.type === "TABLE_WIDGET_V2") {
      const dynamicPropertyPathList = (
        widget.dynamicPropertyPathList || []
      ).concat([
        {
          key: "tableData",
        },
      ]);

      widget.dynamicPropertyPathList = dynamicPropertyPathList;
    }
  });
};
