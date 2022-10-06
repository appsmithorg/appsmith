import {
  getBindingTemplate,
  removeTemplateFromJSBinding,
} from "components/propertyControls/SelectDefaultValueControl";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import { WidgetProps } from "widgets/BaseWidget";
import { DSLWidget } from "widgets/constants";

const SelectTypeWidgets = ["SELECT_WIDGET", "MULTI_SELECT_WIDGET_V2"];

export function migrateSelectTypeWidgetDefaultValue(currentDSL: DSLWidget) {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    if (SelectTypeWidgets.includes(child.type)) {
      const defaultOptionValue = child.defaultOptionValue;
      const { prefixTemplate, suffixTemplate } = getBindingTemplate(
        child.widgetName,
      );

      if (
        typeof defaultOptionValue === "string" &&
        isDynamicValue(defaultOptionValue) &&
        defaultOptionValue.endsWith(suffixTemplate) &&
        defaultOptionValue.startsWith(prefixTemplate)
      ) {
        child.defaultOptionValue = removeTemplateFromJSBinding(
          defaultOptionValue,
          child.widgetName,
        );
      }
    } else if (child.children && child.children.length > 0) {
      child = migrateSelectTypeWidgetDefaultValue(child);
    }
    return child;
  });

  return currentDSL;
}
