import { getDynamicBindings, isDynamicValue } from "migration-main/utils";
import type { WidgetProps } from "widgets/BaseWidget";
import type { DSLWidget } from "widgets/constants";

const SelectTypeWidgets = ["SELECT_WIDGET", "MULTI_SELECT_WIDGET_V2"];

export const stringToJS = (string: string): string => {
  const { jsSnippets, stringSegments } = getDynamicBindings(string);
  const js = stringSegments
    .map((segment: string, index: number) => {
      if (jsSnippets[index] && jsSnippets[index].length > 0) {
        return jsSnippets[index];
      } else {
        return `\`${segment}\``;
      }
    })
    .join(" + ");
  return js;
};

export const getBindingTemplate = (widgetName: string) => {
  const prefixTemplate = `{{ ((options, serverSideFiltering) => ( `;
  const suffixTemplate = `))(${widgetName}.options, ${widgetName}.serverSideFiltering) }}`;

  return { prefixTemplate, suffixTemplate };
};

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
