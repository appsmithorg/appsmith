import type { InputWidgetProps } from "../../../widget/types";

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function maxValueValidation(max: any, props: InputWidgetProps, _?: any) {
  const min = props.minNum;
  const value = max;
  max = Number(max);

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

  if (!Number.isFinite(max)) {
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

  if (min !== undefined && max <= min) {
    return {
      isValid: false,
      parsed: undefined,
      messages: [
        {
          name: "RangeError",
          message: "This value must be greater than min value",
        },
      ],
    };
  }

  return {
    isValid: true,
    parsed: Number(max),
    messages: [
      {
        name: "",
        message: "",
      },
    ],
  };
}
