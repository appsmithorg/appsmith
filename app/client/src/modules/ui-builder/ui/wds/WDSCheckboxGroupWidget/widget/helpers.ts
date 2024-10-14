import type { Validation } from "modules/ui-builder/ui/wds/WDSInputWidget/widget/types";

import type { CheckboxGroupWidgetProps } from "./types";

export function validateInput(props: CheckboxGroupWidgetProps): Validation {
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
