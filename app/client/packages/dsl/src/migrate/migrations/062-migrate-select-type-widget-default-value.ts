import type { DSLWidget } from "../types";
import { isDynamicValue, stringToJS } from "../utils";

const getBindingTemplate = (widgetName: string) => {
  const prefixTemplate = `{{ ((options, serverSideFiltering) => ( `;
  const suffixTemplate = `))(${widgetName}.options, ${widgetName}.serverSideFiltering) }}`;

  return { prefixTemplate, suffixTemplate };
};

const SelectTypeWidgets = ["SELECT_WIDGET", "MULTI_SELECT_WIDGET_V2"];

export function MigrateSelectTypeWidgetDefaultValue(currentDSL: DSLWidget) {
  currentDSL.children = currentDSL.children?.map((child: DSLWidget) => {
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
