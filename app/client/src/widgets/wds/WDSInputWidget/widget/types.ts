import type { InputComponentProps } from "../component/types";
import type { BaseInputWidgetProps } from "../../WDSBaseInputWidget";
import type { IconProps } from "@appsmith/wds";

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
  iconName?: IconProps["name"];
  iconAlign?: "left" | "right";
}

export interface Validation {
  errorMessage?: string;
  validationStatus?: InputComponentProps["validationStatus"];
}
