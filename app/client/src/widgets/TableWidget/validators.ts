import { Validator } from "constants/WidgetValidation";

export const pageNoValidator: Validator = (value: any) => {
  if (!value || !Number.isSafeInteger(value) || value < 0)
    return { isValid: false, parsed: 1, message: "" };
  return { isValid: true, parsed: value };
};
