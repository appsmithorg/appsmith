import type { Validation } from "widgets/wds/WDSInputWidget/widget/types";
import type { RadioGroupWidgetProps } from "./types";

export function validateInput(props: RadioGroupWidgetProps): Validation {
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
