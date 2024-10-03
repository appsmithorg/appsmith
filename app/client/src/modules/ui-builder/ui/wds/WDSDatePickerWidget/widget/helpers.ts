import type { WDSDatePickerWidgetProps } from "./types";

export function validateInput(props: WDSDatePickerWidgetProps) {
  if (props.isValid === false) {
    return {
      validationStatus: "invalid",
      errorMessage: "Please select a valid date",
    };
  }

  return {
    validationStatus: "valid",
    errorMessage: "",
  };
}
