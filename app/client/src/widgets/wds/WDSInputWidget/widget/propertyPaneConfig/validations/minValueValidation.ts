import type { InputWidgetProps } from "../../types";

export function minValueValidation(min: any, props: InputWidgetProps, _?: any) {
  const max = props.maxNum;
  const value = min;
  min = Number(min);

  if (_?.isNil(value) || value === "") {
    return {
      isValid: true,
      parsed: undefined,
      messages: [
        {
          name: "",
          message: "",
        },
      ],
    };
  }

  if (!Number.isFinite(min)) {
    return {
      isValid: false,
      parsed: undefined,
      messages: [
        {
          name: "TypeError",
          message: "This value must be number",
        },
      ],
    };
  }

  if (max !== undefined && min >= max) {
    return {
      isValid: false,
      parsed: undefined,
      messages: [
        {
          name: "RangeError",
          message: "This value must be lesser than max value",
        },
      ],
    };
  }

  return {
    isValid: true,
    parsed: Number(min),
    messages: [
      {
        name: "",
        message: "",
      },
    ],
  };
}
