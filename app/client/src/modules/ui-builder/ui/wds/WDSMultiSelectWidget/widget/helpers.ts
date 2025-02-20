import get from "lodash/get";
import uniq from "lodash/uniq";
import isArray from "lodash/isArray";
import isString from "lodash/isString";
import isPlainObject from "lodash/isPlainObject";
import type { WidgetProps } from "widgets/BaseWidget";

import type { Validation } from "modules/ui-builder/ui/wds/WDSInputWidget/widget/types";
import type { WDSMultiSelectWidgetProps } from "./types";

import { EVAL_VALUE_PATH } from "utils/DynamicBindingUtils";

export function validateInput(props: WDSMultiSelectWidgetProps): Validation {
  if (!props.isValid) {
    return {
      validationStatus: "invalid",
      errorMessage: "Please select an option",
    };
  }

  return {
    validationStatus: "valid",
    errorMessage: "",
  };
}

export function getLabelValueKeyOptions(widget: WidgetProps) {
  const sourceData = get(widget, `${EVAL_VALUE_PATH}.sourceData`);

  let parsedValue: Record<string, unknown> | undefined = sourceData;

  if (isString(sourceData)) {
    try {
      parsedValue = JSON.parse(sourceData);
    } catch (e) {}
  }

  if (isArray(parsedValue)) {
    return uniq(
      parsedValue.reduce((keys, obj) => {
        if (isPlainObject(obj)) {
          Object.keys(obj).forEach((d) => keys.push(d));
        }

        return keys;
      }, []),
    ).map((d: unknown) => ({
      label: d,
      value: d,
    }));
  } else {
    return [];
  }
}

export function getLabelValueAdditionalAutocompleteData(props: WidgetProps) {
  const keys = getLabelValueKeyOptions(props);

  return {
    item: keys
      .map((d) => d.label)
      .reduce((prev: Record<string, string>, curr: unknown) => {
        prev[curr as string] = "";

        return prev;
      }, {}),
  };
}

export const defaultValueExpressionPrefix = `{{ ((options, serverSideFiltering) => ( `;

export const getDefaultValueExpressionSuffix = (widget: WidgetProps) =>
  `))(${widget.widgetName}.options, ${widget.widgetName}.serverSideFiltering) }}`;

export const getOptionLabelValueExpressionPrefix = (widget: WidgetProps) =>
  `{{${widget.widgetName}.sourceData.map((item) => (`;

export const optionLabelValueExpressionSuffix = `))}}`;
