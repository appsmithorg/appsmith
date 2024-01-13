import type { IconName } from "@blueprintjs/icons";

import type { InputComponentProps } from "../component/types";
import type { BaseInputWidgetProps } from "../../WDSBaseInputWidget";

export interface InputWidgetProps extends BaseInputWidgetProps {
  defaultText?: string | number;
  rawText: string;
  inputType: InputComponentProps["inputType"];

  // input type text props
  isSpellCheck?: boolean;
  maxChars?: number;

  // input type  number- props
  maxNum?: number;
  minNum?: number;

  // icon props
  iconName?: IconName;
  iconAlign?: "left" | "right";
}

export interface Validation {
  errorMessage?: string;
  validationStatus?: InputComponentProps["validationStatus"];
}
