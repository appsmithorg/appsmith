import type { Validation } from "modules/ui-builder/ui/wds/WDSInputWidget/widget/types";
import type { WDSComboBoxWidgetProps } from "./types";

export function validateInput(props: WDSComboBoxWidgetProps): Validation {
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
