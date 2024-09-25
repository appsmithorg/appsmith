import type { ValidationResponse } from "constants/WidgetValidation";

export function defaultOptionValidation(
  value: unknown,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: any,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _: any,
): ValidationResponse {
  let { options } = props;

  //Checks if the value is not of object type in {{}}
  if (_.isObject(value)) {
    return {
      isValid: false,
      parsed: JSON.stringify(value, null, 2),
      messages: [
        {
          name: "TypeError",
          message: "This value does not evaluate to type: string or number",
        },
      ],
    };
  }

  //Checks if the value is not of boolean type in {{}}
  if (_.isBoolean(value)) {
    return {
      isValid: false,
      parsed: value,
      messages: [
        {
          name: "TypeError",
          message: "This value does not evaluate to type: string or number",
        },
      ],
    };
  }

  if (!Array.isArray(options) && typeof options === "string") {
    try {
      const parsedOptions = JSON.parse(options);

      if (Array.isArray(parsedOptions)) {
        options = parsedOptions;
      } else {
        options = [];
      }
    } catch (e) {
      options = [];
    }
  }

  // @ts-expect-error type mismatch
  const valueIndex = _.findIndex(options, (option) => option.value === value);

  if (valueIndex === -1) {
    return {
      isValid: false,
      parsed: value,
      messages: [
        {
          name: "ValidationError",
          message: `Default value is missing in options. Please update the value.`,
        },
      ],
    };
  }

  return {
    isValid: true,
    parsed: value,
  };
}
