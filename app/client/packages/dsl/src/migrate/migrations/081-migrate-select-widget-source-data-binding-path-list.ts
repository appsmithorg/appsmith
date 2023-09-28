import type { DSLWidget, WidgetProps } from "../types";
import { traverseDSLAndMigrate } from "../utils";

/*
 * Migration to remove the options from dynamicBindingPathList and replace it with
 * sourceData
 */
export function migrateSelectWidgetSourceDataBindingPathList(
  currentDSL: DSLWidget,
) {
  return traverseDSLAndMigrate(currentDSL, (widget: WidgetProps) => {
    if (["SELECT_WIDGET", "MULTI_SELECT_WIDGET_V2"].includes(widget.type)) {
      const dynamicBindingPathList = widget.dynamicBindingPathList;

      const optionsIndex = dynamicBindingPathList
        ?.map((d: { key: string }) => d.key)
        .indexOf("options");

      if (optionsIndex && optionsIndex > -1) {
        dynamicBindingPathList?.splice(optionsIndex, 1, {
          key: "sourceData",
        });
      }
    }
  });
}
