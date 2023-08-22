import {
  getBindingTemplate,
  stringToJS,
} from "components/propertyControls/SelectDefaultValueControl";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import { traverseDSLAndMigrate } from "utils/WidgetMigrationUtils";
import type { WidgetProps } from "widgets/BaseWidget";
import type { DSLWidget } from "WidgetProvider/constants";

const SelectTypeWidgets = ["SELECT_WIDGET", "MULTI_SELECT_WIDGET_V2"];

export function MigrateSelectTypeWidgetDefaultValue(currentDSL: DSLWidget) {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    if (SelectTypeWidgets.includes(child.type)) {
      const defaultOptionValue = child.defaultOptionValue;
      const { prefixTemplate, suffixTemplate } = getBindingTemplate(
        child.widgetName,
      );

      if (
        typeof defaultOptionValue === "string" &&
        isDynamicValue(defaultOptionValue) &&
        !defaultOptionValue.endsWith(suffixTemplate) &&
        !defaultOptionValue.startsWith(prefixTemplate)
      ) {
        child.defaultOptionValue = `${prefixTemplate}${stringToJS(
          defaultOptionValue,
        )}${suffixTemplate}`;
      }
    } else if (child.children && child.children.length > 0) {
      child = MigrateSelectTypeWidgetDefaultValue(child);
    }
    return child;
  });

  return currentDSL;
}

export function migrateSelectWidgetOptionToSourceData(currentDSL: DSLWidget) {
  return traverseDSLAndMigrate(currentDSL, (widget: WidgetProps) => {
    if (
      ["SELECT_WIDGET", "MULTI_SELECT_WIDGET_V2"].includes(widget.type) &&
      widget.options
    ) {
      widget.sourceData = widget.options;
      widget.optionLabel = "label";
      widget.optionValue = "value";

      delete widget.options;
    }
  });
}

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
        ?.map((d) => d.key)
        .indexOf("options");

      if (optionsIndex && optionsIndex > -1) {
        dynamicBindingPathList?.splice(optionsIndex, 1, {
          key: "sourceData",
        });
      }
    }
  });
}

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
        ?.map((d) => d.key)
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
