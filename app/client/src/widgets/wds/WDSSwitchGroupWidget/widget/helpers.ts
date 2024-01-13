import type { Validation } from "widgets/wds/WDSInputWidget/widget/types";

import type { SwitchGroupWidgetProps } from "./types";

export function validateInput(props: SwitchGroupWidgetProps): Validation {
  if (!props.isValid && props.isDirty) {
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
