import type { WidgetProps } from "widgets/BaseWidget";
import { get } from "lodash";
import {
  EVAL_ERROR_PATH,
  getDynamicBindings,
} from "../../utils/DynamicBindingUtils";

export const stringToJS = (string: string): string => {
  const { jsSnippets, stringSegments } = getDynamicBindings(string);

  return stringSegments
    .map((segment, index) => {
      if (jsSnippets[index] && jsSnippets[index].length > 0) {
        return jsSnippets[index];
      } else {
        return `'${segment}'`;
      }
    })
    .join(" + ");
};

export const JSToString = (js: string): string => {
  const segments = js.split(" + ");

  return segments
    .map((segment) => {
      if (segment.charAt(0) === "'") {
        return segment.substring(1, segment.length - 1);
      } else return "{{" + segment + "}}";
    })
    .join("");
};

export const getValidationErrorForProperty = (
  widget: WidgetProps,
  propertyPath: string,
) => {
  return get(widget, `${EVAL_ERROR_PATH}.${propertyPath}`, []);
};

export const normalizedMultilineValue = (value: string) => {
  return value.replace(/'/g, '"').replace(/\n/g, "\\n");
};
