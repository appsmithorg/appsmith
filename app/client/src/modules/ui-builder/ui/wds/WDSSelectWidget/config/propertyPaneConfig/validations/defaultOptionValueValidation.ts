import type { ValidationResponse } from "constants/WidgetValidation";
import type { LoDashStatic } from "lodash";
import type { WDSSelectWidgetProps } from "../../../widget/types";

export function defaultOptionValueValidation(
  value: unknown,
  props: WDSSelectWidgetProps,
  _: LoDashStatic,
): ValidationResponse {
  let isValid;
  let parsed;
  let message = { name: "", message: "" };
  /*
   * Function to check if the object has `label` and `value`
   */
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hasLabelValue = (obj: any) => {
    return (
      _.isPlainObject(value) &&
      obj.hasOwnProperty("label") &&
      obj.hasOwnProperty("value") &&
      _.isString(obj.label) &&
      (_.isString(obj.value) || _.isFinite(obj.value))
    );
  };

  /*
   * When value is "{label: 'green', value: 'green'}"
   */
  if (typeof value === "string") {
    try {
      const parsedValue = JSON.parse(value);

      if (_.isObject(parsedValue)) {
        value = parsedValue;
      }
    } catch (e) {}
  }

  if (_.isString(value) || _.isFinite(value) || hasLabelValue(value)) {
    /*
     * When value is "", "green", 444, {label: "green", value: "green"}
     */
    isValid = true;
    parsed = value;
  } else {
    isValid = false;
    parsed = undefined;
    message = {
      name: "TypeError",
      message:
        'value does not evaluate to type: string | number | { "label": "label1", "value": "value1" }',
    };
  }

  return {
    isValid,
    parsed,
    messages: [message],
  };
}
