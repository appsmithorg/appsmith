import type { DSLWidget, WidgetProps } from "../types";
import { traverseDSLAndMigrate } from "../utils";

/*
 * Migration to add sourceData to the dynamicPropertyPathList
 */
export function migrateSelectWidgetAddSourceDataPropertyPathList(
  currentDSL: DSLWidget,
) {
  return traverseDSLAndMigrate(currentDSL, (widget: WidgetProps) => {
    if (["SELECT_WIDGET", "MULTI_SELECT_WIDGET_V2"].includes(widget.type)) {
      const dynamicPropertyPathList = widget.dynamicPropertyPathList;

      const sourceDataIndex = dynamicPropertyPathList
        ?.map((d: { key: string }) => d.key)
        .indexOf("sourceData");

      if (sourceDataIndex && sourceDataIndex === -1) {
        dynamicPropertyPathList?.push({
          key: "sourceData",
        });
      } else if (!Array.isArray(dynamicPropertyPathList)) {
        widget.dynamicPropertyPathList = [
          {
            key: "sourceData",
          },
        ];
      }
    }
  });
}
